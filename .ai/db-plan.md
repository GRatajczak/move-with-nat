<conversation_summary>

<decisions>
1. Użycie jednej tabeli `users` z kolumną `role` typu `ENUM('administrator','trener','podopieczny')`.  
2. Tabela `exercises` z kolumnami `id UUID PRIMARY KEY`, `name TEXT NOT NULL`, `description TEXT`, `vimeo_token TEXT NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`.  
3. Relacja jeden-do-wielu między trenerami a podopiecznymi: dodanie `trainer_id UUID` (FK) w tabeli `users` dla roli `podopieczny`.  
4. Tabela łącznikowa `plan_exercises` (FK do `plans.id` i `exercises.id`) z polami `sort_order INT`, `sets INT`, `reps INT`.  
5. Kolumna `is_visible BOOLEAN DEFAULT TRUE` w tabeli `plans` z indeksem B-TREE do filtrowania widocznych planów.  
6. Indeksy:  
   - `UNIQUE` na `users(email)`  
   - B-TREE na `plans(trainer_id)`, `plans(created_at)`  
   - B-TREE na `exercises(name)`  
   - Indeks wielokolumnowy `(trainer_id, created_at)` dla paginacji po trenerze i dacie.  
7. Partycjonowanie `audit_log` według zakresu dat (np. co miesiąc na podstawie `timestamp`), ułatwiające kasowanie danych starszych niż 90 dni.  
8. RLS: włączone na tabelach `plans` i `users`, z policy:  
   - Trener może `SELECT/INSERT/UPDATE/DELETE` tam, gdzie `plans.trainer_id = current_setting('jwt.claims.user_id')`.  
   - Podopieczny może tylko `SELECT` wierszy `users.id = current_setting('jwt.claims.user_id')`.  
9. Integralność danych: klucze obce z `ON DELETE CASCADE`/`RESTRICT` oraz użycie transakcji (BEGIN/COMMIT) przy operacjach obejmujących wiele tabel.  
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
  • `users` (administrator, trener, podopieczny)  
  • `exercises`  
  • `plans`  
  • `plan_exercises` (łączenie ćwiczeń z planami)
- Relacje:
  • Jeden trener ma wielu podopiecznych (`users.trainer_id → users.id`)  
  • Wiele ćwiczeń może należeć do wielu planów (tabela łącznikowa)
- Typy danych i ograniczenia:
  • UUID jako klucze główne dla dystrybucji i skalowalności  
  • TEXT/TIMESTAMPTZ/JSONB dla opisów, znaczników czasu i szczegółów audytu  
  • ENUM dla roli użytkownika
- Indeksy i wydajność:
  • Indeksy B-TREE na polach filtrowanych i sortowanych (`email`, `trainer_id`, `created_at`, `name`)  
  • Indeks wielokolumnowy dla paginacji
- Bezpieczeństwo:
  • RLS na `users` i `plans` z autoryzacją opartą na `jwt.claims.user_id`  
  • Polityki zapewniające, że trener widzi tylko swoje plany, a podopieczny tylko własne dane
- Integralność danych:
  • Klucze obce z regułami `ON DELETE`  
   • Transakcje przy wielotabelowych operacjach CRUD  
  </database_planning_summary>

<unresolved_issues>

- Szczegółowe zdefiniowanie struktury tabeli `plans` (nazwa, opis, terminy, status).
- Pełen zestaw pól profilowych w tabeli `users` (imię, e-mail, kontakt).
- Mechanizm automatycznego zarządzania partycjami i harmonogram usuwania danych starszych niż 90 dni.
- Dokładne zasady RLS dla operacji `UPDATE` i `INSERT` w tabeli `exercises` i `plan_exercises` (kto może modyfikować).  
  </unresolved_issues>

</conversation_summary>
