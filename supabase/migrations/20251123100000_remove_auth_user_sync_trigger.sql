-- Remove the automatic auth.users sync trigger
-- This trigger was causing issues because it tried to create profiles with default values
-- that violated database constraints (e.g., clients without trainer_id).
-- 
-- Our application flow already handles creating profiles correctly via users.service.ts
-- when creating users through the admin API.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

