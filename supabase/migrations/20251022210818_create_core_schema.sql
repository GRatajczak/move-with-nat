-- migration: create core schema for users, exercises, plans, and plan_exercises
-- purpose: implement mvp database schema with rls and indexes (no audit log)
-- affected: types (user_role), tables (users, exercises, plans, plan_exercises)
-- notes:
--   - row level security (rls) is enabled on all tables.
--   - policies are defined per supabase role (anon, authenticated) and per action (select, insert, update, delete).
--   - destructive operations are not included; future drops must be evaluated carefully.

create extension if not exists pgcrypto;

-- enum for user roles
create type public.user_role as enum ('administrator', 'trener', 'podopieczny');

-- generic trigger to maintain updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- users table: application profile and authorization role mapping
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  role public.user_role not null default 'podopieczny',
  trainer_id uuid references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'application users with roles: administrator, trener, podopieczny. podopieczny may reference their trener via trainer_id.';
comment on column public.users.trainer_id is 'for podopieczny, references their trener; restricted on delete to prevent cascading user removal.';

create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- rls: always enable, then define granular policies
alter table public.users enable row level security;

-- anon: deny all via explicit false policies for clarity
create policy users_select_anon_deny on public.users for select to anon using (false);
create policy users_insert_anon_deny on public.users for insert to anon with check (false);
create policy users_update_anon_deny on public.users for update to anon using (false) with check (false);
create policy users_delete_anon_deny on public.users for delete to anon using (false);

-- authenticated: self-serve access to own row only; service_role bypasses rls automatically
create policy users_select_self on public.users for select to authenticated using (id = auth.uid());
create policy users_insert_self on public.users for insert to authenticated with check (id = auth.uid());
create policy users_update_self on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy users_delete_self on public.users for delete to authenticated using (id = auth.uid());

-- helper functions that rely on users table; keep them stable and simple
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'administrator'
  );
$$;

create or replace function public.current_user_is_trainer()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'trener'
  );
$$;

create or replace function public.current_user_is_trainee()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'podopieczny'
  );
$$;

create or replace function public.current_user_trainer_id()
returns uuid
language sql
stable
as $$
  select u.trainer_id from public.users u where u.id = auth.uid()
$$;

-- exercises table: library of exercises with vimeo token reference
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  vimeo_token text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exercises is 'exercise library entries with vimeo token; created_by references author user when available.';

create trigger trg_exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

-- indexes for exercises
create index if not exists idx_exercises_name on public.exercises using btree (name);

-- rls for exercises
alter table public.exercises enable row level security;

-- anon: deny all access
create policy exercises_select_anon_deny on public.exercises for select to anon using (false);
create policy exercises_insert_anon_deny on public.exercises for insert to anon with check (false);
create policy exercises_update_anon_deny on public.exercises for update to anon using (false) with check (false);
create policy exercises_delete_anon_deny on public.exercises for delete to anon using (false);

-- authenticated: everyone can read exercises
create policy exercises_select_all_auth on public.exercises for select to authenticated using (true);

-- authenticated: only trainer or admin may create/update/delete; creators manage their own entries
create policy exercises_insert_by_trainer_admin on public.exercises for insert to authenticated
  with check (
    public.current_user_is_admin()
    or (public.current_user_is_trainer() and (created_by is null or created_by = auth.uid()))
  );

create policy exercises_update_by_owner_trainer_admin on public.exercises for update to authenticated
  using (
    public.current_user_is_admin()
    or (public.current_user_is_trainer() and (created_by is null or created_by = auth.uid()))
  )
  with check (
    public.current_user_is_admin()
    or (public.current_user_is_trainer() and (created_by is null or created_by = auth.uid()))
  );

create policy exercises_delete_by_owner_trainer_admin on public.exercises for delete to authenticated
  using (
    public.current_user_is_admin()
    or (public.current_user_is_trainer() and (created_by is null or created_by = auth.uid()))
  );

-- plans table: workout plans owned by a trainer
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plans is 'training plans owned by trainers; visibility flag controls trainee access.';

create trigger trg_plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

-- indexes for plans
create index if not exists idx_plans_trainer_id on public.plans using btree (trainer_id);
create index if not exists idx_plans_created_at on public.plans using btree (created_at);
create index if not exists idx_plans_trainer_created_at on public.plans using btree (trainer_id, created_at);
create index if not exists idx_plans_is_visible on public.plans using btree (is_visible);

-- rls for plans
alter table public.plans enable row level security;

-- anon: deny all
create policy plans_select_anon_deny on public.plans for select to anon using (false);
create policy plans_insert_anon_deny on public.plans for insert to anon with check (false);
create policy plans_update_anon_deny on public.plans for update to anon using (false) with check (false);
create policy plans_delete_anon_deny on public.plans for delete to anon using (false);

-- authenticated (trainer): full crud on own plans
create policy plans_select_by_trainer on public.plans for select to authenticated using (trainer_id = auth.uid() and public.current_user_is_trainer());
create policy plans_insert_by_trainer on public.plans for insert to authenticated with check (trainer_id = auth.uid() and public.current_user_is_trainer());
create policy plans_update_by_trainer on public.plans for update to authenticated using (trainer_id = auth.uid() and public.current_user_is_trainer()) with check (trainer_id = auth.uid() and public.current_user_is_trainer());
create policy plans_delete_by_trainer on public.plans for delete to authenticated using (trainer_id = auth.uid() and public.current_user_is_trainer());

-- authenticated (trainee): read-only access to visible plans of their trainer
create policy plans_select_by_trainee_visible on public.plans for select to authenticated
  using (
    public.current_user_is_trainee()
    and exists (
      select 1 from public.users u where u.id = auth.uid() and u.trainer_id = public.plans.trainer_id
    )
    and public.plans.is_visible is true
  );

-- plan_exercises: join table between plans and exercises with ordering and repetition details
create table if not exists public.plan_exercises (
  plan_id uuid not null references public.plans(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sort_order int not null check (sort_order > 0),
  sets int not null check (sets > 0),
  reps int not null check (reps > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, sort_order),
  unique (plan_id, exercise_id)
);

comment on table public.plan_exercises is 'association of exercises within a plan including ordering and repetition details.';

create trigger trg_plan_exercises_set_updated_at
before update on public.plan_exercises
for each row execute function public.set_updated_at();

-- helpful index for listing plan contents in order
create index if not exists idx_plan_exercises_plan_order on public.plan_exercises using btree (plan_id, sort_order);

-- rls for plan_exercises
alter table public.plan_exercises enable row level security;

-- anon: deny all
create policy plan_exercises_select_anon_deny on public.plan_exercises for select to anon using (false);
create policy plan_exercises_insert_anon_deny on public.plan_exercises for insert to anon with check (false);
create policy plan_exercises_update_anon_deny on public.plan_exercises for update to anon using (false) with check (false);
create policy plan_exercises_delete_anon_deny on public.plan_exercises for delete to anon using (false);

-- authenticated (trainer): manage rows for own plans
create policy plan_exercises_select_by_trainer on public.plan_exercises for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.trainer_id = auth.uid() and public.current_user_is_trainer()));
create policy plan_exercises_insert_by_trainer on public.plan_exercises for insert to authenticated
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.trainer_id = auth.uid() and public.current_user_is_trainer()));
create policy plan_exercises_update_by_trainer on public.plan_exercises for update to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.trainer_id = auth.uid() and public.current_user_is_trainer()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.trainer_id = auth.uid() and public.current_user_is_trainer()));
create policy plan_exercises_delete_by_trainer on public.plan_exercises for delete to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.trainer_id = auth.uid() and public.current_user_is_trainer()));

-- authenticated (trainee): read-only access for visible plans of their trainer
create policy plan_exercises_select_by_trainee_visible on public.plan_exercises for select to authenticated
  using (
    public.current_user_is_trainee()
    and exists (
      select 1
      from public.plans p
      join public.users u on u.id = auth.uid()
      where p.id = plan_id and p.trainer_id = u.trainer_id and p.is_visible is true
    )
  );

