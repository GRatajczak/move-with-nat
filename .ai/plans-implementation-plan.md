# API Endpoints Implementation Plan: Plans

Ten dokument zawiera plany implementacji dla wszystkich operacji na planach treningowych:

- GET /plans - Lista planów
- POST /plans - Tworzenie planu
- GET /plans/:id - Pobieranie planu
- PUT /plans/:id - Aktualizacja planu
- DELETE /plans/:id - Usuwanie planu
- PATCH /plans/:id/visibility - Zmiana widoczności

---

## GET /plans - List Plans

### Przegląd

Endpoint do pobierania paginowanej listy planów z filtrowaniem.

### Request

- **Method:** GET
- **URL:** `/api/plans`
- **Query Params:**
  - `trainerId` (UUID): Filter by trainer
  - `traineeId` (UUID): Filter by trainee (client)
  - `visible` (boolean): Filter by visibility
  - `page` (int, default 1)
  - `limit` (int, default 20)
  - `sortBy` (string, default "createdAt")

### Authorization

- **Admin**: All plans
- **Trainer**: Own plans (trainer_id = user.id)
- **Client**: Own plans (client_id = user.id)

### Response (200)

```json
{
  "data": [
    {
      "id": "uuid",
      "trainerId": "uuid",
      "traineeId": "uuid",
      "name": "Leg Day",
      "description": "Quad focus workout",
      "isVisible": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 10 }
}
```

### Implementation

```typescript
export async function listPlans(
  supabase: SupabaseClient,
  query: ListPlansQuery,
  currentUser: User
): Promise<PaginatedResponse<PlanDTO>> {
  let dbQuery = supabase.from("plans").select("*", { count: "exact" });

  // Force filters based on role
  if (currentUser.role === "trainer") {
    dbQuery = dbQuery.eq("trainer_id", currentUser.id);
  } else if (currentUser.role === "client") {
    dbQuery = dbQuery.eq("client_id", currentUser.id);
  }

  // Apply additional filters
  if (query.trainerId) dbQuery = dbQuery.eq("trainer_id", query.trainerId);
  if (query.traineeId) dbQuery = dbQuery.eq("client_id", query.traineeId);
  if (query.visible !== undefined) {
    dbQuery = dbQuery.eq("is_hidden", !query.visible);
  }

  // Pagination
  const offset = ((query.page || 1) - 1) * (query.limit || 20);
  dbQuery = dbQuery.range(offset, offset + (query.limit || 20) - 1).order("created_at", { ascending: false });

  const { data, error, count } = await dbQuery;
  if (error) throw new DatabaseError("Failed to fetch plans");

  return {
    data: (data || []).map(mapPlanToDTO),
    meta: { page: query.page || 1, limit: query.limit || 20, total: count || 0 },
  };
}
```

---

## POST /plans - Create Plan

### Przegląd

Endpoint do tworzenia nowego planu treningowego z ćwiczeniami.

### Request

- **Method:** POST
- **URL:** `/api/plans`
- **Auth:** Trainer or Admin
- **Body:**

```json
{
  "trainerId": "uuid",
  "traineeId": "uuid",
  "name": "Leg Day",
  "description": "Quad focus",
  "isVisible": true,
  "exercises": [
    {
      "exerciseId": "uuid",
      "sortOrder": 1,
      "sets": 3,
      "reps": 12,
      "tempo": "3-0-3",
      "defaultWeight": 60
    }
  ]
}
```

### Response (201)

```json
{
  "id": "uuid",
  "trainerId": "uuid",
  "traineeId": "uuid",
  "name": "Leg Day",
  "description": "Quad focus",
  "isVisible": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Authorization

- **Admin**: Can create for any trainer/trainee
- **Trainer**: Can create only for self and own trainees
- **Client**: No access

### Validation

- Name: required, 3-100 chars
- trainerId: must exist and be trainer role
- traineeId: must exist and be client role
- exercises: min 1 exercise required
- tempo: pattern `^\d{4}$` or `^\d+-\d+-\d+$`

### Implementation

```typescript
export async function createPlan(
  supabase: SupabaseClient,
  command: CreatePlanCommand,
  currentUser: User
): Promise<PlanDTO> {
  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot create plans");
  }

  if (currentUser.role === "trainer") {
    // Must be creating for self
    if (command.trainerId !== currentUser.id) {
      throw new ForbiddenError("Trainers can only create plans for themselves");
    }
    // Must be own trainee
    const { data: trainee } = await supabase.from("users").select("trainer_id").eq("id", command.traineeId).single();

    if (!trainee || trainee.trainer_id !== currentUser.id) {
      throw new ForbiddenError("Can only create plans for your trainees");
    }
  }

  // Validate trainer and trainee exist
  await validateTrainer(supabase, command.trainerId);
  await validateClient(supabase, command.traineeId);

  // Validate exercises exist
  for (const ex of command.exercises) {
    await validateExerciseExists(supabase, ex.exerciseId);
  }

  // Create plan
  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      trainer_id: command.trainerId,
      client_id: command.traineeId,
      name: command.name,
      is_hidden: !command.isVisible,
    })
    .select()
    .single();

  if (error) throw new DatabaseError("Failed to create plan");

  // Create plan_exercises
  const planExercises = command.exercises.map((ex) => ({
    plan_id: plan.id,
    exercise_id: ex.exerciseId,
    exercise_order: ex.sortOrder,
    tempo: ex.tempo || "3-0-3",
    default_weight: ex.defaultWeight || null,
    is_completed: false,
  }));

  const { error: exError } = await supabase.from("plan_exercises").insert(planExercises);

  if (exError) {
    // Rollback plan
    await supabase.from("plans").delete().eq("id", plan.id);
    throw new DatabaseError("Failed to add exercises to plan");
  }

  // TODO: Send email notification to trainee

  return mapPlanToDTO(plan);
}
```

---

## GET /plans/:id - Get Plan by ID

### Przegląd

Endpoint do pobierania szczegółów planu wraz z listą ćwiczeń.

### Request

- **Method:** GET
- **URL:** `/api/plans/:id`
- **Auth:** Admin, Trainer (own), Client (own)

### Response (200)

```json
{
  "id": "uuid",
  "trainerId": "uuid",
  "traineeId": "uuid",
  "name": "Leg Day",
  "description": "Quad focus",
  "isVisible": true,
  "exercises": [
    {
      "id": "uuid",
      "planId": "uuid",
      "exerciseId": "uuid",
      "exerciseName": "Squat",
      "exerciseDescription": "...",
      "vimeoToken": "abc123",
      "exerciseOrder": 1,
      "tempo": "3-0-3",
      "defaultWeight": 60,
      "sets": 3,
      "reps": 12,
      "isCompleted": false,
      "reasonId": null,
      "customReason": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Implementation

```typescript
export async function getPlan(
  supabase: SupabaseClient,
  planId: string,
  currentUser: User
): Promise<PlanWithExercisesDTO> {
  // Fetch plan
  const { data: plan, error } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (error || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }
  if (currentUser.role === "client" && plan.client_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }

  // Fetch plan exercises with exercise details
  const { data: planExercises, error: exError } = await supabase
    .from("plan_exercises")
    .select(
      `
      *,
      exercise:exercises(*)
    `
    )
    .eq("plan_id", planId)
    .order("exercise_order");

  if (exError) throw new DatabaseError("Failed to fetch plan exercises");

  return {
    ...mapPlanToDTO(plan),
    exercises: (planExercises || []).map(mapPlanExerciseToDetailDTO),
  };
}
```

---

## PUT /plans/:id - Update Plan

### Przegląd

Endpoint do aktualizacji planu (metadane i/lub lista ćwiczeń).

### Request

- **Method:** PUT
- **URL:** `/api/plans/:id`
- **Auth:** Admin or Trainer (own)
- **Body:** (all fields optional)

```json
{
  "name": "Updated name",
  "description": "Updated description",
  "isVisible": false,
  "exercises": [
    {
      "exerciseId": "uuid",
      "sortOrder": 1,
      "sets": 4,
      "reps": 10,
      "tempo": "4-0-2",
      "defaultWeight": 70
    }
  ]
}
```

### Authorization

- **Admin**: Can update any plan
- **Trainer**: Can update own plans only
- **Client**: No access

### Implementation

```typescript
export async function updatePlan(
  supabase: SupabaseClient,
  planId: string,
  command: UpdatePlanCommand,
  currentUser: User
): Promise<PlanDTO> {
  // Fetch plan
  const { data: plan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (fetchError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot update plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only update your own plans");
  }

  // Build update object
  const updateData: any = { updated_at: new Date().toISOString() };
  if (command.name) updateData.name = command.name;
  if (command.description !== undefined) updateData.description = command.description;
  if (command.isVisible !== undefined) updateData.is_hidden = !command.isVisible;
  if (command.trainerId) updateData.trainer_id = command.trainerId;
  if (command.traineeId) updateData.client_id = command.traineeId;

  // Update plan
  const { error } = await supabase.from("plans").update(updateData).eq("id", planId);

  if (error) throw new DatabaseError("Failed to update plan");

  // Update exercises if provided
  if (command.exercises) {
    // Delete existing
    await supabase.from("plan_exercises").delete().eq("plan_id", planId);

    // Insert new
    const planExercises = command.exercises.map((ex) => ({
      plan_id: planId,
      exercise_id: ex.exerciseId,
      exercise_order: ex.sortOrder,
      tempo: ex.tempo || "3-0-3",
      default_weight: ex.defaultWeight || null,
      is_completed: false,
    }));

    await supabase.from("plan_exercises").insert(planExercises);

    // TODO: Send email notification if exercises changed
  }

  return mapPlanToDTO({ ...plan, ...updateData });
}
```

---

## DELETE /plans/:id - Delete Plan

### Przegląd

Endpoint do usuwania planu (soft delete).

### Request

- **Method:** DELETE
- **URL:** `/api/plans/:id`
- **Query:** `?hard=true` (optional)
- **Auth:** Admin or Trainer (own)

### Response

- **204 No Content**

### Implementation

```typescript
export async function deletePlan(
  supabase: SupabaseClient,
  planId: string,
  currentUser: User,
  hard: boolean = false
): Promise<void> {
  // Fetch plan
  const { data: plan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (fetchError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot delete plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only delete your own plans");
  }

  if (hard) {
    // Hard delete (CASCADE will delete plan_exercises)
    const { error } = await supabase.from("plans").delete().eq("id", planId);
    if (error) throw new DatabaseError("Failed to delete plan");
  } else {
    // Soft delete
    const { error } = await supabase
      .from("plans")
      .update({ is_hidden: true, updated_at: new Date().toISOString() })
      .eq("id", planId);
    if (error) throw new DatabaseError("Failed to delete plan");
  }
}
```

---

## PATCH /plans/:id/visibility - Toggle Visibility

### Przegląd

Endpoint do zmiany widoczności planu dla podopiecznego.

### Request

- **Method:** PATCH
- **URL:** `/api/plans/:id/visibility`
- **Auth:** Admin or Trainer (own)
- **Body:**

```json
{
  "isVisible": false
}
```

### Response (200)

```json
{
  "id": "uuid",
  "trainerId": "uuid",
  "traineeId": "uuid",
  "name": "Leg Day",
  "isVisible": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Implementation

```typescript
export async function togglePlanVisibility(
  supabase: SupabaseClient,
  planId: string,
  isVisible: boolean,
  currentUser: User
): Promise<PlanDTO> {
  // Fetch plan
  const { data: plan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (fetchError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot change plan visibility");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only update visibility of your own plans");
  }

  // Update visibility
  const { data: updated, error } = await supabase
    .from("plans")
    .update({
      is_hidden: !isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .select()
    .single();

  if (error) throw new DatabaseError("Failed to update plan visibility");

  return mapPlanToDTO(updated);
}
```

---

## API Route Handlers

### src/pages/api/plans/index.ts

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  // Implementation for listPlans
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Implementation for createPlan
};
```

### src/pages/api/plans/[id].ts

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  // Implementation for getPlan
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  // Implementation for updatePlan
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  // Implementation for deletePlan
};
```

### src/pages/api/plans/[id]/visibility.ts

```typescript
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Implementation for togglePlanVisibility
};
```

---

## Validation Schemas

```typescript
const ListPlansQuerySchema = z.object({
  trainerId: z.string().uuid().optional(),
  traineeId: z.string().uuid().optional(),
  visible: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt"]).default("createdAt"),
});

const CreatePlanCommandSchema = z.object({
  trainerId: z.string().uuid(),
  traineeId: z.string().uuid(),
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(1000).optional(),
  isVisible: z.boolean(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        sortOrder: z.number().int().min(1),
        sets: z.number().int().min(1).optional(),
        reps: z.number().int().min(1).optional(),
        tempo: z
          .string()
          .regex(/^\d{4}$|^\d+-\d+-\d+$/)
          .optional(),
        defaultWeight: z.number().min(0).optional(),
      })
    )
    .min(1, "At least one exercise is required"),
});

const TogglePlanVisibilityCommandSchema = z.object({
  isVisible: z.boolean(),
});
```

---

## Error Responses

### Common Errors

- **400**: Validation error (invalid data, empty exercises array)
- **401**: Unauthorized (no JWT)
- **403**: Forbidden (not authorized for this plan)
- **404**: Plan not found
- **409**: Conflict (trainer/trainee validation failed)
- **500**: Internal server error

---

## Testing

### Integration Tests

```bash
# List plans
curl -X GET "http://localhost:3000/api/plans" \
  -H "Authorization: Bearer {jwt}"

# Create plan
curl -X POST "http://localhost:3000/api/plans" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"trainerId":"...","traineeId":"...","name":"Leg Day","isVisible":true,"exercises":[...]}'

# Get plan
curl -X GET "http://localhost:3000/api/plans/{id}" \
  -H "Authorization: Bearer {jwt}"

# Update plan
curl -X PUT "http://localhost:3000/api/plans/{id}" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Delete plan
curl -X DELETE "http://localhost:3000/api/plans/{id}" \
  -H "Authorization: Bearer {trainer_jwt}"

# Toggle visibility
curl -X PATCH "http://localhost:3000/api/plans/{id}/visibility" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"isVisible":false}'
```

---

## Podsumowanie

✅ **GET /plans** - Lista z filtrowaniem  
✅ **POST /plans** - Tworzenie z ćwiczeniami  
✅ **GET /plans/:id** - Pobieranie z detalami ćwiczeń  
✅ **PUT /plans/:id** - Aktualizacja (metadata + exercises)  
✅ **DELETE /plans/:id** - Soft/hard delete  
✅ **PATCH /plans/:id/visibility** - Toggle widoczności

**Kluczowe funkcje:**

- Trenerzy tworzą plany dla swoich podopiecznych
- Transakcja dla plan + plan_exercises
- Email notification przy tworzeniu/aktualizacji
- Soft delete domyślnie
- RLS policies dla dostępu

**Business Rules:**

- Plan musi mieć ≥1 ćwiczenie
- trainerId must be trainer role
- traineeId must be client role
- Trainer can only create for own trainees
- Tempo validation: 4 digits or X-X-X format
