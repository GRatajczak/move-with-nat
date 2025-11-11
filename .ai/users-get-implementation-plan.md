# API Endpoint Implementation Plan: GET /users/:id

## 1. Przegląd punktu końcowego

Endpoint GET /users/:id służy do pobierania szczegółowych informacji o pojedynczym użytkowniku. Dostęp jest kontrolowany przez polityki autoryzacji - użytkownicy mogą zobaczyć własny profil, trenerzy mogą zobaczyć profile swoich podopiecznych, a administratorzy mają dostęp do wszystkich profili.

**Główne funkcjonalności:**

- Pobieranie szczegółów profilu użytkownika
- Kontrola dostępu oparta na rolach
- Zwracanie pełnych informacji profilowych

**Poziomy dostępu:**

- **Administrator**: ✅ Dostęp do wszystkich użytkowników
- **Trener**: ✅ Dostęp do własnego profilu i profili swoich podopiecznych
- **Podopieczny**: ✅ Dostęp tylko do własnego profilu

## 2. Szczegóły żądania

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
curl -X GET "http://localhost:4321/api/users/{user_id}" \
  -H "Authorization: Bearer {jwt_token}"

# Admin pobiera profil dowolnego użytkownika
curl -X GET "http://localhost:4321/api/users/{any_user_id}" \
  -H "Authorization: Bearer {admin_jwt}"

# Trener pobiera profil swojego podopiecznego
curl -X GET "http://localhost:4321/api/users/{trainee_id}" \
  -H "Authorization: Bearer {trainer_jwt}"
```

### Request Headers

```
Authorization: Bearer {jwt_token}
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Response DTO
interface UserDTO {
  id: UUID;
  email: string;
  role: "admin" | "trainer" | "trainee";
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  trainerId?: UUID; // Only for trainees
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Extended user details (optional for future)
interface UserDetailsDTO extends UserDTO {
  traineeCount?: number; // For trainers
  trainerName?: string; // For trainees
}
```

### Database Types

```typescript
type User = Tables<"users">;
type UserRole = Enums<"user_role">;
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
  "email": "user@example.com",
  "role": "trainer",
  "status": "active",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**For trainee (client):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "client@example.com",
  "role": "trainee",
  "status": "active",
  "firstName": "Jane",
  "lastName": "Smith",
  "trainerId": "223e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2025-01-16T14:20:00.000Z",
  "updatedAt": "2025-01-16T14:20:00.000Z"
}
```

### Error Responses

#### 400 Bad Request

**Przyczyny:**

- Nieprawidłowy format UUID w parametrze :id

**Body:**

```json
{
  "error": "Invalid user ID format",
  "code": "VALIDATION_ERROR"
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

- Trainee próbuje zobaczyć profil innego użytkownika
- Trener próbuje zobaczyć profil użytkownika który nie jest jego podopiecznym
- Trener próbuje zobaczyć profil innego trenera

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
- Użytkownik jest ukryty (is_hidden=true) i requester nie ma uprawnień

**Body:**

```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
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
Client Request (GET /api/users/:id)
    ↓
[1] Astro Middleware
    ├─ Verify JWT token
    ├─ Extract user claims
    └─ Attach to context.locals.user
    ↓
[2] API Route Handler (src/pages/api/users/[id].ts)
    ├─ Extract :id from params
    ├─ Validate UUID format
    └─ Call service layer
    ↓
[3] Users Service (src/lib/users.service.ts)
    ├─ Check authorization
    │   ├─ Admin: allow all
    │   ├─ Self: allow if id === currentUser.id
    │   ├─ Trainer: allow if target is their trainee
    │   └─ Client: deny if not self
    ├─ Query database for user
    └─ Apply RLS policies
    ↓
[4] Supabase Database
    ├─ SELECT from users WHERE id = :id
    ├─ Apply RLS policies (automatic)
    └─ Return user or null
    ↓
[5] Transform & Response
    ├─ Check if user found (404 if null)
    ├─ Map to UserDTO
    ├─ Transform role: 'client' → 'trainee'
    └─ Return 200 OK
    ↓
Client receives UserDTO
```

### Szczegółowy przepływ krok po kroku

#### Krok 1: Validate User ID

```typescript
// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!uuidRegex.test(userId)) {
  throw new ValidationError({ id: "Invalid UUID format" });
}
```

#### Krok 2: Authorization Logic

```typescript
// Authorization matrix:
// - Admin: can view any user
// - User: can view own profile
// - Trainer: can view own profile + own trainees
// - Client: can only view own profile

function canViewUser(currentUser: User, targetUserId: string): boolean {
  // Admin can view all
  if (currentUser.role === "admin") {
    return true;
  }

  // Self can always view
  if (currentUser.id === targetUserId) {
    return true;
  }

  // Trainer can view their trainees (requires checking trainer_id)
  if (currentUser.role === "trainer") {
    // Need to check if targetUser.trainer_id === currentUser.id
    // This is done in the query
    return true; // Allow query, let DB/service filter
  }

  // Client cannot view others
  if (currentUser.role === "client") {
    return false;
  }

  return false;
}
```

#### Krok 3: Database Query

```typescript
// Query user by ID
const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single();

if (error || !user) {
  throw new NotFoundError("User not found");
}

// Additional authorization check for trainers
if (currentUser.role === "trainer" && currentUser.id !== userId) {
  // Check if target user is a trainee of current trainer
  if (user.role === "client" && user.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Access denied");
  }
  // Trainers cannot view other trainers or admins
  if (user.role !== "client") {
    throw new ForbiddenError("Access denied");
  }
}
```

#### Krok 4: Transform to DTO

```typescript
const userDTO = mapUserToDTO(user);
return userDTO;
```

### Interakcje z zewnętrznymi usługami

**Supabase Database:**

- Single SELECT query by ID
- RLS policies applied automatically
- No external API calls needed

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm:**

- JWT token w nagłówku Authorization
- Token weryfikowany przez middleware
- Token zawiera user_id i role

### 6.2 Autoryzacja (Authorization)

**Access Control Matrix:**

| Current User Role | Target User | Access |
| ----------------- | ----------- | ------ |
| **Admin**         | Anyone      | ✅ Yes |
| **Trainer**       | Self        | ✅ Yes |
| **Trainer**       | Own trainee | ✅ Yes |
| **Trainer**       | Other       | ❌ No  |
| **Client**        | Self        | ✅ Yes |
| **Client**        | Other       | ❌ No  |

**Implementation:**

```typescript
async function authorizeUserAccess(currentUser: User, targetUserId: string, targetUser: User | null): Promise<boolean> {
  // Admin always allowed
  if (currentUser.role === "admin") {
    return true;
  }

  // Self always allowed
  if (currentUser.id === targetUserId) {
    return true;
  }

  // Client cannot access others
  if (currentUser.role === "client") {
    throw new ForbiddenError("Access denied");
  }

  // Trainer can access their trainees only
  if (currentUser.role === "trainer") {
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // Can only view clients (trainees)
    if (targetUser.role !== "client") {
      throw new ForbiddenError("Access denied");
    }

    // Must be their trainee
    if (targetUser.trainer_id !== currentUser.id) {
      throw new ForbiddenError("Access denied");
    }

    return true;
  }

  return false;
}
```

### 6.3 Walidacja danych wejściowych

**UUID Validation:**

```typescript
const UserIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});
```

### 6.4 Information Disclosure

**Zabezpieczenia:**

- Nie ujawniaj czy użytkownik istnieje dla nieautoryzowanych requestów
- Zwracaj 404 zarówno dla nieistniejącego jak i niedostępnego użytkownika
- Nie ujawniaj szczegółów błędów autoryzacji

**Bad practice:**

```typescript
// DON'T: Reveals if user exists
if (!user) throw new NotFoundError("User not found");
if (!canAccess) throw new ForbiddenError("You cannot access this user");
```

**Good practice:**

```typescript
// DO: Generic error for both cases
if (!user || !canAccess) {
  throw new NotFoundError("User not found");
}
```

### 6.5 Row-Level Security (RLS)

**RLS Policies:**

```sql
-- Users can view themselves
CREATE POLICY users_select_self ON users FOR SELECT
USING (id = current_setting('request.jwt.claims.sub')::uuid);

-- Admins can view all
CREATE POLICY users_select_admin ON users FOR SELECT
USING (current_setting('request.jwt.claims.role') = 'admin');

-- Trainers can view their trainees (requires trainer_id column)
CREATE POLICY users_select_trainer_trainees ON users FOR SELECT
USING (
  current_setting('request.jwt.claims.role') = 'trainer' AND
  trainer_id = current_setting('request.jwt.claims.sub')::uuid
);
```

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod                | Status | Przyczyna                               | Akcja użytkownika                     |
| ------------------ | ------ | --------------------------------------- | ------------------------------------- |
| `UNAUTHORIZED`     | 401    | Brak lub nieprawidłowy JWT              | Zaloguj się ponownie                  |
| `FORBIDDEN`        | 403    | Brak uprawnień do tego użytkownika      | Poproś o dostęp lub użyj innego konta |
| `VALIDATION_ERROR` | 400    | Nieprawidłowy format UUID               | Popraw format ID                      |
| `NOT_FOUND`        | 404    | Użytkownik nie istnieje lub niedostępny | Sprawdź ID                            |
| `DATABASE_ERROR`   | 500    | Błąd bazy danych                        | Spróbuj ponownie później              |
| `INTERNAL_ERROR`   | 500    | Nieoczekiwany błąd                      | Skontaktuj się z supportem            |

### 7.2 Error Handling w Service

```typescript
export async function getUser(supabase: SupabaseClient, userId: string, currentUser: User): Promise<UserDTO> {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Preliminary authorization check
  if (currentUser.role === "client" && currentUser.id !== userId) {
    throw new NotFoundError("User not found"); // Generic error
  }

  // Query user
  const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    console.error("Database error in getUser:", error);
    throw new DatabaseError("Failed to fetch user");
  }

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Authorization check for trainers
  if (currentUser.role === "trainer" && currentUser.id !== userId) {
    // Trainer can only view their trainees
    if (user.role !== "client" || user.trainer_id !== currentUser.id) {
      throw new NotFoundError("User not found"); // Generic error
    }
  }

  // Map to DTO
  return mapUserToDTO(user);
}
```

### 7.3 Edge Cases

**Scenariusz 1: Użytkownik ukryty (is_hidden=true)**

- Admin: może zobaczyć (z flagą status="suspended")
- Trainer/Client: 404 Not Found

**Scenariusz 2: Trainer usunięty, ale trainee istnieje**

- trainee.trainer_id wskazuje na nieistniejącego użytkownika
- Zwracamy trainee z trainerId (może być null)

**Scenariusz 3: Self-access (id === currentUser.id)**

- Zawsze dozwolone dla wszystkich ról
- Najbardziej efektywna ścieżka (skip dodatkowych checks)

**Scenariusz 4: UUID case sensitivity**

- UUID powinno być case-insensitive
- Normalize do lowercase przed query

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**Problem 1: Multiple authorization queries**

- Query user + query trainer relationship
- Rozwiązanie: Single query z JOIN (jeśli potrzebne)

**Problem 2: RLS policy overhead**

- Każde query wykonuje RLS checks
- Rozwiązanie: Trust RLS, minimize application-level checks

**Problem 3: Brak caching**

- Każdy request idzie do bazy
- Rozwiązanie: Redis cache dla user profiles (TTL 5 min)

### 8.2 Strategie optymalizacji

#### Optymalizacja 1: Single query with authorization

```typescript
// Instead of multiple queries, use single query with filters
const { data: user, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .or(`id.eq.${currentUser.id},trainer_id.eq.${currentUser.id}`)
  .single();
```

#### Optymalizacja 2: Response caching

```typescript
// Cache user profiles (short TTL)
const cacheKey = `user:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const user = await fetchUserFromDB(userId);
await redis.setex(cacheKey, 300, JSON.stringify(user)); // 5 min TTL
return user;
```

#### Optymalizacja 3: Index on trainer_id

```sql
-- Already created in migration
CREATE INDEX idx_users_trainer_id ON users(trainer_id);
```

### 8.3 Monitoring

**Metryki:**

- Response time (p50, p95, p99)
- Cache hit rate
- Authorization denial rate
- Query execution time

## 9. Kroki implementacji

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
 *
 * Authorization:
 * - Admin: can view any user
 * - User: can view own profile
 * - Trainer: can view own profile + own trainees
 * - Client: can only view own profile
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
      // Not found
      throw new NotFoundError("User not found");
    }
    console.error("Database error in getUser:", error);
    throw new DatabaseError("Failed to fetch user");
  }

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Authorization checks
  // Admin can view all
  if (currentUser.role === "admin") {
    return mapUserToDTO(user);
  }

  // Self can view
  if (currentUser.id === userId) {
    return mapUserToDTO(user);
  }

  // Trainer can view their trainees only
  if (currentUser.role === "trainer") {
    // Can only view clients (trainees)
    if (user.role !== "client") {
      throw new NotFoundError("User not found");
    }

    // Must be their trainee
    if (user.trainer_id !== currentUser.id) {
      throw new NotFoundError("User not found");
    }

    return mapUserToDTO(user);
  }

  // Default: deny
  throw new NotFoundError("User not found");
}
```

### Krok 3: Rozszerz mapUserToDTO

```typescript
// src/types.ts

/**
 * Maps database user to DTO
 * Includes trainer_id for clients
 */
export function mapUserToDTO(user: User): UserDTO {
  const dto: UserDTO = {
    id: user.id,
    email: user.email,
    role: mapUserRoleToDTO(user.role),
    status: user.is_hidden ? "suspended" : "active",
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  // Add optional fields if they exist
  if (user.first_name) dto.firstName = user.first_name;
  if (user.last_name) dto.lastName = user.last_name;

  // Add trainerId for clients (trainees)
  if (user.role === "client" && user.trainer_id) {
    dto.trainerId = user.trainer_id;
  }

  return dto;
}
```

### Krok 4: Utwórz API Route Handler

**4.1. Utwórz src/pages/api/users/[id].ts**

```typescript
// src/pages/api/users/[id].ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUser } from "@/lib/users.service";
import { UserIdParamSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";

/**
 * GET /api/users/:id
 * Get user by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Call service
    const user = await getUser(locals.supabase, userId, locals.user);

    // Return success response
    return new Response(JSON.stringify(user), {
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
          error: "Invalid user ID",
          code: "VALIDATION_ERROR",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in GET /api/users/:id:", error);
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
// src/lib/users.service.test.ts

describe("getUser", () => {
  it("should return user for admin", async () => {
    // Mock Supabase to return target user
    // Mock current user as admin
    // Call getUser
    // Assert user returned
  });

  it("should return own profile for any user", async () => {
    // Mock current user
    // Call getUser with currentUser.id
    // Assert user returned
  });

  it("should return trainee profile for trainer", async () => {
    // Mock trainer as current user
    // Mock trainee with trainer_id = trainer.id
    // Call getUser
    // Assert trainee returned
  });

  it("should throw NotFoundError for trainer viewing other trainer", async () => {
    // Mock trainer as current user
    // Mock another trainer
    // Expect getUser to throw NotFoundError
  });

  it("should throw NotFoundError for client viewing other user", async () => {
    // Mock client as current user
    // Mock another user
    // Expect getUser to throw NotFoundError
  });

  it("should throw ValidationError for invalid UUID", async () => {
    // Call getUser with invalid UUID
    // Expect ValidationError
  });

  it("should throw NotFoundError for non-existent user", async () => {
    // Mock Supabase to return null
    // Expect NotFoundError
  });
});
```

**5.2. Testy integracyjne**

```bash
# Test 1: Get own profile
curl -X GET "http://localhost:4321/api/users/{user_id}" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with UserDTO

# Test 2: Admin gets any user
curl -X GET "http://localhost:4321/api/users/{any_user_id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 200 OK

# Test 3: Trainer gets own trainee
curl -X GET "http://localhost:4321/api/users/{trainee_id}" \
  -H "Authorization: Bearer {trainer_jwt}"
# Expected: 200 OK

# Test 4: Trainer tries to get other trainer (should fail)
curl -X GET "http://localhost:4321/api/users/{other_trainer_id}" \
  -H "Authorization: Bearer {trainer_jwt}"
# Expected: 404 Not Found

# Test 5: Client tries to get other user (should fail)
curl -X GET "http://localhost:4321/api/users/{other_user_id}" \
  -H "Authorization: Bearer {client_jwt}"
# Expected: 404 Not Found

# Test 6: Invalid UUID
curl -X GET "http://localhost:4321/api/users/invalid-uuid" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 400 Bad Request

# Test 7: Non-existent user
curl -X GET "http://localhost:4321/api/users/123e4567-e89b-12d3-a456-426614174999" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 404 Not Found

# Test 8: No authentication
curl -X GET "http://localhost:4321/api/users/{user_id}"
# Expected: 401 Unauthorized
```

**5.3. Expected Results**

| Test                       | Expected Status | Expected Result   |
| -------------------------- | --------------- | ----------------- |
| Get own profile            | 200             | UserDTO           |
| Admin gets any user        | 200             | UserDTO           |
| Trainer gets own trainee   | 200             | UserDTO           |
| Trainer gets other trainer | 404             | NotFoundError     |
| Client gets other user     | 404             | NotFoundError     |
| Invalid UUID               | 400             | ValidationError   |
| Non-existent user          | 404             | NotFoundError     |
| No authentication          | 401             | UnauthorizedError |

### Krok 6: Dokumentacja

**6.1. OpenAPI/Swagger spec**

```yaml
/api/users/{id}:
  get:
    summary: Get user by ID
    description: Retrieve detailed information about a user
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
          format: uuid
        description: User ID
    responses:
      200:
        description: Success
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UserDTO"
      400:
        description: Invalid user ID format
      401:
        description: Unauthorized
      403:
        description: Forbidden
      404:
        description: User not found
      500:
        description: Internal server error
```

### Krok 7: Deployment

**7.1. Pre-deployment checklist**

- [ ] Wszystkie testy przechodzą
- [ ] Linter OK
- [ ] RLS policies weryfikowane
- [ ] Authorization logic przetestowana

**7.2. Post-deployment validation**

- [ ] Test all authorization scenarios
- [ ] Verify RLS policies work correctly
- [ ] Monitor error logs
- [ ] Check response times

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowe wskazówki dla wdrożenia endpointa **GET /users/:id**. Plan obejmuje:

✅ Szczegółową specyfikację API  
✅ Definicje typów i interfejsów  
✅ Zaawansowaną logikę autoryzacji (role-based + relationship-based)  
✅ Walidację UUID  
✅ Obsługę błędów z generic 404 dla security  
✅ Strategie wydajnościowe (caching, single query)  
✅ Krok po kroku instrukcje implementacji  
✅ Kompletne przykłady testów

**Kluczowe punkty:**

- Admin może zobaczyć wszystkich użytkowników
- Każdy użytkownik może zobaczyć własny profil
- Trener może zobaczyć tylko swoich podopiecznych
- Klient może zobaczyć tylko siebie
- Generic 404 dla nieautoryzowanych requestów (security)
- RLS policies jako dodatkowa warstwa zabezpieczeń

**Znane ograniczenia:**

- Wymaga kolumny trainer_id w tabeli users
- Brak rozszerzonych informacji (np. liczba podopiecznych)
- Brak caching (MVP)

Ten endpoint stanowi fundament dla operacji CRUD na użytkownikach.
