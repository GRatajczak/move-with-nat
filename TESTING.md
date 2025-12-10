# Testing Guide - Plans Module

## 📋 Overview

Ten dokument opisuje testy jednostkowe dla modułu **Plans** w aplikacji Move with Nat. Testy zostały napisane zgodnie z najlepszymi praktykami używając Vitest i React Testing Library.

## 🎯 Pokrycie Testów

### 1. **Validation Schemas** (`src/lib/validation.plans.test.ts`)

Kompleksowe testy schematów walidacji Zod dla planów treningowych:

- ✅ `planExerciseSchema` - walidacja pojedynczego ćwiczenia w planie
- ✅ `planFormSchema` - walidacja formularza trenera (wymagany clientId)
- ✅ `adminPlanFormSchema` - walidacja formularza admina (opcjonalny clientId i trainerId)
- ✅ `CreatePlanCommandSchema` - walidacja polecenia tworzenia planu
- ✅ `UpdatePlanCommandSchema` - walidacja polecenia aktualizacji planu
- ✅ `ListPlansQuerySchema` - walidacja parametrów zapytania
- ✅ `TogglePlanVisibilityCommandSchema` - walidacja zmiany widoczności

**Testowane scenariusze:**

- Happy path (poprawne dane)
- Warunki brzegowe (min/max wartości)
- Błędy walidacji (niepoprawne dane)
- Transformacje (trim, lowercase, coerce)
- Wartości domyślne

**Liczba testów:** ~80

### 2. **React Hooks**

#### `useCreatePlan.test.ts`

Testy hooka do tworzenia planów:

- ✅ Tworzenie planu z poprawnymi danymi
- ✅ Tworzenie z wieloma ćwiczeniami
- ✅ Obsługa błędów walidacji (ValidationError)
- ✅ Obsługa błędów sieciowych
- ✅ Invalidacja cache po sukcesie
- ✅ Business rules (null trainerId/clientId, hidden plans)
- ✅ Stan hooka (isPending, isSuccess, isError)

**Liczba testów:** 25

#### `useUpdatePlan.test.ts`

Testy hooka do aktualizacji planów:

- ✅ Aktualizacja częściowa (partial update)
- ✅ Aktualizacja tylko nazwy, tylko widoczności, tylko ćwiczeń
- ✅ Unassign trainer/client (ustawienie na null)
- ✅ Success/error toasts
- ✅ Invalidacja cache (detail + list)
- ✅ Obsługa błędów

**Liczba testów:** 20

#### `useDuplicatePlan.test.ts`

Testy hooka do duplikowania planów:

- ✅ Pobieranie oryginalnego planu
- ✅ Tworzenie nowego planu z danymi oryginału
- ✅ Zachowanie exercises, trainerId, description
- ✅ Obsługa null description
- ✅ NotFoundError gdy oryginalny plan nie istnieje
- ✅ ValidationError przy tworzeniu nowego planu
- ✅ Edge cases (brak ćwiczeń, wiele ćwiczeń)

**Liczba testów:** 18

#### `useDeletePlan.test.ts`

Testy hooka do usuwania planów:

- ✅ Soft delete (domyślne)
- ✅ Hard delete (z parametrem ?hard=true)
- ✅ NotFoundError dla nieistniejących planów
- ✅ Invalidacja cache
- ✅ Success/error toasts
- ✅ Obsługa różnych błędów HTTP (401, 403, 500)
- ✅ Stan hooka

**Liczba testów:** 22

### 3. **Utility Functions** (`PlanForm.utils.test.ts`)

Testy funkcji pomocniczych do zarządzania ćwiczeniami w formularzu:

- ✅ `updateSortOrder` - aktualizacja kolejności ćwiczeń
- ✅ `removeExercise` - usuwanie ćwiczenia z listy
- ✅ `addExercises` - dodawanie nowych ćwiczeń
- ✅ `updateExercise` - aktualizacja pojedynczego ćwiczenia
- ✅ `reorderExercises` - zmiana kolejności
- ✅ `isDuplicateExercise` - sprawdzanie duplikatów
- ✅ `filterDuplicateExercises` - filtrowanie duplikatów
- ✅ `validateExerciseData` - walidacja danych ćwiczenia
- ✅ `getExercisesToRemove` - identyfikacja usuniętych ćwiczeń
- ✅ `getExercisesToAdd` - identyfikacja nowych ćwiczeń

**Liczba testów:** 45

---

## 📊 Statystyki

```
Całkowita liczba testów: ~210
Pokrycie:
  ✅ Validation Schemas:    100%
  ✅ Custom Hooks:          100%
  ✅ Utility Functions:     100%
```

## 🚀 Uruchamianie Testów

### Wszystkie testy

```bash
npm run test
```

### Testy w trybie watch (dev)

```bash
npm run test:watch
```

### Testy z pokryciem kodu

```bash
npm run test:coverage
```

### Tylko testy planów

```bash
npm run test -- plans
```

### Konkretny plik testowy

```bash
npm run test -- useCreatePlan
```

### Testy z UI mode (interaktywny)

```bash
npm run test:ui
```

## 🎨 Struktura Testów

Wszystkie testy stosują wzorzec **AAA (Arrange-Act-Assert)**:

```typescript
it("should create plan with valid data", async () => {
  // Arrange - przygotowanie danych testowych
  const mockPlan = { id: "plan-123", name: "Test Plan" };
  const createCommand = { name: "Test Plan", exercises: [...] };

  // Act - wykonanie akcji
  const result = await createPlan(createCommand);

  // Assert - sprawdzenie wyniku
  expect(result).toEqual(mockPlan);
});
```

## 🔍 Kluczowe Reguły Biznesowe Testowane

### 1. **Walidacja Ćwiczeń**

- ✅ Sets: min 1, max 100
- ✅ Reps: min 1, max 1000
- ✅ SortOrder: min 1
- ✅ DefaultWeight: >= 0 lub null
- ✅ Tempo: format XXXX lub X-X-X

### 2. **Walidacja Planów**

- ✅ Name: min 3, max 100 znaków
- ✅ Description: max 1000 znaków
- ✅ Exercises: min 1 ćwiczenie wymagane
- ✅ ClientId: UUID format (wymagany dla trainera)
- ✅ TrainerId: opcjonalny dla admina

### 3. **Business Logic**

- ✅ Trainer musi wybrać klienta (clientId required)
- ✅ Admin może tworzyć plany bez klienta/trenera
- ✅ Soft delete vs Hard delete
- ✅ Duplikowanie zachowuje exercises i trainerId
- ✅ Update może ustawić trainerId/clientId na null (unassign)

### 4. **Cache Invalidation**

- ✅ Create → invalidate `["plans", "list"]`
- ✅ Update → invalidate `["plans", "detail", id]` + `["plans", "list"]`
- ✅ Delete → invalidate `["plans", "list"]`
- ✅ Duplicate → invalidate `["plans", "list"]`

## 🛠️ Narzędzia i Biblioteki

- **Vitest** - test runner
- **React Testing Library** - testowanie React hooks
- **@testing-library/react** - renderHook, waitFor
- **vi** - mocking functions
- **Zod** - validation schemas

## 📝 Konwencje

### Nazewnictwo testów

```typescript
describe("useCreatePlan", () => {
  describe("Happy Path", () => {
    it("should create plan with valid data", () => {});
  });

  describe("Validation Errors", () => {
    it("should throw ValidationError on 400 response", () => {});
  });

  describe("Edge Cases", () => {
    it("should handle exercises with null defaultWeight", () => {});
  });
});
```

### Grupowanie testów

- `Happy Path` - poprawne scenariusze
- `Validation Errors` - błędy walidacji
- `Error Handling` - obsługa błędów
- `Business Rules` - reguły biznesowe
- `Edge Cases` - przypadki brzegowe

## 🐛 Debugowanie Testów

### 1. Uruchom konkretny test

```bash
npm run test -- -t "should create plan with valid data"
```

### 2. Użyj debug mode

```typescript
import { debug } from "@testing-library/react";

it("test", () => {
  const { result } = renderHook(() => useCreatePlan());
  console.log(result.current); // debug output
});
```

### 3. Sprawdź mock calls

```typescript
expect(global.fetch).toHaveBeenCalledTimes(2);
console.log((global.fetch as any).mock.calls); // zobacz wszystkie wywołania
```

## ✅ Checklist przed Commitem

- [ ] Wszystkie testy przechodzą
- [ ] Pokrycie kodu > 70%
- [ ] Brak console.log w kodzie produkcyjnym
- [ ] Testy używają opisowych nazw
- [ ] Edge cases są pokryte
- [ ] Błędy walidacji są testowane
- [ ] Business rules są zadokumentowane w testach

## 📚 Dalsze Kroki

### Testy do dodania w przyszłości:

1. **Integration tests** - testowanie całych flow (E2E z Playwright)
2. **Component tests** - testowanie komponentów React (PlanForm, PlansTable)
3. **Performance tests** - testowanie wydajności z dużą ilością danych

### Zalecenia:

- Utrzymuj pokrycie kodu > 80% dla krytycznych modułów
- Aktualizuj testy po każdej zmianie w logice biznesowej
- Dokumentuj nietypowe przypadki w testach
- Używaj snapshot testing dla stabilnych struktur danych

## 🆘 Pomoc

Jeśli testy nie przechodzą:

1. Sprawdź, czy wszystkie zależności są zainstalowane: `npm install`
2. Wyczyść cache: `npm run test -- --clearCache`
3. Uruchom testy pojedynczo, aby zidentyfikować problem
4. Sprawdź logi w terminalu - Vitest podaje szczegółowe informacje o błędach

## 📞 Kontakt

W razie pytań dotyczących testów, skontaktuj się z zespołem lub zobacz dokumentację:

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zod Validation](https://zod.dev/)
