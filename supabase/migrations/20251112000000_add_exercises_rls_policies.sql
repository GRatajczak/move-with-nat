-- Add missing RLS policies for exercises table
-- This migration adds INSERT, UPDATE, and DELETE policies for the exercises table
-- These policies require admin role for all modification operations

-- Policy: Allow admins to insert exercises
CREATE POLICY "exercises_insert_admin" ON exercises
  FOR INSERT TO public
  WITH CHECK (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Policy: Allow admins to update exercises
CREATE POLICY "exercises_update_admin" ON exercises
  FOR UPDATE TO public
  USING (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Policy: Allow admins to delete exercises
CREATE POLICY "exercises_delete_admin" ON exercises
  FOR DELETE TO public
  USING (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Note: SELECT policy already exists from initial migration
-- This migration only adds the missing INSERT, UPDATE, and DELETE policies

