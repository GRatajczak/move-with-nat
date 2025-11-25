# Database Migrations

## Struktura migracji

### Plik główny: `00000000000000_complete_schema.sql`

**Status:** ✅ Plik konsolidujący wszystkie migracje

Jest to **kompletny plik migracyjny**, który zawiera pełną strukturę bazy danych połączając wszystkie wcześniejsze migracje w jeden spójny schemat.

#### Zawartość:

1. **Rozszerzenia (Extensions)**
   - `pgcrypto` - dla generowania UUID
   - `pg_trgm` - dla wyszukiwania rozmytego/trigramowego

2. **Typy (Enums)**
   - `user_role` - ('admin', 'trainer', 'client')

3. **Tabele (Tables)**
   - `users` - użytkownicy (rozszerza auth.users)
     - Podstawowe pola: id, email, role, is_active
     - Pola profilu: first_name, last_name
     - Relacje: trainer_id (dla klientów)
   - `exercises` - ćwiczenia
   - `plans` - plany treningowe
   - `standard_reasons` - standardowe powody niepełnych ćwiczeń
   - `plan_exercises` - tabela łącząca plany z ćwiczeniami

4. **Constrainty (Constraints)**
   - `check_trainer_id_only_for_clients` - tylko klienci mogą mieć przypisanego trenera

5. **Indeksy (Indexes)**
   - Standardowe indeksy dla wydajności (created_at, foreign keys)
   - Specjalne indeksy dla exercises:
     - `idx_exercises_name` - dla wyszukiwania po nazwie
     - `idx_exercises_is_hidden` - dla filtrowania widoczności
     - `idx_exercises_visible_created_at` - partial index dla widocznych ćwiczeń
     - `idx_exercises_name_trgm` - trigram index dla fuzzy search

6. **Polityki RLS (Row Level Security)**
   - **users**: SELECT (admin + self), UPDATE (self)
   - **exercises**: SELECT (wszyscy), INSERT/UPDATE/DELETE (tylko admin)
   - **plans**: pełne CRUD z kontrolą dostępu (admin, trainer, client)
   - **plan_exercises**: pełne CRUD z kontrolą dostępu przez plany
   - **standard_reasons**: SELECT (wszyscy uwierzytelnieni)

7. **Cleanup**
   - Usunięcie niepotrzebnego triggera `on_auth_user_created`

---

## Historia migracji (zarchiwizowane)

Poniższe migracje zostały połączone w jeden plik główny. Są przechowywane dla celów historycznych:

### 1. `20251102120000_create_initial_schema.sql`

Początkowa struktura bazy danych z podstawowymi tabelami i politykami RLS.

### 2. `20251112000000_add_exercises_rls_policies.sql`

Dodanie brakujących polityk INSERT/UPDATE/DELETE dla tabeli exercises.

### 3. `20251115000000_add_exercises_list_indexes.sql`

Indeksy dla optymalizacji wydajności listowania i wyszukiwania ćwiczeń.

### 4. `20251116000000_add_trainer_id_to_users.sql`

Dodanie kolumny trainer_id i relacji między klientami a trenerami.

### 5. `20251116100000_add_user_profile_fields.sql`

Dodanie pól first_name i last_name oraz modyfikacja constraintów.

### 6. `20251123100000_remove_auth_user_sync_trigger.sql`

Usunięcie problematycznego triggera dla automatycznej synchronizacji użytkowników.

---

## Uruchamianie migracji

### Dla nowego środowiska

Jeśli konfigurujesz bazę danych od zera, użyj pliku głównego:

```bash
# Reset lokalnej bazy (zastosuje wszystkie migracje w kolejności)
supabase db reset

# Lub push do zdalnej bazy
supabase db push
```

### Dla istniejącego środowiska

Jeśli Twoja baza już ma zastosowane wcześniejsze migracje, **nie musisz** ponownie uruchamiać pliku głównego. Supabase automatycznie śledzi, które migracje zostały zastosowane.

### Ręczne zastosowanie w Supabase Dashboard

1. Przejdź do SQL Editor w dashboardzie Supabase
2. Skopiuj zawartość `00000000000000_complete_schema.sql`
3. Wklej i uruchom

---

## Development vs Production

### Development (lokalne testowanie)

**Opcja A: Z service_role key** (omija RLS - szybkie testy)

```bash
# W .env:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Opcja B: Z anon key + RLS** (prawdziwe testy z politykami bezpieczeństwa)

- Skonfiguruj JWT tokeny z odpowiednią rolą
- Używaj anon key
- Testuj pełne polityki RLS

### Production

**WYMAGANE:**

- JWT tokeny z Supabase Auth
- Anon key (NIE service_role!)
- Pełne polityki RLS aktywne

---

## Tworzenie nowych migracji

```bash
# Format nazwy: YYYYMMDDHHMMSS_opis_migracji.sql
# Przykład:
20251125120000_add_exercise_categories.sql
```

Timestamp zapewnia właściwą kolejność wykonywania migracji.

**Uwaga:** Nowe migracje będą stosowane DODATKOWO do schematu zdefiniowanego w pliku głównym.

---

## Informacje dodatkowe

- Wszystkie migracje są uruchamiane w transakcjach
- Timestamp w nazwie pliku określa kolejność wykonania
- Supabase CLI automatycznie śledzi zastosowane migracje
- Plik `00000000000000_complete_schema.sql` ma timestamp "0", więc będzie wykonany jako pierwszy
