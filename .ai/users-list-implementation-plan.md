# API Endpoint Implementation Plan: GET /users

## 1. Przegląd punktu końcowego

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

## 2. Szczegóły żądania

### Metoda HTTP

```
GET
```

### Struktura URL

```
/api/users
```

### Query Parameters

#### Opcjonalne parametry:

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

### Request Headers

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## 3. Wykorzystywane typy

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

### Database Types

```typescript
// Typ użytkownika z bazy danych
type User = Tables<"users">; // z database.types.ts

// Enum roli z bazy danych
type UserRole = Enums<"user_role">; // 'admin' | 'trainer' | 'client'
```

### Helper Types

```typescript
type UUID = string;
type ISODateTime = string;
type UserStatus = "active" | "pending" | "suspended";
```

### Mapper Functions

```typescript
// Funkcje z types.ts
mapUserRoleToDTO(dbRole: UserRole): "admin" | "trainer" | "trainee"
mapUserRoleFromDTO(apiRole: "admin" | "trainer" | "trainee"): UserRole
mapUserToDTO(user: User): UserDTO
```

## 4. Szczegóły odpowiedzi

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

### Error Responses

#### 400 Bad Request

**Przyczyny:**

- Nieprawidłowy format UUID dla `trainerId`
- Wartość `page` lub `limit` poza dozwolonym zakresem
- Nieprawidłowa wartość enum dla `role` lub `status`

**Body:**

```json
{
  "error": "Invalid query parameters",
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

- Trainee próbuje uzyskać dostęp do endpointa
- Trener próbuje zobaczyć użytkowników spoza swojej grupy

**Body:**

```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
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
Client Request
    ↓
[1] Astro Middleware (src/middleware/index.ts)
    ├─ Verify JWT token
    ├─ Extract user claims (id, role)
    └─ Attach to context.locals.user
    ↓
[2] API Route Handler (src/pages/api/users/index.ts)
    ├─ Parse query parameters
    ├─ Validate with Zod schema
    └─ Call service layer
    ↓
[3] Users Service (src/lib/users.service.ts)
    ├─ Check authorization (role-based)
    ├─ Build Supabase query with filters
    ├─ Apply RLS policies automatically
    ├─ Execute count query (total)
    ├─ Execute data query (paginated)
    └─ Map DB results to DTOs
    ↓
[4] Supabase Database
    ├─ Apply RLS policies
    ├─ Filter by role/status/trainerId
    ├─ Apply pagination (offset/limit)
    └─ Return results
    ↓
[5] Transform & Response
    ├─ Map users: User[] → UserDTO[]
    ├─ Transform role: 'client' → 'trainee'
    ├─ Transform status: is_hidden → 'suspended'
    └─ Build PaginatedResponse
    ↓
Client receives JSON response
```

### Szczegółowy przepływ krok po kroku

#### Krok 1: Middleware Authentication

```typescript
// src/middleware/index.ts
- Odczyt JWT z nagłówka Authorization
- Weryfikacja tokenu przez Supabase Auth
- Ekstrakcja claims: user_id, role
- Przypisanie do context.locals.user
```

#### Krok 2: Request Validation

```typescript
// src/pages/api/users/index.ts
- Parse URL query parameters
- Validate with Zod schema:
  - role: z.enum(['admin', 'trainer', 'trainee']).optional()
  - status: z.enum(['active', 'pending', 'suspended']).optional()
  - trainerId: z.string().uuid().optional()
  - page: z.number().int().min(1).default(1)
  - limit: z.number().int().min(1).max(100).default(20)
- Return 400 if validation fails
```

#### Krok 3: Authorization Check

```typescript
// src/lib/users.service.ts
- If user.role === 'client': throw 403 Forbidden
- If user.role === 'trainer':
  - Force filter by trainerId = user.id (can only see own trainees)
  - Ignore role/status filters for security
- If user.role === 'admin':
  - Allow all filters
```

#### Krok 4: Database Query Construction

```typescript
// Build Supabase query
let query = supabase.from("users").select("*", { count: "exact" });

// Apply filters
if (role) {
  const dbRole = mapUserRoleFromDTO(role); // 'trainee' → 'client'
  query = query.eq("role", dbRole);
}

if (status) {
  if (status === "suspended") {
    query = query.eq("is_hidden", true);
  } else if (status === "active") {
    query = query.eq("is_hidden", false);
  }
  // 'pending' - może wymagać dodatkowej logiki
}

if (trainerId && role === "trainee") {
  // Join or filter logic - zależnie od struktury
  // Może wymagać dodatkowej kolumny trainer_id w users
}

// Pagination
const offset = (page - 1) * limit;
query = query.range(offset, offset + limit - 1);

// Ordering
query = query.order("created_at", { ascending: false });
```

#### Krok 5: Execute & Transform

```typescript
const { data, error, count } = await query;

if (error) throw new Error("Database error");

const userDTOs = data.map(mapUserToDTO);

return {
  data: userDTOs,
  meta: {
    page,
    limit,
    total: count || 0,
  },
};
```

### Interakcje z zewnętrznymi usługami

**Supabase Database:**

- Połączenie przez SDK (@supabase/supabase-js)
- Użycie client z context.locals.supabase (zawiera JWT)
- Automatyczne zastosowanie RLS policies
- Transakcje nie są wymagane (tylko SELECT)

**Brak innych zewnętrznych usług** dla tego endpointa.

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm:**

- JWT token w nagłówku `Authorization: Bearer {token}`
- Token wydawany przez Supabase Auth
- Middleware sprawdza ważność tokenu przed każdym requestem
- Token zawiera claims: `sub` (user_id), `role`, `email`

**Implementacja w middleware:**

```typescript
// src/middleware/index.ts
export async function onRequest(context, next) {
  const authHeader = context.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        error: "Authentication required",
      }),
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return new Response(
      JSON.stringify({
        error: "Invalid token",
      }),
      { status: 401 }
    );
  }

  context.locals.user = user;
  context.locals.supabase = createClient(token); // Client z JWT

  return next();
}
```

### 6.2 Autoryzacja (Authorization)

**Role-Based Access Control (RBAC):**

| Rola        | Dostęp do GET /users                                            |
| ----------- | --------------------------------------------------------------- |
| **admin**   | ✅ Pełny dostęp do wszystkich użytkowników z dowolnymi filtrami |
| **trainer** | ✅ Dostęp tylko do własnych podopiecznych (forced filter)       |
| **client**  | ❌ Brak dostępu (403 Forbidden)                                 |

**Logika autoryzacji w service:**

```typescript
// src/lib/users.service.ts
export async function listUsers(query: ListUsersQuery, currentUser: User): Promise<PaginatedResponse<UserDTO>> {
  // Clients cannot list users
  if (currentUser.role === "client") {
    throw new ForbiddenError("Access denied");
  }

  // Trainers can only see their own trainees
  if (currentUser.role === "trainer") {
    query.trainerId = currentUser.id; // Force filter
    query.role = "trainee"; // Force role
  }

  // Admin can see all users with any filters
  // ... proceed with query
}
```

### 6.3 Row-Level Security (RLS)

**Polityki RLS na tabeli `users`:**

```sql
-- Admin może widzieć wszystkich użytkowników
CREATE POLICY users_select_admin ON users FOR SELECT
USING (current_setting('request.jwt.claims.role') = 'admin');

-- Każdy użytkownik może widzieć siebie
CREATE POLICY users_select_self ON users FOR SELECT
USING (id = current_setting('request.jwt.claims.sub')::uuid);
```

**Uwaga:** Obecne polityki RLS nie obsługują scenariusza "trener widzi swoich podopiecznych". Należy:

- **Opcja A:** Dodać kolumnę `trainer_id` do tabeli `users` i stworzyć policy
- **Opcja B:** Obsłużyć filtrowanie na poziomie aplikacji (zalecane dla MVP)

### 6.4 Walidacja danych wejściowych

**Zod schema dla query parameters:**

```typescript
import { z } from "zod";

const ListUsersQuerySchema = z.object({
  role: z.enum(["admin", "trainer", "trainee"]).optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  trainerId: z.string().uuid("Invalid UUID format").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Usage
const validatedQuery = ListUsersQuerySchema.parse(rawQuery);
```

**Zabezpieczenia przed:**

- SQL Injection: Supabase SDK używa parametryzowanych zapytań
- XSS: Response jest JSON (Content-Type: application/json)
- Parameter tampering: Walidacja Zod + forced filters dla trenerów

### 6.5 Rate Limiting

**Rekomendacja:** Implementacja rate limiting na poziomie middleware lub reverse proxy

```typescript
// Przykład (do rozważenia w przyszłości)
// 100 requests per minute per user
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user.id,
});
```

### 6.6 Logging i Audit

**Co logować:**

- Każde wywołanie endpointa (user_id, timestamp, filters)
- Próby nieautoryzowanego dostępu (403)
- Błędy serwera (500)

```typescript
// Przykład logowania
console.log({
  timestamp: new Date().toISOString(),
  endpoint: "GET /api/users",
  userId: currentUser.id,
  role: currentUser.role,
  filters: query,
  resultCount: data.length,
});
```

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod                | Status | Przyczyna                                            | Akcja                                     |
| ------------------ | ------ | ---------------------------------------------------- | ----------------------------------------- |
| `UNAUTHORIZED`     | 401    | Brak lub nieprawidłowy JWT                           | Wymagane ponowne logowanie                |
| `FORBIDDEN`        | 403    | Client próbuje użyć endpointa                        | Zwróć komunikat o braku uprawnień         |
| `FORBIDDEN`        | 403    | Trener próbuje zobaczyć użytkowników innych trenerów | Filtruj automatycznie                     |
| `VALIDATION_ERROR` | 400    | Nieprawidłowe query parameters                       | Zwróć szczegóły walidacji Zod             |
| `DATABASE_ERROR`   | 500    | Błąd połączenia z Supabase                           | Loguj błąd, zwróć ogólny komunikat        |
| `INTERNAL_ERROR`   | 500    | Nieoczekiwany błąd                                   | Loguj stack trace, zwróć ogólny komunikat |

### 7.2 Error Response Format

```typescript
interface ErrorResponse {
  error: string; // Human-readable message
  code?: string; // Machine-readable code
  details?: unknown; // Validation errors (tylko dla 400)
}
```

### 7.3 Implementacja obsługi błędów

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(403, "FORBIDDEN", message);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, "VALIDATION_ERROR", "Invalid input", details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database error occurred") {
    super(500, "DATABASE_ERROR", message);
  }
}
```

### 7.4 Error Handler w API Route

```typescript
// src/pages/api/users/index.ts
import { AppError } from "@/lib/errors";

export async function GET({ request, locals }) {
  try {
    // ... validation
    // ... service call
    // ... success response
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in GET /api/users:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### 7.5 Edge Cases

**Scenariusz 1: Trener bez podopiecznych**

- Response: 200 OK z pustą tablicą `data: []`
- `meta.total = 0`

**Scenariusz 2: Strona poza zakresem**

- page=100 gdy jest tylko 2 strony
- Response: 200 OK z pustą tablicą `data: []`
- Alternatywnie: 400 Bad Request (do decyzji)

**Scenariusz 3: Filter trainerId dla roli admin/trainer**

- Powinno działać poprawnie jeśli trainerId istnieje
- Jeśli trainerId nie istnieje: pusta tablica (nie 404)

**Scenariusz 4: Status 'pending' bez implementacji**

- Jeśli 'pending' nie jest obsługiwany w DB: zignorować lub zwrócić 400
- Rozważyć dodanie kolumny `activation_token` lub `activated_at`

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**Problem 1: N+1 Query przy dużej liczbie użytkowników**

- Nie dotyczy tego endpointa (prosty SELECT z users)
- Brak relacji do rozwijania

**Problem 2: COUNT(\*) query dla dużych tabel**

- `count: 'exact'` w Supabase może być wolne dla >100k rekordów
- Rozwiązanie: użyć `count: 'estimated'` lub cache'ować total

**Problem 3: Brak indeksów na kolumnach filtrowania**

- Obecne indeksy: `users(created_at)`
- Brakujące: `users(role)`, `users(is_hidden)`
- **Akcja:** Dodać indeksy w migracji

**Problem 4: Deep pagination**

- Offset-based pagination nieskuteczny dla page > 1000
- Rozwiązanie: cursor-based pagination (przyszła optymalizacja)

### 8.2 Strategie optymalizacji

#### Optymalizacja 1: Dodanie indeksów

```sql
-- Migracja: add_users_indexes.sql
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_hidden ON users(is_hidden);
CREATE INDEX idx_users_role_is_hidden ON users(role, is_hidden);
CREATE INDEX idx_users_created_at_desc ON users(created_at DESC);
```

#### Optymalizacja 2: Estimated count dla admina

```typescript
// Jeśli user jest admin i total > threshold, użyj estimated
const countMode = currentUser.role === "admin" && estimatedTotal > 10000 ? "estimated" : "exact";

const query = supabase.from("users").select("*", { count: countMode });
```

#### Optymalizacja 3: Response caching

```typescript
// Cache dla często używanych queries (admin, role=trainer)
// TTL: 60 sekund
const cacheKey = `users:list:${JSON.stringify(query)}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const result = await fetchFromDatabase(query);
await cache.set(cacheKey, result, 60);
return result;
```

#### Optymalizacja 4: Partial indexes

```sql
-- Index tylko dla active users (częstsze zapytania)
CREATE INDEX idx_users_active ON users(created_at DESC)
WHERE is_hidden = false;

-- Index tylko dla trainees
CREATE INDEX idx_users_trainees ON users(created_at DESC)
WHERE role = 'client';
```

### 8.3 Monitoring i metryki

**Metryki do śledzenia:**

- Response time (p50, p95, p99)
- Query execution time
- Cache hit rate
- Error rate (4xx, 5xx)
- Requests per second

**Narzędzia:**

- Supabase Dashboard (query performance)
- Application logs
- APM (np. New Relic, Datadog) - opcjonalnie

### 8.4 Limits i throttling

**Domyślne limity:**

- Max `limit` per request: 100
- Max total users to fetch: brak (ograniczone paginacją)
- Rate limit: 100 req/min (do implementacji)

**Supabase limits:**

- Free tier: 500 MB database
- Pro tier: 8 GB database
- Connection pooling: automatyczne

## 9. Kroki implementacji

### Krok 1: Przygotowanie środowiska

**1.1. Aktualizacja migracji bazy danych**

```bash
# Utwórz nową migrację dla indeksów
cd supabase/migrations
touch $(date +%Y%m%d%H%M%S)_add_users_indexes.sql
```

```sql
-- supabase/migrations/[timestamp]_add_users_indexes.sql
-- Indeksy wydajnościowe dla tabeli users

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_hidden ON users(is_hidden);
CREATE INDEX IF NOT EXISTS idx_users_role_is_hidden ON users(role, is_hidden);

-- Partial index dla aktywnych użytkowników
CREATE INDEX IF NOT EXISTS idx_users_active ON users(created_at DESC)
WHERE is_hidden = false;

-- Partial index dla trainees
CREATE INDEX IF NOT EXISTS idx_users_trainees ON users(created_at DESC)
WHERE role = 'client';
```

**1.2. Uruchomienie migracji**

```bash
# Lokalnie
npx supabase db reset

# Production
npx supabase db push
```

### Krok 2: Utworzenie plików błędów

**2.1. Utwórz `src/lib/errors.ts`**

```typescript
// src/lib/errors.ts

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

/**
 * 403 Forbidden - Access denied
 */
export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(403, "FORBIDDEN", message);
  }
}

/**
 * 400 Bad Request - Validation error
 */
export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, "VALIDATION_ERROR", "Invalid input", details);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

/**
 * 500 Internal Server Error - Database error
 */
export class DatabaseError extends AppError {
  constructor(message = "Database error occurred") {
    super(500, "DATABASE_ERROR", message);
  }
}

/**
 * 500 Internal Server Error - Generic internal error
 */
export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(500, "INTERNAL_ERROR", message);
  }
}
```

### Krok 3: Utworzenie Users Service

**3.1. Utwórz `src/lib/users.service.ts`**

```typescript
// src/lib/users.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type { ListUsersQuery, PaginatedResponse, UserDTO, User } from "@/types";
import { mapUserToDTO, mapUserRoleFromDTO, isClient } from "@/types";
import { ForbiddenError, DatabaseError } from "./errors";

/**
 * List users with pagination and filtering
 *
 * Authorization:
 * - Admin: can see all users with any filters
 * - Trainer: can only see their own trainees (forced filter)
 * - Client: no access (throws ForbiddenError)
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

  // Prepare query parameters
  const { role, status, trainerId, page = 1, limit = 20 } = query;

  // Force filters for trainers
  let effectiveRole = role;
  let effectiveTrainerId = trainerId;

  if (currentUser.role === "trainer") {
    // Trainers can only see their own trainees
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
    } else if (status === "pending") {
      // TODO: Implement pending status logic
      // For MVP, consider all non-hidden as active
      // May require additional column: activation_token or activated_at
      throw new DatabaseError("Pending status not yet implemented");
    }
  }

  // Apply trainerId filter
  // Note: This requires trainer_id column in users table for clients
  // For MVP, this filter may not work without schema change
  if (effectiveTrainerId && effectiveRole === "trainee") {
    // TODO: Add trainer_id column to users table
    // dbQuery = dbQuery.eq('trainer_id', effectiveTrainerId);
    console.warn("trainerId filter requires schema change (trainer_id column)");
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

**3.2. Uwagi do implementacji:**

- Filtr `trainerId` wymaga dodania kolumny `trainer_id` w tabeli `users`
- Status `pending` wymaga dodatkowej logiki (activation_token lub activated_at)
- Dla MVP można pominąć te filtry lub zwracać błąd

### Krok 4: Utworzenie Zod Schema

**4.1. Utwórz `src/lib/validation.ts`**

```typescript
// src/lib/validation.ts

import { z } from "zod";

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

/**
 * Helper to parse query parameters from URL
 */
export function parseQueryParams(url: URL) {
  return Object.fromEntries(url.searchParams.entries());
}
```

### Krok 5: Utworzenie API Route Handler

**5.1. Utwórz `src/pages/api/users/index.ts`**

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
    // Check authentication (should be handled by middleware)
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

    // Handle unexpected errors
    console.error("Unexpected error in GET /api/users:", error);
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

### Krok 6: Aktualizacja middleware (jeśli potrzebne)

**6.1. Sprawdź `src/middleware/index.ts`**

Upewnij się, że middleware:

- Weryfikuje JWT token
- Przypisuje `locals.user` (pełny User object z DB)
- Przypisuje `locals.supabase` (client z JWT)

**Przykładowa implementacja:**

```typescript
// src/middleware/index.ts

import { createServerClient } from "@supabase/ssr";
import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, locals, cookies } = context;

  // Skip middleware for public routes
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/")) {
    return next();
  }

  // Create Supabase client
  const supabase = createServerClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(key) {
        return cookies.get(key)?.value;
      },
      set(key, value, options) {
        cookies.set(key, value, options);
      },
      remove(key, options) {
        cookies.delete(key, options);
      },
    },
  });

  // Get user from session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
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

  // Fetch full user profile from database
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile) {
    return new Response(
      JSON.stringify({
        error: "User profile not found",
        code: "NOT_FOUND",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Attach to locals
  locals.user = userProfile;
  locals.supabase = supabase;

  return next();
};
```

### Krok 7: Testing

**7.1. Testy jednostkowe (Unit Tests)**

Utwórz `src/lib/users.service.test.ts` (opcjonalnie):

```typescript
// Przykładowe testy (do implementacji z Vitest lub innym frameworkiem)

describe("listUsers", () => {
  it("should return paginated users for admin", async () => {
    // Mock Supabase client
    // Mock current user as admin
    // Call listUsers
    // Assert result
  });

  it("should throw ForbiddenError for clients", async () => {
    // Mock current user as client
    // Expect listUsers to throw ForbiddenError
  });

  it("should force filters for trainers", async () => {
    // Mock current user as trainer
    // Call listUsers
    // Assert query was forced to traineeId = trainer.id
  });
});
```

**7.2. Testy integracyjne (Integration Tests)**

```bash
# Użyj REST Client, Postman, lub curl

# Test 1: Admin lista wszystkich użytkowników
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {admin_jwt}"

# Test 2: Admin z filtrami
curl -X GET "http://localhost:3000/api/users?role=trainer&page=1&limit=10" \
  -H "Authorization: Bearer {admin_jwt}"

# Test 3: Trener lista swoich podopiecznych
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {trainer_jwt}"

# Test 4: Client (powinien zwrócić 403)
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer {client_jwt}"

# Test 5: Brak tokenu (powinien zwrócić 401)
curl -X GET "http://localhost:3000/api/users"

# Test 6: Nieprawidłowa paginacja (powinien zwrócić 400)
curl -X GET "http://localhost:3000/api/users?page=-1" \
  -H "Authorization: Bearer {admin_jwt}"
```

**7.3. Expected Results**

| Test               | Expected Status | Expected Result                  |
| ------------------ | --------------- | -------------------------------- |
| Admin list all     | 200             | PaginatedResponse with all users |
| Admin with filters | 200             | Filtered users                   |
| Trainer list       | 200             | Only trainer's trainees          |
| Client access      | 403             | ForbiddenError                   |
| No token           | 401             | UnauthorizedError                |
| Invalid params     | 400             | ValidationError                  |

### Krok 8: Dokumentacja

**8.1. Aktualizuj API documentation**

Dodaj endpoint do dokumentacji API (np. w Swagger/OpenAPI):

```yaml
# api-docs.yaml
/api/users:
  get:
    summary: List users
    description: Retrieve paginated list of users with optional filtering
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: role
        schema:
          type: string
          enum: [admin, trainer, trainee]
      - in: query
        name: status
        schema:
          type: string
          enum: [active, pending, suspended]
      - in: query
        name: trainerId
        schema:
          type: string
          format: uuid
      - in: query
        name: page
        schema:
          type: integer
          minimum: 1
          default: 1
      - in: query
        name: limit
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      200:
        description: Success
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PaginatedUserResponse"
      400:
        description: Validation error
      401:
        description: Unauthorized
      403:
        description: Forbidden
      500:
        description: Internal server error
```

**8.2. README update**

Dodaj przykłady użycia do README.md projektu.

### Krok 9: Deployment

**9.1. Pre-deployment checklist**

- [ ] Wszystkie testy przechodzą
- [ ] Linter nie zgłasza błędów
- [ ] Migracje bazy danych zastosowane
- [ ] Zmienne środowiskowe skonfigurowane
- [ ] Rate limiting skonfigurowany (opcjonalnie)

**9.2. Deploy do staging**

```bash
# Push do staging branch
git checkout staging
git merge develop
git push origin staging

# Verify deployment
curl https://staging.example.com/api/users -H "Authorization: Bearer {token}"
```

**9.3. Deploy do production**

```bash
# Push do production
git checkout main
git merge staging
git push origin main

# Monitor logs
# Check error rates
# Verify performance metrics
```

### Krok 10: Monitoring i Maintenance

**10.1. Setup monitoring**

- [ ] Configure application logging
- [ ] Setup error tracking (Sentry, Rollbar)
- [ ] Monitor database performance
- [ ] Track API metrics (response time, error rate)

**10.2. Post-deployment validation**

- Test all authorization scenarios
- Verify RLS policies work correctly
- Check query performance
- Monitor error logs

**10.3. Future improvements**

- [ ] Add cursor-based pagination
- [ ] Implement caching
- [ ] Add full-text search
- [ ] Implement trainer_id column for better filtering
- [ ] Add pending status logic
- [ ] Optimize count queries for large datasets

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowe wskazówki dla zespołu programistów do wdrożenia endpointa **GET /api/users**. Plan obejmuje:

✅ Szczegółową specyfikację API  
✅ Definicje wszystkich typów i interfejsów  
✅ Logikę autoryzacji i bezpieczeństwa  
✅ Obsługę błędów i edge cases  
✅ Strategie optymalizacji wydajności  
✅ Krok po kroku instrukcje implementacji  
✅ Wytyczne testowania  
✅ Procedury deployment

**Kluczowe punkty do zapamiętania:**

- Trenerzy widzą tylko swoich podopiecznych (forced filter)
- Clients nie mają dostępu do tego endpointa
- Walidacja wszystkich parametrów przez Zod
- Obsługa błędów zgodna z REST best practices
- RLS policies zapewniają dodatkową warstwę bezpieczeństwa

**Znane ograniczenia MVP:**

- Filtr `trainerId` wymaga zmiany schematu (dodanie kolumny)
- Status `pending` wymaga dodatkowej implementacji
- Count queries mogą być wolne dla dużych tabel

Ten endpoint służy jako wzorzec dla implementacji pozostałych endpointów API.
