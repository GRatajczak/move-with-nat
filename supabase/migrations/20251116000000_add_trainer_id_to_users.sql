-- Add trainer_id column to users table
-- This establishes the relationship between clients and their trainers

ALTER TABLE users
ADD COLUMN trainer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance when querying clients by trainer
CREATE INDEX idx_users_trainer_id ON users(trainer_id);

-- Add check constraint: only clients can have a trainer_id
ALTER TABLE users
ADD CONSTRAINT check_trainer_id_only_for_clients
CHECK (
  (role = 'client' AND trainer_id IS NOT NULL) OR
  (role != 'client' AND trainer_id IS NULL)
);

COMMENT ON COLUMN users.trainer_id IS 'For clients only: references the trainer (user) they are assigned to';

