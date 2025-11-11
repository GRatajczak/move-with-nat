-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user role enum
drop type if exists user_role;
CREATE TYPE user_role AS ENUM ('admin','trainer','client');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
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
  default_weight NUMERIC,
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

-- Indexes for performance
CREATE INDEX ON users (created_at);
CREATE INDEX ON exercises (created_at);
CREATE INDEX ON plans (trainer_id);
CREATE INDEX ON plans (client_id);
CREATE INDEX ON plans (created_at);
CREATE INDEX ON plan_exercises (plan_id);
CREATE INDEX ON plan_exercises (exercise_id);
CREATE INDEX ON plan_exercises (exercise_order);
CREATE INDEX ON plan_exercises (created_at);

-- Enable Row Level Security and policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select_admin ON users FOR SELECT TO public USING (current_setting('request.jwt.claims.role') = 'admin');
CREATE POLICY users_select_self ON users FOR SELECT TO public USING (id = current_setting('request.jwt.claims.sub')::uuid);
CREATE POLICY users_update_self ON users FOR UPDATE TO public USING (id = current_setting('request.jwt.claims.sub')::uuid);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_select ON plans FOR SELECT TO public USING (
  (current_setting('request.jwt.claims.role') = 'admin') OR
  (current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid) OR
  (current_setting('request.jwt.claims.role') = 'client' AND client_id = current_setting('request.jwt.claims.sub')::uuid)
);
CREATE POLICY plans_insert_trainer ON plans FOR INSERT TO public WITH CHECK (
  current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid
);
CREATE POLICY plans_update_trainer ON plans FOR UPDATE TO public USING (
  current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid
);
CREATE POLICY plans_delete_trainer ON plans FOR DELETE TO public USING (
  current_setting('request.jwt.claims.role') = 'trainer' AND trainer_id = current_setting('request.jwt.claims.sub')::uuid
);

ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY plan_exercises_select ON plan_exercises FOR SELECT TO public USING (
  EXISTS (
    SELECT 1 FROM plans p WHERE p.id = plan_exercises.plan_id AND (
      (current_setting('request.jwt.claims.role') = 'admin') OR
      (current_setting('request.jwt.claims.role') = 'trainer' AND p.trainer_id = current_setting('request.jwt.claims.sub')::uuid) OR
      (current_setting('request.jwt.claims.role') = 'client' AND p.client_id = current_setting('request.jwt.claims.sub')::uuid)
    )
  )
);
CREATE POLICY plan_exercises_insert ON plan_exercises FOR INSERT TO public WITH CHECK (
  current_setting('request.jwt.claims.role') = 'trainer' AND plan_id IN (
    SELECT id FROM plans WHERE trainer_id = current_setting('request.jwt.claims.sub')::uuid
  )
);
CREATE POLICY plan_exercises_update ON plan_exercises FOR UPDATE TO public USING (
  current_setting('request.jwt.claims.role') = 'trainer' AND plan_id IN (
    SELECT id FROM plans WHERE trainer_id = current_setting('request.jwt.claims.sub')::uuid
  )
);
CREATE POLICY plan_exercises_delete ON plan_exercises FOR DELETE TO public USING (
  current_setting('request.jwt.claims.role') = 'trainer' AND plan_id IN (
    SELECT id FROM plans WHERE trainer_id = current_setting('request.jwt.claims.sub')::uuid
  )
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercises_select ON exercises FOR SELECT TO public USING (
  current_setting('request.jwt.claims.role') IN ('admin','trainer','client')
);

ALTER TABLE standard_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY reasons_select ON standard_reasons FOR SELECT TO public USING (
  current_setting('request.jwt.claims.role') IN ('admin','trainer','client')
);
