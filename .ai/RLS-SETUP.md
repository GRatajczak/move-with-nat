# 🔒 Row-Level Security (RLS) - Setup dla Development

## Problem: "new row violates row-level security policy"

Jeśli widzisz ten błąd podczas testowania API, oznacza to że Supabase Row-Level Security (RLS) blokuje operacje na bazie danych.

## Rozwiązanie 1: Użyj Service Role Key (ZALECANE dla DEV)

### Krok 1: Znajdź Service Role Key

1. Otwórz projekt w [Supabase Dashboard](https://supabase.com/dashboard)
2. Przejdź do **Settings** → **API**
3. Znajdź sekcję **Project API keys**
4. Skopiuj **`service_role` key** (secret key)

⚠️ **UWAGA**: Service role key omija wszystkie RLS policies i NIE powinien być używany w produkcji!

### Krok 2: Dodaj do .env

Dodaj do pliku `.env` w root projektu:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Krok 3: Restart serwera

```bash
npm run dev
```

✅ Teraz wszystkie operacje będą działać bez problemów z RLS!

---

## Rozwiązanie 2: Wyłącz RLS na tabeli exercises (DEV ONLY)

### W Supabase Dashboard:

1. Przejdź do **Database** → **Tables**
2. Znajdź tabelę `exercises`
3. Kliknij **...** (więcej opcji) → **Edit table**
4. Odznacz **Enable Row Level Security (RLS)**
5. Zapisz

⚠️ **UWAGA**: To wyłącza bezpieczeństwo! Używaj tylko lokalnie.

---

## Rozwiązanie 3: Dodaj RLS Policies (dla PRODUCTION)

Jeśli chcesz zachować RLS i używać prawdziwej autentykacji:

### Polityki dla tabeli `exercises`

⚠️ **UWAGA**: Obecnie w migracji jest tylko polityka SELECT. Aby umożliwić INSERT/UPDATE/DELETE, musisz dodać brakujące polityki.

#### Obecna polityka (już w bazie):

```sql
-- Policy: Allow authenticated users to read exercises
CREATE POLICY exercises_select ON exercises
  FOR SELECT TO public
  USING (
    current_setting('request.jwt.claims.role') IN ('admin','trainer','client')
  );
```

#### Polityki do dodania (INSERT, UPDATE, DELETE):

```sql
-- Policy: Allow admins to insert exercises
CREATE POLICY "exercises_insert_admin" ON exercises
  FOR INSERT TO public
  WITH CHECK (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Policy: Allow admins to update exercises
CREATE POLICY "exercises_update_admin" ON exercises
  FOR UPDATE TO public
  USING (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Policy: Allow admins to delete exercises
CREATE POLICY "exercises_delete_admin" ON exercises
  FOR DELETE TO public
  USING (
    current_setting('request.jwt.claims.role', true) = 'admin'
  );
```

**Uwaga**: Te polityki używają `current_setting('request.jwt.claims.role')`, które działa z JWT tokenami Supabase Auth.

**Dlaczego to jest potrzebne?**

Obecnie w bazie danych **NIE MA** polityk INSERT/UPDATE/DELETE dla tabeli `exercises`. To oznacza:

- ✅ SELECT działa (tylko do odczytu)
- ❌ INSERT nie działa (brak polityki)
- ❌ UPDATE nie działa (brak polityki)
- ❌ DELETE nie działa (brak polityki)

Dlatego do testowania CRUD operacji **musisz używać service_role key** lub dodać powyższe polityki.

### Zastosuj w Supabase:

**Sposób 1: Użyj przygotowanej migracji (ZALECANE)**

Migracja jest już gotowa w projekcie: `supabase/migrations/20251112000000_add_exercises_rls_policies.sql`

Aby ją zastosować:

```bash
# Jeśli używasz Supabase CLI lokalnie:
supabase db push

# LUB w Supabase Dashboard:
```

**Sposób 2: Ręcznie w Dashboard**

1. Przejdź do **SQL Editor**
2. Wklej powyższe zapytania (lub zawartość pliku migracji)
3. Kliknij **Run**

---

## Obecna konfiguracja projektu

### Kod jest przygotowany na oba scenariusze:

1. **Z Service Role Key**:
   - Dodaj `SUPABASE_SERVICE_ROLE_KEY` do `.env`
   - Kod automatycznie użyje tego klucza
   - RLS będzie pominięty

2. **Bez Service Role Key**:
   - Używany będzie `SUPABASE_KEY` (anon key)
   - RLS będzie aktywny
   - Musisz mieć skonfigurowane odpowiednie policies

### Plik: `src/db/supabase.client.ts`

```typescript
// Automatycznie wybiera service_role key jeśli dostępny
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey // ← fallback do anon key
);
```

---

## Dla testowania API (obecna sytuacja)

### Autentykacja jest WYŁĄCZONA w endpointach:

Wszystkie endpointy używają mock usera z middleware:

```typescript
// Z middleware (src/middleware/index.ts)
context.locals.user = {
  id: "c8296dc9-d343-4514-a74f-ab893aad7b19",
  email: "admin@example.com",
  role: "admin",
};
```

Więc nawet z RLS policies, jeśli użyjesz **service_role key**, wszystko będzie działać.

---

## Checklist przed testowaniem

- [ ] Dodałem `SUPABASE_SERVICE_ROLE_KEY` do `.env`
- [ ] Zrestartowałem serwer (`npm run dev`)
- [ ] Sprawdziłem że serwer działa na `http://localhost:3000`
- [ ] Mam zaimportowaną kolekcję Postmana

---

## Troubleshooting

### Problem: Nadal dostaję błąd RLS podczas INSERT/UPDATE/DELETE

**Przyczyna:** Baza danych **nie ma** polityk INSERT/UPDATE/DELETE dla tabeli `exercises`. Polityka SELECT istnieje, ale operacje modyfikacji są zablokowane.

**Rozwiązanie (wybierz jedno):**

**A) Użyj service_role key (SZYBKIE - dla development):**

1. Sprawdź czy `.env` zawiera `SUPABASE_SERVICE_ROLE_KEY`
2. Sprawdź czy zrestartowałeś serwer po dodaniu klucza
3. Sprawdź czy service role key jest poprawny (skopiowany z Supabase Dashboard)

**B) Dodaj brakujące polityki RLS (dla production):**

1. Przejdź do Supabase Dashboard → SQL Editor
2. Wklej polityki INSERT/UPDATE/DELETE z sekcji "Rozwiązanie 3" powyżej
3. Kliknij **Run**
4. Przetestuj z prawdziwym JWT tokenem

### Problem: "Invalid API key"

**Rozwiązanie:**

- Service role key powinien zaczynać się od `eyJ...`
- Sprawdź czy nie skopiowałeś przypadkiem anon key zamiast service role key
- W Supabase Dashboard: Settings → API → service_role (nie anon!)

### Problem: Chcę używać prawdziwej autentykacji

**Rozwiązanie:**

1. Ustaw RLS policies (patrz wyżej)
2. Odkomentuj kod autentykacji w middleware (`src/middleware/index.ts`)
3. Odkomentuj sprawdzanie auth w endpointach
4. Dodaj do Postmana header: `Authorization: Bearer {jwt_token}`

---

## Przykładowy `.env` file

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key (DEV ONLY)
```

⚠️ **NIE commituj `.env` do git!** (już jest w `.gitignore`)

---

## Kolejne kroki po testach

Po zakończeniu testowania CRUD endpointów:

1. ✅ Usuń `SUPABASE_SERVICE_ROLE_KEY` z `.env` (lub zostaw zakomentowane)
2. ✅ Odkomentuj autentykację w middleware
3. ✅ Odkomentuj sprawdzanie auth w endpointach
4. ✅ Ustaw RLS policies w Supabase
5. ✅ Przetestuj z prawdziwymi JWT tokenami

---

## Bezpieczeństwo

### ⚠️ NIE używaj service_role key w produkcji!

Service role key:

- ❌ Omija wszystkie RLS policies
- ❌ Daje pełny dostęp do bazy danych
- ❌ Nie powinien być nigdy wysłany do klienta
- ✅ Jest OK dla local development
- ✅ Jest OK dla server-side operations (jeśli jest dobrze zabezpieczony)

### ✅ W produkcji zawsze używaj:

- Anon key (`SUPABASE_KEY`) w kliencie
- JWT tokens z Supabase Auth
- RLS policies do kontroli dostępu
- Middleware do weryfikacji użytkownika
