# API Endpoint Implementation Plan: GET /exercises

## 1. Przegląd punktu końcowego

Endpoint GET /exercises służy do pobierania paginowanej listy ćwiczeń z opcjonalnym wyszukiwaniem po nazwie. Jest to podstawowy endpoint wykorzystywany do przeglądania biblioteki ćwiczeń dostępnych w systemie.

**Główne funkcjonalności:**

- Paginacja wyników (domyślnie 20 rekordów na stronę)
- Wyszukiwanie ćwiczeń po nazwie (full-text lub ILIKE)
- Filtrowanie ukrytych ćwiczeń (is_hidden)
- Sortowanie (domyślnie po created_at DESC)

**Poziomy dostępu:**

- **Administrator**: ✅ Pełny dostęp - widzi wszystkie ćwiczenia (włącznie z ukrytymi)
- **Trener**: ✅ Dostęp do widocznych ćwiczeń (is_hidden=false)
- **Podopieczny**: ✅ Dostęp do widocznych ćwiczeń (is_hidden=false)

## 2. Szczegóły żądania

### Metoda HTTP

```
GET
```

### Struktura URL

```
/api/exercises
```

### Query Parameters

#### Opcjonalne parametry:

| Parametr | Typ     | Wartości | Domyślna | Opis                                                |
| -------- | ------- | -------- | -------- | --------------------------------------------------- |
| `search` | string  | -        | -        | Wyszukiwanie po nazwie ćwiczenia (case-insensitive) |
| `page`   | integer | ≥ 1      | 1        | Numer strony dla paginacji                          |
| `limit`  | integer | 1-100    | 20       | Liczba rekordów na stronę                           |

### Przykładowe żądania

```bash
# Pobranie pierwszej strony wszystkich ćwiczeń
GET /api/exercises

# Wyszukiwanie ćwiczeń po nazwie
GET /api/exercises?search=squat

# Paginacja
GET /api/exercises?page=2&limit=50

# Kombinacja wyszukiwania i paginacji
GET /api/exercises?search=bench+press&page=1&limit=10
```

### Request Headers

```
Authorization: Bearer {jwt_token}
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Query parameters interface
interface ListExercisesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// Response DTO dla pojedynczego ćwiczenia
interface ExerciseDTO {
  id: UUID;
  name: string;
  description: string | null;
  vimeoToken: string;
  defaultWeight: number | null;
  isHidden: boolean;
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
type Exercise = Tables<"exercises">;
```

### Mapper Functions

```typescript
mapExerciseToDTO(exercise: Exercise): ExerciseDTO;
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
      "name": "Barbell Squat",
      "description": "Compound lower body exercise targeting quads, glutes, and core",
      "vimeoToken": "abc123xyz",
      "defaultWeight": 20,
      "isHidden": false,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Bench Press",
      "description": "Upper body pressing movement for chest, shoulders, and triceps",
      "vimeoToken": "def456uvw",
      "defaultWeight": 20,
      "isHidden": false,
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

- Wartość `page` lub `limit` poza dozwolonym zakresem
- Nieprawidłowe parametry query

**Body:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "page",
      "message": "Page must be at least 1"
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
Client Request (GET /api/exercises)
    ↓
[1] Astro Middleware
    ├─ Verify JWT token
    ├─ Extract user claims
    └─ Attach to context.locals.user
    ↓
[2] API Route Handler (src/pages/api/exercises/index.ts)
    ├─ Parse query parameters
    ├─ Validate with Zod schema
    └─ Call service layer
    ↓
[3] Exercises Service (src/lib/exercises.service.ts)
    ├─ Check authorization (all authenticated users)
    ├─ Build Supabase query with filters
    │   ├─ Hide is_hidden=true for non-admins
    │   ├─ Apply search filter (ILIKE)
    │   └─ Apply pagination
    ├─ Apply RLS policies automatically
    ├─ Execute count query (total)
    ├─ Execute data query (paginated)
    └─ Map DB results to DTOs
    ↓
[4] Supabase Database
    ├─ Apply RLS policies
    ├─ Filter by is_hidden (if not admin)
    ├─ Filter by search (if provided)
    ├─ Apply pagination (offset/limit)
    └─ Return results
    ↓
[5] Transform & Response
    ├─ Map exercises: Exercise[] → ExerciseDTO[]
    ├─ Transform snake_case to camelCase
    └─ Build PaginatedResponse
    ↓
Client receives JSON response
```

### Szczegółowy przepływ krok po kroku

#### Krok 1: Request Validation

```typescript
// Validate query parameters with Zod
const ListExercisesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const validatedQuery = ListExercisesQuerySchema.parse(rawQuery);
```

#### Krok 2: Authorization Check

```typescript
// All authenticated users can list exercises
// No role check needed
// Admins see hidden exercises, others don't
const canViewHidden = currentUser.role === "admin";
```

#### Krok 3: Database Query Construction

```typescript
// Build Supabase query
let query = supabase.from("exercises").select("*", { count: "exact" });

// Filter hidden exercises for non-admins
if (!canViewHidden) {
  query = query.eq("is_hidden", false);
}

// Apply search filter
if (search) {
  query = query.ilike("name", `%${search}%`);
}

// Pagination
const offset = (page - 1) * limit;
query = query.range(offset, offset + limit - 1);

// Ordering
query = query.order("created_at", { ascending: false });
```

#### Krok 4: Execute & Transform

```typescript
const { data, error, count } = await query;

if (error) throw new DatabaseError("Failed to fetch exercises");

const exerciseDTOs = (data || []).map(mapExerciseToDTO);

return {
  data: exerciseDTOs,
  meta: {
    page,
    limit,
    total: count || 0,
  },
};
```

### Interakcje z zewnętrznymi usługami

**Supabase Database:**

- SELECT query z filters, pagination, count
- RLS policies applied automatically

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm:**

- JWT token w nagłówku `Authorization: Bearer {token}`
- Token weryfikowany przez middleware

### 6.2 Autoryzacja (Authorization)

**Access Control:**

| Rola        | Dostęp do GET /exercises                         |
| ----------- | ------------------------------------------------ |
| **Admin**   | ✅ Pełny dostęp (including hidden exercises)     |
| **Trainer** | ✅ Dostęp do visible exercises (is_hidden=false) |
| **Client**  | ✅ Dostęp do visible exercises (is_hidden=false) |

**Implementation:**

```typescript
// All authenticated users can list exercises
// Admins see all, others see only visible
const canViewHidden = currentUser.role === "admin";

if (!canViewHidden) {
  query = query.eq("is_hidden", false);
}
```

### 6.3 Walidacja danych wejściowych

**Zod Schema:**

```typescript
const ListExercisesQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 6.4 SQL Injection Protection

**Zabezpieczenia:**

- Supabase SDK uses parametrized queries
- ILIKE search is safely escaped
- No raw SQL execution

### 6.5 Rate Limiting

**Rekomendacja:**

- 100 requests per minute per user
- Cache results dla popular searches

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod                | Status | Przyczyna                      | Akcja użytkownika             |
| ------------------ | ------ | ------------------------------ | ----------------------------- |
| `UNAUTHORIZED`     | 401    | Brak lub nieprawidłowy JWT     | Zaloguj się ponownie          |
| `VALIDATION_ERROR` | 400    | Nieprawidłowe query parameters | Popraw dane zgodnie z details |
| `DATABASE_ERROR`   | 500    | Błąd połączenia z Supabase     | Spróbuj ponownie później      |
| `INTERNAL_ERROR`   | 500    | Nieoczekiwany błąd             | Skontaktuj się z supportem    |

### 7.2 Error Handling w Service

```typescript
export async function listExercises(
  supabase: SupabaseClient,
  query: ListExercisesQuery,
  currentUser: User
): Promise<PaginatedResponse<ExerciseDTO>> {
  const { search, page = 1, limit = 20 } = query;

  // Determine if user can view hidden exercises
  const canViewHidden = currentUser.role === "admin";

  // Build query
  let dbQuery = supabase.from("exercises").select("*", { count: "exact", head: false });

  // Filter hidden for non-admins
  if (!canViewHidden) {
    dbQuery = dbQuery.eq("is_hidden", false);
  }

  // Apply search
  if (search) {
    dbQuery = dbQuery.ilike("name", `%${search}%`);
  }

  // Pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });

  // Execute
  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database error in listExercises:", error);
    throw new DatabaseError("Failed to fetch exercises");
  }

  // Map to DTOs
  const exerciseDTOs = (data || []).map(mapExerciseToDTO);

  return {
    data: exerciseDTOs,
    meta: {
      page,
      limit,
      total: count || 0,
    },
  };
}
```

### 7.3 Edge Cases

**Scenariusz 1: Brak wyników dla search query**

- Response: 200 OK z pustą tablicą `data: []`
- `meta.total = 0`

**Scenariusz 2: Strona poza zakresem**

- Response: 200 OK z pustą tablicą `data: []`
- Nie 404

**Scenariusz 3: Search query z special characters**

- Properly escaped przez Supabase ILIKE
- Np. `search=bench%press` działa poprawnie

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**Problem 1: COUNT(\*) query dla dużych tabel**

- `count: 'exact'` może być wolne dla >100k rekordów
- Rozwiązanie: użyć `count: 'estimated'`

**Problem 2: ILIKE search bez full-text index**

- ILIKE "%query%" wymaga full table scan
- Rozwiązanie: PostgreSQL full-text search (tsvector)

**Problem 3: Deep pagination**

- Offset-based pagination nieskuteczny dla page > 1000
- Rozwiązanie: cursor-based pagination

### 8.2 Strategie optymalizacji

#### Optymalizacja 1: Dodanie indeksów

```sql
-- Migracja: add_exercises_indexes.sql
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_is_hidden ON exercises(is_hidden);
CREATE INDEX idx_exercises_created_at_desc ON exercises(created_at DESC);

-- Partial index dla visible exercises
CREATE INDEX idx_exercises_visible ON exercises(created_at DESC)
WHERE is_hidden = false;

-- Full-text search index
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);
```

#### Optymalizacja 2: Estimated count dla dużych tabel

```typescript
// Use estimated count if total > threshold
const countMode = estimatedTotal > 10000 ? "estimated" : "exact";

const query = supabase.from("exercises").select("*", { count: countMode });
```

#### Optymalizacja 3: Response caching

```typescript
// Cache popular searches (TTL: 5 min)
const cacheKey = `exercises:list:${JSON.stringify(query)}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const result = await fetchFromDatabase(query);
await cache.set(cacheKey, result, 300);
return result;
```

#### Optymalizacja 4: Full-text search

```typescript
// Use PostgreSQL full-text search instead of ILIKE
if (search) {
  query = query.textSearch("name", search, {
    type: "websearch",
    config: "english",
  });
}
```

### 8.3 Monitoring

**Metryki:**

- Response time (p50, p95, p99)
- Query execution time
- Cache hit rate
- Search query frequency

## 9. Kroki implementacji

### Krok 1: Dodaj indeksy do migracji

```sql
-- supabase/migrations/[timestamp]_add_exercises_indexes.sql

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_is_hidden ON exercises(is_hidden);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at_desc ON exercises(created_at DESC);

-- Partial index for visible exercises (most common query)
CREATE INDEX IF NOT EXISTS idx_exercises_visible ON exercises(created_at DESC)
WHERE is_hidden = false;

-- Enable pg_trgm extension for fuzzy search (optional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for better search performance
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
ON exercises USING gin(name gin_trgm_ops);
```

### Krok 2: Dodaj validation schema

```typescript
// src/lib/validation.ts

/**
 * Validation schema for GET /api/exercises
 */
export const ListExercisesQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Krok 3: Rozszerz types.ts (jeśli potrzebne)

```typescript
// src/types.ts

// Types are already defined in types.ts:
// - ListExercisesQuery (lines 213-217)
// - ExerciseDTO (lines 224-233)
// - PaginatedResponse<T> (lines 80-83)
// - mapExerciseToDTO (lines 504-515)
```

### Krok 4: Utwórz Exercises Service

**4.1. Utwórz `src/lib/exercises.service.ts`**

```typescript
// src/lib/exercises.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type { ListExercisesQuery, PaginatedResponse, ExerciseDTO, User } from "@/types";
import { mapExerciseToDTO, isAdmin } from "@/types";
import { DatabaseError } from "./errors";

/**
 * List exercises with pagination and search
 *
 * Authorization:
 * - All authenticated users can list exercises
 * - Admin sees all exercises (including hidden)
 * - Others see only visible exercises (is_hidden=false)
 */
export async function listExercises(
  supabase: SupabaseClient,
  query: ListExercisesQuery,
  currentUser: User
): Promise<PaginatedResponse<ExerciseDTO>> {
  const { search, page = 1, limit = 20 } = query;

  // Determine if user can view hidden exercises
  const canViewHidden = isAdmin(currentUser);

  // Build Supabase query
  let dbQuery = supabase.from("exercises").select("*", { count: "exact", head: false });

  // Filter hidden exercises for non-admins
  if (!canViewHidden) {
    dbQuery = dbQuery.eq("is_hidden", false);
  }

  // Apply search filter (case-insensitive)
  if (search) {
    dbQuery = dbQuery.ilike("name", `%${search}%`);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });

  // Execute query
  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database error in listExercises:", error);
    throw new DatabaseError("Failed to fetch exercises");
  }

  // Map to DTOs
  const exerciseDTOs = (data || []).map(mapExerciseToDTO);

  return {
    data: exerciseDTOs,
    meta: {
      page,
      limit,
      total: count || 0,
    },
  };
}
```

### Krok 5: Utwórz API Route Handler

**5.1. Utwórz `src/pages/api/exercises/index.ts`**

```typescript
// src/pages/api/exercises/index.ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { listExercises } from "@/lib/exercises.service";
import { ListExercisesQuerySchema, parseQueryParams } from "@/lib/validation";
import { AppError } from "@/lib/errors";

/**
 * GET /api/exercises
 * List exercises with pagination and search
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

    const validatedQuery = ListExercisesQuerySchema.parse(rawQuery);

    // Call service
    const result = await listExercises(locals.supabase, validatedQuery, locals.user);

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
    console.error("Unexpected error in GET /api/exercises:", error);
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

### Krok 6: Testing

**6.1. Testy jednostkowe**

```typescript
describe("listExercises", () => {
  it("should return all exercises for admin", async () => {
    // Mock admin user
    // Mock exercises (including hidden)
    // Assert all exercises returned
  });

  it("should return only visible exercises for trainer", async () => {
    // Mock trainer user
    // Assert only is_hidden=false returned
  });

  it("should filter by search query", async () => {
    // Call listExercises with search="squat"
    // Assert only matching exercises returned
  });

  it("should handle empty results", async () => {
    // Mock empty result
    // Assert data=[], total=0
  });
});
```

**6.2. Testy integracyjne**

```bash
# Test 1: List all exercises
curl -X GET "http://localhost:4321/api/exercises" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with PaginatedResponse

# Test 2: Search exercises
curl -X GET "http://localhost:4321/api/exercises?search=squat" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with filtered results

# Test 3: Pagination
curl -X GET "http://localhost:4321/api/exercises?page=2&limit=10" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with page 2

# Test 4: No authentication (should fail)
curl -X GET "http://localhost:4321/api/exercises"
# Expected: 401 Unauthorized
```

### Krok 7: Dokumentacja

```yaml
/api/exercises:
  get:
    summary: List exercises
    description: Retrieve paginated list of exercises with optional search
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: search
        schema:
          type: string
          maxLength: 100
        description: Search by exercise name
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
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: "#/components/schemas/ExerciseDTO"
                meta:
                  $ref: "#/components/schemas/PaginationMeta"
      400:
        description: Validation error
      401:
        description: Unauthorized
      500:
        description: Internal server error
```

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowe wskazówki dla wdrożenia endpointa **GET /exercises**. Plan obejmuje:

✅ Szczegółową specyfikację API z paginacją i wyszukiwaniem  
✅ Definicje typów i interfejsów  
✅ Logikę autoryzacji (admin widzi hidden, inni nie)  
✅ Walidację query parameters  
✅ Obsługę błędów  
✅ Strategie wydajnościowe (indeksy, full-text search, caching)  
✅ Krok po kroku instrukcje implementacji  
✅ Kompletne przykłady testów

**Kluczowe punkty:**

- Wszyscy zalogowani użytkownicy mogą przeglądać ćwiczenia
- Admin widzi wszystkie ćwiczenia (including hidden)
- Trenerzy i klienci widzą tylko visible exercises
- Wyszukiwanie case-insensitive po nazwie
- Paginacja offset-based (MVP), cursor-based (future)
- Indeksy dla wydajności

**Znane ograniczenia MVP:**

- ILIKE search może być wolne (production: full-text search)
- COUNT exact może być wolne dla dużych tabel
- Brak zaawansowanego filtrowania (po kategorii, muscle group)
- Brak sortowania po innych polach

Ten endpoint stanowi fundament dla biblioteki ćwiczeń.
