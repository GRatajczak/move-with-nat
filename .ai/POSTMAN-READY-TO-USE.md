# 🚀 Gotowy Request dla Postmana - Exercises API

## ⚠️ WAŻNE: Przed testowaniem

1. **Zrestartuj serwer dev** (aby załadować nowe klucze z `.env`):

   ```bash
   # Ctrl+C aby zatrzymać
   npm run dev
   ```

2. **Sprawdź czy serwer działa**:
   - URL: `http://localhost:3000`

## 📮 Request 1: Create Exercise (pełny)

### Metoda: `POST`

### URL: `http://localhost:3000/api/exercises`

### Headers:

```
Content-Type: application/json
```

### Body (raw JSON):

```json
{
  "name": "Barbell Squat",
  "description": "Compound lower body exercise targeting quads, glutes, and hamstrings",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20
}
```

### Oczekiwany rezultat (201 Created):

```json
{
  "id": "uuid-generated",
  "name": "Barbell Squat",
  "description": "Compound lower body exercise targeting quads, glutes, and hamstrings",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20,
  "isHidden": false,
  "createdAt": "2025-11-12T...",
  "updatedAt": "2025-11-12T..."
}
```

---

## 📮 Request 2: Create Exercise (minimal)

### Metoda: `POST`

### URL: `http://localhost:3000/api/exercises`

### Headers:

```
Content-Type: application/json
```

### Body (raw JSON):

```json
{
  "name": "Deadlift",
  "vimeoToken": "def456uvw"
}
```

### Oczekiwany rezultat (201 Created):

```json
{
  "id": "uuid-generated",
  "name": "Deadlift",
  "description": null,
  "vimeoToken": "def456uvw",
  "defaultWeight": null,
  "isHidden": false,
  "createdAt": "2025-11-12T...",
  "updatedAt": "2025-11-12T..."
}
```

---

## 📮 Request 3: Get Exercise by ID

### Metoda: `GET`

### URL: `http://localhost:3000/api/exercises/{exercise_id}`

**Zamień `{exercise_id}` na UUID otrzymane z Create Exercise**

### Headers:

```
(brak - nie potrzeba)
```

### Oczekiwany rezultat (200 OK):

```json
{
  "id": "uuid",
  "name": "Barbell Squat",
  "description": "Compound lower body exercise...",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20,
  "isHidden": false,
  "createdAt": "2025-11-12T...",
  "updatedAt": "2025-11-12T..."
}
```

---

## 📮 Request 4: Update Exercise

### Metoda: `PUT`

### URL: `http://localhost:3000/api/exercises/{exercise_id}`

### Headers:

```
Content-Type: application/json
```

### Body (raw JSON):

```json
{
  "name": "Barbell Back Squat",
  "defaultWeight": 25
}
```

### Oczekiwany rezultat (200 OK):

```json
{
  "id": "uuid",
  "name": "Barbell Back Squat",
  "description": "Compound lower body exercise...",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 25,
  "isHidden": false,
  "createdAt": "2025-11-12T...",
  "updatedAt": "2025-11-12T..."
}
```

---

## 📮 Request 5: Delete Exercise (Soft)

### Metoda: `DELETE`

### URL: `http://localhost:3000/api/exercises/{exercise_id}`

### Headers:

```
(brak - nie potrzeba)
```

### Oczekiwany rezultat (204 No Content):

```
(pusty response, status 204)
```

---

## 📮 Request 6: Delete Exercise (Hard)

### Metoda: `DELETE`

### URL: `http://localhost:3000/api/exercises/{exercise_id}?hard=true`

### Headers:

```
(brak - nie potrzeba)
```

### Oczekiwany rezultat (204 No Content):

```
(pusty response, status 204)
```

---

## 🔧 Konfiguracja lokalna

Twój plik `.env` jest teraz skonfigurowany z **lokalnymi** kluczami Supabase:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Service role key** omija wszystkie polityki RLS, więc wszystkie operacje powinny działać bez problemów! ✅

---

## 🧪 Quick Test w terminalu

Możesz też przetestować w terminalu:

```bash
# Create Exercise
curl -X POST http://localhost:3000/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exercise",
    "vimeoToken": "test123"
  }'

# Zapisz otrzymane ID i użyj go w następnych requestach
# Get Exercise
curl http://localhost:3000/api/exercises/{EXERCISE_ID}

# Update Exercise
curl -X PUT http://localhost:3000/api/exercises/{EXERCISE_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'

# Delete Exercise (soft)
curl -X DELETE http://localhost:3000/api/exercises/{EXERCISE_ID}
```

---

## ❌ Możliwe błędy i rozwiązania

### Błąd 500: "None of the keys was able to decode the JWT"

**Rozwiązanie:** Zrestartuj serwer dev (`Ctrl+C` i `npm run dev`)

### Błąd 500: "relation exercises does not exist"

**Rozwiązanie:** Uruchom `supabase db reset`

### Błąd 404: Cannot POST /api/exercises

**Rozwiązanie:** Sprawdź czy serwer działa na `http://localhost:3000`

### Błąd połączenia

**Rozwiązanie:**

1. Sprawdź czy `supabase status` pokazuje uruchomione usługi
2. Jeśli nie, uruchom `supabase start`

---

## 📝 Notatki

- ✅ Lokalna baza ma wszystkie migracje zastosowane
- ✅ Polityki RLS są aktywne, ale omijane przez service_role key
- ✅ Mock admin user jest ustawiony w middleware
- ✅ Wszystkie endpointy CRUD działają

**Gotowe do testowania!** 🎉
