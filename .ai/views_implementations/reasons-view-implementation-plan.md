# Plan Implementacji Widoku: Zarządzanie Powodami Niewykonania Ćwiczeń

## 1. Przegląd

Widok zarządzania powodami niewykonania ćwiczeń (Reasons Management) to interfejs administracyjny umożliwiający administratorom pełne zarządzanie (CRUD) listą standardowych powodów, które podopieczni mogą wybierać podczas oznaczania ćwiczenia jako niewykonanego. Widok prezentuje tabelę z istniejącymi powodami wraz z liczbą użyć każdego powodu oraz umożliwia tworzenie, edycję i usuwanie powodów poprzez modalne okna dialogowe.

## 2. Routing Widoku

**Ścieżka:** `/admin/reasons`

**Dostęp:** Tylko administrator (role === "admin")

**Struktura plików:**
- Strona Astro: `src/pages/admin/reasons/index.astro`
- Główny komponent React: `src/components/admin/reasons/ReasonsListPage.tsx`

## 3. Struktura Komponentów

```
ReasonsListPage (główny kontener)
├── QueryProvider (wrapper dla React Query)
└── ReasonsListContent
    ├── Header Section
    │   ├── Breadcrumb navigation
    │   ├── Tytuł + opis
    │   └── Button "Powrót do Dashboard"
    ├── Toolbar Section
    │   └── Button "Dodaj powód" (primary action)
    ├── ReasonsTable (desktop)
    │   └── ReasonsTableRow (dla każdego powodu)
    │       └── ReasonActionMenu (dropdown z edit/delete)
    ├── ReasonCards (mobile, optional)
    │   └── ReasonCard
    │       └── ReasonActionMenu
    ├── Empty State (gdy brak powodów)
    ├── Loading State (skeleton)
    ├── Error State (komunikat błędu)
    └── Modals
        ├── CreateReasonModal (formularz tworzenia)
        ├── EditReasonModal (formularz edycji)
        └── DeleteReasonModal (potwierdzenie usunięcia)
```

## 4. Szczegóły Komponentów

### 4.1. ReasonsListPage

**Opis:** Główny komponent kontenerowy widoku, odpowiedzialny za zarządzanie stanem globalnym i renderowanie całego interfejsu zarządzania powodami.

**Główne elementy:**
- Wrapper `QueryProvider` dla React Query
- Komponent `ReasonsListContent` z całą logiką

**Obsługiwane zdarzenia:**
- Brak (komponent wrapper)

**Warunki walidacji:**
- Brak

**Typy:**
- Brak propsów

**Propsy:**
```typescript
interface ReasonsListPageProps {}
```

### 4.2. ReasonsListContent

**Opis:** Kontener zawierający całą logikę biznesową widoku, obsługę stanów dla modali, komunikację z API i wyświetlanie odpowiednich komponentów w zależności od stanu danych.

**Główne elementy:**
- Header z breadcrumb, tytułem, opisem i przyciskiem powrotu
- Toolbar z przyciskiem "Dodaj powód"
- Tabela powodów (`ReasonsTable`) lub karty (`ReasonCards` dla mobile)
- Empty state gdy brak danych
- Loading skeleton podczas ładowania
- Error state przy błędach
- Trzy modale: Create, Edit, Delete

**Obsługiwane zdarzenia:**
- `handleCreateClick()` - otwiera modal tworzenia
- `handleEditClick(reason: ReasonViewModel)` - otwiera modal edycji z wybranym powodem
- `handleDeleteClick(reason: ReasonViewModel)` - otwiera modal potwierdzenia usunięcia
- `handleConfirmCreate(data: CreateReasonFormData)` - wywołuje mutację tworzenia
- `handleConfirmEdit(data: UpdateReasonFormData)` - wywołuje mutację edycji
- `handleConfirmDelete(id: string)` - wywołuje mutację usunięcia
- `handleBackToDashboard()` - przekierowanie do `/admin`

**Warunki walidacji:**
- Brak bezpośredniej walidacji (delegowana do formularzy w modalach)

**Typy:**
- `ReasonViewModel` (ViewModel dla wyświetlania)
- `CreateReasonFormData` (formularz tworzenia)
- `UpdateReasonFormData` (formularz edycji)

**Propsy:**
```typescript
interface ReasonsListContentProps {}
```

**Stan lokalny:**
```typescript
const [createModalOpen, setCreateModalOpen] = useState(false);
const [editingReason, setEditingReason] = useState<ReasonViewModel | null>(null);
const [deletingReason, setDeletingReason] = useState<ReasonViewModel | null>(null);
```

**Custom hooki:**
```typescript
const { reasons, isLoading, error } = useReasonsList();
const { mutateAsync: createReason, isPending: isCreating } = useCreateReason();
const { mutateAsync: updateReason, isPending: isUpdating } = useUpdateReason();
const { mutateAsync: deleteReason, isPending: isDeleting } = useDeleteReason();
```

### 4.3. ReasonsTable

**Opis:** Komponent tabelaryczny do wyświetlania listy powodów na desktopie. Wykorzystuje komponenty shadcn/ui (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`).

**Główne elementy:**
- `Table` z `TableHeader` (nagłówki: Kod, Treść, Liczba użyć, Data utworzenia, Akcje)
- `TableBody` z mapowaniem `reasons.map(reason => <ReasonsTableRow />)`
- Loading skeleton (3-5 wierszy)

**Obsługiwane zdarzenia:**
- `onEdit(reason: ReasonViewModel)` - przekazywane z parent
- `onDelete(reason: ReasonViewModel)` - przekazywane z parent

**Warunki walidacji:**
- Brak

**Typy:**
- `ReasonViewModel[]` dla danych wejściowych

**Propsy:**
```typescript
interface ReasonsTableProps {
  reasons: ReasonViewModel[];
  isLoading: boolean;
  onEdit: (reason: ReasonViewModel) => void;
  onDelete: (reason: ReasonViewModel) => void;
}
```

### 4.4. ReasonsTableRow

**Opis:** Komponent pojedynczego wiersza w tabeli powodów, wyświetlający dane powodu oraz menu akcji.

**Główne elementy:**
- `TableRow` z komórkami: `code`, `label`, `usageCount`, `createdAt`, `actions`
- `ReasonActionMenu` w ostatniej kolumnie

**Obsługiwane zdarzenia:**
- `onEdit` - przekazane do `ReasonActionMenu`
- `onDelete` - przekazane do `ReasonActionMenu`

**Warunki walidacji:**
- Brak

**Typy:**
- `ReasonViewModel` dla pojedynczego powodu

**Propsy:**
```typescript
interface ReasonsTableRowProps {
  reason: ReasonViewModel;
  onEdit: (reason: ReasonViewModel) => void;
  onDelete: (reason: ReasonViewModel) => void;
}
```

### 4.5. ReasonActionMenu

**Opis:** Dropdown menu z akcjami dla pojedynczego powodu (Edytuj, Usuń). Wykorzystuje `DropdownMenu` z shadcn/ui.

**Główne elementy:**
- `DropdownMenu` z triggerem (ikona trzech kropek)
- `DropdownMenuContent` z dwoma elementami:
  - "Edytuj" (ikona ołówka)
  - "Usuń" (ikona kosza, czerwony tekst)

**Obsługiwane zdarzenia:**
- `onEdit()` - wywołane po kliknięciu "Edytuj"
- `onDelete()` - wywołane po kliknięciu "Usuń"

**Warunki walidacji:**
- Brak

**Typy:**
- `ReasonViewModel` dla kontekstu

**Propsy:**
```typescript
interface ReasonActionMenuProps {
  reason: ReasonViewModel;
  onEdit: () => void;
  onDelete: () => void;
}
```

### 4.6. CreateReasonModal

**Opis:** Modal z formularzem tworzenia nowego powodu. Wykorzystuje `Dialog` z shadcn/ui oraz `Form` z react-hook-form + zod.

**Główne elementy:**
- `Dialog` z `DialogContent`
- `DialogHeader` z tytułem "Dodaj nowy powód"
- Formularz z dwoma polami:
  - `code` - Input tekstowy (lowercase, alphanumeric + underscore)
  - `label` - Textarea z licznikiem znaków (max 200)
- `DialogFooter` z buttonami:
  - "Anuluj" (variant secondary)
  - "Dodaj powód" (variant primary, disabled gdy isPending lub invalid)

**Obsługiwane zdarzenia:**
- `onSubmit(data: CreateReasonFormData)` - walidacja i wywołanie API
- `onCancel()` - zamknięcie modala i reset formularza

**Warunki walidacji:**
- **code:**
  - Required
  - Min 3 znaki, max 50 znaków
  - Regex: `/^[a-z0-9_]+$/` (lowercase alphanumeric z underscores)
  - Transform: `toLowerCase()`
  - Unikalność sprawdzana po stronie API
- **label:**
  - Required
  - Min 3 znaki, max 200 znaków
  - Transform: `trim()`

**Typy:**
- `CreateReasonFormData` (formularz)
- `CreateReasonCommand` (API request)

**Propsy:**
```typescript
interface CreateReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CreateReasonFormData) => Promise<void>;
  isPending: boolean;
}
```

### 4.7. EditReasonModal

**Opis:** Modal z formularzem edycji istniejącego powodu. Podobny do `CreateReasonModal`, ale z pre-wypełnionymi danymi i opcjonalnymi polami.

**Główne elementy:**
- `Dialog` z `DialogContent`
- `DialogHeader` z tytułem "Edytuj powód"
- Formularz z dwoma polami (pre-wypełnione wartościami z `reason`):
  - `code` - Input tekstowy (opcjonalny, ale walidowany jeśli wypełniony)
  - `label` - Textarea z licznikiem znaków (opcjonalny)
- `DialogFooter` z buttonami:
  - "Anuluj"
  - "Zapisz zmiany" (disabled gdy isPending lub invalid lub brak zmian)

**Obsługiwane zdarzenia:**
- `onSubmit(data: UpdateReasonFormData)` - walidacja i wywołanie API
- `onCancel()` - zamknięcie modala i reset formularza

**Warunki walidacji:**
- **code (optional):**
  - Jeśli podany: min 3, max 50, regex `/^[a-z0-9_]+$/`, transform `toLowerCase()`
  - Unikalność sprawdzana po stronie API
- **label (optional):**
  - Jeśli podany: min 3, max 200, transform `trim()`
- **Ogólne:** Co najmniej jedno pole musi być wypełnione

**Typy:**
- `UpdateReasonFormData` (formularz)
- `UpdateReasonCommand` (API request)
- `ReasonViewModel` (initial values)

**Propsy:**
```typescript
interface EditReasonModalProps {
  reason: ReasonViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: UpdateReasonFormData) => Promise<void>;
  isPending: boolean;
}
```

### 4.8. DeleteReasonModal

**Opis:** Modal z potwierdzeniem usunięcia powodu. Wyświetla informację o liczbie użyć powodu i ostrzeżenie, że nie można usunąć używanego powodu (sprawdzane po stronie API).

**Główne elementy:**
- `AlertDialog` z `AlertDialogContent`
- `AlertDialogHeader`:
  - `AlertDialogTitle`: "Usuń powód?"
  - `AlertDialogDescription`: Opis powodu + informacja o liczbie użyć
- `AlertDialogFooter` z buttonami:
  - "Anuluj"
  - "Usuń" (destructive variant, disabled gdy isPending)

**Obsługiwane zdarzenia:**
- `onConfirm(id: string)` - wywołanie API usunięcia
- `onCancel()` - zamknięcie modala

**Warunki walidacji:**
- Brak (walidacja użycia po stronie API)

**Typy:**
- `ReasonViewModel` dla wyświetlanych informacji

**Propsy:**
```typescript
interface DeleteReasonModalProps {
  reason: ReasonViewModel | null;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (id: string) => Promise<void>;
  isPending: boolean;
}
```

### 4.9. ReasonCards (Mobile, Optional)

**Opis:** Responsywny widok kart dla urządzeń mobilnych, alternatywa dla tabeli.

**Główne elementy:**
- Grid kart z `ReasonCard` dla każdego powodu
- Loading skeleton

**Obsługiwane zdarzenia:**
- `onEdit(reason)` - przekazywane do akcji
- `onDelete(reason)` - przekazywane do akcji

**Warunki walidacji:**
- Brak

**Typy:**
- `ReasonViewModel[]`

**Propsy:**
```typescript
interface ReasonCardsProps {
  reasons: ReasonViewModel[];
  isLoading: boolean;
  onEdit: (reason: ReasonViewModel) => void;
  onDelete: (reason: ReasonViewModel) => void;
}
```

## 5. Typy

### 5.1. Istniejące typy (już zdefiniowane)

**ReasonDto** (z `src/interface/completion.ts`):
```typescript
export interface ReasonDto {
  id: string;
  code: string;
  label: string;
}
```

**CreateReasonCommand** (z `src/types/completion.ts`):
```typescript
export type CreateReasonCommand = Pick<
  Database["public"]["Tables"]["standard_reasons"]["Insert"],
  "code" | "label"
>;

// Rozwiniecie:
export interface CreateReasonCommand {
  code: string;
  label: string;
}
```

**UpdateReasonCommand** (z `src/types/completion.ts`):
```typescript
export type UpdateReasonCommand = Partial<CreateReasonCommand> & {
  id: string;
};

// Rozwinięcie:
export interface UpdateReasonCommand {
  id: string;
  code?: string;
  label?: string;
}
```

### 5.2. Nowe typy do stworzenia

**ReasonViewModel** (rozszerzenie ReasonDto z dodatkowymi danymi dla UI):
```typescript
// src/interface/completion.ts (dodać)
export interface ReasonViewModel extends ReasonDto {
  id: string;           // UUID
  code: string;         // alphanumeric_underscore
  label: string;        // display text
  usageCount: number;   // liczba użyć w plan_exercises
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
}
```

**CreateReasonFormData** (dane z formularza tworzenia):
```typescript
// src/interface/completion.ts (dodać)
export interface CreateReasonFormData {
  code: string;    // lowercase, alphanumeric + underscore
  label: string;   // trimmed text, max 200 chars
}
```

**UpdateReasonFormData** (dane z formularza edycji):
```typescript
// src/interface/completion.ts (dodać)
export interface UpdateReasonFormData {
  code?: string;   // optional, lowercase
  label?: string;  // optional, trimmed
}
```

**ReasonsListResponse** (odpowiedź API dla GET /reasons):
```typescript
// src/interface/completion.ts (dodać)
export interface ReasonsListResponse {
  data: ReasonViewModel[];
}
```

**Validation Schemas** (już istnieją w `src/lib/validation.ts`):
```typescript
export const CreateReasonCommandSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
    .transform((val) => val.toLowerCase()),
  label: z
    .string()
    .min(3, "Label must be at least 3 characters")
    .max(200, "Label must be at most 200 characters")
    .transform((val) => val.trim()),
});

export const UpdateReasonCommandSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(50, "Code must be at most 50 characters")
      .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
      .transform((val) => val.toLowerCase())
      .optional(),
    label: z
      .string()
      .min(3, "Label must be at least 3 characters")
      .max(200, "Label must be at most 200 characters")
      .transform((val) => val.trim())
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

## 6. Zarządzanie Stanem

### 6.1. Stany lokalne w komponentach

**ReasonsListContent:**
```typescript
const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
const [editingReason, setEditingReason] = useState<ReasonViewModel | null>(null);
const [deletingReason, setDeletingReason] = useState<ReasonViewModel | null>(null);
```

**Formularze (CreateReasonModal, EditReasonModal):**
- Wykorzystują `react-hook-form` dla zarządzania stanem formularza
- Walidacja przez `zod` resolver z `CreateReasonCommandSchema` / `UpdateReasonCommandSchema`

### 6.2. Custom Hooki

#### 6.2.1. useReasonsList

**Lokalizacja:** `src/hooks/useReasonsList.ts`

**Cel:** Pobieranie listy wszystkich powodów z API

**Implementacja:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryKeys";
import type { ReasonViewModel, ReasonsListResponse } from "@/interface";

export function useReasonsList() {
  const query = useQuery({
    queryKey: QUERY_KEYS.reasons.all,
    queryFn: async (): Promise<ReasonViewModel[]> => {
      const response = await fetch("/api/reasons", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch reasons");
      }

      const result: ReasonsListResponse = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    reasons: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

#### 6.2.2. useCreateReason

**Lokalizacja:** `src/hooks/useCreateReason.ts`

**Cel:** Mutacja tworzenia nowego powodu

**Implementacja:**
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "./queryKeys";
import type { CreateReasonFormData, ReasonViewModel } from "@/interface";

export function useCreateReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReasonFormData): Promise<ReasonViewModel> => {
      const response = await fetch("/api/reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create reason");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasons.all });
      toast.success("Powód został utworzony");
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas tworzenia: ${error.message}`);
    },
  });
}
```

#### 6.2.3. useUpdateReason

**Lokalizacja:** `src/hooks/useUpdateReason.ts`

**Cel:** Mutacja edycji istniejącego powodu

**Implementacja:**
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "./queryKeys";
import type { UpdateReasonFormData, ReasonViewModel } from "@/interface";

export function useUpdateReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReasonFormData;
    }): Promise<ReasonViewModel> => {
      const response = await fetch(`/api/reasons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update reason");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasons.all });
      toast.success("Powód został zaktualizowany");
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas aktualizacji: ${error.message}`);
    },
  });
}
```

#### 6.2.4. useDeleteReason

**Lokalizacja:** `src/hooks/useDeleteReason.ts`

**Cel:** Mutacja usuwania powodu

**Implementacja:**
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "./queryKeys";

export function useDeleteReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/reasons/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete reason");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasons.all });
      toast.success("Powód został usunięty");
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas usuwania: ${error.message}`);
    },
  });
}
```

### 6.3. Query Keys

**Dodać do** `src/hooks/queryKeys.ts`:
```typescript
export const QUERY_KEYS = {
  // ... existing keys
  reasons: {
    all: ["reasons"] as const,
    detail: (id: string) => ["reasons", id] as const,
  },
};
```

## 7. Integracja API

### 7.1. Endpoint: GET /api/reasons

**Opis:** Pobiera listę wszystkich standardowych powodów niewykonania.

**Authorization:** Wszyscy zalogowani użytkownicy

**Request:**
```typescript
// Method: GET
// URL: /api/reasons
// Headers: { "Content-Type": "application/json" }
// Body: brak
```

**Response (200 OK):**
```typescript
{
  "data": ReasonViewModel[]
}

// Przykład:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "code": "pain",
      "label": "Felt pain during exercise",
      "usageCount": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "code": "fatigue",
      "label": "Too fatigued to complete",
      "usageCount": 8,
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Error Response:**
- **401 Unauthorized:** Użytkownik niezalogowany
- **500 Internal Server Error:** Błąd serwera/bazy danych

### 7.2. Endpoint: POST /api/reasons

**Opis:** Tworzy nowy standardowy powód niewykonania.

**Authorization:** Tylko administrator (role === "admin")

**Request:**
```typescript
// Method: POST
// URL: /api/reasons
// Headers: { "Content-Type": "application/json" }
// Body: CreateReasonFormData

{
  "code": "equipment_unavailable",
  "label": "Equipment was not available"
}
```

**Response (201 Created):**
```typescript
ReasonViewModel

// Przykład:
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "code": "equipment_unavailable",
  "label": "Equipment was not available",
  "usageCount": 0,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Error Response:**
- **400 Bad Request:** Walidacja nie powiodła się (błędny format code/label)
- **401 Unauthorized:** Użytkownik niezalogowany
- **403 Forbidden:** Użytkownik nie jest administratorem
- **409 Conflict:** Kod już istnieje
- **500 Internal Server Error:** Błąd serwera/bazy danych

### 7.3. Endpoint: PUT /api/reasons/:id

**Opis:** Aktualizuje istniejący powód.

**Authorization:** Tylko administrator (role === "admin")

**Request:**
```typescript
// Method: PUT
// URL: /api/reasons/:id
// Headers: { "Content-Type": "application/json" }
// Body: UpdateReasonFormData (wszystkie pola opcjonalne, ale minimum jedno)

{
  "label": "Equipment was temporarily unavailable"
}

// lub

{
  "code": "equipment_missing",
  "label": "Equipment was not available"
}
```

**Response (200 OK):**
```typescript
ReasonViewModel

// Przykład:
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "code": "equipment_missing",
  "label": "Equipment was temporarily unavailable",
  "usageCount": 5,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T13:30:00Z"
}
```

**Error Response:**
- **400 Bad Request:** Walidacja nie powiodła się lub brak pól do aktualizacji
- **401 Unauthorized:** Użytkownik niezalogowany
- **403 Forbidden:** Użytkownik nie jest administratorem
- **404 Not Found:** Powód o podanym ID nie istnieje
- **409 Conflict:** Nowy kod już istnieje (jeśli zmiana kodu)
- **500 Internal Server Error:** Błąd serwera/bazy danych

### 7.4. Endpoint: DELETE /api/reasons/:id

**Opis:** Usuwa powód (tylko jeśli nie jest używany).

**Authorization:** Tylko administrator (role === "admin")

**Request:**
```typescript
// Method: DELETE
// URL: /api/reasons/:id
// Headers: brak specjalnych
// Body: brak
```

**Response (204 No Content):**
```typescript
// Pusta odpowiedź, status 204
```

**Error Response:**
- **401 Unauthorized:** Użytkownik niezalogowany
- **403 Forbidden:** Użytkownik nie jest administratorem
- **404 Not Found:** Powód o podanym ID nie istnieje
- **409 Conflict:** Powód jest używany w plan_exercises (nie można usunąć)
- **500 Internal Server Error:** Błąd serwera/bazy danych

## 8. Interakcje Użytkownika

### 8.1. Wyświetlanie listy powodów

**Akcja:** Użytkownik (administrator) wchodzi na `/admin/reasons`

**Przepływ:**
1. Strona renderuje się z loading skeleton
2. Hook `useReasonsList()` wykonuje request GET /api/reasons
3. Po otrzymaniu danych wyświetla się tabela z powodami
4. Każdy wiersz pokazuje: code, label, usageCount, createdAt, oraz menu akcji

**Empty State:** Jeśli brak powodów:
- Wyświetla się komunikat: "Brak powodów niewykonania"
- Opis: "Dodaj pierwszy powód, który podopieczni będą mogli wybierać podczas oznaczania ćwiczeń jako niewykonanych."
- Button CTA: "Dodaj pierwszy powód"

**Error State:** Jeśli błąd ładowania:
- Alert box z komunikatem błędu
- Button "Spróbuj ponownie" który wywołuje `refetch()`

### 8.2. Tworzenie nowego powodu

**Akcja:** Kliknięcie przycisku "Dodaj powód"

**Przepływ:**
1. Otwiera się modal `CreateReasonModal`
2. Użytkownik wypełnia formularz:
   - `code`: Wpisuje kod (automatycznie lowercase)
   - `label`: Wpisuje treść powodu (max 200 znaków, licznik)
3. Kliknięcie "Dodaj powód":
   - Walidacja po stronie klienta (Zod schema)
   - Jeśli walidacja OK: wywołanie `useCreateReason().mutateAsync(data)`
   - Request POST /api/reasons
   - Podczas requestu: button disabled, loading spinner
4. Po sukcesie:
   - Modal się zamyka
   - Toast: "Powód został utworzony"
   - Lista się odświeża (invalidateQueries)
5. Po błędzie:
   - Toast z komunikatem błędu (np. "Kod już istnieje")
   - Modal pozostaje otwarty, użytkownik może poprawić dane

**Kliknięcie "Anuluj":**
- Modal się zamyka
- Formularz się resetuje

### 8.3. Edycja istniejącego powodu

**Akcja:** Kliknięcie "Edytuj" w menu akcji wiersza

**Przepływ:**
1. Otwiera się modal `EditReasonModal` z pre-wypełnionymi danymi
2. Użytkownik modyfikuje pola:
   - `code`: Można zmienić (opcjonalne)
   - `label`: Można zmienić (opcjonalne)
3. Kliknięcie "Zapisz zmiany":
   - Walidacja (min. jedno pole musi być zmienione)
   - Wywołanie `useUpdateReason().mutateAsync({ id, data })`
   - Request PUT /api/reasons/:id
   - Podczas requestu: button disabled, loading spinner
4. Po sukcesie:
   - Modal się zamyka
   - Toast: "Powód został zaktualizowany"
   - Lista się odświeża
5. Po błędzie:
   - Toast z komunikatem błędu
   - Modal pozostaje otwarty

**Kliknięcie "Anuluj":**
- Modal się zamyka
- Zmiany są odrzucane

### 8.4. Usuwanie powodu

**Akcja:** Kliknięcie "Usuń" w menu akcji wiersza

**Przepływ:**
1. Otwiera się modal `DeleteReasonModal` z informacjami:
   - Tytuł: "Usuń powód?"
   - Opis: Wyświetla kod i treść powodu
   - Info: "Ten powód został użyty {usageCount} razy."
   - Ostrzeżenie (jeśli usageCount > 0): "Uwaga: Nie można usunąć powodu, który jest w użyciu."
2. Kliknięcie "Usuń":
   - Wywołanie `useDeleteReason().mutateAsync(id)`
   - Request DELETE /api/reasons/:id
   - Podczas requestu: button disabled, loading spinner
3. Po sukcesie:
   - Modal się zamyka
   - Toast: "Powód został usunięty"
   - Lista się odświeża
4. Po błędzie (409 Conflict - powód w użyciu):
   - Toast: "Nie można usunąć powodu, który jest w użyciu"
   - Modal się zamyka
5. Po innym błędzie:
   - Toast z komunikatem błędu
   - Modal pozostaje otwarty

**Kliknięcie "Anuluj":**
- Modal się zamyka
- Powód nie jest usuwany

### 8.5. Powrót do dashboardu

**Akcja:** Kliknięcie przycisku "Powrót do Dashboard"

**Przepływ:**
- Przekierowanie do `/admin` (window.location.href)

## 9. Warunki i Walidacja

### 9.1. Warunki dostępu do widoku

**Lokalizacja:** Strona Astro (`src/pages/admin/reasons/index.astro`)

**Warunek:**
```typescript
// W middleware lub na stronie
if (!locals.user || locals.user.role !== "admin") {
  return Astro.redirect("/login");
}
```

**Komunikat:** Przekierowanie do strony logowania (lub 403 Forbidden)

### 9.2. Walidacja formularza tworzenia (CreateReasonModal)

**Pole: code**
- **Required:** Tak
- **Min length:** 3 znaki
  - Komunikat: "Kod musi mieć minimum 3 znaki"
- **Max length:** 50 znaków
  - Komunikat: "Kod może mieć maksymalnie 50 znaków"
- **Pattern:** `/^[a-z0-9_]+$/`
  - Komunikat: "Kod może zawierać tylko małe litery, cyfry i podkreślniki"
- **Transform:** `toLowerCase()` (automatyczne)
- **Unikalność:** Sprawdzana po stronie API
  - Komunikat z API: "Kod już istnieje" (409 Conflict)

**Pole: label**
- **Required:** Tak
- **Min length:** 3 znaki
  - Komunikat: "Treść musi mieć minimum 3 znaki"
- **Max length:** 200 znaków
  - Komunikat: "Treść może mieć maksymalnie 200 znaków"
  - Licznik znaków: "{length}/200" (live update)
- **Transform:** `trim()` (automatyczne)

**Warunek przycisku "Dodaj powód":**
- Disabled gdy:
  - Formularz jest niepoprawny (invalid)
  - Trwa request (isPending)

### 9.3. Walidacja formularza edycji (EditReasonModal)

**Pole: code (optional)**
- **Min length:** 3 znaki (jeśli podany)
  - Komunikat: "Kod musi mieć minimum 3 znaki"
- **Max length:** 50 znaków (jeśli podany)
  - Komunikat: "Kod może mieć maksymalnie 50 znaków"
- **Pattern:** `/^[a-z0-9_]+$/` (jeśli podany)
  - Komunikat: "Kod może zawierać tylko małe litery, cyfry i podkreślniki"
- **Transform:** `toLowerCase()` (automatyczne)
- **Unikalność:** Sprawdzana po stronie API
  - Komunikat z API: "Kod już istnieje" (409 Conflict)

**Pole: label (optional)**
- **Min length:** 3 znaki (jeśli podany)
  - Komunikat: "Treść musi mieć minimum 3 znaki"
- **Max length:** 200 znaków (jeśli podany)
  - Komunikat: "Treść może mieć maksymalnie 200 znaków"
  - Licznik znaków: "{length}/200" (live update)
- **Transform:** `trim()` (automatyczne)

**Warunek globalny:**
- Co najmniej jedno pole musi być wypełnione
  - Komunikat: "Musisz zmienić przynajmniej jedno pole"

**Warunek przycisku "Zapisz zmiany":**
- Disabled gdy:
  - Formularz jest niepoprawny (invalid)
  - Brak zmian (wszystkie pola puste lub równe oryginalnym)
  - Trwa request (isPending)

### 9.4. Walidacja usuwania (DeleteReasonModal)

**Warunek:**
- Powód nie może być używany w `plan_exercises`
- Sprawdzane po stronie API podczas DELETE request

**Komunikat błędu z API (409 Conflict):**
- "Nie można usunąć powodu, który jest w użyciu"

**UI Warning:**
- Jeśli `usageCount > 0`: Wyświetl ostrzeżenie w modalu
- "Uwaga: Nie można usunąć powodu, który jest w użyciu."
- Button "Usuń" nadal aktywny (walidacja po stronie API)

## 10. Obsługa Błędów

### 10.1. Błędy ładowania listy (useReasonsList)

**Scenariusz:** Request GET /api/reasons zwraca błąd

**Obsługa:**
- Wyświetlenie Error State w `ReasonsListContent`
- Alert box z czerwonym tłem i ikoną błędu
- Komunikat: "Wystąpił błąd podczas ładowania powodów: {error.message}"
- Button "Spróbuj ponownie" wywołujący `refetch()`

**Możliwe przyczyny:**
- 401 Unauthorized: Sesja wygasła → przekierowanie do /login
- 500 Internal Server Error: Problem z bazą danych
- Network error: Brak połączenia

### 10.2. Błędy tworzenia powodu (useCreateReason)

**Scenariusz:** Request POST /api/reasons zwraca błąd

**Obsługa:**
- Toast error z komunikatem: "Błąd podczas tworzenia: {error.message}"
- Modal pozostaje otwarty (użytkownik może poprawić dane)

**Możliwe błędy:**
- **400 Bad Request:** Walidacja nie powiodła się
  - Komunikat: "Nieprawidłowe dane wejściowe"
- **403 Forbidden:** Użytkownik nie jest administratorem
  - Komunikat: "Brak uprawnień do wykonania tej operacji"
- **409 Conflict:** Kod już istnieje
  - Komunikat: "Kod już istnieje. Wybierz inny kod."
- **500 Internal Server Error:**
  - Komunikat: "Błąd serwera. Spróbuj ponownie później."

### 10.3. Błędy edycji powodu (useUpdateReason)

**Scenariusz:** Request PUT /api/reasons/:id zwraca błąd

**Obsługa:**
- Toast error z komunikatem: "Błąd podczas aktualizacji: {error.message}"
- Modal pozostaje otwarty

**Możliwe błędy:**
- **400 Bad Request:** Walidacja nie powiodła się lub brak zmian
  - Komunikat: "Nieprawidłowe dane wejściowe"
- **403 Forbidden:** Użytkownik nie jest administratorem
  - Komunikat: "Brak uprawnień do wykonania tej operacji"
- **404 Not Found:** Powód nie istnieje
  - Komunikat: "Powód nie został znaleziony"
- **409 Conflict:** Nowy kod już istnieje
  - Komunikat: "Kod już istnieje. Wybierz inny kod."
- **500 Internal Server Error:**
  - Komunikat: "Błąd serwera. Spróbuj ponownie później."

### 10.4. Błędy usuwania powodu (useDeleteReason)

**Scenariusz:** Request DELETE /api/reasons/:id zwraca błąd

**Obsługa:**
- Toast error z komunikatem: "Błąd podczas usuwania: {error.message}"
- Modal się zamyka (chyba że błąd sieciowy)

**Możliwe błędy:**
- **403 Forbidden:** Użytkownik nie jest administratorem
  - Komunikat: "Brak uprawnień do wykonania tej operacji"
- **404 Not Found:** Powód nie istnieje (już usunięty?)
  - Komunikat: "Powód nie został znaleziony"
  - Odświeżenie listy (invalidateQueries)
- **409 Conflict:** Powód jest w użyciu
  - Komunikat: "Nie można usunąć powodu, który jest w użyciu"
  - Wyjaśnienie: "Ten powód jest używany w planach treningowych i nie może być usunięty."
- **500 Internal Server Error:**
  - Komunikat: "Błąd serwera. Spróbuj ponownie później."

### 10.5. Obsługa błędów sieciowych

**Scenariusz:** Brak połączenia z serwerem

**Obsługa:**
- Toast error: "Błąd połączenia. Sprawdź połączenie z internetem."
- Retry mechanism w React Query (3 próby)
- Po 3 nieudanych próbach: Wyświetlenie error state z buttonem retry

### 10.6. Obsługa wygaśnięcia sesji

**Scenariusz:** Token uwierzytelniający wygasł (401 Unauthorized)

**Obsługa:**
- Automatyczne przekierowanie do `/login`
- Toast: "Sesja wygasła. Zaloguj się ponownie."
- Middleware Astro powinien to obsłużyć globalnie

## 11. Kroki Implementacji

### Krok 1: Przygotowanie typów i interfejsów
1. Dodaj nowe typy do `src/interface/completion.ts`:
   - `ReasonViewModel`
   - `CreateReasonFormData`
   - `UpdateReasonFormData`
   - `ReasonsListResponse`
2. Upewnij się, że `CreateReasonCommand` i `UpdateReasonCommand` są wyeksportowane z `src/types/completion.ts`
3. Upewnij się, że validation schemas (`CreateReasonCommandSchema`, `UpdateReasonCommandSchema`) istnieją w `src/lib/validation.ts`

### Krok 2: Stworzenie custom hooków
1. Stwórz `src/hooks/useReasonsList.ts` - pobieranie listy powodów
2. Stwórz `src/hooks/useCreateReason.ts` - tworzenie powodu
3. Stwórz `src/hooks/useUpdateReason.ts` - edycja powodu
4. Stwórz `src/hooks/useDeleteReason.ts` - usuwanie powodu
5. Dodaj klucze `reasons` do `src/hooks/queryKeys.ts`

### Krok 3: Implementacja komponentów pomocniczych
1. Stwórz `src/components/admin/reasons/ReasonActionMenu.tsx` - dropdown menu z akcjami
2. Stwórz `src/components/admin/reasons/ReasonsTableRow.tsx` - pojedynczy wiersz tabeli

### Krok 4: Implementacja komponentu tabeli
1. Stwórz `src/components/admin/reasons/ReasonsTable.tsx` - główna tabela z listą powodów
2. Dodaj obsługę loading skeleton (3-5 wierszy)
3. Zintegruj `ReasonsTableRow` i `ReasonActionMenu`

### Krok 5: Implementacja modali
1. Stwórz `src/components/admin/reasons/CreateReasonModal.tsx`:
   - Formularz z react-hook-form + zod
   - Pola: code, label
   - Walidacja i licznik znaków
   - Obsługa submit i cancel
2. Stwórz `src/components/admin/reasons/EditReasonModal.tsx`:
   - Podobny do CreateReasonModal
   - Pre-wypełnienie danych
   - Opcjonalne pola
3. Stwórz `src/components/admin/reasons/DeleteReasonModal.tsx`:
   - AlertDialog z informacjami
   - Wyświetlanie usageCount
   - Ostrzeżenie o użyciu

### Krok 6: Implementacja głównego kontenera
1. Stwórz `src/components/admin/reasons/ReasonsListPage.tsx`:
   - Wrapper z `QueryProvider`
   - Komponent `ReasonsListContent` z całą logiką
   - Header z breadcrumb, tytułem i przyciskiem powrotu
   - Toolbar z przyciskiem "Dodaj powód"
   - Integracja tabeli i modali
   - Obsługa stanów: loading, error, empty
   - Handlery dla wszystkich akcji

### Krok 7: Stworzenie strony Astro
1. Stwórz `src/pages/admin/reasons/index.astro`:
   - Layout z `Layout.astro`
   - Middleware sprawdzający role (admin only)
   - Renderowanie `ReasonsListPage` z `client:load`

### Krok 8: Styling i responsywność
1. Dodaj Tailwind classes dla wszystkich komponentów
2. Upewnij się, że tabela jest responsywna
3. Opcjonalnie: Dodaj `ReasonCards` dla widoku mobilnego (grid kart)

### Krok 9: Implementacja API route handlers (jeśli nie istnieją)
1. Stwórz `src/pages/api/reasons/index.ts`:
   - GET handler - wywołuje `listReasons()`
   - POST handler - wywołuje `createReason()`
2. Stwórz `src/pages/api/reasons/[id].ts`:
   - PUT handler - wywołuje `updateReason()`
   - DELETE handler - wywołuje `deleteReason()`
3. Dodaj obsługę błędów i zwracanie odpowiednich statusów HTTP
4. Upewnij się, że API zwraca `ReasonViewModel[]` (z usageCount)

### Krok 10: Modyfikacja service layer (jeśli potrzebna)
1. W `src/services/reasons.service.ts`:
   - Upewnij się, że `listReasons()` zwraca również `usageCount` (query z COUNT subquery)
   - Przykład:
   ```typescript
   const { data, error } = await supabase
     .from("standard_reasons")
     .select(`
       *,
       usageCount:plan_exercises(count)
     `)
     .order("code");
   ```
2. Zaktualizuj mapper `mapStandardReasonToDTO` aby zwracał `ReasonViewModel`

### Krok 11: Testowanie
1. Przetestuj ładowanie listy powodów
2. Przetestuj tworzenie nowego powodu (success + error cases)
3. Przetestuj edycję powodu (success + error cases, w tym konflikt kodu)
4. Przetestuj usuwanie powodu:
   - Powód nieużywany (success)
   - Powód używany (409 conflict)
5. Przetestuj walidację formularzy (client-side i server-side)
6. Przetestuj responsywność na mobile i desktop
7. Przetestuj empty state i error state
8. Przetestuj dostęp (only admin)

### Krok 12: Finalne poprawki
1. Sprawdź accessibility (ARIA labels, keyboard navigation)
2. Sprawdź konsystencję komunikatów (PL language)
3. Sprawdź loading states (skeletons, spinners)
4. Sprawdź error handling (toasts, error messages)
5. Code review i refactoring

### Krok 13: Dokumentacja
1. Dodaj komentarze JSDoc do komponentów
2. Zaktualizuj README jeśli potrzebne
3. Dodaj entry do navigation menu (jeśli dotyczy)

---

## Dodatkowe Uwagi

### Accessibility (A11y)
- Wszystkie interaktywne elementy muszą być dostępne z klawiatury
- Modale powinny trapować focus (dialog trap)
- ARIA labels dla ikon i buttonów bez tekstu
- Role attributes dla custom komponentów
- Semantic HTML (table, dialog, form)

### Performance
- React.memo dla `ReasonsTableRow` (optional, tylko jeśli lista > 50 elementów)
- Query staleTime: 5 minut (dane rzadko się zmieniają)
- Debounce dla character counter (jeśli potrzebne)

### UX Improvements (opcjonalne)
- Inline editing w tabeli zamiast modala (advanced)
- Sortowanie kolumn (code, label, usageCount, createdAt)
- Paginacja jeśli liczba powodów > 50
- Search/filter powodów
- Bulk actions (delete multiple)

### Security
- Zawsze sprawdzaj role po stronie serwera (middleware)
- Walidacja UUID w parametrach URL
- Sanityzacja input (trim, lowercase dla code)
- Rate limiting dla API endpoints (opcjonalnie)

### Integration z innymi widokami
- Podopieczni będą widzieć te powody w `MarkExerciseCompletionModal`
- Trenerzy będą widzieć wybrane powody w szczegółach planów

---

**Koniec planu implementacji**

