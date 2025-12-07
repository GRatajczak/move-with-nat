# Plan implementacji widoku Lista Podopiecznych Trenera

## 1. Przegląd

Widok "Lista Podopiecznych" umożliwia trenerowi przeglądanie wszystkich przypisanych podopiecznych, szybkie filtrowanie po imieniu oraz statusie konta, a także przejście do profilu wybranego użytkownika. Widok ma dostarczać czytelną tabelę (desktop) lub karty (mobile) wraz z paskiem narzędzi filtrów.

## 2. Routing widoku

```
/trainer/clients
```

Route chroniona – dostęp tylko dla roli `trainer`; dodatkowo Supabase RLS gwarantuje, że API zwraca wyłącznie podopiecznych przypisanych do zalogowanego trenera.

## 3. Struktura komponentów

```
TrainerLayout
└── ClientsListPage
    ├── PageHeader (title + description)
    ├── ClientsFilterToolbar
    ├── DataDisplay
    │   ├── ClientsTable   (≥ lg breakpoint)
    │   └── ClientsCards   (< lg breakpoint)
    ├── Pagination
    └── EmptyState / ErrorState / Skeleton
```

## 4. Szczegóły komponentów

### ClientsListPage

- **Opis:** Kontener strony; pobiera dane (TanStack Query), przechowuje stan filtrów (URL ⇆ state) i renderuje pod-komponenty.
- **Główne elementy:** `PageHeader`, `ClientsFilterToolbar`, sekcja danych, `Pagination`.
- **Obsługiwane interakcje:** Zmiana filtrów, klik w wiersz/kartę → nawigacja do profilu.
- **Walidacja:** Poprawność parametrów query (page ≥ 1, limit ∈ {10,20,50}).
- **Typy:** `ClientsPageQuery`, `ClientsFilters`, `ClientDto`, `PaginatedResponse<ClientDto>`.
- **Propsy:** brak (page samodzielny); wykorzystuje hooki.

### ClientsFilterToolbar

- **Opis:** Pasek filtrów – wyszukiwarka tekstowa + dropdown statusu.
- **Główne elementy:** `SearchInput`, `StatusSelect`, `ClearFiltersButton`.
- **Obsługiwane interakcje:** onSearch (debounce 300 ms), onStatusChange, onClear.
- **Walidacja:** Brak specjalnej (puste → brak filtra).
- **Typy:** `ClientsFilters`, enum `ClientStatus`.
- **Propsy:**
  - `filters: ClientsFilters`
  - `onFiltersChange: (partial: Partial<ClientsFilters>) => void`
  - `isLoading?: boolean`

### ClientsTable

- **Opis:** Tabela desktopowa oparta na `DataTable` (reuse). Kolumny: Avatar, Imię + Nazwisko, Status, Aktywne plany (liczba), Ostatnia aktywność, Akcje.
- **Główne elementy:** `DataTable`, `UserAvatar`, `StatusBadge`, `ClientActionMenu`.
- **Obsługiwane interakcje:** Klik w wiersz (`onRowClick`) oraz menu akcji (przejdź do profilu, stwórz plan).
- **Walidacja:** Brak dodatkowej.
- **Typy:** `ClientDto`.
- **Propsy:**
  - `clients: ClientDto[]`
  - `isLoading: boolean`
  - `onRowClick(client: ClientDto)`

### ClientsCards

- **Opis:** Wariant mobilny – karty 1-kolumnowe z podstawowymi danymi.
- **Główne elementy:** `Card`, `UserAvatar`, `StatusBadge`, CTA „Profil”.
- **Obsługiwane interakcje:** Klik w kartę → profil.
- **Walidacja:** –
- **Typy & Propsy:** Identyczne jak `ClientsTable`.

### Pagination

- Reużywa globalnego komponentu; steruje `page` w URL.

### ClientActionMenu

- **Opis:** Dropdown (Radix) w tabeli (desktop) z możliwymi akcjami.
- **Elementy:** `DropdownMenu`, `MenuItem` (Profil, Stwórz plan… future), separator.
- **Obsługiwane interakcje:** onSelect → przekazanie do rodzica.

## 5. Typy

```typescript
// Client status ograniczony do wartości back-end
export type ClientStatus = "active" | "pending" | "suspended";

export interface ClientDto {
  id: string;
  firstName: string;
  lastName: string;
  status: ClientStatus;
  avatarUrl?: string | null;
  totalActivePlans: number; // agregat
  lastActivityAt: string | null; // ISO date
}

export interface ClientsPageQuery {
  search?: string;
  status?: ClientStatus;
  page?: number; // default 1
  limit?: number; // default 20
}

export interface ClientsFilters {
  searchText: string;
  status?: ClientStatus;
  page: number;
  limit: number;
}
```

## 6. Zarządzanie stanem

- **Server State:** TanStack Query → `useClientsQuery(filters)`; `staleTime` 30 s, `keepPreviousData: true`.
- **URL ⇆ State:** `useSearchParams` + helper `useSyncFiltersWithUrl` (istniejący pattern).
- **Local State:** filtry w `useState`, ale źródłem prawdy są parametry URL.
- **Responsive Switch:** `useMediaQuery('lg')` decyduje między tabelą a kartami.

## 7. Integracja API

| Akcja                       | Metoda | Endpoint               | Query params               | Body | Response                       |
| --------------------------- | ------ | ---------------------- | -------------------------- | ---- | ------------------------------ |
| Pobierz listę podopiecznych | GET    | `/api/trainer/clients` | `search,status,page,limit` | –    | `PaginatedResponse<ClientDto>` |

### Typy request/response

```typescript
// GET /api/trainer/clients
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

Zapytanie wywołuje Supabase `rpc(get_trainer_clients)` z RLS – backend już filtruje po trainer_id użytkownika.

## 8. Interakcje użytkownika

1. Trener wpisuje tekst w wyszukiwarkę → po 300 ms wysyła zapytanie; lista i pager aktualizują się.
2. Trener wybiera status z dropdownu → wywołanie API z nowymi parametrami.
3. Trener klika w wiersz/kartę → router push do `/trainer/clients/:id`.
4. (Desktop) Klik w `…` menu → akcje kontekstowe (profil, create plan – w następnej fazie).
5. Paginacja – klik stronę lub „Następna/Poprzednia” → scroll top + fetch.

## 9. Warunki i walidacja

| Komponent            | Warunek                             | Efekt                          |
| -------------------- | ----------------------------------- | ------------------------------ |
| ClientsFilterToolbar | `search` length > 0                 | debounce search                |
| ClientsFilterToolbar | status select value in allowed enum | enable fetch                   |
| Pagination           | `page` < 1 → autokorekta → 1        | zapobiega 404                  |
| API                  | `limit` ∉ {10,20,50}                | serwer zwraca 400 → ErrorState |

## 10. Obsługa błędów

- **API 401/403:** Wywołuje globalny interceptor → redirect do login / toast „Brak dostępu”.
- **API 500/Network:** ErrorState z przyciskiem „Spróbuj ponownie”.
- **Brak danych (0 podopiecznych):** `EmptyState` „Brak przypisanych podopiecznych”.
- **Nieprawidłowe parametry URL:** Fallback do wartości domyślnych.

## 11. Kroki implementacji

1. **Backend** (jeśli nie istnieje)
   1.1 Zaimplementuj Supabase funkcję `get_trainer_clients(trainer_id, search, status, page, limit)`.
   1.2 Dodaj endpoint `GET /api/trainer/clients` w `src/pages/api/trainer/clients.ts` z walidacją query (zod) i paginacją.
2. **Typy & interfejsy**
   2.1 Dodaj `ClientDto`, `ClientStatus` do `src/interface/clients.ts` oraz eksport w `src/interface/index.ts`.
   2.2 Dodaj `PaginatedResponse<T>` do `src/interface/common.ts`.
3. **Hook danych**
   3.1 Stwórz `useClientsQuery(filters)` w `src/lib/hooks/useClientsQuery.ts` (TanStack Query).
4. **Strona + routing**
   4.1 Utwórz plik `src/pages/trainer/clients.astro` z dynamicznym importem `ClientsListPage`.
   4.2 Dodaj do `TrainerSidebar` pozycję „Moi Podopieczni”.
5. **Komponenty UI**
   5.1 Utwórz `ClientsListPage.tsx` w `src/components/clients/`.
   5.2 Zareużyj lub stwórz `ClientsFilterToolbar.tsx`, `ClientsTable.tsx`, `ClientsCards.tsx`, `ClientActionMenu.tsx`.
   5.3 Wykorzystaj istniejące `DataTable`, `Card`, `Pagination`.
6. **Zarządzanie URL ↔ state**
   6.1 Stwórz helper `useClientsFilters()` synchronizujący `search`, `status`, `page`, `limit` z `URLSearchParams`.
7. **Stan ładowania / błędy**
   7.1 Dodaj `Skeleton` w miejscu tabeli/kart.
   7.2 Dodaj `ErrorState` oraz `EmptyState` zgodnie z globalnymi komponentami.
8. **Responsywność**
   8.1 Dodaj `useMediaQuery` aby przełączać Table ↔ Cards.
9. **Testy**
   9.1 Jednostkowe: hook filtrów, hook danych (mock api).
   9.2 Integracyjne: render page, filtrowanie, paginacja.
10. **QA & Accessibility**
    10.1 Sprawdź keyboard navigation w tabeli i filtrach.
    10.2 Sprawdź ARIA w `DropdownMenu`, `StatusBadge`.
11. **Dokumentacja**
    11.1 Aktualizuj README (lista stron, uruchomienie backend RPC).
