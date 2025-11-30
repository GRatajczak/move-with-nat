# Przewodnik Testowania - Tworzenie i Aktywacja Użytkowników

## 📋 Spis Treści

1. [Przygotowanie Środowiska](#1-przygotowanie-środowiska)
2. [Scenariusz Testowy - Happy Path](#2-scenariusz-testowy---happy-path)
3. [Scenariusze Testowe - Błędy](#3-scenariusze-testowe---błędy)
4. [Weryfikacja w Supabase Dashboard](#4-weryfikacja-w-supabase-dashboard)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Przygotowanie Środowiska

### 1.1 Reset Bazy Danych

**UWAGA**: To usunie wszystkie dane z lokalnej bazy!

```bash
cd /Users/grzegorzratajczak/Desktop/workspace/move-with-nat/move-with-nat

# Zatrzymaj Supabase (jeśli działa)
npx supabase stop

# Zresetuj bazę danych z nowymi migracjami
npx supabase db reset

# Uruchom Supabase
npx supabase start
```

**Oczekiwany output:**

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbG...
service_role key: eyJhbG...
```

**Zapisz te dane** - będą potrzebne później!

### 1.2 Uruchom Aplikację Astro

W nowym terminalu:

```bash
cd /Users/grzegorzratajczak/Desktop/workspace/move-with-nat/move-with-nat

# Zainstaluj dependencies (jeśli jeszcze nie)
npm install

# Uruchom dev server
npm run dev
```

**Oczekiwany output:**

```
  🚀  astro  v5.x.x started in XXms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose

  watching for file changes...
```

### 1.3 Import Kolekcji Postman

1. Otwórz Postman
2. Kliknij **Import** (lewy górny róg)
3. Wybierz plik: `.postman/Auth-API.postman_collection.json`
4. Kolekcja "Move with Nat API" powinna się pojawić w lewym panelu

### 1.4 Skonfiguruj Environment w Postman

1. W Postman, kliknij **Environments** (lewy panel)
2. Kliknij **+** aby utworzyć nowy environment
3. Nazwij go: **"Move with Nat - Local"**
4. Dodaj zmienne:

| Variable           | Initial Value           | Current Value           |
| ------------------ | ----------------------- | ----------------------- |
| `base_url`         | `http://localhost:4321` | `http://localhost:4321` |
| `test_email`       | `client@example.com`    | `client@example.com`    |
| `trainer_id`       | _(zostaw puste)_        | _(zostaw puste)_        |
| `client_id`        | _(zostaw puste)_        | _(zostaw puste)_        |
| `activation_token` | _(zostaw puste)_        | _(zostaw puste)_        |
| `reset_token`      | _(zostaw puste)_        | _(zostaw puste)_        |

5. Kliknij **Save**
6. Wybierz ten environment z dropdown w prawym górnym rogu Postman

### 1.5 Sprawdź Inbucket (Email Testing)

Otwórz w przeglądarce: http://localhost:54324

To jest lokalny mail server gdzie będą trafiać wszystkie emaile wysłane przez aplikację.

---

## 2. Scenariusz Testowy - Happy Path

Ten scenariusz testuje pełny przepływ tworzenia i aktywacji użytkownika z integracją Supabase Auth.

### Krok 1: Utwórz Trenera 👤

**Request:** `Users Management → Create Trainer`

**Metoda:** `POST /api/users`

**Body:**

```json
{
  "email": "trainer@example.com",
  "role": "trainer",
  "firstName": "Anna",
  "lastName": "Kowalska"
}
```

**Oczekiwany rezultat:**

- Status: `201 Created`
- Response:

```json
{
  "id": "uuid-tutaj",
  "email": "trainer@example.com",
  "role": "trainer",
  "firstName": "Anna",
  "lastName": "Kowalska",
  "status": "pending",
  "trainerId": null,
  "isActive": false,
  "createdAt": "2024-11-23T...",
  "updatedAt": "2024-11-23T..."
}
```

**Co się dzieje w tle:**

1. ✅ Tworzony jest użytkownik w `auth.users` z `email_confirm=false`
2. ✅ Tworzony jest profil w `public.users` z tym samym `id`
3. ✅ Wysyłany jest email aktywacyjny do Inbucket
4. ✅ Postman automatycznie zapisuje `trainer_id` w environment variables

**Weryfikacja:**

```bash
# Sprawdź w konsoli Postman w zakładce "Tests"
# Powinieneś zobaczyć: "Trainer created with ID: uuid-tutaj"
```

---

### Krok 2: Sprawdź Email Aktywacyjny 📧

1. Otwórz Inbucket: http://localhost:54324
2. Powinieneś zobaczyć email do: `trainer@example.com`
3. Kliknij na email
4. **Skopiuj token aktywacyjny** z linku (będzie w formie długiego base64url stringa)

**Przykładowy link:**

```
http://localhost:4321/activate?token=eyJ1c2VySWQiOiIxMjM0NTY3OCIsImVtYWlsIjoidHJhaW5lckBleGFtcGxlLmNvbSIsInB1cnBvc2UiOiJhY3RpdmF0aW9uIiwiZXhwIjoxNzAwMDAwMDAwfQ
```

**Token to część po `?token=`**

---

### Krok 3: Aktywuj Konto Trenera ✅

**Request:** `Authentication → Activate Account`

**Metoda:** `POST /api/auth/activate`

**Body:**

```json
{
  "token": "wklej-token-z-emaila"
}
```

**Oczekiwany rezultat:**

- Status: `200 OK`
- Response:

```json
{
  "message": "Account activated"
}
```

**Co się dzieje w tle:**

1. ✅ Token jest weryfikowany (ważność 24h)
2. ✅ W `public.users` ustawiane jest `is_active = true`
3. ✅ Użytkownik może teraz ustawić hasło

---

### Krok 4: Ustaw Hasło dla Trenera 🔑

**Request:** `Authentication → Confirm Password Reset`

**UWAGA:** Mimo że to nazywa się "reset password", używamy tego samego endpointa do pierwszego ustawienia hasła.

**Alternatywnie**, możesz to zrobić przez Supabase Dashboard:

1. Otwórz: http://localhost:54323 (Supabase Studio)
2. Idź do: **Authentication → Users**
3. Znajdź `trainer@example.com`
4. Kliknij na użytkownika
5. W sekcji "User Management" kliknij **"Send Password Recovery"**
6. Sprawdź Inbucket i użyj tokenu do ustawienia hasła

**LUB użyj API:**

```bash
# Najpierw wyślij request o reset hasła
POST /api/auth/reset-password/request
{
  "email": "trainer@example.com"
}

# Sprawdź Inbucket, skopiuj reset token
# Potem ustaw hasło:
POST /api/auth/reset-password/confirm
{
  "token": "reset-token-tutaj",
  "newPassword": "TrenerPass123!"
}
```

---

### Krok 5: Utwórz Klienta z Przypisanym Trenerem 👥

**Request:** `Users Management → Create Client with Trainer`

**Metoda:** `POST /api/users`

**Body:**

```json
{
  "email": "client@example.com",
  "role": "client",
  "firstName": "Jan",
  "lastName": "Nowak",
  "trainerId": "{{trainer_id}}"
}
```

**UWAGA:** `{{trainer_id}}` jest automatycznie podstawiane z environment variable!

**Oczekiwany rezultat:**

- Status: `201 Created`
- Response zawiera `trainerId` wskazujący na trenera

**Co się dzieje w tle:**

1. ✅ Walidacja czy `trainer_id` istnieje i ma rolę `trainer`
2. ✅ Utworzenie użytkownika w `auth.users`
3. ✅ Utworzenie profilu w `public.users` z `trainer_id`
4. ✅ Wysłanie emaila aktywacyjnego

---

### Krok 6: Aktywuj Konto Klienta

Powtórz kroki 2-4 dla klienta:

1. Sprawdź email w Inbucket dla `client@example.com`
2. Skopiuj token
3. Wywołaj `POST /api/auth/activate` z tokenem
4. Ustaw hasło (opcjonalnie)

---

### Krok 7: Weryfikuj Listę Użytkowników 📋

**Request:** `Users Management → List All Users`

**Metoda:** `GET /api/users?page=1&limit=20`

**Oczekiwany rezultat:**

- Status: `200 OK`
- Response:

```json
{
  "data": [
    {
      "id": "...",
      "email": "trainer@example.com",
      "role": "trainer",
      "status": "active",
      "trainerId": null
    },
    {
      "id": "...",
      "email": "client@example.com",
      "role": "client",
      "status": "active",
      "trainerId": "uuid-trenera"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### Krok 8: Filtruj Klientów Trenera 🔍

**Request:** `Users Management → List Trainer's Clients`

**Metoda:** `GET /api/users?role=client&trainerId={{trainer_id}}`

**Oczekiwany rezultat:**

- Status: `200 OK`
- Tylko klient przypisany do tego trenera

---

## 3. Scenariusze Testowe - Błędy

### 3.1 Tworzenie Klienta Bez Trenera ❌

**Request:** `Users Management → Error: Create Client Without Trainer`

**Oczekiwany rezultat:**

- Status: `400 Bad Request`
- Response:

```json
{
  "error": "Validation failed",
  "details": {
    "trainerId": "Trainer ID is required for clients"
  }
}
```

**Dlaczego?** Zod schema wymaga `trainerId` gdy `role === "client"`

---

### 3.2 Duplikacja Emaila ❌

**Request:** `Users Management → Error: Duplicate Email`

**Oczekiwany rezultat:**

- Status: `409 Conflict`
- Response:

```json
{
  "error": "Email already exists"
}
```

**Dlaczego?** Email jest unikalny w `auth.users` i `public.users`

---

### 3.3 Nieważny Token Aktywacyjny ❌

**Request:** `Authentication → Error: Invalid Activation Token`

**Body:**

```json
{
  "token": "invalid_token"
}
```

**Oczekiwany rezultat:**

- Status: `401 Unauthorized`
- Response:

```json
{
  "error": "Invalid token format"
}
```

---

### 3.4 Wygasły Token ❌

**Jak przetestować:**

1. Użyj tokenu starszego niż 24h
2. LUB ręcznie utwórz token z przeszłą datą `exp`

**Oczekiwany rezultat:**

- Status: `401 Unauthorized`
- Response:

```json
{
  "error": "Token has expired"
}
```

---

### 3.5 Słabe Hasło ❌

**Request:** `Authentication → Error: Weak Password`

**Body:**

```json
{
  "token": "valid-token",
  "newPassword": "weak"
}
```

**Oczekiwany rezultat:**

- Status: `400 Bad Request`
- Response:

```json
{
  "error": "Validation failed",
  "details": {
    "newPassword": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
  }
}
```

---

## 4. Weryfikacja w Supabase Dashboard

### 4.1 Sprawdź auth.users

1. Otwórz: http://localhost:54323
2. Idź do: **Authentication → Users**
3. Powinieneś zobaczyć:
   - `trainer@example.com` - Email Confirmed: ✅
   - `client@example.com` - Email Confirmed: ✅

### 4.2 Sprawdź public.users

1. W Supabase Studio, idź do: **Table Editor → users**
2. Powinieneś zobaczyć:
   - 2 wiersze (trainer i client)
   - `id` pasuje do `auth.users.id`
   - `is_active = true` dla obu
   - `trainer_id` dla klienta wskazuje na trenera

### 4.3 Sprawdź Trigger

1. Idź do: **Database → Functions**
2. Znajdź: `handle_new_auth_user`
3. To jest backup trigger - sprawdźmy czy działa

**Test triggera:**

```sql
-- W SQL Editor (Database → SQL Editor)
-- Utwórz użytkownika bezpośrednio w auth.users

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'trigger-test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Sprawdź czy profil został utworzony automatycznie
SELECT * FROM public.users WHERE email = 'trigger-test@example.com';
```

**Oczekiwany rezultat:**

- ✅ Profil utworzony automatycznie
- ✅ `role = 'client'` (default)
- ✅ `is_active = false` (default)

---

## 5. Troubleshooting

### Problem: "Failed to create user in authentication system"

**Możliwe przyczyny:**

1. Supabase nie działa

   ```bash
   npx supabase status
   # Jeśli nie działa:
   npx supabase start
   ```

2. Błędne credentials w `.env`

   ```bash
   # Sprawdź czy masz:
   SUPABASE_URL=http://localhost:54321
   SUPABASE_KEY=eyJhbG...  # anon key
   ```

3. Email już istnieje w `auth.users`
   ```sql
   -- Usuń użytkownika z auth.users
   DELETE FROM auth.users WHERE email = 'problematic@example.com';
   ```

---

### Problem: Email nie przychodzi do Inbucket

**Rozwiązanie:**

1. Sprawdź czy Inbucket działa: http://localhost:54324
2. Sprawdź logi aplikacji Astro w terminalu
3. Sprawdź czy SendGrid jest skonfigurowany (dla produkcji)
4. W development, emaile ZAWSZE idą do Inbucket, nie SendGrid

---

### Problem: "User must be created before sending invite"

**To jest spodziewane!** Endpoint `/api/auth/invite` jest do RE-wysłania emaila, nie do tworzenia użytkownika.

**Prawidłowy flow:**

1. `POST /api/users` - tworzy użytkownika i wysyła email
2. `POST /api/auth/invite` (resend=true) - tylko re-wysyła email

---

### Problem: "Failed to create user profile" ale użytkownik istnieje w auth.users

To oznacza że:

1. ✅ Użytkownik utworzony w `auth.users`
2. ❌ Błąd przy tworzeniu profilu w `public.users`
3. ✅ Cleanup: użytkownik usunięty z `auth.users`

**Możliwe przyczyny:**

- Constraint violation (np. `trainerId` nie istnieje)
- RLS policy blokuje INSERT

**Rozwiązanie:**

- Sprawdź logi w terminalu Astro
- Sprawdź constraints w bazie danych

---

### Problem: Token nie działa mimo że jest świeży

**Debugging:**

```typescript
// Decode token lokalnie (w Node.js)
const token = "twoj-token-tutaj";
const decoded = Buffer.from(token, "base64url").toString();
console.log(JSON.parse(decoded));

// Sprawdź:
// 1. exp - czy nie wygasł?
// 2. purpose - czy to "activation" czy "password-reset"?
// 3. userId - czy użytkownik istnieje?
```

---

## 6. Checklist Końcowa ✅

Po zakończeniu wszystkich testów, upewnij się że:

- [ ] Trener został utworzony w `auth.users` i `public.users`
- [ ] Email aktywacyjny dla trenera dotarł do Inbucket
- [ ] Trener został aktywowany (`is_active = true`)
- [ ] Klient został utworzony z `trainer_id`
- [ ] Email aktywacyjny dla klienta dotarł
- [ ] Klient został aktywowany
- [ ] `GET /api/users` zwraca obu użytkowników
- [ ] Filtrowanie po `trainerId` działa
- [ ] Wszystkie error scenariusze zwracają poprawne kody statusu
- [ ] W Supabase Dashboard widać użytkowników w `auth.users`
- [ ] W Supabase Dashboard widać profile w `public.users`
- [ ] `id` w obu tabelach się zgadza

---

## 7. Następne Kroki

Po zakończeniu testów:

1. **Wyłącz mock w middleware**
   - Odkomentuj kod autentykacji w `src/middleware/index.ts`
   - Usuń sekcję "TEMPORARY: Mock admin user"

2. **Przetestuj z prawdziwym JWT**
   - Zaloguj się jako admin przez Supabase Auth
   - Użyj tokenu w headerze: `Authorization: Bearer <token>`

3. **Dodaj więcej użytkowników**
   - Przetestuj limity paginacji
   - Sprawdź performance z większą ilością danych

4. **Wdróż na produkcję**
   - Skonfiguruj SendGrid dla prawdziwych emaili
   - Zmień URL w email templates
   - Dodaj custom email templates w Supabase Dashboard

---

## 📚 Przydatne Linki

- Supabase Studio: http://localhost:54323
- Inbucket (Email): http://localhost:54324
- Astro Dev: http://localhost:4321
- Dokumentacja Supabase Auth: https://supabase.com/docs/guides/auth

---

**Good luck with testing! 🚀**
