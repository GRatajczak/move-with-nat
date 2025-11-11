# API Endpoints Implementation Plan: Plan Exercises & Completion

Ten dokument zawiera plany dla zagnieżdżonych endpointów plan exercises i completion records:

- POST /plans/:planId/exercises - Dodaj ćwiczenie do planu
- PATCH /plans/:planId/exercises/:exerciseId - Zaktualizuj ćwiczenie w planie
- DELETE /plans/:planId/exercises/:exerciseId - Usuń ćwiczenie z planu
- POST /plans/:planId/exercises/:exerciseId/completion - Oznacz wykonanie
- GET /plans/:planId/completion - Pobierz status wykonania planu

---

## POST /plans/:planId/exercises - Add Exercise to Plan

### Przegląd

Dodaje pojedyncze ćwiczenie do istniejącego planu treningowego.

### Request

- **Method:** POST
- **URL:** `/api/plans/:planId/exercises`
- **Auth:** Admin or Trainer (own plan)
- **Body:**

```json
{
  "exerciseId": "uuid",
  "sortOrder": 3,
  "sets": 4,
  "reps": 10,
  "tempo": "3-0-3",
  "defaultWeight": 70
}
```

### Response (201)

```json
{
  "id": "uuid",
  "planId": "uuid",
  "exerciseId": "uuid",
  "exerciseOrder": 3,
  "tempo": "3-0-3",
  "defaultWeight": 70,
  "sets": 4,
  "reps": 10,
  "isCompleted": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Authorization

- **Admin**: Can add to any plan
- **Trainer**: Can add to own plans
- **Client**: No access

### Implementation

```typescript
export async function addExerciseToPlan(
  supabase: SupabaseClient,
  planId: string,
  command: AddPlanExerciseCommand,
  currentUser: User
): Promise<PlanExerciseDTO> {
  // Fetch plan and check authorization
  const { data: plan } = await supabase.from("plans").select("trainer_id").eq("id", planId).single();

  if (!plan) throw new NotFoundError("Plan not found");

  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only modify your own plans");
  }

  // Validate exercise exists
  const { data: exercise } = await supabase.from("exercises").select("id").eq("id", command.exerciseId).single();

  if (!exercise) throw new NotFoundError("Exercise not found");

  // Check if already exists
  const { data: existing } = await supabase
    .from("plan_exercises")
    .select("id")
    .eq("plan_id", planId)
    .eq("exercise_id", command.exerciseId)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("Exercise already exists in this plan");
  }

  // Insert plan_exercise
  const { data: planExercise, error } = await supabase
    .from("plan_exercises")
    .insert({
      plan_id: planId,
      exercise_id: command.exerciseId,
      exercise_order: command.sortOrder,
      tempo: command.tempo || "3-0-3",
      default_weight: command.defaultWeight || null,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw new DatabaseError("Failed to add exercise to plan");

  return mapPlanExerciseToDTO(planExercise);
}
```

---

## PATCH /plans/:planId/exercises/:exerciseId - Update Exercise in Plan

### Przegląd

Aktualizuje parametry ćwiczenia w planie (sortOrder, sets, reps, tempo, weight).

### Request

- **Method:** PATCH
- **URL:** `/api/plans/:planId/exercises/:exerciseId`
- **Auth:** Admin or Trainer (own plan)
- **Body:** (all optional)

```json
{
  "sortOrder": 1,
  "sets": 5,
  "reps": 8,
  "tempo": "4-0-2",
  "defaultWeight": 80
}
```

### Response (200)

```json
{
  "id": "uuid",
  "planId": "uuid",
  "exerciseId": "uuid",
  "exerciseOrder": 1,
  "tempo": "4-0-2",
  "defaultWeight": 80,
  "sets": 5,
  "reps": 8,
  "isCompleted": false,
  "updatedAt": "..."
}
```

### Implementation

```typescript
export async function updatePlanExercise(
  supabase: SupabaseClient,
  planId: string,
  exerciseId: string,
  command: UpdatePlanExerciseCommand,
  currentUser: User
): Promise<PlanExerciseDTO> {
  // Check plan ownership
  const { data: plan } = await supabase.from("plans").select("trainer_id").eq("id", planId).single();

  if (!plan) throw new NotFoundError("Plan not found");

  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only modify your own plans");
  }

  // Build update object
  const updateData: any = { updated_at: new Date().toISOString() };
  if (command.sortOrder) updateData.exercise_order = command.sortOrder;
  if (command.tempo) updateData.tempo = command.tempo;
  if (command.defaultWeight !== undefined) updateData.default_weight = command.defaultWeight;
  // Note: sets and reps are not in plan_exercises table (per schema)

  // Update
  const { data: updated, error } = await supabase
    .from("plan_exercises")
    .update(updateData)
    .eq("plan_id", planId)
    .eq("exercise_id", exerciseId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new NotFoundError("Exercise not found in this plan");
    }
    throw new DatabaseError("Failed to update plan exercise");
  }

  return mapPlanExerciseToDTO(updated);
}
```

---

## DELETE /plans/:planId/exercises/:exerciseId - Remove Exercise from Plan

### Przegląd

Usuwa ćwiczenie z planu treningowego.

### Request

- **Method:** DELETE
- **URL:** `/api/plans/:planId/exercises/:exerciseId`
- **Auth:** Admin or Trainer (own plan)

### Response

- **204 No Content**

### Implementation

```typescript
export async function removePlanExercise(
  supabase: SupabaseClient,
  planId: string,
  exerciseId: string,
  currentUser: User
): Promise<void> {
  // Check plan ownership
  const { data: plan } = await supabase.from("plans").select("trainer_id").eq("id", planId).single();

  if (!plan) throw new NotFoundError("Plan not found");

  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only modify your own plans");
  }

  // Delete
  const { error } = await supabase.from("plan_exercises").delete().eq("plan_id", planId).eq("exercise_id", exerciseId);

  if (error) throw new DatabaseError("Failed to remove exercise from plan");

  // Check if plan still has exercises
  const { count } = await supabase
    .from("plan_exercises")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  if (count === 0) {
    console.warn(`Plan ${planId} has no exercises after removal`);
    // Optionally: mark plan as incomplete or notify
  }
}
```

---

## POST /plans/:planId/exercises/:exerciseId/completion - Mark Completion

### Przegląd

Oznacza ćwiczenie jako wykonane lub niewykonane (z opcjonalnym powodem).

### Request

- **Method:** POST
- **URL:** `/api/plans/:planId/exercises/:exerciseId/completion`
- **Auth:** Client (own plan) or Admin
- **Body:**

```json
{
  "completed": true,
  "reasonId": "uuid",
  "customReason": "Felt pain in knee"
}
```

**Validation:**

- If `completed: false`, either `reasonId` OR `customReason` is required
- If `completed: true`, reason fields are ignored

### Response (201)

```json
{
  "planId": "uuid",
  "exerciseId": "uuid",
  "isCompleted": true,
  "reasonId": null,
  "customReason": null,
  "completedAt": "2025-01-20T15:30:00.000Z"
}
```

### Authorization

- **Admin**: Can mark completion for any plan
- **Trainer**: No access (can't mark completion for trainees)
- **Client**: Can mark only for own plans

### Implementation

```typescript
export async function markExerciseCompletion(
  supabase: SupabaseClient,
  planId: string,
  exerciseId: string,
  command: MarkCompletionCommand,
  currentUser: User
): Promise<CompletionRecordDTO> {
  // Fetch plan
  const { data: plan } = await supabase.from("plans").select("client_id, trainer_id").eq("id", planId).single();

  if (!plan) throw new NotFoundError("Plan not found");

  // Authorization: only client (trainee) or admin
  if (currentUser.role === "trainer") {
    throw new ForbiddenError("Trainers cannot mark completion");
  }
  if (currentUser.role === "client" && plan.client_id !== currentUser.id) {
    throw new ForbiddenError("Can only mark completion for your own plans");
  }

  // Validation: if not completed, require reason
  if (!command.completed && !command.reasonId && !command.customReason) {
    throw new ValidationError({
      reason: "Either reasonId or customReason is required when not completed",
    });
  }

  // Validate reasonId if provided
  if (command.reasonId) {
    const { data: reason } = await supabase.from("standard_reasons").select("id").eq("id", command.reasonId).single();

    if (!reason) throw new NotFoundError("Reason not found");
  }

  // Update plan_exercise
  const updateData: any = {
    is_completed: command.completed,
    updated_at: new Date().toISOString(),
  };

  if (!command.completed) {
    updateData.reason_id = command.reasonId || null;
    updateData.custom_reason = command.customReason || null;
  } else {
    // Clear reasons if completed
    updateData.reason_id = null;
    updateData.custom_reason = null;
  }

  const { error } = await supabase
    .from("plan_exercises")
    .update(updateData)
    .eq("plan_id", planId)
    .eq("exercise_id", exerciseId);

  if (error) {
    if (error.code === "PGRST116") {
      throw new NotFoundError("Exercise not found in plan");
    }
    throw new DatabaseError("Failed to mark completion");
  }

  return {
    planId,
    exerciseId,
    isCompleted: command.completed,
    reasonId: updateData.reason_id,
    customReason: updateData.custom_reason,
    completedAt: updateData.updated_at,
  };
}
```

---

## GET /plans/:planId/completion - Get Plan Completion Status

### Przegląd

Pobiera status wykonania wszystkich ćwiczeń w planie.

### Request

- **Method:** GET
- **URL:** `/api/plans/:planId/completion`
- **Auth:** Admin, Trainer (own), Client (own)

### Response (200)

```json
{
  "planId": "uuid",
  "completionRecords": [
    {
      "planId": "uuid",
      "exerciseId": "uuid",
      "isCompleted": true,
      "reasonId": null,
      "customReason": null,
      "completedAt": "2025-01-20T15:30:00.000Z"
    },
    {
      "planId": "uuid",
      "exerciseId": "uuid2",
      "isCompleted": false,
      "reasonId": "reason-uuid",
      "customReason": null,
      "completedAt": "2025-01-20T16:00:00.000Z"
    }
  ]
}
```

### Implementation

```typescript
export async function getPlanCompletion(
  supabase: SupabaseClient,
  planId: string,
  currentUser: User
): Promise<PlanCompletionDTO> {
  // Fetch plan
  const { data: plan } = await supabase.from("plans").select("client_id, trainer_id").eq("id", planId).single();

  if (!plan) throw new NotFoundError("Plan not found");

  // Authorization
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }
  if (currentUser.role === "client" && plan.client_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }

  // Fetch completion records
  const { data: planExercises, error } = await supabase
    .from("plan_exercises")
    .select("exercise_id, is_completed, reason_id, custom_reason, updated_at")
    .eq("plan_id", planId)
    .order("exercise_order");

  if (error) throw new DatabaseError("Failed to fetch completion records");

  const completionRecords: CompletionRecordDTO[] = (planExercises || []).map((pe) => ({
    planId,
    exerciseId: pe.exercise_id,
    isCompleted: pe.is_completed,
    reasonId: pe.reason_id,
    customReason: pe.custom_reason,
    completedAt: pe.updated_at,
  }));

  return {
    planId,
    completionRecords,
  };
}
```

---

## API Route Handlers

### src/pages/api/plans/[planId]/exercises/index.ts

```typescript
export const POST: APIRoute = async ({ params, request, locals }) => {
  const { planId } = params;
  const body = await request.json();
  const validated = AddPlanExerciseCommandSchema.parse(body);
  const result = await addExerciseToPlan(locals.supabase, planId!, validated, locals.user);
  return new Response(JSON.stringify(result), { status: 201 });
};
```

### src/pages/api/plans/[planId]/exercises/[exerciseId].ts

```typescript
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { planId, exerciseId } = params;
  const body = await request.json();
  const validated = UpdatePlanExerciseCommandSchema.parse(body);
  const result = await updatePlanExercise(locals.supabase, planId!, exerciseId!, validated, locals.user);
  return new Response(JSON.stringify(result), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { planId, exerciseId } = params;
  await removePlanExercise(locals.supabase, planId!, exerciseId!, locals.user);
  return new Response(null, { status: 204 });
};
```

### src/pages/api/plans/[planId]/exercises/[exerciseId]/completion.ts

```typescript
export const POST: APIRoute = async ({ params, request, locals }) => {
  const { planId, exerciseId } = params;
  const body = await request.json();
  const validated = MarkCompletionCommandSchema.parse(body);
  const result = await markExerciseCompletion(locals.supabase, planId!, exerciseId!, validated, locals.user);
  return new Response(JSON.stringify(result), { status: 201 });
};
```

### src/pages/api/plans/[planId]/completion.ts

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  const { planId } = params;
  const result = await getPlanCompletion(locals.supabase, planId!, locals.user);
  return new Response(JSON.stringify(result), { status: 200 });
};
```

---

## Validation Schemas

```typescript
const AddPlanExerciseCommandSchema = z.object({
  exerciseId: z.string().uuid(),
  sortOrder: z.number().int().min(1),
  sets: z.number().int().min(1).optional(),
  reps: z.number().int().min(1).optional(),
  tempo: z
    .string()
    .regex(/^\d{4}$|^\d+-\d+-\d+$/)
    .optional(),
  defaultWeight: z.number().min(0).optional(),
});

const UpdatePlanExerciseCommandSchema = z
  .object({
    sortOrder: z.number().int().min(1).optional(),
    sets: z.number().int().min(1).optional(),
    reps: z.number().int().min(1).optional(),
    tempo: z
      .string()
      .regex(/^\d{4}$|^\d+-\d+-\d+$/)
      .optional(),
    defaultWeight: z.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const MarkCompletionCommandSchema = z
  .object({
    completed: z.boolean(),
    reasonId: z.string().uuid().optional(),
    customReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // If not completed, require reason
      if (!data.completed && !data.reasonId && !data.customReason) {
        return false;
      }
      return true;
    },
    {
      message: "Either reasonId or customReason is required when not completed",
    }
  );
```

---

## Testing

```bash
# Add exercise to plan
curl -X POST "http://localhost:4321/api/plans/{planId}/exercises" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -d '{"exerciseId":"...","sortOrder":1}'

# Update exercise in plan
curl -X PATCH "http://localhost:4321/api/plans/{planId}/exercises/{exerciseId}" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -d '{"sortOrder":2,"tempo":"4-0-2"}'

# Remove exercise from plan
curl -X DELETE "http://localhost:4321/api/plans/{planId}/exercises/{exerciseId}" \
  -H "Authorization: Bearer {trainer_jwt}"

# Mark completion (by client)
curl -X POST "http://localhost:4321/api/plans/{planId}/exercises/{exerciseId}/completion" \
  -H "Authorization: Bearer {client_jwt}" \
  -d '{"completed":true}'

# Mark incomplete with reason
curl -X POST "http://localhost:4321/api/plans/{planId}/exercises/{exerciseId}/completion" \
  -H "Authorization: Bearer {client_jwt}" \
  -d '{"completed":false,"customReason":"Felt pain"}'

# Get completion status
curl -X GET "http://localhost:4321/api/plans/{planId}/completion" \
  -H "Authorization: Bearer {trainer_jwt}"
```

---

## Podsumowanie

✅ **POST /plans/:planId/exercises** - Dodaj ćwiczenie  
✅ **PATCH /plans/:planId/exercises/:exerciseId** - Zaktualizuj parametry  
✅ **DELETE /plans/:planId/exercises/:exerciseId** - Usuń ćwiczenie  
✅ **POST /plans/:planId/exercises/:exerciseId/completion** - Oznacz wykonanie  
✅ **GET /plans/:planId/completion** - Pobierz status

**Kluczowe punkty:**

- Trener zarządza ćwiczeniami w planie
- Klient oznacza wykonanie
- Wymagany powód dla niewykonanych ćwiczeń
- Walidacja uniqueness exercise w planie
- Sprawdzanie czy plan nie zostaje pusty
