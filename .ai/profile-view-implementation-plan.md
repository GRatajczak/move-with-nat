# Plan implementacji widoku Profilu użytkownika

## 1. Przegląd
Widok „Profil” umożliwia zalogowanemu użytkownikowi (Administrator, Trener lub Podopieczny) przeglądanie oraz aktualizację własnych danych. Sekcje edycji różnią się minimalnie w zależności od roli, jednak layout oraz większość pól pozostaje wspólna. Widok zawiera również formularz zmiany hasła i – w przypadku podopiecznego – readonly kartę informacji o przypisanym trenerze.

## 2. Routing widoku
| Rola | Ścieżka |
|------|---------|
| Administrator | `/admin/profile` |
| Trener        | `/trainer/profile` |
| Podopieczny   | `/client/profile` |

Każda ścieżka jest osadzona w odpowiednim `*Layout` zapewniającym sidebar, top-bar oraz autoryzację.

## 3. Struktura komponentów
```
ProfilePage
    ├── ProfileHeader
├── ProfileEditForm
│   └── FormField × n
├── TrainerInfoCard   // tylko client
├── Divider
└── ChangePasswordForm (collapsible)
```

## 4. Szczegóły komponentów
### ProfileHeader
- **Opis**: Prezentuje avatar z inicjałami, imię i nazwisko oraz badge roli.
- **Elementy**: `UserAvatar`, `<h1>`, `StatusBadge`.
- **Interakcje**: brak.
- **Walidacja**: brak.
- **Typy**: `UserDto` (readonly).
- **Props**: `{ user: UserDto }`.

### ProfileEditForm
- **Opis**: Formularz umożliwiający edycję podstawowych danych.
- **Elementy**: `FormField` (imię, nazwisko, telefon, data urodzenia), przyciski `Zapisz` / `Anuluj`.
- **Interakcje**: submit (PUT `/users/{id}`), reset.
- **Walidacja**:
  - Imię / Nazwisko – wymagane, min 1 znak.
  - Telefon – opcjonalny, regex `^\+?[0-9\s-]{7,15}$`.
  - Data urodzenia – opcjonalna, max `today`.
- **Typy**:
  - `ProfileFormValues` (RHF view-model).
  - Backend `UpdateUserCommand` (subset).
- **Props**: `{ user: UserDto }`.

### TrainerInfoCard (client only)
- **Opis**: Sekcja readonly prezentująca dane trenera.
- **Elementy**: `UserAvatar`, imię i nazwisko, email, telefon.
- **Typy**: `UserDto` (trainer subset).
- **Props**: `{ trainer: UserDto }`.

### ChangePasswordForm
- **Opis**: Collapsible formularz zmiany hasła.
- **Elementy**: 3× `PasswordInput`, przycisk `Zmień hasło`.
- **Walidacja**: min 8 znaków, wielka + mała litera, cyfra, znak specjalny; potwierdzenie.
- **Typy**: `ChangePasswordFormValues`.
- **Interakcje**: submit → `supabase.auth.updateUser({ password })` + toast.

## 5. Typy
```ts
export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date | null;
}

export type UpdateUserPayload = Pick<UpdateUserCommand,
  "firstName" | "lastName" | "phone" | "dateOfBirth">;

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
```

## 6. Zarządzanie stanem
- **Server state**: TanStack Query
  - `useQuery(['user','me'], getUser)`
  - `useMutation(updateUser)`
  - `useMutation(updatePassword)`
- **Local state**: React Hook Form + Zod resolver.
- **UI state**: `isDirty`, `isPasswordOpen`, toasty via *sonner*.

## 7. Integracja API
| Akcja | Metoda/Helper | Endpoint | Request | Response |
|-------|--------------|----------|---------|----------|
| Pobierz profil | `GET` | `/users/{id}` | – | `UserDto` |
| Aktualizuj profil | `PUT` | `/users/{id}` | `UpdateUserPayload` | `UserDto` |
| Zmień hasło | Supabase SDK | – | `{ password }` | `User` |

## 8. Interakcje użytkownika
1. Wejście → skeleton → render danych.
2. Modyfikacja pól → przycisk „Zapisz" aktywny.
3. Klik „Zapisz" → walidacja → loading spinner → toast sukcesu.
4. Klik „Anuluj" → reset.
5. Rozwijanie sekcji zmiany hasła → submit → toast.

## 9. Warunki i walidacja
- Wymagane pola: imię, nazwisko.
- Walidacja regex telefonu, daty ≤ dziś.
- Walidacja siły hasła.

## 10. Obsługa błędów
- 400 ValidationError → inline + toast.
- 403 Forbidden → redirect do dashboard.
- 409 Conflict → toast.
- Network → `ErrorState` + Retry.

## 11. Kroki implementacji
1. Konfiguracja tras w plikach `.astro` (Admin/Trainer/Client Layout).
2. Utworzenie hooka `useCurrentUser` (fetch via `/users/{id}`).
3. Implementacja `ProfileHeader`.
4. Implementacja `ProfileEditForm` + Zod schema.
5. Dodanie `TrainerInfoCard`.
6. Implementacja `ChangePasswordForm` z Supabase update.
7. Dodanie skeletonów (`Skeleton` component).
8. Obsługa błędów (`ErrorState`).
9. Integracja toasts.
10. Testy jednostkowe (RHF) & E2E (Playwright: edit profile/happy path).

