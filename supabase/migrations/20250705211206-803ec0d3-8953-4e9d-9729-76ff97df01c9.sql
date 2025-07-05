-- Fix the trigger_audit_log function to avoid jsonb - jsonb operator error
CREATE OR REPLACE FUNCTION public.trigger_audit_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Log creation events
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('operation', 'insert')
    );
    RETURN NEW;
  END IF;
  
  -- Log update events
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'operation', 'update', 
        'new_data', to_jsonb(NEW),
        'old_data', to_jsonb(OLD)
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log deletion events
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      jsonb_build_object('operation', 'delete', 'deleted_data', to_jsonb(OLD))
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;