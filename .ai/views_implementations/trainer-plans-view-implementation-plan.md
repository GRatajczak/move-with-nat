# Plan implementacji widoku zarządzania planami treningowymi (Trener)

## 1. Przegląd

Widok zarządzania planami treningowymi umożliwia trenerom kompleksowe zarządzanie planami dla swoich podopiecznych. Obejmuje funkcje tworzenia nowych planów z wybranymi ćwiczeniami, edycji istniejących planów (wraz z modyfikacją listy ćwiczeń i ich parametrów), usuwania planów oraz dynamicznego przełączania widoczności planów dla podopiecznych. Widok składa się z czterech głównych podwidoków: listy planów, formularza tworzenia planu, formularza edycji planu oraz szczegółowego podglądu planu z możliwością śledzenia postępów podopiecznego.

## 2. Routing widoku

Widok dostępny będzie pod następującymi ścieżkami:

- **Lista planów:** `/trainer/plans`
- **Tworzenie nowego planu:** `/trainer/plans/new`
- **Edycja planu:** `/trainer/plans/:id/edit`
- **Szczegóły planu:** `/trainer/plans/:id`

Wszystkie ścieżki chronione są middleware sprawdzającym uwierzytelnienie i rolę użytkownika (tylko `trainer`).

## 3. Struktura komponentów

```
TrainerPlansView
├── PlansListPage (strona Astro: /trainer/plans/index.astro)
│   ├── PageHeader (tytuł + przycisk "Stwórz plan")
│   ├── PlansFilterToolbar
│   │   ├── SearchInput (debounced)
│   │   ├── ClientSelect (filtr po podopiecznym)
│   │   ├── VisibilitySelect (filtr po widoczności)
│   │   └── SortDropdown
│   ├── ActiveFiltersBar (badges z aktywnych filtrów)
│   ├── PlansTable / PlanCards (responsywnie)
│   │   └── PlanRow / PlanCard
│   │       ├── PlanActionMenu
│   │       │   ├── Edytuj
│   │       │   ├── Toggle widoczność (eye icon)
│   │       │   ├── Duplikuj
│   │       │   └── Usuń
│   │       └── VisibilityToggleButton (quick action)
│   └── Pagination
│
├── CreatePlanPage (strona Astro: /trainer/plans/new.astro)
│   ├── CreatePlanContainer (React)
│   │   ├── PageHeader (breadcrumbs + tytuł)
│   │   └── PlanForm
│   │       ├── BasicInfoSection
│   │       │   ├── FormField (Nazwa planu)
│   │       │   ├── FormField (Opis - textarea)
│   │       │   ├── ClientSearchableSelect
│   │       │   └── VisibilityToggle
│   │       ├── ExercisesSection
│   │       │   ├── AddExerciseButton → AddExerciseModal
│   │       │   │   ├── ExerciseSearchInput
│   │       │   │   ├── ExercisesList (checkbox selection)
│   │       │   │   └── ExerciseQuickPreviewModal
│   │       │   └── DragDropList (sortowanie)
│   │       │       └── PlanExerciseRow
│   │       │           ├── DragHandle
│   │       │           ├── ExerciseInfo (nazwa + link do podglądu)
│   │       │           ├── InlineFields (Serie, Reps, Ciężar, Tempo)
│   │       │           └── RemoveButton
│   │       └── FormActions (Anuluj, Zapisz)
│
├── EditPlanPage (strona Astro: /trainer/plans/[id]/edit.astro)
│   ├── EditPlanContainer (React)
│   │   ├── PageHeader (breadcrumbs + tytuł + info o ostatniej edycji)
│   │   ├── VisibilityWarningAlert (jeśli plan visible)
│   │   └── PlanForm (pre-populated, identyczny jak w Create)
│
└── PlanDetailPage (strona Astro: /trainer/plans/[id].astro)
    └── PlanDetailContainer (React)
        ├── PlanDetailHeader
        │   ├── PlanTitle
        │   ├── StatusBadge (Visible/Hidden)
        │   ├── ClientInfo (avatar + imię + link do profilu)
        │   ├── MetadataInfo (data utworzenia, ostatnia edycja)
        │   └── ActionButtons
        │       ├── EditButton
        │       ├── VisibilityToggle (quick action)
        │       └── PlanActionMenu (Duplikuj, Usuń)
        ├── PlanDescriptionSection (collapsible)
        ├── ProgressSection
        │   ├── ProgressBar
        │   └── StatsCards (X/Y wykonanych, % completion)
        └── PlanExercisesList (read-only, numbered)
            └── ExerciseCompletionRow
                ├── ExerciseInfo (nazwa + parametry)
                ├── CompletionStatusBadge (✓ / ✗ / ⚪)
                ├── ReasonTooltip (jeśli niewykonane)
                └── ExerciseQuickPreviewButton

Komponenty wspólne / reużywalne:
├── DuplicatePlanModal (modal wyboru nowej nazwy i podopiecznego)
├── DeletePlanConfirmationModal
├── ExerciseQuickPreviewModal (video + opis)
├── AddExerciseModal (search + multi-select)
└── UnsavedChangesWarning (hook + modal/dialog)
```

## 4. Szczegóły komponentów

### PlansListPage

**Opis:** Główny widok listy planów trenera z filtrowaniem, sortowaniem i paginacją. Pozwala na szybki dostęp do akcji na planach (edycja, toggle widoczności, duplikacja, usunięcie).

**Główne elementy HTML i komponenty:**

- `PageHeader` z tytułem "Plany treningowe" i przyciskiem "Stwórz plan" (primary button, link do `/trainer/plans/new`)
- `PlansFilterToolbar` (flex container z input search, 3 select dropdowns, button clear filters)
- `ActiveFiltersBar` (flex wrap z badges, każdy z X do usunięcia)
- `PlansTable` (desktop, >768px) lub `PlanCards` (mobile, grid 1 col)
- `Pagination` (bottom, centered)

**Obsługiwane zdarzenia:**

- `onSearchChange`: debounced (300ms), aktualizuje query param `?search=...`
- `onFilterChange`: zmiana client/visibility/sort, aktualizuje odpowiednie query params
- `onClearFilters`: usuwa wszystkie filtry, resetuje do domyślnych wartości
- `onPageChange`: zmienia query param `?page=...`
- `onRowClick`: nawigacja do `/trainer/plans/:id` (detail view)
- `onEditClick`: nawigacja do `/trainer/plans/:id/edit`
- `onToggleVisibility`: optimistic update + PATCH `/api/plans/:id/visibility`
- `onDuplicateClick`: otwiera `DuplicatePlanModal`
- `onDeleteClick`: otwiera `DeletePlanConfirmationModal`

**Warunki walidacji:**

- Brak walidacji formularza (tylko lista i filtry)
- Sprawdzenie autoryzacji: tylko plany trenera (RLS + frontend check `plan.trainerId === currentUser.id`)
- Empty state: jeśli brak planów po filtrach → "Nie znaleziono planów"
- Empty state: jeśli brak planów w ogóle → "Nie masz jeszcze planów" + CTA "Stwórz pierwszy plan"

**Typy:**

- `PlansListState` (lokalny state)
- `PlanDto` (z API)
- `ListPlansQuery` (query params)
- `PaginatedResponse<PlanDto>` (odpowiedź API)

**Propsy:** Brak (root page component, pobiera dane z URL query params i API)

---

### PlansFilterToolbar

**Opis:** Toolbar z polami filtrowania i wyszukiwania. Pozwala na search po nazwie planu, filtrowanie po podopiecznym, widoczności oraz sortowanie.

**Główne elementy:**

- `Input` (search, z ikoną lupki, placeholder "Szukaj po nazwie...")
- `Select` (podopieczny, opcja "Wszyscy podopieczni" + lista aktywnych clients)
- `Select` (widoczność: "Wszystkie" / "Widoczne" / "Ukryte")
- `Select` (sortowanie: "Najnowsze" / "Najstarsze" / "Nazwa A-Z" / "Nazwa Z-A")
- `Button` (Wyczyść filtry, secondary, tylko jeśli są aktywne filtry)

**Obsługiwane zdarzenia:**

- `onSearchChange(value: string)`: debounced, wywołuje callback z nową wartością
- `onClientChange(clientId: string | null)`: zmiana filtru podopiecznego
- `onVisibilityChange(visible: boolean | null)`: zmiana filtru widoczności
- `onSortChange(sortBy: string)`: zmiana sortowania
- `onClearFilters()`: reset wszystkich filtrów

**Warunki walidacji:**

- Brak walidacji (tylko input values, opcjonalny max length dla search ~100 chars)

**Typy:**

- `PlansFilterToolbarProps`:
  ```typescript
  interface PlansFilterToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    clientId: string | null;
    onClientChange: (clientId: string | null) => void;
    visible: boolean | null;
    onVisibilityChange: (visible: boolean | null) => void;
    sortBy: string;
    onSortChange: (sortBy: string) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
    isLoading?: boolean;
  }
  ```

**Propsy:** Wszystkie pola z interfejsu `PlansFilterToolbarProps`.

---

### PlansTable / PlanCards

**Opis:** Wyświetla listę planów w formacie tabeli (desktop) lub kart (mobile). Zawiera informacje o planie i quick actions.

**Główne elementy (Table):**

- `table` z kolumnami:
  - Nazwa planu (link do detail)
  - Podopieczny (avatar + imię, link do profilu klienta)
  - Data utworzenia (format: DD.MM.YYYY)
  - Widoczność (badge: "Widoczny" green / "Ukryty" gray)
  - Liczba ćwiczeń (X ćwiczeń)
  - Progress (X/Y wykonanych, progress bar mini)
  - Akcje (eye icon toggle + three-dot menu)

**Główne elementy (Cards):**

- `div` grid z kartami, każda karta:
  - Header: nazwa + visibility badge
  - Client info: avatar + imię
  - Stats: liczba ćwiczeń, progress bar + X/Y
  - Footer: data utworzenia + action buttons

**Obsługiwane zdarzenia:**

- `onRowClick(planId)`: nawigacja do detail view
- `onEditClick(planId)`: nawigacja do edit view
- `onToggleVisibility(planId, isHidden)`: optimistic update + API call
- `onDuplicateClick(planId)`: otwiera modal
- `onDeleteClick(planId)`: otwiera modal

**Warunki walidacji:**

- Brak walidacji (read-only display)
- Empty state: skeleton rows podczas ładowania
- Empty state: "Brak planów" jeśli data pusty

**Typy:**

- `PlansTableProps`:
  ```typescript
  interface PlansTableProps {
    plans: PlanDto[];
    isLoading: boolean;
    onRowClick: (planId: string) => void;
    onEdit: (planId: string) => void;
    onToggleVisibility: (planId: string, isHidden: boolean) => void;
    onDuplicate: (planId: string) => void;
    onDelete: (planId: string) => void;
  }
  ```

**Propsy:** Wszystkie pola z `PlansTableProps`.

---

### CreatePlanContainer / PlanForm

**Opis:** Formularz tworzenia nowego planu treningowego. Składa się z dwóch głównych sekcji: podstawowe informacje (nazwa, opis, podopieczny, widoczność) oraz lista ćwiczeń z możliwością dodawania, sortowania (drag-and-drop) i edycji parametrów inline.

**Główne elementy:**

- **Sekcja 1: Basic Info**
  - `FormField` + `Input` (Nazwa planu, required, min 3, max 100 chars)
  - `FormField` + `Textarea` (Opis, optional, max 1000 chars, with counter)
  - `FormField` + `ClientSearchableSelect` (Podopieczny, required, tylko aktywni clients trenera)
  - `FormField` + `Toggle` (Widoczność dla podopiecznego, default: true)
- **Sekcja 2: Ćwiczenia**
  - `Button` "+ Dodaj ćwiczenie" → otwiera `AddExerciseModal`
  - `DragDropList` (sortable list z @dnd-kit)
    - Każdy item: `PlanExerciseRow`
      - Drag handle (⋮⋮ icon)
      - Order number (auto-calculated, read-only)
      - Exercise name (link do quick preview)
      - Inline fields: Serie (number), Reps (number), Ciężar (number + unit), Tempo (text, pattern validation)
      - Remove button (X icon)
  - Walidacja: min 1 ćwiczenie required
- **Form Actions**
  - `Button` Anuluj (secondary, link do `/trainer/plans`)
  - `Button` Zapisz (primary, disabled gdy form invalid lub submitting)

**Obsługiwane zdarzenia:**

- `onClientChange`: aktualizuje selected client
- `onVisibilityToggle`: toggle boolean
- `onAddExerciseClick`: otwiera modal
- `onExercisesSelected(exerciseIds: string[])`: dodaje ćwiczenia do listy
- `onExerciseDragEnd`: reorder exercises, update sortOrder
- `onExerciseFieldChange(index, field, value)`: aktualizuje inline field
- `onExerciseRemove(index)`: usuwa ćwiczenie z listy
- `onExercisePreviewClick(exerciseId)`: otwiera preview modal
- `onCancel`: navigate back (z unsaved changes warning jeśli isDirty)
- `onSubmit`: validate + POST `/api/plans` + success toast + navigate to detail/list

**Warunki walidacji:**

- **Nazwa planu:** required, min 3 chars, max 100 chars, trim
- **Opis:** optional, max 1000 chars, trim
- **Podopieczny:** required, valid UUID, must be active client assigned to trainer
- **Widoczność:** boolean, default true
- **Ćwiczenia:**
  - Lista: min 1 exercise required
  - Per exercise:
    - exerciseId: required, valid UUID, must exist in DB
    - sortOrder: auto-calculated (nie edytowalne przez user)
    - sets: required, integer, min 1
    - reps: required, integer, min 1
    - tempo: optional, regex `/^\d{4}$|^\d+-\d+-\d+$/` (format XXXX lub X-X-X), default "3-0-3"
    - defaultWeight: optional, number, min 0

**Typy:**

- `CreatePlanCommand` (request body)
- `PlanDto` (response)
- `PlanFormData` (local form state):

  ```typescript
  interface PlanFormData {
    name: string;
    description: string;
    clientId: string;
    isHidden: boolean;
    exercises: PlanExerciseFormData[];
  }

  interface PlanExerciseFormData {
    exerciseId: string;
    sortOrder: number;
    sets: number;
    reps: number;
    tempo: string;
    defaultWeight: number | null;
    // for UI only:
    exercise?: ExerciseDto; // denormalized for display
  }
  ```

**Propsy:**

- `CreatePlanContainerProps`:
  ```typescript
  interface CreatePlanContainerProps {
    // Brak propsów - component fetches data internally
  }
  ```

---

### EditPlanContainer / PlanForm (edit mode)

**Opis:** Identyczny formularz jak w `CreatePlanContainer`, ale pre-populated z danymi istniejącego planu. Dodatkowo wyświetla info o ostatniej edycji i warning jeśli plan jest widoczny dla podopiecznego.

**Główne elementy:**

- `VisibilityWarningAlert` (na górze, tylko jeśli `isHidden === false`)
  - Typ: Warning (yellow)
  - Treść: "⚠️ Ten plan jest widoczny dla podopiecznego. Zmiany będą od razu widoczne."
- `LastEditedInfo` (metadata, read-only)
  - "Ostatnio edytowany: DD.MM.YYYY o HH:MM"
- `PlanForm` (identyczny jak w Create, ale:
  - Pole "Podopieczny" disabled (nie można zmienić client po utworzeniu)
  - Pre-filled values z fetched plan data

**Obsługiwane zdarzenia:**

- Identyczne jak w Create
- `onSubmit`: validate + PUT `/api/plans/:id` + success toast + email notification (jeśli visible) + navigate to detail

**Warunki walidacji:**

- Identyczne jak w Create
- Dodatkowe: plan must exist and trainer must be owner (sprawdzane przy fetch)

**Typy:**

- `UpdatePlanCommand` (request body)
- `PlanDto` (response)
- `PlanFormData` (local state, identyczny jak w Create)

**Propsy:**

- `EditPlanContainerProps`:
  ```typescript
  interface EditPlanContainerProps {
    planId: string; // z URL params
  }
  ```

---

### PlanDetailContainer

**Opis:** Szczegółowy widok planu z nagłówkiem (metadata, actions), opisem, sekcją postępów (progress bar + stats) oraz listą ćwiczeń z informacjami o completion status. Tylko read-only, bez edycji inline.

**Główne elementy:**

- `PlanDetailHeader`
  - `h1` Nazwa planu
  - `StatusBadge` (Widoczny / Ukryty)
  - `ClientInfoCard` (avatar + imię + link do profilu)
  - `MetadataGrid` (data utworzenia, ostatnia edycja)
  - `ActionButtons` (flex row)
    - `Button` Edytuj (primary)
    - `VisibilityToggle` (icon button, eye/eye-off)
    - `PlanActionMenu` (three dots)
      - Duplikuj
      - Wyślij ponownie email (jeśli visible, future feature)
      - Usuń
- `PlanDescriptionSection` (collapsible accordion)
  - Jeśli brak opisu: "(Brak opisu)"
- `ProgressSection`
  - `ProgressBar` (large, z percentage text)
  - `StatsCards` grid (2 cards)
    - Card 1: "X z Y ćwiczeń wykonanych"
    - Card 2: "Postęp: XX%"
- `PlanExercisesList` (numbered list, accordion per exercise)
  - Każdy item: `ExerciseCompletionRow`
    - Order number
    - Exercise name (link do quick preview)
    - Parametry (Serie: X, Reps: Y, Ciężar: Z kg, Tempo: XXXX)
    - `CompletionStatusBadge`:
      - ✓ Wykonane (green)
      - ✗ Nie wykonano (red) + `ReasonTooltip` (on hover/click)
      - ⚪ Brak danych (gray)

**Obsługiwane zdarzenia:**

- `onEditClick`: navigate to `/trainer/plans/:id/edit`
- `onToggleVisibility`: optimistic update + PATCH `/api/plans/:id/visibility`
- `onDuplicateClick`: otwiera modal
- `onDeleteClick`: otwiera modal
- `onExerciseClick(exerciseId)`: otwiera quick preview modal
- `onAccordionToggle(exerciseId)`: expand/collapse exercise details

**Warunki walidacji:**

- Brak (read-only view)
- Authorization check: plan must belong to trainer (RLS)
- 404 handling: jeśli plan nie istnieje lub nie należy do trenera

**Typy:**

- `PlanDto` (z exercises)
- `PlanExerciseDto`
- `PlanDetailState`:

  ```typescript
  interface PlanDetailState {
    plan: PlanDto | null;
    isLoading: boolean;
    error: string | null;
    completionRecords: ExerciseCompletionRecord[]; // fetched separately
  }

  interface ExerciseCompletionRecord {
    exerciseId: string;
    isCompleted: boolean;
    reasonId: string | null;
    customReason: string | null;
    completedAt: string | null;
  }
  ```

**Propsy:**

- `PlanDetailContainerProps`:
  ```typescript
  interface PlanDetailContainerProps {
    planId: string; // z URL params
  }
  ```

---

### AddExerciseModal

**Opis:** Modal pozwalający na search i multi-select ćwiczeń z biblioteki. Wyświetla listę ćwiczeń z możliwością filtrowania po nazwie. Każde ćwiczenie ma checkbox i opcję quick preview.

**Główne elementy:**

- `Modal` (size: large, overlay)
  - `ModalHeader` "Dodaj ćwiczenia" + close button (X)
  - `ModalBody`
    - `SearchInput` (debounced, placeholder "Szukaj ćwiczenia...")
    - `ExercisesList` (scrollable, max-height: 60vh)
      - Każdy item: `ExerciseSelectRow`
        - `Checkbox`
        - Exercise name
        - Metadata (tempo, ciężar) - muted text
        - `Button` Podgląd (icon, otwiera nested preview modal)
    - Empty state: "Nie znaleziono ćwiczeń" (jeśli search bez wyników)
  - `ModalFooter`
    - "Wybrano: X ćwiczeń" (muted text)
    - `Button` Anuluj (secondary)
    - `Button` Dodaj wybrane (primary, disabled jeśli brak wyboru)

**Obsługiwane zdarzenia:**

- `onSearchChange(value)`: filter exercises
- `onExerciseToggle(exerciseId)`: toggle checkbox
- `onExercisePreviewClick(exerciseId)`: otwiera nested quick preview modal
- `onCancel`: zamyka modal bez dodawania
- `onConfirm`: callback z listą selected exerciseIds, zamyka modal

**Warunki walidacji:**

- Co najmniej 1 ćwiczenie musi być zaznaczone (disable "Dodaj" button jeśli empty)
- Nie można dodać duplikatów (filter out already added exercises? lub allow duplicates - depends on PRD)

**Typy:**

- `AddExerciseModalProps`:

  ```typescript
  interface AddExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (exerciseIds: string[]) => void;
    excludeExerciseIds?: string[]; // already added, to filter out or show differently
  }

  interface AddExerciseModalState {
    exercises: ExerciseDto[];
    isLoading: boolean;
    searchQuery: string;
    selectedIds: Set<string>;
  }
  ```

**Propsy:** Wszystkie z `AddExerciseModalProps`.

---

### DuplicatePlanModal

**Opis:** Modal do duplikacji planu. Pozwala na wybór nowej nazwy planu i nowego podopiecznego. Wszystkie ćwiczenia są kopiowane z oryginalnego planu.

**Główne elementy:**

- `Modal` (size: medium)
  - `ModalHeader` "Duplikuj plan"
  - `ModalBody`
    - Info text: "Wszystkie ćwiczenia zostaną skopiowane do nowego planu."
    - `FormField` + `Input` (Nowa nazwa planu, pre-filled: "[Oryginalna nazwa] - Kopia")
    - `FormField` + `ClientSearchableSelect` (Wybierz podopiecznego)
    - `FormField` + `Toggle` (Widoczność, default: false)
  - `ModalFooter`
    - `Button` Anuluj (secondary)
    - `Button` Duplikuj (primary, disabled gdy nazwa pusta lub client niewybrany)

**Obsługiwane zdarzenia:**

- `onNameChange(value)`: update nazwa
- `onClientChange(clientId)`: update selected client
- `onVisibilityChange(isHidden)`: update visibility
- `onCancel`: zamyka modal
- `onConfirm`: validate + create copy via API + success toast + navigate to edit view nowego planu

**Warunki walidacji:**

- Nazwa: required, min 3 chars, max 100 chars
- Podopieczny: required, valid client ID
- Unikalna nazwa w kontekście trenera (opcjonalne, lub backend validation)

**Typy:**

- `DuplicatePlanModalProps`:

  ```typescript
  interface DuplicatePlanModalProps {
    isOpen: boolean;
    plan: PlanDto | null; // oryginalny plan
    onClose: () => void;
    onConfirm: (data: DuplicatePlanData) => Promise<void>;
    isSubmitting: boolean;
  }

  interface DuplicatePlanData {
    name: string;
    clientId: string;
    isHidden: boolean;
  }
  ```

**Propsy:** Wszystkie z `DuplicatePlanModalProps`.

---

### DeletePlanConfirmationModal

**Opis:** Modal potwierdzenia usunięcia planu. Wyświetla warning i informację o skutkach (plan zniknie z dashboardu podopiecznego).

**Główne elementy:**

- `Modal` (size: small, variant: destructive)
  - `ModalHeader` "Usuń plan?"
  - `ModalBody`
    - Warning icon (red)
    - Tekst: "Czy na pewno chcesz usunąć plan '[Nazwa planu]'?"
    - Info: "Plan zniknie z dashboardu podopiecznego i nie będzie już dostępny. Tej operacji nie można cofnąć."
  - `ModalFooter`
    - `Button` Anuluj (secondary)
    - `Button` Usuń (destructive/red, loading state podczas API call)

**Obsługiwane zdarzenia:**

- `onCancel`: zamyka modal
- `onConfirm`: DELETE `/api/plans/:id` + success toast + redirect to plans list

**Warunki walidacji:**

- Brak (tylko confirmation)

**Typy:**

- `DeletePlanConfirmationModalProps`:
  ```typescript
  interface DeletePlanConfirmationModalProps {
    isOpen: boolean;
    plan: PlanDto | null;
    onClose: () => void;
    onConfirm: (planId: string, hard: boolean) => Promise<void>;
    isDeleting: boolean;
  }
  ```

**Propsy:** Wszystkie z `DeletePlanConfirmationModalProps`.

---

### ExerciseQuickPreviewModal

**Opis:** Modal wyświetlający podgląd ćwiczenia z wideo Vimeo, opisem i metadanymi. Read-only, bez edycji. Używany w wielu miejscach (lista ćwiczeń, plan form, plan detail).

**Główne elementy:**

- `Modal` (size: large)
  - `ModalHeader`
    - Nazwa ćwiczenia
    - `Button` Edytuj (tylko dla admin, hidden dla trainer)
  - `ModalBody` (scrollable)
    - `VimeoPlayer` (aspect ratio 16:9)
    - `ExerciseMetadataGrid` (tempo, ciężar, w grid 2 cols)
    - `Accordion` Description Sections:
      - Cele
      - Kroki wykonania
      - Wskazówki
  - `ModalFooter`
    - `Button` Zamknij (primary)

**Obsługiwane zdarzenia:**

- `onClose`: zamyka modal
- `onEditClick`: navigate do edit exercise (tylko admin)

**Warunki walidacji:**

- Brak (read-only)

**Typy:**

- `ExerciseQuickPreviewModalProps`:
  ```typescript
  interface ExerciseQuickPreviewModalProps {
    isOpen: boolean;
    exercise: ExerciseDto | null;
    onClose: () => void;
    onEdit?: (exerciseId: string) => void; // optional, tylko dla admin
  }
  ```

**Propsy:** Wszystkie z `ExerciseQuickPreviewModalProps`.

---

### PlanExerciseRow (w DragDropList)

**Opis:** Pojedynczy wiersz ćwiczenia w formularzu planu (Create/Edit). Zawiera drag handle, nazwę ćwiczenia, inline editable fields (serie, reps, ciężar, tempo) oraz przycisk usunięcia.

**Główne elementy:**

- `div` (flex row, border, padding, spacing between elements)
  - Drag handle: `button` z ikoną ⋮⋮ (cursor: grab)
  - Order number: `span` (auto-calculated, read-only, np. "1.", muted)
  - Exercise name: `a` link (underline on hover, otwiera quick preview)
  - Inline fields (flex row, gap):
    - `FormField` + `Input` Serie (type: number, min 1, width: 80px)
    - `FormField` + `Input` Reps (type: number, min 1, width: 80px)
    - `FormField` + `InputGroup` Ciężar (number + unit select, width: 120px)
    - `FormField` + `Input` Tempo (type: text, pattern, width: 100px, placeholder: "3-0-3")
  - Remove button: `IconButton` z X (variant: ghost/destructive)

**Obsługiwane zdarzenia:**

- `onDragHandleMouseDown`: @dnd-kit drag start
- `onExerciseNameClick`: otwiera quick preview modal
- `onFieldChange(field, value)`: aktualizuje field w parent state
- `onRemove`: usuwa exercise z listy

**Warunki walidacji:**

- Serie: required, integer, min 1
- Reps: required, integer, min 1
- Ciężar: optional, number, min 0
- Tempo: optional, regex `/^\d{4}$|^\d+-\d+-\d+$/`
- Inline error messages pod każdym polem

**Typy:**

- `PlanExerciseRowProps`:
  ```typescript
  interface PlanExerciseRowProps {
    exercise: PlanExerciseFormData;
    index: number;
    dragHandleProps: any; // z @dnd-kit
    onFieldChange: (field: keyof PlanExerciseFormData, value: any) => void;
    onRemove: () => void;
    onPreviewClick: (exerciseId: string) => void;
  }
  ```

**Propsy:** Wszystkie z `PlanExerciseRowProps`.

---

## 5. Typy

### DTO i Command Types (z backend API)

```typescript
// z interface/plans.ts

interface ListPlansQuery {
  trainerId?: string;
  clientId?: string;
  visible?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "created_at";
}

interface PlanDto {
  id: string;
  name: string;
  clientId: string;
  trainerId: string;
  isHidden: boolean;
  exercises: PlanExerciseDto[];
  createdAt?: string;
  updatedAt?: string;
}

interface PlanExerciseDto {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight?: number | null;
}

interface CreatePlanCommand {
  name: string;
  clientId: string;
  trainerId: string;
  isHidden?: boolean;
  description?: string | null;
  exercises: Exercise[];
}

interface Exercise {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight?: number | null;
}

interface UpdatePlanCommand extends Partial<Omit<CreatePlanCommand, "exercises">> {
  id: string;
  exercises?: PlanExerciseDto[];
}

interface TogglePlanVisibilityCommand {
  id: string;
  isHidden: boolean;
}
```

### Frontend ViewModel Types

```typescript
// Nowe typy dla UI

interface PlanViewModel extends PlanDto {
  // Extended z dodatkowymi polami UI
  clientName?: string; // denormalized dla display
  clientAvatar?: string;
  completionStats?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface PlansListState {
  plans: PlanViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMetaDto;
  filters: {
    search: string;
    clientId: string | null;
    visible: boolean | null;
    sortBy: string;
  };
}

interface PlanFormData {
  name: string;
  description: string;
  clientId: string;
  isHidden: boolean;
  exercises: PlanExerciseFormData[];
}

interface PlanExerciseFormData {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight: number | null;
  // Denormalized dla UI:
  exercise?: ExerciseDto; // pełne dane ćwiczenia dla display
}

interface PlanFormState {
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean;
}

interface PlanDetailState {
  plan: PlanViewModel | null;
  isLoading: boolean;
  error: string | null;
  completionRecords: ExerciseCompletionRecord[];
}

interface ExerciseCompletionRecord {
  planId: string;
  exerciseId: string;
  isCompleted: boolean;
  reasonId: string | null;
  customReason: string | null;
  completedAt: string | null;
}

interface DuplicatePlanData {
  name: string;
  clientId: string;
  isHidden: boolean;
}
```

### Props Interfaces (wszystkie komponenty)

```typescript
interface PlansFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  clientId: string | null;
  onClientChange: (clientId: string | null) => void;
  visible: boolean | null;
  onVisibilityChange: (visible: boolean | null) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

interface PlansTableProps {
  plans: PlanViewModel[];
  isLoading: boolean;
  onRowClick: (planId: string) => void;
  onEdit: (planId: string) => void;
  onToggleVisibility: (planId: string, isHidden: boolean) => void;
  onDuplicate: (planId: string) => void;
  onDelete: (planId: string) => void;
}

interface PlanCardsProps extends PlansTableProps {} // identyczne

interface CreatePlanContainerProps {
  // Brak - fetches data internally
}

interface EditPlanContainerProps {
  planId: string;
}

interface PlanDetailContainerProps {
  planId: string;
}

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exerciseIds: string[]) => void;
  excludeExerciseIds?: string[];
}

interface DuplicatePlanModalProps {
  isOpen: boolean;
  plan: PlanViewModel | null;
  onClose: () => void;
  onConfirm: (data: DuplicatePlanData) => Promise<void>;
  isSubmitting: boolean;
}

interface DeletePlanConfirmationModalProps {
  isOpen: boolean;
  plan: PlanViewModel | null;
  onClose: () => void;
  onConfirm: (planId: string, hard: boolean) => Promise<void>;
  isDeleting: boolean;
}

interface ExerciseQuickPreviewModalProps {
  isOpen: boolean;
  exercise: ExerciseDto | null;
  onClose: () => void;
  onEdit?: (exerciseId: string) => void;
}

interface PlanExerciseRowProps {
  exercise: PlanExerciseFormData;
  index: number;
  dragHandleProps: any;
  onFieldChange: (field: keyof PlanExerciseFormData, value: any) => void;
  onRemove: () => void;
  onPreviewClick: (exerciseId: string) => void;
}
```

## 6. Zarządzanie stanem

### TanStack Query (Server State)

Wszystkie dane z API zarządzane przez TanStack Query:

```typescript
// Query Keys (w src/hooks/queryKeys.ts)
export const plansKeys = {
  all: ["plans"] as const,
  lists: () => [...plansKeys.all, "list"] as const,
  list: (filters: ListPlansQuery) => [...plansKeys.lists(), filters] as const,
  details: () => [...plansKeys.all, "detail"] as const,
  detail: (id: string) => [...plansKeys.details(), id] as const,
  completion: (planId: string) => [...plansKeys.all, "completion", planId] as const,
};

// Custom hooks

// useTrainerPlans - lista planów z filtrowaniem i paginacją
function useTrainerPlans(query: ListPlansQuery) {
  return useQuery({
    queryKey: plansKeys.list(query),
    queryFn: () => fetchTrainerPlans(query),
    staleTime: 5 * 60 * 1000, // 5 min
    keepPreviousData: true, // dla smooth pagination
  });
}

// usePlan - pojedynczy plan z exercises
function usePlan(planId: string) {
  return useQuery({
    queryKey: plansKeys.detail(planId),
    queryFn: () => fetchPlan(planId),
    staleTime: 2 * 60 * 1000, // 2 min
    enabled: !!planId,
  });
}

// usePlanCompletion - status wykonania ćwiczeń
function usePlanCompletion(planId: string) {
  return useQuery({
    queryKey: plansKeys.completion(planId),
    queryFn: () => fetchPlanCompletion(planId),
    staleTime: 1 * 60 * 1000, // 1 min
    enabled: !!planId,
  });
}

// Mutations

// useCreatePlan
function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanCommand) => createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries(plansKeys.lists());
      // TODO: trigger email notification
    },
  });
}

// useUpdatePlan
function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: UpdatePlanCommand }) => updatePlan(planId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(plansKeys.detail(variables.planId));
      queryClient.invalidateQueries(plansKeys.lists());
      // TODO: trigger email notification if visible
    },
  });
}

// useDeletePlan
function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, hard }: { planId: string; hard: boolean }) => deletePlan(planId, hard),
    onSuccess: () => {
      queryClient.invalidateQueries(plansKeys.lists());
    },
  });
}

// useTogglePlanVisibility (optimistic update)
function useTogglePlanVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, isHidden }: { planId: string; isHidden: boolean }) => togglePlanVisibility(planId, isHidden),
    onMutate: async ({ planId, isHidden }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(plansKeys.detail(planId));

      // Snapshot previous value
      const previous = queryClient.getQueryData(plansKeys.detail(planId));

      // Optimistically update
      queryClient.setQueryData(plansKeys.detail(planId), (old: PlanDto) => ({
        ...old,
        isHidden,
      }));

      return { previous, planId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(plansKeys.detail(context.planId), context.previous);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(plansKeys.detail(variables.planId));
      queryClient.invalidateQueries(plansKeys.lists());
    },
  });
}
```

### Local Component State

```typescript
// PlansListPage - synchronizacja filtrów z URL params
function PlansListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync filters z URL
  const filters = {
    search: searchParams.get("search") || "",
    clientId: searchParams.get("clientId") || null,
    visible: searchParams.get("visible") === "true" ? true : searchParams.get("visible") === "false" ? false : null,
    sortBy: searchParams.get("sortBy") || "created_at",
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 20,
  };

  // Update URL params
  const updateFilters = (updates: Partial<typeof filters>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries({ ...filters, ...updates }).forEach(([key, value]) => {
      if (value) newParams.set(key, String(value));
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };

  // Fetch data
  const { data, isLoading, error } = useTrainerPlans(filters);

  // ...
}

// PlanForm - React Hook Form z Zod validation
function PlanForm({ plan, onSubmit, mode }: PlanFormProps) {
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan
      ? mapPlanToFormData(plan)
      : {
          name: "",
          description: "",
          clientId: "",
          isHidden: false,
          exercises: [],
        },
  });

  const { isDirty } = form.formState;

  // Unsaved changes warning
  useUnsavedChangesWarning(isDirty);

  // Exercises drag-and-drop state
  const [exercises, setExercises] = useState<PlanExerciseFormData[]>(form.watch("exercises"));

  // ...
}

// AddExerciseModal - local selection state
function AddExerciseModal({ isOpen, onConfirm, excludeExerciseIds }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: exercises, isLoading } = useExercises({
    search: debouncedSearch,
    limit: 50,
  });

  // Filter out already added
  const availableExercises = exercises?.filter((ex) => !excludeExerciseIds?.includes(ex.id));

  // ...
}
```

### Global State (Context)

```typescript
// User context dla current user info (już istniejący w projekcie)
// Brak potrzeby dodatkowego global state dla tego widoku
```

## 7. Integracja API

### Endpointy

**GET `/api/plans`**

- Opis: Lista planów z filtrowaniem i paginacją
- Request:
  - Query params: `ListPlansQuery` (trainerId?, clientId?, visible?, page?, limit?, sortBy?)
- Response: `PaginatedResponse<PlanDto>`
- Authorization: Trainer widzi tylko własne plany (RLS + frontend filter)
- Error handling:
  - 401: Redirect do login
  - 403: Toast "Brak dostępu"
  - 500: Toast "Błąd serwera, spróbuj ponownie"

**POST `/api/plans`**

- Opis: Tworzenie nowego planu z ćwiczeniami
- Request:
  - Body: `CreatePlanCommand`
- Response: `PlanDto` (201 Created)
- Validation errors (400): Wyświetl inline errors w formularzu
- Side effects: Email notification do podopiecznego (jeśli isHidden=false)
- Error handling:
  - 400: Map validation errors to form fields
  - 403: Toast "Nie możesz utworzyć planu dla tego podopiecznego"
  - 404: Toast "Podopieczny lub ćwiczenie nie istnieje"
  - 500: Toast "Nie udało się utworzyć planu"

**GET `/api/plans/:id`**

- Opis: Szczegóły planu z listą ćwiczeń
- Request:
  - Params: `id` (plan UUID)
- Response: `PlanDto`
- Error handling:
  - 404: Redirect to plans list + toast "Plan nie istnieje"
  - 403: Redirect to plans list + toast "Brak dostępu"

**PUT `/api/plans/:id`**

- Opis: Aktualizacja planu (metadata i/lub exercises)
- Request:
  - Params: `id`
  - Body: `UpdatePlanCommand`
- Response: `PlanDto` (200 OK)
- Side effects: Email notification (jeśli visible i exercises changed)
- Error handling: Identycznie jak POST

**DELETE `/api/plans/:id`**

- Opis: Usunięcie planu (soft delete domyślnie)
- Request:
  - Params: `id`
  - Query: `hard` (boolean, default: false)
- Response: 204 No Content
- Error handling:
  - 404: Toast "Plan już nie istnieje"
  - 403: Toast "Nie możesz usunąć tego planu"

**PATCH `/api/plans/:id/visibility`**

- Opis: Przełączenie widoczności planu
- Request:
  - Params: `id`
  - Body: `{ isHidden: boolean }`
- Response: `PlanDto` (200 OK)
- Optimistic update: Tak
- Error handling:
  - Rollback on error + toast "Nie udało się zmienić widoczności"

**GET `/api/plans/:planId/completion`**

- Opis: Status wykonania wszystkich ćwiczeń w planie
- Request:
  - Params: `planId`
- Response:
  ```typescript
  {
    planId: string;
    completionRecords: ExerciseCompletionRecord[];
  }
  ```
- Error handling: Graceful - jeśli błąd, pokazuj tylko plan bez completion data

### API Client Functions

```typescript
// src/lib/api/plans.ts

async function fetchTrainerPlans(query: ListPlansQuery): Promise<PaginatedResponse<PlanDto>> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.clientId) params.set("clientId", query.clientId);
  if (query.visible !== undefined) params.set("visible", String(query.visible));
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sortBy) params.set("sortBy", query.sortBy);

  const response = await fetch(`/api/plans?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error("Failed to fetch plans");
  return response.json();
}

async function fetchPlan(planId: string): Promise<PlanDto> {
  const response = await fetch(`/api/plans/${planId}`);
  if (!response.ok) {
    if (response.status === 404) throw new NotFoundError("Plan not found");
    throw new Error("Failed to fetch plan");
  }
  return response.json();
}

async function createPlan(data: CreatePlanCommand): Promise<PlanDto> {
  const response = await fetch("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) throw new ValidationError(error);
    throw new Error("Failed to create plan");
  }

  return response.json();
}

async function updatePlan(planId: string, data: UpdatePlanCommand): Promise<PlanDto> {
  const response = await fetch(`/api/plans/${planId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) throw new ValidationError(error);
    throw new Error("Failed to update plan");
  }

  return response.json();
}

async function deletePlan(planId: string, hard = false): Promise<void> {
  const params = hard ? "?hard=true" : "";
  const response = await fetch(`/api/plans/${planId}${params}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete plan");
  }
}

async function togglePlanVisibility(planId: string, isHidden: boolean): Promise<PlanDto> {
  const response = await fetch(`/api/plans/${planId}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isHidden }),
  });

  if (!response.ok) throw new Error("Failed to toggle visibility");
  return response.json();
}

async function fetchPlanCompletion(planId: string): Promise<{
  planId: string;
  completionRecords: ExerciseCompletionRecord[];
}> {
  const response = await fetch(`/api/plans/${planId}/completion`);
  if (!response.ok) throw new Error("Failed to fetch completion");
  return response.json();
}
```

## 8. Interakcje użytkownika

### Lista planów

1. **Wyszukiwanie planu**
   - User wpisuje tekst w search input
   - Debounce 300ms
   - Aktualizacja URL param `?search=...`
   - Refetch danych z nowym filtrem
   - Loading state: skeleton rows
   - Empty state: "Nie znaleziono planów"

2. **Filtrowanie po podopiecznym**
   - User wybiera podopiecznego z dropdown
   - Aktualizacja URL param `?clientId=...`
   - Refetch danych
   - Badge z filtrem pojawia się w ActiveFiltersBar

3. **Filtrowanie po widoczności**
   - User wybiera "Widoczne" / "Ukryte" / "Wszystkie"
   - Aktualizacja URL param `?visible=true/false` (lub usuń)
   - Refetch danych

4. **Sortowanie**
   - User wybiera sposób sortowania z dropdown
   - Aktualizacja URL param `?sortBy=...`
   - Refetch danych

5. **Wyczyszczenie filtrów**
   - User klika "Wyczyść filtry"
   - Usuń wszystkie query params oprócz page/limit
   - Refetch danych z domyślnymi wartościami

6. **Przełączanie widoczności (quick action)**
   - User klika eye icon przy planie
   - Optimistic update: badge zmienia się natychmiast
   - API call: PATCH `/api/plans/:id/visibility`
   - Success: toast "Widoczność zmieniona"
   - Error: rollback + toast "Nie udało się zmienić widoczności"

7. **Kliknięcie w wiersz/kartę**
   - Navigate do `/trainer/plans/:id` (detail view)

8. **Edycja planu**
   - User klika "Edytuj" w action menu
   - Navigate do `/trainer/plans/:id/edit`

9. **Duplikacja planu**
   - User klika "Duplikuj" w action menu
   - Otwiera się `DuplicatePlanModal`
   - User wybiera nazwę i podopiecznego
   - Klika "Duplikuj"
   - API call: POST `/api/plans` z danymi skopiowanymi z oryginalnego planu
   - Success: toast "Plan zduplikowany" + navigate do edit view nowego planu
   - Error: toast z opisem błędu

10. **Usunięcie planu**
    - User klika "Usuń" w action menu
    - Otwiera się `DeletePlanConfirmationModal`
    - User potwierdza
    - API call: DELETE `/api/plans/:id`
    - Success: toast "Plan usunięty" + refetch listy
    - Error: toast z opisem błędu

11. **Paginacja**
    - User klika numer strony lub Previous/Next
    - Aktualizacja URL param `?page=...`
    - Refetch danych z keepPreviousData (smooth transition)

### Tworzenie planu

1. **Wypełnianie podstawowych informacji**
   - User wpisuje nazwę planu (min 3 chars, validate onBlur)
   - User wpisuje opis (optional, character counter)
   - User wybiera podopiecznego z searchable select (autocomplete)
   - User toggle widoczność (default: true)

2. **Dodawanie ćwiczeń**
   - User klika "+ Dodaj ćwiczenie"
   - Otwiera się `AddExerciseModal`
   - User wpisuje search query (debounced)
   - User zaznacza checkboxes przy ćwiczeniach
   - User może kliknąć "Podgląd" przy ćwiczeniu → otwiera nested quick preview modal
   - User klika "Dodaj wybrane"
   - Modal zamyka się, ćwiczenia dodają się do listy

3. **Sortowanie ćwiczeń (drag-and-drop)**
   - User klika i trzyma drag handle (⋮⋮)
   - Przeciąga ćwiczenie w nowe miejsce
   - Visual feedback: dragging state, drop zones
   - Drop: auto-update sortOrder, re-number exercises
   - Keyboard alternative: focus na drag handle + Space (grab) + Arrow keys (move) + Space (drop)
   - ARIA live announcements: "Ćwiczenie X przeniesione z pozycji Y na pozycję Z"

4. **Edycja parametrów ćwiczenia (inline)**
   - User wpisuje wartości w inline fields (Serie, Reps, Ciężar, Tempo)
   - Validation onBlur + onChange (po pierwszym błędzie)
   - Inline error messages pod polami

5. **Usunięcie ćwiczenia**
   - User klika X przy ćwiczeniu
   - Ćwiczenie usuwa się z listy
   - Auto-renumber pozostałych

6. **Anulowanie**
   - User klika "Anuluj"
   - Jeśli isDirty: pokazuje się dialog "Masz niezapisane zmiany. Czy na pewno chcesz opuścić?"
   - User potwierdza: navigate back do `/trainer/plans`
   - User anuluje: pozostaje w formularzu

7. **Zapisywanie**
   - User klika "Zapisz"
   - Validation: sprawdza wszystkie pola
   - Jeśli błędy: focus na pierwszym błędnym polu + error messages
   - Jeśli valid:
     - Button loading state: "Zapisywanie..."
     - API call: POST `/api/plans`
     - Success:
       - Toast: "Plan utworzony i wysłany do [Imię podopiecznego]"
       - Navigate do `/trainer/plans/:id` (detail view)
     - Error:
       - Toast z opisem błędu
       - Enable form, user może poprawić i retry

### Edycja planu

Identyczne interakcje jak w tworzeniu, z dodatkami:

1. **Loading initial data**
   - Skeleton loading podczas fetch planu
   - Pre-fill formularza z danymi
   - Disabled field: Podopieczny (nie można zmienić)

2. **Warning o widoczności**
   - Jeśli plan visible: wyświetl żółty alert na górze
   - "⚠️ Ten plan jest widoczny dla podopiecznego. Zmiany będą od razu widoczne."

3. **Zapisywanie**
   - Success toast: "Plan zaktualizowany"
   - Side effect: jeśli visible, email notification wysłany

### Szczegóły planu

1. **Wyświetlanie informacji**
   - Auto-fetch plan details + completion records
   - Skeleton loading
   - Display: header, metadata, opis, progress, exercises list

2. **Przełączanie widoczności**
   - User klika eye icon toggle
   - Optimistic update: badge zmienia się
   - API call
   - Success: toast "Widoczność zmieniona"
   - Error: rollback + toast

3. **Edycja planu**
   - User klika "Edytuj"
   - Navigate do edit view

4. **Duplikacja / Usunięcie**
   - Identyczne jak w liście planów

5. **Podgląd ćwiczenia**
   - User klika nazwę ćwiczenia
   - Otwiera się `ExerciseQuickPreviewModal`
   - User ogląda video + opis
   - Zamyka modal

6. **Przeglądanie statusów wykonania**
   - User widzi badges przy każdym ćwiczeniu
   - ✓ Wykonane (green)
   - ✗ Nie wykonano (red) + tooltip z powodem (on hover/click)
   - ⚪ Brak danych (gray)

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs

#### 1. Tworzenie/Edycja planu - Sekcja Basic Info

**Komponent:** `PlanForm`

**Warunki:**

- **Nazwa planu:**
  - required: "Nazwa planu jest wymagana"
  - min 3 chars: "Nazwa musi mieć min. 3 znaki"
  - max 100 chars: "Nazwa może mieć max. 100 znaków"
  - trim: automatyczne usunięcie whitespace
- **Opis:**
  - optional
  - max 1000 chars: "Opis może mieć max. 1000 znaków"
  - Character counter: wyświetl "X / 1000" pod textarea
  - Warning state: kolor żółty gdy >900 chars
- **Podopieczny:**
  - required: "Wybierz podopiecznego"
  - must be valid UUID: walidacja formatu
  - must exist and be active client assigned to trainer: sprawdzane przez API (backend validation), frontend pokazuje tylko dozwolone opcje w select
  - W edit mode: disabled (nie można zmienić)
- **Widoczność:**
  - boolean, domyślnie true
  - brak walidacji

**Wpływ na stan interfejsu:**

- Przycisk "Zapisz" disabled gdy: `!isValid || isSubmitting`
- Inline error messages pod polami z błędami (visible po blur lub submit attempt)
- Focus management: auto-focus na pierwszym błędnym polu po submit attempt

#### 2. Tworzenie/Edycja planu - Sekcja Ćwiczenia

**Komponent:** `PlanForm` + `PlanExerciseRow`

**Warunki:**

- **Lista ćwiczeń:**
  - min 1 exercise required: "Dodaj przynajmniej jedno ćwiczenie"
  - Error display: pokazuje się po submit attempt jeśli lista pusta
  - Empty state w liście (przed dodaniem): "Brak ćwiczeń. Kliknij 'Dodaj ćwiczenie', aby rozpocząć."
- **Per exercise - Serie:**
  - required: "Serie są wymagane"
  - integer: "Podaj liczbę całkowitą"
  - min 1: "Min. 1 seria"
  - Inline validation: onBlur + onChange (po pierwszym błędzie)
- **Per exercise - Reps:**
  - required: "Powtórzenia są wymagane"
  - integer: "Podaj liczbę całkowitą"
  - min 1: "Min. 1 powtórzenie"
- **Per exercise - Ciężar:**
  - optional
  - number: "Podaj liczbę"
  - min 0: "Ciężar nie może być ujemny"
  - Jeśli pusty: traktuj jako null
- **Per exercise - Tempo:**
  - optional
  - regex `/^\d{4}$|^\d+-\d+-\d+$/`: "Format: XXXX lub X-X-X (np. 3-0-3)"
  - default value: "3-0-3"
  - Help text pod polem: "Przykłady: 3013, 3-0-1-3"

**Wpływ na stan interfejsu:**

- Każde pole z błędem: red border + error icon + error message pod polem
- Przycisk "Zapisz" disabled gdy którekolwiek pole invalid
- Drag-and-drop disabled podczas gdy isSubmitting
- Remove button disabled podczas gdy isSubmitting

#### 3. Duplikacja planu

**Komponent:** `DuplicatePlanModal`

**Warunki:**

- **Nowa nazwa:**
  - required: "Nazwa jest wymagana"
  - min 3 chars: "Min. 3 znaki"
  - max 100 chars: "Max. 100 znaków"
  - Pre-filled z "[Oryginalna nazwa] - Kopia"
- **Podopieczny:**
  - required: "Wybierz podopiecznego"
  - must be valid active client
- **Widoczność:**
  - boolean, domyślnie false (recommended dla duplikacji)

**Wpływ na stan interfejsu:**

- Przycisk "Duplikuj" disabled gdy: nazwa pusta lub client niewybrany
- Loading state w przycisku podczas API call

#### 4. Lista planów - Filtry

**Komponent:** `PlansFilterToolbar`

**Warunki:**

- **Search query:**
  - optional
  - max ~100 chars (soft limit, prevent bardzo długie queries)
  - debounced 300ms przed wywołaniem API
- **Client filter:**
  - optional
  - must be valid UUID jeśli selected
- **Visibility filter:**
  - optional
  - boolean lub null (all)
- **Sort by:**
  - required (ale ma default value)
  - allowed values: "created_at", "-created_at", "name", "-name"

**Wpływ na stan interfejsu:**

- Podczas ładowania wyników: disabled all filter inputs + loading spinner
- Active filters: badges w ActiveFiltersBar, każdy z X do usunięcia
- "Wyczyść filtry" button: visible tylko gdy są aktywne filtry (search !== '' || clientId !== null || visible !== null)

#### 5. Autoryzacja i dostęp

**Wszystkie komponenty**

**Warunki:**

- User musi być zalogowany: sprawdzane przez middleware, redirect do `/login` jeśli nie
- User musi mieć rolę `trainer`: sprawdzane przez middleware + frontend check
- Plan musi należeć do trenera: sprawdzane przez API (RLS), frontend pokazuje 404 jeśli nie
- Client musi być przypisany do trenera: sprawdzane przez API przy create/update
- Exercise musi istnieć w DB: sprawdzane przez API przy create/update

**Wpływ na stan interfejsu:**

- 401: redirect do login
- 403: toast "Brak dostępu do tego zasobu" + navigate back
- 404: toast "Plan nie istnieje" + navigate to plans list

## 10. Obsługa błędów

### Błędy sieciowe

1. **Network request failed (offline)**
   - Toast: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
   - Retry button w toast (opcjonalnie)
   - W liście: pokazuj cached data (stale) + banner na górze "Wyświetlane dane mogą być nieaktualne"

2. **Timeout (>30s)**
   - Toast: "Operacja trwa zbyt długo. Spróbuj ponownie."
   - Cancel request
   - Enable retry

3. **500 Internal Server Error**
   - Toast: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
   - Log error to monitoring (Sentry)
   - W formularzu: enable retry, nie czyść danych

### Błędy walidacji (400)

1. **Validation error z API**
   - Parse response: `{ field: "error message" }`
   - Map errors do form fields
   - Display inline error messages przy odpowiednich polach
   - Focus na pierwszym błędnym polu
   - Toast: "Popraw błędy w formularzu" (jeśli generic)

2. **Example response:**

   ```json
   {
     "code": "VALIDATION_ERROR",
     "errors": {
       "name": "Plan o takiej nazwie już istnieje",
       "clientId": "Podopieczny nie jest przypisany do Ciebie",
       "exercises": "Co najmniej jedno ćwiczenie jest wymagane"
     }
   }
   ```

   - Display per field lub global message

### Błędy autoryzacji

1. **401 Unauthorized**
   - Clear local auth state
   - Redirect do `/login`
   - Toast: "Sesja wygasła. Zaloguj się ponownie."

2. **403 Forbidden**
   - Toast: "Nie masz uprawnień do wykonania tej operacji"
   - W detail view: redirect to plans list
   - W edit/delete: disable action, show message

### Błędy Not Found (404)

1. **Plan not found**
   - W detail/edit view: redirect to plans list
   - Toast: "Plan nie istnieje lub został usunięty"

2. **Client not found (podczas create/edit)**
   - Inline error przy polu "Podopieczny"
   - "Wybrany podopieczny nie istnieje"

3. **Exercise not found (podczas create/edit)**
   - Toast: "Niektóre ćwiczenia nie są już dostępne"
   - Highlight unavailable exercises w liście (red border + icon)
   - Allow user to remove them i retry

### Błędy conflict (409)

1. **Concurrent edit conflict**
   - Toast: "Ten plan został zmieniony przez inną osobę. Odśwież stronę."
   - Button w toast: "Odśwież"
   - Opcjonalnie: pokazuj dialog z opcjami "Nadpisz" / "Odrzuć moje zmiany"

### Błędy formularza (frontend)

1. **Required field missing**
   - Inline error message: "To pole jest wymagane"
   - Red border + error icon
   - Prevent submit

2. **Invalid format**
   - Inline error message z przykładem poprawnego formatu
   - Np. Tempo: "Format: XXXX lub X-X-X (np. 3-0-3)"

3. **Min/max length**
   - Character counter + warning color
   - Error message po przekroczeniu

### Błędy podczas usuwania

1. **Plan in use (cannot delete)**
   - Backend może zabronić hard delete jeśli plan ma completion records
   - Toast: "Nie można usunąć planu z zapisanymi postępami. Ukryj go zamiast tego."
   - Offer alternative: button "Ukryj plan"

### Błędy drag-and-drop

1. **Drop failed (technical)**
   - Rollback to previous order
   - Toast: "Nie udało się zmienić kolejności. Spróbuj ponownie."

### Empty states

1. **Brak planów (lista)**
   - Empty state component:
   - Icon (clipboard)
   - Tytuł: "Nie masz jeszcze planów"
   - Opis: "Stwórz pierwszy plan treningowy dla swoich podopiecznych"
   - CTA button: "Stwórz plan"

2. **Brak wyników po filtrach**
   - Empty state:
   - Icon (search)
   - Tytuł: "Nie znaleziono planów"
   - Opis: "Spróbuj zmienić filtry wyszukiwania"
   - Button: "Wyczyść filtry"

3. **Brak ćwiczeń w planie (empty list)**
   - Empty state w sekcji exercises:
   - Tytuł: "Brak ćwiczeń"
   - Opis: "Kliknij 'Dodaj ćwiczenie', aby rozpocząć"

### Loading states errors

1. **Failed to load initial data**
   - Error state component (replace skeleton):
   - Error icon (red)
   - Tytuł: "Nie udało się załadować danych"
   - Opis: "Sprawdź połączenie i spróbuj ponownie"
   - Retry button

2. **Slow loading (>2s)**
   - Show loading spinner + text
   - "Ładowanie trwa dłużej niż zwykle..."
   - After 10s: offer cancel option

### Toast notifications summary

**Success:**

- "Plan utworzony i wysłany do [Imię]" (auto-dismiss 4s)
- "Plan zaktualizowany" (auto-dismiss 4s)
- "Plan usunięty" (auto-dismiss 4s)
- "Widoczność zmieniona" (auto-dismiss 3s)
- "Plan zduplikowany" (auto-dismiss 4s)

**Error:**

- "[Opis błędu z API]" (auto-dismiss 6s)
- "Nie udało się [akcja]. Spróbuj ponownie." (auto-dismiss 6s)
- "Brak połączenia z internetem" (manual dismiss + retry button)

**Warning:**

- "Masz niezapisane zmiany" (manual dismiss, w unsaved changes dialog)

## 11. Kroki implementacji

### Faza 1: Setup i podstawowa struktura (1-2 dni)

1. **Routing:**
   - Utwórz pliki Astro dla stron:
     - `src/pages/trainer/plans/index.astro`
     - `src/pages/trainer/plans/new.astro`
     - `src/pages/trainer/plans/[id].astro`
     - `src/pages/trainer/plans/[id]/edit.astro`
   - Skonfiguruj middleware dla autoryzacji roli `trainer`

2. **Query keys:**
   - Dodaj `plansKeys` w `src/hooks/queryKeys.ts`

3. **Type definitions:**
   - Utwórz `src/interface/plans.ts` (jeśli nie istnieje)
   - Dodaj wszystkie ViewModels i Props interfaces z sekcji 5

4. **API client:**
   - Utwórz `src/lib/api/plans.ts`
   - Zaimplementuj wszystkie funkcje fetch/create/update/delete

### Faza 2: Lista planów (2-3 dni)

1. **PlansListPage:**
   - Layout Astro + React container
   - PageHeader z tytułem i przyciskiem "Stwórz plan"
   - Integracja z TanStack Query: `useTrainerPlans` hook

2. **PlansFilterToolbar:**
   - Search input z debounce
   - 3 dropdowns: Client, Visibility, Sort
   - Clear filters button
   - Synchronizacja z URL params (useSearchParams)

3. **ActiveFiltersBar:**
   - Badges dla aktywnych filtrów
   - X button per badge do usunięcia

4. **PlansTable (desktop):**
   - Tabela z kolumnami
   - Sortable headers
   - PlanActionMenu (three dots)
   - Quick toggle visibility (eye icon)
   - Click row to navigate

5. **PlanCards (mobile):**
   - Grid layout
   - Responsive switch (useMediaQuery)
   - Card design z all info

6. **Pagination:**
   - Reusable Pagination component
   - Page numbers + Previous/Next
   - URL sync

7. **Loading & Empty states:**
   - Skeleton rows/cards podczas ładowania
   - Empty state gdy brak planów
   - Empty state gdy brak wyników po filtrach

8. **Modals dla listy:**
   - DuplicatePlanModal (podstawowa struktura)
   - DeletePlanConfirmationModal

### Faza 3: Tworzenie planu (3-4 dni)

1. **CreatePlanContainer:**
   - Fetch dependencies (active clients, exercises dla modal)
   - Loading state

2. **PlanForm - Sekcja Basic Info:**
   - React Hook Form setup z Zod schema
   - FormField + Input (Nazwa)
   - FormField + Textarea (Opis, z counter)
   - FormField + ClientSearchableSelect
   - FormField + Toggle (Widoczność)
   - Validation inline

3. **PlanForm - Sekcja Ćwiczenia:**
   - "+ Dodaj ćwiczenie" button
   - DragDropList setup z @dnd-kit/core + @dnd-kit/sortable
   - Empty state w liście

4. **PlanExerciseRow:**
   - Drag handle (ikona ⋮⋮)
   - Auto order number
   - Exercise name (link do preview)
   - Inline fields: Serie, Reps, Ciężar, Tempo
   - Remove button (X)
   - Validation per field

5. **Drag-and-drop:**
   - Sensors: mouse, touch, keyboard
   - DragOverlay dla visual feedback
   - handleDragEnd: reorder logic
   - ARIA live announcements

6. **AddExerciseModal:**
   - Modal z listą ćwiczeń
   - Search input (debounced)
   - Checkbox per exercise
   - "Wybrano X ćwiczeń" counter
   - Confirm/Cancel buttons

7. **Form actions:**
   - Anuluj button z unsaved changes warning
   - Zapisz button (disabled logic)
   - useUnsavedChangesWarning hook

8. **Submit logic:**
   - Validate całego formularza
   - Map form data do CreatePlanCommand
   - useCreatePlan mutation
   - Success: toast + navigate
   - Error handling

### Faza 4: Edycja planu (1-2 dni)

1. **EditPlanContainer:**
   - Fetch plan by ID: `usePlan` hook
   - Loading skeleton
   - 404 handling

2. **PlanForm w edit mode:**
   - Pre-populate z fetched data
   - Disabled field: Podopieczny
   - VisibilityWarningAlert (jeśli visible)
   - LastEditedInfo display

3. **Submit logic:**
   - useUpdatePlan mutation
   - Map form data do UpdatePlanCommand
   - Success: toast + navigate + email notification trigger
   - Error handling

### Faza 5: Szczegóły planu (2-3 dni)

1. **PlanDetailContainer:**
   - Fetch plan + completion records
   - Loading skeleton

2. **PlanDetailHeader:**
   - Tytuł + StatusBadge
   - ClientInfoCard (avatar + name)
   - MetadataGrid (dates)
   - ActionButtons: Edit, Toggle visibility, Menu

3. **PlanDescriptionSection:**
   - Collapsible accordion
   - Fallback "(Brak opisu)"

4. **ProgressSection:**
   - Calculate stats z completion records
   - ProgressBar (large, z percentage)
   - StatsCards grid

5. **PlanExercisesList:**
   - Numbered list
   - Per exercise: ExerciseCompletionRow
   - CompletionStatusBadge (✓ / ✗ / ⚪)
   - ReasonTooltip (hover/click)
   - Link do quick preview

6. **Toggle visibility:**
   - useTogglePlanVisibility mutation z optimistic update
   - Rollback on error

7. **Modals:**
   - Reuse DuplicatePlanModal
   - Reuse DeletePlanConfirmationModal

### Faza 6: Wspólne komponenty i modals (2 dni)

1. **ExerciseQuickPreviewModal:**
   - VimeoPlayer component
   - ExerciseMetadataGrid
   - Accordion z description sections
   - Close button

2. **DuplicatePlanModal (complete):**
   - Form z nazwa, client select, visibility
   - Validation
   - Submit logic: create new plan jako copy

3. **DeletePlanConfirmationModal (complete):**
   - Warning design
   - Confirm/Cancel
   - Loading state

4. **Unsaved changes warning:**
   - useUnsavedChangesWarning hook
   - Browser confirm dialog
   - In-app modal (optional)

### Faza 7: Integracja z API i hooki (1-2 dni)

1. **Custom hooks:**
   - `useTrainerPlans(query)` - lista z filtrowaniem
   - `usePlan(id)` - szczegóły planu
   - `usePlanCompletion(planId)` - completion records
   - `useCreatePlan()` - mutation
   - `useUpdatePlan()` - mutation
   - `useDeletePlan()` - mutation
   - `useTogglePlanVisibility()` - mutation z optimistic update

2. **API client funkcje:**
   - Wszystkie z sekcji 7
   - Error handling i retry logic

3. **Query invalidation:**
   - Konfiguracja invalidation rules w mutations
   - Refresh list po create/update/delete
   - Refresh detail po update

### Faza 8: Responsywność i mobile (1-2 dni)

1. **Responsive breakpoints:**
   - Test na 3 breakpoints: mobile (<768px), tablet (768-1023px), desktop (>1024px)

2. **Mobile-specific:**
   - PlanCards zamiast PlansTable
   - Stack filters vertically
   - Full-screen modals na małych ekranach
   - Touch-friendly drag-and-drop
   - Sticky form actions na mobile

3. **useMediaQuery hook:**
   - Implementuj hook
   - Conditional rendering Table vs Cards

### Faza 9: Accessibility i UX polish (1-2 dni)

1. **Accessibility audit:**
   - ARIA labels wszystkie interactive elements
   - ARIA live regions dla dynamic updates (drag-drop, toasts)
   - Focus management w modals (focus trap)
   - Keyboard navigation: wszystkie akcje dostępne z klawiatury
   - Screen reader testing z NVDA/VoiceOver

2. **Keyboard shortcuts:**
   - Tab navigation
   - Enter to submit forms
   - Escape to close modals
   - Drag-and-drop: Space+Arrow keys

3. **Focus indicators:**
   - Visible focus rings (outline)
   - :focus-visible dla lepszego UX

4. **Error messages:**
   - Clear, user-friendly messages
   - Help text z przykładami

5. **Loading states refinement:**
   - Skeletons matching content structure
   - Smooth transitions
   - keepPreviousData dla pagination

6. **Animations:**
   - Smooth transitions (Tailwind transitions)
   - Respect prefers-reduced-motion

### Faza 10: Testing i bug fixing (2-3 dni)

1. **Manual testing:**
   - Test wszystkie user flows z sekcji 8
   - Test wszystkie error scenarios z sekcji 10
   - Test na różnych przeglądarkach (Chrome, Firefox, Safari)
   - Test na mobile devices (real devices lub emulatory)

2. **Edge cases:**
   - Bardzo długa nazwa planu (truncation)
   - Bardzo długa lista ćwiczeń (50+)
   - Concurrent edits
   - Slow network (throttle)
   - Offline mode

3. **Bug fixing:**
   - Fix wszystkie znalezione bugs
   - Refactor jeśli potrzeba

4. **Performance optimization:**
   - Check bundle size
   - Lazy loading dla modals
   - Debounce/throttle gdzie potrzeba
   - Memo expensive computations

5. **Code review:**
   - Review all components
   - Ensure consistent patterns
   - Check for code duplication

### Faza 11: Dokumentacja i deployment (1 dzień)

1. **Code documentation:**
   - JSDoc comments dla public functions
   - README dla complex components

2. **User documentation:**
   - Update user guide (jeśli istnieje)
   - Screenshots dla docs

3. **Deployment:**
   - Merge do main branch
   - Test na staging environment
   - Deploy to production

## Podsumowanie

Plan obejmuje implementację kompleksowego widoku zarządzania planami treningowymi dla trenerów, realizującego wszystkie wymagania z user stories US-013 do US-016. Implementacja podzielona jest na 11 faz, zajmie około 3-4 tygodni pracy jednego doświadczonego frontend developera.

Kluczowe cechy implementacji:

- Wykorzystanie TanStack Query dla efektywnego zarządzania stanem serwerowym
- Drag-and-drop z @dnd-kit dla intuicyjnego sortowania ćwiczeń
- Pełna walidacja frontend + backend z inline error messages
- Optimistic updates dla lepszego UX (toggle visibility)
- Responsywny design z mobile-first approach
- Accessibility zgodne z WCAG 2.1 AA
- Kompleksowa obsługa błędów i edge cases
- Synchronizacja filtrów z URL dla sharable links i back button support
