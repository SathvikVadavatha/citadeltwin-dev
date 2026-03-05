-- Confirm unconfirmed users so they can log in
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  updated_at = now()
WHERE email IN ('test@citadel.com', 'johnd@cdreams.com')
  AND email_confirmed_at IS NULL;