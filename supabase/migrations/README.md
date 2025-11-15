# Database Migrations

Migracje są uruchamiane automatycznie w kolejności według timestampu w nazwie pliku.

## Dostępne migracje:

### 1. `20251102120000_create_initial_schema.sql`

**Status:** ✅ Uruchomiona

Tworzy podstawową strukturę bazy danych:

- Tabele: `users`, `exercises`, `plans`, `plan_exercises`, `standard_reasons`
- Indeksy dla wydajności
- Podstawowe polityki RLS (SELECT dla większości tabel)

**⚠️ Uwaga:** Ta migracja **NIE** zawiera polityk INSERT/UPDATE/DELETE dla tabeli `exercises`.

### 2. `20251112000000_add_exercises_rls_policies.sql`

**Status:** ✅ Uruchomiona (lokalnie i zdalnie)

Dodaje brakujące polityki RLS dla tabeli `exercises`:

- INSERT (tylko admin)
- UPDATE (tylko admin)
- DELETE (tylko admin)

**Ta migracja została już zastosowana!**

Jeśli potrzebujesz ją zastosować ponownie (np. w innym środowisku):

```bash
# Sposób 1: Reset lokalnej bazy (zastosuje wszystkie migracje)
supabase db reset

# Sposób 2: Push do zdalnej bazy
supabase db push

# Sposób 3: Ręcznie w Supabase Dashboard
# 1. Przejdź do SQL Editor
# 2. Skopiuj zawartość pliku
# 3. Wklej i uruchom
```

## Dla developmentu (testowanie lokalne):

**Aktualny stan:** Wszystkie migracje są już zastosowane lokalnie! 🎉

Masz dwie opcje testowania:

**Opcja A: Z service_role key (omija RLS)** - Szybkie, do podstawowych testów

```bash
# W .env dodaj:
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

Zobacz: `.ai/QUICK-FIX-RLS.md`

**Opcja B: Z anon key + RLS** - Prawdziwe testy z politykami bezpieczeństwa

- Polityki RLS są już w bazie
- Skonfiguruj autentykację JWT z rolą `admin`
- Zobacz: `.ai/RLS-SETUP.md`

## Dla produkcji:

**MUSISZ** uruchomić wszystkie migracje i używać:

- JWT tokenów z Supabase Auth
- Anon key (nie service_role!)
- Pełne polityki RLS

Zobacz: `.ai/RLS-SETUP.md`

## Tworzenie nowych migracji:

```bash
# Format nazwy: YYYYMMDDHHMMSS_opis_migracji.sql
# Przykład:
20251112120000_add_exercise_categories.sql
```

Timestamp zapewnia właściwą kolejność wykonywania migracji.
