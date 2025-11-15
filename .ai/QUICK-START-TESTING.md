# 🚀 Quick Start - Testing Exercises API

## Krok 1: Uruchom serwer deweloperski

```bash
npm run dev
```

Serwer uruchomi się na: `http://localhost:3000`

---

## Krok 2: Import kolekcji Postmana

### Opcja A: Import pliku JSON

1. Otwórz Postman
2. Kliknij **Import** (lewy górny róg)
3. Wybierz plik: `.ai/Exercises-API.postman_collection.json`
4. Kliknij **Import**

✅ Gotowe! Masz kolekcję z 7 requestami gotowymi do użycia.

### Opcja B: Link do współdzielenia (wkrótce)

Po wrzuceniu kolekcji do Postman Cloud, otrzymasz link do udostępnienia.

---

## Krok 3: Testowanie w Postmanie

### Test 1: Utwórz ćwiczenie

1. Wybierz request **"Create Exercise"**
2. Sprawdź body (już jest wypełniony):

```json
{
  "name": "Barbell Squat",
  "description": "Compound lower body exercise targeting quads, glutes, and hamstrings",
  "vimeoToken": "abc123xyz",
  "defaultWeight": 20
}
```

3. Kliknij **Send**
4. Powinieneś otrzymać **201 Created** z ID ćwiczenia
5. **ID automatycznie zapisze się** w zmiennej `exercise_id` 🎉

### Test 2: Pobierz ćwiczenie

1. Wybierz request **"Get Exercise by ID"**
2. Zauważ, że URL używa `{{exercise_id}}` - to ID z poprzedniego kroku
3. Kliknij **Send**
4. Powinieneś otrzymać **200 OK** ze szczegółami ćwiczenia

### Test 3: Zaktualizuj ćwiczenie

1. Wybierz request **"Update Exercise"**
2. Body jest już wypełniony - możesz zmienić wartości
3. Kliknij **Send**
4. Powinieneś otrzymać **200 OK** z zaktualizowanymi danymi

### Test 4: Usuń ćwiczenie (soft delete)

1. Wybierz request **"Delete Exercise (Soft)"**
2. Kliknij **Send**
3. Powinieneś otrzymać **204 No Content**
4. Ćwiczenie zostanie ukryte (`is_hidden = true`), ale nie usunięte z bazy

---

## Krok 4: Testowanie z cURL (alternatywa)

### Utwórz ćwiczenie

```bash
curl -X POST http://localhost:3000/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exercise",
    "vimeoToken": "test123",
    "defaultWeight": 15
  }'
```

**Zapisz ID z odpowiedzi!** Przykład:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  ...
}
```

### Pobierz ćwiczenie

```bash
curl http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000
```

### Zaktualizuj ćwiczenie

```bash
curl -X PUT http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Exercise"
  }'
```

### Usuń ćwiczenie

```bash
curl -X DELETE http://localhost:3000/api/exercises/550e8400-e29b-41d4-a716-446655440000
```

---

## 📋 Przykładowe dane do testowania

### Przykład 1: Podstawowy (wszystkie pola)

```json
{
  "name": "Barbell Squat",
  "description": "Compound lower body exercise",
  "vimeoToken": "abc123",
  "defaultWeight": 20
}
```

### Przykład 2: Minimalny (tylko wymagane pola)

```json
{
  "name": "Deadlift",
  "vimeoToken": "def456"
}
```

### Przykład 3: Bez wagi domyślnej

```json
{
  "name": "Pull-up",
  "description": "Bodyweight upper body exercise",
  "vimeoToken": "ghi789"
}
```

### Przykład 4: Update (częściowy)

```json
{
  "defaultWeight": 25
}
```

### Przykład 5: Update (zmiana nazwy i opisu)

```json
{
  "name": "Barbell Back Squat",
  "description": "Updated description with more detail"
}
```

---

## ⚠️ Ważne informacje

### Obecna konfiguracja (DEV MODE)

🔓 **Autentykacja jest WYŁĄCZONA** - wszystkie requesty działają jako administrator (admin)

W pliku `src/middleware/index.ts` znajduje się:

```typescript
// TEMPORARY: Mock admin user for testing
context.locals.user = {
  id: "c8296dc9-d343-4514-a74f-ab893aad7b19",
  email: "admin@example.com",
  role: "admin",
};
```

### Kiedy autentykacja zostanie włączona

Będziesz musiał dodać header do każdego requesta w Postmanie:

```
Authorization: Bearer {your_jwt_token}
```

Kod autentykacji jest już gotowy, ale zakomentowany w middleware.

---

## 🐛 Rozwiązywanie problemów

### Problem: "Exercise with this name already exists"

**Rozwiązanie:** Zmień nazwę ćwiczenia - nazwy muszą być unikalne.

### Problem: "Invalid UUID format"

**Rozwiązanie:** Sprawdź czy używasz poprawnego ID z poprzedniego requesta.

### Problem: Cannot DELETE exercise

**Rozwiązanie:** Jeśli używasz `?hard=true`, ćwiczenie może być używane w planach. Użyj soft delete (bez parametru).

### Problem: Server not running

**Rozwiązanie:**

```bash
npm run dev
```

---

## 📊 Wszystkie endpointy (podsumowanie)

| Method | Endpoint                       | Opis                  |
| ------ | ------------------------------ | --------------------- |
| POST   | `/api/exercises`               | Utwórz ćwiczenie      |
| GET    | `/api/exercises/:id`           | Pobierz ćwiczenie     |
| PUT    | `/api/exercises/:id`           | Zaktualizuj ćwiczenie |
| DELETE | `/api/exercises/:id`           | Usuń (soft)           |
| DELETE | `/api/exercises/:id?hard=true` | Usuń (hard)           |

---

## 🎯 Następne kroki

1. ✅ Przetestuj wszystkie endpointy
2. ⏳ Dodaj endpoint GET /api/exercises (lista z paginacją)
3. ⏳ Włącz autentykację
4. ⏳ Dodaj endpointy dla Plans
5. ⏳ Dodaj endpointy dla Users

---

## 📖 Więcej informacji

Szczegółowa dokumentacja: `.ai/exercises-api-testing.md`
