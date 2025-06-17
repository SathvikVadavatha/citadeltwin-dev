
-- First, create the roles table
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert the standard roles
INSERT INTO public.roles (role_name) VALUES 
  ('admin'),
  ('engineer'), 
  ('planner'),
  ('viewer'),
  ('inactive');

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES public.roles(id),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles to have a default role (engineer)
UPDATE public.profiles 
SET role_id = (SELECT id FROM public.roles WHERE role_name = 'engineer')
WHERE role_id IS NULL;

-- Remove the old role column if it exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Remove the company column and replace with organization
UPDATE public.profiles SET organization = company WHERE company IS NOT NULL;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company;
