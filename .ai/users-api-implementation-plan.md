# Users API - Kompleksowy Plan Implementacji

Ten dokument zawiera pełną specyfikację implementacji wszystkich endpointów API związanych z zarządzaniem użytkownikami w systemie Move with Nat.

## Spis Treści

1. [POST /users - Tworzenie użytkowników](#1-post-users---tworzenie-użytkowników)
2. [GET /users - Lista użytkowników](#2-get-users---lista-użytkowników)
3. [GET /users/:id - Szczegóły użytkownika](#3-get-usersid---szczegóły-użytkownika)
4. [PUT /users/:id - Aktualizacja użytkownika](#4-put-usersid---aktualizacja-użytkownika)

---

# 1. POST /users - Tworzenie użytkowników

## 1.1. Przegląd punktu końcowego

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

## 1.2. Szczegóły żądania

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

## 1.3. Wykorzystywane typy

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

## 1.4. Szczegóły odpowiedzi

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

## 1.5. Przepływ danych

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

## 1.6. Względy bezpieczeństwa

### 1.6.1 Uwierzytelnianie (Authentication)

**Mechanizm:**

- JWT token w nagłówku `Authorization: Bearer {token}`
- Token musi być ważny i nie wygasły
- Token sprawdzany przez middleware

### 1.6.2 Autoryzacja (Authorization)

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

### 1.6.3 Walidacja danych wejściowych

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

## 1.7. Kroki implementacji

### Krok 1: Migracja bazy danych

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

### Krok 2: Rozszerz error classes

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

### Krok 3: Utwórz Email Service

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
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new EmailError("Failed to send email");
  }
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

### Krok 4: Utwórz Users Service - createUser

```typescript
// src/lib/users.service.ts

/**
 * Create new user (admin only)
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
    console.error("Failed to send activation email:", emailError);
  }

  return {
    id: newUser.id,
    status: "pending",
  };
}
```

---

# 2. GET /users - Lista użytkowników

## 2.1. Przegląd punktu końcowego

Endpoint GET /users służy do pobierania paginowanej listy użytkowników z opcjonalnym filtrowaniem według roli, statusu i przypisanego trenera. Jest to kluczowy endpoint administracyjny umożliwiający zarządzanie użytkownikami systemu.

**Główne funkcjonalności:**

- Paginacja wyników (domyślnie 20 rekordów na stronę)
- Filtrowanie po roli użytkownika (admin/trainer/trainee)
- Filtrowanie po statusie (active/pending/suspended)
- Filtrowanie po ID trenera (dla podopiecznych)
- Automatyczna autoryzacja na poziomie RLS i aplikacji

**Poziomy dostępu:**

- **Administrator**: pełny dostęp do wszystkich użytkowników
- **Trener**: dostęp tylko do własnych podopiecznych
- **Podopieczny (trainee/client)**: brak dostępu do tego endpointa

## 2.2. Szczegóły żądania

### Metoda HTTP

```
GET
```

### Struktura URL

```
/api/users
```

### Query Parameters

| Parametr    | Typ     | Wartości                         | Domyślna | Opis                                  |
| ----------- | ------- | -------------------------------- | -------- | ------------------------------------- |
| `role`      | string  | `admin`, `trainer`, `trainee`    | -        | Filtruje użytkowników według roli     |
| `status`    | string  | `active`, `pending`, `suspended` | -        | Filtruje użytkowników według statusu  |
| `trainerId` | UUID    | valid UUID                       | -        | Filtruje podopiecznych danego trenera |
| `page`      | integer | ≥ 1                              | 1        | Numer strony dla paginacji            |
| `limit`     | integer | 1-100                            | 20       | Liczba rekordów na stronę             |

### Przykładowe żądania

```bash
# Pobranie pierwszej strony wszystkich użytkowników (admin)
GET /api/users

# Pobranie tylko trenerów
GET /api/users?role=trainer

# Pobranie podopiecznych konkretnego trenera
GET /api/users?role=trainee&trainerId=123e4567-e89b-12d3-a456-426614174000

# Pobranie aktywnych użytkowników, strona 2, 50 na stronę
GET /api/users?status=active&page=2&limit=50

# Kombinacja filtrów
GET /api/users?role=trainee&status=pending&trainerId=123e4567-e89b-12d3-a456-426614174000
```

## 2.3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Query parameters interface
interface ListUsersQuery {
  role?: "admin" | "trainer" | "trainee";
  status?: UserStatus;
  trainerId?: UUID;
  page?: number;
  limit?: number;
}

// Response DTO dla pojedynczego użytkownika
interface UserDTO {
  id: UUID;
  email: string;
  role: "admin" | "trainer" | "trainee";
  status: UserStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Metadata paginacji
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// Paginowana odpowiedź
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

## 2.4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Status Code:** `200`

**Body:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "trainer@example.com",
      "role": "trainer",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "email": "client@example.com",
      "role": "trainee",
      "status": "pending",
      "createdAt": "2025-01-16T14:20:00.000Z",
      "updatedAt": "2025-01-16T14:20:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

## 2.5. Kroki implementacji

### Krok 1: Utworzenie Zod Schema

```typescript
// src/lib/validation.ts

/**
 * Validation schema for GET /api/users query parameters
 */
export const ListUsersQuerySchema = z.object({
  role: z.enum(["admin", "trainer", "trainee"]).optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  trainerId: z.string().uuid("Invalid UUID format").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Krok 2: Utworzenie Users Service

```typescript
// src/lib/users.service.ts

/**
 * List users with pagination and filtering
 */
export async function listUsers(
  supabase: SupabaseClient,
  query: ListUsersQuery,
  currentUser: User
): Promise<PaginatedResponse<UserDTO>> {
  // Authorization check
  if (isClient(currentUser)) {
    throw new ForbiddenError("Clients cannot list users");
  }

  const { role, status, trainerId, page = 1, limit = 20 } = query;

  // Force filters for trainers
  let effectiveRole = role;
  let effectiveTrainerId = trainerId;

  if (currentUser.role === "trainer") {
    effectiveRole = "trainee";
    effectiveTrainerId = currentUser.id;
  }

  // Build Supabase query
  let dbQuery = supabase.from("users").select("*", { count: "exact", head: false });

  // Apply role filter
  if (effectiveRole) {
    const dbRole = mapUserRoleFromDTO(effectiveRole);
    dbQuery = dbQuery.eq("role", dbRole);
  }

  // Apply status filter
  if (status) {
    if (status === "suspended") {
      dbQuery = dbQuery.eq("is_hidden", true);
    } else if (status === "active") {
      dbQuery = dbQuery.eq("is_hidden", false);
    }
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });

  // Execute query
  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database error in listUsers:", error);
    throw new DatabaseError("Failed to fetch users");
  }

  // Map to DTOs
  const userDTOs = (data || []).map(mapUserToDTO);

  return {
    data: userDTOs,
    meta: {
      page,
      limit,
      total: count || 0,
    },
  };
}
```

### Krok 3: Utworzenie API Route Handler

```typescript
// src/pages/api/users/index.ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { listUsers } from "@/lib/users.service";
import { ListUsersQuerySchema, parseQueryParams } from "@/lib/validation";
import { AppError } from "@/lib/errors";

/**
 * GET /api/users
 * List users with pagination and filtering
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);

    const validatedQuery = ListUsersQuerySchema.parse(rawQuery);

    // Call service
    const result = await listUsers(locals.supabase, validatedQuery, locals.user);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors...
  }
};
```

---

# 3. GET /users/:id - Szczegóły użytkownika

## 3.1. Przegląd punktu końcowego

Endpoint GET /users/:id służy do pobierania szczegółowych informacji o pojedynczym użytkowniku. Dostęp jest kontrolowany przez polityki autoryzacji - użytkownicy mogą zobaczyć własny profil, trenerzy mogą zobaczyć profile swoich podopiecznych, a administratorzy mają dostęp do wszystkich profili.

**Główne funkcjonalności:**

- Pobieranie szczegółów profilu użytkownika
- Kontrola dostępu oparta na rolach
- Zwracanie pełnych informacji profilowych

**Poziomy dostępu:**

- **Administrator**: ✅ Dostęp do wszystkich użytkowników
- **Trener**: ✅ Dostęp do własnego profilu i profili swoich podopiecznych
- **Podopieczny**: ✅ Dostęp tylko do własnego profilu

## 3.2. Szczegóły żądania

### Metoda HTTP

```
GET
```

### Struktura URL

```
/api/users/:id
```

### URL Parameters

| Parametr | Typ  | Wymagane | Opis           |
| -------- | ---- | -------- | -------------- |
| `id`     | UUID | ✅       | ID użytkownika |

### Przykładowe żądania

```bash
# Pobierz własny profil
curl -X GET "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {jwt_token}"

# Admin pobiera profil dowolnego użytkownika
curl -X GET "http://localhost:3000/api/users/{any_user_id}" \
  -H "Authorization: Bearer {admin_jwt}"

# Trener pobiera profil swojego podopiecznego
curl -X GET "http://localhost:3000/api/users/{trainee_id}" \
  -H "Authorization: Bearer {trainer_jwt}"
```

## 3.3. Szczegóły odpowiedzi

### Success Response (200 OK)

**Status Code:** `200`

**Body:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "trainer",
  "status": "active",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

## 3.4. Kroki implementacji

### Krok 1: Dodaj helper function do validation.ts

```typescript
// src/lib/validation.ts

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Schema for user ID param
 */
export const UserIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});
```

### Krok 2: Dodaj getUser do users.service.ts

```typescript
// src/lib/users.service.ts

/**
 * Get user by ID
 */
export async function getUser(supabase: SupabaseClient, userId: string, currentUser: User): Promise<UserDTO> {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Early authorization check for clients
  if (currentUser.role === "client" && currentUser.id !== userId) {
    throw new NotFoundError("User not found");
  }

  // Query user from database
  const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new NotFoundError("User not found");
    }
    console.error("Database error in getUser:", error);
    throw new DatabaseError("Failed to fetch user");
  }

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Authorization checks
  if (currentUser.role === "admin") {
    return mapUserToDTO(user);
  }

  if (currentUser.id === userId) {
    return mapUserToDTO(user);
  }

  if (currentUser.role === "trainer") {
    if (user.role !== "client") {
      throw new NotFoundError("User not found");
    }

    if (user.trainer_id !== currentUser.id) {
      throw new NotFoundError("User not found");
    }

    return mapUserToDTO(user);
  }

  throw new NotFoundError("User not found");
}
```

### Krok 3: Utwórz API Route Handler

```typescript
// src/pages/api/users/[id].ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUser } from "@/lib/users.service";
import { UserIdParamSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";

/**
 * GET /api/users/:id
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
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

    const { id: userId } = UserIdParamSchema.parse(params);

    const user = await getUser(locals.supabase, userId, locals.user);

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors...
  }
};
```

---

# 4. PUT /users/:id - Aktualizacja użytkownika

## 4.1. Przegląd punktu końcowego

Endpoint PUT /users/:id służy do aktualizacji danych użytkownika przez administratora lub trenera (dla swoich podopiecznych). Endpoint umożliwia zmianę profilu, statusu oraz przypisania trenera.

**Główne funkcjonalności:**

- Aktualizacja pól profilowych (firstName, lastName, email)
- Zmiana statusu użytkownika (active/suspended)
- Zmiana przypisanego trenera (dla podopiecznych)
- Partial updates (tylko podane pola są aktualizowane)

**Poziomy dostępu:**

- **Administrator**: ✅ Pełny dostęp - może aktualizować wszystkich użytkowników
- **Trener**: ✅ Ograniczony dostęp - może aktualizować tylko swoich podopiecznych
- **Podopieczny**: ❌ Brak dostępu (może używać osobnego endpointa do edycji profilu)

## 4.2. Szczegóły żądania

### Metoda HTTP

```
PUT
```

### Struktura URL

```
/api/users/:id
```

### URL Parameters

| Parametr | Typ  | Wymagane | Opis           |
| -------- | ---- | -------- | -------------- |
| `id`     | UUID | ✅       | ID użytkownika |

### Request Body (wszystkie pola opcjonalne)

```typescript
{
  "email"?: "newemail@example.com",
  "firstName"?: "John",
  "lastName"?: "Doe",
  "status"?: "active" | "suspended",
  "trainerId"?: "uuid" // Only for trainees
}
```

### Parametry Request Body

| Pole        | Typ    | Wymagane | Ograniczenia                | Opis                                         |
| ----------- | ------ | -------- | --------------------------- | -------------------------------------------- |
| `email`     | string | ⚠️       | Valid email, unique         | Nowy adres email                             |
| `firstName` | string | ⚠️       | Min 2, max 50 characters    | Nowe imię                                    |
| `lastName`  | string | ⚠️       | Min 2, max 50 characters    | Nowe nazwisko                                |
| `status`    | string | ⚠️       | Enum: "active", "suspended" | Nowy status (admin only)                     |
| `trainerId` | UUID   | ⚠️       | Valid UUID, must be trainer | Nowy trener (tylko dla trainees, admin only) |

**Uwaga:** Wszystkie pola są opcjonalne. Należy podać przynajmniej jedno pole do aktualizacji.

### Przykładowe żądania

```bash
# Admin aktualizuje email użytkownika
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'

# Admin zmienia status na suspended
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended"
  }'

# Trener aktualizuje dane swojego podopiecznego
curl -X PUT "http://localhost:3000/api/users/{trainee_id}" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Updated"
  }'
```

## 4.3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Request body interface
interface UpdateUserCommand {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus; // "active" | "suspended"
  trainerId?: UUID;
}

// Response - updated user
interface UserDTO {
  id: UUID;
  email: string;
  role: "admin" | "trainer" | "trainee";
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  trainerId?: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

## 4.4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Status Code:** `200`

**Body:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "updated@example.com",
  "role": "trainer",
  "status": "active",
  "firstName": "John",
  "lastName": "Updated",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T14:45:00.000Z"
}
```

## 4.5. Kroki implementacji

### Krok 1: Rozszerz validation.ts

```typescript
// src/lib/validation.ts

/**
 * Validation schema for PUT /api/users/:id
 */
export const UpdateUserCommandSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .toLowerCase()
      .transform((val) => val.trim())
      .optional(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters")
      .transform((val) => val.trim())
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters")
      .transform((val) => val.trim())
      .optional(),
    status: z.enum(["active", "suspended"]).optional(),
    trainerId: z.string().uuid("Invalid trainer ID format").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

### Krok 2: Dodaj updateUser do users.service.ts

```typescript
// src/lib/users.service.ts

/**
 * Update user by ID
 */
export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  command: UpdateUserCommand,
  currentUser: User
): Promise<UserDTO> {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch target user
  const { data: targetUser, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single();

  if (fetchError || !targetUser) {
    throw new NotFoundError("User not found");
  }

  // Authorization check
  if (currentUser.role === "client") {
    throw new ForbiddenError("Access denied");
  }

  if (currentUser.role === "trainer") {
    // Trainers can only update their trainees
    if (targetUser.role !== "client" || targetUser.trainer_id !== currentUser.id) {
      throw new ForbiddenError("Access denied");
    }

    // Trainers cannot change status or trainerId
    if (command.status !== undefined || command.trainerId !== undefined) {
      throw new ForbiddenError("Only administrators can change status or trainer");
    }
  }

  // Validate email uniqueness (if being changed)
  if (command.email && command.email !== targetUser.email) {
    const emailExists = await checkEmailExists(supabase, command.email, userId);
    if (emailExists) {
      throw new ConflictError("Email already exists");
    }
  }

  // Validate trainerId (if being changed, admin only)
  if (command.trainerId !== undefined && currentUser.role === "admin") {
    await validateTrainer(supabase, command.trainerId);
  }

  // Build update data
  const updateData = buildUpdateData(command, currentUser);

  // Execute update
  const { data: updatedUser, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update user:", error);
    throw new DatabaseError("Failed to update user");
  }

  // Log update action
  logUserUpdate(currentUser, userId, command);

  return mapUserToDTO(updatedUser);
}
```

### Krok 3: Dodaj PUT handler do API route

```typescript
// src/pages/api/users/[id].ts

/**
 * PUT /api/users/:id
 * Update user by ID
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
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

    const { id: userId } = UserIdParamSchema.parse(params);

    const body = await request.json();
    const validatedCommand = UpdateUserCommandSchema.parse(body);

    const updatedUser = await updateUser(locals.supabase, userId, validatedCommand, locals.user);

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors...
  }
};
```

---

## Podsumowanie

Ten kompleksowy plan implementacji zawiera pełną specyfikację dla wszystkich endpointów Users API:

✅ **POST /users** - Tworzenie użytkowników (admin only)  
✅ **GET /users** - Lista użytkowników z paginacją i filtrowaniem  
✅ **GET /users/:id** - Szczegóły pojedynczego użytkownika  
✅ **PUT /users/:id** - Aktualizacja użytkownika

**Kluczowe funkcjonalności:**

- Role-based access control (RBAC)
- Email validation i uniqueness checking
- Trainer-trainee relationships
- Partial updates dla PUT endpoint
- Comprehensive error handling
- Email activation dla nowych użytkowników
- Audit logging

**Wymagania techniczne:**

- Migracja bazy danych (first_name, last_name, trainer_id)
- Email service integration
- JWT authentication
- Zod validation dla wszystkich inputów
- RLS policies na poziomie bazy danych

**Znane ograniczenia MVP:**

- Email service wymaga konfiguracji
- Brak retry logic dla failed emails
- Brak cursor-based pagination
- Status "pending" wymaga dodatkowej implementacji
