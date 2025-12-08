# Plan implementacji widoku Client Dashboard (Moje Plany)

## 1. Przegląd

Widok „Client Dashboard” służy podopiecznemu (roli `client`) do przeglądania wszystkich przypisanych i widocznych planów treningowych. Umożliwia szybkie sprawdzenie postępu każdego planu oraz przejście do szczegółów planu. Kluczowe cele:

- Wyświetlenie kart planów z podstawowymi metadanymi i paskiem postępu.
- Sortowanie listy (najnowsze, najstarsze, najbardziej / najmniej ukończone).
- Responsywność – 2-kolumnowa siatka na desktopie, pojedyncza kolumna na mobile.
- Stany: ładowanie (skeletony), brak planów (EmptyState), błąd (ErrorState).

## 2. Routing widoku

| Rola   | Ścieżka   | Guard                                              |
| ------ | --------- | -------------------------------------------------- |
| client | `/client` | ProtectedLayout → verify JWT + `role === "client"` |

## 3. Struktura komponentów

```
ClientDashboardPage
└── PlanCardsGrid (grid wrapper)
    ├── SortDropdown
    ├── PlanCard (✕ n)
    │   ├── ProgressBar
    │   └── TrainerInfoChip
    └── Pagination (infinite scroll → optional MVP)
```

## 4. Szczegóły komponentów

### 4.1 `ClientDashboardPage`

- **Opis**: Strona kontenera pobierająca dane przez TanStack Query i renderująca UI stanu (loading / error / empty / data).
- **Główne elementy**: `PageHeader` (tytuł „Moje plany”), `SortDropdown`, `PlanCardsGrid`.
- **Obsługiwane interakcje**: Zmiana sortowania, kliknięcie karty planu.
- **Walidacja**: brak (read-only view).
- **Typy**: `ClientPlansResponse`, `PlanCardVM` (zob. sekcja 5).
- **Propsy**: none (page komponent, route-level).

### 4.2 `SortDropdown`

- **Opis**: Dropdown z opcjami sortowania.
- **Główne elementy**: shadcn/ui `Select`.
- **Interakcje**: `onValueChange` → aktualizacja parametru `sort` w URL (search params) i refetch.
- **Walidacja**: till listy dozwolonych opcji (`createdAt_desc`, `createdAt_asc`, `progress_desc`, `progress_asc`).
- **Typy**: `'createdAt_desc' | 'createdAt_asc' | 'progress_desc' | 'progress_asc'`.
- **Propsy**: `value`, `onChange`.

### 4.3 `PlanCardsGrid`

- **Opis**: Wrapper układający `PlanCard` w responsywnej siatce.
- **Elementy**: Tailwind grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), gap-4.
- **Interakcje**: none.
- **Walidacja**: n/d.
- **Typy/Propsy**: `plans: PlanCardVM[]`.

### 4.4 `PlanCard`

- **Opis**: Prezentuje pojedynczy plan (nazwa, opis skrócony, pasek postępu, data, info o trenerze).
- **Elementy**:
  - `Card` (shadcn/ui) clickable → `onClick` navigate do `/client/plans/{id}`.
  - `ProgressBar` (`value=completedExercises`, `max=totalExercises`).
  - `TrainerInfoChip` (avatar + imię).
- **Interakcje**: hover efekt, click.
- **Walidacja**: brak.
- **Typy**: `PlanCardVM`.
- **Propsy**: `plan: PlanCardVM`.

### 4.5 `Pagination` (opcjonalnie v2)

- **Opis**: Stronicowanie listy planów (lub infinite scroll keepPreviousData).
- **Typy**: `PaginationMeta`.
- **Propsy**: `currentPage`, `totalPages`, `onPageChange`.

## 5. Typy

```typescript
// DTO z API
interface PlanDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string; // ISO
  trainer: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  completedExercises: number; // agregat
  totalExercises: number;
}

// Meta z paginacji
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// Odpowiedź endpointu
interface ClientPlansResponse {
  data: PlanDto[];
  meta: PaginationMeta;
}

// ViewModel dla karty
interface PlanCardVM {
  id: string;
  name: string;
  descriptionExcerpt: string;
  progressValue: number; // completed
  progressMax: number; // total
  createdAt: Date;
  trainerName: string;
  trainerAvatar?: string;
}
```

## 6. Zarządzanie stanem

- **Server state**: TanStack Query → `useClientPlansQuery({ sort, page })`.
- **Local/UI state**:
  - `sort` (string) – synchronizowany z URLSearchParams (`useSearchParams`).
  - `page` (number) – paginacja / infinite scroll.
- **Selectors / mapowanie**: Helper `mapPlanDtoToVM(dto): PlanCardVM`.
- **Caching**: `staleTime: 60_000` (1 min), `keepPreviousData` przy paginacji.

## 7. Integracja API

| Akcja           | Endpoint | Metoda | Params                                               | Body | Response              |
| --------------- | -------- | ------ | ---------------------------------------------------- | ---- | --------------------- |
| Pobranie planów | `/plans` | GET    | `traineeId`, `visible=true`, `sort`, `page`, `limit` | –    | `ClientPlansResponse` |

Przykład wywołania:

```ts
api.get<ClientPlansResponse>("/plans", {
  params: {
    traineeId: session.user.id,
    visible: true,
    sort: sortParam,
    page,
    limit: 20,
  },
});
```

## 8. Interakcje użytkownika

| Interakcja                            | Rezultat                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| Zmiana sortowania w `SortDropdown`    | Aktualizacja URL → refetch listy → animowany scroll to top |
| Kliknięcie karty planu                | Nawigacja do `/client/plans/{id}`                          |
| Przewinięcie na dół (infinite scroll) | `onIntersect` → `fetchNextPage()` TanStack Query           |

## 9. Warunki i walidacja

- Widoczne są wyłącznie plany z `isVisible=true` i `traineeId=currentUser` (enforced przez RLS + query params).
- Sort param w URL musi należeć do whitelisty; fallback to `createdAt_desc`.
- Pagina `page` i `limit` muszą być dodatnimi liczbami całkowitymi.

## 10. Obsługa błędów

| Scenariusz                        | UI                                                                  | Akcja             |
| --------------------------------- | ------------------------------------------------------------------- | ----------------- |
| 4xx/5xx z API                     | `ErrorState` z przyciskiem „Spróbuj ponownie”                       | Retry `refetch()` |
| Brak planów (`data.length === 0`) | `EmptyState` – komunikat + sugestia kontaktu z trenerem             | none              |
| Timeout / wolna sieć              | Global `LoadingSpinner` dłużej widoczny + toast ostrzegawczy (opc.) | allow cancel      |

## 11. Kroki implementacji

1. **Routing & Guard** – dodaj trasę `/client` w `client` section z `ProtectedRoute` (rola check).
2. **Hook danych** – zaimplementuj `useClientPlansQuery` (TanStack Query + axios wrapper).
3. **Mapowanie DTO → VM** – util `mapPlanDtoToVM` (truncate description to 120 znaków).
4. **Komponent `ClientDashboardPage`** – skeleton → error → empty → data states.
5. **Komponent `SortDropdown`** – select + URL sync (useSearchParams).
6. **Komponent `PlanCard`** – clickable `Card`, `ProgressBar`, `TrainerInfoChip`.
7. **`PlanCardsGrid` + responsywna siatka** – Tailwind classes.
8. **Paginacja / infinite scroll** – podstawowa paginacja przyciskami; opcjonalnie `useInfiniteQuery` + `IntersectionObserver`.
9. **Stany ładowania** – `Skeleton` placeholders (4 karty).
10. **Testy jednostkowe** – mapping util, sort logic.
11. **Testy e2e (Cypress/Playwright)** – scenariusz: login client → dashboard → open plan.
12. **Accessibility audit** – keyboard nav, ARIA labels na kartach (`role="link"`, `aria-label="Zobacz plan {name}"`).
13. **Code review & merge**.

---

> Plan zgodny z PRD (US-018), UI-planem oraz stackiem (Astro 5 + React 19 + TanStack Query, Tailwind 4, shadcn/ui).
