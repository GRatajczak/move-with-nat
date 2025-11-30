# Integracja Supabase Authentication - Podsumowanie Zmian

## 🎯 Cel

Poprawna integracja tabeli `public.users` z systemem Supabase Authentication (`auth.users`).

---

## ❌ Problem w Pierwotnej Implementacji

### Schemat (BŁĘDNY)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ❌ Generuje własne UUID
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  ...
);
```

### Problemy:

1. **Duplikacja ID**: Tabela `users` generowała własne UUID, niezależne od `auth.users`
2. **Brak referencji**: Nie było połączenia z systemem Auth
3. **Błąd w czasie wykonania**: Kod próbował zaktualizować hasło użytkownika, który nie istniał w `auth.users`

---

## ✅ Rozwiązanie

### 1. Poprawiony Schemat Bazy Danych

**Plik**: `supabase/migrations/20251102120000_create_initial_schema.sql`

```sql
-- Users table (extends auth.users)
-- This table stores additional profile data for authenticated users
CREATE TABLE users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Kluczowe zmiany**:

- ✅ `id` referencjonuje `auth.users(id)` jako klucz obcy
- ✅ `ON DELETE CASCADE` - gdy użytkownik zostanie usunięty z `auth.users`, profil też zostanie usunięty
- ✅ Nie ma `DEFAULT gen_random_uuid()` - ID pochodzi z auth systemu

---

### 2. Zaktualizowany Serwis Użytkowników

**Plik**: `src/services/users.service.ts`

#### Poprzedni przepływ (BŁĘDNY):

```
Admin tworzy użytkownika
    ↓
INSERT INTO public.users  ❌ Własne UUID
    ↓
Wysłanie emaila aktywacyjnego
    ↓
UPDATE auth.users (hasło)  ❌ Użytkownik nie istnieje!
```

#### Nowy przepływ (POPRAWNY):

```typescript
// Krok 1: Utwórz użytkownika w systemie Auth
const { data: authUser } = await supabase.auth.admin.createUser({
  email: command.email.toLowerCase(),
  email_confirm: false,
  user_metadata: { ... }
});

// Krok 2: Utwórz profil w public.users z tym samym ID
const insertData = {
  id: authUser.user.id,  // ✅ To samo ID z auth.users
  email: command.email,
  role: dbRole,
  ...
};

await supabase.from("users").insert(insertData);
```

**Korzyści**:

- ✅ Użytkownik istnieje w `auth.users` od początku
- ✅ Można ustawić hasło bez błędów
- ✅ JWT tokens działają poprawnie
- ✅ Cleanup automatyczny w przypadku błędu

---

### 3. Trigger Automatycznej Synchronizacji

**Plik**: `supabase/migrations/20251123000000_add_auth_user_sync_trigger.sql`

Dodano trigger jako zabezpieczenie:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (NEW.id, NEW.email, 'client', FALSE)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

**Kiedy jest używany**:

- Gdy użytkownik zostanie utworzony bezpośrednio przez Supabase Auth UI
- Jako backup mechanism dla głównego flow
- Zapewnia spójność danych

---

## 🔐 Row Level Security (RLS)

RLS policies pozostały bez zmian, ale teraz działają poprawnie:

```sql
CREATE POLICY users_select_self ON users FOR SELECT
  USING (id = current_setting('request.jwt.claims.sub')::uuid);
```

**Jak to działa**:

1. Użytkownik loguje się przez Supabase Auth
2. Otrzymuje JWT token z claim `sub` = `auth.users.id`
3. RLS policy sprawdza czy `users.id` = `sub` z JWT
4. ✅ Działa, bo ID są identyczne!

---

## 📋 Kompletny Przepływ Użytkownika

### 1. Tworzenie Użytkownika (Admin)

```
POST /api/users
    ↓
users.service.ts: createUser()
    ↓
supabase.auth.admin.createUser()  → tworzy w auth.users
    ↓
supabase.from("users").insert()   → tworzy profil w public.users
    ↓
sendActivationEmail()              → wysyła link aktywacyjny
```

### 2. Aktywacja Konta

```
Użytkownik klika link w emailu
    ↓
POST /api/auth/activate {token}
    ↓
auth.service.ts: activateAccount()
    ↓
UPDATE public.users SET is_active = true
```

### 3. Reset Hasła

```
POST /api/auth/reset-password/request
    ↓
sendPasswordResetEmail()
    ↓
Użytkownik klika link
    ↓
POST /api/auth/reset-password/confirm
    ↓
supabase.auth.admin.updateUserById()  ✅ Użytkownik istnieje w auth.users!
```

---

## 🔧 Co Musisz Zrobić

### 1. Zastosuj Migracje

```bash
# Resetuj lokalną bazę (usuwa wszystkie dane!)
npx supabase db reset

# Lub zastosuj tylko nową migrację
npx supabase db push
```

### 2. Przetestuj Przepływ

```bash
# 1. Utwórz użytkownika
POST /api/users
{
  "email": "test@example.com",
  "role": "client",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "trainerId": "..."
}

# 2. Sprawdź czy użytkownik istnieje w auth.users
# W Supabase Dashboard → Authentication → Users

# 3. Aktywuj konto
POST /api/auth/activate
{
  "token": "..."
}

# 4. Zresetuj hasło
POST /api/auth/reset-password/request
{
  "email": "test@example.com"
}
```

---

## 📚 Dalsze Kroki (Opcjonalne)

### 1. Email Templates

Skonfiguruj własne szablony emaili w Supabase Dashboard:

- Authentication → Email Templates
- Dostosuj: Confirmation, Reset Password, Invite

### 2. JWT Claims

Możesz dodać custom claims (np. `role`) do JWT:

- Użyj Supabase Edge Functions lub Database Functions
- Pozwoli to na sprawdzanie roli w RLS policies

### 3. Session Management

```typescript
// Logowanie użytkownika
const { data } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});

// Sprawdzenie sesji
const {
  data: { user },
} = await supabase.auth.getUser();
```

---

## ❓ FAQ

### Q: Co się stanie jeśli usunę użytkownika z auth.users?

**A**: Dzięki `ON DELETE CASCADE`, profil w `public.users` zostanie automatycznie usunięty.

### Q: Czy mogę użyć social login (Google, GitHub)?

**A**: Tak! Trigger automatycznie utworzy profil w `public.users` po pierwszym logowaniu.

### Q: Czy muszę używać `supabase.auth.admin`?

**A**: Tak, dla tworzenia użytkowników przez admina. Dla self-signup użyj `supabase.auth.signUp()`.

### Q: Co z istniejącymi użytkownikami w bazie?

**A**: Musisz wykonać migrację danych:

1. Utwórz użytkowników w `auth.users`
2. Zaktualizuj `public.users.id` aby pasowało do `auth.users.id`
3. Dodaj constraint

---

## 🎉 Podsumowanie

✅ **Schemat bazy danych** - poprawiony, teraz referencjonuje `auth.users`
✅ **Serwis użytkowników** - najpierw tworzy w Auth, potem profil
✅ **Trigger** - automatyczna synchronizacja jako backup
✅ **RLS policies** - działają z JWT claims
✅ **Dokumentacja** - zaktualizowana w db-plan.md

**Wszystkie zmiany są kompatybilne z Supabase Authentication!** 🚀
