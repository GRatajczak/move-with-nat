# API Endpoints Implementation Plan: Standard Reasons

Ten dokument zawiera plany dla operacji CRUD na standard reasons (powody niewykonania ćwiczeń):

- GET /reasons - Lista powodów
- POST /reasons - Tworzenie powodu
- PUT /reasons/:id - Aktualizacja powodu
- DELETE /reasons/:id - Usuwanie powodu

---

## GET /reasons - List Reasons

### Przegląd

Pobiera listę wszystkich dostępnych powodów niewykonania ćwiczeń.

### Request

- **Method:** GET
- **URL:** `/api/reasons`
- **Auth:** All authenticated users

### Response (200)

```json
{
  "data": [
    {
      "id": "uuid",
      "code": "pain",
      "label": "Felt pain during exercise",
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid",
      "code": "fatigue",
      "label": "Too fatigued to complete",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Authorization

- **All authenticated users** can view reasons

### Implementation

```typescript
export async function listReasons(supabase: SupabaseClient): Promise<StandardReasonDTO[]> {
  const { data, error } = await supabase.from("standard_reasons").select("*").order("code");

  if (error) {
    throw new DatabaseError("Failed to fetch reasons");
  }

  return (data || []).map(mapStandardReasonToDTO);
}
```

---

## POST /reasons - Create Reason

### Przegląd

Tworzy nowy standardowy powód niewykonania. Tylko admin.

### Request

- **Method:** POST
- **URL:** `/api/reasons`
- **Auth:** Admin only
- **Body:**

```json
{
  "code": "equipment_unavailable",
  "label": "Equipment was not available"
}
```

### Response (201)

```json
{
  "id": "uuid",
  "code": "equipment_unavailable",
  "label": "Equipment was not available",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

### Validation

- **code**: required, 3-50 chars, alphanumeric + underscore, unique
- **label**: required, 3-200 chars

### Implementation

```typescript
export async function createReason(
  supabase: SupabaseClient,
  command: CreateReasonCommand,
  currentUser: User
): Promise<StandardReasonDTO> {
  // Authorization
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can create reasons");
  }

  // Check code uniqueness
  const { data: existing } = await supabase
    .from("standard_reasons")
    .select("id")
    .eq("code", command.code)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("Reason code already exists");
  }

  // Insert
  const { data: reason, error } = await supabase
    .from("standard_reasons")
    .insert({
      code: command.code,
      label: command.label,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError("Failed to create reason");
  }

  return mapStandardReasonToDTO(reason);
}
```

---

## PUT /reasons/:id - Update Reason

### Przegląd

Aktualizuje istniejący powód. Tylko admin.

### Request

- **Method:** PUT
- **URL:** `/api/reasons/:id`
- **Auth:** Admin only
- **Body:** (all optional)

```json
{
  "code": "updated_code",
  "label": "Updated label"
}
```

### Response (200)

```json
{
  "id": "uuid",
  "code": "updated_code",
  "label": "Updated label",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

### Implementation

```typescript
export async function updateReason(
  supabase: SupabaseClient,
  reasonId: string,
  command: UpdateReasonCommand,
  currentUser: User
): Promise<StandardReasonDTO> {
  // Authorization
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can update reasons");
  }

  // Validate UUID
  if (!isValidUUID(reasonId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch existing
  const { data: existing, error: fetchError } = await supabase
    .from("standard_reasons")
    .select("*")
    .eq("id", reasonId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Reason not found");
  }

  // Check code uniqueness (if changing)
  if (command.code && command.code !== existing.code) {
    const { data: duplicate } = await supabase
      .from("standard_reasons")
      .select("id")
      .eq("code", command.code)
      .neq("id", reasonId)
      .maybeSingle();

    if (duplicate) {
      throw new ConflictError("Reason code already exists");
    }
  }

  // Build update
  const updateData: any = { updated_at: new Date().toISOString() };
  if (command.code) updateData.code = command.code;
  if (command.label) updateData.label = command.label;

  // Update
  const { data: updated, error } = await supabase
    .from("standard_reasons")
    .update(updateData)
    .eq("id", reasonId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError("Failed to update reason");
  }

  return mapStandardReasonToDTO(updated);
}
```

---

## DELETE /reasons/:id - Delete Reason

### Przegląd

Usuwa powód. Tylko admin. Nie można usunąć jeśli jest używany.

### Request

- **Method:** DELETE
- **URL:** `/api/reasons/:id`
- **Auth:** Admin only

### Response

- **204 No Content**

### Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

### Implementation

```typescript
export async function deleteReason(supabase: SupabaseClient, reasonId: string, currentUser: User): Promise<void> {
  // Authorization
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can delete reasons");
  }

  // Validate UUID
  if (!isValidUUID(reasonId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Check if reason exists
  const { data: reason, error: fetchError } = await supabase
    .from("standard_reasons")
    .select("id")
    .eq("id", reasonId)
    .single();

  if (fetchError || !reason) {
    throw new NotFoundError("Reason not found");
  }

  // Check if used in plan_exercises
  const { count } = await supabase
    .from("plan_exercises")
    .select("id", { count: "exact", head: true })
    .eq("reason_id", reasonId);

  if (count > 0) {
    throw new ConflictError("Cannot delete reason that is in use");
  }

  // Delete
  const { error } = await supabase.from("standard_reasons").delete().eq("id", reasonId);

  if (error) {
    throw new DatabaseError("Failed to delete reason");
  }
}
```

---

## API Route Handlers

### src/pages/api/reasons/index.ts

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { listReasons, createReason } from "@/lib/reasons.service";
import { CreateReasonCommandSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await listReasons(locals.supabase);

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const validated = CreateReasonCommandSchema.parse(body);
    const result = await createReason(locals.supabase, validated, locals.user);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

### src/pages/api/reasons/[id].ts

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { updateReason, deleteReason } from "@/lib/reasons.service";
import { UpdateReasonCommandSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";

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
    const validated = UpdateReasonCommandSchema.parse(body);
    const result = await updateReason(locals.supabase, id!, validated, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    await deleteReason(locals.supabase, id!, locals.user);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

---

## Validation Schemas

```typescript
const CreateReasonCommandSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
    .transform((val) => val.toLowerCase()),
  label: z.string().min(3).max(200).trim(),
});

const UpdateReasonCommandSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
      .transform((val) => val.toLowerCase())
      .optional(),
    label: z.string().min(3).max(200).trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

---

## Testing

```bash
# List reasons (all users)
curl -X GET "http://localhost:3000/api/reasons" \
  -H "Authorization: Bearer {jwt}"
# Expected: 200 OK with array

# Create reason (admin only)
curl -X POST "http://localhost:3000/api/reasons" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"code":"new_reason","label":"New reason label"}'
# Expected: 201 Created

# Update reason (admin only)
curl -X PUT "http://localhost:3000/api/reasons/{id}" \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"label":"Updated label"}'
# Expected: 200 OK

# Delete reason (admin only)
curl -X DELETE "http://localhost:3000/api/reasons/{id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content

# Trainer tries to create (should fail)
curl -X POST "http://localhost:3000/api/reasons" \
  -H "Authorization: Bearer {trainer_jwt}" \
  -H "Content-Type: application/json" \
  -d '{"code":"test","label":"Test"}'
# Expected: 403 Forbidden

# Delete reason in use (should fail)
curl -X DELETE "http://localhost:3000/api/reasons/{used_reason_id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 409 Conflict
```

---

## Error Responses

- **400**: Validation error (invalid code format, too short/long)
- **401**: Unauthorized (no JWT)
- **403**: Forbidden (not admin)
- **404**: Reason not found
- **409**: Conflict (code exists, or reason in use)
- **500**: Internal server error

---

## Use Cases

### Common Reasons to Seed

```typescript
const DEFAULT_REASONS = [
  { code: "pain", label: "Felt pain during exercise" },
  { code: "fatigue", label: "Too fatigued to complete" },
  { code: "equipment_unavailable", label: "Equipment was not available" },
  { code: "time_constraint", label: "Ran out of time" },
  { code: "injury", label: "Dealing with an injury" },
  { code: "feeling_unwell", label: "Not feeling well" },
];
```

### Migration to Seed Reasons

```sql
-- supabase/migrations/[timestamp]_seed_standard_reasons.sql
INSERT INTO standard_reasons (code, label) VALUES
  ('pain', 'Felt pain during exercise'),
  ('fatigue', 'Too fatigued to complete'),
  ('equipment_unavailable', 'Equipment was not available'),
  ('time_constraint', 'Ran out of time'),
  ('injury', 'Dealing with an injury'),
  ('feeling_unwell', 'Not feeling well')
ON CONFLICT (code) DO NOTHING;
```

---

## Podsumowanie

✅ **GET /reasons** - Lista (all users)  
✅ **POST /reasons** - Tworzenie (admin only)  
✅ **PUT /reasons/:id** - Aktualizacja (admin only)  
✅ **DELETE /reasons/:id** - Usuwanie (admin only, check usage)

**Kluczowe punkty:**

- Admin manages standard reasons
- All users can view reasons (for completion marking)
- Code must be unique and lowercase
- Cannot delete reason that's in use
- Seed default reasons in migration

**Business Rules:**

- Codes are immutable identifiers (update carefully)
- Labels can be changed freely
- Delete protection for used reasons
- Consider soft delete instead of hard delete for audit trail
