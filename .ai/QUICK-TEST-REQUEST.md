# ⚡ Quick Test - Skopiuj i wklej do Postmana

## 🎯 Najszybszy sposób testowania

### Krok 1: Zrestartuj serwer

```bash
# Ctrl+C aby zatrzymać, potem:
npm run dev
```

### Krok 2: Otwórz Postman i utwórz nowy request

### Krok 3: Skopiuj te ustawienia:

**Metoda:** `POST`

**URL:**

```
http://localhost:3000/api/exercises
```

**Tab "Headers":**

```
Content-Type: application/json
```

**Tab "Body" → wybierz "raw" → wybierz "JSON":**

```json
{
  "name": "Test Exercise",
  "description": "This is a test",
  "vimeoToken": "test123abc",
  "defaultWeight": 15
}
```

### Krok 4: Kliknij "Send"

### ✅ Oczekiwany rezultat:

**Status:** `201 Created`

**Response:**

```json
{
  "id": "c8a2f1b3-...",
  "name": "Test Exercise",
  "description": "This is a test",
  "vimeoToken": "test123abc",
  "defaultWeight": 15,
  "isHidden": false,
  "createdAt": "2025-11-12T20:30:00.000Z",
  "updatedAt": "2025-11-12T20:30:00.000Z"
}
```

---

## 🔄 Następny test: GET by ID

Skopiuj `id` z poprzedniego response i użyj go tutaj:

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/exercises/{WKLEJ-ID-TUTAJ}
```

Przykład:

```
http://localhost:3000/api/exercises/c8a2f1b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c
```

**Kliknij "Send"**

✅ Powinieneś otrzymać ten sam exercise z statusem `200 OK`

---

## ❌ Jeśli widzisz błąd:

### "None of the keys was able to decode the JWT"

→ **Zrestartowałeś serwer?** (Ctrl+C i `npm run dev`)

### "Failed to fetch" lub "Could not get any response"

→ **Serwer nie działa.** Sprawdź terminal czy `npm run dev` się uruchomił

### "relation exercises does not exist"

→ Uruchom w terminalu: `supabase db reset`

---

## 🎉 Jeśli działa:

Gratulacje! Możesz teraz:

1. ✅ Testować wszystkie pozostałe endpointy
2. ✅ Używać pełnej kolekcji Postmana (`.ai/Exercises-API.postman_collection.json`)
3. ✅ Rozwijać dalej aplikację

**API działa poprawnie!** 🚀
