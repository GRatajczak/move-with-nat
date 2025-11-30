-- Add default_weight to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_weight NUMERIC;

-- Make tempo nullable in exercises since it is optional in the form
ALTER TABLE exercises ALTER COLUMN tempo DROP NOT NULL;

