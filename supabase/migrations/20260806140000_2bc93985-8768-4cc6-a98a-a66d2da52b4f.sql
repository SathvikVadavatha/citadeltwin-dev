-- Persist the Storage public URL of the uploaded blueprint on client_portal_projects.
-- Needed so Phase 3 analysis (room analysis via analyzeFromUrl) can be retried without
-- requiring the user to re-select the original file.
ALTER TABLE public.client_portal_projects ADD COLUMN IF NOT EXISTS blueprint_public_url TEXT;
