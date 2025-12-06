# Plan implementacji widoku Administracja → Użytkownicy

## 1. Przegląd

Widok „Użytkownicy” w panelu administratora umożliwia pełne zarządzanie użytkownikami systemu (administratorzy, trenerzy, podopieczni). Administrator może:

1. Przeglądać listę użytkowników z zaawansowanym filtrowaniem, sortowaniem i paginacją.
2. Dodawać nowych użytkowników (różnych ról) – konto w statusie "pending" i wysyłka maila aktywacyjnego.
3. Edytować istniejących użytkowników (profil, status, przypisania).
4. Wyświetlać szczegóły użytkownika (read-only + akcje).
5. Dezaktywować / reaktywować / usuwać konta oraz ponownie wysyłać link aktywacyjny.

## 2. Routing widoku

| Akcja | Metoda | Ścieżka |
|-------|--------|---------|
| Lista | GET    | `/admin/users` |
| Nowy  | GET    | `/admin/users/new` |
| Szczegóły | GET | `/admin/users/:id` |
| Edycja | GET   | `/admin/users/:id/edit` |

Routing realizowany przez pliki `.astro` w `src/pages/admin/users/*` oraz komponenty React ładowane dynamicznie.

## 3. Struktura komponentów

```
AdminUsersPage
├── PageHeader ("Użytkownicy")
├── UsersFilterToolbar
├── <Suspense>
│   ├── DataTable  ← desktop ≥ lg
│   │   └── UserActionMenu (row)
│   └── UserCardsGrid ← mobile < lg
│       └── UserActionMenu (card)
├── Pagination
└── ConfirmationModal (portal)
```

Formularze tworzenia i edycji otwierane są na osobnych route’ach:

```
CreateUserFormPage
└── CreateUserForm

EditUserFormPage
└── EditUserForm
```

Widok szczegółowy:

```
UserDetailPage
├── UserDetailHeader
│   └── UserActionMenu
├── UserInfoGrid
├── UserStatsCards (conditional – dla trenera)
└── RelatedPlansList (dla podopiecznego)
```

## 4. Szczegóły komponentów

### 4.1 AdminUsersPage

*Opis*: Strona listy użytkowników.

- Główne elementy: `PageHeader`, `UsersFilterToolbar`, `DataTable` / `UserCardsGrid`, `Pagination`.
- Interakcje: zmiana filtrów, sortowanie kolumn, paginacja, akcje z menu wiersza.
- Walidacja: poprawność parametrów w URL (page ≥1, limit ≤100).
- Typy: `ListUsersQuery`, `PaginatedResponse<UserDto>`.
- Propsy: none (dane pobiera wewnątrz przez hook).

### 4.2 UsersFilterToolbar

- Główne elementy: `SearchInput`, `RoleSelect`, `StatusSelect`, `TrainerSearchableSelect`, `ClearFilters`.
- Interakcje: `onSearch`, `onFilterChange`, `onClear`.
- Walidacja: debounce search (≥2 znaki), poprawny uuid w `trainerId`.
- Typy: lokalny interfejs `UsersFilters`.
- Propsy: `{ value: UsersFilters; onChange(value) }`.

### 4.3 DataTable<UserDto>

- Główne kolumny: Avatar, Imię i Nazwisko, Email, Rola, Status, Trener, Utworzono, Akcje.
- Interakcje: sort `onSort`, klik w wiersz (przejście do detail), `UserActionMenu`.
- Walidacja: none (read-only).
- Propsy: `{ data, loading, onSort, sortKey, sortDir }`.

### 4.4 UserActionMenu

- Elementy: Edytuj, Dezaktywuj/Aktywuj, Wyślij link aktywacyjny, Usuń.
- Interakcje: klik akcji → emit `onAction(action)`.
- Walidacja: confirm destructive (dezaktywacja, usunięcie).
- Typy: `UserAction = "edit" | "toggleActive" | "resendInvite" | "delete"`.
- Propsy: `{ user: UserDto; onAction(UserAction) }`.

### 4.5 CreateUserForm

- Pola: Email*, Imię*, Nazwisko*, Rola*, TrainerSelect (conditional), Telefon, Data urodzenia, Waga, Płeć, Uwagi.
- Interakcje: submit, anuluj.
- Walidacja (Zod):
  - email → valid email
  - firstName, lastName min 1 char
  - role ∈ [administrator, trainer, client]
  - trainerId required if role = client, musi być uuid
- Typy: `CreateUserCommand`.
- Propsy: none (embedded w page).

### 4.6 EditUserForm

- Jak `CreateUserForm`, plus pola Status, readonly Email.
- Walidacja: jak wyżej + ograniczenia z API (trener nie może zmienić `trainerId`).
- Typy: `UpdateUserCommand`.

### 4.7 UserDetailHeader

- Elementy: Avatar (xl), Imię i Nazwisko, RolaBadge, StatusBadge, ActionButtons.
- Interakcje: klik Edytuj ➜ route edit, Menu ➜ `UserActionMenu`.

### 4.8 RelatedPlansList

- Liste planów podopiecznego (name, progress, link) – użycie istniejącego `PlanCards`.
- Walidacja: none.

## 5. Typy

```typescript
// view-models
export interface UsersFilters {
  search?: string;
  role?: "administrator" | "trainer" | "client";
  status?: "active" | "pending" | "suspended";
  trainerId?: string; // uuid
  page: number; // ≥1
  limit: number; // ≤100, default 20
}

// hook response
type UseUsersResult = PaginatedResponse<UserDto> & { loading: boolean; error?: string };
```

## 6. Zarządzanie stanem

- TanStack Query do pobierania listy (`useUsersList(filters)`), detali (`useUser(id)`).
- React Context niepotrzebny – lokalny stan filtrów w `AdminUsersPage`, synchronizowany z parametrami URL (search params).
- React Hook Form + Zod w formularzach Create/Edit.
- Sonner toast dla powiadomień.

## 7. Integracja API

| Akcja | Hook | Endpoint | Metoda | Typy |
|-------|------|----------|--------|------|
| List  | `useUsersList` | `/users` | GET | query: `ListUsersQuery`; response: `PaginatedResponse<UserDto>` |
| Create | `useCreateUser` | `/users` | POST | body: `CreateUserCommand`; response: `UserDto` |
| Get   | `useUser` | `/users/{id}` | GET | path: uuid; response: `UserDto` |
| Update | `useUpdateUser` | `/users/{id}` | PUT | body: `UpdateUserCommand`; response: `UserDto` |
| Delete | `useDeleteUser` | `/users/{id}` | DELETE | - | status 204 |
| Toggle active | reuse Update | PUT | `{ isActive: boolean }` |
| Resend invite | `/users/{id}/resend-invite` (future) | POST | - |

Supabase service implementacje już istnieją – hooki w `src/hooks` okleić w stylu `useMutation`.

## 8. Interakcje użytkownika

1. Wpisanie tekstu w Search → debounce 300 ms → aktualizacja URL i refetch.
2. Zmiana roli/statusu/trenera → natychmiastowa aktualizacja filtrów.
3. Klik w nagłówek kolumny → sort asc/desc.
4. Klik w wiersz → nawigacja do `/admin/users/:id`.
5. Klik „Dodaj użytkownika” → `/admin/users/new`.
6. W `UserActionMenu` wybór akcji:
   - Edytuj → `/admin/users/:id/edit`
   - Dezaktywuj/Aktywuj → modal confirm → mutation → toast.
   - Wyślij link → request, toast success/warning.
   - Usuń → modal confirm → delete → refetch list + toast.

## 9. Warunki i walidacja

- Form: Zod schemas (patrz §4.5/4.6).
- URL params: `page` i `limit` walidowane przed użyciem.
- Trener musi istnieć i mieć rolę trainer (`trainerId` validation via API – 404/422 → field error).
- Nie można zmienić maila na istniejący – API zwróci 409 → pokazujemy error toast + field error.

## 10. Obsługa błędów

| Scenariusz | UI reakcja |
|------------|-----------|
| Network/API error (list) | `ErrorState` + Retry |
| Validation error z API | Mapuje `field_errors` na RHForm errors |
| 403/404 przy detail/edit | Redirect do listy + error toast |
| 409 email conflict | Field error “Email już istnieje” |
| Delete fail (foreign key) | Error toast: “Nie można usunąć użytkownika – powiązane dane” |

## 11. Kroki implementacji

1. **Routing** – utworzyć pliki `.astro` z layoutem `AdminLayout` i wstawić komponenty React.
2. **Hooki** – zaimplementować `useUsersList`, `useCreateUser`, `useUpdateUser`, `useDeleteUser` (TanStack Query + services).
3. **Typy** – dodać `UsersFilters` + eksport w `src/types/index.ts`.
4. **Komponenty UI**
   1. `UsersFilterToolbar`
   2. `DataTable` konfiguracja kolumn
   3. `UserCardsGrid` – wariant mobilny
   4. `UserActionMenu` + `ConfirmationModal`
5. **Formularze** – `CreateUserForm`, `EditUserForm` z RHForm + Zod.
6. **Strony** – `AdminUsersPage`, `CreateUserFormPage`, `EditUserFormPage`, `UserDetailPage`.
7. **Walidacja URL state** – hook `useUsersFiltersFromUrl`.
8. **Toast & Modal logic** – sonner + radix dialog.
9. **Testy jednostkowe** – Zod schemas, hooki (mock supabase).
10. **Testy e2e (Cypress)** – create user flow, edit, deactivate.
11. **QA & UX** – sprawdzić responsywność, accessibility (tabla ARIA), focus management w modalach.

---

> Plan zgodny z PRD (sekcje 3, 4), historyjkami US-006 → US-010, US-027 → US-031 oraz opisem endpointu `/users`.
