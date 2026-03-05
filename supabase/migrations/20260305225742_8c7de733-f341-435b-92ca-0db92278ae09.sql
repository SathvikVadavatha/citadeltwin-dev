-- Deactivate the 4 broken scheduled reports that have empty recipients
-- and next_run_at far in the past (causing infinite error loops)
UPDATE public.scheduled_reports
SET is_active = false,
    next_run_at = now() + interval '100 years'
WHERE id IN (
  '7a3ed937-9433-483f-9e00-344e27d56ced',
  '296cf3cd-a917-4190-b09e-ed0870670f29',
  '553c826e-7ff4-4d0f-8810-424315eddea7',
  'c7de46bc-b5d4-4a0b-ace5-07983298b506'
);