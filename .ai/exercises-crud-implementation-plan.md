# API Endpoints Implementation Plan: Exercises CRUD

Ten dokument zawiera plany implementacji dla wszystkich operacji CRUD na ćwiczeniach:

- POST /exercises - Tworzenie nowego ćwiczenia
- GET /exercises/:id - Pobieranie ćwiczenia po ID
- PUT /exercises/:id - Aktualizacja ćwiczenia
- DELETE /exercises/:id - Usuwanie ćwiczenia

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

## API Route Handlers

### Create POST handler in src/pages/api/exercises/index.ts

```typescript
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

### Create src/pages/api/exercises/[id].ts

```typescript
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
describe("Exercises CRUD", () => {
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
# Create exercise
curl -X POST "http://localhost:4321/api/exercises" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Exercise","vimeoToken":"abc123"}'
# Expected: 201 Created

# Get exercise
curl -X GET "http://localhost:4321/api/exercises/{id}" \
  -H "Authorization: Bearer {jwt_token}"
# Expected: 200 OK

# Update exercise
curl -X PUT "http://localhost:4321/api/exercises/{id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
# Expected: 200 OK

# Delete exercise (soft)
curl -X DELETE "http://localhost:4321/api/exercises/{id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content

# Delete exercise (hard)
curl -X DELETE "http://localhost:4321/api/exercises/{id}?hard=true" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content
```

---

## Kluczowe punkty implementacji

### Authorization

- **POST, PUT, DELETE**: Admin only
- **GET by ID**: All authenticated users (but non-admins can't see hidden)
- **GET list**: All authenticated users (automatic filtering of hidden)

### Validation

- Name: 3-100 characters, unique
- VimeoToken: required, 1-50 characters
- DefaultWeight: optional, >= 0
- Description: optional, max 1000 characters

### Business Rules

- Exercise names must be unique (case-sensitive)
- Hidden exercises not visible to non-admins
- Can't hard delete exercises used in plans
- Soft delete preferred (set is_hidden=true)

### Performance

- Index on name for uniqueness check and search
- Index on is_hidden for filtering
- Index on created_at for sorting

### Error Handling

- 409 Conflict: Name already exists, used in plans
- 404 Not Found: Exercise doesn't exist or hidden
- 403 Forbidden: Not admin (for write operations)
- 400 Bad Request: Validation errors

---

## Podsumowanie

Ten dokument zawiera kompletne plany implementacji dla wszystkich operacji CRUD na ćwiczeniach:

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

**Następne kroki:**

1. Implementacja exercises.service.ts
2. Implementacja API routes
3. Testy jednostkowe i integracyjne
4. Dokumentacja OpenAPI
