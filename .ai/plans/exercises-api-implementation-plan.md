# API Endpoints Implementation Plan: Exercises

Ten dokument zawiera kompleksowe plany implementacji dla wszystkich operacji na ćwiczeniach:

- **GET /exercises** - Listowanie ćwiczeń z paginacją i wyszukiwaniem
- **POST /exercises** - Tworzenie nowego ćwiczenia
- **GET /exercises/:id** - Pobieranie ćwiczenia po ID
- **PUT /exercises/:id** - Aktualizacja ćwiczenia
- **DELETE /exercises/:id** - Usuwanie ćwiczenia (soft/hard delete)

---

## Spis treści

1. [GET /exercises - List Exercises](#get-exercises---list-exercises)
2. [POST /exercises - Create Exercise](#post-exercises---create-exercise)
3. [GET /exercises/:id - Get Exercise by ID](#get-exercisesid---get-exercise-by-id)
4. [PUT /exercises/:id - Update Exercise](#put-exercisesid---update-exercise)
5. [DELETE /exercises/:id - Delete Exercise](#delete-exercisesid---delete-exercise)
6. [Shared Types & Utilities](#shared-types--utilities)
7. [API Route Handlers](#api-route-handlers)
8. [Testing](#testing)
9. [Performance Considerations](#performance-considerations)
10. [Implementation Steps](#implementation-steps)

---

## GET /exercises - List Exercises

### Przegląd

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

### Request

- **Method:** GET
- **URL:** `/api/exercises`
- **Auth:** All authenticated users
- **Query Parameters:**

| Parametr | Typ     | Wartości | Domyślna | Opis                                                |
| -------- | ------- | -------- | -------- | --------------------------------------------------- |
| `search` | string  | -        | -        | Wyszukiwanie po nazwie ćwiczenia (case-insensitive) |
| `page`   | integer | ≥ 1      | 1        | Numer strony dla paginacji                          |
| `limit`  | integer | 1-100    | 20       | Liczba rekordów na stronę                           |

### Response Success (200)

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

### Authorization

- **Admin**: ✅ Can view all exercises (including hidden)
- **Trainer**: ✅ Can view visible exercises only
- **Client**: ✅ Can view visible exercises only

### Validation Schema

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

### Error Responses

- **401**: Unauthorized (no JWT)
- **400**: Validation error (invalid query parameters)
- **500**: Internal server error

### Implementation Service

```typescript
export async function listExercises(
  supabase: SupabaseClient,
  query: ListExercisesQuery,
  currentUser: User
): Promise<PaginatedResponse<ExerciseDTO>> {
  const { search, page = 1, limit = 20 } = query;

  // Determine if user can view hidden exercises
  const canViewHidden = currentUser.role === "admin";

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

### Data Flow Diagram

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

### Edge Cases

**Scenariusz 1: Brak wyników dla search query**

- Response: 200 OK z pustą tablicą `data: []`
- `meta.total = 0`

**Scenariusz 2: Strona poza zakresem**

- Response: 200 OK z pustą tablicą `data: []`
- Nie 404

**Scenariusz 3: Search query z special characters**

- Properly escaped przez Supabase ILIKE
- Np. `search=bench%press` działa poprawnie

---

## POST /exercises - Create Exercise

### Przegląd

Endpoint do tworzenia nowych ćwiczeń w bibliotece. Tylko administratorzy mogą dodawać ćwiczenia.

### Request

- **Method:** POST
- **URL:** `/api/exercises`
- **Auth:** Admin only
- **Body:**

```json
{
  "name": "Barbell Squat",
  "description": "Compound lower body exercise",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20
}
```

### Response Success (201)

```json
{
  "id": "uuid",
  "name": "Barbell Squat",
  "description": "Compound lower body exercise",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20,
  "isHidden": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

### Validation Schema

```typescript
const CreateExerciseCommandSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(1000).trim().optional(),
  vimeoToken: z.string().min(1).max(50).trim(),
  defaultWeight: z.number().min(0).optional(),
});
```

### Error Responses

- **401**: Unauthorized (no JWT)
- **403**: Forbidden (not admin)
- **400**: Validation error (invalid data)
- **409**: Conflict (exercise name already exists)
- **500**: Internal server error

### Implementation Service

```typescript
export async function createExercise(
  supabase: SupabaseClient,
  command: CreateExerciseCommand,
  currentUser: User
): Promise<ExerciseDTO> {
  // Check admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can create exercises");
  }

  // Check name uniqueness
  const { data: existing } = await supabase.from("exercises").select("id").eq("name", command.name).maybeSingle();

  if (existing) {
    throw new ConflictError("Exercise with this name already exists");
  }

  // Insert exercise
  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({
      name: command.name,
      description: command.description || null,
      vimeo_token: command.vimeoToken,
      default_weight: command.defaultWeight || null,
      is_hidden: false,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError("Failed to create exercise");
  }

  return mapExerciseToDTO(exercise);
}
```

---

## GET /exercises/:id - Get Exercise by ID

### Przegląd

Endpoint do pobierania szczegółów pojedynczego ćwiczenia.

### Request

- **Method:** GET
- **URL:** `/api/exercises/:id`
- **Auth:** All authenticated users

### Response Success (200)

```json
{
  "id": "uuid",
  "name": "Barbell Squat",
  "description": "Compound lower body exercise",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20,
  "isHidden": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### Authorization

- **Admin**: ✅ Can view all exercises (including hidden)
- **Trainer**: ✅ Can view visible exercises only
- **Client**: ✅ Can view visible exercises only

### Error Responses

- **401**: Unauthorized
- **400**: Invalid UUID format
- **404**: Exercise not found or hidden (for non-admins)
- **500**: Internal server error

### Implementation Service

```typescript
export async function getExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  currentUser: User
): Promise<ExerciseDTO> {
  // Validate UUID
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch exercise
  const { data: exercise, error } = await supabase.from("exercises").select("*").eq("id", exerciseId).single();

  if (error || !exercise) {
    throw new NotFoundError("Exercise not found");
  }

  // Check if hidden (non-admins can't see)
  if (exercise.is_hidden && currentUser.role !== "admin") {
    throw new NotFoundError("Exercise not found");
  }

  return mapExerciseToDTO(exercise);
}
```

---

## PUT /exercises/:id - Update Exercise

### Przegląd

Endpoint do aktualizacji istniejącego ćwiczenia. Tylko administratorzy.

### Request

- **Method:** PUT
- **URL:** `/api/exercises/:id`
- **Auth:** Admin only
- **Body:** (wszystkie pola opcjonalne)

```json
{
  "name": "Updated name",
  "description": "Updated description",
  "vimeoToken": "new_token",
  "defaultWeight": 25
}
```

### Response Success (200)

```json
{
  "id": "uuid",
  "name": "Updated name",
  "description": "Updated description",
  "vimeoToken": "new_token",
  "defaultWeight": 25,
  "isHidden": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T14:45:00.000Z"
}
```

### Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

### Validation Schema

```typescript
const UpdateExerciseCommandSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    vimeoToken: z.string().min(1).max(50).trim().optional(),
    defaultWeight: z.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

### Error Responses

- **401**: Unauthorized
- **403**: Forbidden (not admin)
- **400**: Validation error or empty body
- **404**: Exercise not found
- **409**: Conflict (name already exists)
- **500**: Internal server error

### Implementation Service

```typescript
export async function updateExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  command: UpdateExerciseCommand,
  currentUser: User
): Promise<ExerciseDTO> {
  // Check admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can update exercises");
  }

  // Validate UUID
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch existing exercise
  const { data: existing, error: fetchError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Exercise not found");
  }

  // Check name uniqueness (if name is being changed)
  if (command.name && command.name !== existing.name) {
    const { data: duplicate } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", command.name)
      .neq("id", exerciseId)
      .maybeSingle();

    if (duplicate) {
      throw new ConflictError("Exercise with this name already exists");
    }
  }

  // Build update data
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (command.name) updateData.name = command.name;
  if (command.description !== undefined) updateData.description = command.description;
  if (command.vimeoToken) updateData.vimeo_token = command.vimeoToken;
  if (command.defaultWeight !== undefined) updateData.default_weight = command.defaultWeight;

  // Execute update
  const { data: updated, error } = await supabase
    .from("exercises")
    .update(updateData)
    .eq("id", exerciseId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError("Failed to update exercise");
  }

  return mapExerciseToDTO(updated);
}
```

---

## DELETE /exercises/:id - Delete Exercise

### Przegląd

Endpoint do usuwania ćwiczenia (soft delete). Tylko administratorzy.

### Request

- **Method:** DELETE
- **URL:** `/api/exercises/:id`
- **Auth:** Admin only
- **Query Params:**
  - `hard=true` (optional): Physical delete instead of soft delete

### Response Success

- **204 No Content** (empty body)

### Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

### Error Responses

- **401**: Unauthorized
- **403**: Forbidden (not admin)
- **400**: Invalid UUID format
- **404**: Exercise not found
- **409**: Conflict (exercise used in plans - hard delete only)
- **500**: Internal server error

### Implementation Service

```typescript
export async function deleteExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  currentUser: User,
  hard: boolean = false
): Promise<void> {
  // Check admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can delete exercises");
  }

  // Validate UUID
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch exercise
  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !exercise) {
    throw new NotFoundError("Exercise not found");
  }

  // If already soft deleted
  if (exercise.is_hidden && !hard) {
    throw new NotFoundError("Exercise not found");
  }

  // Execute delete
  if (hard) {
    // Hard delete - check if used in plans
    const { count } = await supabase
      .from("plan_exercises")
      .select("id", { count: "exact", head: true })
      .eq("exercise_id", exerciseId);

    if (count > 0) {
      throw new ConflictError("Cannot delete exercise that is used in plans");
    }

    const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);

    if (error) {
      throw new DatabaseError("Failed to delete exercise");
    }
  } else {
    // Soft delete
    const { error } = await supabase
      .from("exercises")
      .update({
        is_hidden: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exerciseId);

    if (error) {
      throw new DatabaseError("Failed to delete exercise");
    }
  }
}
```

---

## Shared Types & Utilities

### DTOs (Data Transfer Objects)

```typescript
// Query parameters interface
interface ListExercisesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// Command interfaces
interface CreateExerciseCommand {
  name: string;
  description?: string;
  vimeoToken: string;
  defaultWeight?: number;
}

interface UpdateExerciseCommand {
  name?: string;
  description?: string;
  vimeoToken?: string;
  defaultWeight?: number;
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
function mapExerciseToDTO(exercise: Exercise): ExerciseDTO {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    vimeoToken: exercise.vimeo_token,
    defaultWeight: exercise.default_weight,
    isHidden: exercise.is_hidden,
    createdAt: exercise.created_at,
    updatedAt: exercise.updated_at,
  };
}
```

---

## API Route Handlers

### src/pages/api/exercises/index.ts

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { listExercises, createExercise } from "@/lib/exercises.service";
import { ListExercisesQuerySchema, CreateExerciseCommandSchema, parseQueryParams } from "@/lib/validation";
import { handleAPIError } from "@/lib/errors";

/**
 * GET /api/exercises
 * List exercises with pagination and search
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);
    const validatedQuery = ListExercisesQuerySchema.parse(rawQuery);

    const result = await listExercises(locals.supabase, validatedQuery, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * POST /api/exercises
 * Create new exercise (admin only)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const validatedCommand = CreateExerciseCommandSchema.parse(body);
    const result = await createExercise(locals.supabase, validatedCommand, locals.user);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

### src/pages/api/exercises/[id].ts

```typescript
import type { APIRoute } from "astro";
import { getExercise, updateExercise, deleteExercise } from "@/lib/exercises.service";
import { UpdateExerciseCommandSchema } from "@/lib/validation";
import { handleAPIError } from "@/lib/errors";

/**
 * GET /api/exercises/:id
 * Get single exercise by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const result = await getExercise(locals.supabase, id!, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PUT /api/exercises/:id
 * Update exercise (admin only)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const body = await request.json();
    const validatedCommand = UpdateExerciseCommandSchema.parse(body);
    const result = await updateExercise(locals.supabase, id!, validatedCommand, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE /api/exercises/:id
 * Delete exercise (admin only)
 * Query param: ?hard=true for physical delete
 */
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const url = new URL(request.url);
    const hard = url.searchParams.get("hard") === "true";

    await deleteExercise(locals.supabase, id!, locals.user, hard);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

---

## Testing

### Unit Tests

```typescript
describe("Exercises Service", () => {
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

    it("should paginate correctly", async () => {
      // Test page=2, limit=10
      // Assert correct offset and limit applied
    });
  });

  describe("createExercise", () => {
    it("should create exercise for admin", async () => {});
    it("should throw ForbiddenError for non-admin", async () => {});
    it("should throw ConflictError if name exists", async () => {});
  });

  describe("getExercise", () => {
    it("should return exercise for any authenticated user", async () => {});
    it("should hide hidden exercises from non-admins", async () => {});
    it("should throw NotFoundError for invalid ID", async () => {});
  });

  describe("updateExercise", () => {
    it("should update exercise for admin", async () => {});
    it("should throw ForbiddenError for non-admin", async () => {});
    it("should throw ConflictError if new name exists", async () => {});
  });

  describe("deleteExercise", () => {
    it("should soft delete exercise for admin", async () => {});
    it("should hard delete if hard=true and not used", async () => {});
    it("should throw ConflictError if used in plans", async () => {});
  });
});
```

### Integration Tests

```bash
# List all exercises
curl -X GET "http://localhost:3000/api/exercises" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with PaginatedResponse

# Search exercises
curl -X GET "http://localhost:3000/api/exercises?search=squat" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with filtered results

# Pagination
curl -X GET "http://localhost:3000/api/exercises?page=2&limit=10" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK with page 2

# Create exercise
curl -X POST "http://localhost:3000/api/exercises" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Exercise","vimeoToken":"abc123"}'
# Expected: 201 Created

# Get single exercise
curl -X GET "http://localhost:3000/api/exercises/{id}" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK

# Update exercise
curl -X PUT "http://localhost:3000/api/exercises/{id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
# Expected: 200 OK

# Delete exercise (soft)
curl -X DELETE "http://localhost:3000/api/exercises/{id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content

# Delete exercise (hard)
curl -X DELETE "http://localhost:3000/api/exercises/{id}?hard=true" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content
```

---

## Performance Considerations

### Potencjalne wąskie gardła

**Problem 1: COUNT(\*) query dla dużych tabel**

- `count: 'exact'` może być wolne dla >100k rekordów
- Rozwiązanie: użyć `count: 'estimated'`

**Problem 2: ILIKE search bez full-text index**

- ILIKE "%query%" wymaga full table scan
- Rozwiązanie: PostgreSQL full-text search (tsvector)

**Problem 3: Deep pagination**

- Offset-based pagination nieskuteczny dla page > 1000
- Rozwiązanie: cursor-based pagination

### Strategie optymalizacji

#### Optymalizacja 1: Dodanie indeksów

```sql
-- Migracja: add_exercises_indexes.sql
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_is_hidden ON exercises(is_hidden);
CREATE INDEX idx_exercises_created_at_desc ON exercises(created_at DESC);

-- Partial index dla visible exercises
CREATE INDEX idx_exercises_visible ON exercises(created_at DESC)
WHERE is_hidden = false;

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for better search performance
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

### Monitoring

**Metryki:**

- Response time (p50, p95, p99)
- Query execution time
- Cache hit rate
- Search query frequency

---

## Implementation Steps

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

### Krok 2: Dodaj validation schemas

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

/**
 * Validation schema for POST /api/exercises
 */
export const CreateExerciseCommandSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(1000).trim().optional(),
  vimeoToken: z.string().min(1).max(50).trim(),
  defaultWeight: z.number().min(0).optional(),
});

/**
 * Validation schema for PUT /api/exercises/:id
 */
export const UpdateExerciseCommandSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    vimeoToken: z.string().min(1).max(50).trim().optional(),
    defaultWeight: z.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

### Krok 3: Rozszerz types.ts (jeśli potrzebne)

```typescript
// src/types.ts

// Types already defined:
// - ListExercisesQuery (lines 213-217)
// - CreateExerciseCommand
// - UpdateExerciseCommand
// - ExerciseDTO (lines 224-233)
// - PaginatedResponse<T> (lines 80-83)
// - mapExerciseToDTO (lines 504-515)
```

### Krok 4: Utwórz Exercises Service

```typescript
// src/lib/exercises.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  ListExercisesQuery,
  CreateExerciseCommand,
  UpdateExerciseCommand,
  PaginatedResponse,
  ExerciseDTO,
  User,
} from "@/types";
import { mapExerciseToDTO, isAdmin } from "@/types";
import { DatabaseError, ForbiddenError, NotFoundError, ConflictError, ValidationError } from "./errors";
import { isValidUUID } from "./utils";

// Implement all functions from service sections above
```

### Krok 5: Utwórz API Route Handlers

- `src/pages/api/exercises/index.ts` (GET, POST)
- `src/pages/api/exercises/[id].ts` (GET, PUT, DELETE)

### Krok 6: Testing

- Testy jednostkowe dla service layer
- Testy integracyjne dla API routes

### Krok 7: Dokumentacja

- OpenAPI/Swagger specification
- Postman collection
- README updates

---

## Kluczowe punkty implementacji

### Authorization Matrix

| Endpoint              | Admin | Trainer | Client |
| --------------------- | ----- | ------- | ------ |
| GET /exercises        | ✅    | ✅      | ✅     |
| GET /exercises/:id    | ✅    | ✅      | ✅     |
| POST /exercises       | ✅    | ❌      | ❌     |
| PUT /exercises/:id    | ✅    | ❌      | ❌     |
| DELETE /exercises/:id | ✅    | ❌      | ❌     |

**Notes:**

- Admin sees all exercises (including hidden)
- Trainer and Client see only visible exercises (is_hidden=false)

### Validation Rules

- **Name**: 3-100 characters, unique (case-sensitive)
- **VimeoToken**: required, 1-50 characters
- **DefaultWeight**: optional, >= 0
- **Description**: optional, max 1000 characters

### Business Rules

- Exercise names must be unique (case-sensitive)
- Hidden exercises not visible to non-admins
- Can't hard delete exercises used in plans
- Soft delete preferred (set is_hidden=true)
- Search is case-insensitive (ILIKE)

### Error Handling

- **409 Conflict**: Name already exists, used in plans
- **404 Not Found**: Exercise doesn't exist or hidden
- **403 Forbidden**: Not admin (for write operations)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required

---

## Podsumowanie

Ten dokument zawiera kompletne plany implementacji dla wszystkich operacji na ćwiczeniach:

✅ **GET /exercises** - Listowanie z paginacją i wyszukiwaniem (all users)  
✅ **POST /exercises** - Tworzenie (admin only)  
✅ **GET /exercises/:id** - Pobieranie (all users, with visibility check)  
✅ **PUT /exercises/:id** - Aktualizacja (admin only)  
✅ **DELETE /exercises/:id** - Usuwanie soft/hard (admin only)

Każdy endpoint ma:

- Szczegółową specyfikację request/response
- Authorization logic
- Validation schemas
- Service implementation
- Error handling
- Testing examples
- Performance considerations

**Kluczowe funkcjonalności:**

- Wszyscy zalogowani użytkownicy mogą przeglądać ćwiczenia
- Admin widzi wszystkie ćwiczenia (including hidden)
- Trenerzy i klienci widzą tylko visible exercises
- Wyszukiwanie case-insensitive po nazwie
- Paginacja offset-based (MVP), cursor-based (future)
- Indeksy dla wydajności
- Soft delete preferred over hard delete

**Znane ograniczenia MVP:**

- ILIKE search może być wolne (production: full-text search)
- COUNT exact może być wolne dla dużych tabel
- Brak zaawansowanego filtrowania (po kategorii, muscle group)
- Brak sortowania po innych polach
- Offset-based pagination (nie cursor-based)

**Następne kroki:**

1. ✅ Implementacja exercises.service.ts
2. ✅ Implementacja API routes
3. ⏳ Dodanie indeksów do bazy (migracja)
4. ⏳ Testy jednostkowe i integracyjne
5. ⏳ Dokumentacja OpenAPI/Postman
6. ⏳ Performance monitoring i optimization

Ten endpoint stanowi fundament dla biblioteki ćwiczeń w systemie Move with Nat.
