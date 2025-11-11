# REST API Plan

## 1. Resources

- **Users** (`users` table)
- **Exercises** (`exercises` table)
- **Plans** (`plans` table)
- **Plan Exercises** (`plan_exercises` join table)
- **Completion Records** (marks exercise completion by trainees)
- **Standard Reasons** (predefined reasons for incomplete exercises)

## 2. Endpoints

### Authentication & Account Activation

#### 1. Request Activation / Invitation Email

- Method: POST
- URL: `/auth/invite`
- Description: Send activation link to a new user (trainer or trainee) or re-send invitation
- Request Body:
  ```json
  { "email": "user@example.com", "role": "trainer|trainee", "resend": false }
  ```
- Success Response (202 Accepted):
  ```json
  { "message": "Activation link sent" }
  ```
- Error (400/409): invalid email or user already active

#### 2. Activate Account

- Method: POST
- URL: `/auth/activate`
- Description: Activate account using token
- Request Body:
  ```json
  { "token": "activation_jwt_token" }
  ```
- Success (200): `{ "message": "Account activated" }`
- Error (400/401): invalid/expired token

#### 3. Request Password Reset

- Method: POST
- URL: `/auth/reset-password/request`
- Description: Send password reset link (1h expiry)
- Request Body: `{ "email": "user@example.com" }`
- Success (202): `{ "message": "Reset link sent" }`
- Error (404): email not found

#### 4. Reset Password

- Method: POST
- URL: `/auth/reset-password/confirm`
- Description: Reset password using token
- Request Body:
  ```json
  { "token": "reset_jwt_token", "newPassword": "P@ssw0rd" }
  ```
- Success (200): `{ "message": "Password updated" }`
- Error (400/401): invalid/expired token, validation error

### Users Management

#### 1. List Users

- Method: GET
- URL: `/users`
- Description: Retrieve paginated list of users with optional filtering by role, status, trainer
- Query Params:
  - `role` (admin|trainer|trainee)
  - `status` (active|pending|suspended)
  - `trainerId` (UUID)
  - `page` (int, default 1)
  - `limit` (int, default 20)
- Response:
  ```json
  {
    "data": [{ "id": "...", "email": "...", "role": "trainer", "status": "active" /* ... */ }],
    "meta": { "page": 1, "limit": 20, "total": 100 }
  }
  ```

#### 2. Create User

- Method: POST
- URL: `/users`
- Description: Administrator creates new trainer or trainee (status pending)
- Request Body:
  ```json
  {
    "email": "new@example.com",
    "role": "trainer|trainee",
    "firstName": "John",
    "lastName": "Doe",
    "trainerId": "<uuid>" // required if role=trainee
  }
  ```
- Response (201 Created):
  ```json
  { "id": "...", "status": "pending" }
  ```
- Errors (400/409): validation, email conflict

#### 3. Get User

- Method: GET
- URL: `/users/{id}`
- Description: Retrieve user details (self or by admin/trainer for their trainees)
- Response:
  ```json
  { "id": "...", "email": "...", "role": "..." /* profile fields */ }
  ```
- Errors (403/404)

#### 4. Update User

- Method: PUT
- URL: `/users/{id}`
- Description: Admin or trainer (for assigned trainees) updates profile fields or status
- Request Body: partial profile fields
- Response (200): updated user object
- Errors (403/400)

#### 5. Delete / Suspend User

- Method: DELETE
- URL: `/users/{id}`
- Description: Admin deletes or suspends a user (cascade/hide related plans)
- Success (204 No Content)
- Errors (403/404)

### Exercises

#### 1. List Exercises

- Method: GET
- URL: `/exercises`
- Params: `page`, `limit`, `search` (name)
- Response paginated list with `id`, `name`, `tempo`, `defaultWeight`

#### 2. Create Exercise

- Method: POST
- URL: `/exercises`
- Body:
  ```json
  {
    "name": "Squat",
    "description": "Proper squat technique...",
    "vimeoToken": "abcd1234",
    "tempo": "3-1-3",
    "defaultWeight": 20
  }
  ```
- Response (201): new exercise object
- Validations: name required, tempo pattern

#### 3. Get Exercise

- Method: GET
- URL: `/exercises/{id}`

#### 4. Update Exercise

- Method: PUT
- URL: `/exercises/{id}`
- Body: same as create but all fields optional

#### 5. Delete Exercise

- Method: DELETE
- URL: `/exercises/{id}`
- Response (204)

### Plans

#### 1. List Plans

- Method: GET
- URL: `/plans`
- Params: `trainerId`, `traineeId`, `visible` (true|false), `page`, `limit`, `sortBy` (createdAt)
- Response paginated

#### 2. Create Plan

- Method: POST
- URL: `/plans`
- Body:
  ```json
  {
    "trainerId": "...",
    "traineeId": "...",
    "name": "Leg Day",
    "description": "Quad focus",
    "isVisible": true,
    "exercises": [{ "exerciseId": "...", "sortOrder": 1, "sets": 3, "reps": 12 }]
  }
  ```
- Response (201): plan with nested exercises
- Side effect: send email notification

#### 3. Get Plan

- Method: GET
- URL: `/plans/{id}`
- Includes exercises array

#### 4. Update Plan

- Method: PUT
- URL: `/plans/{id}`
- Body: same as create (partial updates allowed)
- Side effect: send update email if exercises changed

#### 5. Delete Plan

- Method: DELETE
- URL: `/plans/{id}`
- Response (204)

#### 6. Toggle Visibility

- Method: PATCH
- URL: `/plans/{id}/visibility`
- Body:
  ```json
  { "isVisible": false }
  ```
- Response (200): updated plan

### Plan Exercises (Nested)

#### 1. Add Exercise to Plan

- Method: POST
- URL: `/plans/{planId}/exercises`
- Body: `{ "exerciseId": "...", "sortOrder": 2, "sets": 4, "reps": 10 }`

#### 2. Update Exercise in Plan

- Method: PATCH
- URL: `/plans/{planId}/exercises/{exerciseId}`
- Body: fields to update

#### 3. Remove Exercise from Plan

- Method: DELETE
- URL: `/plans/{planId}/exercises/{exerciseId}`

### Completion Records

#### 1. Mark Exercise Completion

- Method: POST
- URL: `/plans/{planId}/exercises/{exerciseId}/completion`
- Body:
  ```json
  { "completed": true|false, "reasonId": "...", "customReason": "..." }
  ```
- Response (201): record created

#### 2. Get Completion Records for Plan

- Method: GET
- URL: `/plans/{planId}/completion`

### Standard Reasons

#### 1. List Reasons

- Method: GET
- URL: `/reasons`

#### 2. Create Reason

- Method: POST
- URL: `/reasons`
- Body: `{ "text": "Felt pain" }`

#### 3. Update Reason

- Method: PUT
- URL: `/reasons/{id}`

#### 4. Delete Reason

- Method: DELETE
- URL: `/reasons/{id}`

## 3. Authentication & Authorization

- Use Supabase Auth JWT with row-level security policies (RLS) on `users`, `plans`, `exercises`, `plan_exercises`, `completion_records`.
- Middleware verifies JWT, extracts `userId` and `role` from claims.
- Policies:
  - Admin: full access
  - Trainer: access to own trainees and plans (`plans.trainer_id = userId`)
  - Trainee: read own user record, read plans where `trainee_id = userId`, write own completion records

## 4. Validation & Business Logic

- Email: unique, valid format
- Role: enum [administrator, trainer, trainee]
- Tempo: regex `^(?:\\d{4}|\\d+[x\\/]\\d+[x\\/]\\d+)$`
- Sets/Reps/SortOrder: positive integers
- `trainerId` required when creating a trainee
- Plans must contain ≥1 exercise on creation
- Pagination: offset-limit using `page` and `limit`, ordered by indexed fields `(created_at, trainer_id)`
- Visibility toggle enforces `is_visible = true|false`
- Exercise completion requires either `reasonId` (existing) or `customReason` when `completed=false`
- Rate limiting: e.g. 100 requests/min per user
