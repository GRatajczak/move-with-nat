# Plan implementacji widoku Exercise Completion View

## 1. Przegląd

Widok umożliwia podopiecznemu zapoznanie się ze szczegółami pojedynczego ćwiczenia z planu treningowego oraz oznaczenie jego wykonania (✓) lub niewykonania (✗ z podaniem powodu). Strona łączy dane z tabel `exercises` oraz powiązanej rekordami `plan_exercises`, przy czym priorytet mają wartości z `plan_exercises` (tempo, ciężar, serie, powtórzenia). Akcje zapisu statusu wysyłają żądanie do API `/plans/{planId}/exercises/{exerciseId}/completion`.

## 2. Routing widoku

- Ścieżka: `/client/plans/:planId/exercises/:exerciseId`
- Ochrona: middleware `requireAuth` + rola `client`
- Warunek dostępu: użytkownik = `trainee_id` w planie oraz `is_visible = true`

## 3. Struktura komponentów

```
ExerciseCompletionPage (route)
├── ExerciseDetailHeader
├── VimeoPlayer
├── ExerciseMetadataGrid
├── ExerciseDescriptionAccordion
└── CompletionSection
    ├── CompletionButtons
    └── NotCompletedReasonModal (portal)
```

## 4. Szczegóły komponentów

### ExerciseDetailHeader

- Opis: Pasek nagłówka z nazwą ćwiczenia i przyciskiem powrotu
- Główne elementy: `<BackButton />`, `<h1>`, status badge (jeśli istnieje)
- Obsługiwane interakcje: kliknięcie Back → nawigacja do planu
- Walidacja: brak
- Typy: `ExerciseHeaderProps`
- Propsy: `{ name: string }`

### VimeoPlayer

- Opis: Odtwarzacz wideo w proporcjach 16:9
- Główne elementy: kontener aspect-video, komponent `react-player`
- Interakcje: odtwarzanie/pauza natywna
- Walidacja: obsługa błędu ładowania wideo
- Typy: `VimeoPlayerProps`
- Propsy: `{ videoId: string }`

### ExerciseMetadataGrid

- Opis: Tabela parametrów ćwiczenia
- Elementy: rzędy `Label : Value`
- Interakcje: brak
- Walidacja: format tempo (jeśli przekazane)
- Typy: `ExerciseMeta`
- Propsy: `{ meta: ExerciseMeta }`

### ExerciseDescriptionAccordion

- Opis: Sekcje celów, kroków i wskazówek w accordionie Radix UI
- Interakcje: expand/collapse (keyboard + click)
- Walidacja: brak
- Typy: `ExerciseDescription`
- Propsy: `{ description: ExerciseDescription }`

### CompletionSection

- Opis: Blok przycisków oznaczenia wykonania/niewykonania + wynik aktualny
- Elementy: `CompletionButtons`, toast feedback
- Interakcje:
  - „✓ Wykonane” → `handleMark(true)`
  - „✗ Nie wykonano” → otwarcie `NotCompletedReasonModal`
- Walidacja: blokada przycisków w trakcie zapisu
- Typy: `CompletionStatus`, `StandardReason`
- Propsy: `{ currentStatus?: CompletionStatus, onUpdate: fn }`

### NotCompletedReasonModal

- Opis: Modal z dropdownem powodów i opcjonalnym polem tekstowym
- Elementy: `<Select>`, `<TextareaWithCounter>`
- Interakcje: wybór powodu, zapis/Anuluj
- Walidacja:
  - Wymagany `reasonId` lub `customReason` (max 200 znaków)
- Typy: `ReasonFormValues`
- Propsy: `{ isOpen: boolean, reasons: StandardReason[], onConfirm(values), onClose }`

## 5. Typy

```typescript
// DTO z API
interface ExerciseDto {
  id: string;
  name: string;
  vimeoToken: string;
  description?: string;
  goals?: string;
  steps?: string;
  tips?: string;
}
interface PlanExerciseDto {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  weight?: number;
  tempo?: string;
}
interface CompletionStatusDto {
  completed: boolean;
  reasonId?: string;
  customReason?: string;
}
// ViewModel
type ExerciseMeta = {
  sets: number;
  reps: number;
  weight?: number;
  tempo?: string;
};
interface ExerciseDescription {
  goals?: string;
  steps?: string;
  tips?: string;
}
interface CompletionStatus {
  completed: boolean | null; // null = pending
  reason?: string; // zmapowany tekst
}
interface StandardReason {
  id: string;
  text: string;
}
interface ReasonFormValues {
  reasonId?: string;
  customReason?: string;
}
```

## 6. Zarządzanie stanem

- `TanStack Query` do pobrania:
  - Szczegółów ćwiczenia `useExercise(planId, exerciseId)` (łączy `/plans/{id}` i `/exercises/{id}` klient-side)
  - Listy standardowych powodów `useReasons()`
  - Aktualnego statusu completion `useCompletion(planId, exerciseId)`
- Mutacje:
  - `useMarkCompletion` (POST `/completion`)
- Lokalny stan:
  - `isModalOpen` (boolean)
  - `modalForm` (React Hook Form + Zod)
- Optimistic update: po udanym POST aktualizujemy cache `completion` oraz progress w `planDetail` query

## 7. Integracja API

| Akcja                       | Metoda | Endpoint                                            | Request Body                              | Response                    |
| --------------------------- | ------ | --------------------------------------------------- | ----------------------------------------- | --------------------------- |
| Pobierz dane ćwiczenia      | GET    | `/exercises/{id}`                                   | —                                         | `ExerciseDto`               |
| Pobierz dane `planExercise` | GET    | `/plans/{planId}` (filter w kodzie)                 | —                                         | `PlanExerciseDto[]`         |
| Pobierz powody              | GET    | `/reasons`                                          | —                                         | `StandardReason[]`          |
| Pobierz status completion   | GET    | `/plans/{planId}/completion`                        | —                                         | array `CompletionStatusDto` |
| Zapisz completion           | POST   | `/plans/{planId}/exercises/{exerciseId}/completion` | `{ completed, reasonId?, customReason? }` | `201`                       |

## 8. Interakcje użytkownika

1. Użytkownik wchodzi na URL → dane są pobierane (loader + skeleton)
2. Ogląda wideo / czyta opis
3. Klik „✓” → natychmiastowa aktualizacja statusu (optimistic) → toast „Ćwiczenie oznaczone jako wykonane” → redirect ← plan detail
4. Klik „✗” → otwiera modal → wybiera powód lub wpisuje własny → Zapisz → toast „Status zapisany” → redirect ← plan detail
5. Błąd sieci → toast error + przyciski ponownie aktywne

## 9. Warunki i walidacja

- Buttony disabled, gdy trwa zapytanie
- Przy „✗” wymagany `reasonId` **lub** `customReason` (`length 1-200`)
- Regex tempo `^(\d{4}|\d+-\d+-\d+)$` przy renderowaniu (jeśli niezgodne → ukryj)
- Dostęp do strony tylko gdy plan widoczny i przypisany do użytkownika

## 10. Obsługa błędów

- 403/404 → komponent `ErrorState` z komunikatem „Brak dostępu lub nie znaleziono” + przycisk „Wróć do planu”
- 500/Network → toast error „Błąd połączenia. Spróbuj ponownie.” + Retry w `ErrorState`
- Błąd ładowania wideo → placeholder z komunikatem i linkiem do ćwiczenia w Vimeo (opcjonalnie)

## 11. Kroki implementacji

1. Dodaj trasę `src/pages/client/plans/[planId]/exercises/[exerciseId].astro` z importem `ExerciseCompletionPage`
2. Utwórz komponenty szkieletowe w `src/components/client/exercise-completion/`
3. Zaimplementuj hooki TanStack Query (`useExercise`, `useCompletion`, `useReasons`, `useMarkCompletion`)
4. Stwórz `ExerciseDetailHeader` + integracja z breadcrumbs
5. Dodaj `VimeoPlayer` (reuse globalnego komponentu)
6. Zbuduj `ExerciseMetadataGrid` (Tailwind grid-cols-2)
7. Zaimplementuj `ExerciseDescriptionAccordion` na Radix UI
8. Zaimplementuj `CompletionButtons` z obsługą optimistic update
9. Stwórz `NotCompletedReasonModal` z React Hook Form + Zod + Select (shadcn/ui)
10. Opracuj walidację formularza (Zod: przynajmniej jedno pole zdefiniowane)
11. Podłącz mutację `useMarkCompletion` (invalidate `planDetail`, `completion`)
12. Dodaj stany: loading skeletons, error fallback
13. Testy UX: mobile sticky buttons, keyboard navigation modal
14. Linter + format + dostępność (aria-labels, focus trap)
15. Update `navigation.config.ts` jeżeli potrzebne breadcrumbs titles
16. Pull request → review → merge
