# Plan implementacji widoku zarządzania ćwiczeniami

## 1. Przegląd

Widok zarządzania ćwiczeniami umożliwia administratorom pełne zarządzanie biblioteką ćwiczeń w aplikacji MoveWithNat. Obejmuje cztery główne ekrany:

- **Lista ćwiczeń** - przeglądanie z paginacją i wyszukiwaniem
- **Tworzenie ćwiczenia** - formularz dodawania nowego ćwiczenia z podglądem Vimeo
- **Edycja ćwiczenia** - modyfikacja istniejącego ćwiczenia
- **Szczegóły ćwiczenia** - pełny podgląd z odtwarzaczem wideo i metadanymi

Kluczowe funkcjonalności:

- CRUD operations (tylko dla administratorów)
- Integracja z prywatnymi wideo Vimeo
- Walidacja pól z wzorcem tempo (X-X-X lub XXXX lub /)
- Soft delete (ukrycie) i hard delete (trwałe usunięcie)
- Responsive design (tabela → karty na mobile)

## 2. Routing widoku

```
/admin/exercises                    → Lista ćwiczeń (ExercisesListPage)
/admin/exercises/new                → Tworzenie nowego (CreateExercisePage)
/admin/exercises/:id                → Szczegóły ćwiczenia (ExerciseDetailPage)
/admin/exercises/:id/edit           → Edycja ćwiczenia (EditExercisePage)
```

**Middleware:**

- Wszystkie ścieżki wymagają autoryzacji (authenticated user)
- Rola `admin` wymagana dla wszystkich operacji poza odczytem
- RLS enforcement na poziomie Supabase

## 3. Struktura komponentów

```
ExercisesManagement/
├── pages/
│   ├── ExercisesListPage              # Główna lista
│   ├── CreateExercisePage             # Formularz tworzenia
│   ├── EditExercisePage               # Formularz edycji
│   └── ExerciseDetailPage             # Widok szczegółów
│
├── components/
│   ├── ExercisesFilterToolbar         # Search + filtry
│   ├── ExercisesTable                 # Tabela (desktop)
│   ├── ExerciseCards                  # Karty (mobile)
│   ├── ExerciseTableRow               # Wiersz tabeli
│   ├── ExerciseCard                   # Pojedyncza karta
│   ├── ExerciseActionMenu             # Menu akcji (Edit/Delete)
│   ├── ExerciseForm                   # Formularz (Create/Edit)
│   ├── VimeoPreviewWidget             # Live podgląd Vimeo
│   ├── ExerciseQuickPreviewModal      # Modal z quick preview
│   ├── DeleteConfirmationModal        # Potwierdzenie usunięcia
│   └── UsageWarningAlert              # Alert o użyciu w planach
│
└── hooks/
    ├── useExercisesList.ts            # Lista z paginacją
    ├── useExerciseForm.ts             # Zarządzanie formularzem
    ├── useVimeoPreview.ts             # Walidacja Vimeo ID
    └── useDeleteExercise.ts           # Logika usuwania
```

## 4. Szczegóły komponentów

### ExercisesListPage

**Opis:**
Główna strona z listą wszystkich ćwiczeń. Zawiera toolbar z wyszukiwarką, tabelę/karty oraz paginację.

**Główne elementy:**

- `PageHeader` z breadcrumbs i przyciskiem "Dodaj ćwiczenie"
- `ExercisesFilterToolbar` z search input
- `ExercisesTable` (desktop) lub `ExerciseCards` (mobile)
- `Pagination` component
- `ExerciseQuickPreviewModal` (conditional)
- `EmptyState` lub `ErrorState` (conditional)

**Obsługiwane interakcje:**

- Wpisanie tekstu w search (debounced 300ms)
- Kliknięcie paginacji (zmiana strony)
- Kliknięcie wiersza/karty (quick preview)
- Kliknięcie "Dodaj ćwiczenie" (nawigacja do create)
- Kliknięcie Edit w menu (nawigacja do edit)
- Kliknięcie Delete w menu (otwarcie modal)

**Walidacja:**

- Search query: max 100 znaków

**Typy:**

- `ListExercisesQuery` - query parameters
- `PaginatedResponse<ExerciseViewModel>` - response z API
- `ExercisesListState` - lokalny stan

**Props:**
Komponent page - brak propsów (pobiera dane z URL params)

---

### ExercisesFilterToolbar

**Opis:**
Toolbar zawierający pole wyszukiwania i przycisk dodawania nowego ćwiczenia.

**Główne elementy:**

- `Input` (shadcn/ui) z ikoną Search
- `Button` "Dodaj ćwiczenie" (primary variant)
- `Badge` z liczbą aktywnych filtrów (future)

**Obsługiwane interakcje:**

- onChange w search input → debounce → callback
- Kliknięcie przycisku "Dodaj ćwiczenie" → nawigacja

**Walidacja:**

- Brak (walidacja na poziomie rodzica)

**Typy:**

```typescript
interface ExercisesFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  isLoading?: boolean;
}
```

**Props:**

- `search` - aktualna wartość wyszukiwania
- `onSearchChange` - callback przy zmianie
- `onCreateClick` - callback tworzenia
- `isLoading` - czy lista się ładuje (disable input)

---

### ExercisesTable

**Opis:**
Tabela wyświetlająca ćwiczenia na desktopie. Zawiera kolumny: thumbnail, nazwa, tempo, ciężar, data utworzenia, liczba użyć, akcje.

**Główne elementy:**

- `Table` (shadcn/ui) z `TableHeader` i `TableBody`
- Wiele `ExerciseTableRow` components
- `TableSkeleton` (loading state)

**Obsługiwane interakcje:**

- Kliknięcie wiersza → quick preview modal
- Hover → highlight row

**Walidacja:**

- Brak

**Typy:**

```typescript
interface ExercisesTableProps {
  exercises: ExerciseViewModel[];
  isLoading: boolean;
  onRowClick: (exercise: ExerciseViewModel) => void;
  onEdit: (id: string) => void;
  onDelete: (exercise: ExerciseViewModel) => void;
}
```

**Props:**

- `exercises` - tablica ćwiczeń do wyświetlenia
- `isLoading` - czy dane się ładują
- `onRowClick` - callback kliknięcia wiersza
- `onEdit` - callback edycji
- `onDelete` - callback usunięcia

---

### ExerciseTableRow

**Opis:**
Pojedynczy wiersz w tabeli z informacjami o ćwiczeniu.

**Główne elementy:**

- `TableCell` z Vimeo thumbnail (lazy loaded image)
- `TableCell` z nazwą ćwiczenia
- `TableCell` z tempo (lub "—" jeśli brak)
- `TableCell` z ciężarem (lub "—")
- `TableCell` z datą utworzenia (formatowaną)
- `TableCell` z licznikiem użyć
- `TableCell` z `ExerciseActionMenu`

**Obsługiwane interakcje:**

- Kliknięcie wiersza → callback
- Hover → cursor pointer + background change

**Walidacja:**

- Brak

**Typy:**

```typescript
interface ExerciseTableRowProps {
  exercise: ExerciseViewModel;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Props:**

- `exercise` - dane ćwiczenia
- `onClick`, `onEdit`, `onDelete` - callbacks

---

### ExerciseCards

**Opis:**
Grid kart dla mobile/tablet. Alternatywa dla tabeli.

**Główne elementy:**

- Grid container (1 col mobile, 2 cols tablet)
- Wiele `ExerciseCard` components
- `CardSkeleton` (loading)

**Obsługiwane interakcje:**

- Kliknięcie karty → quick preview

**Walidacja:**

- Brak

**Typy:**

```typescript
interface ExerciseCardsProps {
  exercises: ExerciseViewModel[];
  isLoading: boolean;
  onCardClick: (exercise: ExerciseViewModel) => void;
  onEdit: (id: string) => void;
  onDelete: (exercise: ExerciseViewModel) => void;
}
```

**Props:**

- Analogiczne do `ExercisesTable`

---

### ExerciseCard

**Opis:**
Pojedyncza karta wyświetlająca ćwiczenie na mobile.

**Główne elementy:**

- `Card` (shadcn/ui)
- Vimeo thumbnail na górze
- Nazwa ćwiczenia (bold)
- Metadata grid (tempo, ciężar)
- Data utworzenia
- `ExerciseActionMenu` w prawym górnym rogu

**Obsługiwane interakcje:**

- Kliknięcie karty → callback
- Tap → visual feedback

**Walidacja:**

- Brak

**Typy:**

```typescript
interface ExerciseCardProps {
  exercise: ExerciseViewModel;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### ExerciseActionMenu

**Opis:**
Dropdown menu z akcjami dla ćwiczenia (Edit, View Details, Delete).

**Główne elementy:**

- `DropdownMenu` (shadcn/ui)
- Trigger: three-dot icon button
- Menu items: Edit (icon: Pencil), View (icon: Eye), Delete (icon: Trash, destructive)

**Obsługiwane interakcje:**

- Kliknięcie trigger → otwarcie menu
- Kliknięcie item → wywołanie odpowiedniego callback

**Walidacja:**

- Brak

**Typy:**

```typescript
interface ExerciseActionMenuProps {
  exerciseId: string;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}
```

---

### CreateExercisePage

**Opis:**
Strona z formularzem tworzenia nowego ćwiczenia.

**Główne elementy:**

- `PageHeader` z breadcrumbs
- `ExerciseForm` component
- `UnsavedChangesPrompt` (warn przed opuszczeniem)

**Obsługiwane interakcje:**

- Submit formularza → POST API call → nawigacja do detail
- Kliknięcie Cancel → nawigacja do list (z confirmacją jeśli dirty)

**Walidacja:**

- Wszystkie walidacje w `ExerciseForm`

**Typy:**

- `CreateExerciseCommand` - dane do API

**Props:**

- Brak (page component)

---

### EditExercisePage

**Opis:**
Strona edycji istniejącego ćwiczenia.

**Główne elementy:**

- `PageHeader`
- `UsageWarningAlert` (jeśli używane w planach) - conditional
- `ExerciseForm` (pre-populated)
- `UnsavedChangesPrompt`

**Obsługiwane interakcje:**

- Submit → PUT API call → nawigacja do detail
- Cancel → nawigacja wstecz (z confirmacją)

**Walidacja:**

- Jak w Create

**Typy:**

- `ExerciseDto` - istniejące dane (fetch z API)
- `UpdateExerciseCommand` - update payload

**Props:**

- Brak (pobiera ID z URL params)

---

### ExerciseForm

**Opis:**
Multi-section formularz używany zarówno do tworzenia jak i edycji ćwiczenia. Zawiera live preview Vimeo.

**Główne elementy:**
Sekcja 1 - Basic Info:

- `FormField` z `Input` dla nazwy (required)
- `FormField` z `Input` dla Vimeo Token (required)
- `VimeoPreviewWidget` (live preview, debounced)

Sekcja 2 - Description:

- `FormField` z `Textarea` dla celów (optional)
- `FormField` z `Textarea` dla kroków (optional)
- `FormField` z `Textarea` dla wskazówek (optional)
- Info: możliwość markdown w przyszłości

Sekcja 3 - Parameters:

- `FormField` z `Input` dla tempo (optional, pattern validation)
- `FormField` z `Input` typu number dla ciężaru (optional, min: 0)
- Help text z przykładami (tempo: "3-1-3 lub 2020")

Footer:

- `Button` Cancel (variant: outline)
- `Button` Submit (disabled gdy invalid lub submitting)
- Loading spinner w przycisku podczas submit

**Obsługiwane interakcje:**

- Wpisanie tekstu → validation onBlur
- Po pierwszym błędzie → validation onChange
- Zmiana Vimeo Token → debounced preview update
- Submit → validation all fields → API call
- Cancel → check isDirty → confirm → callback

**Walidacja:**
Szczegółowe warunki (zgodnie z CreateExerciseCommandSchema):

1. **name:**
   - Required: "Nazwa jest wymagana"
   - Min 3 chars: "Nazwa musi mieć minimum 3 znaki"
   - Max 100 chars: "Nazwa może mieć maksymalnie 100 znaków"
   - Trim whitespace
   - Async: sprawdzenie unikalności (debounced 500ms)
     - Konflikt: "Ćwiczenie o tej nazwie już istnieje"

2. **vimeoToken:**
   - Required: "Link Vimeo jest wymagany"
   - Min 1 char: "Link Vimeo nie może być pusty"
   - Max 50 chars: "Link Vimeo jest zbyt długi"
   - Trim whitespace
   - Format: alphanumeric/digits (Vimeo ID format)

3. **description (goals, steps, tips):**
   - Optional
   - Max 1000 chars każde: "Opis może mieć maksymalnie 1000 znaków"
   - Trim whitespace

4. **tempo:**
   - Optional
   - Pattern: `/^(\d{4}|\d+-\d+-\d+)$/`
   - Error: "Tempo powinno być w formacie X-X-X (np. 3-1-3) lub XXXX (np. 2020)"

5. **defaultWeight:**
   - Optional
   - Type: number
   - Min: 0 - "Ciężar musi być liczbą dodatnią"

**Typy:**

```typescript
interface ExerciseFormProps {
  exercise?: ExerciseDto; // undefined = create mode
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface ExerciseFormData {
  name: string;
  vimeoToken: string;
  description: string;
  goals: string;
  steps: string;
  tips: string;
  tempo: string;
  defaultWeight: number | null;
}
```

**Props:**

- `exercise` - istniejące dane (dla edit mode)
- `onSubmit` - callback submit z walidowanymi danymi
- `onCancel` - callback anulowania
- `isSubmitting` - czy formularz jest w trakcie wysyłania

---

### VimeoPreviewWidget

**Opis:**
Komponent wyświetlający live preview wideo Vimeo podczas wpisywania ID. Debounced, aby nie robić zbyt wielu requestów.

**Główne elementy:**

- Container (16:9 aspect ratio)
- `ReactPlayer` z Vimeo URL (gdy valid ID)
- Loading spinner (podczas debounce)
- Error state (invalid ID lub błąd ładowania)
- Placeholder (gdy brak ID)

**Obsługiwane interakcje:**

- Automatyczna aktualizacja przy zmianie videoId (debounced 500ms)
- Odtwarzanie wideo (controls enabled)

**Walidacja:**

- Sprawdzenie czy ID jest niepuste
- Walidacja dostępności wideo (catch player errors)

**Typy:**

```typescript
interface VimeoPreviewWidgetProps {
  videoId: string | null;
  className?: string;
}
```

**Props:**

- `videoId` - Vimeo video ID
- `className` - dodatkowe klasy CSS

---

### ExerciseQuickPreviewModal

**Opis:**
Modal z szybkim podglądem ćwiczenia (po kliknięciu wiersza w tabeli).

**Główne elementy:**

- `Dialog` (shadcn/ui)
- Modal header z nazwą ćwiczenia i close button
- Vimeo player (16:9)
- Metadata grid:
  - Tempo (lub "—")
  - Ciężar (lub "—")
  - Data utworzenia
- Footer z przyciskami:
  - "Edytuj" (primary)
  - "Zamknij" (outline)

**Obsługiwane interakcje:**

- Kliknięcie backdrop/ESC → close
- Kliknięcie "Edytuj" → nawigacja do edit
- Kliknięcie close (X) → close

**Walidacja:**

- Brak

**Typy:**

```typescript
interface ExerciseQuickPreviewModalProps {
  exercise: ExerciseViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}
```

**Props:**

- `exercise` - dane ćwiczenia (null = modal zamknięty)
- `isOpen` - czy modal otwarty
- `onClose` - callback zamknięcia
- `onEdit` - callback edycji

---

### DeleteConfirmationModal

**Opis:**
Modal potwierdzający usunięcie ćwiczenia. Wyświetla informację o liczbie planów używających tego ćwiczenia.

**Główne elementy:**

- `Dialog` (destructive variant)
- Icon warning (AlertTriangle)
- Title: "Usuń ćwiczenie"
- Message: "Czy na pewno chcesz usunąć ćwiczenie '[nazwa]'?"
- Usage info (jeśli > 0):
  - "To ćwiczenie jest używane w X planach treningowych."
  - "Po usunięciu będzie ukryte i niedostępne przy tworzeniu nowych planów."
- Checkbox "Usuń permanentnie" (disabled jeśli usageCount > 0)
  - Help text: "Trwałe usunięcie możliwe tylko dla nieużywanych ćwiczeń"
- Footer buttons:
  - "Anuluj" (outline)
  - "Usuń" (destructive, loading state)

**Obsługiwane interakcje:**

- Zmiana checkbox → toggle hard delete
- Kliknięcie "Usuń" → API call DELETE → close → callback
- Kliknięcie "Anuluj" → close

**Walidacja:**

- Hard delete disabled jeśli usageCount > 0

**Typy:**

```typescript
interface DeleteConfirmationModalProps {
  exercise: ExerciseViewModel | null;
  isOpen: boolean;
  onConfirm: (exerciseId: string, hard: boolean) => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}
```

**Props:**

- `exercise` - dane ćwiczenia do usunięcia
- `isOpen` - czy modal otwarty
- `onConfirm` - callback potwierdzenia (z flagą hard)
- `onCancel` - callback anulowania
- `isDeleting` - czy w trakcie usuwania

---

### UsageWarningAlert

**Opis:**
Alert wyświetlany na stronie edycji, gdy ćwiczenie jest używane w aktywnych planach.

**Główne elementy:**

- `Alert` (shadcn/ui, variant: warning)
- Icon: AlertCircle
- Title: "To ćwiczenie jest używane w planach"
- Description: "Zmiany w tym ćwiczeniu wpłyną na X planów treningowych."

**Obsługiwane interakcje:**

- Brak (informacyjny)

**Walidacja:**

- Brak

**Typy:**

```typescript
interface UsageWarningAlertProps {
  usageCount: number;
}
```

**Props:**

- `usageCount` - liczba planów używających ćwiczenia

---

### ExerciseDetailPage

**Opis:**
Strona ze szczegółowym podglądem ćwiczenia, w tym odtwarzaczem wideo i wszystkimi metadanymi.

**Główne elementy:**

- `PageHeader` z breadcrumbs i action buttons (Edit, Delete menu)
- `ExerciseDetailHeader` - nazwa ćwiczenia (h1)
- `VideoSection`:
  - Vimeo player (16:9, responsive)
- `DescriptionSection` (Accordion):
  - Cele (expandable)
  - Kroki wykonania (expandable)
  - Wskazówki (expandable)
- `MetadataSection` (grid):
  - Tempo
  - Domyślny ciężar
  - Data utworzenia
  - Ostatnia edycja
- `UsageStatsSection`:
  - Liczba planów używających
  - Collapsible lista planów (z linkami)

**Obsługiwane interakcje:**

- Kliknięcie "Edytuj" → nawigacja do edit
- Kliknięcie "Usuń" w menu → otwarcie delete modal
- Rozwijanie sekcji accordion
- Kliknięcie planu w liście → nawigacja do planu

**Walidacja:**

- Brak (read-only)

**Typy:**

- `ExerciseDto` - dane ćwiczenia z API
- `ExerciseViewModel` - rozszerzone o usageCount

**Props:**

- Brak (page component, ID z URL)

## 5. Typy

### Istniejące typy (z src/types.ts)

```typescript
// DTO podstawowe
interface ExerciseDto {
  id: string;
  name: string;
  description: string | null;
  vimeoToken: string;
  defaultWeight: number | null;
  isHidden: boolean;
}

interface ExerciseSummaryDto {
  id: string;
  name: string;
  defaultWeight: number | null;
}

// Commands
interface CreateExerciseCommand {
  name: string;
  description?: string;
  vimeoToken: string;
  defaultWeight?: number;
}

type UpdateExerciseCommand = Partial<CreateExerciseCommand>;

// Query
interface ListExercisesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// Response
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMetaDto;
}

interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
}
```

### Nowe typy do dodania

```typescript
// src/types.ts - dodać na końcu pliku

/**
 * Extended ExerciseDto z dodatkowymi polami UI
 */
export interface ExerciseViewModel extends ExerciseDto {
  /**
   * Liczba planów treningowych używających tego ćwiczenia
   */
  usageCount?: number;

  /**
   * URL thumbnail z Vimeo (opcjonalne, może być generowane z vimeoToken)
   */
  thumbnailUrl?: string;
}

/**
 * State dla listy ćwiczeń
 */
export interface ExercisesListState {
  exercises: ExerciseViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMetaDto;
  searchQuery: string;
}

/**
 * State dla formularza ćwiczenia
 */
export interface ExerciseFormState {
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean;
}

/**
 * Dane formularza ćwiczenia (rozszerzone o podzielone pola opisu)
 */
export interface ExerciseFormData {
  name: string;
  vimeoToken: string;
  goals: string;
  steps: string;
  tips: string;
  tempo: string;
  defaultWeight: number | null;
}

/**
 * State dla Vimeo preview
 */
export interface VimeoPreviewState {
  isLoading: boolean;
  error: string | null;
  isValid: boolean | null;
}

/**
 * Props dla ExerciseActionMenu
 */
export interface ExerciseActionMenuProps {
  exerciseId: string;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

/**
 * Props dla DeleteConfirmationModal
 */
export interface DeleteConfirmationModalProps {
  exercise: ExerciseViewModel | null;
  isOpen: boolean;
  onConfirm: (exerciseId: string, hard: boolean) => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * Props dla ExerciseQuickPreviewModal
 */
export interface ExerciseQuickPreviewModalProps {
  exercise: ExerciseViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}
```

### Zod Schemas dla walidacji

```typescript
// src/lib/validation.ts - dodać schematy

import { z } from "zod";

/**
 * Schema walidacji dla formularza ćwiczenia
 */
export const ExerciseFormSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć minimum 3 znaki").max(100, "Nazwa może mieć maksymalnie 100 znaków").trim(),

  vimeoToken: z.string().min(1, "Link Vimeo jest wymagany").max(50, "Link Vimeo jest zbyt długi").trim(),

  goals: z.string().max(1000, "Cele mogą mieć maksymalnie 1000 znaków").trim().optional().default(""),

  steps: z.string().max(1000, "Kroki mogą mieć maksymalnie 1000 znaków").trim().optional().default(""),

  tips: z.string().max(1000, "Wskazówki mogą mieć maksymalnie 1000 znaków").trim().optional().default(""),

  tempo: z
    .string()
    .regex(/^(\d{4}|\d+-\d+-\d+)$/, "Tempo powinno być w formacie X-X-X (np. 3-1-3) lub XXXX (np. 2020)")
    .optional()
    .default(""),

  defaultWeight: z.number().min(0, "Ciężar musi być liczbą dodatnią").nullable().optional(),
});

/**
 * Schema dla query parametrów listy
 */
export const ListExercisesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
```

## 6. Zarządzanie stanem

### TanStack Query (React Query) - server state

Użycie TanStack Query do zarządzania stanem serwera (fetching, caching, synchronization).

**Query keys strategy:**

```typescript
// src/hooks/queryKeys.ts
export const exerciseKeys = {
  all: ["exercises"] as const,
  lists: () => [...exerciseKeys.all, "list"] as const,
  list: (query: ListExercisesQuery) => [...exerciseKeys.lists(), query] as const,
  details: () => [...exerciseKeys.all, "detail"] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
};
```

### Custom hooks

#### useExercisesList

```typescript
// src/hooks/useExercisesList.ts
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useDebounce } from "./useDebounce";
import { exerciseKeys } from "./queryKeys";
import type { ListExercisesQuery, PaginatedResponse, ExerciseViewModel } from "../types";

export function useExercisesList(initialQuery?: Partial<ListExercisesQuery>) {
  const [search, setSearch] = useState(initialQuery?.search || "");
  const [page, setPage] = useState(initialQuery?.page || 1);
  const limit = initialQuery?.limit || 20;

  // Debounce search query
  const debouncedSearch = useDebounce(search, 300);

  // Build query object
  const query: ListExercisesQuery = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [debouncedSearch, page, limit]
  );

  // Fetch exercises
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: exerciseKeys.list(query),
    queryFn: () => fetchExercises(query),
    keepPreviousData: true, // Smooth pagination
  });

  return {
    exercises: data?.data || [],
    pagination: data?.meta,
    isLoading,
    error,
    search,
    setSearch,
    page,
    setPage,
    refetch,
  };
}

// API call
async function fetchExercises(query: ListExercisesQuery): Promise<PaginatedResponse<ExerciseViewModel>> {
  const params = new URLSearchParams();
  if (query.search) params.append("search", query.search);
  params.append("page", query.page?.toString() || "1");
  params.append("limit", query.limit?.toString() || "20");

  const response = await fetch(`/api/exercises?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch exercises");
  }

  return response.json();
}
```

#### useExercise

```typescript
// src/hooks/useExercise.ts
import { useQuery } from "@tanstack/react-query";
import { exerciseKeys } from "./queryKeys";
import type { ExerciseViewModel } from "../types";

export function useExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: exerciseKeys.detail(exerciseId!),
    queryFn: () => fetchExercise(exerciseId!),
    enabled: !!exerciseId, // Only fetch if ID exists
  });
}

async function fetchExercise(id: string): Promise<ExerciseViewModel> {
  const response = await fetch(`/api/exercises/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Exercise not found");
    }
    throw new Error("Failed to fetch exercise");
  }

  return response.json();
}
```

#### useCreateExercise

```typescript
// src/hooks/useCreateExercise.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exerciseKeys } from "./queryKeys";
import type { CreateExerciseCommand, ExerciseDto } from "../types";

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateExerciseCommand) => createExercise(command),
    onSuccess: (data) => {
      // Invalidate list queries
      queryClient.invalidateQueries(exerciseKeys.lists());

      // Show success toast
      toast.success("Ćwiczenie utworzone pomyślnie");

      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się utworzyć ćwiczenia");
    },
  });
}

async function createExercise(command: CreateExerciseCommand): Promise<ExerciseDto> {
  const response = await fetch("/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create exercise");
  }

  return response.json();
}
```

#### useUpdateExercise

```typescript
// src/hooks/useUpdateExercise.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exerciseKeys } from "./queryKeys";
import type { UpdateExerciseCommand, ExerciseDto } from "../types";

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, command }: { id: string; command: UpdateExerciseCommand }) => updateExercise(id, command),
    onSuccess: (data, variables) => {
      // Invalidate specific exercise and lists
      queryClient.invalidateQueries(exerciseKeys.detail(variables.id));
      queryClient.invalidateQueries(exerciseKeys.lists());

      toast.success("Ćwiczenie zaktualizowane pomyślnie");

      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować ćwiczenia");
    },
  });
}

async function updateExercise(id: string, command: UpdateExerciseCommand): Promise<ExerciseDto> {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update exercise");
  }

  return response.json();
}
```

#### useDeleteExercise

```typescript
// src/hooks/useDeleteExercise.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exerciseKeys } from "./queryKeys";

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard: boolean }) => deleteExercise(id, hard),
    onSuccess: (_, variables) => {
      // Invalidate lists (exercise removed/hidden)
      queryClient.invalidateQueries(exerciseKeys.lists());

      // Remove from cache
      queryClient.removeQueries(exerciseKeys.detail(variables.id));

      const message = variables.hard ? "Ćwiczenie usunięte trwale" : "Ćwiczenie ukryte pomyślnie";
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć ćwiczenia");
    },
  });
}

async function deleteExercise(id: string, hard: boolean): Promise<void> {
  const url = `/api/exercises/${id}${hard ? "?hard=true" : ""}`;
  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete exercise");
  }
}
```

#### useVimeoPreview

```typescript
// src/hooks/useVimeoPreview.ts
import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";

export function useVimeoPreview(videoId: string | null) {
  const debouncedVideoId = useDebounce(videoId, 500);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!debouncedVideoId) {
      setIsValid(null);
      return;
    }

    setIsLoading(true);

    // Simple validation: check if ID is not empty
    // More advanced: could check Vimeo API (requires API key)
    const isValidFormat = /^[a-zA-Z0-9]+$/.test(debouncedVideoId);
    setIsValid(isValidFormat);
    setIsLoading(false);
  }, [debouncedVideoId]);

  return {
    isValid,
    isLoading: videoId !== debouncedVideoId || isLoading,
  };
}
```

#### useDebounce (utility)

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Local state (useState)

Prosty stan lokalny w komponentach:

- Modal visibility (isOpen)
- Selected exercise for preview/delete
- Form dirty state (z React Hook Form)

## 7. Integracja API

### Endpoints i typy żądań/odpowiedzi

#### 1. GET /api/exercises - Lista ćwiczeń

**Request:**

```typescript
// Query parameters
interface ListExercisesQuery {
  search?: string; // Case-insensitive search by name
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
}

// Example URL: /api/exercises?search=squat&page=1&limit=20
```

**Response:**

```typescript
interface PaginatedResponse<ExerciseDto> {
  data: ExerciseDto[];
  meta: {
    total: number; // Total count
    page: number; // Current page
    limit: number; // Items per page
  };
}

// ExerciseDto structure
interface ExerciseDto {
  id: string;
  name: string;
  description: string | null;
  vimeoToken: string;
  defaultWeight: number | null;
  isHidden: boolean;
}
```

**Error responses:**

- 401: Unauthorized (not authenticated)
- 500: Server error

---

#### 2. GET /api/exercises/:id - Pojedyncze ćwiczenie

**Request:**

```typescript
// Path parameter
id: string; // UUID

// Example URL: /api/exercises/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

```typescript
// Same as ExerciseDto
interface ExerciseDto {
  id: string;
  name: string;
  description: string | null;
  vimeoToken: string;
  defaultWeight: number | null;
  isHidden: boolean;
}
```

**Error responses:**

- 401: Unauthorized
- 404: Exercise not found (or hidden for non-admins)
- 500: Server error

---

#### 3. POST /api/exercises - Tworzenie ćwiczenia

**Request:**

```typescript
interface CreateExerciseCommand {
  name: string;              // Required, min 3, max 100 chars
  description?: string;      // Optional, max 1000 chars
  vimeoToken: string;        // Required, max 50 chars
  defaultWeight?: number;    // Optional, min 0
}

// Example body:
{
  "name": "Barbell Squat",
  "description": "Goals: Build leg strength\nSteps: ...\nTips: ...",
  "vimeoToken": "123456789",
  "defaultWeight": 60
}
```

**Response:**

```typescript
// Created exercise
interface ExerciseDto {
  id: string; // Generated UUID
  name: string;
  description: string | null;
  vimeoToken: string;
  defaultWeight: number | null;
  isHidden: boolean; // Always false for new exercises
}

// Status: 201 Created
```

**Error responses:**

- 400: Validation error
  ```typescript
  {
    "message": "Validation failed",
    "errors": {
      "name": "Name is required",
      "vimeoToken": "Vimeo token must be at least 1 character"
    }
  }
  ```
- 401: Unauthorized
- 403: Forbidden (not admin)
- 409: Conflict (duplicate name)
  ```typescript
  {
    "message": "Exercise with this name already exists"
  }
  ```
- 500: Server error

---

#### 4. PUT /api/exercises/:id - Aktualizacja ćwiczenia

**Request:**

```typescript
// Path parameter
id: string; // UUID

interface UpdateExerciseCommand {
  name?: string;             // Optional, min 3, max 100 chars
  description?: string;      // Optional, max 1000 chars
  vimeoToken?: string;       // Optional, max 50 chars
  defaultWeight?: number;    // Optional, min 0
}

// At least one field must be provided
// Example body:
{
  "name": "Updated Barbell Squat",
  "defaultWeight": 65
}
```

**Response:**

```typescript
// Updated exercise
interface ExerciseDto {
  id: string;
  name: string;
  description: string | null;
  vimeoToken: string;
  defaultWeight: number | null;
  isHidden: boolean;
}

// Status: 200 OK
```

**Error responses:**

- 400: Validation error (same structure as POST)
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Exercise not found
- 409: Conflict (duplicate name)
- 500: Server error

---

#### 5. DELETE /api/exercises/:id - Usunięcie ćwiczenia

**Request:**

```typescript
// Path parameter
id: string; // UUID

// Query parameter (optional)
hard?: boolean; // Default: false (soft delete)

// Example URLs:
// Soft delete: DELETE /api/exercises/123e4567-e89b-12d3-a456-426614174000
// Hard delete: DELETE /api/exercises/123e4567-e89b-12d3-a456-426614174000?hard=true
```

**Response:**

```typescript
// No content
// Status: 204 No Content
```

**Error responses:**

- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Exercise not found
- 409: Conflict (used in plans - only for hard delete)
  ```typescript
  {
    "message": "Cannot delete exercise that is used in plans"
  }
  ```
- 500: Server error

---

### Przykłady wywołań z fetch

```typescript
// GET /api/exercises
const response = await fetch("/api/exercises?search=squat&page=1&limit=20");
const data: PaginatedResponse<ExerciseDto> = await response.json();

// GET /api/exercises/:id
const response = await fetch(`/api/exercises/${id}`);
const exercise: ExerciseDto = await response.json();

// POST /api/exercises
const response = await fetch("/api/exercises", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Barbell Squat",
    vimeoToken: "123456789",
    defaultWeight: 60,
  }),
});
const created: ExerciseDto = await response.json();

// PUT /api/exercises/:id
const response = await fetch(`/api/exercises/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Updated Name",
    defaultWeight: 70,
  }),
});
const updated: ExerciseDto = await response.json();

// DELETE /api/exercises/:id (soft)
await fetch(`/api/exercises/${id}`, { method: "DELETE" });

// DELETE /api/exercises/:id (hard)
await fetch(`/api/exercises/${id}?hard=true`, { method: "DELETE" });
```

## 8. Interakcje użytkownika

### Lista ćwiczeń (ExercisesListPage)

1. **Wpisanie tekstu w wyszukiwarkę:**
   - Użytkownik wpisuje tekst w input
   - Debounce 300ms
   - Trigger: fetch z nowym query parameter `search`
   - Wynik: Lista filtrowana po nazwie (case-insensitive)
   - Loading state: pokazanie skeleton podczas ładowania
   - Empty state: "Nie znaleziono ćwiczeń" jeśli brak wyników

2. **Kliknięcie przycisku paginacji:**
   - Użytkownik klika "Następna strona" lub numer strony
   - Trigger: fetch z nowym query parameter `page`
   - Wynik: Lista z następnej strony
   - Keep previous data during fetch (smooth transition)
   - Scroll to top po zmianie strony

3. **Kliknięcie "Dodaj ćwiczenie":**
   - Trigger: nawigacja do `/admin/exercises/new`
   - Wynik: Otwarcie formularza tworzenia

4. **Kliknięcie wiersza tabeli:**
   - Trigger: otwarcie ExerciseQuickPreviewModal
   - Wynik: Modal z podglądem wideo i podstawowymi info
   - Focus trap w modalu

5. **Kliknięcie "Edit" w action menu:**
   - Trigger: nawigacja do `/admin/exercises/:id/edit`
   - Wynik: Otwarcie formularza edycji z pre-populated danymi

6. **Kliknięcie "Delete" w action menu:**
   - Trigger: otwarcie DeleteConfirmationModal
   - Wynik: Modal z pytaniem o potwierdzenie
   - Pokazanie info o użyciu w planach

### Formularz (Create/Edit)

7. **Wypełnianie pola nazwa:**
   - Użytkownik wpisuje tekst
   - Validation onBlur: sprawdzenie min/max length
   - Po pierwszym błędzie: validation onChange
   - Async validation (debounced 500ms): sprawdzenie unikalności
   - Wynik: pokazanie errora jeśli invalid

8. **Wypełnianie Vimeo Token:**
   - Użytkownik wpisuje ID wideo
   - Debounce 500ms
   - Trigger: useVimeoPreview hook
   - Wynik: aktualizacja VimeoPreviewWidget
   - Pokazanie loading spinner podczas debounce
   - Pokazanie wideo jeśli valid ID
   - Pokazanie errora jeśli invalid

9. **Wypełnianie pola tempo:**
   - Użytkownik wpisuje tempo
   - Validation onBlur: sprawdzenie pattern
   - Wynik: error message jeśli niepoprawny format
   - Help text: "Format: X-X-X (np. 3-1-3) lub XXXX (np. 2020)"

10. **Kliknięcie "Zapisz":**
    - Trigger: validation all fields
    - Jeśli invalid: focus pierwszego pola z błędem, pokazanie errorów
    - Jeśli valid: POST/PUT request
    - Loading state: disabled button, spinner
    - Success: toast, invalidate queries, nawigacja do detail/list
    - Error: toast z komunikatem, zachowanie danych formularza

11. **Kliknięcie "Anuluj":**
    - Sprawdzenie isDirty (React Hook Form)
    - Jeśli dirty: pokazanie browser confirmation "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
    - Jeśli confirm lub not dirty: nawigacja wstecz

12. **Próba opuszczenia strony (browser back/refresh):**
    - BeforeUnload event
    - Jeśli isDirty: browser confirmation dialog
    - Wynik: pozostanie na stronie lub opuszczenie (utrata zmian)

### Szczegóły ćwiczenia

13. **Otwarcie strony szczegółów:**
    - Trigger: fetch exercise data
    - Loading: skeleton layout
    - Success: wyświetlenie wszystkich danych
    - Error: 404 page lub error state

14. **Kliknięcie "Edytuj":**
    - Nawigacja do edit page

15. **Rozwinięcie sekcji accordion:**
    - Toggle: pokazanie/ukrycie treści (goals/steps/tips)
    - Smooth animation

16. **Kliknięcie planu w UsageStatsSection:**
    - Nawigacja do szczegółów planu

### Modal usuwania

17. **Zmiana checkbox "Usuń permanentnie":**
    - Toggle hard delete flag
    - Disabled jeśli usageCount > 0
    - Tooltip: "Trwałe usunięcie możliwe tylko dla nieużywanych ćwiczeń"

18. **Kliknięcie "Usuń" w modalu:**
    - Trigger: DELETE API call (z flagą hard)
    - Loading: disabled buttons, spinner w przycisku "Usuń"
    - Success: toast, close modal, invalidate queries, nawigacja do list
    - Error: toast z błędem (np. "Nie można usunąć ćwiczenia używanego w planach")

19. **Kliknięcie "Anuluj" lub backdrop:**
    - Close modal
    - Brak zmian w danych

## 9. Warunki i walidacja

### Warunki weryfikowane na poziomie UI

#### 1. FormField: name

**Komponenty:** CreateExerciseForm, EditExerciseForm

**Warunki:**

- **Required:** nie może być puste
- **Min length:** minimum 3 znaki
- **Max length:** maksimum 100 znaków
- **Trim:** usunięcie whitespace z początku i końca
- **Uniqueness:** nazwa musi być unikalna (async validation)

**Wpływ na UI:**

- Invalid → czerwony border, error message pod polem
- Async validating → spinner obok pola
- Valid → zielony checkmark (optional)
- Error focus: auto-focus pierwszego błędnego pola przy submit

**Komunikaty błędów:**

- Puste: "Nazwa jest wymagana"
- < 3 znaki: "Nazwa musi mieć minimum 3 znaki"
- > 100 znaków: "Nazwa może mieć maksymalnie 100 znaków"
- Duplicate: "Ćwiczenie o tej nazwie już istnieje"

---

#### 2. FormField: vimeoToken

**Komponenty:** CreateExerciseForm, EditExerciseForm, VimeoPreviewWidget

**Warunki:**

- **Required:** nie może być puste
- **Min length:** minimum 1 znak
- **Max length:** maksimum 50 znaków
- **Trim:** usunięcie whitespace
- **Format:** alfanumeryczne znaki (Vimeo ID format)

**Wpływ na UI:**

- Invalid → error message + invalid preview state
- Valid → live preview wideo (debounced 500ms)
- Loading preview → spinner w VimeoPreviewWidget
- Invalid video → error state w preview: "Nie można załadować podglądu wideo"

**Komunikaty błędów:**

- Puste: "Link Vimeo jest wymagany"
- > 50 znaków: "Link Vimeo jest zbyt długi"
- Invalid format: (handled by VimeoPreviewWidget error state)

---

#### 3. FormField: description (goals, steps, tips)

**Komponenty:** CreateExerciseForm, EditExerciseForm

**Warunki:**

- **Optional:** może być puste
- **Max length:** maksimum 1000 znaków każde
- **Trim:** usunięcie whitespace

**Wpływ na UI:**

- Invalid (> 1000 chars) → error message
- Character counter (optional): "X / 1000"
- Warning przy 90%: pomarańczowy kolor licznika

**Komunikaty błędów:**

- > 1000 znaków: "Opis może mieć maksymalnie 1000 znaków"

---

#### 4. FormField: tempo

**Komponenty:** CreateExerciseForm, EditExerciseForm

**Warunki:**

- **Optional:** może być puste
- **Pattern:** `/^(\d{4}|\d+-\d+-\d+)$/`
  - Format 1: 4 cyfry (np. "2020")
  - Format 2: X-X-X gdzie X to cyfry (np. "3-1-3")

**Wpływ na UI:**

- Invalid → error message
- Help text zawsze widoczny: "Format: X-X-X (np. 3-1-3) lub XXXX (np. 2020)"
- Valid → brak wizualnej zmiany (optional checkmark)

**Komunikaty błędów:**

- Invalid pattern: "Tempo powinno być w formacie X-X-X (np. 3-1-3) lub XXXX (np. 2020)"

---

#### 5. FormField: defaultWeight

**Komponenty:** CreateExerciseForm, EditExerciseForm

**Warunki:**

- **Optional:** może być puste (null)
- **Type:** number
- **Min value:** 0 (nie może być ujemne)

**Wpływ na UI:**

- Invalid (< 0) → error message
- Type mismatch → prevented by input type="number"
- Empty → null value (allowed)

**Komunikaty błędów:**

- < 0: "Ciężar musi być liczbą dodatnią"
- Not a number: "Podaj prawidłową liczbę"

---

#### 6. FormField: isDirty (całego formularza)

**Komponenty:** CreateExerciseForm, EditExerciseForm, UnsavedChangesPrompt

**Warunki:**

- **Dirty:** użytkownik wprowadził zmiany w formularzu
- **Pristine:** formularz nie został zmieniony

**Wpływ na UI:**

- Dirty + próba opuszczenia strony → browser confirmation dialog
- Dirty + kliknięcie Cancel → in-app confirmation (optional)
- Pristine → brak ostrzeżenia, swobodna nawigacja

**Komunikaty:**

- BeforeUnload: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"

---

#### 7. DeleteConfirmationModal: hard delete option

**Komponenty:** DeleteConfirmationModal

**Warunki:**

- **Enabled:** usageCount === 0 (ćwiczenie nieużywane w planach)
- **Disabled:** usageCount > 0 (ćwiczenie używane)

**Wpływ na UI:**

- usageCount > 0 → checkbox "Usuń permanentnie" disabled
- Tooltip: "Trwałe usunięcie możliwe tylko dla nieużywanych ćwiczeń"
- usageCount === 0 → checkbox enabled
- Warning message: "To ćwiczenie jest używane w X planach..."

---

#### 8. ExercisesFilterToolbar: search length

**Komponenty:** ExercisesFilterToolbar

**Warunki:**

- **Max length:** 100 znaków

**Wpływ na UI:**

- > 100 znaków → prevented by maxLength attribute
- Debounce 300ms → delay przed fetch

---

#### 9. Pagination: valid page range

**Komponenty:** Pagination

**Warunki:**

- **Min page:** 1
- **Max page:** Math.ceil(total / limit)

**Wpływ na UI:**

- page === 1 → "Poprzednia" button disabled
- page === maxPage → "Następna" button disabled
- Invalid page (z URL) → redirect to page 1

---

#### 10. Authorization: admin role

**Komponenty:** Wszystkie (middleware level)

**Warunki:**

- **Create/Update/Delete:** tylko admin
- **Read:** wszyscy authenticated users

**Wpływ na UI:**

- Non-admin → redirect z /admin/exercises/new, /edit
- Non-admin → hide "Dodaj ćwiczenie", Edit, Delete buttons
- 403 error → error page: "Nie masz uprawnień"

## 10. Obsługa błędów

### 1. Network errors

**Scenariusz:** Brak połączenia z internetem, timeout

**Obsługa:**

- Catch w TanStack Query error handler
- Toast: "Błąd połączenia. Sprawdź internet i spróbuj ponownie."
- Error state component z przyciskiem "Spróbuj ponownie"
- Retry button → refetch query

**Komponenty:** wszystkie z fetch

---

### 2. Validation errors (400)

**Scenariusz:** Backend zwraca błędy walidacji

**Response format:**

```typescript
{
  "message": "Validation failed",
  "errors": {
    "name": "Name must be at least 3 characters",
    "vimeoToken": "Vimeo token is required"
  }
}
```

**Obsługa:**

- Parse error response
- Mapowanie errorów na pola formularza (React Hook Form `setError`)
- Pokazanie field-level errors
- Auto-focus pierwszego pola z błędem
- Toast (optional): "Popraw błędy w formularzu"

**Komponenty:** ExerciseForm (Create/Edit)

---

### 3. Unauthorized (401)

**Scenariusz:** Użytkownik niezalogowany lub sesja wygasła

**Obsługa:**

- Redirect do `/login`
- Save intended destination w localStorage (return URL)
- Toast: "Sesja wygasła. Zaloguj się ponownie."
- Po zalogowaniu: redirect do saved URL

**Komponenty:** wszystkie protected routes

---

### 4. Forbidden (403)

**Scenariusz:** Użytkownik nie ma uprawnień (np. trainer próbuje utworzyć ćwiczenie)

**Obsługa:**

- Toast error: "Nie masz uprawnień do tej akcji"
- Redirect do dashboard (role-based)
- Log error dla debugging

**Komponenty:** Create/Edit/Delete operations

---

### 5. Not Found (404)

**Scenariusz:** Ćwiczenie nie istnieje lub zostało usunięte

**Obsługa:**

- ExerciseDetailPage: 404 error state
  - Message: "Ćwiczenie nie zostało znalezione"
  - Suggestion: "Mogło zostać usunięte. Wróć do listy ćwiczeń."
  - Button: "Wróć do listy"
- Lista: remove exercise z cache (stale data)

**Komponenty:** ExerciseDetailPage, EditExercisePage

---

### 6. Conflict - Duplicate name (409)

**Scenariusz:** Próba utworzenia/edycji z nazwą już istniejącą

**Response:**

```typescript
{
  "message": "Exercise with this name already exists"
}
```

**Obsługa:**

- Field-level error na pole "name"
- Message: "Ćwiczenie o tej nazwie już istnieje"
- Focus field "name"
- Keep form values (allow user to correct)

**Komponenty:** ExerciseForm (Create/Edit)

---

### 7. Conflict - Used in plans (409)

**Scenariusz:** Próba hard delete ćwiczenia używanego w planach

**Response:**

```typescript
{
  "message": "Cannot delete exercise that is used in plans"
}
```

**Obsługa:**

- Error message w DeleteConfirmationModal
- Suggestion: "Użyj ukrycia zamiast trwałego usunięcia"
- Disable checkbox "Usuń permanentnie"
- Show usage count prominently

**Komponenty:** DeleteConfirmationModal

---

### 8. Server error (500)

**Scenariusz:** Błąd na backendzie

**Obsługa:**

- Toast error: "Wystąpił błąd serwera. Spróbuj ponownie."
- Log full error details (console.error)
- Error state z retry button
- Nie pokazywać tech details użytkownikowi

**Komponenty:** wszystkie

---

### 9. Vimeo video error

**Scenariusz:** Invalid Vimeo ID, video private/deleted

**Obsługa:**

- VimeoPreviewWidget: error state
  - Message: "Nie można załadować podglądu wideo"
  - Suggestion: "Sprawdź czy ID jest prawidłowe"
- Allow form submission (backend will validate)
- ExerciseDetailPage: fallback UI (show description, hide player)

**Komponenty:** VimeoPreviewWidget, ExerciseDetailPage

---

### 10. Form submission race condition

**Scenariusz:** Użytkownik klika "Zapisz" wielokrotnie (double click)

**Obsługa:**

- Disable submit button po pierwszym kliknięciu
- Show loading spinner w przycisku
- Prevent multiple submissions (isSubmitting flag)
- TanStack Query automatic deduplication

**Komponenty:** ExerciseForm

---

### 11. Stale data

**Scenariusz:** Dane w cache nieaktualne (inne okno/user zmienił ćwiczenie)

**Obsługa:**

- TanStack Query staleTime configuration (np. 5 min)
- Automatic background refetch
- Refetch on window focus (default behavior)
- Manual refetch option (refresh button)

**Komponenty:** wszystkie z TanStack Query

---

### 12. Empty states

**Scenariusz:** Brak ćwiczeń w bazie lub brak wyników wyszukiwania

**Obsługa:**

- EmptyState component:
  - Icon (Dumbbell lub Search)
  - Message: "Nie znaleziono ćwiczeń" lub "Brak ćwiczeń w bibliotece"
  - Suggestion: "Dodaj pierwsze ćwiczenie" (jeśli baza pusta)
  - CTA button: "Dodaj ćwiczenie" (jeśli admin)
- Po wyszukiwaniu:
  - "Nie znaleziono wyników dla '[query]'"
  - Button: "Wyczyść wyszukiwanie"

**Komponenty:** ExercisesListPage

## 11. Kroki implementacji

### Faza 1: Setup i podstawy (2-3h)

1. **Utworzenie struktury katalogów:**

   ```
   src/
   ├── pages/
   │   └── admin/
   │       └── exercises/
   │           ├── index.astro
   │           ├── new.astro
   │           ├── [id].astro
   │           └── [id]/
   │               └── edit.astro
   ├── components/
   │   └── exercises/
   │       ├── ExercisesFilterToolbar.tsx
   │       ├── ExercisesTable.tsx
   │       ├── ExerciseCards.tsx
   │       ├── ExerciseForm.tsx
   │       ├── VimeoPreviewWidget.tsx
   │       ├── ExerciseQuickPreviewModal.tsx
   │       ├── DeleteConfirmationModal.tsx
   │       └── UsageWarningAlert.tsx
   └── hooks/
       ├── exercises/
       │   ├── useExercisesList.ts
       │   ├── useExercise.ts
       │   ├── useCreateExercise.ts
       │   ├── useUpdateExercise.ts
       │   ├── useDeleteExercise.ts
       │   └── useVimeoPreview.ts
       ├── useDebounce.ts
       └── queryKeys.ts
   ```

2. **Dodanie nowych typów do `src/types.ts`:**
   - Skopiować wszystkie typy z sekcji 5 (ExerciseViewModel, ExerciseFormData, etc.)

3. **Dodanie Zod schemas do `src/lib/validation.ts`:**
   - ExerciseFormSchema
   - ListExercisesQuerySchema

4. **Setup TanStack Query w projekcie (jeśli jeszcze nie ma):**
   - Instalacja: `npm install @tanstack/react-query`
   - Setup QueryClientProvider w root layout
   - DevTools (optional): `npm install @tanstack/react-query-devtools`

---

### Faza 2: Custom hooks (3-4h)

5. **Implementacja utility hooks:**
   - `useDebounce.ts` - debounce values
   - `queryKeys.ts` - query key factory

6. **Implementacja data hooks:**
   - `useExercisesList.ts` - lista z paginacją i search
   - `useExercise.ts` - pojedyncze ćwiczenie
   - `useCreateExercise.ts` - mutation tworzenia
   - `useUpdateExercise.ts` - mutation aktualizacji
   - `useDeleteExercise.ts` - mutation usuwania
7. **Implementacja UI hooks:**
   - `useVimeoPreview.ts` - walidacja Vimeo ID

8. **Testowanie hooks:**
   - Testy jednostkowe (optional)
   - Manual testing w komponencie testowym

---

### Faza 3: Komponenty listy (4-5h)

9. **ExercisesListPage (`pages/admin/exercises/index.astro`):**
   - Setup Astro page z AdminLayout
   - Integracja useExercisesList hook
   - URL params sync (search, page)
   - Conditional rendering (loading, error, empty, data)

10. **ExercisesFilterToolbar:**
    - Search input z debounce
    - Button "Dodaj ćwiczenie"
    - Responsive layout

11. **ExercisesTable (desktop):**
    - Table component z sortable headers
    - ExerciseTableRow sub-component
    - Vimeo thumbnail (lazy loaded)
    - ExerciseActionMenu integration
    - Loading skeleton

12. **ExerciseCards (mobile):**
    - Grid layout (responsive)
    - ExerciseCard sub-component
    - Touch-friendly interactions
    - Loading skeleton

13. **Pagination component:**
    - Previous/Next buttons
    - Page numbers (max 7 visible)
    - Info text: "Wyświetlono X-Y z Z"
    - Keyboard navigation

14. **ExerciseActionMenu:**
    - DropdownMenu (shadcn/ui)
    - Three-dot trigger
    - Menu items: Edit, View, Delete
    - Icons z lucide-react

15. **Empty/Error states:**
    - EmptyState component
    - ErrorState component
    - Retry functionality

---

### Faza 4: Modals (2-3h)

16. **ExerciseQuickPreviewModal:**
    - Dialog component (shadcn/ui)
    - VimeoPlayer integration (react-player)
    - Metadata display
    - Edit button → navigation

17. **DeleteConfirmationModal:**
    - Destructive dialog variant
    - Usage count display
    - Checkbox "Usuń permanentnie" (conditional)
    - Delete mutation integration
    - Loading state

---

### Faza 5: Formularze (6-8h)

18. **VimeoPreviewWidget:**
    - ReactPlayer setup
    - 16:9 aspect ratio container
    - Loading/Error/Placeholder states
    - Debounced videoId updates

19. **ExerciseForm (base component):**
    - React Hook Form setup z Zod resolver
    - Multi-section layout:
      - Basic Info section
      - Description section
      - Parameters section
    - Footer z Cancel/Submit buttons

20. **Form fields implementation:**
    - Name input z async validation
    - Vimeo Token input z preview
    - Description textareas (goals, steps, tips)
    - Tempo input z pattern validation + help text
    - DefaultWeight number input

21. **Form validation:**
    - Field-level validation (onBlur)
    - Form-level validation (onSubmit)
    - Error messages display
    - Focus management

22. **Unsaved changes handling:**
    - isDirty detection (React Hook Form)
    - BeforeUnload event listener
    - Browser confirmation dialog

23. **CreateExercisePage (`pages/admin/exercises/new.astro`):**
    - Page layout z AdminLayout
    - ExerciseForm integration (create mode)
    - useCreateExercise mutation
    - Success → navigate to detail
    - Error handling

24. **EditExercisePage (`pages/admin/exercises/[id]/edit.astro`):**
    - Page layout
    - Fetch existing exercise (useExercise)
    - ExerciseForm integration (edit mode, pre-populated)
    - UsageWarningAlert (conditional)
    - useUpdateExercise mutation
    - Success → navigate to detail

---

### Faza 6: Strona szczegółów (3-4h)

25. **ExerciseDetailPage (`pages/admin/exercises/[id].astro`):**
    - Page layout
    - Fetch exercise (useExercise)
    - Loading skeleton

26. **Detail sections:**
    - Header z nazwą + action buttons
    - Video section (VimeoPlayer, 16:9)
    - Description accordion (Radix UI):
      - Goals
      - Steps
      - Tips
    - Metadata grid:
      - Tempo
      - Weight
      - Created at
      - Updated at
    - Usage stats:
      - Count
      - Plans list (collapsible)

27. **Actions integration:**
    - Edit button → navigation
    - Delete button → modal
    - Delete modal integration

---

### Faza 7: Styling i responsive (3-4h)

28. **Desktop styling:**
    - Tailwind classes
    - Consistent spacing
    - Color scheme (zgodny z design system)
    - Hover/focus states

29. **Mobile styling:**
    - Breakpoint adjustments
    - Touch targets (min 44px)
    - Table → Cards transition
    - Modal full-screen on small devices

30. **Dark mode (jeśli wspierany):**
    - Dark mode variants
    - Color adjustments

31. **Accessibility:**
    - ARIA labels
    - Keyboard navigation
    - Focus indicators
    - Screen reader testing

---

### Faza 8: Testing i polish (4-5h)

32. **Manual testing:**
    - Lista: search, pagination, sorting
    - Create: wszystkie pola, walidacja, submit
    - Edit: pre-population, update, validation
    - Delete: soft/hard, confirmation, errors
    - Detail: wszystkie sekcje, navigation

33. **Edge cases:**
    - Empty states
    - Network errors
    - Validation errors
    - Duplicate names
    - Used in plans
    - Invalid Vimeo IDs
    - Very long text
    - Special characters

34. **Performance optimization:**
    - Code splitting (dynamic imports)
    - Image lazy loading
    - Debounce optimization
    - Query caching strategy

35. **Error handling verification:**
    - Wszystkie scenariusze z sekcji 10
    - Toast messages
    - Error states
    - Retry functionality

36. **Polish:**
    - Loading states smooth
    - Animations subtle
    - Transitions consistent
    - Empty states helpful

---

### Faza 9: Documentation i cleanup (1-2h)

37. **Code documentation:**
    - JSDoc comments dla hooks
    - Component prop descriptions
    - Complex logic explanations

38. **README update:**
    - Features list
    - Component structure
    - How to extend

39. **Cleanup:**
    - Remove console.logs
    - Remove unused imports
    - Format code (Prettier)
    - Lint check (ESLint)

40. **Git:**
    - Commit w logicznych częściach
    - Clear commit messages
    - Pull request description

---

### Podsumowanie czasu:

- Faza 1: 2-3h
- Faza 2: 3-4h
- Faza 3: 4-5h
- Faza 4: 2-3h
- Faza 5: 6-8h
- Faza 6: 3-4h
- Faza 7: 3-4h
- Faza 8: 4-5h
- Faza 9: 1-2h

**Total: ~28-38h** (3.5 - 5 dni roboczych)

---

## Uwagi końcowe

### Priorytety:

1. **Must have:** Lista, Create, Edit, Delete, Vimeo preview
2. **Should have:** Quick preview modal, Usage warnings, Pagination
3. **Nice to have:** Advanced filters, Batch operations, Export

### Zależności zewnętrzne:

- react-player (Vimeo)
- @tanstack/react-query
- shadcn/ui components (Dialog, Table, Input, Button, etc.)
- lucide-react (icons)

### Best practices:

- Mobile-first approach
- Accessibility (WCAG 2.1 AA)
- Error handling na każdym poziomie
- Loading states wszędzie
- Consistent naming conventions
- Reusable components

### Potencjalne rozszerzenia (poza MVP):

- Batch operations (multi-select + delete)
- Advanced filters (by usage, by date)
- Export do CSV/PDF
- Exercise categories/tags
- Clone exercise functionality
- Usage analytics (most used exercises)
- Markdown editor dla descriptions
- Video upload (alternative do Vimeo)
