-- Security fixes for property_boundaries table to protect property owner information

-- 1. Drop the existing public read policy that exposes all data
DROP POLICY IF EXISTS "Allow read access to property_boundaries" ON public.property_boundaries;

-- 2. Create a secure view that masks sensitive property owner information
-- This view will be used for general public/authenticated users who need property data
-- but should not see owner names and addresses
CREATE OR REPLACE VIEW public.property_boundaries_public AS
SELECT 
  id,
  parcel_id,
  -- Mask property address - show only city, state
  concat(city, ', ', state) as location_display,
  -- Do not expose owner_name in public view
  boundary_geometry,
  area_sqft,
  zoning_designation,
  flood_zone,
  soil_type,
  environmental_constraints,
  city,
  state,
  county,
  last_surveyed,
  created_at,
  updated_at
FROM public.property_boundaries;

-- 3. Grant SELECT access to the public view for authenticated users
GRANT SELECT ON public.property_boundaries_public TO authenticated;

-- 4. Create RLS policies for property_boundaries table

-- Policy: Admins can view all property data including owner information
CREATE POLICY "Admins can view all property boundaries"
ON public.property_boundaries
FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- Policy: Users can view properties they own or are associated with
-- This assumes there's a relationship between users and properties they own
CREATE POLICY "Users can view their own properties"
ON public.property_boundaries
FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin OR if there's a user_properties link (for future implementation)
  public.is_user_admin(auth.uid())
);

-- Policy: Admins can insert property boundaries
CREATE POLICY "Admins can insert property boundaries"
ON public.property_boundaries
FOR INSERT
TO authenticated
WITH CHECK (public.is_user_admin(auth.uid()));

-- Policy: Admins can update property boundaries
CREATE POLICY "Admins can update property boundaries"
ON public.property_boundaries
FOR UPDATE
TO authenticated
USING (public.is_user_admin(auth.uid()))
WITH CHECK (public.is_user_admin(auth.uid()));

-- Policy: Admins can delete property boundaries
CREATE POLICY "Admins can delete property boundaries"
ON public.property_boundaries
FOR DELETE
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- 5. Create an audit trigger for property boundary access
-- This helps track who is accessing sensitive property owner data
CREATE OR REPLACE FUNCTION public.audit_property_boundary_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when someone accesses property boundary data
  IF TG_OP = 'SELECT' THEN
    -- Note: SELECT triggers are not directly supported in PostgreSQL
    -- This is a placeholder for future implementation via application-level logging
    RETURN NEW;
  END IF;
  
  -- For INSERT/UPDATE/DELETE operations, log the action
  PERFORM public.log_audit_event(
    CASE TG_OP
      WHEN 'INSERT' THEN 'CREATE'
      WHEN 'UPDATE' THEN 'UPDATE'
      WHEN 'DELETE' THEN 'DELETE'
    END,
    'property_boundaries',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'parcel_id', COALESCE(NEW.parcel_id, OLD.parcel_id),
      'timestamp', now()
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging on property boundaries
DROP TRIGGER IF EXISTS audit_property_boundary_changes ON public.property_boundaries;
CREATE TRIGGER audit_property_boundary_changes
AFTER INSERT OR UPDATE OR DELETE ON public.property_boundaries
FOR EACH ROW
EXECUTE FUNCTION public.audit_property_boundary_access();

-- 6. Add documentation comments
COMMENT ON TABLE public.property_boundaries IS 'Contains sensitive property boundary data including owner information. Access restricted to admins only. Use property_boundaries_public view for non-sensitive data.';
COMMENT ON VIEW public.property_boundaries_public IS 'Public-safe view of property boundaries with owner information masked. Use this view for general property queries.';
COMMENT ON FUNCTION public.audit_property_boundary_access IS 'Audits all changes to property boundary data for security and compliance tracking.';

-- 7. Create a helper function to check if a user can access specific property details
CREATE OR REPLACE FUNCTION public.can_access_property_details(
  property_id uuid,
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to access any property
  IF public.is_user_admin(user_id) THEN
    RETURN true;
  END IF;
  
  -- In the future, check if user owns or is associated with the property
  -- For now, only admins can access full property details
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_access_property_details IS 'Checks if a user has permission to access full property details including owner information.';
