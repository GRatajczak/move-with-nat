-- Add sets and reps columns to plan_exercises table
ALTER TABLE plan_exercises 
  ADD COLUMN IF NOT EXISTS sets INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reps INTEGER NOT NULL DEFAULT 0;

-- Add check constraints to ensure positive values
ALTER TABLE plan_exercises
  ADD CONSTRAINT plan_exercises_sets_positive CHECK (sets >= 1),
  ADD CONSTRAINT plan_exercises_reps_positive CHECK (reps >= 1);

