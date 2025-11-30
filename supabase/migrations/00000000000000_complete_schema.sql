-- ============================================================================
-- COMPLETE DATABASE SCHEMA MIGRATION
-- ============================================================================
-- This file combines all individual migrations into one cohesive schema.
-- It includes all tables, indexes, RLS policies, and constraints.
-- 
-- Original migrations consolidated:
-- - 20251102120000_create_initial_schema.sql
-- - 20251112000000_add_exercises_rls_policies.sql
-- - 20251115000000_add_exercises_list_indexes.sql
-- - 20251116000000_add_trainer_id_to_users.sql
-- - 20251116100000_add_user_profile_fields.sql
-- - 20251123100000_remove_auth_user_sync_trigger.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable pg_trgm extension for fuzzy/trigram search support
-- This allows for more flexible search capabilities beyond simple ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

-- Create user role enum
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'client');

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- Users table (extends auth.users)
-- This table stores additional profile data for authenticated users
CREATE TABLE users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  trainer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  vimeo_token TEXT NOT NULL,
  tempo TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Standard reasons for incomplete exercises
CREATE TABLE standard_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plan exercises join table
CREATE TABLE plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  exercise_order INTEGER NOT NULL,
  tempo TEXT NOT NULL,
  default_weight NUMERIC,
  is_completed BOOLEAN NOT NULL,
  reason_id UUID REFERENCES standard_reasons(id),
  custom_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, exercise_id)
);

-- ----------------------------------------------------------------------------
-- CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Check constraint: only clients can have a trainer_id
ALTER TABLE users
ADD CONSTRAINT check_trainer_id_only_for_clients
CHECK (
  (role = 'client' AND trainer_id IS NOT NULL) OR
  (role != 'client' AND trainer_id IS NULL)
);

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------

COMMENT ON COLUMN users.first_name IS 'User''s first name';
COMMENT ON COLUMN users.last_name IS 'User''s last name';
COMMENT ON COLUMN users.trainer_id IS 'For clients only: references the trainer (user) they are assigned to';

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------

-- Users table indexes
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_trainer_id ON users(trainer_id);

-- Exercises table indexes
CREATE INDEX idx_exercises_created_at ON exercises(created_at);
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_is_hidden ON exercises(is_hidden);

-- Composite index for the most common query pattern: visible exercises ordered by creation date
-- This partial index only includes visible exercises, making it highly efficient
CREATE INDEX idx_exercises_visible_created_at 
  ON exercises(created_at DESC)
  WHERE is_hidden = false;

-- Trigram index for better search performance with partial matches
-- Useful for autocomplete and fuzzy search scenarios
CREATE INDEX idx_exercises_name_trgm
  ON exercises USING gin(name gin_trgm_ops);

-- Plans table indexes
CREATE INDEX idx_plans_trainer_id ON plans(trainer_id);
CREATE INDEX idx_plans_client_id ON plans(client_id);
CREATE INDEX idx_plans_created_at ON plans(created_at);

-- Plan exercises table indexes
CREATE INDEX idx_plan_exercises_plan_id ON plan_exercises(plan_id);
CREATE INDEX idx_plan_exercises_exercise_id ON plan_exercises(exercise_id);
CREATE INDEX idx_plan_exercises_exercise_order ON plan_exercises(exercise_order);
CREATE INDEX idx_plan_exercises_created_at ON plan_exercises(created_at);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_admin ON users 
  FOR SELECT TO public 
  USING (current_setting('request.jwt.claims.role') = 'admin');

CREATE POLICY users_select_self ON users 
  FOR SELECT TO public 
  USING (id = current_setting('request.jwt.claims.sub')::uuid);

CREATE POLICY users_update_self ON users 
  FOR UPDATE TO public 
  USING (id = current_setting('request.jwt.claims.sub')::uuid);

-- Exercises table policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercises_select ON exercises 
  FOR SELECT TO public 
  USING (
    current_setting('request.jwt.claims.role') IN ('admin', 'trainer', 'client')
  );

CREATE POLICY exercises_insert_admin ON exercises
  FOR INSERT TO public
  WITH CHECK (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

CREATE POLICY exercises_update_admin ON exercises
  FOR UPDATE TO public
  USING (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

CREATE POLICY exercises_delete_admin ON exercises
  FOR DELETE TO public
  USING (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Plans table policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_select ON plans 
  FOR SELECT TO public 
  USING (
    (current_setting('request.jwt.claims.role') = 'admin') OR
    (current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid) OR
    (current_setting('request.jwt.claims.role') = 'client' AND client_id = current_setting('request.jwt.claims.sub')::uuid)
  );

CREATE POLICY plans_insert_trainer ON plans 
  FOR INSERT TO public 
  WITH CHECK (
    current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid
  );

CREATE POLICY plans_update_trainer ON plans 
  FOR UPDATE TO public 
  USING (
    current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid
  );

CREATE POLICY plans_delete_trainer ON plans 
  FOR DELETE TO public 
  USING (
    current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid
  );

-- Plan exercises table policies
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_exercises_select ON plan_exercises 
  FOR SELECT TO public 
  USING (
    EXISTS (
      SELECT 1 FROM plans p WHERE p.id = plan_exercises.plan_id AND (
        (current_setting('request.jwt.claims.role') = 'admin') OR
        (current_setting('request.jwt.claims.role') = 'trainer' AND p.trainer_id = current_setting('request.jwt.claims.sub')::uuid) OR
        (current_setting('request.jwt.claims.role') = 'client' AND p.client_id = current_setting('request.jwt.claims.sub')::uuid)
      )
    )
  );

CREATE POLICY plan_exercises_insert ON plan_exercises 
  FOR INSERT TO public 
  WITH CHECK (
    current_setting('request.jwt.claims.role') = 'trainer' AND plan_id IN (
      SELECT id FROM plans WHERE trainer_id = current_setting('request.jwt.claims.sub')::uuid
    )
  );

CREATE POLICY plan_exercises_update ON plan_exercises 
  FOR UPDATE TO public 
  USING (
    current_setting('request.jwt.claims.role') = 'trainer' AND plan_id IN (
      SELECT id FROM plans WHERE trainer_id = current_setting('request.jwt.claims.sub')::uuid
    )
  );

CREATE POLICY plan_exercises_delete ON plan_exercises 
  FOR DELETE TO public 
  USING (
    current_setting('request.jwt.claims.role') = 'trainer' AND plan_id IN (
      SELECT id FROM plans WHERE trainer_id = current_setting('request.jwt.claims.sub')::uuid
    )
  );

-- Standard reasons table policies
ALTER TABLE standard_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY reasons_select ON standard_reasons 
  FOR SELECT TO public 
  USING (
    current_setting('request.jwt.claims.role') IN ('admin', 'trainer', 'client')
  );

-- ----------------------------------------------------------------------------
-- CLEANUP
-- ----------------------------------------------------------------------------

-- Remove the automatic auth.users sync trigger if it exists
-- This trigger was causing issues because it tried to create profiles with default values
-- that violated database constraints (e.g., clients without trainer_id).
-- Our application flow handles creating profiles correctly via users.service.ts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

