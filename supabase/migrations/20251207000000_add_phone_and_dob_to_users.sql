-- Add phone and date_of_birth fields to users table
-- Migration: 20251207000000_add_phone_and_dob_to_users

-- Add phone column (nullable, with regex validation for international phone numbers)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add date_of_birth column (nullable, must be in the past)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add check constraint to ensure date_of_birth is not in the future
ALTER TABLE public.users
ADD CONSTRAINT check_date_of_birth_not_future 
CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE);

-- Add comment for documentation
COMMENT ON COLUMN public.users.phone IS 'User phone number in international format (optional)';
COMMENT ON COLUMN public.users.date_of_birth IS 'User date of birth (optional, must not be in the future)';
