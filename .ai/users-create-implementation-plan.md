# API Endpoint Implementation Plan: POST /users

## 1. Przegląd punktu końcowego

Endpoint POST /users służy do tworzenia nowych użytkowników w systemie przez administratora. Nowo utworzony użytkownik otrzymuje status 'pending' i automatycznie wysyłany jest email z linkiem aktywacyjnym.

**Główne funkcjonalności:**

- Tworzenie nowych trenerów i podopiecznych
- Automatyczna walidacja danych wejściowych
- Wysyłka emaila z linkiem aktywacyjnym
- Przypisanie podopiecznego do trenera (jeśli role=trainee)

**Poziomy dostępu:**

- **Administrator**: ✅ Pełny dostęp - może tworzyć użytkowników wszystkich ról
- **Trener**: ❌ Brak dostępu
- **Podopieczny**: ❌ Brak dostępu

## 2. Szczegóły żądania

### Metoda HTTP

```
POST
```

### Struktura URL

```
/api/users
```

### Request Body

```typescript
{
  "email": "user@example.com",
  "role": "trainer" | "trainee",
  "firstName": "John",
  "lastName": "Doe",
  "trainerId": "uuid" // Required only if role is "trainee"
}
```

### Parametry Request Body

| Pole        | Typ    | Wymagane | Ograniczenia                          | Opis                                     |
| ----------- | ------ | -------- | ------------------------------------- | ---------------------------------------- |
| `email`     | string | ✅       | Valid email format, unique w systemie | Adres email użytkownika                  |
| `role`      | string | ✅       | Enum: "trainer", "trainee"            | Rola użytkownika (nie może być "admin")  |
| `firstName` | string | ✅       | Min 2, max 50 characters              | Imię użytkownika                         |
| `lastName`  | string | ✅       | Min 2, max 50 characters              | Nazwisko użytkownika                     |
| `trainerId` | UUID   | ⚠️       | Valid UUID, required if role=trainee  | ID trenera przypisanego do podopiecznego |

### Przykładowe żądania

```bash
# Utworzenie trenera
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "role": "trainer",
    "firstName": "John",
    "lastName": "Smith"
  }'

# Utworzenie podopiecznego
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "role": "trainee",
    "firstName": "Jane",
    "lastName": "Doe",
    "trainerId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Request Headers

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Request body interface
interface CreateUserCommand {
  email: string;
  role: "trainer" | "trainee";
  firstName: string;
  lastName: string;
  trainerId?: UUID; // Required if role is 'trainee'
}

// Response interface
interface CreateUserResponse {
  id: UUID;
  status: UserStatus; // Will be 'pending'
}

// Error response
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
```

### Database Types

```typescript
// User entity from database
type User = Tables<"users">;

// Insert type for users table
type UserInsert = TablesInsert<"users">;

// User role enum
type UserRole = Enums<"user_role">; // 'admin' | 'trainer' | 'client'
```

### Helper Types

```typescript
type UUID = string;
type UserStatus = "active" | "pending" | "suspended";
```

### Mapper Functions

```typescript
// From types.ts
mapUserRoleFromDTO(apiRole: "admin" | "trainer" | "trainee"): UserRole;
```

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

**Status Code:** `201`

**Body:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending"
}
```

### Error Responses

#### 400 Bad Request

**Przyczyny:**

- Brak wymaganych pól (email, role, firstName, lastName)
- Nieprawidłowy format email
- Role jest "admin" (admini nie mogą być tworzeni przez ten endpoint)
- Role jest "trainee" ale brak trainerId
- Nieprawidłowy format UUID dla trainerId
- firstName lub lastName za krótkie/za długie

**Body:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 401 Unauthorized

**Przyczyny:**

- Brak tokenu JWT
- Token wygasły lub nieprawidłowy

**Body:**

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden

**Przyczyny:**

- Użytkownik nie jest administratorem

**Body:**

```json
{
  "error": "Only administrators can create users",
  "code": "FORBIDDEN"
}
```

#### 404 Not Found

**Przyczyny:**

- trainerId nie istnieje w bazie danych
- trainerId wskazuje na użytkownika który nie jest trenerem

**Body:**

```json
{
  "error": "Trainer not found",
  "code": "NOT_FOUND"
}
```

#### 409 Conflict

**Przyczyny:**

- Email już istnieje w systemie

**Body:**

```json
{
  "error": "Email already exists",
  "code": "CONFLICT"
}
```

#### 500 Internal Server Error

**Przyczyny:**

- Błąd połączenia z bazą danych
- Błąd wysyłki emaila
- Nieoczekiwany błąd serwera

**Body:**

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## 5. Przepływ danych

### Diagram przepływu

```
Client Request (POST /api/users)
    ↓
[1] Astro Middleware
    ├─ Verify JWT token
    ├─ Extract user claims (id, role)
    └─ Attach to context.locals.user
    ↓
[2] API Route Handler (src/pages/api/users/index.ts)
    ├─ Parse request body
    ├─ Validate with Zod schema
    └─ Call service layer
    ↓
[3] Users Service (src/lib/users.service.ts)
    ├─ Check authorization (admin only)
    ├─ Validate trainerId exists (if role=trainee)
    ├─ Check email uniqueness
    ├─ Create user in database (status=pending)
    ├─ Generate activation token
    └─ Send activation email
    ↓
[4] Supabase Database
    ├─ Insert into users table
    ├─ Check unique constraint on email
    └─ Return created user
    ↓
[5] Email Service
    ├─ Generate activation link with token
    ├─ Send email via SendGrid/SMTP
    └─ Log result
    ↓
[6] Transform & Response
    ├─ Extract id and status
    └─ Return 201 Created
    ↓
Client receives CreateUserResponse
```

### Szczegółowy przepływ krok po kroku

#### Krok 1: Request Validation

```typescript
// Validate request body with Zod
const CreateUserCommandSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    role: z.enum(["trainer", "trainee"], {
      errorMap: () => ({ message: "Role must be trainer or trainee" }),
    }),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    trainerId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // trainerId is required if role is trainee
      if (data.role === "trainee" && !data.trainerId) {
        return false;
      }
      return true;
    },
    {
      message: "trainerId is required when role is trainee",
      path: ["trainerId"],
    }
  );
```

#### Krok 2: Authorization Check

```typescript
// Only admins can create users
if (currentUser.role !== "admin") {
  throw new ForbiddenError("Only administrators can create users");
}
```

#### Krok 3: Validate Trainer Exists

```typescript
// If role is trainee, validate trainerId
if (command.role === "trainee" && command.trainerId) {
  const { data: trainer, error } = await supabase.from("users").select("id, role").eq("id", command.trainerId).single();

  if (error || !trainer) {
    throw new NotFoundError("Trainer not found");
  }

  if (trainer.role !== "trainer") {
    throw new ValidationError({ trainerId: "User is not a trainer" });
  }
}
```

#### Krok 4: Check Email Uniqueness

```typescript
// Check if email already exists
const { data: existingUser } = await supabase.from("users").select("id").eq("email", command.email).single();

if (existingUser) {
  throw new ConflictError("Email already exists");
}
```

#### Krok 5: Create User

```typescript
// Map API role to DB role
const dbRole = mapUserRoleFromDTO(command.role); // 'trainee' → 'client'

// Create user with pending status
const { data: newUser, error } = await supabase
  .from("users")
  .insert({
    email: command.email,
    role: dbRole,
    is_hidden: false,
    // Note: firstName and lastName are not in current schema
    // This may require schema migration
  })
  .select()
  .single();

if (error) {
  throw new DatabaseError("Failed to create user");
}
```

#### Krok 6: Generate Activation Token

```typescript
// Generate JWT token for activation (expires in 24h)
const activationToken = jwt.sign(
  {
    userId: newUser.id,
    email: newUser.email,
    purpose: "activation",
  },
  import.meta.env.JWT_SECRET,
  { expiresIn: "24h" }
);
```

#### Krok 7: Send Activation Email

```typescript
// Send activation email
await sendEmail({
  to: newUser.email,
  subject: "Activate your account",
  template: "activation",
  data: {
    firstName: command.firstName,
    activationLink: `${APP_URL}/auth/activate?token=${activationToken}`,
  },
});
```

### Interakcje z zewnętrznymi usługami

**Supabase Database:**

- Insert operation na tabeli `users`
- Sprawdzenie unique constraint na `email`

**Email Service (SendGrid/SMTP):**

- Wysyłka emaila aktywacyjnego
- Retry logic w przypadku błędu
- Logging wysłanych emaili

**JWT Service:**

- Generowanie tokenu aktywacyjnego
- Podpisywanie tokenu z secret key

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm:**

- JWT token w nagłówku `Authorization: Bearer {token}`
- Token musi być ważny i nie wygasły
- Token sprawdzany przez middleware

### 6.2 Autoryzacja (Authorization)

**Role-Based Access Control:**

| Rola        | Dostęp do POST /users |
| ----------- | --------------------- |
| **admin**   | ✅ Pełny dostęp       |
| **trainer** | ❌ Brak dostępu       |
| **client**  | ❌ Brak dostępu       |

**Implementacja:**

```typescript
// Only admins can create users
if (currentUser.role !== "admin") {
  throw new ForbiddenError("Only administrators can create users");
}
```

### 6.3 Walidacja danych wejściowych

**Zod Schema:**

```typescript
const CreateUserCommandSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase(),
    role: z.enum(["trainer", "trainee"]),
    firstName: z.string().min(2).max(50).trim(),
    lastName: z.string().min(2).max(50).trim(),
    trainerId: z.string().uuid().optional(),
  })
  .refine((data) => data.role !== "trainee" || !!data.trainerId, {
    message: "trainerId is required when role is trainee",
    path: ["trainerId"],
  });
```

### 6.4 Bezpieczeństwo emaila

**Token aktywacyjny:**

- JWT z expiresIn: 24h
- Zawiera purpose: "activation" (weryfikacja celu)
- Podpisany secret key z env

**Email content security:**

- Escape HTML w treści emaila
- HTTPS dla linków aktywacyjnych
- Unique token per user

### 6.5 Zabezpieczenia przed atakami

**Email enumeration:**

- Nie ujawniaj czy email istnieje w komunikatach błędów dla nieautoryzowanych użytkowników
- Dla adminów: zwracaj szczegółowy błąd 409 Conflict

**SQL Injection:**

- Chronione przez Supabase SDK (parametryzowane zapytania)

**XSS:**

- Response JSON (nie HTML)
- Escape danych w emailach

**Rate Limiting:**

- Max 10 create requests per minute per admin
- Globalny limit: 100 nowych użytkowników na godzinę

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod                | Status | Przyczyna                                    | Akcja użytkownika                |
| ------------------ | ------ | -------------------------------------------- | -------------------------------- |
| `UNAUTHORIZED`     | 401    | Brak lub nieprawidłowy JWT                   | Zaloguj się ponownie             |
| `FORBIDDEN`        | 403    | Użytkownik nie jest adminem                  | Poproś admina o wykonanie akcji  |
| `VALIDATION_ERROR` | 400    | Nieprawidłowe dane wejściowe                 | Popraw dane zgodnie z details    |
| `NOT_FOUND`        | 404    | trainerId nie istnieje lub nie jest trenerem | Wybierz poprawnego trenera       |
| `CONFLICT`         | 409    | Email już istnieje                           | Użyj innego emaila               |
| `DATABASE_ERROR`   | 500    | Błąd bazy danych                             | Spróbuj ponownie później         |
| `EMAIL_ERROR`      | 500    | Błąd wysyłki emaila                          | User created, resend email later |
| `INTERNAL_ERROR`   | 500    | Nieoczekiwany błąd                           | Skontaktuj się z supportem       |

### 7.2 Custom Error Classes

```typescript
// src/lib/errors.ts

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class EmailError extends AppError {
  constructor(message = "Failed to send email") {
    super(500, "EMAIL_ERROR", message);
  }
}
```

### 7.3 Error Handling w Service

```typescript
export async function createUser(
  supabase: SupabaseClient,
  command: CreateUserCommand,
  currentUser: User
): Promise<CreateUserResponse> {
  // Authorization
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can create users");
  }

  try {
    // Validate trainer if needed
    if (command.role === "trainee" && command.trainerId) {
      await validateTrainer(supabase, command.trainerId);
    }

    // Check email uniqueness
    const exists = await checkEmailExists(supabase, command.email);
    if (exists) {
      throw new ConflictError("Email already exists");
    }

    // Create user
    const newUser = await insertUser(supabase, command);

    // Send activation email (non-blocking)
    try {
      await sendActivationEmail(newUser, command.firstName);
    } catch (emailError) {
      // Log error but don't fail the request
      console.error("Failed to send activation email:", emailError);
      // Consider: store failed email in queue for retry
    }

    return {
      id: newUser.id,
      status: "pending",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Unexpected error in createUser:", error);
    throw new InternalError("Failed to create user");
  }
}
```

### 7.4 Edge Cases

**Scenariusz 1: Email wysłany ale user nie aktywuje konta**

- User pozostaje w statusie pending
- Admin może re-send invitation przez POST /auth/invite

**Scenariusz 2: Błąd wysyłki emaila**

- User zostaje utworzony (200 OK)
- Email error logowany
- Admin może ręcznie wysłać ponownie

**Scenariusz 3: Trainer usunięty po utworzeniu trainee**

- Foreign key constraint zapobiega usunięciu trenera z podopiecznymi
- Alternatywnie: ON DELETE SET NULL

**Scenariusz 4: Concurrent create z tym samym emailem**

- Database unique constraint zapobiega duplikatom
- Drugi request dostanie 409 Conflict

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**Problem 1: Email sending blocking request**

- Wysyłka emaila może trwać 1-3 sekundy
- Rozwiązanie: Asynchroniczna kolejka emaili

**Problem 2: Validation queries**

- Check email exists: 1 query
- Validate trainer: 1 query
- Insert user: 1 query
- Total: 3 queries
- Rozwiązanie: Optymalizacja przez upsert lub database constraints

**Problem 3: Rate limiting dla email service**

- SendGrid ma limity requestów
- Rozwiązanie: Queuing system (Bull, BullMQ)

### 8.2 Strategie optymalizacji

#### Optymalizacja 1: Async email queue

```typescript
// Use background job queue
import { emailQueue } from "@/lib/queue";

// After creating user
await emailQueue.add("activation-email", {
  userId: newUser.id,
  email: newUser.email,
  firstName: command.firstName,
});

// Return immediately
return { id: newUser.id, status: "pending" };
```

#### Optymalizacja 2: Database constraints

```sql
-- Let database handle uniqueness check
CREATE UNIQUE INDEX users_email_unique ON users(email);

-- Let database handle foreign key validation
ALTER TABLE users
  ADD CONSTRAINT fk_trainer
  FOREIGN KEY (trainer_id) REFERENCES users(id);
```

#### Optymalizacja 3: Transaction dla consistency

```typescript
// Use transaction for user creation
const { data, error } = await supabase.rpc("create_user_with_profile", {
  p_email: command.email,
  p_role: dbRole,
  p_trainer_id: command.trainerId,
});
```

### 8.3 Monitoring

**Metryki:**

- User creation rate (users/hour)
- Email delivery success rate
- Validation query time
- Total endpoint response time

**Alerty:**

- Email delivery failure > 5%
- Response time > 2 seconds
- Error rate > 1%

## 9. Kroki implementacji

### Krok 1: Migracja bazy danych

**1.1. Dodanie kolumn first_name, last_name, trainer_id**

```sql
-- supabase/migrations/[timestamp]_add_user_profile_fields.sql

-- Add profile fields to users table
ALTER TABLE users
  ADD COLUMN first_name VARCHAR(50),
  ADD COLUMN last_name VARCHAR(50),
  ADD COLUMN trainer_id UUID REFERENCES users(id) ON DELETE RESTRICT;

-- Create index for trainer_id lookups
CREATE INDEX idx_users_trainer_id ON users(trainer_id);

-- Add check constraint: trainer_id only for clients
ALTER TABLE users
  ADD CONSTRAINT chk_trainer_id_for_clients
  CHECK (
    (role = 'client' AND trainer_id IS NOT NULL) OR
    (role != 'client' AND trainer_id IS NULL)
  );
```

**1.2. Dodanie tabeli activation_tokens (opcjonalnie)**

```sql
-- Table to store activation tokens (alternative to JWT)
CREATE TABLE activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activation_tokens_user_id ON activation_tokens(user_id);
CREATE INDEX idx_activation_tokens_token ON activation_tokens(token);
CREATE INDEX idx_activation_tokens_expires_at ON activation_tokens(expires_at);
```

### Krok 2: Aktualizacja types

**2.1. Regeneruj database.types.ts**

```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

**2.2. Sprawdź czy types.ts zawiera CreateUserCommand i CreateUserResponse**

Typy są już zdefiniowane w `src/types.ts` (linie 177-191).

### Krok 3: Rozszerz error classes

**3.1. Dodaj ConflictError do src/lib/errors.ts**

```typescript
// src/lib/errors.ts

/**
 * 409 Conflict - Resource already exists
 */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

/**
 * 500 Internal Server Error - Email sending failed
 */
export class EmailError extends AppError {
  constructor(message = "Failed to send email") {
    super(500, "EMAIL_ERROR", message);
  }
}
```

### Krok 4: Utwórz Email Service

**4.1. Utwórz src/lib/email.service.ts**

```typescript
// src/lib/email.service.ts

import { EmailError } from "./errors";

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

/**
 * Send email using SendGrid or SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // TODO: Implement actual email sending
    // For MVP, log to console
    console.log("Sending email:", options);

    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(import.meta.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: options.to,
    //   from: import.meta.env.FROM_EMAIL,
    //   subject: options.subject,
    //   html: renderTemplate(options.template, options.data),
    // });
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new EmailError("Failed to send email");
  }
}

/**
 * Generate activation token (JWT)
 */
export function generateActivationToken(userId: string, email: string): string {
  // TODO: Implement JWT generation
  // For MVP, use simple token
  return Buffer.from(`${userId}:${email}:${Date.now()}`).toString("base64");

  // Production implementation:
  // import jwt from 'jsonwebtoken';
  // return jwt.sign(
  //   { userId, email, purpose: 'activation' },
  //   import.meta.env.JWT_SECRET,
  //   { expiresIn: '24h' }
  // );
}

/**
 * Send activation email to new user
 */
export async function sendActivationEmail(email: string, firstName: string, userId: string): Promise<void> {
  const token = generateActivationToken(userId, email);
  const activationLink = `${import.meta.env.PUBLIC_APP_URL}/auth/activate?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Activate your account",
    template: "activation",
    data: {
      firstName,
      activationLink,
    },
  });
}
```

### Krok 5: Utwórz Users Service - createUser

**5.1. Dodaj funkcję createUser do src/lib/users.service.ts**

```typescript
// src/lib/users.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateUserCommand, CreateUserResponse, User } from "@/types";
import { mapUserRoleFromDTO, isAdmin } from "@/types";
import { ForbiddenError, ValidationError, NotFoundError, ConflictError, DatabaseError } from "./errors";
import { sendActivationEmail } from "./email.service";

/**
 * Validate that trainer exists and has trainer role
 */
async function validateTrainer(supabase: SupabaseClient, trainerId: string): Promise<void> {
  const { data: trainer, error } = await supabase.from("users").select("id, role").eq("id", trainerId).single();

  if (error || !trainer) {
    throw new NotFoundError("Trainer not found");
  }

  if (trainer.role !== "trainer") {
    throw new ValidationError({ trainerId: "User is not a trainer" });
  }
}

/**
 * Check if email already exists
 */
async function checkEmailExists(supabase: SupabaseClient, email: string): Promise<boolean> {
  const { data, error } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();

  if (error) {
    throw new DatabaseError("Failed to check email uniqueness");
  }

  return !!data;
}

/**
 * Create new user (admin only)
 *
 * Authorization: Admin only
 * Side effects: Sends activation email
 */
export async function createUser(
  supabase: SupabaseClient,
  command: CreateUserCommand,
  currentUser: User
): Promise<CreateUserResponse> {
  // Authorization check
  if (!isAdmin(currentUser)) {
    throw new ForbiddenError("Only administrators can create users");
  }

  // Validate trainer if role is trainee
  if (command.role === "trainee" && command.trainerId) {
    await validateTrainer(supabase, command.trainerId);
  }

  // Check email uniqueness
  const emailExists = await checkEmailExists(supabase, command.email);
  if (emailExists) {
    throw new ConflictError("Email already exists");
  }

  // Map API role to database role
  const dbRole = mapUserRoleFromDTO(command.role);

  // Prepare insert data
  const insertData: any = {
    email: command.email.toLowerCase(),
    role: dbRole,
    is_hidden: false,
    first_name: command.firstName,
    last_name: command.lastName,
  };

  // Add trainer_id for clients
  if (command.role === "trainee" && command.trainerId) {
    insertData.trainer_id = command.trainerId;
  }

  // Insert user
  const { data: newUser, error } = await supabase.from("users").insert(insertData).select().single();

  if (error) {
    console.error("Failed to create user:", error);
    throw new DatabaseError("Failed to create user");
  }

  // Send activation email (non-blocking for MVP)
  try {
    await sendActivationEmail(command.email, command.firstName, newUser.id);
  } catch (emailError) {
    // Log error but don't fail the request
    console.error("Failed to send activation email:", emailError);
    // TODO: Queue for retry or notify admin
  }

  return {
    id: newUser.id,
    status: "pending", // All new users start as pending
  };
}
```

### Krok 6: Utwórz Zod Schema

**6.1. Dodaj schema do src/lib/validation.ts**

```typescript
// src/lib/validation.ts

/**
 * Validation schema for POST /api/users
 */
export const CreateUserCommandSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .toLowerCase()
      .transform((val) => val.trim()),
    role: z.enum(["trainer", "trainee"], {
      errorMap: () => ({ message: "Role must be trainer or trainee" }),
    }),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters")
      .transform((val) => val.trim()),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters")
      .transform((val) => val.trim()),
    trainerId: z.string().uuid("Invalid trainer ID format").optional(),
  })
  .refine(
    (data) => {
      // trainerId is required if role is trainee
      if (data.role === "trainee" && !data.trainerId) {
        return false;
      }
      return true;
    },
    {
      message: "trainerId is required when role is trainee",
      path: ["trainerId"],
    }
  );
```

### Krok 7: Utwórz/Aktualizuj API Route Handler

**7.1. Aktualizuj src/pages/api/users/index.ts - dodaj POST handler**

```typescript
// src/pages/api/users/index.ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { listUsers, createUser } from "@/lib/users.service";
import { ListUsersQuerySchema, CreateUserCommandSchema, parseQueryParams } from "@/lib/validation";
import { AppError } from "@/lib/errors";

/**
 * GET /api/users
 * List users with pagination and filtering
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // ... existing implementation ...
};

/**
 * POST /api/users
 * Create new user (admin only)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = CreateUserCommandSchema.parse(body);

    // Call service
    const result = await createUser(locals.supabase, validatedCommand, locals.user);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AppError instances
    if (error instanceof AppError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          ...(error.details && { details: error.details }),
        }),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/users:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Krok 8: Testing

**8.1. Testy jednostkowe**

```typescript
// src/lib/users.service.test.ts

describe("createUser", () => {
  it("should create trainer successfully", async () => {
    // Mock Supabase client
    // Mock current user as admin
    // Call createUser with trainer role
    // Assert user created with correct data
  });

  it("should create trainee with trainerId", async () => {
    // Mock Supabase client
    // Mock current user as admin
    // Call createUser with trainee role and trainerId
    // Assert user created and linked to trainer
  });

  it("should throw ForbiddenError for non-admin", async () => {
    // Mock current user as trainer
    // Expect createUser to throw ForbiddenError
  });

  it("should throw ValidationError if trainerId missing for trainee", async () => {
    // Already handled by Zod schema
  });

  it("should throw ConflictError if email exists", async () => {
    // Mock Supabase to return existing user
    // Expect createUser to throw ConflictError
  });

  it("should throw NotFoundError if trainer not found", async () => {
    // Mock Supabase to return null for trainer
    // Expect createUser to throw NotFoundError
  });
});
```

**8.2. Testy integracyjne**

```bash
# Test 1: Admin creates trainer
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@test.com",
    "role": "trainer",
    "firstName": "Test",
    "lastName": "Trainer"
  }'
# Expected: 201 Created

# Test 2: Admin creates trainee
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "role": "trainee",
    "firstName": "Test",
    "lastName": "Client",
    "trainerId": "{valid_trainer_id}"
  }'
# Expected: 201 Created

# Test 3: Trainer tries to create user (should fail)
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@test.com",
    "role": "trainer",
    "firstName": "Test",
    "lastName": "User"
  }'
# Expected: 403 Forbidden

# Test 4: Duplicate email (should fail)
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@test.com",
    "role": "trainer",
    "firstName": "Duplicate",
    "lastName": "User"
  }'
# Expected: 409 Conflict

# Test 5: Invalid trainerId (should fail)
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client2@test.com",
    "role": "trainee",
    "firstName": "Test",
    "lastName": "Client",
    "trainerId": "invalid-uuid"
  }'
# Expected: 400 Bad Request

# Test 6: Missing trainerId for trainee (should fail)
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client3@test.com",
    "role": "trainee",
    "firstName": "Test",
    "lastName": "Client"
  }'
# Expected: 400 Bad Request
```

**8.3. Expected Results**

| Test                       | Expected Status | Expected Result    |
| -------------------------- | --------------- | ------------------ |
| Admin creates trainer      | 201             | CreateUserResponse |
| Admin creates trainee      | 201             | CreateUserResponse |
| Trainer creates user       | 403             | ForbiddenError     |
| Duplicate email            | 409             | ConflictError      |
| Invalid trainerId          | 400             | ValidationError    |
| Missing trainerId          | 400             | ValidationError    |
| Invalid trainer (not role) | 404             | NotFoundError      |
| No authentication          | 401             | UnauthorizedError  |

### Krok 9: Dokumentacja

**9.1. OpenAPI/Swagger spec**

```yaml
/api/users:
  post:
    summary: Create new user
    description: Create new trainer or trainee (admin only)
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - role
              - firstName
              - lastName
            properties:
              email:
                type: string
                format: email
              role:
                type: string
                enum: [trainer, trainee]
              firstName:
                type: string
                minLength: 2
                maxLength: 50
              lastName:
                type: string
                minLength: 2
                maxLength: 50
              trainerId:
                type: string
                format: uuid
                description: Required if role is trainee
    responses:
      201:
        description: User created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  format: uuid
                status:
                  type: string
                  enum: [pending]
      400:
        description: Validation error
      401:
        description: Unauthorized
      403:
        description: Forbidden (not admin)
      404:
        description: Trainer not found
      409:
        description: Email already exists
      500:
        description: Internal server error
```

### Krok 10: Deployment

**10.1. Pre-deployment checklist**

- [ ] Migracje bazy danych zastosowane
- [ ] Email service skonfigurowany (SendGrid API key)
- [ ] JWT_SECRET ustawiony w env
- [ ] PUBLIC_APP_URL ustawiony dla linków aktywacyjnych
- [ ] Wszystkie testy przechodzą
- [ ] Linter OK

**10.2. Environment variables**

```env
# .env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@your-domain.com
PUBLIC_APP_URL=https://your-app.com
```

**10.3. Post-deployment validation**

- [ ] Test creating trainer
- [ ] Test creating trainee
- [ ] Verify activation email sent
- [ ] Check database constraints work
- [ ] Monitor error logs

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowe wskazówki dla wdrożenia endpointa **POST /users**. Plan obejmuje:

✅ Szczegółową specyfikację API z wszystkimi parametrami  
✅ Definicje typów i interfejsów  
✅ Logikę autoryzacji (admin only)  
✅ Walidację danych wejściowych z Zod  
✅ Obsługę błędów (409 Conflict, 404 Not Found, etc.)  
✅ Integrację z email service  
✅ Strategie wydajnościowe  
✅ Krok po kroku instrukcje implementacji  
✅ Kompletne przykłady testów

**Kluczowe punkty:**

- Tylko administratorzy mogą tworzyć użytkowników
- Nowi użytkownicy mają status 'pending'
- Automatyczna wysyłka emaila aktywacyjnego
- Walidacja trenera dla podopiecznych
- Obsługa unique constraint na email
- Migracja schematu wymagana (first_name, last_name, trainer_id)

**Znane ograniczenia MVP:**

- Email service wymaga konfiguracji SendGrid
- Activation token może być prosty base64 (production: JWT)
- Email sending jest synchroniczny (production: queue)
- Brak retry logic dla failed emails

Ten endpoint stanowi fundament dla systemu zarządzania użytkownikami.
