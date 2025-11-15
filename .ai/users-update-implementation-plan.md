# API Endpoint Implementation Plan: PUT /users/:id

## 1. Przegląd punktu końcowego

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

## 2. Szczegóły żądania

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

# Admin zmienia trenera dla podopiecznego
curl -X PUT "http://localhost:3000/api/users/{trainee_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "trainerId": "new-trainer-uuid"
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

### Database Types

```typescript
type User = Tables<"users">;
type UserUpdate = TablesUpdate<"users">;
```

### Mapper Functions

```typescript
mapUserToDTO(user: User): UserDTO;
mapUserRoleToDTO(dbRole: UserRole): "admin" | "trainer" | "trainee";
```

## 4. Szczegóły odpowiedzi

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

### Error Responses

#### 400 Bad Request

**Przyczyny:**

- Brak pól do aktualizacji (empty body)
- Nieprawidłowy format email
- firstName/lastName za krótkie lub za długie
- Nieprawidłowa wartość status
- Nieprawidłowy format UUID dla trainerId
- Próba zmiany roli (niedozwolone przez ten endpoint)

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

- Trener próbuje aktualizować użytkownika który nie jest jego podopiecznym
- Trener próbuje zmienić status lub trainerId (admin only)
- Client próbuje aktualizować innych użytkowników
- Trener próbuje aktualizować innego trenera lub admina

**Body:**

```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

#### 404 Not Found

**Przyczyny:**

- Użytkownik o podanym ID nie istnieje
- trainerId wskazuje na nieistniejącego użytkownika
- trainerId wskazuje na użytkownika który nie jest trenerem

**Body:**

```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
}
```

#### 409 Conflict

**Przyczyny:**

- Nowy email już istnieje w systemie (należy do innego użytkownika)

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
Client Request (PUT /api/users/:id)
    ↓
[1] Astro Middleware
    ├─ Verify JWT token
    ├─ Extract user claims
    └─ Attach to context.locals.user
    ↓
[2] API Route Handler (src/pages/api/users/[id].ts)
    ├─ Extract :id from params
    ├─ Parse request body
    ├─ Validate with Zod schema
    └─ Call service layer
    ↓
[3] Users Service (src/lib/users.service.ts)
    ├─ Check authorization
    │   ├─ Admin: allow all
    │   ├─ Trainer: allow only own trainees + limited fields
    │   └─ Client: deny
    ├─ Fetch existing user (for validation)
    ├─ Validate changes
    │   ├─ Check email uniqueness (if changed)
    │   ├─ Validate trainerId exists (if changed)
    │   └─ Check trainer permissions
    ├─ Build update object
    └─ Execute update query
    ↓
[4] Supabase Database
    ├─ UPDATE users SET ... WHERE id = :id
    ├─ Check unique constraint on email
    ├─ Apply RLS policies
    └─ Return updated user
    ↓
[5] Transform & Response
    ├─ Map to UserDTO
    ├─ Transform role: 'client' → 'trainee'
    └─ Return 200 OK
    ↓
Client receives updated UserDTO
```

### Szczegółowy przepływ krok po kroku

#### Krok 1: Validate Input

```typescript
// Validate request body
const UpdateUserCommandSchema = z
  .object({
    email: z.string().email().toLowerCase().optional(),
    firstName: z.string().min(2).max(50).trim().optional(),
    lastName: z.string().min(2).max(50).trim().optional(),
    status: z.enum(["active", "suspended"]).optional(),
    trainerId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

#### Krok 2: Authorization Check

```typescript
// Authorization logic:
// - Admin: can update any user, all fields
// - Trainer: can update only own trainees, limited fields (no status, no trainerId)
// - Client: no access

async function authorizeUpdate(currentUser: User, targetUserId: string, command: UpdateUserCommand): Promise<void> {
  // Fetch target user
  const targetUser = await getUser(supabase, targetUserId);

  // Admin can update anyone
  if (currentUser.role === "admin") {
    return; // Full access
  }

  // Clients cannot update others
  if (currentUser.role === "client") {
    throw new ForbiddenError("Access denied");
  }

  // Trainers can only update their trainees
  if (currentUser.role === "trainer") {
    // Cannot update self or other trainers/admins
    if (targetUser.role !== "client") {
      throw new ForbiddenError("Access denied");
    }

    // Must be their trainee
    if (targetUser.trainer_id !== currentUser.id) {
      throw new ForbiddenError("Access denied");
    }

    // Trainers cannot change status or trainerId
    if (command.status !== undefined || command.trainerId !== undefined) {
      throw new ForbiddenError("Only administrators can change status or trainer");
    }

    return; // Limited access
  }

  throw new ForbiddenError("Access denied");
}
```

#### Krok 3: Validate Email Uniqueness

```typescript
// If email is being changed, check uniqueness
if (command.email && command.email !== currentEmail) {
  const { data: existing } = await supabase.from("users").select("id").eq("email", command.email).maybeSingle();

  if (existing && existing.id !== userId) {
    throw new ConflictError("Email already exists");
  }
}
```

#### Krok 4: Validate TrainerId

```typescript
// If trainerId is being changed (admin only), validate it
if (command.trainerId !== undefined) {
  const { data: trainer } = await supabase.from("users").select("id, role").eq("id", command.trainerId).single();

  if (!trainer) {
    throw new NotFoundError("Trainer not found");
  }

  if (trainer.role !== "trainer") {
    throw new ValidationError({ trainerId: "User is not a trainer" });
  }
}
```

#### Krok 5: Build Update Object

```typescript
// Build update object for database
const updateData: any = {};

if (command.email !== undefined) {
  updateData.email = command.email.toLowerCase();
}

if (command.firstName !== undefined) {
  updateData.first_name = command.firstName;
}

if (command.lastName !== undefined) {
  updateData.last_name = command.lastName;
}

// Admin-only fields
if (currentUser.role === "admin") {
  if (command.status !== undefined) {
    updateData.is_hidden = command.status === "suspended";
  }

  if (command.trainerId !== undefined) {
    updateData.trainer_id = command.trainerId;
  }
}

// Add updated_at timestamp
updateData.updated_at = new Date().toISOString();
```

#### Krok 6: Execute Update

```typescript
const { data: updatedUser, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single();

if (error) {
  throw new DatabaseError("Failed to update user");
}

return mapUserToDTO(updatedUser);
```

### Interakcje z zewnętrznymi usługami

**Supabase Database:**

- SELECT query (check email uniqueness, validate trainer)
- UPDATE query (update user)
- Unique constraint validation

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm:**

- JWT token w nagłówku Authorization
- Token weryfikowany przez middleware

### 6.2 Autoryzacja (Authorization)

**Access Control Matrix:**

| Current User | Target User | Allowed Fields             | Access |
| ------------ | ----------- | -------------------------- | ------ |
| **Admin**    | Anyone      | All fields                 | ✅ Yes |
| **Trainer**  | Own trainee | email, firstName, lastName | ✅ Yes |
| **Trainer**  | Other       | -                          | ❌ No  |
| **Client**   | Anyone      | -                          | ❌ No  |

**Field-level permissions:**

| Field     | Admin | Trainer | Client |
| --------- | ----- | ------- | ------ |
| email     | ✅    | ✅      | ❌     |
| firstName | ✅    | ✅      | ❌     |
| lastName  | ✅    | ✅      | ❌     |
| status    | ✅    | ❌      | ❌     |
| trainerId | ✅    | ❌      | ❌     |

### 6.3 Walidacja danych wejściowych

**Zod Schema:**

```typescript
const UpdateUserCommandSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().optional(),
    firstName: z.string().min(2, "First name too short").max(50, "First name too long").trim().optional(),
    lastName: z.string().min(2, "Last name too short").max(50, "Last name too long").trim().optional(),
    status: z.enum(["active", "suspended"]).optional(),
    trainerId: z.string().uuid("Invalid trainer ID").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

### 6.4 Zabezpieczenia przed atakami

**SQL Injection:**

- Chronione przez Supabase SDK (parametryzowane zapytania)

**Email Enumeration:**

- Zwracaj 409 Conflict tylko dla użytkowników z uprawnieniami
- Nie ujawniaj istnienia emaili dla nieautoryzowanych

**Privilege Escalation:**

- Trener nie może zmienić własnej roli na admina
- Rolę można zmienić tylko przez bezpośrednią operację DB (nie API)
- Field-level validation zapobiega nieautoryzowanym zmianom

**Race Conditions:**

- Email uniqueness check może mieć race condition
- Rozwiązanie: unique constraint w bazie danych (ostateczna weryfikacja)

### 6.5 Audit Log

**Zalecenia:**

- Loguj wszystkie zmiany użytkowników
- Zapisuj kto, kiedy i co zmienił
- Szczególnie ważne dla zmian statusu i trainerId

```typescript
// Log update action
console.log({
  timestamp: new Date().toISOString(),
  action: "USER_UPDATE",
  actorId: currentUser.id,
  actorRole: currentUser.role,
  targetUserId: userId,
  changes: command,
});
```

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod                | Status | Przyczyna                                  | Akcja użytkownika                     |
| ------------------ | ------ | ------------------------------------------ | ------------------------------------- |
| `UNAUTHORIZED`     | 401    | Brak lub nieprawidłowy JWT                 | Zaloguj się ponownie                  |
| `FORBIDDEN`        | 403    | Brak uprawnień do aktualizacji użytkownika | Poproś admina lub sprawdź uprawnienia |
| `VALIDATION_ERROR` | 400    | Nieprawidłowe dane wejściowe               | Popraw dane zgodnie z details         |
| `NOT_FOUND`        | 404    | Użytkownik lub trainer nie istnieje        | Sprawdź ID                            |
| `CONFLICT`         | 409    | Email już istnieje                         | Użyj innego emaila                    |
| `DATABASE_ERROR`   | 500    | Błąd bazy danych                           | Spróbuj ponownie później              |
| `INTERNAL_ERROR`   | 500    | Nieoczekiwany błąd                         | Skontaktuj się z supportem            |

### 7.2 Error Handling w Service

```typescript
export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  command: UpdateUserCommand,
  currentUser: User
): Promise<UserDTO> {
  // Validate UUID
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch target user
  const { data: targetUser, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single();

  if (fetchError || !targetUser) {
    throw new NotFoundError("User not found");
  }

  // Authorization check
  await authorizeUpdate(currentUser, targetUser, command);

  // Validate email uniqueness
  if (command.email && command.email !== targetUser.email) {
    const emailExists = await checkEmailExists(supabase, command.email, userId);
    if (emailExists) {
      throw new ConflictError("Email already exists");
    }
  }

  // Validate trainerId
  if (command.trainerId !== undefined) {
    await validateTrainer(supabase, command.trainerId);
  }

  // Build update object
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

### 7.3 Edge Cases

**Scenariusz 1: Email zmieniony na istniejący (race condition)**

- Unique constraint w DB zapobiega
- Zwróć 409 Conflict

**Scenariusz 2: Trener zmienia trainerId dla swojego podopiecznego**

- Zabronione (tylko admin)
- Zwróć 403 Forbidden

**Scenariusz 3: Admin zmienia status na "pending"**

- "pending" nie jest dozwolony przez PUT (tylko active/suspended)
- Pending jest tylko dla nowych użytkowników

**Scenariusz 4: Update bez zmian (same dane)**

- Dozwolone
- Zwróć 200 OK z istniejącymi danymi
- updated_at zostanie zaktualizowane

**Scenariusz 5: Trainer próbuje zmienić własny email**

- Może być dozwolone (self-update)
- Alternatywnie: osobny endpoint dla self-update

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**Problem 1: Multiple validation queries**

- Check email existence: 1 query
- Validate trainer: 1 query
- Fetch target user: 1 query
- Update: 1 query
- Total: 4 queries
- Rozwiązanie: Batch queries lub trust database constraints

**Problem 2: Email uniqueness race condition**

- Check → Update może mieć race
- Rozwiązanie: Unique constraint w DB (ostateczna weryfikacja)

**Problem 3: N+1 dla batch updates**

- Nie dotyczy (pojedynczy update)

### 8.2 Strategie optymalizacji

#### Optymalizacja 1: Minimize queries

```typescript
// Combine fetch + authorization in single query
const { data: targetUser } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .or(`id.eq.${currentUser.id},trainer_id.eq.${currentUser.id}`)
  .single();
```

#### Optymalizacja 2: Trust database constraints

```typescript
// Skip email check, let DB handle it
// Catch unique constraint error and return 409
try {
  await supabase.from("users").update(...);
} catch (error) {
  if (error.code === "23505") {
    // Unique violation
    throw new ConflictError("Email already exists");
  }
  throw error;
}
```

#### Optymalizacja 3: Cache invalidation

```typescript
// If using cache, invalidate on update
await redis.del(`user:${userId}`);
```

### 8.3 Monitoring

**Metryki:**

- Update frequency (updates/hour)
- Field change frequency (które pola najczęściej zmieniane)
- Authorization denial rate
- Error rate by type

## 9. Kroki implementacji

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

### Krok 2: Dodaj helper functions do users.service.ts

```typescript
// src/lib/users.service.ts

/**
 * Check if email exists (excluding specific user)
 */
async function checkEmailExists(supabase: SupabaseClient, email: string, excludeUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .neq("id", excludeUserId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError("Failed to check email uniqueness");
  }

  return !!data;
}

/**
 * Build update data object for database
 */
function buildUpdateData(command: UpdateUserCommand, currentUser: User): Record<string, any> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (command.email !== undefined) {
    updateData.email = command.email.toLowerCase();
  }

  if (command.firstName !== undefined) {
    updateData.first_name = command.firstName;
  }

  if (command.lastName !== undefined) {
    updateData.last_name = command.lastName;
  }

  // Admin-only fields
  if (currentUser.role === "admin") {
    if (command.status !== undefined) {
      updateData.is_hidden = command.status === "suspended";
    }

    if (command.trainerId !== undefined) {
      updateData.trainer_id = command.trainerId;
    }
  }

  return updateData;
}

/**
 * Log user update action
 */
function logUserUpdate(actor: User, targetUserId: string, changes: UpdateUserCommand): void {
  console.log({
    timestamp: new Date().toISOString(),
    action: "USER_UPDATE",
    actorId: actor.id,
    actorRole: actor.role,
    targetUserId,
    changes,
  });
}
```

### Krok 3: Dodaj updateUser do users.service.ts

```typescript
// src/lib/users.service.ts

/**
 * Update user by ID (admin or trainer for their trainees)
 *
 * Authorization:
 * - Admin: can update any user, all fields
 * - Trainer: can update own trainees, limited fields (no status, trainerId)
 * - Client: no access
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

  // Admin can update anyone (no additional checks)

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

### Krok 4: Dodaj PUT handler do API route

```typescript
// src/pages/api/users/[id].ts

/**
 * PUT /api/users/:id
 * Update user by ID
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // Validate user ID param
    const { id: userId } = UserIdParamSchema.parse(params);

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = UpdateUserCommandSchema.parse(body);

    // Call service
    const updatedUser = await updateUser(locals.supabase, userId, validatedCommand, locals.user);

    // Return success response
    return new Response(JSON.stringify(updatedUser), {
      status: 200,
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
    console.error("Unexpected error in PUT /api/users/:id:", error);
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

### Krok 5: Testing

**5.1. Testy jednostkowe**

```typescript
describe("updateUser", () => {
  it("should update user for admin", async () => {
    // Mock current user as admin
    // Mock target user
    // Call updateUser with changes
    // Assert user updated
  });

  it("should update trainee for trainer", async () => {
    // Mock trainer as current user
    // Mock trainee with trainer_id = trainer.id
    // Call updateUser with allowed fields
    // Assert user updated
  });

  it("should throw ForbiddenError if trainer updates status", async () => {
    // Mock trainer
    // Try to update status
    // Expect ForbiddenError
  });

  it("should throw ConflictError if email exists", async () => {
    // Mock existing user with email
    // Try to update to that email
    // Expect ConflictError
  });

  it("should throw ForbiddenError for client", async () => {
    // Mock client as current user
    // Expect ForbiddenError
  });

  it("should throw ValidationError for empty body", async () => {
    // Call updateUser with empty command
    // Expect ValidationError
  });
});
```

**5.2. Testy integracyjne**

```bash
# Test 1: Admin updates email
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"email": "newemail@test.com"}'
# Expected: 200 OK

# Test 2: Admin suspends user
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended"}'
# Expected: 200 OK

# Test 3: Trainer updates own trainee
curl -X PUT "http://localhost:3000/api/users/{trainee_id}" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Updated", "lastName": "Name"}'
# Expected: 200 OK

# Test 4: Trainer tries to change status (should fail)
curl -X PUT "http://localhost:3000/api/users/{trainee_id}" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended"}'
# Expected: 403 Forbidden

# Test 5: Duplicate email (should fail)
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@test.com"}'
# Expected: 409 Conflict

# Test 6: Empty body (should fail)
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 Bad Request

# Test 7: Client tries to update (should fail)
curl -X PUT "http://localhost:3000/api/users/{user_id}" \
  -H "Authorization: Bearer {client_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test"}'
# Expected: 403 Forbidden
```

### Krok 6: Dokumentacja

```yaml
/api/users/{id}:
  put:
    summary: Update user
    description: Update user profile, status, or trainer (admin or trainer for their trainees)
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
          format: uuid
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
              firstName:
                type: string
                minLength: 2
                maxLength: 50
              lastName:
                type: string
                minLength: 2
                maxLength: 50
              status:
                type: string
                enum: [active, suspended]
                description: Admin only
              trainerId:
                type: string
                format: uuid
                description: Admin only
    responses:
      200:
        description: User updated successfully
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UserDTO"
      400:
        description: Validation error
      401:
        description: Unauthorized
      403:
        description: Forbidden
      404:
        description: User not found
      409:
        description: Email already exists
      500:
        description: Internal server error
```

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowe wskazówki dla wdrożenia endpointa **PUT /users/:id**. Plan obejmuje:

✅ Szczegółową specyfikację API z partial updates  
✅ Definicje typów i interfejsów  
✅ Zaawansowaną logikę autoryzacji (field-level permissions)  
✅ Walidację uniqueness i referential integrity  
✅ Obsługę błędów (409 Conflict, field restrictions)  
✅ Audit logging  
✅ Strategie wydajnościowe  
✅ Krok po kroku instrukcje implementacji  
✅ Kompletne przykłady testów

**Kluczowe punkty:**

- Admin może aktualizować wszystkich użytkowników, wszystkie pola
- Trener może aktualizować tylko swoich podopiecznych, ograniczone pola
- Client nie ma dostępu
- Partial updates (tylko podane pola są zmieniane)
- Email uniqueness enforcement
- Field-level authorization (status, trainerId tylko dla admina)
- Audit logging wszystkich zmian

**Znane ograniczenia:**

- Brak self-update dla użytkowników (może być osobny endpoint)
- Brak historii zmian (audit log tylko w console)
- Brak walidacji business rules (np. czy trainee może być bez trenera)

Ten endpoint umożliwia zarządzanie użytkownikami z precyzyjną kontrolą dostępu.
