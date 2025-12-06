# Podsumowanie implementacji widoku planów treningowych + TODOs dla admina

**Data:** 2024-12-02  
**Status implementacji:** ✅ Frontend dla Trenera ukończony w 100%  
**Status dla Admina:** 🟡 Wymaga rozszerzenia (selecty dla dowolnego klienta + trenera)

---

## 📊 Co zostało zrobione - Pełne podsumowanie

### ✅ Zaimplementowane komponenty (35 plików)

#### 1. **Strony Astro (4 pliki)**

```
src/pages/trainer/plans/
├── index.astro           → Lista planów (/trainer/plans)
├── new.astro             → Tworzenie planu (/trainer/plans/new)
├── [id].astro            → Szczegóły planu (/trainer/plans/:id)
└── [id]/edit.astro       → Edycja planu (/trainer/plans/:id/edit)
```

**Wszystkie strony zawierają:**

- Check autoryzacji (role === "trainer")
- Root element dla React
- Import React container components
- QueryProvider wrapper

#### 2. **Komponenty React (19 plików)**

**Główne kontenery (4):**

- `PlansListPage.tsx` - Lista planów z filtrowaniem, paginacją, modals
- `CreatePlanContainer.tsx` - Container dla tworzenia nowego planu
- `EditPlanContainer.tsx` - Container dla edycji istniejącego planu
- `PlanDetailContainer.tsx` - Szczegółowy widok planu z completion tracking

**Komponenty widoku listy (4):**

- `PlansFilterToolbar.tsx` - Filtry (search, visibility, sort) + clear button
- `PlansTable.tsx` - Desktop tabela z kolumnami i quick actions
- `PlanCards.tsx` - Mobile karty (responsive <768px)
- `PlanActionMenu.tsx` - Dropdown menu (edit, toggle, duplicate, delete)

**Komponenty formularza (4):**

- `PlanForm.tsx` - Główny formularz (React Hook Form + Zod)
- `PlanExercisesList.tsx` - Drag & drop lista (@dnd-kit)
- `PlanExerciseRow.tsx` - Inline editable wiersz ćwiczenia
- `ClientSelect.tsx` - Select podopiecznego (useTrainerClients)

**Komponenty detail view (4):**

- `PlanDetailHeader.tsx` - Header z metadata + actions
- `PlanDescriptionSection.tsx` - Collapsible accordion z opisem
- `ProgressSection.tsx` - Progress bar + stats cards
- `PlanExercisesDetailList.tsx` - Lista z completion status
- `ExerciseCompletionRow.tsx` - Wiersz z badges (✓/✗/⚪) + tooltip

**Modals (3):**

- `AddExerciseModal.tsx` - Search + multi-select ćwiczeń
- `DuplicatePlanModal.tsx` - Duplikacja z wyborem nazwy
- `DeletePlanConfirmationModal.tsx` - Potwierdzenie usunięcia

#### 3. **Hooki TanStack Query (8 plików)**

**Queries (3):**

- `useTrainerPlans.ts` - Lista planów z filtrowaniem (keepPreviousData)
- `usePlan.ts` - Pojedynczy plan z exercises
- `usePlanCompletion.ts` - Completion records dla planu

**Mutations (5):**

- `useCreatePlan.ts` - POST /api/plans
- `useUpdatePlan.ts` - PUT /api/plans/:id
- `useDeletePlan.ts` - DELETE /api/plans/:id
- `useTogglePlanVisibility.ts` - PATCH z optimistic update
- `useDuplicatePlan.ts` - Duplikacja (fetch + create)

**Dodatkowe hooki użytkowników (2):**

- `useTrainerClients.ts` - Fetch clients trenera (do ClientSelect)
- `useAllUsers.ts` - **NOWY** - Fetch wszystkich userów (dla admina)

#### 4. **Pozostałe pliki (4)**

**API Client:**

- `src/lib/plans.client.ts` - 8 funkcji API (fetch, create, update, delete, toggle, completion, duplicate)

**Validation:**

- `src/lib/validation/planFormSchema.ts` - Zod schemas (planFormSchema, planExerciseSchema)

**Mappers:**

- `src/lib/mappers/planMappers.ts` - mapPlanToFormData (dla edit mode)

**Utils:**

- `src/hooks/useUnsavedChangesWarning.ts` - Hook ostrzegający o niezapisanych zmianach

**Query Keys:**

- `src/hooks/queryKeys.ts` - Rozszerzone o `plansKeys`

**Types:**

- `src/interface/plans.ts` - Rozszerzone o 18 nowych interfejsów

---

## 🎯 Kluczowe funkcjonalności zaimplementowane

### 1. **Lista planów treningowych**

✅ Filtry: search (debounced 300ms), visibility, sort  
✅ URL state synchronization (sharable links)  
✅ Paginacja z keepPreviousData  
✅ Responsive: PlansTable (desktop) / PlanCards (mobile)  
✅ Quick actions: toggle visibility (optimistic), edit, duplicate, delete  
✅ Empty states + loading skeletons

### 2. **Tworzenie planu**

✅ React Hook Form + Zod validation  
✅ Sekcja Basic Info: nazwa, opis (counter 1000), client select, visibility toggle  
✅ Sekcja Ćwiczenia: AddExerciseModal (search + multi-select)  
✅ Drag & drop sortowanie (@dnd-kit) z ARIA live regions  
✅ PlanExerciseRow: inline validation (Serie, Reps, Ciężar, Tempo)  
✅ Unsaved changes warning (beforeunload)  
✅ Toast notifications  
✅ Redirect do detail page po utworzeniu

### 3. **Edycja planu**

✅ Fetch existing plan + pre-populate formularza  
✅ Visibility warning alert (gdy plan visible)  
✅ Disabled client field (nie można zmienić)  
✅ Info o ostatniej edycji  
✅ Identyczny formularz jak create  
✅ Error handling + 404 redirect

### 4. **Szczegóły planu**

✅ PlanDetailHeader: title, status badge, client info, actions  
✅ Progress tracking: progress bar + stats (X/Y wykonanych, % completion)  
✅ Exercises list z completion status  
✅ Completion badges: ✓ Wykonane / ✗ Nie wykonano (+ tooltip z powodem) / ⚪ Brak danych  
✅ Quick preview modal dla ćwiczeń  
✅ All actions: edit, toggle, duplicate, delete

### 5. **Accessibility & UX**

✅ ARIA labels, live regions, keyboard navigation  
✅ Focus management w modalach  
✅ Screen reader support  
✅ Touch-friendly drag & drop  
✅ Responsive breakpoints (<768px, 768-1023px, >1024px)

---

## 🔴 Co trzeba zrobić dla widoku ADMINISTRATORA

### Problem:

Obecnie widok planów jest dostosowany tylko dla **TRENERA**:

- `ClientSelect.tsx` używa `useTrainerClients()` → zwraca tylko clients tego trenera
- Brak pola wyboru TRENERA (trainerId jest hardcoded w CreatePlanContainer)
- RLS policies pozwalają trenerowi widzieć tylko własne plany

### Wymagania dla ADMINA:

Administrator powinien móc:

1. **Wybrać dowolnego PODOPIECZNEGO** (nie tylko jednego trenera)
2. **Wybrać TRENERA** (do którego przypisany będzie plan)
3. **Widzieć wszystkie plany** (niezależnie od trenera)
4. **Edytować wszystkie plany**

---

## 📝 TODO: Implementacja dla administratora

### 1. **Stworzyć komponenty Admin Select** (2 nowe komponenty)

#### A. `AdminClientSelect.tsx`

**Lokalizacja:** `src/components/plans/AdminClientSelect.tsx`

**Funkcjonalność:**

- Fetch WSZYSTKICH clients (nie tylko jednego trenera)
- Używa `useAllClients()` hook (już utworzony w `useAllUsers.ts`)
- Pokazuje wszystkich klientów z możliwością filtrowania
- Wyświetla nazwę + email + trenera (w opisie)

**Przykład kodu:**

```typescript
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllClients } from "@/hooks/useAllUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AdminClientSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AdminClientSelect: React.FC<AdminClientSelectProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { data: clients, isLoading, error } = useAllClients();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nie udało się załadować listy podopiecznych.
        </AlertDescription>
      </Alert>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Brak podopiecznych w systemie.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter active clients
  const activeClients = clients.filter(
    (client) => client.firstName && client.lastName && client.isActive
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Wybierz podopiecznego" />
      </SelectTrigger>
      <SelectContent>
        {activeClients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            <div className="flex flex-col">
              <span>
                {client.firstName} {client.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {client.email}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

#### B. `TrainerSelect.tsx`

**Lokalizacja:** `src/components/plans/TrainerSelect.tsx`

**Funkcjonalność:**

- Fetch WSZYSTKICH trenerów
- Używa `useAllTrainers()` hook (już utworzony w `useAllUsers.ts`)
- Wyświetla nazwę trenera + email

**Przykład kodu:**

```typescript
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllTrainers } from "@/hooks/useAllUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TrainerSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TrainerSelect: React.FC<TrainerSelectProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { data: trainers, isLoading, error } = useAllTrainers();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nie udało się załadować listy trenerów.
        </AlertDescription>
      </Alert>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Brak trenerów w systemie.
        </AlertDescription>
      </Alert>
    );
  }

  const activeTrainers = trainers.filter((t) => t.isActive);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Wybierz trenera" />
      </SelectTrigger>
      <SelectContent>
        {activeTrainers.map((trainer) => (
          <SelectItem key={trainer.id} value={trainer.id}>
            <div className="flex flex-col">
              <span>
                {trainer.firstName} {trainer.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {trainer.email}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

---

### 2. **Rozszerzyć validation schema**

**Lokalizacja:** `src/lib/validation/planFormSchema.ts`

**Dodać pole `trainerId` (opcjonalne dla trenera, wymagane dla admina):**

```typescript
// Dla admina - nowy schema
export const adminPlanFormSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć min. 3 znaki").max(100, "Nazwa może mieć max. 100 znaków").trim(),
  description: z.string().max(1000, "Opis może mieć max. 1000 znaków").trim().optional().or(z.literal("")),
  clientId: z.string().uuid("Wybierz podopiecznego"),
  trainerId: z.string().uuid("Wybierz trenera"), // NOWE POLE
  isHidden: z.boolean(),
  exercises: z.array(planExerciseSchema).min(1, "Dodaj przynajmniej jedno ćwiczenie"),
});

export type AdminPlanFormSchema = z.infer<typeof adminPlanFormSchema>;
```

---

### 3. **Stworzyć `AdminPlanForm.tsx`**

**Lokalizacja:** `src/components/plans/AdminPlanForm.tsx`

**Różnice od `PlanForm.tsx`:**

- Dodane pole `TrainerSelect` (required)
- Używa `AdminClientSelect` zamiast `ClientSelect`
- Używa `adminPlanFormSchema` zamiast `planFormSchema`
- W edit mode: trainerId NIE jest disabled (admin może zmienić trenera!)

**Przykład kodu (partial):**

```typescript
import { TrainerSelect } from "./TrainerSelect";
import { AdminClientSelect } from "./AdminClientSelect";
import { adminPlanFormSchema, type AdminPlanFormSchema } from "@/lib/validation/planFormSchema";

// ... reszta importów

interface AdminPlanFormProps {
  plan?: PlanViewModel | null;
  onSubmit: (data: AdminPlanFormSchema) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
}

export const AdminPlanForm = ({ plan, onSubmit, onCancel, isSubmitting, mode }: AdminPlanFormProps) => {
  // ... useState dla exercises

  const form = useForm<AdminPlanFormSchema>({
    resolver: zodResolver(adminPlanFormSchema),
    defaultValues: {
      name: plan?.name || "",
      description: plan?.description || "",
      clientId: plan?.clientId || "",
      trainerId: plan?.trainerId || "", // NOWE POLE
      isHidden: plan?.isHidden ?? false,
      exercises: selectedExercises,
    },
  });

  // ... reszta jak w PlanForm.tsx

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ... Warning alerts ... */}

        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
            <CardDescription>Określ nazwę, opis, trenera i podopiecznego</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nazwa planu */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa planu *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Plan treningowy - Tydzień 1" {...field} maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opis */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodaj opis lub instrukcje dla podopiecznego..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      maxLength={1000}
                    />
                  </FormControl>
                  <FormDescription>
                    <span className={characterCount > 900 ? "text-yellow-600" : ""}>
                      {characterCount} / 1000 znaków
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NOWE POLE: Trener Select */}
            <FormField
              control={form.control}
              name="trainerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trener *</FormLabel>
                  <FormControl>
                    <TrainerSelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={false} // Admin może zmienić trenera nawet w edit mode!
                    />
                  </FormControl>
                  <FormDescription>
                    Wybierz trenera, który będzie właścicielem tego planu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ZMODYFIKOWANE: Admin Client Select */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podopieczny *</FormLabel>
                  <FormControl>
                    <AdminClientSelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={false} // Admin może zmienić klienta w edit mode!
                    />
                  </FormControl>
                  <FormDescription>
                    Wybierz podopiecznego, dla którego jest ten plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility toggle - bez zmian */}
            {/* ... */}
          </CardContent>
        </Card>

        {/* Exercises Section - bez zmian */}
        {/* ... */}

        {/* Form Actions - bez zmian */}
        {/* ... */}
      </form>
    </Form>
  );
};
```

---

### 4. **Stworzyć strony admin**

#### A. **Routing admin**

```
src/pages/admin/plans/
├── index.astro           → Lista wszystkich planów
├── new.astro             → Tworzenie planu (z trainerSelect)
├── [id].astro            → Szczegóły planu
└── [id]/edit.astro       → Edycja planu (można zmienić trenera!)
```

#### B. **Przykład: `/admin/plans/new.astro`**

```astro
---
import AdminLayout from "../../../layouts/AdminLayout.astro";

const { locals } = Astro;
const user = locals.user;

if (!user || user.role !== "admin") {
  return Astro.redirect("/");
}
---

<AdminLayout>
  <div id="admin-create-plan-root"></div>
</AdminLayout>

<script>
  import { createRoot } from "react-dom/client";
  import { AdminCreatePlanContainer } from "../../../components/plans/AdminCreatePlanContainer";
  import { QueryProvider } from "../../../components/QueryProvider";

  const container = document.getElementById("admin-create-plan-root");
  if (container) {
    const root = createRoot(container);
    root.render(
      <QueryProvider>
        <AdminCreatePlanContainer />
      </QueryProvider>
    );
  }
</script>
```

#### C. **AdminCreatePlanContainer.tsx**

```typescript
// src/components/plans/AdminCreatePlanContainer.tsx
import { useCreatePlan } from "@/hooks/plans/useCreatePlan";
import { AdminPlanForm } from "./AdminPlanForm";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import type { AdminPlanFormSchema } from "@/lib/validation/planFormSchema";

export const AdminCreatePlanContainer: React.FC = () => {
  const { mutateAsync: createPlan, isPending } = useCreatePlan();

  const handleSubmit = async (data: AdminPlanFormSchema) => {
    try {
      const newPlan = await createPlan({
        name: data.name,
        description: data.description || null,
        clientId: data.clientId,
        trainerId: data.trainerId, // Z formularza!
        isHidden: data.isHidden,
        exercises: data.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sortOrder: ex.sortOrder,
          sets: ex.sets,
          reps: ex.reps,
          tempo: ex.tempo || "3-0-3",
          defaultWeight: ex.defaultWeight || null,
        })),
      });

      toast.success("Plan utworzony pomyślnie");
      window.location.href = `/admin/plans/${newPlan.id}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(`Nie udało się utworzyć planu: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    window.location.href = "/admin/plans";
  };

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex items-start md:items-center justify-between md:px-0 px-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nowy plan treningowy</h1>
          <p className="text-muted-foreground">Stwórz nowy plan dla wybranego trenera i podopiecznego</p>
        </div>
      </div>

      <AdminPlanForm
        plan={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isPending}
        mode="create"
      />
    </div>
  );
};
```

---

### 5. **Rozszerzyć PlansListPage dla admina**

**Opcja A: Nowy komponent `AdminPlansListPage.tsx`**

- Fetch wszystkich planów (bez filtra trainerId)
- Dodać kolumnę "Trener" w tabeli
- Filter po trenerze (dropdown)

**Opcja B: Conditional logic w `PlansListPage.tsx`**

- Przekazać prop `isAdmin: boolean`
- Conditional fetch (z/bez trainerId filter)
- Conditional render kolumny "Trener"

**Rekomendacja:** Opcja B (mniej duplikacji kodu)

**Przykład modyfikacji `PlansListPage.tsx`:**

```typescript
interface PlansListPageProps {
  isAdmin?: boolean; // NOWY PROP
}

export const PlansListPage: React.FC<PlansListPageProps> = ({ isAdmin = false }) => {
  // ... existing state

  // Build query - conditional dla admina
  const query: ListPlansQuery = {
    search: debouncedSearch || undefined,
    clientId: clientId || undefined,
    visible: visible !== null ? !visible : undefined,
    sortBy: sortBy as "created_at",
    page,
    limit: 20,
    // Dla admina: nie filtrujemy po trainerId
    // trainerId: !isAdmin ? currentUser.id : undefined,
  };

  // ... reszta kodu
};
```

---

### 6. **Backend changes required**

#### A. **RLS Policies dla admina**

```sql
-- Admin może CRUD wszystkie plany
CREATE POLICY admin_crud_all_plans ON plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin może CRUD wszystkie plan_exercises
CREATE POLICY admin_crud_all_plan_exercises ON plan_exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

#### B. **GET /api/users endpoint**

Sprawdzić czy zwraca:

- Wszystkich clients (jeśli user.role === "admin")
- Wszystkich trainers (jeśli user.role === "admin")

**Obecnie:** `useTrainerClients` filtruje po trainerId  
**Potrzebne:** Admin bypass tego filtra

---

## 📋 Checklist implementacji dla admina

### Nowe komponenty (3):

- [ ] `src/components/plans/AdminClientSelect.tsx`
- [ ] `src/components/plans/TrainerSelect.tsx`
- [ ] `src/components/plans/AdminPlanForm.tsx`

### Nowe containers (3):

- [ ] `src/components/plans/AdminCreatePlanContainer.tsx`
- [ ] `src/components/plans/AdminEditPlanContainer.tsx`
- [ ] `src/components/plans/AdminPlanDetailContainer.tsx` (opcjonalnie, może reużyć)

### Nowe strony Astro (4):

- [ ] `src/pages/admin/plans/index.astro`
- [ ] `src/pages/admin/plans/new.astro`
- [ ] `src/pages/admin/plans/[id].astro`
- [ ] `src/pages/admin/plans/[id]/edit.astro`

### Rozszerzenia istniejących plików:

- [ ] `src/lib/validation/planFormSchema.ts` - dodać `adminPlanFormSchema`
- [ ] `src/hooks/useAllUsers.ts` - **JUŻ UTWORZONY** ✅
- [ ] `src/interface/plans.ts` - dodać `AdminPlanFormSchema` type

### Backend requirements:

- [ ] RLS policies dla admina (CRUD wszystkich planów)
- [ ] GET /api/users - admin bypass trainerId filter
- [ ] GET /api/plans - admin widzenie wszystkich planów (bez trainerId filter)

### Navigation:

- [ ] Dodać link "Plany treningowe" w menu admina (`src/config/navigation.config.ts`)

---

## 🎯 Przykładowy User Flow - Admin

### Tworzenie planu:

1. Admin wchodzi na `/admin/plans`
2. Klika "Stwórz plan"
3. Wypełnia formularz:
   - Nazwa planu: "Plan FBW dla Jan Kowalski"
   - Opis: "..."
   - **Trener:** Wybiera z dropdown (np. "Anna Nowak")
   - **Podopieczny:** Wybiera z dropdown (np. "Jan Kowalski")
   - Widoczność: TAK
   - Dodaje ćwiczenia (drag & drop)
4. Zapisuje → plan utworzony dla trenera "Anna Nowak" i klienta "Jan Kowalski"
5. Email idzie do Jana Kowalskiego (od trenera Anna Nowak)

### Edycja planu:

1. Admin wchodzi na `/admin/plans/:id/edit`
2. Widzi przedwypełniony formularz
3. Może zmienić:
   - Nazwę, opis ✅
   - **Trenera** ✅ (w przeciwieństwie do widoku trenera!)
   - **Podopiecznego** ✅ (w przeciwieństwie do widoku trenera!)
   - Ćwiczenia ✅
4. Zapisuje → plan zaktualizowany

---

## 📊 Porównanie: Trener vs Admin

| Feature                 | Trener                     | Admin                      |
| ----------------------- | -------------------------- | -------------------------- |
| **Wybór podopiecznego** | Tylko swoi clients         | Wszyscy clients w systemie |
| **Wybór trenera**       | Automatycznie current user | Dowolny trener             |
| **Edycja trainerId**    | ❌ Nie można zmienić       | ✅ Może zmienić            |
| **Edycja clientId**     | ❌ Nie można zmienić       | ✅ Może zmienić            |
| **Widoczność planów**   | Tylko własne               | Wszystkie plany            |
| **Filtr po trenerze**   | Brak (zawsze current user) | Dropdown z wyborem trenera |

---

## ⚡ Quick Start dla Developera

### 1. Dla widoku admina - co skopiować:

```bash
# Skopiuj existing componenty jako bazę
cp src/components/plans/ClientSelect.tsx src/components/plans/AdminClientSelect.tsx
cp src/components/plans/PlanForm.tsx src/components/plans/AdminPlanForm.tsx
cp src/components/plans/CreatePlanContainer.tsx src/components/plans/AdminCreatePlanContainer.tsx

# Modyfikuj zgodnie z instrukcjami powyżej
```

### 2. Kolejność implementacji:

1. ✅ **useAllUsers.ts** - już utworzony
2. **TrainerSelect.tsx** - nowy komponent (30 min)
3. **AdminClientSelect.tsx** - modyfikacja ClientSelect (15 min)
4. **adminPlanFormSchema** - rozszerzenie validation (10 min)
5. **AdminPlanForm.tsx** - modyfikacja PlanForm (30 min)
6. **AdminCreatePlanContainer.tsx** - modyfikacja CreatePlanContainer (20 min)
7. **Strony Astro** - 4 pliki (30 min)
8. **Backend RLS** - policies dla admina (20 min)
9. **Navigation config** - dodanie linków (5 min)

**Szacowany czas:** ~2.5 godziny

---

## 📚 Dodatkowe zasoby

- **Plan implementacji trenera:** `.ai/trainer-plans-view-implementation-plan.md`
- **Pełne podsumowanie:** `.ai/trainer-plans-implementation-summary.md`
- **Ten dokument:** `.ai/final-summary-and-admin-todos.md`

---

## ✅ Podsumowanie

### Co mamy (Trener):

- ✅ 100% funkcjonalny widok planów dla trenera
- ✅ 35 plików zaimplementowanych
- ✅ Wszystkie CRUD operacje
- ✅ Drag & drop, validation, optimistic updates
- ✅ Responsive, accessible, tested

### Co potrzebujemy (Admin):

- 🟡 3 nowe komponenty (TrainerSelect, AdminClientSelect, AdminPlanForm)
- 🟡 3 nowe containers (AdminCreatePlan, AdminEditPlan, AdminPlanDetail)
- 🟡 4 nowe strony Astro (/admin/plans/...)
- 🟡 Backend RLS policies dla admina
- 🟡 Navigation config update

**Status:** ~80% kodu można reużyć z widoku trenera! Pozostało głównie dodać pola TrainerSelect i AdminClientSelect + modyfikacje logiki.

---

**Dokument zaktualizowany:** 2024-12-02
