# Szybka Lista Kroków - Testowanie Tworzenia Użytkownika

## 🚀 Przygotowanie (Jednorazowe)

```bash
# 1. Reset bazy danych z nowymi migracjami
npx supabase db reset

# 2. Uruchom Supabase
npx supabase start

# 3. W nowym terminalu - uruchom Astro
npm run dev

# 4. Import kolekcji Postman
# Plik: .postman/Auth-API.postman_collection.json

# 5. Skonfiguruj environment w Postman:
# - base_url: http://localhost:4321
# - test_email: client@example.com
```

---

## ✅ Test Główny (Happy Path)

### 1️⃣ Utwórz Trenera

**Postman:** `Users Management → Create Trainer`

```json
POST /api/users
{
  "email": "trainer@example.com",
  "role": "trainer",
  "firstName": "Anna",
  "lastName": "Kowalska"
}
```

**Oczekiwane:** ✅ 201 Created + ID trenera zapisane automatycznie

**Weryfikacja:**
- Sprawdź Inbucket: http://localhost:54324
- Email do `trainer@example.com` powinien być widoczny

---

### 2️⃣ Skopiuj Token Aktywacyjny

1. Otwórz email w Inbucket
2. Skopiuj token z linku (po `?token=`)
3. Wklej do Postman variable: `activation_token`

---

### 3️⃣ Aktywuj Trenera

**Postman:** `Authentication → Activate Account`

```json
POST /api/auth/activate
{
  "token": "{{activation_token}}"
}
```

**Oczekiwane:** ✅ 200 OK - Account activated

---

### 4️⃣ Utwórz Klienta

**Postman:** `Users Management → Create Client with Trainer`

```json
POST /api/users
{
  "email": "client@example.com",
  "role": "client",
  "firstName": "Jan",
  "lastName": "Nowak",
  "trainerId": "{{trainer_id}}"
}
```

**Oczekiwane:** ✅ 201 Created + klient przypisany do trenera

---

### 5️⃣ Aktywuj Klienta

1. Sprawdź email w Inbucket dla `client@example.com`
2. Skopiuj nowy token
3. Wywołaj `POST /api/auth/activate` z nowym tokenem

**Oczekiwane:** ✅ 200 OK

---

### 6️⃣ Sprawdź Listę Użytkowników

**Postman:** `Users Management → List All Users`

```
GET /api/users?page=1&limit=20
```

**Oczekiwane:** ✅ 200 OK + 2 użytkowników (trainer + client)

---

### 7️⃣ Filtruj Klientów Trenera

**Postman:** `Users Management → List Trainer's Clients`

```
GET /api/users?role=client&trainerId={{trainer_id}}
```

**Oczekiwane:** ✅ 200 OK + tylko klient tego trenera

---

## 🔍 Weryfikacja w Supabase Dashboard

### Sprawdź auth.users

1. Otwórz: http://localhost:54323
2. **Authentication → Users**
3. Powinieneś zobaczyć:
   - ✅ `trainer@example.com` (Email Confirmed)
   - ✅ `client@example.com` (Email Confirmed)

### Sprawdź public.users

1. **Table Editor → users**
2. Sprawdź:
   - ✅ 2 wiersze
   - ✅ `id` pasuje do `auth.users.id`
   - ✅ `is_active = true`
   - ✅ `trainer_id` dla klienta wskazuje na trenera

---

## ❌ Testy Błędów (Szybkie)

### 1. Brak trainerId dla klienta
**Request:** `Error: Create Client Without Trainer`  
**Oczekiwane:** 400 Bad Request

### 2. Duplikat emaila
**Request:** `Error: Duplicate Email`  
**Oczekiwane:** 409 Conflict

### 3. Nieważny token
**Request:** `Error: Invalid Activation Token`  
**Oczekiwane:** 401 Unauthorized

---

## 🐛 Szybki Troubleshooting

| Problem | Rozwiązanie |
|---------|-------------|
| Supabase nie działa | `npx supabase start` |
| Email nie przychodzi | Sprawdź http://localhost:54324 |
| Błąd tworzenia użytkownika | Sprawdź logi Astro w terminalu |
| Duplikat email | Usuń użytkownika z `auth.users` |

---

## 📊 Kompletny Flow (1 Obraz)

```
┌─────────────────────────────────────────────────────┐
│  1. POST /api/users (trainer)                       │
│     ↓                                                │
│  2. auth.users created ✅                            │
│     ↓                                                │
│  3. public.users profile created ✅                  │
│     ↓                                                │
│  4. Email sent to Inbucket ✅                        │
│     ↓                                                │
│  5. Copy token from email                           │
│     ↓                                                │
│  6. POST /api/auth/activate                         │
│     ↓                                                │
│  7. is_active = true ✅                              │
│     ↓                                                │
│  8. POST /api/users (client with trainerId)         │
│     ↓                                                │
│  9. Repeat steps 2-7 for client                     │
│     ↓                                                │
│ 10. GET /api/users (verify list) ✅                  │
└─────────────────────────────────────────────────────┘
```

---

## ⏱️ Szacowany Czas Testowania

- **Setup:** 5 minut
- **Happy Path:** 10 minut
- **Error Cases:** 5 minut
- **Verification:** 5 minut
- **TOTAL:** ~25 minut

---

## 🎯 Checklist Sukcesu

- [ ] Trener utworzony i aktywowany
- [ ] Klient utworzony i aktywowany
- [ ] Klient przypisany do trenera (trainer_id)
- [ ] Oba emaile dotarły do Inbucket
- [ ] Lista użytkowników działa
- [ ] Filtrowanie działa
- [ ] Użytkownicy widoczni w Supabase Dashboard
- [ ] ID są spójne między auth.users i public.users

**Jeśli wszystkie checkboxy zaznaczone = Integracja działa! 🎉**

---

Szczegółowy przewodnik: `.ai/testing-guide-user-creation.md`

