# Plan implementacji widoku Profilu Użytkownika

## 1. Przegląd

Widok profilu użytkownika umożliwia edycję własnych danych przez zalogowanego użytkownika. System przewiduje trzy warianty widoku profilu, dostosowane do roli użytkownika:

- **Admin Profile** (`/admin/profile`) - administrator może edytować swoje podstawowe dane (imię, nazwisko) oraz zmienić hasło. Email jest tylko do odczytu.
- **Trainer Profile** (`/trainer/profile`) - trener może edytować swoje podstawowe dane oraz zmienić hasło. Email jest tylko do odczytu.
- **Client Profile** (`/client/profile`) - podopieczny może edytować swoje podstawowe dane, zmienić hasło oraz zobaczyć informacje o przypisanym trenerze (readonly).

Wszystkie trzy widoki mają wspólną strukturę i logikę, różniąc się jedynie:
- Dodatkową sekcją z informacjami o trenerze (tylko dla clienta)
- Breadcrumb navigation (zależny od roli)
- Różnymi ścieżkami routingu

Widok umożliwia:
- Edycję własnego profilu (imię, nazwisko)
- Zmianę hasła (w osobnej sekcji accordion)
- Przeglądanie informacji o przypisanym trenerze (tylko dla clienta)
- Ostrzeżenie o niezapisanych zmianach
- Walidację danych zgodnie z wymaganiami API

## 2. Routing widoku

Widok profilu będzie dostępny pod trzema różnymi ścieżkami, w zależności od roli użytkownika:

- **Admin:** `/admin/profile` (dostęp: tylko administrator)
- **Trainer:** `/trainer/profile` (dostęp: tylko trener)
- **Client:** `/client/profile` (dostęp: tylko podopieczny)

Każda ścieżka będzie chroniona przez middleware uwierzytelniające i odpowiedni layout (AdminLayout, TrainerLayout, ClientLayout), który automatycznie weryfikuje rolę użytkownika.

## 3. Struktura komponentów

```
ProfilePage (Astro)
└── ProfileContainer (React)
    ├── ProfileHeader
    │   ├── UserAvatar (xl)
    │   ├── User Name (h1)
    │   └── Role Badge
    ├── Card (Basic Info Section)
    │   ├── CardHeader
    │   │   └── CardTitle: "Podstawowe informacje"
    │   └── CardContent
    │       └── ProfileEditForm
    │           ├── FormField (firstName)
    │           ├── FormField (email - readonly with tooltip)
    │           ├── FormField (lastName)
    │           └── Button (Submit)
    ├── TrainerInfoCard (tylko dla clienta)
    │   ├── CardHeader
    │   │   └── CardTitle: "Twój trener"
    │   └── CardContent
    │       ├── UserAvatar (lg)
    │       ├── Trainer Name
    │       └── Trainer Email
    └── Card (Change Password Section)
        ├── CardHeader
        │   └── CardTitle: "Zmiana hasła"
        └── CardContent
            └── Accordion
                └── AccordionItem
                    ├── AccordionTrigger: "Kliknij aby zmienić hasło"
                    └── AccordionContent
                        └── ChangePasswordForm
                            ├── FormField (currentPassword)
                            ├── FormField (newPassword)
                            ├── FormField (confirmPassword)
                            └── Button (Submit)
```

## 4. Szczegóły komponentów

### ProfileContainer

**Opis:**
Główny kontener widoku profilu, który zarządza pobieraniem danych użytkownika, stanem ładowania i błędów. Renderuje wszystkie sekcje profilu w zależności od roli użytkownika.

**Główne elementy:**
- `div` (główny kontener ze spacingiem)
- `ProfileHeader` (nagłówek z avatarem i rolą)
- `Card` z `ProfileEditForm` (edycja podstawowych danych)
- `TrainerInfoCard` (warunkowo dla clienta)
- `Card` z `ChangePasswordForm` w `Accordion` (zmiana hasła)
- Skeleton loaders podczas ładowania
- Error state w przypadku błędu

**Obsługiwane zdarzenia:**
- Montowanie komponentu → pobieranie danych użytkownika przez `useUser` hook
- Unmounting → cleanup

**Warunki walidacji:**
Brak - komponent jest kontenerem, walidacja odbywa się w formularzach.

**Typy:**
- `ProfileContainerProps` (interfejs komponentu)
- `UserDto` (dane użytkownika z API)
- `UserRole` (typ roli użytkownika)

**Propsy:**
```typescript
interface ProfileContainerProps {
  userId: string; // ID zalogowanego użytkownika
  userRole: UserRole; // Rola użytkownika (admin | trainer | client)
}
```

---

### ProfileHeader

**Opis:**
Nagłówek widoku profilu wyświetlający avatar użytkownika, jego imię i nazwisko oraz badge z rolą.

**Główne elementy:**
- `div` (flex container)
- `UserAvatar` z size="xl"
- `div` (text content)
  - `h1` (imię i nazwisko)
  - `Badge` (rola użytkownika)

**Obsługiwane zdarzenia:**
Brak - komponent jest czysto prezentacyjny.

**Warunki walidacji:**
Brak - komponent wyświetla dane, nie waliduje.

**Typy:**
- `ProfileHeaderProps` (interfejs komponentu)
- `UserRole` (typ roli użytkownika)

**Propsy:**
```typescript
interface ProfileHeaderProps {
  userId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
```

---

### ProfileEditForm

**Opis:**
Formularz edycji podstawowych danych użytkownika (imię, nazwisko). Email jest wyświetlany jako pole readonly z tooltipem wyjaśniającym, że nie można go zmienić. Formularz korzysta z React Hook Form i Zod do walidacji.

**Główne elementy:**
- `Form` (provider z react-hook-form)
- `form` element
- `FormField` dla firstName
  - `FormLabel`: "Imię"
  - `FormControl` + `Input`
  - `FormMessage` (błędy walidacji)
- `FormField` dla email (readonly)
  - `FormLabel`: "Email" z `Tooltip`
  - `FormControl` + `Input` (readonly, disabled)
  - `FormDescription`: "Email nie może być zmieniony"
- `FormField` dla lastName
  - `FormLabel`: "Nazwisko"
  - `FormControl` + `Input`
  - `FormMessage` (błędy walidacji)
- `Button` type="submit" (z loading state)

**Obsługiwane zdarzenia:**
- `onSubmit` - wywołanie mutacji `useUpdateUser` z danymi formularza
- `onChange` - tracking zmian dla unsaved changes warning

**Warunki walidacji:**
Zgodnie z `UpdateUserCommandSchema`:
- **firstName:**
  - Wymagane
  - Min 2 znaki
  - Max 50 znaków
  - Automatyczne trim()
- **lastName:**
  - Wymagane
  - Min 2 znaki
  - Max 50 znaków
  - Automatyczne trim()
- **email:**
  - Readonly (nie można edytować)

**Typy:**
- `ProfileEditFormProps` (interfejs komponentu)
- `ProfileEditFormData` (dane formularza)
- `UpdateUserCommand` (command dla API)

**Propsy:**
```typescript
interface ProfileEditFormProps {
  userId: string;
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
  };
}
```

---

### ChangePasswordForm

**Opis:**
Formularz zmiany hasła użytkownika. Wymaga podania obecnego hasła oraz dwukrotnego wprowadzenia nowego hasła (confirm). Formularz używa Supabase Auth do zmiany hasła, nie API endpoint.

**Główne elementy:**
- `Form` (provider z react-hook-form)
- `form` element
- `FormField` dla currentPassword
  - `FormLabel`: "Obecne hasło"
  - `FormControl` + `Input` type="password"
  - `FormMessage`
- `FormField` dla newPassword
  - `FormLabel`: "Nowe hasło"
  - `FormControl` + `Input` type="password"
  - `FormDescription`: Wymagania dotyczące hasła
  - `FormMessage`
- `FormField` dla confirmPassword
  - `FormLabel`: "Potwierdź nowe hasło"
  - `FormControl` + `Input` type="password"
  - `FormMessage`
- `Button` type="submit" (z loading state)

**Obsługiwane zdarzenia:**
- `onSubmit` - wywołanie `useChangePassword` hook (Supabase Auth)
- `onChange` - tracking zmian dla formularza
- Success → reset formularza + toast

**Warunki walidacji:**
Zgodnie z `ConfirmPasswordResetCommandSchema` (dla nowego hasła):
- **currentPassword:**
  - Wymagane
  - Min 1 znak (weryfikacja na backendzie)
- **newPassword:**
  - Wymagane
  - Min 8 znaków
  - Musi zawierać małą literę
  - Musi zawierać wielką literę
  - Musi zawierać cyfrę
  - Musi zawierać znak specjalny
- **confirmPassword:**
  - Wymagane
  - Musi być identyczne z newPassword (custom refine)

**Typy:**
- `ChangePasswordFormProps` (interfejs komponentu)
- `ChangePasswordFormData` (dane formularza)

**Propsy:**
```typescript
interface ChangePasswordFormProps {
  // Brak propsów - komponent autonomiczny
}
```

---

### TrainerInfoCard

**Opis:**
Karta informacyjna o przypisanym trenerze (tylko dla clienta). Wyświetla avatar trenera, imię, nazwisko i email. Dane są readonly.

**Główne elementy:**
- `Card`
- `CardHeader`
  - `CardTitle`: "Twój trener"
- `CardContent`
  - `div` (flex container)
    - `UserAvatar` size="lg"
    - `div` (text content)
      - `p` (imię i nazwisko trenera)
      - `p` (email trenera)

**Obsługiwane zdarzenia:**
Brak - komponent jest czysto prezentacyjny.

**Warunki walidacji:**
Brak - komponent wyświetla dane, nie waliduje.

**Typy:**
- `TrainerInfoCardProps` (interfejs komponentu)
- `UserDto` (dane trenera)

**Propsy:**
```typescript
interface TrainerInfoCardProps {
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null; // null jeśli trener nie jest przypisany
}
```

---

## 5. Typy

### DTO i Interfejsy API (istniejące)

```typescript
// src/interface/users.ts
export interface UserDto {
  id: string;
  email: string;
  role: "admin" | "trainer" | "client";
  isActive: boolean;
  firstName: string | null;
  lastName: string | null;
  trainerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserCommand {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  trainerId?: string;
}

// src/interface/auth.ts
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
}
```

### Nowe typy ViewModel dla widoku profilu

```typescript
// src/interface/users.ts (do dodania)

/** Dane formularza edycji profilu */
export interface ProfileEditFormData {
  firstName: string;
  lastName: string;
  // email nie jest edytowalny, więc nie ma go w formData
}

/** Propsy głównego kontenera profilu */
export interface ProfileContainerProps {
  userId: string;
  userRole: UserRole;
}

/** Propsy nagłówka profilu */
export interface ProfileHeaderProps {
  userId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/** Propsy formularza edycji profilu */
export interface ProfileEditFormProps {
  userId: string;
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

/** Dane formularza zmiany hasła */
export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Propsy formularza zmiany hasła */
export interface ChangePasswordFormProps {
  // Brak propsów - komponent autonomiczny
}

/** Propsy karty informacyjnej o trenerze */
export interface TrainerInfoCardProps {
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

/** ViewModel dla trenera (uproszczony) */
export interface TrainerViewModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
```

### Zod Schema dla walidacji formularza profilu

```typescript
// src/lib/validation.ts (do dodania)

/** Validation schema for Profile Edit Form */
export const ProfileEditFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "Imię musi mieć minimum 2 znaki")
    .max(50, "Imię może mieć maksymalnie 50 znaków")
    .trim(),
  lastName: z
    .string()
    .min(2, "Nazwisko musi mieć minimum 2 znaki")
    .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
    .trim(),
});

/** Validation schema for Change Password Form */
export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Obecne hasło jest wymagane"),
    newPassword: z
      .string()
      .min(8, "Nowe hasło musi mieć minimum 8 znaków")
      .refine(
        (pwd) =>
          /[a-z]/.test(pwd) &&
          /[A-Z]/.test(pwd) &&
          /[0-9]/.test(pwd) &&
          /[^a-zA-Z0-9]/.test(pwd),
        {
          message:
            "Hasło musi zawierać małą literę, wielką literę, cyfrę i znak specjalny",
        }
      ),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });
```

## 6. Zarządzanie stanem

### Stan globalny

Aplikacja używa kontekstu Astro layouts do przekazania `user` obiektu z middleware. Dane użytkownika są dostępne przez `locals.user` w Astro i przekazywane jako props do React komponentów.

### Stan lokalny (React Query)

**Hook `useUser`** - pobieranie danych użytkownika

```typescript
// src/hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import type { UserDto } from "@/interface";

async function fetchUser(userId: string): Promise<UserDto> {
  const response = await fetch(`/api/users/${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user");
  }
  
  return response.json();
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minut
  });
}
```

**Hook `useUpdateUser`** - aktualizacja danych użytkownika

```typescript
// src/hooks/useUpdateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserDto, UpdateUserCommand } from "@/interface";

async function updateUser(
  userId: string,
  command: UpdateUserCommand
): Promise<UserDto> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update user");
  }

  return response.json();
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, command }: { userId: string; command: UpdateUserCommand }) =>
      updateUser(userId, command),
    onSuccess: (data, variables) => {
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
      
      toast.success("Profil zaktualizowany pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować profilu");
    },
  });
}
```

**Hook `useChangePassword`** - zmiana hasła (Supabase Auth)

```typescript
// src/hooks/useChangePassword.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabaseClient } from "@/db/supabase.client";

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

async function changePassword(params: ChangePasswordParams): Promise<void> {
  // Najpierw weryfikujemy obecne hasło przez próbę ponownego zalogowania
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user?.email) {
    throw new Error("Nie znaleziono użytkownika");
  }

  // Weryfikacja obecnego hasła
  const { error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password: params.currentPassword,
  });

  if (signInError) {
    throw new Error("Obecne hasło jest nieprawidłowe");
  }

  // Zmiana hasła
  const { error: updateError } = await supabaseClient.auth.updateUser({
    password: params.newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message || "Nie udało się zmienić hasła");
  }
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Hasło zostało zmienione pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zmienić hasła");
    },
  });
}
```

**Hook `useTrainer`** - pobieranie danych trenera (dla clienta)

```typescript
// src/hooks/useTrainer.ts
import { useQuery } from "@tanstack/react-query";
import type { UserDto } from "@/interface";

async function fetchTrainer(trainerId: string): Promise<UserDto> {
  const response = await fetch(`/api/users/${trainerId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch trainer");
  }
  
  return response.json();
}

export function useTrainer(trainerId: string | null) {
  return useQuery({
    queryKey: ["users", trainerId],
    queryFn: () => fetchTrainer(trainerId!),
    enabled: !!trainerId, // Tylko jeśli trainerId istnieje
    staleTime: 10 * 60 * 1000, // 10 minut (dane trenera rzadko się zmieniają)
  });
}
```

### Stan formularzy (React Hook Form)

Każdy formularz zarządza swoim własnym stanem przez `useForm` hook z react-hook-form. Formularze śledzą:
- Wartości pól
- Błędy walidacji
- Stan `isDirty` (czy formularz został zmieniony)
- Stan `isSubmitting` (czy formularz jest w trakcie wysyłania)

### Unsaved changes warning

ProfileEditForm implementuje ostrzeżenie przed opuszczeniem strony z niezapisanymi zmianami:

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (form.formState.isDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [form.formState.isDirty]);
```

## 7. Integracja API

### Endpoint: GET /api/users/:id

**Cel:** Pobranie danych użytkownika

**Request:**
- Metoda: `GET`
- URL: `/api/users/:id`
- Headers: `Authorization: Bearer <token>` (automatycznie przez Astro middleware)
- Path params:
  - `id` (string, UUID) - ID użytkownika

**Response: 200 OK**
```typescript
// Typ: UserDto
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin" | "trainer" | "client",
  "isActive": true,
  "firstName": "Jan",
  "lastName": "Kowalski",
  "trainerId": "uuid" | null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Error responses:**
- `401 Unauthorized` - brak autoryzacji
- `403 Forbidden` - brak dostępu (np. próba dostępu do innego użytkownika)
- `404 Not Found` - użytkownik nie istnieje

**Autoryzacja:**
- Administratorzy: mogą pobrać dane dowolnego użytkownika
- Trenerzy: mogą pobrać swoje dane i dane swoich podopiecznych
- Clienty: mogą pobrać tylko swoje dane

---

### Endpoint: PUT /api/users/:id

**Cel:** Aktualizacja danych użytkownika (tylko własnych danych - firstName, lastName)

**Request:**
- Metoda: `PUT`
- URL: `/api/users/:id`
- Headers:
  - `Authorization: Bearer <token>` (automatycznie przez middleware)
  - `Content-Type: application/json`
- Path params:
  - `id` (string, UUID) - ID użytkownika
- Body:
```typescript
// Typ: UpdateUserCommand (pola opcjonalne, ale co najmniej jedno wymagane)
{
  "firstName": "Jan",      // opcjonalne
  "lastName": "Kowalski"   // opcjonalne
  // email - nie wysyłamy (readonly)
  // isActive - tylko admin może zmieniać
  // trainerId - tylko admin może zmieniać
}
```

**Response: 200 OK**
```typescript
// Typ: UserDto
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin" | "trainer" | "client",
  "isActive": true,
  "firstName": "Jan",
  "lastName": "Kowalski",
  "trainerId": "uuid" | null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Error responses:**
- `400 Bad Request` - błąd walidacji (np. za krótkie imię)
  ```json
  {
    "error": "Validation failed",
    "details": {
      "firstName": "First name must be at least 2 characters"
    }
  }
  ```
- `401 Unauthorized` - brak autoryzacji
- `403 Forbidden` - brak uprawnień (np. próba zmiany danych innego użytkownika)
- `404 Not Found` - użytkownik nie istnieje
- `409 Conflict` - email już istnieje (nie dotyczy naszego przypadku, bo email nie jest edytowalny)

**Autoryzacja:**
- Użytkownik może aktualizować tylko swoje dane
- W kontekście widoku profilu, użytkownik aktualizuje TYLKO swoje dane (userId z propsa === zalogowany userId)

**Walidacja (backend - UpdateUserCommandSchema):**
- `firstName`: min 2 znaki, max 50 znaków, trim()
- `lastName`: min 2 znaki, max 50 znaków, trim()
- Co najmniej jedno pole musi być przekazane

---

### Zmiana hasła (Supabase Auth)

Zmiana hasła odbywa się bezpośrednio przez Supabase Auth, **NIE** przez API endpoint `/api/users/:id`.

**Proces:**
1. Weryfikacja obecnego hasła przez `supabase.auth.signInWithPassword()`
2. Jeśli weryfikacja OK → zmiana hasła przez `supabase.auth.updateUser()`
3. Jeśli weryfikacja failed → error "Obecne hasło jest nieprawidłowe"

**Kod w hooku `useChangePassword`:**
```typescript
// 1. Pobierz zalogowanego użytkownika
const { data: { user } } = await supabaseClient.auth.getUser();

// 2. Weryfikuj obecne hasło
const { error: signInError } = await supabaseClient.auth.signInWithPassword({
  email: user.email,
  password: currentPassword,
});

if (signInError) {
  throw new Error("Obecne hasło jest nieprawidłowe");
}

// 3. Zmień hasło
const { error: updateError } = await supabaseClient.auth.updateUser({
  password: newPassword,
});
```

## 8. Interakcje użytkownika

### 8.1. Wejście na widok profilu

**Akcja użytkownika:**
- Użytkownik klika link "Profil" w menu nawigacji lub user menu

**Oczekiwany wynik:**
1. System przekierowuje na odpowiednią ścieżkę w zależności od roli:
   - Admin → `/admin/profile`
   - Trainer → `/trainer/profile`
   - Client → `/client/profile`
2. Wyświetla się loader (skeleton) podczas ładowania danych
3. Po załadowaniu wyświetla się pełny widok profilu z danymi użytkownika
4. Breadcrumb wyświetla odpowiednią ścieżkę:
   - Admin: "Admin > Profil"
   - Trainer: "Trener > Profil"
   - Client: "Profil"

**Scenariusze błędów:**
- Błąd sieci → wyświetla error state z przyciskiem "Spróbuj ponownie"
- Użytkownik nie istnieje → error state
- Brak autoryzacji → redirect na stronę logowania

---

### 8.2. Edycja podstawowych danych (imię, nazwisko)

**Akcja użytkownika:**
1. Użytkownik wprowadza zmiany w polach "Imię" lub "Nazwisko"
2. Klikając "Zapisz zmiany"

**Oczekiwany wynik:**
1. Walidacja frontendu (natychmiastowa):
   - Sprawdzenie długości (min 2, max 50 znaków)
   - Wyświetlenie błędów pod polami, jeśli są
2. Jeśli walidacja OK:
   - Przycisk "Zapisz zmiany" pokazuje loader
   - Formularz jest disabled (nie można edytować podczas zapisywania)
3. Wysłanie requestu PUT `/api/users/:id` z danymi
4. Po sukcesie:
   - Toast: "Profil zaktualizowany pomyślnie" (zielony)
   - Formularz reset do nowych wartości (isDirty = false)
   - Dane w headerze aktualizują się automatycznie (React Query invalidation)
   - Button przestaje być w stanie loading
5. Unsaved changes warning nie pojawia się już (isDirty = false)

**Scenariusze błędów:**
- Błąd walidacji backend (400):
  - Toast: "Błąd walidacji: [szczegóły]" (czerwony)
  - Wyświetlenie błędów pod odpowiednimi polami
- Błąd autoryzacji (401/403):
  - Toast: "Brak uprawnień do edycji profilu"
  - Redirect na stronę logowania (401)
- Błąd sieci:
  - Toast: "Nie udało się zaktualizować profilu. Spróbuj ponownie."
- Pozostaje w stanie edycji (można poprawić i spróbować ponownie)

---

### 8.3. Próba opuszczenia strony z niezapisanymi zmianami

**Akcja użytkownika:**
- Użytkownik wprowadza zmiany w formularzu (isDirty = true)
- Próbuje opuścić stronę (klik na link, zamknięcie karty, przycisk wstecz)

**Oczekiwany wynik:**
1. Przeglądarka wyświetla natywny dialog: "Czy na pewno chcesz opuścić tę stronę? Wprowadzone zmiany nie zostaną zapisane."
2. Użytkownik może:
   - Anulować → pozostaje na stronie
   - OK → opuszcza stronę bez zapisywania

**Uwaga:** To jest natywny mechanizm przeglądarki (`beforeunload` event). Nie można customizować tekstu w nowoczesnych przeglądarkach.

---

### 8.4. Kliknięcie "Zmień hasło" (rozwinięcie accordion)

**Akcja użytkownika:**
- Użytkownik klika na "Kliknij aby zmienić hasło" w sekcji "Zmiana hasła"

**Oczekiwany wynik:**
1. Accordion się rozwija z animacją slide-down
2. Wyświetla się formularz zmiany hasła z trzema polami:
   - Obecne hasło
   - Nowe hasło
   - Potwierdź nowe hasło
3. Wszystkie pola są puste i gotowe do wypełnienia
4. Ikona chevron obraca się o 180° (wskazuje, że sekcja jest rozwinięta)

---

### 8.5. Zmiana hasła

**Akcja użytkownika:**
1. Użytkownik wypełnia formularz zmiany hasła:
   - Obecne hasło
   - Nowe hasło
   - Potwierdź nowe hasło
2. Klika "Zmień hasło"

**Oczekiwany wynik:**
1. Walidacja frontendu (natychmiastowa):
   - Obecne hasło: wymagane
   - Nowe hasło: min 8 znaków + wymagania (wielka, mała, cyfra, znak specjalny)
   - Potwierdź hasło: musi być identyczne z nowym hasłem
   - Wyświetlenie błędów pod polami, jeśli są
2. Jeśli walidacja OK:
   - Przycisk "Zmień hasło" pokazuje loader
   - Formularz jest disabled
3. Proces zmiany hasła:
   a. Weryfikacja obecnego hasła (sign in z obecnym hasłem)
   b. Jeśli OK → zmiana hasła (update user password)
4. Po sukcesie:
   - Toast: "Hasło zostało zmienione pomyślnie" (zielony)
   - Formularz jest resetowany (wszystkie pola puste)
   - Accordion może pozostać rozwinięty lub zwinąć się (opcjonalnie)
   - Button przestaje być w stanie loading

**Scenariusze błędów:**
- Obecne hasło nieprawidłowe:
  - Toast: "Obecne hasło jest nieprawidłowe" (czerwony)
  - Fokus wraca na pole "Obecne hasło"
- Nowe hasło nie spełnia wymagań:
  - Błędy walidacji pod polem "Nowe hasło"
- Hasła nie są identyczne:
  - Błąd walidacji pod polem "Potwierdź hasło": "Hasła nie są identyczne"
- Błąd Supabase:
  - Toast: "[Komunikat błędu z Supabase]" (czerwony)
- Błąd sieci:
  - Toast: "Nie udało się zmienić hasła. Spróbuj ponownie."

---

### 8.6. Najechanie na readonly Email (tooltip)

**Akcja użytkownika:**
- Użytkownik najeżdża myszką na label "Email" lub ikonę informacyjną obok

**Oczekiwany wynik:**
1. Po krótkiej chwili (delay ~200ms) pojawia się tooltip
2. Tooltip zawiera tekst: "Email nie może być zmieniony. Skontaktuj się z administratorem, jeśli potrzebujesz zmiany adresu email."
3. Tooltip znika po zjechaniu myszką

**Implementacja:**
```typescript
<FormLabel>
  Email
  <Tooltip>
    <TooltipTrigger asChild>
      <InfoIcon className="inline ml-1 h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      Email nie może być zmieniony. Skontaktuj się z administratorem.
    </TooltipContent>
  </Tooltip>
</FormLabel>
```

---

### 8.7. Przeglądanie informacji o trenerze (tylko Client)

**Akcja użytkownika:**
- Client wchodzi na widok profilu

**Oczekiwany wynik:**
1. Poniżej sekcji "Podstawowe informacje" wyświetla się karta "Twój trener"
2. Karta zawiera:
   - Avatar trenera (large)
   - Imię i nazwisko trenera
   - Email trenera
3. Wszystkie dane są readonly (nie można ich edytować)
4. Jeśli trener nie jest przypisany (trainerId = null):
   - Wyświetla się komunikat: "Nie masz przypisanego trenera. Skontaktuj się z administratorem."

**Loader state:**
- Podczas ładowania danych trenera (useTrainer hook) wyświetla się skeleton loader wewnątrz karty

**Error state:**
- Jeśli nie udało się pobrać danych trenera:
  - Wyświetla się komunikat: "Nie udało się pobrać danych trenera."
  - Przycisk "Spróbuj ponownie"

---

## 9. Warunki i walidacja

### 9.1. Warunki dostępu do widoku

**Warunek:** Użytkownik musi być zalogowany i mieć odpowiednią rolę

**Weryfikacja:**
- Middleware Astro sprawdza, czy użytkownik jest zalogowany (`locals.user`)
- Layout (AdminLayout, TrainerLayout, ClientLayout) weryfikuje rolę użytkownika
- Jeśli warunek nie spełniony → redirect na `/login` (brak zalogowania) lub dashboard odpowiedni do roli (zła rola)

**Komponenty dotknięte:** Astro middleware, Layout components

**Wpływ na UI:**
- Użytkownik nie zalogowany → redirect na login
- Użytkownik z inną rolą → redirect na jego dashboard

---

### 9.2. Walidacja pola "Imię" (firstName)

**Warunki:**
- **Wymagane:** Pole nie może być puste
- **Min długość:** 2 znaki
- **Max długość:** 50 znaków
- **Automatyczne:** trim() (usunięcie spacji z początku i końca)

**Gdzie weryfikowane:**
- Frontend: React Hook Form + Zod (`ProfileEditFormSchema`)
- Backend: Zod schema (`UpdateUserCommandSchema`)

**Komponenty dotknięte:** ProfileEditForm

**Wpływ na UI:**
- Błąd walidacji wyświetla się pod polem:
  - Puste pole: "Imię jest wymagane" (required error z react-hook-form)
  - Za krótkie: "Imię musi mieć minimum 2 znaki"
  - Za długie: "Imię może mieć maksymalnie 50 znaków"
- Pole ma czerwony border
- Przycisk "Zapisz zmiany" nie jest disabled (walidacja on submit)

---

### 9.3. Walidacja pola "Nazwisko" (lastName)

**Warunki:**
- **Wymagane:** Pole nie może być puste
- **Min długość:** 2 znaki
- **Max długość:** 50 znaków
- **Automatyczne:** trim() (usunięcie spacji z początku i końca)

**Gdzie weryfikowane:**
- Frontend: React Hook Form + Zod (`ProfileEditFormSchema`)
- Backend: Zod schema (`UpdateUserCommandSchema`)

**Komponenty dotknięte:** ProfileEditForm

**Wpływ na UI:**
- Błąd walidacji wyświetla się pod polem:
  - Puste pole: "Nazwisko jest wymagane"
  - Za krótkie: "Nazwisko musi mieć minimum 2 znaki"
  - Za długie: "Nazwisko może mieć maksymalnie 50 znaków"
- Pole ma czerwony border
- Przycisk "Zapisz zmiany" nie jest disabled (walidacja on submit)

---

### 9.4. Email readonly

**Warunek:** Email nie może być edytowany przez użytkownika

**Gdzie weryfikowane:**
- Frontend: Input ma atrybuty `readonly` i `disabled`
- Backend: Pole `email` nie jest wysyłane w request body

**Komponenty dotknięte:** ProfileEditForm

**Wpływ na UI:**
- Pole jest readonly (szary kolor, brak kursora edycji)
- Tooltip wyjaśnia, dlaczego nie można edytować
- FormDescription pod polem: "Email nie może być zmieniony"

---

### 9.5. Walidacja pola "Obecne hasło" (currentPassword)

**Warunki:**
- **Wymagane:** Pole nie może być puste
- **Weryfikacja:** Backend weryfikuje, czy hasło jest prawidłowe (sign in)

**Gdzie weryfikowane:**
- Frontend: React Hook Form + Zod (`ChangePasswordFormSchema`)
- Backend: Supabase Auth (sign in with password)

**Komponenty dotknięte:** ChangePasswordForm

**Wpływ na UI:**
- Błąd walidacji frontendu:
  - Puste pole: "Obecne hasło jest wymagane"
- Błąd weryfikacji backendu:
  - Toast: "Obecne hasło jest nieprawidłowe" (czerwony)
- Pole ma czerwony border w przypadku błędu

---

### 9.6. Walidacja pola "Nowe hasło" (newPassword)

**Warunki:**
- **Wymagane:** Pole nie może być puste
- **Min długość:** 8 znaków
- **Złożoność:**
  - Musi zawierać małą literę (a-z)
  - Musi zawierać wielką literę (A-Z)
  - Musi zawierać cyfrę (0-9)
  - Musi zawierać znak specjalny (!@#$%^&* itp.)

**Gdzie weryfikowane:**
- Frontend: React Hook Form + Zod (`ChangePasswordFormSchema`)
- Backend: Supabase Auth policies (opcjonalnie, w zależności od konfiguracji)

**Komponenty dotknięte:** ChangePasswordForm

**Wpływ na UI:**
- Błąd walidacji wyświetla się pod polem:
  - Za krótkie: "Nowe hasło musi mieć minimum 8 znaków"
  - Brak wymaganych znaków: "Hasło musi zawierać małą literę, wielką literę, cyfrę i znak specjalny"
- FormDescription wyświetla wymagania:
  - "Min. 8 znaków, wielka litera, mała litera, cyfra, znak specjalny"
- Pole ma czerwony border w przypadku błędu
- Możliwe dodanie live validation (pokazanie spełnionych/niespełnionych wymagań podczas wpisywania)

---

### 9.7. Walidacja pola "Potwierdź hasło" (confirmPassword)

**Warunki:**
- **Wymagane:** Pole nie może być puste
- **Identyczność:** Musi być identyczne z polem "Nowe hasło"

**Gdzie weryfikowane:**
- Frontend: React Hook Form + Zod (`ChangePasswordFormSchema` z custom refine)

**Komponenty dotknięte:** ChangePasswordForm

**Wpływ na UI:**
- Błąd walidacji wyświetla się pod polem:
  - Puste pole: "Potwierdzenie hasła jest wymagane"
  - Niezgodność: "Hasła nie są identyczne"
- Pole ma czerwony border w przypadku błędu
- Walidacja jest triggowana:
  - On blur (po opuszczeniu pola)
  - On submit

---

### 9.8. Co najmniej jedno pole musi być zmienione (Update User)

**Warunek:** Backend wymaga, aby przynajmniej jedno pole zostało przekazane w UpdateUserCommand

**Gdzie weryfikowane:**
- Backend: Zod schema (`UpdateUserCommandSchema` z custom refine)

**Komponenty dotknięte:** ProfileEditForm

**Wpływ na UI:**
- Frontend: React Hook Form automatycznie śledzi zmiany (isDirty)
- Jeśli użytkownik kliknie "Zapisz zmiany" bez wprowadzenia zmian:
  - Backend zwróci błąd 400
  - Toast: "Musisz wprowadzić co najmniej jedną zmianę"
- **Opcjonalna optymalizacja:** Disable przycisku "Zapisz zmiany", gdy form.formState.isDirty === false

---

### 9.9. Autoryzacja - użytkownik może edytować tylko swoje dane

**Warunek:** Użytkownik może aktualizować tylko swój własny profil (userId === zalogowany userId)

**Gdzie weryfikowane:**
- Frontend: Komponent otrzymuje `userId` z props, który jest zawsze ID zalogowanego użytkownika
- Backend: Service layer (`updateUser`) sprawdza, czy currentUser.id === userId

**Komponenty dotknięte:** ProfileContainer, ProfileEditForm, ChangePasswordForm

**Wpływ na UI:**
- Frontend zawsze wysyła request do `/api/users/${zalogowany_userId}`
- Jeśli backend zwróci 403:
  - Toast: "Brak uprawnień do edycji profilu"
  - Możliwy redirect na dashboard (nie powinno się zdarzyć w normalnym flow)

---

### 9.10. Trener musi być przypisany (tylko dla Clienta)

**Warunek:** Client może mieć przypisanego trenera (trainerId) lub nie (null)

**Gdzie weryfikowane:**
- Frontend: useTrainer hook sprawdza, czy trainerId istnieje (enabled: !!trainerId)

**Komponenty dotknięte:** TrainerInfoCard

**Wpływ na UI:**
- Jeśli trainerId === null:
  - TrainerInfoCard wyświetla komunikat: "Nie masz przypisanego trenera. Skontaktuj się z administratorem."
  - Brak avatara i danych trenera
- Jeśli trainerId !== null:
  - useTrainer hook pobiera dane trenera
  - Wyświetlają się dane trenera w karcie

---

## 10. Obsługa błędów

### 10.1. Błąd ładowania danych użytkownika

**Scenariusz:**
- useUser hook zwraca error (np. błąd sieci, 404, 403)

**Obsługa:**
1. ProfileContainer wyświetla error state zamiast formularzy:
   ```typescript
   if (userQuery.isError) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
         <AlertCircle className="h-12 w-12 text-destructive" />
         <p className="text-lg font-semibold">Nie udało się załadować profilu</p>
         <p className="text-muted-foreground">
           {userQuery.error?.message || "Wystąpił nieoczekiwany błąd"}
         </p>
         <Button onClick={() => userQuery.refetch()}>Spróbuj ponownie</Button>
       </div>
     );
   }
   ```
2. Użytkownik może kliknąć "Spróbuj ponownie" → retry query

**Komunikaty dla użytkownika:**
- 404: "Nie znaleziono użytkownika"
- 403: "Brak dostępu do profilu"
- Network error: "Nie udało się połączyć z serwerem"
- Default: "Wystąpił nieoczekiwany błąd"

---

### 10.2. Błąd aktualizacji profilu (PUT /api/users/:id)

**Scenariusz:**
- useUpdateUser mutation zwraca error

**Obsługa:**
1. Toast error z komunikatem błędu (obsługa w onError callback)
2. Formularz pozostaje w stanie edycji (użytkownik może poprawić i spróbować ponownie)
3. Przyciski wracają do stanu aktywnego (loading = false)

**Typy błędów:**
- **400 Bad Request (walidacja):**
  - Toast: "Błąd walidacji: [szczegóły]"
  - Wyświetlenie błędów pod odpowiednimi polami (jeśli backend zwróci szczegóły)
- **401 Unauthorized:**
  - Toast: "Sesja wygasła. Zaloguj się ponownie."
  - Redirect na stronę logowania (opcjonalnie)
- **403 Forbidden:**
  - Toast: "Brak uprawnień do edycji profilu"
- **404 Not Found:**
  - Toast: "Nie znaleziono użytkownika"
- **500 Internal Server Error:**
  - Toast: "Błąd serwera. Spróbuj ponownie później."
- **Network Error:**
  - Toast: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."

**Logging:**
- Wszystkie błędy są logowane w konsoli dla celów debugowania

---

### 10.3. Błąd zmiany hasła

**Scenariusz:**
- useChangePassword mutation zwraca error

**Obsługa:**
1. Toast error z komunikatem błędu (obsługa w onError callback)
2. Formularz pozostaje wypełniony (użytkownik nie traci wpisanych danych)
3. Przycisk "Zmień hasło" wraca do stanu aktywnego

**Typy błędów:**
- **Nieprawidłowe obecne hasło:**
  - Toast: "Obecne hasło jest nieprawidłowe"
  - Fokus przeniesiony na pole "Obecne hasło"
- **Nowe hasło nie spełnia wymagań Supabase:**
  - Toast: "[Komunikat błędu z Supabase]" (np. "Password should be at least 8 characters")
- **Błąd Supabase Auth:**
  - Toast: "Nie udało się zmienić hasła: [szczegóły]"
- **Network Error:**
  - Toast: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."

**Logging:**
- Błędy są logowane w konsoli

---

### 10.4. Błąd ładowania danych trenera (tylko Client)

**Scenariusz:**
- useTrainer hook zwraca error

**Obsługa:**
1. TrainerInfoCard wyświetla error state:
   ```typescript
   if (trainerQuery.isError) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Twój trener</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex flex-col items-center space-y-3 py-4">
             <AlertCircle className="h-8 w-8 text-destructive" />
             <p className="text-sm text-muted-foreground">
               Nie udało się pobrać danych trenera
             </p>
             <Button variant="outline" size="sm" onClick={() => trainerQuery.refetch()}>
               Spróbuj ponownie
             </Button>
           </div>
         </CardContent>
       </Card>
     );
   }
   ```
2. Użytkownik może kliknąć "Spróbuj ponownie" → retry query

**Komunikaty:**
- 404: "Nie znaleziono trenera"
- 403: "Brak dostępu do danych trenera"
- Network error: "Nie udało się połączyć z serwerem"

---

### 10.5. Walidacja frontendu nie przeszła

**Scenariusz:**
- Użytkownik wypełnia formularz z błędami walidacji
- Klika "Zapisz" / "Zmień hasło"

**Obsługa:**
1. React Hook Form zatrzymuje submit
2. Błędy walidacji wyświetlają się pod odpowiednimi polami
3. Pierwsze pole z błędem otrzymuje fokus (automatycznie przez react-hook-form)
4. Brak toastu (walidacja frontendowa nie wymaga toastu)

**Przykłady:**
- "Imię musi mieć minimum 2 znaki"
- "Hasło musi zawierać małą literę, wielką literę, cyfrę i znak specjalny"
- "Hasła nie są identyczne"

---

### 10.6. Nieoczekiwany błąd (catch-all)

**Scenariusz:**
- Błąd nie pasuje do żadnej z powyższych kategorii
- Błąd JavaScript (runtime error)

**Obsługa:**
1. Error boundary (React) łapie błąd renderowania
2. Toast z ogólnym komunikatem: "Wystąpił nieoczekiwany błąd"
3. Błąd jest logowany w konsoli z pełnym stack trace
4. Możliwość odświeżenia strony

**Implementacja Error Boundary (opcjonalna dla widoku profilu):**
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  // ... standard error boundary implementation
}
```

**Komunikat:**
- Toast: "Wystąpił nieoczekiwany błąd. Odśwież stronę."
- Przycisk: "Odśwież stronę" → `window.location.reload()`

---

## 11. Kroki implementacji

### Krok 1: Dodanie nowych typów do interfejsów

**Cel:** Dodanie TypeScript interfejsów dla widoku profilu

**Pliki do edycji:**
- `src/interface/users.ts`

**Działania:**
1. Dodaj nowe interfejsy ViewModel:
   - `ProfileEditFormData`
   - `ProfileContainerProps`
   - `ProfileHeaderProps`
   - `ProfileEditFormProps`
   - `ChangePasswordFormData`
   - `ChangePasswordFormProps`
   - `TrainerInfoCardProps`
   - `TrainerViewModel`
2. Export interfejsów z `src/interface/index.ts`
3. Upewnij się, że wszystkie pola są poprawnie typowane zgodnie z `UserDto`

**Weryfikacja:**
- TypeScript kompiluje się bez błędów
- Wszystkie typy są dostępne przez import z `@/interface`

---

### Krok 2: Dodanie validation schemas

**Cel:** Dodanie Zod schemas dla walidacji formularzy profilu

**Pliki do edycji:**
- `src/lib/validation.ts`

**Działania:**
1. Dodaj `ProfileEditFormSchema`:
   - firstName: min 2, max 50, trim
   - lastName: min 2, max 50, trim
2. Dodaj `ChangePasswordFormSchema`:
   - currentPassword: required
   - newPassword: min 8 + complexity requirements
   - confirmPassword: required + must match newPassword
   - Custom refine dla sprawdzenia identyczności haseł
3. Export schemas

**Weryfikacja:**
- Schemas kompilują się bez błędów
- Testy walidacji (opcjonalnie):
  ```typescript
  describe('ProfileEditFormSchema', () => {
    it('should validate correct data', () => {
      const result = ProfileEditFormSchema.parse({
        firstName: 'Jan',
        lastName: 'Kowalski'
      });
      expect(result).toBeDefined();
    });
    
    it('should reject too short firstName', () => {
      expect(() => {
        ProfileEditFormSchema.parse({
          firstName: 'J',
          lastName: 'Kowalski'
        });
      }).toThrow();
    });
  });
  ```

---

### Krok 3: Implementacja hooków React Query

**Cel:** Stworzenie custom hooks do zarządzania stanem i API calls

**Pliki do stworzenia:**
- `src/hooks/useUser.ts`
- `src/hooks/useUpdateUser.ts`
- `src/hooks/useChangePassword.ts`
- `src/hooks/useTrainer.ts`

**Działania:**

**3.1. useUser:**
- Implementacja `fetchUser(userId)` function
- useQuery z queryKey: `["users", userId]`
- staleTime: 5 minut
- Error handling

**3.2. useUpdateUser:**
- Implementacja `updateUser(userId, command)` function
- useMutation
- onSuccess: invalidate queries + toast success
- onError: toast error

**3.3. useChangePassword:**
- Implementacja `changePassword({ currentPassword, newPassword })` function
- Weryfikacja obecnego hasła przez Supabase Auth (signInWithPassword)
- Zmiana hasła przez supabase.auth.updateUser()
- useMutation
- onSuccess: toast + reset form
- onError: toast error z szczegółami

**3.4. useTrainer:**
- useQuery do pobierania danych trenera
- enabled: !!trainerId (tylko gdy trainerId istnieje)
- queryKey: `["users", trainerId]`
- staleTime: 10 minut

**Weryfikacja:**
- Hooks kompilują się bez błędów TypeScript
- Manualne testy API calls (przez Postman lub console)
- Sprawdzenie, czy React Query devtools pokazują poprawne queries/mutations

---

### Krok 4: Implementacja komponentu ProfileHeader

**Cel:** Stworzenie nagłówka profilu z avatarem i rolą

**Pliki do stworzenia:**
- `src/components/profile/ProfileHeader.tsx`

**Działania:**
1. Stwórz komponent funkcyjny `ProfileHeader`
2. Przyjmij propsy: `ProfileHeaderProps`
3. Renderuj:
   - `UserAvatar` z size="xl"
   - `h1` z imieniem i nazwiskiem
   - `Badge` z rolą (wykorzystaj istniejący Badge component)
4. Stylowanie:
   - Flex layout (gap między avatarem a tekstem)
   - Responsive design (column na mobile, row na desktop)
   - Odpowiednie spacing

**Przykładowa struktura:**
```typescript
export function ProfileHeader({ userId, firstName, lastName, role }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <UserAvatar userId={userId} firstName={firstName} lastName={lastName} size="xl" />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{firstName} {lastName}</h1>
        <Badge variant="secondary">
          {role === 'admin' ? 'Administrator' : role === 'trainer' ? 'Trener' : 'Podopieczny'}
        </Badge>
      </div>
    </div>
  );
}
```

**Weryfikacja:**
- Komponent renderuje się poprawnie
- Avatar wyświetla inicjały
- Role badge ma odpowiedni tekst i styl

---

### Krok 5: Implementacja komponentu ProfileEditForm

**Cel:** Stworzenie formularza edycji podstawowych danych

**Pliki do stworzenia:**
- `src/components/profile/ProfileEditForm.tsx`

**Działania:**
1. Stwórz komponent funkcyjny `ProfileEditForm`
2. Zaimplementuj useForm z zodResolver i ProfileEditFormSchema
3. Zaimportuj useUpdateUser hook
4. Stwórz handler onSubmit:
   - Wywołaj mutację updateUser
   - Po sukcesie: reset form z nowymi wartościami
5. Zaimplementuj unsaved changes warning (beforeunload)
6. Renderuj formularz z polami:
   - firstName (Input)
   - email (Input readonly + Tooltip)
   - lastName (Input)
   - Submit button z loading state
7. Obsłuż stany: isSubmitting, errors, isDirty

**Przykładowa struktura:**
```typescript
export function ProfileEditForm({ userId, initialData }: ProfileEditFormProps) {
  const { mutateAsync: updateUser, isPending } = useUpdateUser();
  
  const form = useForm<ProfileEditFormData>({
    resolver: zodResolver(ProfileEditFormSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
    },
  });
  
  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);
  
  const onSubmit = async (data: ProfileEditFormData) => {
    await updateUser({
      userId,
      command: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
    form.reset(data); // Reset to new values (isDirty = false)
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* FormFields */}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zapisz zmiany
        </Button>
      </form>
    </Form>
  );
}
```

**Weryfikacja:**
- Formularz renderuje się poprawnie
- Walidacja działa (błędy wyświetlają się pod polami)
- Submit wywołuje mutację
- Toast pojawia się po sukcesie/błędzie
- Unsaved changes warning działa

---

### Krok 6: Implementacja komponentu ChangePasswordForm

**Cel:** Stworzenie formularza zmiany hasła

**Pliki do stworzenia:**
- `src/components/profile/ChangePasswordForm.tsx`

**Działania:**
1. Stwórz komponent funkcyjny `ChangePasswordForm`
2. Zaimplementuj useForm z zodResolver i ChangePasswordFormSchema
3. Zaimportuj useChangePassword hook
4. Stwórz handler onSubmit:
   - Wywołaj mutację changePassword
   - Po sukcesie: reset formularza (wszystkie pola puste)
5. Renderuj formularz z polami:
   - currentPassword (Input type="password")
   - newPassword (Input type="password" + FormDescription z wymaganiami)
   - confirmPassword (Input type="password")
   - Submit button z loading state
6. Obsłuż stany: isSubmitting, errors

**Przykładowa struktura:**
```typescript
export function ChangePasswordForm() {
  const { mutateAsync: changePassword, isPending } = useChangePassword();
  
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const onSubmit = async (data: ChangePasswordFormData) => {
    await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    form.reset(); // Clear all fields
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* FormFields */}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zmień hasło
        </Button>
      </form>
    </Form>
  );
}
```

**Weryfikacja:**
- Formularz renderuje się poprawnie
- Walidacja działa (błędy wyświetlają się)
- Submit wywołuje mutację
- Toast pojawia się po sukcesie/błędzie
- Formularz resetuje się po sukcesie

---

### Krok 7: Implementacja komponentu TrainerInfoCard

**Cel:** Stworzenie karty z informacjami o trenerze (tylko dla clienta)

**Pliki do stworzenia:**
- `src/components/profile/TrainerInfoCard.tsx`

**Działania:**
1. Stwórz komponent funkcyjny `TrainerInfoCard`
2. Przyjmij propsy: `TrainerInfoCardProps`
3. Obsłuż przypadki:
   - trainer === null → komunikat "Nie masz przypisanego trenera"
   - trainer !== null → wyświetl dane trenera
4. Renderuj Card z:
   - CardHeader + CardTitle: "Twój trener"
   - CardContent:
     - UserAvatar size="lg"
     - Imię i nazwisko trenera
     - Email trenera

**Przykładowa struktura:**
```typescript
export function TrainerInfoCard({ trainer }: TrainerInfoCardProps) {
  if (!trainer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Twój trener</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nie masz przypisanego trenera. Skontaktuj się z administratorem.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Twój trener</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <UserAvatar
            userId={trainer.id}
            firstName={trainer.firstName}
            lastName={trainer.lastName}
            size="lg"
          />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{trainer.firstName} {trainer.lastName}</p>
            <p className="text-sm text-muted-foreground">{trainer.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Weryfikacja:**
- Komponent renderuje się poprawnie
- Przypadek trainer === null wyświetla komunikat
- Przypadek trainer !== null wyświetla dane

---

### Krok 8: Implementacja komponentu ProfileContainer

**Cel:** Stworzenie głównego kontenera widoku profilu

**Pliki do stworzenia:**
- `src/components/profile/ProfileContainer.tsx`

**Działania:**
1. Stwórz komponent funkcyjny `ProfileContainer`
2. Przyjmij propsy: `ProfileContainerProps`
3. Zaimportuj hooki:
   - useUser(userId)
   - useTrainer(trainerId) - tylko dla clienta
4. Obsłuż stany:
   - Loading: Skeleton loaders
   - Error: Error state z przyciskiem "Spróbuj ponownie"
   - Success: Renderuj wszystkie sekcje
5. Renderuj strukturę:
   - ProfileHeader
   - Card z ProfileEditForm
   - TrainerInfoCard (warunkowo dla clienta)
   - Card z Accordion i ChangePasswordForm
6. Zaimplementuj loader states dla każdej sekcji

**Przykładowa struktura:**
```typescript
export function ProfileContainer({ userId, userRole }: ProfileContainerProps) {
  const userQuery = useUser(userId);
  const trainerQuery = useTrainer(
    userRole === 'client' && userQuery.data?.trainerId
      ? userQuery.data.trainerId
      : null
  );
  
  // Loading state
  if (userQuery.isLoading) {
    return <ProfileSkeleton />;
  }
  
  // Error state
  if (userQuery.isError) {
    return <ProfileErrorState onRetry={() => userQuery.refetch()} />;
  }
  
  const user = userQuery.data!;
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ProfileHeader
        userId={user.id}
        firstName={user.firstName || ''}
        lastName={user.lastName || ''}
        role={user.role}
      />
      
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Podstawowe informacje</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            userId={user.id}
            initialData={{
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email,
            }}
          />
        </CardContent>
      </Card>
      
      {/* Trainer Info (only for clients) */}
      {userRole === 'client' && (
        <TrainerInfoCard
          trainer={
            trainerQuery.data
              ? {
                  id: trainerQuery.data.id,
                  firstName: trainerQuery.data.firstName || '',
                  lastName: trainerQuery.data.lastName || '',
                  email: trainerQuery.data.email,
                }
              : null
          }
        />
      )}
      
      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Zmiana hasła</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="change-password">
              <AccordionTrigger>Kliknij aby zmienić hasło</AccordionTrigger>
              <AccordionContent>
                <ChangePasswordForm />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Weryfikacja:**
- Wszystkie sekcje renderują się poprawnie
- Loading states działają
- Error states działają
- Dane użytkownika są poprawnie przekazywane do child components

---

### Krok 9: Stworzenie stron Astro dla każdej roli

**Cel:** Stworzenie Astro pages dla trzech ścieżek profilu

**Pliki do stworzenia:**
- `src/pages/admin/profile.astro`
- `src/pages/trainer/profile.astro`
- `src/pages/client/profile.astro`

**Działania:**

**9.1. Admin Profile (src/pages/admin/profile.astro):**
```astro
---
import AdminLayout from "../../layouts/AdminLayout.astro";
import { ProfileContainer } from "../../components/profile/ProfileContainer";

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect("/login");
}
---

<AdminLayout title="Profil">
  <ProfileContainer client:only="react" userId={user.id} userRole={user.role} />
</AdminLayout>
```

**9.2. Trainer Profile (src/pages/trainer/profile.astro):**
```astro
---
import TrainerLayout from "../../layouts/TrainerLayout.astro";
import { ProfileContainer } from "../../components/profile/ProfileContainer";

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect("/login");
}
---

<TrainerLayout title="Profil">
  <ProfileContainer client:only="react" userId={user.id} userRole={user.role} />
</TrainerLayout>
```

**9.3. Client Profile (src/pages/client/profile.astro):**
```astro
---
import ClientLayout from "../../layouts/ClientLayout.astro";
import { ProfileContainer } from "../../components/profile/ProfileContainer";

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect("/login");
}
---

<ClientLayout title="Profil">
  <ProfileContainer client:only="react" userId={user.id} userRole={user.role} />
</ClientLayout>
```

**Weryfikacja:**
- Każda strona renderuje się pod odpowiednią ścieżką
- Layout weryfikuje rolę użytkownika
- Redirect na login działa dla niezalogowanych

---

### Krok 10: Aktualizacja konfiguracji nawigacji

**Cel:** Dodanie linku "Profil" do menu nawigacji

**Pliki do edycji:**
- `src/config/navigation.config.ts`

**Działania:**
1. Dla każdej roli (admin, trainer, client) dodaj item nawigacyjny:
   ```typescript
   {
     id: 'profile',
     label: 'Profil',
     icon: User, // lub inny odpowiedni icon z lucide-react
     href: '/admin/profile', // lub /trainer/profile, /client/profile
     roles: ['admin'], // odpowiednio dla każdej roli
   }
   ```
2. Umieść link w odpowiednim miejscu w menu (np. na końcu listy)
3. Rozważ dodanie linku "Profil" również w UserMenu (dropdown w TopBar)

**Weryfikacja:**
- Link "Profil" pojawia się w sidebar dla każdej roli
- Link prowadzi do odpowiedniej ścieżki
- Link jest aktywny (highlighted) gdy użytkownik jest na stronie profilu

---

### Krok 11: Testy manualne end-to-end

**Cel:** Przetestowanie pełnego flow widoku profilu dla każdej roli

**Działania:**

**11.1. Test jako Admin:**
1. Zaloguj się jako admin
2. Przejdź na `/admin/profile`
3. Sprawdź, czy dane się wyświetlają poprawnie
4. Zmień imię i nazwisko → kliknij "Zapisz zmiany"
   - Sprawdź toast success
   - Sprawdź, czy dane w headerze się zaktualizowały
5. Rozwiń sekcję "Zmiana hasła"
6. Wypełnij formularz zmiany hasła → kliknij "Zmień hasło"
   - Sprawdź toast success
   - Sprawdź, czy formularz się zresetował
7. Spróbuj opuścić stronę z niezapisanymi zmianami
   - Sprawdź, czy pojawia się ostrzeżenie przeglądarki

**11.2. Test jako Trainer:**
1. Zaloguj się jako trainer
2. Przejdź na `/trainer/profile`
3. Powtórz kroki 3-7 z testu admina

**11.3. Test jako Client:**
1. Zaloguj się jako client
2. Przejdź na `/client/profile`
3. Sprawdź, czy sekcja "Twój trener" jest widoczna
4. Sprawdź, czy dane trenera są poprawne
5. Powtórz kroki 3-7 z testu admina

**11.4. Testy error handling:**
1. Symuluj błąd sieci (DevTools → Network → Offline)
   - Sprawdź error states i przyciski "Spróbuj ponownie"
2. Wprowadź nieprawidłowe hasło w formularzu zmiany hasła
   - Sprawdź, czy toast pokazuje "Obecne hasło jest nieprawidłowe"
3. Wprowadź za krótkie imię/nazwisko
   - Sprawdź, czy błędy walidacji się wyświetlają

**Weryfikacja:**
- Wszystkie flow działają poprawnie
- Błędy są obsługiwane gracefully
- UI jest responsywny i intuicyjny

---

### Krok 12: Testy jednostkowe i integracyjne (opcjonalne)

**Cel:** Pokrycie komponentów testami automatycznymi

**Działania:**

**12.1. Testy hooków:**
- `useUser.test.ts`: Test fetchUser success/error
- `useUpdateUser.test.ts`: Test mutation success/error
- `useChangePassword.test.ts`: Test password change flow

**12.2. Testy komponentów:**
- `ProfileHeader.test.tsx`: Test renderowania
- `ProfileEditForm.test.tsx`: Test walidacji i submit
- `ChangePasswordForm.test.tsx`: Test walidacji i submit
- `TrainerInfoCard.test.tsx`: Test przypadków trainer/null

**12.3. Narzędzia:**
- Vitest + React Testing Library
- Mock Service Worker (MSW) do mockowania API calls

**Przykładowy test:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileEditForm } from './ProfileEditForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('ProfileEditForm', () => {
  it('should display validation errors for too short firstName', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileEditForm
          userId="test-id"
          initialData={{ firstName: 'Jan', lastName: 'Kowalski', email: 'test@example.com' }}
        />
      </QueryClientProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/imię/i);
    fireEvent.change(firstNameInput, { target: { value: 'J' } });
    fireEvent.blur(firstNameInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Imię musi mieć minimum 2 znaki/i)).toBeInTheDocument();
    });
  });
});
```

**Weryfikacja:**
- Wszystkie testy przechodzą (green)
- Code coverage > 80% (opcjonalnie)

---

### Krok 13: Dokumentacja i code review

**Cel:** Upewnić się, że kod jest dobrze udokumentowany i zgodny z best practices

**Działania:**
1. Dodaj JSDoc komentarze do wszystkich publicznych funkcji i komponentów
2. Zaktualizuj README.md z informacją o nowych widokach profilu
3. Stwórz pull request i poproś o code review
4. Sprawdź linter warnings/errors
5. Upewnij się, że wszystkie TypeScript strict mode errors są naprawione

**Przykład JSDoc:**
```typescript
/**
 * Profile edit form component
 * 
 * Allows users to edit their basic profile information (first name, last name).
 * Email is displayed as readonly.
 * 
 * @param userId - ID of the user being edited
 * @param initialData - Initial form values
 * @returns React component
 * 
 * @example
 * <ProfileEditForm
 *   userId="123"
 *   initialData={{ firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com' }}
 * />
 */
export function ProfileEditForm({ userId, initialData }: ProfileEditFormProps) {
  // ...
}
```

**Weryfikacja:**
- Linter nie zgłasza błędów
- TypeScript kompiluje się bez błędów
- Code review zaakceptowany
- Dokumentacja jest kompletna

---

### Krok 14: Deploy i monitoring

**Cel:** Wdrożenie widoków profilu na środowisko produkcyjne

**Działania:**
1. Merge feature branch do main
2. Deploy na staging environment
3. Przetestuj na stagingu wszystkie flow
4. Deploy na production
5. Monitor logs i error tracking (np. Sentry)
6. Zbierz feedback od użytkowników

**Checklist pre-deployment:**
- [ ] Wszystkie testy przechodzą
- [ ] Linter i TypeScript bez błędów
- [ ] Code review zaakceptowany
- [ ] Dokumentacja zaktualizowana
- [ ] Environment variables skonfigurowane (Supabase keys)
- [ ] Database migrations (jeśli potrzebne)
- [ ] Backup production data

**Weryfikacja post-deployment:**
- [ ] Widoki profilu działają na production
- [ ] Brak błędów w logs
- [ ] Performance metrics OK (czas ładowania < 2s)
- [ ] Użytkownicy mogą edytować profile i zmieniać hasła

---

## Podsumowanie

Ten plan implementacji obejmuje kompletne wdrożenie widoków profilu użytkownika dla trzech ról (Admin, Trainer, Client). Plan zawiera szczegółowe instrukcje dotyczące:

1. **Struktury komponentów** - hierarchia i odpowiedzialności
2. **Zarządzania stanem** - React Query hooks
3. **Walidacji** - Zod schemas i react-hook-form
4. **Integracji API** - GET/PUT endpoints
5. **Obsługi błędów** - graceful error handling
6. **UX patterns** - unsaved changes warning, loading states, toasts
7. **Kroków implementacji** - krok po kroku guide

Widoki profilu będą:
- **Responsywne** - działające na mobile i desktop
- **Accessible** - zgodne z WCAG guidelines
- **Bezpieczne** - właściwa walidacja i autoryzacja
- **User-friendly** - intuicyjne formularze i jasne komunikaty błędów

