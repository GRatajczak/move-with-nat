-- Add first_name and last_name columns to users table
-- These fields are required for creating new users via the admin API

ALTER TABLE users
ADD COLUMN first_name VARCHAR(50),
ADD COLUMN last_name VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN users.first_name IS 'User''s first name';
COMMENT ON COLUMN users.last_name IS 'User''s last name';

-- Update the trainer_id constraint to use ON DELETE RESTRICT instead of SET NULL
-- This prevents accidental deletion of trainers who have assigned clients
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_trainer_id_fkey;

ALTER TABLE users
ADD CONSTRAINT users_trainer_id_fkey 
  FOREIGN KEY (trainer_id) 
  REFERENCES users(id) 
  ON DELETE RESTRICT;

-- Update check constraint to ensure only clients have trainer_id
-- and that first_name/last_name are provided for active users
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_trainer_id_only_for_clients;

ALTER TABLE users
ADD CONSTRAINT check_trainer_id_only_for_clients
CHECK (
  (role = 'client' AND trainer_id IS NOT NULL) OR
  (role != 'client' AND trainer_id IS NULL)
);

