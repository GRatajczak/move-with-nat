# Exercises API - Testing Guide

## Postman Collection

**Import do Postmana:**

Utwórz nową kolekcję i dodaj następujące endpointy:

### Base URL

```
http://localhost:3000
```

---

## 1. POST /api/exercises - Create Exercise

### Request

**Method:** `POST`  
**URL:** `http://localhost:3000/api/exercises`  
**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

**Przykład 1 - Podstawowe dane:**

```json
{
  "name": "Barbell Squat",
  "description": "Compound lower body exercise targeting quads, glutes, and hamstrings",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20
}
```

**Przykład 2 - Minimalne dane (tylko required fields):**

```json
{
  "name": "Deadlift",
  "vimeoToken": "def456uvw"
}
```

**Przykład 3 - Z opcjonalnym description:**

```json
{
  "name": "Bench Press",
  "description": "Upper body compound exercise",
  "vimeoToken": "ghi789rst",
  "defaultWeight": 60
}
```

### Expected Response

**Status:** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Barbell Squat",
  "description": "Compound lower body exercise targeting quads, glutes, and hamstrings",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20,
  "isHidden": false
}
```

### Error Responses

**400 Bad Request - Validation Error:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "String must contain at least 3 character(s)"
  }
}
```

**409 Conflict - Duplicate Name:**

```json
{
  "error": "Exercise with this name already exists",
  "code": "CONFLICT"
}
```

---

## 2. GET /api/exercises/:id - Get Exercise

### Request

**Method:** `GET`  
**URL:** `http://localhost:3000/api/exercises/{exerciseId}`  
**Headers:** None required

**Example URL:**

```
http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000
```

### Expected Response

**Status:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Barbell Squat",
  "description": "Compound lower body exercise targeting quads, glutes, and hamstrings",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20,
  "isHidden": false
}
```

### Error Responses

**400 Bad Request - Invalid UUID:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "id": "Invalid UUID format"
  }
}
```

**404 Not Found:**

```json
{
  "error": "Exercise not found",
  "code": "NOT_FOUND"
}
```

---

## 3. PUT /api/exercises/:id - Update Exercise

### Request

**Method:** `PUT`  
**URL:** `http://localhost:3000/api/exercises/{exerciseId}`  
**Headers:**

```
Content-Type: application/json
```

**Body (JSON) - wszystkie pola opcjonalne:**

**Przykład 1 - Update nazwy:**

```json
{
  "name": "Barbell Back Squat"
}
```

**Przykład 2 - Update wielu pól:**

```json
{
  "name": "Barbell Back Squat",
  "description": "Updated description with more details",
  "defaultWeight": 25
}
```

**Przykład 3 - Update vimeoToken:**

```json
{
  "vimeoToken": "new_token_xyz123"
}
```

### Expected Response

**Status:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Barbell Back Squat",
  "description": "Updated description with more details",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 25,
  "isHidden": false
}
```

### Error Responses

**400 Bad Request - Empty body:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "_errors": ["At least one field must be provided"]
  }
}
```

**409 Conflict - Name already exists:**

```json
{
  "error": "Exercise with this name already exists",
  "code": "CONFLICT"
}
```

---

## 4. DELETE /api/exercises/:id - Delete Exercise (Soft)

### Request

**Method:** `DELETE`  
**URL:** `http://localhost:3000/api/exercises/{exerciseId}`  
**Headers:** None required

**Example URL:**

```
http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000
```

### Expected Response

**Status:** `204 No Content`  
**Body:** Empty

---

## 5. DELETE /api/exercises/:id?hard=true - Delete Exercise (Hard)

### Request

**Method:** `DELETE`  
**URL:** `http://localhost:3000/api/exercises/{exerciseId}?hard=true`  
**Headers:** None required

**Example URL:**

```
http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000?hard=true
```

### Expected Response

**Status:** `204 No Content`  
**Body:** Empty

### Error Responses

**409 Conflict - Exercise used in plans:**

```json
{
  "error": "Cannot delete exercise that is used in plans",
  "code": "CONFLICT"
}
```

---

## cURL Commands

### POST - Create Exercise

```bash
curl -X POST http://localhost:3000/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Barbell Squat",
    "description": "Compound lower body exercise",
    "vimeoToken": "abc123xyz",
    "defaultWeight": 20
  }'
```

### GET - Get Exercise

```bash
curl -X GET http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000
```

### PUT - Update Exercise

```bash
curl -X PUT http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Barbell Back Squat",
    "defaultWeight": 25
  }'
```

### DELETE - Soft Delete

```bash
curl -X DELETE http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000
```

### DELETE - Hard Delete

```bash
curl -X DELETE "http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000?hard=true"
```

---

## Validation Rules

### Create Exercise (`POST /api/exercises`)

| Field         | Type   | Required | Min | Max  | Notes          |
| ------------- | ------ | -------- | --- | ---- | -------------- |
| name          | string | ✅ Yes   | 3   | 100  | Must be unique |
| description   | string | ❌ No    | -   | 1000 | Optional       |
| vimeoToken    | string | ✅ Yes   | 1   | 50   | Required       |
| defaultWeight | number | ❌ No    | 0   | -    | Must be >= 0   |

### Update Exercise (`PUT /api/exercises/:id`)

Wszystkie pola opcjonalne, ale przynajmniej jedno musi być podane.

| Field         | Type   | Required | Min | Max  | Notes                      |
| ------------- | ------ | -------- | --- | ---- | -------------------------- |
| name          | string | ❌ No    | 3   | 100  | Must be unique if provided |
| description   | string | ❌ No    | -   | 1000 | Optional                   |
| vimeoToken    | string | ❌ No    | 1   | 50   | Optional                   |
| defaultWeight | number | ❌ No    | 0   | -    | Must be >= 0               |

---

## Status Codes Summary

| Code | Meaning        | When                                |
| ---- | -------------- | ----------------------------------- |
| 200  | OK             | GET, PUT success                    |
| 201  | Created        | POST success                        |
| 204  | No Content     | DELETE success                      |
| 400  | Bad Request    | Validation error, invalid UUID      |
| 401  | Unauthorized   | No authentication (future)          |
| 403  | Forbidden      | Not admin (future)                  |
| 404  | Not Found      | Exercise doesn't exist or hidden    |
| 409  | Conflict       | Name exists, exercise used in plans |
| 500  | Internal Error | Database error                      |

---

## Testing Workflow

### 1. Create an Exercise

```bash
curl -X POST http://localhost:3000/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exercise",
    "vimeoToken": "test123"
  }'
```

**Save the returned `id` from the response!**

### 2. Get the Exercise

```bash
curl -X GET http://localhost:3000/api/exercises/{id}
```

### 3. Update the Exercise

```bash
curl -X PUT http://localhost:3000/api/exercises/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Exercise",
    "defaultWeight": 10
  }'
```

### 4. Soft Delete

```bash
curl -X DELETE http://localhost:3000/api/exercises/{id}
```

### 5. Verify it's hidden (should return 404 for non-admins)

```bash
curl -X GET http://localhost:3000/api/exercises/{id}
```

---

## Postman Environment Variables

Utwórz w Postmanie environment z następującymi zmiennymi:

```
base_url = http://localhost:3000
exercise_id = (zostanie ustawione automatycznie po utworzeniu ćwiczenia)
```

### Automatyczne zapisywanie exercise_id po POST

W zakładce "Tests" dla POST request dodaj:

```javascript
if (pm.response.code === 201) {
  const response = pm.response.json();
  pm.environment.set("exercise_id", response.id);
}
```

Następnie w innych requestach użyj `{{exercise_id}}` zamiast hardcoded UUID.

---

## Common Issues & Solutions

### Issue: "Exercise not found" ale exercise istnieje

**Solution:** Sprawdź czy exercise nie jest ukryty (`is_hidden = true`). Non-admin users nie widzą ukrytych ćwiczeń.

### Issue: "Exercise with this name already exists"

**Solution:** Zmień nazwę ćwiczenia - nazwy muszą być unikalne.

### Issue: Validation error na vimeoToken

**Solution:** VimeoToken jest wymagany i musi mieć 1-50 znaków.

### Issue: "Cannot delete exercise that is used in plans"

**Solution:** To ćwiczenie jest używane w planach. Użyj soft delete (bez `?hard=true`) zamiast hard delete.
