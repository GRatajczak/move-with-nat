-- migration: update users rls and add exercises.tempo
-- purpose: align rls with db-plan (trainee read-only on own user; admin manages users) and extend exercises with optional tempo field
-- affected:
--   - table public.users: rls policies adjusted (drop self-modification; add admin-only modify; keep self-select)
--   - table public.exercises: add column tempo text null with documentation
-- notes:
--   - all sql is written in lowercase for consistency.
--   - rls remains enabled on all tables. policies are defined per role (anon, authenticated) and per action.
--   - destructive operations (drops) are limited to policy objects only; no table/column drops are performed.

begin;

-- =============================================
-- 1) exercises: add optional tempo column
-- =============================================
-- rationale: db-plan requires storing tempo instructions per exercise. the field is optional to avoid
-- forcing legacy rows to backfill. no default is set to keep semantics explicit.
alter table public.exercises
  add column if not exists tempo text;

comment on column public.exercises.tempo is 'optional textual tempo notation for the exercise, e.g., 3-1-3-0';

-- =============================================
-- 2) users rls: tighten according to db-plan
-- =============================================
-- current situation (from core schema): authenticated users could insert/update/delete their own row.
-- change: trainees must be read-only on their user row; only admins can insert/update/delete any user.
-- we keep anon explicit deny policies as-is (defined in core migration).

-- drop prior self-modification policies to avoid granting update/delete to non-admin users
drop policy if exists users_insert_self on public.users;
drop policy if exists users_update_self on public.users;
drop policy if exists users_delete_self on public.users;

-- ensure rls is enabled (no-op if already enabled)
alter table public.users enable row level security;

-- keep existing self-select policy (allows any authenticated user to read their own row)
-- create an admin-wide select policy to allow administrators to read all users
drop policy if exists users_select_admin_all on public.users;
create policy users_select_admin_all on public.users
  for select
  to authenticated
  using (public.current_user_is_admin());

-- admin-only modification policies
drop policy if exists users_insert_admin_only on public.users;
create policy users_insert_admin_only on public.users
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists users_update_admin_only on public.users;
create policy users_update_admin_only on public.users
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists users_delete_admin_only on public.users;
create policy users_delete_admin_only on public.users
  for delete
  to authenticated
  using (public.current_user_is_admin());

-- note: anon policies remain explicit deny from core migration:
--   users_select_anon_deny / users_insert_anon_deny / users_update_anon_deny / users_delete_anon_deny
-- this migration purposefully does not alter anon access.

commit;


