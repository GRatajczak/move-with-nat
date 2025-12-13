-- ============================================================================
-- Fix RLS Policies for Service Role Key Compatibility
-- ============================================================================
-- Problem: current_setting() without missing_ok parameter throws error when 
-- JWT claims are not present (e.g., when using Service Role Key)
-- 
-- Solution: Create a helper function that safely extracts JWT claims and
-- update all RLS policies to use this function
-- 
-- Affected tables: users, exercises, plans, plan_exercises, standard_reasons
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper Function: Safely Extract JWT Claims
-- ----------------------------------------------------------------------------

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_jwt_claim(text);

-- Create helper function to safely get JWT claim
-- This function returns NULL instead of throwing an error when claims are missing
CREATE OR REPLACE FUNCTION get_jwt_claim(claim_path text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>claim_path,
    NULL
  );
$$;

-- Create helper function to check if request is from Service Role Key
-- Service Role Key requests don't have JWT claims
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true) IS NULL;
$$;

-- ----------------------------------------------------------------------------
-- Update Users Table Policies
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS users_select_admin ON users;
DROP POLICY IF EXISTS users_select_self ON users;
DROP POLICY IF EXISTS users_update_self ON users;

-- Recreate users policies with safe claim extraction
CREATE POLICY users_select_admin ON users 
  FOR SELECT TO public 
  USING (
    -- Allow Service Role Key or admin users
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

CREATE POLICY users_select_self ON users 
  FOR SELECT TO public 
  USING (
    -- Allow users to see themselves
    id::text = get_jwt_claim('sub')
  );

CREATE POLICY users_select_trainer_clients ON users
  FOR SELECT TO public
  USING (
    -- Allow trainers to see their clients
    get_jwt_claim('role') = 'trainer' 
    AND trainer_id::text = get_jwt_claim('sub')
  );

CREATE POLICY users_update_self ON users 
  FOR UPDATE TO public 
  USING (
    -- Allow users to update themselves or Service Role Key
    is_service_role() OR id::text = get_jwt_claim('sub')
  );

CREATE POLICY users_insert_service_role ON users
  FOR INSERT TO public
  WITH CHECK (
    -- Only Service Role Key can insert users (via admin API)
    is_service_role()
  );

CREATE POLICY users_delete_service_role ON users
  FOR DELETE TO public
  USING (
    -- Only Service Role Key can delete users (via admin API)
    is_service_role()
  );

-- ----------------------------------------------------------------------------
-- Update Exercises Table Policies
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS exercises_select ON exercises;
DROP POLICY IF EXISTS exercises_insert_admin ON exercises;
DROP POLICY IF EXISTS exercises_update_admin ON exercises;
DROP POLICY IF EXISTS exercises_delete_admin ON exercises;

-- Recreate exercises policies with safe claim extraction
CREATE POLICY exercises_select ON exercises 
  FOR SELECT TO public 
  USING (
    is_service_role() OR get_jwt_claim('role') IN ('admin', 'trainer', 'client')
  );

CREATE POLICY exercises_insert_admin ON exercises
  FOR INSERT TO public
  WITH CHECK (
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

CREATE POLICY exercises_update_admin ON exercises
  FOR UPDATE TO public
  USING (
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

CREATE POLICY exercises_delete_admin ON exercises
  FOR DELETE TO public
  USING (
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

-- ----------------------------------------------------------------------------
-- Update Plans Table Policies
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS plans_select ON plans;
DROP POLICY IF EXISTS plans_insert_trainer ON plans;
DROP POLICY IF EXISTS plans_update_trainer ON plans;
DROP POLICY IF EXISTS plans_delete_trainer ON plans;

-- Recreate plans policies with safe claim extraction
CREATE POLICY plans_select ON plans
  FOR SELECT TO public
  USING (
    is_service_role()
    OR get_jwt_claim('role') = 'admin'
    OR (get_jwt_claim('role') = 'trainer' AND trainer_id::text = get_jwt_claim('sub'))
    OR (get_jwt_claim('role') = 'client' AND client_id::text = get_jwt_claim('sub'))
  );

CREATE POLICY plans_insert_trainer ON plans
  FOR INSERT TO public
  WITH CHECK (
    is_service_role()
    OR (get_jwt_claim('role') = 'trainer' AND trainer_id::text = get_jwt_claim('sub'))
  );

CREATE POLICY plans_update_trainer ON plans
  FOR UPDATE TO public
  USING (
    is_service_role()
    OR (get_jwt_claim('role') = 'trainer' AND trainer_id::text = get_jwt_claim('sub'))
  );

CREATE POLICY plans_delete_trainer ON plans
  FOR DELETE TO public
  USING (
    is_service_role()
    OR (get_jwt_claim('role') = 'trainer' AND trainer_id::text = get_jwt_claim('sub'))
  );

-- ----------------------------------------------------------------------------
-- Update Plan Exercises Table Policies
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS plan_exercises_select ON plan_exercises;
DROP POLICY IF EXISTS plan_exercises_insert ON plan_exercises;
DROP POLICY IF EXISTS plan_exercises_update ON plan_exercises;
DROP POLICY IF EXISTS plan_exercises_delete ON plan_exercises;

-- Recreate plan_exercises policies with safe claim extraction
CREATE POLICY plan_exercises_select ON plan_exercises
  FOR SELECT TO public
  USING (
    is_service_role()
    OR EXISTS (
      SELECT 1 FROM plans p 
      WHERE p.id = plan_exercises.plan_id 
      AND (
        get_jwt_claim('role') = 'admin'
        OR (get_jwt_claim('role') = 'trainer' AND p.trainer_id::text = get_jwt_claim('sub'))
        OR (get_jwt_claim('role') = 'client' AND p.client_id::text = get_jwt_claim('sub'))
      )
    )
  );

CREATE POLICY plan_exercises_insert ON plan_exercises
  FOR INSERT TO public
  WITH CHECK (
    is_service_role()
    OR (
      get_jwt_claim('role') = 'trainer' 
      AND plan_id IN (
        SELECT id FROM plans WHERE trainer_id::text = get_jwt_claim('sub')
      )
    )
  );

CREATE POLICY plan_exercises_update ON plan_exercises
  FOR UPDATE TO public
  USING (
    is_service_role()
    OR EXISTS (
      SELECT 1 FROM plans p 
      WHERE p.id = plan_exercises.plan_id 
      AND get_jwt_claim('role') = 'trainer' 
      AND p.trainer_id::text = get_jwt_claim('sub')
    )
  );

CREATE POLICY plan_exercises_delete ON plan_exercises
  FOR DELETE TO public
  USING (
    is_service_role()
    OR EXISTS (
      SELECT 1 FROM plans p 
      WHERE p.id = plan_exercises.plan_id 
      AND get_jwt_claim('role') = 'trainer' 
      AND p.trainer_id::text = get_jwt_claim('sub')
    )
  );

-- ----------------------------------------------------------------------------
-- Update Standard Reasons Table Policies (if they exist)
-- ----------------------------------------------------------------------------

-- Standard reasons table should be readable by all authenticated users
-- and modifiable only by admins

-- Drop existing policies if they exist
DROP POLICY IF EXISTS standard_reasons_select ON standard_reasons;
DROP POLICY IF EXISTS standard_reasons_insert_admin ON standard_reasons;
DROP POLICY IF EXISTS standard_reasons_update_admin ON standard_reasons;
DROP POLICY IF EXISTS standard_reasons_delete_admin ON standard_reasons;

-- Enable RLS if not already enabled
ALTER TABLE standard_reasons ENABLE ROW LEVEL SECURITY;

-- Create policies for standard_reasons
CREATE POLICY standard_reasons_select ON standard_reasons
  FOR SELECT TO public
  USING (
    is_service_role() OR get_jwt_claim('role') IN ('admin', 'trainer', 'client')
  );

CREATE POLICY standard_reasons_insert_admin ON standard_reasons
  FOR INSERT TO public
  WITH CHECK (
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

CREATE POLICY standard_reasons_update_admin ON standard_reasons
  FOR UPDATE TO public
  USING (
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

CREATE POLICY standard_reasons_delete_admin ON standard_reasons
  FOR DELETE TO public
  USING (
    is_service_role() OR get_jwt_claim('role') = 'admin'
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All RLS policies have been updated to:
-- 1. Use the safe get_jwt_claim() function that doesn't throw errors
-- 2. Use the is_service_role() function to detect Service Role Key requests
-- 3. Allow Service Role Key full access to all tables (bypassing RLS)
-- 
-- This ensures compatibility with:
-- - User sessions with JWT tokens (normal authentication)
-- - Service Role Key requests (admin operations, no JWT)
-- ============================================================================
