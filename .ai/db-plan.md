<conversation_summary>

<decisions>
1. Użycie jednej tabeli `users` z kolumną `role` typu `ENUM('admin','trainer','client')`.  
2. Tabela `users` zawiera kolumnę `status` typu `ENUM('pending','active','suspended')` z domyślną wartością `'pending'`:
   - `'pending'` - użytkownik oczekuje na aktywację (nowo utworzony, nie aktywował konta)
   - `'active'` - użytkownik jest aktywny i ma dostęp do systemu
   - `'suspended'` - użytkownik został zawieszony i nie ma dostępu do systemu
3. Tabela `exercises` z kolumnami `id UUID PRIMARY KEY`, `name TEXT NOT NULL`, `description TEXT`, `vimeo_token TEXT NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`.  
4. Relacja jeden-do-wielu między trenerami a podopiecznymi: dodanie `trainer_id UUID` (FK) w tabeli `users` dla roli `client`.  
5. Tabela łącznikowa `plan_exercises` (FK do `plans.id` i `exercises.id`) z polami `sort_order INT`, `sets INT`, `reps INT`.  
6. Kolumna `is_hidden BOOLEAN DEFAULT FALSE` w tabeli `plans` z indeksem B-TREE do filtrowania widocznych planów.  
7. Indeksy:  
   - `UNIQUE` na `users(email)`  
   - B-TREE na `plans(trainer_id)`, `plans(created_at)`  
   - B-TREE na `exercises(name)`  
   - Indeks wielokolumnowy `(trainer_id, created_at)` dla paginacji po trenerze i dacie.  
8. Partycjonowanie `audit_log` według zakresu dat (np. co miesiąc na podstawie `timestamp`), ułatwiające kasowanie danych starszych niż 90 dni.  
9. RLS: włączone na tabelach `plans` i `users`, z policy:  
   - Trener może `SELECT/INSERT/UPDATE/DELETE` tam, gdzie `plans.trainer_id = current_setting('jwt.claims.user_id')`.  
   - Podopieczny może tylko `SELECT` wierszy `users.id = current_setting('jwt.claims.user_id')`.  
10. Integralność danych: klucze obce z `ON DELETE CASCADE`/`RESTRICT` oraz użycie transakcji (BEGIN/COMMIT) przy operacjach obejmujących wiele tabel.  
11. Logika statusu użytkownika:
    - Przy tworzeniu użytkownika domyślny status to `'pending'`
    - Użytkownik ze statusem `'pending'` może otrzymać link aktywacyjny (invite)
    - Po aktywacji konta status zmienia się na `'active'`
    - Administrator może zawiesić użytkownika zmieniając status na `'suspended'`
    - Tylko użytkownicy ze statusem `'active'` mają pełny dostęp do systemu
</decisions>

<matched_recommendations>

1. Jedna tabela `users` z kolumną `role` typu ENUM.
2. Definicja tabeli `exercises` z UUID, TEXT, TIMESTAMPTZ.
3. Model relacji jeden-do-wielu trener→podopieczny.
4. Tabela łącznikowa `plan_exercises` z dodatkowymi polami.
5. Flaga `is_visible BOOLEAN` z indeksem.
6. Indeksy B-TREE i wielokolumnowy dla paginacji.
7. Partycjonowanie `audit_log` po datach.
8. Polityki RLS wykorzystujące `jwt.claims.user_id`.
9. FK + transakcje dla spójności.  
   </matched_recommendations>

<database_planning_summary>
Na podstawie PRD i stosu technologicznego zaplanowaliśmy następujące kluczowe elementy schematu PostgreSQL dla MVP:

- Encje:
  • `users` (administrator, trener, podopieczny) - rozszerza `auth.users` z Supabase Authentication
  • `exercises`  
  • `plans`  
  • `plan_exercises` (łączenie ćwiczeń z planami)
- Relacje:
  • `users.id` referencjonuje `auth.users(id)` ON DELETE CASCADE - integracja z Supabase Auth
  • Jeden trener ma wielu podopiecznych (`users.trainer_id → users.id`)  
  • Wiele ćwiczeń może należeć do wielu planów (tabela łącznikowa)
- Typy danych i ograniczenia:
  • UUID jako klucze główne (dla `users` - pochodzące z `auth.users`, dla innych tabel - auto-generowane)
  • TEXT/TIMESTAMPTZ/JSONB dla opisów, znaczników czasu i szczegółów audytu  
  • ENUM dla roli użytkownika (`user_role`: 'admin', 'trainer', 'client')
  • ENUM dla statusu użytkownika (`user_status`: 'pending', 'active', 'suspended') z domyślną wartością 'pending'
- Integracja z Supabase Authentication:
  • Tabela `users` NIE generuje własnego UUID - używa ID z `auth.users`
  • FK constraint z `ON DELETE CASCADE` zapewnia spójność danych
  • JWT claims (`request.jwt.claims.sub`) zawierają `auth.users.id`
- Indeksy i wydajność:
  • Indeksy B-TREE na polach filtrowanych i sortowanych (`email`, `trainer_id`, `created_at`, `name`)  
  • Indeks wielokolumnowy dla paginacji
- Bezpieczeństwo:
  • RLS na `users` i `plans` z autoryzacją opartą na `jwt.claims.sub` (UUID z auth.users)
  • Polityki zapewniające, że trener widzi tylko swoje plany, a podopieczny tylko własne dane
- Integralność danych:
  • Klucze obce z regułami `ON DELETE CASCADE/RESTRICT`
  • Transakcje przy wielotabelowych operacjach CRUD  
  </database_planning_summary>

<resolved_issues>

- ✅ Integracja tabeli `users` z Supabase Authentication (`auth.users`)
- ✅ Trigger automatyczny do synchronizacji `auth.users` → `public.users`
- ✅ Przepływ tworzenia użytkownika: najpierw `auth.users`, potem `public.users`
- ✅ RLS policies używają `auth.jwt()` claims dla autoryzacji
- ✅ Status użytkownika: zamiana `is_active BOOLEAN` na `status user_status ENUM('pending','active','suspended')`
- ✅ Domyślny status przy tworzeniu użytkownika: `'pending'`
- ✅ Logika aktywacji: użytkownik ze statusem `'pending'` może otrzymać link aktywacyjny, po aktywacji status zmienia się na `'active'`
- ✅ Zawieszenie użytkownika: administrator może zmienić status na `'suspended'` aby zablokować dostęp

</resolved_issues>

<unresolved_issues>

- Szczegółowe zdefiniowanie struktury tabeli `plans` (nazwa, opis, terminy, status).
- Mechanizm automatycznego zarządzania partycjami i harmonogram usuwania danych starszych niż 90 dni.
- Dokładne zasady RLS dla operacji `UPDATE` i `INSERT` w tabeli `exercises` i `plan_exercises` (kto może modyfikować).  
  </unresolved_issues>

<user_status_implementation>
Status użytkownika został zaimplementowany jako ENUM `user_status` z wartościami:

- `'pending'` - użytkownik oczekuje na aktywację (domyślny przy tworzeniu)
- `'active'` - użytkownik jest aktywny i ma dostęp do systemu
- `'suspended'` - użytkownik został zawieszony przez administratora

Zmiany w kodzie:

- Tabela `users`: kolumna `status user_status NOT NULL DEFAULT 'pending'`
- Wszystkie referencje do `is_active` zostały zastąpione przez `status`
- Filtrowanie użytkowników odbywa się po statusie zamiast po `is_active`
- Przycisk "Wyślij zaproszenie" wyświetla się dla użytkowników ze statusem `'pending'` na stronie szczegółów użytkownika (dla administratora)
- Aktywacja konta zmienia status z `'pending'` na `'active'`
- Administrator może zmienić status użytkownika na `'suspended'` aby zablokować dostęp
  </user_status_implementation>

</conversation_summary>
