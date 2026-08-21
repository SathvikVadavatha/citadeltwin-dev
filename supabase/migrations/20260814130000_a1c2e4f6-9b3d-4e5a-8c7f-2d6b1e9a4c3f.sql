-- Add error_message to generated_3d_models so a failed pipeline run can surface
-- the real reason on revisit, instead of overloading model_description with it.
-- generation_status already allows 'failed' (see 20250613231022-...sql); this
-- just gives 'failed' rows somewhere proper to put the error text.
--
-- Apply by hand via the Supabase SQL Editor — do not run `supabase db push`
-- on this project yet (see supabase/migrations/README.md).

ALTER TABLE public.generated_3d_models
ADD COLUMN IF NOT EXISTS error_message TEXT;
