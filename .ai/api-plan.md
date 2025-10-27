# REST API Plan

## 1. Resources

- **Users** (`users` table)
- **Exercises** (`exercises` table)
- **Plans** (`plans` table)
- **PlanExercises** (`plan_exercises` table)
- **Notifications** (in-app and email)
- **AuditLogs** (`audit_logs` table)

## 2. Endpoints

### 2.1 Authentication

POST /auth/request-link

- Description: Send login or activation link
- Body: { email: string }
- Responses:
  - 200: { message: "Link sent" }
  - 400: { error: "Invalid email" }
  - 404: { error: "User not found" }

POST /auth/verify

- Description: Verify token and issue JWT
- Body: { token: string }
- Responses:
  - 200: { accessToken: string, expiresIn: number }
  - 400: { error: "Invalid token" }
  - 401: { error: "Token expired" }

POST /auth/reset-request

- Description: Send password reset link
- Body: { email: string }
- Responses:
  - 200: { message: "Reset link sent" }

POST /auth/reset

- Description: Reset password
- Body: { token: string, newPassword: string }
- Responses:
  - 200: { message: "Password updated" }

### 2.2 Users

GET /users

- Description: List users
- Query: role, status, page, limit, sortBy, sortOrder
- Auth: Administrator
- Responses:
  - 200: { data: User[], pagination: {...} }

POST /users

- Description: Create user
- Body: { email, role, firstName, lastName, trainerId? }
- Auth: Administrator
- Validations: unique email, role ∈ ENUM
- Responses:
  - 201: User
  - 400: { error: "Validation failed" }

GET /users/:id

- Description: Get user
- Auth: Admin or owner
- Responses:
  - 200: User
  - 403: { error: "Forbidden" }

PUT /users/:id

- Description: Update any user
- Body: same as create
- Auth: Admin or assigned trainer
- Responses:
  - 200: User
  - 400,403

DELETE /users/:id

- Description: Deactivate user
- Auth: Administrator
- Responses:
  - 204

PUT /users/:id/profile

- Description: Podopieczny updates own profile
- Body: { firstName, lastName, contact? }
- Auth: Podopieczny
- Responses:
  - 200: User
  - 400,403

### 2.3 Exercises

GET /exercises

- Description: List exercises
- Query: page, limit, sortBy, search
- Auth: Admin, Trainer
- Responses:
  - 200: { data: Exercise[], pagination }

POST /exercises

- Description: Create exercise
- Body: { name, description?, vimeoToken }
- Auth: Administrator
- Validations: name non-empty, vimeoToken non-empty
- Responses:
  - 201: Exercise
  - 400: { error: "Validation failed" }

GET /exercises/:id

- Description: Get exercise
- Auth: Admin, Trainer
- Responses:
  - 200: Exercise

PUT /exercises/:id

- Description: Update exercise
- Body: same as create
- Auth: Administrator
- Responses:
  - 200: Exercise

DELETE /exercises/:id

- Description: Delete exercise
- Auth: Administrator
- Responses:
  - 204

### 2.4 Plans

GET /plans

- Description: List plans
- Query: assignedTo, visible, page, limit, sortBy, sortOrder
- Auth: Trainer (own), Podopieczny (assigned & visible)
- Responses:
  - 200: { data: Plan[], pagination }

POST /plans

- Description: Create plan
- Body:
  {
  name: string,
  description?: string,
  assignedTo: UUID,
  exercises: [ { exerciseId: UUID, sortOrder: int, sets: int, reps: int } ]
  }
- Auth: Trainer
- Validations: exercises.length >= 1; fields > 0
- Responses:
  - 201: Plan with nested exercises
  - 400: { error: "Validation failed" }

GET /plans/:id

- Description: Get plan details
- Auth: Trainer (owner), Podopieczny (assigned & visible)
- Responses:
  - 200: Plan with exercises

PATCH /plans/:id

- Description: Update plan fields or visibility
- Body: partial Plan
- Auth: Trainer
- Responses:
  - 200: Plan

DELETE /plans/:id

- Description: Delete (archive) plan
- Auth: Trainer
- Responses:
  - 204

### 2.5 PlanExercises

POST /plans/:planId/exercises

- Description: Add exercise to plan
- Body: { exerciseId, sortOrder, sets, reps }
- Auth: Trainer
- Responses:
  - 201: PlanExercise

PUT /plans/:planId/exercises/:exerciseId

- Description: Update plan-exercise mapping
- Body: { sortOrder?, sets?, reps? }
- Auth: Trainer
- Responses:
  - 200: PlanExercise

DELETE /plans/:planId/exercises/:exerciseId

- Description: Remove exercise from plan
- Auth: Trainer
- Responses:
  - 204

### 2.6 Notifications

GET /notifications

- Description: List user notifications
- Query: unread, page, limit
- Auth: any user
- Responses:
  - 200: { data: Notification[], pagination }

PATCH /notifications/:id/read

- Description: Mark notification read
- Auth: owner
- Responses:
  - 200: Notification

### 2.7 AuditLogs

GET /audit-logs

- Description: List audit entries
- Query: entity, action, since, page, limit
- Auth: Administrator
- Responses:
  - 200: { data: AuditLog[], pagination }

## 3. Authentication & Authorization

- Supabase Auth with email-link and JWT
- Roles: administrator, trener, podopieczny
- Row-Level Security enforced on `users` and `plans` using `jwt.claims.user_id`
- Role-based guards in middleware
- Rate limiting: 100 requests/minute per user/IP

## 4. Validation & Business Logic

- Users: unique email; role must be one of ENUM; trainerId only for podopieczny
- Exercises: name and vimeoToken required
- Plans: must include ≥1 exercise; sortOrder, sets, reps > 0
- Visibility: `isVisible` toggled by trainer; default true
- Audit: log CRUD operations with user, action, timestamp
- Notifications: enqueue email on user creation and plan creation
- Pagination: offset/limit with defaults (20) and maximum (100)
