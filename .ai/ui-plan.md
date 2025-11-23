# Architektura UI dla MoveWithNat

## 1. Przegląd struktury UI

### 1.1 Koncepcja Architektoniczna

MoveWithNat wykorzystuje architekturę opartą na rolach z trzema osobnymi obszarami interfejsu użytkownika:

- **Panel Administratora** (`/admin/*`) - kompleksowe zarządzanie systemem
- **Panel Trenera** (`/trainer/*`) - zarządzanie podopiecznymi i planami treningowymi
- **Panel Podopiecznego** (`/client/*`) - przeglądanie planów i oznaczanie wykonania ćwiczeń

### 1.2 Wzorce Layoutowe

**Hybrid Sidebar + Top Bar Pattern:**

- Persistent sidebar z główną nawigacją (collapsible na mobile jako hamburger overlay)
- Top bar zawierający: logo aplikacji, breadcrumbs/tytuł strony, menu użytkownika
- Main content area ze scrollowaniem
- Protected routes z middleware JWT i weryfikacją roli

**Layout Hierarchy:**

```
RootLayout (sprawdzenie auth)
├── AuthLayout (centered, minimal)
│   ├── Login
│   ├── Activate Account
│   └── Reset Password
│
├── AdminLayout (sidebar + topbar)
│   ├── Dashboard
│   ├── Users Management
│   ├── Exercises Library
│   └── Reasons Management
│
├── TrainerLayout (sidebar + topbar)
│   ├── Dashboard
│   ├── My Clients
│   ├── Training Plans
│   └── Exercise Library (read-only)
│
└── ClientLayout (sidebar + topbar)
    ├── Dashboard (My Plans)
    └── Profile
```

### 1.3 Stack Technologiczny UI

**Core Libraries:**

- State Management: TanStack Query (server state)
- Forms: React Hook Form + Zod validation
- Drag & Drop: @dnd-kit/core + @dnd-kit/sortable
- Video Player: react-player (Vimeo embeds)
- Notifications: sonner (toast notifications)
- Animations: Tailwind transitions
- Icons: lucide-react
- Components: shadcn/ui (Radix UI based)

**Key Patterns:**

- Mobile-first responsive design
- Skeleton loading states dla initial renders
- Optimistic updates dla szybkich interakcji (toggles, completion marks)
- URL state synchronization (pagination, filters)
- Unsaved changes warnings przed opuszczeniem formularzy

---

## 2. Lista widoków

### 2.1 Wspólne widoki uwierzytelniania

#### 2.1.1 Login Page

- **Ścieżka:** `/login`
- **Dostęp:** Publiczny (redirect jeśli zalogowany)
- **Główny cel:** Uwierzytelnienie użytkownika i przekierowanie do odpowiedniego dashboardu
- **Kluczowe informacje:**
  - Formularz logowania (email, hasło)
  - Link do reset hasła
  - Logo i branding aplikacji
- **Kluczowe komponenty:**
  - `LoginForm` (React Hook Form + Zod)
  - `AuthLayout` (centered card, gradient background)
  - Error messages w formularzu
- **UX, dostępność i bezpieczeństwo:**
  - Validacja onBlur
  - Visible focus rings
  - ARIA labels dla form fields
  - Rate limiting na API (zabezpieczenie przed brute force)
  - Clear error messages bez ujawniania detali bezpieczeństwa
  - Auto-focus na polu email
  - Enter key submit

#### 2.1.2 Activate Account Page

- **Ścieżka:** `/activate?token=xxx`
- **Dostęp:** Publiczny (jednorazowy link z email)
- **Główny cel:** Ustawienie hasła przez nowego użytkownika
- **Kluczowe informacje:**
  - Weryfikacja tokenu (ważność 1h)
  - Formularz ustawienia hasła
  - Email użytkownika (readonly)
  - Wymagania dotyczące hasła
- **Kluczowe komponenty:**
  - `ActivationForm` z password requirements checklist
  - Token validation logic z loading states
  - Success state z auto-redirect (3s)
  - Expired/Invalid state z opcją "Wyślij ponownie link"
- **UX, dostępność i bezpieczeństwo:**
  - Stany: Validating → Valid/Invalid/Expired → Success
  - Password strength indicator (checkmarks per requirement)
  - Confirmation field dla hasła
  - Clear error messaging dla wygasłych linków
  - ARIA live region dla statusu walidacji
  - Keyboard navigation

#### 2.1.3 Reset Password Request Page

- **Ścieżka:** `/reset-password`
- **Dostęp:** Publiczny
- **Główny cel:** Zainicjowanie procesu resetu hasła
- **Kluczowe informacje:**
  - Formularz z polem email
  - Informacja o czasie ważności linku (1h)
  - Success message po wysłaniu
- **Kluczowe komponenty:**
  - `ResetPasswordRequestForm`
  - Success state z instrukcją sprawdzenia email
- **UX, dostępność i bezpieczeństwo:**
  - Nie ujawniaj czy email istnieje w systemie (security)
  - Zawsze pokazuj success message
  - Link powrotu do login

#### 2.1.4 Reset Password Confirm Page

- **Ścieżka:** `/reset-password/confirm?token=xxx`
- **Dostęp:** Publiczny (jednorazowy link z email)
- **Główny cel:** Ustawienie nowego hasła
- **Kluczowe informacje:**
  - Formularz z nowym hasłem
  - Password requirements
- **Kluczowe komponenty:**
  - `ResetPasswordConfirmForm`
  - Token validation
  - Password strength indicator
- **UX, dostępność i bezpieczeństwo:**
  - Podobny flow do Activate Account
  - Token expiry handling
  - Success redirect do login

---

### 2.2 Panel Administratora

#### 2.2.1 Admin Dashboard

- **Ścieżka:** `/admin`
- **Dostęp:** Administrator only
- **Główny cel:** Centralny hub z przeglądem systemu i szybkim dostępem do kluczowych funkcji
- **Kluczowe informacje:**
  - Statystyki: liczba użytkowników (per role), liczba planów, liczba ćwiczeń
  - Lista ostatnio dodanych użytkowników (5-10)
  - Lista pending activations (użytkownicy oczekujący na aktywację)
  - Quick actions (Dodaj użytkownika, Dodaj ćwiczenie, etc.)
- **Kluczowe komponenty:**
  - `StatsCard` grid (3-4 karty z ikonami i liczbami)
  - `RecentActivityList`
  - `PendingActivationsList` z quick action "Wyślij ponownie link"
  - `QuickActionButtons`
- **UX, dostępność i bezpieczeństwo:**
  - Responsive grid (1 col mobile, 2 tablet, 3-4 desktop)
  - Loading skeletons dla stats
  - Empty states gdy brak danych
  - Click-through z list do detail views

#### 2.2.2 Users Management - List View

- **Ścieżka:** `/admin/users`
- **Dostęp:** Administrator only
- **Główny cel:** Przeglądanie i zarządzanie wszystkimi użytkownikami systemu
- **Kluczowe informacje:**
  - Tabela użytkowników z kolumnami:
    - Avatar (inicjały, hash-based color)
    - Imię i Nazwisko
    - Email
    - Rola (badge)
    - Is active (badge: active/no-active)
    - Przypisany trener (dla clients)
    - Data utworzenia
    - Akcje (inline menu)
  - Filtrowanie i wyszukiwanie
  - Paginacja (20 per page)
- **Kluczowe komponenty:**
  - `UsersTable` (desktop) / `UserCards` (mobile)
  - `UsersFilterToolbar` (search, role filter, status filter, trainer filter, date range)
  - `ActiveFiltersBar` (badges z X do usunięcia)
  - `UserActionMenu` (Edytuj, Deaktywuj/Aktywuj, Wyślij link aktywacyjny, Usuń)
  - `Pagination` component
- **UX, dostępność i bezpieczeństwo:**
  - Debounced search (300ms)
  - URL sync dla filters i pagination
  - Sortable columns (click headers)
  - Hover states na rows
  - Confirmation modal dla destructive actions (Usuń)
  - Status badges z color coding (green=active, yellow=pending, red=suspended)
  - ARIA labels dla action buttons
  - Keyboard navigation w tabeli
  - keepPreviousData dla smooth page transitions

#### 2.2.3 Users Management - Create User

- **Ścieżka:** `/admin/users/new`
- **Dostęp:** Administrator only
- **Główny cel:** Dodanie nowego użytkownika (admin, trener, podopieczny)
- **Kluczowe informacje:**
  - Formularz z polami:
    - Email\* [text, email validation]
    - Imię\* [text]
    - Nazwisko\* [text]
    - Rola\* [select: Administrator, Trener, Podopieczny]
    - Przypisany trener [searchable select - tylko gdy rola=Podopieczny]
    - Data urodzenia [date picker - optional]
    - Telefon [text - optional]
    - Waga
    - Pleć [select: męzczyzna/ kobieta]
    - Uwagi [textarea - optional]
- **Kluczowe komponenty:**
  - `CreateUserForm` (React Hook Form + Zod)
  - `RoleSelect` z conditional rendering (trener field only for client)
  - `TrainerSearchableSelect` (autocomplete z debounce)
  - Form actions: Anuluj, Zapisz i wyślij link
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Użytkownicy > Nowy użytkownik
  - Validation onBlur + onChange po błędzie
  - Inline error messages
  - Required field indicators (\*)
  - Disabled "Zapisz" button gdy form invalid
  - Success toast + redirect do user detail
  - Email notification wysłany automatycznie po utworzeniu
  - Unsaved changes warning
  - Focus management (auto-focus pierwszego pola)
  - ARIA describedby dla error messages

#### 2.2.4 Users Management - Edit User

- **Ścieżka:** `/admin/users/:id/edit`
- **Dostęp:** Administrator only
- **Główny cel:** Edycja profilu użytkownika
- **Kluczowe informacje:**
  - Formularz z obecnymi danymi użytkownika (podobny do Create)
  - Dodatkowe pola:
    - Status [select: Active, Suspended]
    - Email (disabled/readonly - nie można zmienić)
  - Info o ostatniej aktywności
- **Kluczowe komponenty:**
  - `EditUserForm` (pre-populated)
  - `StatusSelect`
  - `LastActivityInfo` (readonly section)
  - `ResendActivationButton` (jeśli status=pending)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Użytkownicy > [Imię Nazwisko] > Edytuj
  - Disabled email field (z tooltipem wyjaśniającym dlaczego)
  - Confirmation modal gdy zmiana statusu na Suspended
  - Success toast + redirect do user detail
  - Unsaved changes warning
  - Show "Last modified" timestamp

#### 2.2.5 Users Management - User Detail View

- **Ścieżka:** `/admin/users/:id`
- **Dostęp:** Administrator only
- **Główny cel:** Szczegółowy podgląd profilu użytkownika
- **Kluczowe informacje:**
  - Header section:
    - Avatar (large, 120px)
    - Imię i Nazwisko
    - Status badge
    - Rola badge
    - Action buttons (Edytuj, Menu)
  - Profile info section (grid layout):
    - Email
    - Telefon
    - Data urodzenia
    - Data utworzenia
    - Ostatnia aktywność
    - Przypisany trener (dla client)
  - Stats section (jeśli trener):
    - Liczba podopiecznych
    - Liczba aktywnych planów
  - Related plans section (jeśli client):
    - Lista planów (z linkami do planu)
  - Activity log section:
    - Recent actions/changes
- **Kluczowe komponenty:**
  - `UserDetailHeader`
  - `UserInfoGrid`
  - `UserStatsCards` (dla trenera)
  - `RelatedPlansList` (dla podopiecznego)
  - `UserActionMenu` (Deaktywuj, Wyślij link, Usuń)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Użytkownicy > [Imię Nazwisko]
  - Loading skeleton dla async data
  - Empty state dla brak planów
  - Click-through links do related entities
  - Floating action button (Edit) na mobile

#### 2.2.6 Exercises Management - List View

- **Ścieżka:** `/admin/exercises`
- **Dostęp:** Administrator only
- **Główny cel:** Przeglądanie i zarządzanie biblioteką ćwiczeń
- **Kluczowe informacje:**
  - Tabela ćwiczeń z kolumnami:
    - Thumbnail wideo (Vimeo preview)
    - Nazwa ćwiczenia
    - Tempo
    - Domyślny ciężar
    - Data utworzenia
    - Liczba użyć w planach
    - Akcje
  - Search i filtrowanie
  - Paginacja
  - Button "Dodaj ćwiczenie"
- **Kluczowe komponenti:**
  - `ExercisesTable` (desktop) / `ExerciseCards` (mobile)
  - `ExercisesFilterToolbar` (search by name, sort by date/name/usage)
  - `ExerciseVideoPreview` (hover/click dla quick preview modal)
  - `ExerciseActionMenu` (Edytuj, Podgląd, Usuń)
  - `CreateExerciseButton` (primary action)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Ćwiczenia
  - Debounced search
  - URL sync dla filters
  - Quick preview modal z react-player po kliknięciu row
  - Lazy loading dla video thumbnails
  - Confirmation modal dla Delete (z info o liczbie planów używających)
  - Empty state gdy brak ćwiczeń (z CTA do dodania pierwszego)
  - Keyboard shortcuts (? dla help overlay)

#### 2.2.7 Exercises Management - Create Exercise

- **Ścieżka:** `/admin/exercises/new`
- **Dostęp:** Administrator only
- **Główny cel:** Dodanie nowego ćwiczenia do biblioteki
- **Kluczowe informacje:**
  - Formularz z sekcjami:
    - **Basic Info:**
      - Nazwa\* [text]
      - Vimeo Video ID\* [text, digits only, live preview]
    - **Opis:**
      - Cele [textarea, markdown support]
      - Kroki wykonania [textarea, markdown support]
      - Wskazówki [textarea, markdown support]
    - **Parametry (optional):**
      - Tempo [text, pattern: X-X-X lub XXXX]
      - Domyślny ciężar [number, unit select: kg/lbs]
- **Kluczowe komponenty:**
  - `CreateExerciseForm` (multi-section)
  - `VimeoPreview` component (live preview przy wpisywaniu ID)
  - `TempoInput` (z pattern validation i help text)
  - `WeightInput` (number + unit selector)
  - `MarkdownEditor` dla description fields (z preview toggle)
  - Form actions: Anuluj, Zapisz
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Ćwiczenia > Nowe ćwiczenie
  - Live Vimeo preview (debounced) gdy ID wpisywane
  - Help text pod Tempo field z przykładami
  - Character counters dla textarea (optional limits)
  - Validation onBlur + onChange po błędzie
  - Inline error messages
  - Unsaved changes warning
  - Success toast + redirect do exercise detail lub lista
  - ARIA labels i descriptions
  - Focus management

#### 2.2.8 Exercises Management - Edit Exercise

- **Ścieżka:** `/admin/exercises/:id/edit`
- **Dostęp:** Administrator only
- **Główny cel:** Edycja istniejącego ćwiczenia
- **Kluczowe informacje:**
  - Formularz identyczny jak Create, pre-populated
  - Warning jeśli ćwiczenie używane w aktywnych planach (zmiany wpłyną na X planów)
- **Kluczowe komponenty:**
  - `EditExerciseForm` (pre-populated)
  - `UsageWarningAlert` (jeśli used in plans)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Ćwiczenia > [Nazwa] > Edytuj
  - Alert jeśli ćwiczenie w aktywnych planach
  - Unsaved changes warning
  - Success toast + redirect

#### 2.2.9 Exercises Management - Exercise Detail View

- **Ścieżka:** `/admin/exercises/:id`
- **Dostęp:** Administrator only (read-only dostęp dla trenera)
- **Główny cel:** Szczegółowy podgląd ćwiczenia
- **Kluczowe informacje:**
  - Header:
    - Nazwa
    - Action buttons (Edytuj, Menu)
  - Video section:
    - Vimeo player (16:9 aspect ratio)
  - Description sections (expandable):
    - Cele
    - Kroki
    - Wskazówki
  - Metadata:
    - Tempo
    - Domyślny ciężar
    - Data utworzenia
    - Ostatnia edycja
  - Usage stats:
    - Liczba planów używających
    - Lista planów (collapsible, z linkami)
- **Kluczowe komponenty:**
  - `ExerciseDetailHeader`
  - `VimeoPlayer` (react-player)
  - `ExerciseDescription` (accordion sections)
  - `ExerciseMetadata` (grid layout)
  - `UsageStatsList`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Ćwiczenia > [Nazwa]
  - Responsive video player
  - Collapsible sections dla description
  - Click-through do related plans
  - Share button (copy link)
  - Print-friendly view

#### 2.2.10 Reasons Management - List & CRUD

- **Ścieżka:** `/admin/reasons`
- **Dostęp:** Administrator only
- **Główny cel:** Zarządzanie standardowymi powodami niewykonania ćwiczenia
- **Kluczowe informacje:**
  - Tabela powodów:
    - Treść powodu
    - Liczba użyć
    - Data utworzenia
    - Akcje (Edytuj, Usuń)
  - Button "Dodaj powód"
  - Inline editing lub modal dla Create/Edit
- **Kluczowe komponenty:**
  - `ReasonsTable`
  - `CreateReasonModal` (textarea, max 200 chars)
  - `EditReasonModal`
  - `ReasonActionMenu`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Powody niewykonania
  - Simple list (paginacja optional jeśli >50)
  - Character counter w formularzach
  - Confirmation dla Delete (z info o liczbie użyć)
  - Empty state z CTA
  - ARIA labels

#### 2.2.11 Admin Profile

- **Ścieżka:** `/admin/profile`
- **Dostęp:** Administrator only (własny profil)
- **Główny cel:** Edycja własnego profilu administratora
- **Kluczowe informacje:**
  - Header:
    - Avatar (large)
    - Imię i Nazwisko
    - Rola badge (Administrator)
  - Formularz edycji:
    - Imię\*
    - Nazwisko\*
    - Email (readonly)
    - Telefon
    - Avatar upload (future - na razie inicjały)
  - Change password section (separate form)
- **Kluczowe komponenty:**
  - `ProfileHeader`
  - `ProfileEditForm`
  - `ChangePasswordForm` (collapsible section)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Admin > Profil
  - Separate "Zapisz" buttons per section
  - Email readonly (z tooltipem)
  - Password change wymaga: obecne hasło, nowe hasło, confirm
  - Success toasts per section
  - Unsaved changes warning

---

### 2.3 Panel Trenera

#### 2.3.1 Trainer Dashboard

- **Ścieżka:** `/trainer`
- **Dostęp:** Trainer only
- **Główny cel:** Przegląd podopiecznych i quick actions
- **Kluczowe informacje:**
  - Stats cards:
    - Liczba podopiecznych (aktywnych)
    - Liczba aktywnych planów
    - Liczba niewykonanych ćwiczeń (z ostatniego tygodnia)
  - Lista podopiecznych (10 najnowszych lub wszyscy jeśli <10):
    - Avatar, Imię, Status aktywnego planu, Ostatnia aktywność
  - Quick actions:
    - Dodaj podopiecznego (jeśli trener ma uprawnienia - future)
    - Stwórz nowy plan
- **Kluczowe komponenty:**
  - `TrainerStatsCards`
  - `ClientsQuickList` (z linkami do profili)
  - `QuickActionButtons`
- **UX, dostępność i bezpieczeństwo:**
  - Responsive grid
  - Click-through do full list
  - Loading skeletons
  - Empty state jeśli brak podopiecznych

#### 2.3.2 My Clients - List View

- **Ścieżka:** `/trainer/Clients`
- **Dostęp:** Trainer only
- **Główny cel:** Przeglądanie przypisanych podopiecznych
- **Kluczowe informacje:**
  - Tabela/Cards podopiecznych:
    - Avatar
    - Imię i Nazwisko
    - Status (active/suspended)
    - Liczba aktywnych planów
    - Ostatnia aktywność
    - Akcje
  - Filtrowanie (status, search by name)
  - Paginacja
- **Kluczowe komponenty:**
  - `ClientsTable` / `clientCards`
  - `ClientsFilterToolbar`
  - `clientActionMenu` (Zobacz profil, Stwórz plan, Edytuj)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Moi Podopieczni
  - URL sync dla filters
  - Click row to view profile
  - Empty state jeśli brak podopiecznych
  - RLS enforcement (tylko przypisani podopieczni)

#### 2.3.3 client Profile (Trainer View)

- **Ścieżka:** `/trainer/Clients/:id`
- **Dostęp:** Trainer only (tylko przypisani podopieczni)
- **Główny cel:** Szczegółowy podgląd podopiecznego i jego planów
- **Kluczowe informacje:**
  - Header:
    - Avatar, Imię, Status
    - Action buttons (Edytuj, Stwórz plan)
  - Profile info (readonly)
  - Lista planów podopiecznego:
    - Nazwa, Status visibility, Progress, Data utworzenia
    - Quick actions per plan
  - Progress overview:
    - Chart/stats wykonania ćwiczeń (optional MVP)
- **Kluczowe komponenty:**
  - `clientProfileHeader`
  - `clientInfoSection`
  - `clientPlansList` (z progress bars)
  - `clientProgressChart` (optional MVP)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Moi Podopieczni > [Imię]
  - Click-through do plan details
  - Empty state jeśli brak planów
  - CTA "Stwórz pierwszy plan"

#### 2.3.4 Training Plans - List View

- **Ścieżka:** `/trainer/plans`
- **Dostęp:** Trainer only
- **Główny cel:** Przeglądanie wszystkich planów trenera
- **Kluczowe informacje:**
  - Tabela/Cards planów:
    - Nazwa planu
    - Podopieczny (avatar + imię)
    - Data utworzenia
    - Status visibility (badge)
    - Liczba ćwiczeń
    - Progress (X/Y wykonanych)
    - Akcje
  - Filtrowanie:
    - Search by name
    - Filter by client
    - Filter by visibility
    - Sort by date/name
  - Paginacja
  - Button "Stwórz plan"
- **Kluczowe komponenty:**
  - `PlansTable` / `PlanCards`
  - `PlansFilterToolbar`
  - `PlanActionMenu` (Edytuj, Toggle visibility, Duplikuj, Podgląd, Usuń)
  - `CreatePlanButton`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Plany treningowe
  - URL sync dla filters
  - Sortable columns
  - Quick toggle visibility (eye icon, optimistic update)
  - Confirmation modal dla Delete
  - Empty state z CTA
  - Click row to view details

#### 2.3.5 Training Plans - Create Plan

- **Ścieżka:** `/trainer/plans/new`
- **Dostęp:** Trainer only
- **Główny cel:** Stworzenie nowego planu treningowego
- **Kluczowe informacje:**
  - **Sekcja 1 - Basic Info:**
    - Nazwa planu\* [text]
    - Opis [textarea]
    - Podopieczny\* [searchable select - tylko aktywni podopieczni trenera]
    - Widoczność [toggle, default: true]
  - **Sekcja 2 - Ćwiczenia:**
    - Button "+ Dodaj ćwiczenie" → Modal z listą dostępnych ćwiczeń
    - Lista dodanych ćwiczeń (drag-and-drop sortowanie):
      - Drag handle (⋮⋮)
      - Numer porządkowy
      - Nazwa ćwiczenia (z linkiem do podglądu)
      - Pola inline (zawsze widoczne):
        - Serie [number]
        - Reps [number]
        - Ciężar [number + unit]
        - Tempo [text, optional, inherit from exercise]
      - Button usuń (X)
    - Możliwość dodania tego samego ćwiczenia wielokrotnie
  - Form actions: Anuluj, Zapisz
- **Kluczowe komponenty:**
  - `CreatePlanForm` (multi-section)
  - `Clientselect` (searchable, autocomplete)
  - `AddExerciseModal` (lista z search, checkbox selection)
  - `PlanExercisesList` (drag-and-drop @dnd-kit)
  - `PlanExerciseRow` (inline editable fields)
  - `ExerciseQuickPreview` (modal z video + description)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Plany > Nowy plan
  - Validation: min 1 ćwiczenie required
  - Drag-and-drop z keyboard support (Arrow keys, Space)
  - Live auto-numbering po re-order
  - Inline validation per exercise fields
  - Unsaved changes warning (isDirty detection)
  - Success toast + redirect do plan detail + email notification wysłany
  - ARIA live region dla drag-drop announcements
  - Focus management w modals

#### 2.3.6 Training Plans - Edit Plan

- **Ścieżka:** `/trainer/plans/:id/edit`
- **Dostęp:** Trainer only (tylko własne plany)
- **Główny cel:** Edycja istniejącego planu
- **Kluczowe informacje:**
  - Formularz identyczny jak Create, pre-populated
  - Info o ostatniej edycji
  - Warning jeśli plan jest widoczny dla podopiecznego (zmiany będą od razu widoczne)
- **Kluczowe komponenty:**
  - `EditPlanForm` (pre-populated)
  - `LastEditedInfo`
  - `VisibilityWarningAlert`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Plany > [Nazwa] > Edytuj
  - Alert jeśli plan visible
  - Unsaved changes warning
  - Success toast + email notification o aktualizacji (jeśli visible)
  - Disabled client field (nie można zmienić podopiecznego)

#### 2.3.7 Training Plans - Plan Detail View

- **Ścieżka:** `/trainer/plans/:id`
- **Dostęp:** Trainer only (własne plany)
- **Główny cel:** Szczegółowy podgląd planu z completion tracking
- **Kluczowe informacje:**
  - Header:
    - Nazwa planu
    - Status badge (Visible/Hidden)
    - Info podopiecznego (avatar + imię)
    - Data utworzenia
    - Action buttons (Edytuj, Toggle visibility, Menu)
  - Description section
  - Exercises list (numbered):
    - Nazwa ćwiczenia
    - Serie, Reps, Ciężar, Tempo
    - Status wykonania (✓ wykonane, ✗ niewykonane, ⚪ brak danych)
    - Powód niewykonania (jeśli ✗)
    - Link do podglądu ćwiczenia
  - Progress section:
    - Progress bar (X/Y wykonanych)
    - Stats (% completion)
- **Kluczowe komponenty:**
  - `PlanDetailHeader`
  - `PlanDescription`
  - `PlanExercisesList` (read-only, z completion indicators)
  - `PlanProgressBar`
  - `PlanActionMenu` (Duplikuj, Wyślij ponownie email, Usuń)
  - `ExerciseCompletionBadge`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Plany > [Nazwa]
  - Accordion/expandable per exercise (show details)
  - Color-coded completion badges
  - Click exercise to view details + completion history
  - Empty state jeśli brak ćwiczeń (shouldn't happen)
  - RLS enforcement

#### 2.3.8 Training Plans - Duplicate Plan

- **Ścieżka:** `/trainer/plans/:id/duplicate` (modal lub separate page)
- **Dostęp:** Trainer only
- **Główny cel:** Duplikacja istniejącego planu z modyfikacjami
- **Kluczowe informacje:**
  - Modal/Form z polami:
    - Nowa nazwa planu\* (pre-filled: "[Oryginalna nazwa] - Kopia")
    - Nowy podopieczny\* (searchable select)
    - Widoczność [toggle, default: false]
  - Informacja: "Wszystkie ćwiczenia zostaną skopiowane"
- **Kluczowe komponenty:**
  - `DuplicatePlanModal`
  - `Clientselect`
- **UX, dostępność i bezpieczeństwo:**
  - Validation: unique name (w kontekście trenera)
  - Success toast + redirect do edit view nowego planu
  - Copy all exercises z original plan

#### 2.3.9 Exercise Library (Trainer View - Read Only)

- **Ścieżka:** `/trainer/exercises`
- **Dostęp:** Trainer only (read-only)
- **Główny cel:** Przeglądanie biblioteki ćwiczeń (bez edycji)
- **Kluczowe informacje:**
  - Lista ćwiczeń (similar to admin view ale bez edit/delete actions)
  - Search i filtrowanie
  - Paginacja
- **Kluczowe komponenty:**
  - `ExercisesTable` / `ExerciseCards` (read-only variant)
  - `ExercisesFilterToolbar`
  - `ExerciseQuickPreview` (modal)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Biblioteka ćwiczeń
  - Click to view details
  - No create/edit/delete actions
  - Info tooltip: "Skontaktuj się z administratorem aby dodać nowe ćwiczenia"

#### 2.3.10 Trainer Profile

- **Ścieżka:** `/trainer/profile`
- **Dostęp:** Trainer only (własny profil)
- **Główny cel:** Edycja własnego profilu
- **Kluczowe informacje:**
  - Similar do Admin Profile
  - Formularz edycji basic info
  - Change password section
- **Kluczowe komponenty:**
  - `ProfileHeader`
  - `ProfileEditForm`
  - `ChangePasswordForm`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Trener > Profil
  - Same patterns jak Admin Profile
  - Email readonly
  - Success toasts

---

### 2.4 Panel Podopiecznego

#### 2.4.1 Client Dashboard (My Plans)

- **Ścieżka:** `/client`
- **Dostęp:** client only
- **Główny cel:** Przeglądanie przydzielonych, widocznych planów treningowych
- **Kluczowe informacje:**
  - Lista planów (Cards grid):
    - Nazwa planu
    - Opis (truncated)
    - Progress bar (X/Y wykonanych ćwiczeń)
    - Data utworzenia
    - Info o trenerze (avatar + imię)
    - CTA button "Zobacz plan"
  - Sortowanie:
    - Dropdown (Najnowsze, Najstarsze, Najbardziej ukończone, Najmniej ukończone)
  - Tylko widoczne plany (is_visible=true)
- **Kluczowe komponenty:**
  - `PlanCardsGrid` (2 col desktop, 1 col mobile)
  - `PlanCard` (with progress, trainer info, CTA)
  - `SortDropdown`
- **UX, dostępność i bezpieczeństwo:**
  - Responsive grid
  - Click entire card to open plan
  - Progress visualization (circular progress lub bar)
  - Empty state jeśli brak planów: "Nie masz jeszcze przydzielonych planów. Skontaktuj się z trenerem."
  - Loading skeletons
  - RLS enforcement (tylko visible plans gdzie client_id=user)

#### 2.4.2 Client Plan Detail View

- **Ścieżka:** `/client/plans/:id`
- **Dostęp:** client only (tylko visible plans przypisane do usera)
- **Główny cel:** Podgląd szczegółów planu i marking completion
- **Kluczowe informacje:**
  - Header:
    - Nazwa planu
    - Info trenera (avatar + imię + kontakt?)
    - Data utworzenia
    - Progress bar
  - Description section
  - Exercises list (accordion/numbered):
    - Numer porządkowy
    - Nazwa ćwiczenia
    - Parametry (Serie, Reps, Ciężar, Tempo)
    - Status wykonania (badge)
    - CTA "Zobacz ćwiczenie i oznacz" lub "Zmień status"
- **Kluczowe komponenty:**
  - `ClientPlanHeader`
  - `PlanDescription`
  - `ClientExercisesList` (accordion items)
  - `ExerciseStatusBadge`
  - `ExerciseItemCard` (expandable)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Moje Plany > [Nazwa]
  - Accordion per exercise (collapse/expand)
  - Click exercise to view exercise detail + completion form
  - Color-coded badges (green=completed, red=not completed, gray=pending)
  - Progress auto-updates po zmianie statusu
  - Back button to dashboard

#### 2.4.3 Exercise Completion View

- **Ścieżka:** `/client/plans/:planId/exercises/:exerciseId`
- **Dostęp:** client only
- **Główny cel:** Podgląd ćwiczenia i marking completion
- **Kluczowe informacje:**
  - Header:
    - Nazwa ćwiczenia
    - Back button do planu
  - Video section:
    - React player (Vimeo embed, 16:9 aspect ratio)
  - Metadata section (grid):
    - Serie
    - Reps
    - Ciężar
    - Tempo
  - Description sections (accordion):
    - Cele
    - Kroki wykonania
    - Wskazówki
  - Completion section (sticky bottom lub after description):
    - Current status (jeśli już marked)
    - Duże przyciski:
      - "✓ Wykonane" (green)
      - "✗ Nie wykonano" (red)
    - Po kliknięciu "Nie wykonano" → Modal z:
      - Dropdown standardowych powodów (lista z API)
      - Textarea "Lub wpisz własny powód" (max 200 chars)
      - Buttons: Anuluj, Zapisz
- **Kluczowe komponenty:**
  - `ExerciseDetailHeader`
  - `VimeoPlayer`
  - `ExerciseMetadataGrid`
  - `ExerciseDescriptionAccordion`
  - `CompletionButtonsSection`
  - `NotCompletedReasonModal`
  - `ReasonSelect` (dropdown)
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Moje Plany > [Nazwa planu] > [Nazwa ćwiczenia]
  - Responsive video player (full width on mobile)
  - Sticky completion buttons na mobile (floating bottom bar)
  - Optimistic update po mark completion (instant feedback)
  - Success toast po save
  - Modal z focus trap
  - ARIA labels dla buttons
  - Keyboard shortcuts (V=completed, N=not completed)
  - Confirmation jeśli zmiana z completed na not completed

#### 2.4.4 Client Profile

- **Ścieżka:** `/client/profile`
- **Dostęp:** client only (własny profil)
- **Główny cel:** Edycja własnego profilu i przeglądanie info o trenerze
- **Kluczowe informacje:**
  - Header:
    - Avatar
    - Imię i Nazwisko
  - Formularz edycji:
    - Imię\*
    - Nazwisko\*
    - Email (readonly)
    - Telefon
    - Data urodzenia
  - Trainer info section (readonly):
    - Przypisany trener (avatar + imię + kontakt)
  - Change password section
- **Kluczowe komponenty:**
  - `ProfileHeader`
  - `ClientProfileEditForm`
  - `TrainerInfoCard` (readonly)
  - `ChangePasswordForm`
- **UX, dostępność i bezpieczeństwo:**
  - Breadcrumb: Profil
  - Email readonly
  - Success toast po save
  - Unsaved changes warning
  - Separate save per section

---

## 3. Mapa podróży użytkownika

### 3.1 Administrator Journey

#### Journey 1: Dodanie nowego trenera

1. **Start:** Admin login → Admin Dashboard
2. Admin klika "Użytkownicy" w sidebar
3. Admin klika "Dodaj użytkownika"
4. Admin wypełnia formularz (Email, Imię, Nazwisko, Rola=Trener)
5. Admin klika "Zapisz i wyślij link"
6. **Efekt:**
   - User record utworzony (status=pending)
   - Email aktywacyjny wysłany
   - Toast success: "Trener dodany. Link aktywacyjny wysłany."
   - Redirect do user detail view
7. **Alternative flow:** Trener nie otrzymał emaila
   - Admin wraca do users list
   - Admin klika "Wyślij ponownie link" w action menu
   - Toast: "Link wysłany ponownie"

#### Journey 2: Zarządzanie biblioteką ćwiczeń

1. **Start:** Admin Dashboard
2. Admin klika "Ćwiczenia" w sidebar
3. Admin przegląda listę, używa search
4. **Path A - Create:**
   - Admin klika "Dodaj ćwiczenie"
   - Wypełnia formularz (Nazwa, Vimeo ID, Opisy, Tempo, Ciężar)
   - Podgląd wideo w czasie rzeczywistym
   - Zapisuje
   - Toast success + redirect do exercise detail
5. **Path B - Edit:**
   - Admin klika row w tabeli (quick preview modal) lub Edit button
   - Modyfikuje dane
   - Zapisuje
   - Toast success (z info o liczbie planów jeśli applicable)
6. **Path C - Delete:**
   - Admin klika Delete w action menu
   - Confirmation modal: "To ćwiczenie jest używane w X planach. Czy na pewno chcesz usunąć?"
   - Potwierdza
   - Toast success

#### Journey 3: Dodanie podopiecznego i przypisanie do trenera

1. **Start:** Admin Dashboard
2. Admin klika "Użytkownicy" → "Dodaj użytkownika"
3. Wypełnia formularz:
   - Email, Imię, Nazwisko
   - Rola=Podopieczny
   - Przypisany trener (searchable select - wpisuje imię trenera)
4. Zapisuje
5. **Efekt:**
   - client record utworzony (status=pending, trainer_id set)
   - Email aktywacyjny wysłany
   - Toast success
   - Redirect do client detail view

---

### 3.2 Trainer Journey

#### Journey 1: Stworzenie planu treningowego dla podopiecznego

1. **Start:** Trainer login → Trainer Dashboard
2. **Path A - From Dashboard:**
   - Trainer klika "Stwórz nowy plan" (quick action)
3. **Path B - From Clients:**
   - Trainer klika "Moi Podopieczni"
   - Wybiera podopiecznego (click row)
   - Na profilu podopiecznego klika "Stwórz plan"
4. **Create Plan Flow:**
   - Trainer wypełnia basic info (Nazwa, Opis, Podopieczny, Widoczność=true)
   - Trainer klika "+ Dodaj ćwiczenie"
   - Modal z listą ćwiczeń (może search)
   - Trainer wybiera ćwiczenia (checkboxes, multi-select)
   - Klika "Dodaj" w modalu
   - Ćwiczenia pojawiają się na liście
   - Trainer drag-and-drop reorder
   - Trainer wypełnia inline fields per exercise (Serie, Reps, Ciężar, Tempo)
   - Trainer klika "Zapisz"
5. **Efekt:**
   - Plan utworzony
   - Email notification wysłany do podopiecznego (jeśli visible=true)
   - Toast success: "Plan utworzony i wysłany do [Imię podopiecznego]"
   - Redirect do plan detail view

#### Journey 2: Edycja istniejącego planu

1. **Start:** Trainer Dashboard
2. Trainer klika "Plany treningowe" w sidebar
3. Trainer search/filter do find plan
4. Trainer klika "Edytuj" w action menu
5. Modyfikuje (np. dodaje nowe ćwiczenie, zmienia parametry)
6. Klika "Zapisz"
7. **Efekt:**
   - Plan zaktualizowany
   - Email notification wysłany (jeśli visible=true)
   - Toast success: "Plan zaktualizowany"
   - Redirect do plan detail

#### Journey 3: Monitorowanie postępów podopiecznego

1. **Start:** Trainer Dashboard
2. Trainer klika "Moi Podopieczni"
3. Wybiera podopiecznego
4. Na profilu widzi listę planów z progress bars
5. Klika plan (navigate to plan detail)
6. Widzi szczegóły wykonania per ćwiczenie:
   - ✓ wykonane
   - ✗ niewykonane (z powodem)
   - ⚪ brak danych
7. **Action:** Może edytować plan bazując na feedback

#### Journey 4: Duplikacja planu dla innego podopiecznego

1. **Start:** Plan detail view
2. Trainer klika "Duplikuj" w action menu
3. Modal z formularzem:
   - Nowa nazwa (pre-filled)
   - Nowy podopieczny (select)
   - Widoczność
4. Zapisuje
5. **Efekt:**
   - Nowy plan utworzony (copy all exercises)
   - Redirect do edit view nowego planu
   - Toast success

---

### 3.3 client (Podopieczny) Journey

#### Journey 1: Aktywacja konta i pierwsze logowanie

1. **Start:** client otrzymuje email od trenera
2. Klika link w emailu
3. **Activate Account Page** (`/auth/activate?token=xxx`):
   - Loading state (validating token)
   - Formularz z email (readonly) i password fields
   - Password requirements checklist
   - Wypełnia hasło (z potwierdzeniem)
   - Klika "Aktywuj konto"
4. **Efekt:**
   - Konto aktywowane (status=active)
   - Success message: "Konto aktywowane! Przekierowujemy do logowania..."
   - Auto-redirect po 3s do login page
5. client loguje się
6. Redirect do Client Dashboard

#### Journey 2: Przeglądanie i wykonywanie planu treningowego

1. **Start:** Client Dashboard (My Plans)
2. client widzi karty planów z progress bars
3. Wybiera plan (click card)
4. **Plan Detail View:**
   - Widzi listę ćwiczeń (accordion)
   - Rozwijia pierwsze ćwiczenie
   - Klika "Zobacz ćwiczenie"
5. **Exercise Completion View:**
   - Oglada wideo instruktażowe (Vimeo player)
   - Czyta opis (Cele, Kroki, Wskazówki)
   - Widzi parametry (Serie, Reps, Ciężar, Tempo)
   - Wykonuje ćwiczenie
   - **Path A - Completed:**
     - Klika "✓ Wykonane"
     - Toast success: "Ćwiczenie oznaczone jako wykonane"
     - Auto-redirect do plan detail (lub next exercise)
   - **Path B - Not Completed:**
     - Klika "✗ Nie wykonano"
     - Modal pojawia się
     - Wybiera powód z dropdown (np. "Ból stawów") LUB wpisuje własny
     - Klika "Zapisz" w modalu
     - Toast success: "Status zapisany"
     - Auto-redirect do plan detail
6. client wraca do plan detail i widzi zaktualizowany progress bar
7. Powtarza dla kolejnych ćwiczeń

#### Journey 3: Edycja własnego profilu

1. **Start:** Client Dashboard
2. client klika user menu (top bar) → "Profil"
3. **Profile Page:**
   - Widzi obecne dane
   - Edytuje (Imię, Nazwisko, Telefon)
   - Klika "Zapisz"
   - Toast success
4. **Change Password (optional):**
   - Rozwija sekcję "Zmień hasło"
   - Wypełnia: obecne hasło, nowe hasło, potwierdź
   - Klika "Zmień hasło"
   - Toast success

---

### 3.4 Cross-Role Journeys

#### Journey: Reset hasła (wszystkie role)

1. **Start:** Login page
2. User klika "Nie pamiętam hasła"
3. **Reset Password Request Page:**
   - Wpisuje email
   - Klika "Wyślij link"
   - Success message: "Jeśli email istnieje w systemie, wysłaliśmy link resetujący."
4. User sprawdza email
5. Klika link w emailu
6. **Reset Password Confirm Page** (`/auth/reset-password/confirm?token=xxx`):
   - Loading (validating token)
   - Formularz z nowym hasłem
   - Wypełnia, zapisuje
   - Success message + redirect do login
7. User loguje się z nowym hasłem

---

## 4. Układ i struktura nawigacji

### 4.1 Layout Components Hierarchy

```
App Root
├── AuthLayout (minimal, centered)
│   ├── Logo
│   ├── Card Container
│   └── Background (gradient/image)
│
├── ProtectedLayout (requires auth)
    ├── AdminLayout
    │   ├── Sidebar (collapsible)
    │   │   ├── Logo
    │   │   ├── Nav Items
    │   │   │   ├── Dashboard
    │   │   │   ├── Użytkownicy (expandable)
    │   │   │   │   ├── Administratorzy
    │   │   │   │   ├── Trenerzy
    │   │   │   │   └── Podopieczni
    │   │   │   ├── Ćwiczenia
    │   │   │   ├── Powody niewykonania
    │   │   │   └── Profil
    │   │   └── Collapse Button
    │   ├── TopBar
    │   │   ├── Breadcrumbs / Page Title
    │   │   ├── Search (global - optional MVP)
    │   │   └── User Menu
    │   │       ├── Profil
    │   │       └── Wyloguj
    │   └── Main Content Area
    │       └── Page Content
    │
    ├── TrainerLayout
    │   ├── Sidebar
    │   │   ├── Logo
    │   │   ├── Nav Items
    │   │   │   ├── Dashboard
    │   │   │   ├── Moi Podopieczni
    │   │   │   ├── Plany Treningowe
    │   │   │   ├── Biblioteka Ćwiczeń (read-only)
    │   │   │   └── Profil
    │   │   └── Collapse Button
    │   ├── TopBar (same structure)
    │   └── Main Content Area
    │
    └── ClientLayout
        ├── Sidebar (simplified)
        │   ├── Logo
        │   ├── Nav Items
        │   │   ├── Moje Plany
        │   │   └── Profil
        │   └── Collapse Button
        ├── TopBar (same structure)
        └── Main Content Area
```

### 4.2 Sidebar Navigation Details

**Responsive Behavior:**

- **Desktop (>1024px):** Persistent sidebar (240px width), collapsible to icon-only (64px)
- **Tablet (768-1023px):** Persistent sidebar (collapsed by default), expand on hover
- **Mobile (<768px):** Hamburger menu (top-left), overlay sidebar (280px), backdrop blur

**Sidebar State Management:**

- State persisted w localStorage
- Smooth transition (250ms ease-in-out)
- Icons + labels (lucide-react)
- Active state highlighting (bg color + border indicator)
- Expandable sections (np. "Użytkownicy" w admin) z chevron indicator

**Navigation Items z Icons:**

- Dashboard: `LayoutDashboard`
- Użytkownicy: `Users`
- Ćwiczenia: `Dumbbell` lub `Activity`
- Plany: `ClipboardList`
- Profil: `User`
- Moi Podopieczni: `UserCheck`
- Biblioteka: `BookOpen`
- Powody: `AlertCircle`
- Wyloguj: `LogOut`

### 4.3 Top Bar Components

**Left Section:**

- Breadcrumbs (desktop) lub Page Title (mobile)
- Breadcrumb format: `Section > Subsection > Current Page`
- Separator: `/` lub `>`
- Truncation dla długich nazw (30 chars + tooltip)

**Right Section:**

- Global search (optional MVP, ikona `Search`)
- Notifications bell (future feature)
- User Menu (dropdown):
  - Avatar (small, 32px)
  - Imię i rola badge
  - Divider
  - Menu items:
    - Profil (link)
    - Wyloguj (action)

### 4.4 Breadcrumbs Strategy

**Pokazuj breadcrumbs na:**

- Wszystkich stronach POZA dashboardem głównym
- Format: `[Role Section] > [Subsection] > [Page/Entity Name]`

**Przykłady:**

- Admin users edit: `Admin > Użytkownicy > Jan Kowalski > Edytuj`
- Trainer plan detail: `Trener > Plany > Plan Nóg Dzień 1`
- Client exercise view: `Moje Plany > Plan Nóg Dzień 1 > Squat`

**Truncation:**

- Max 3-4 levels (collapse middle if >4)
- Entity names truncate at 30 chars with tooltip

**Click Behavior:**

- All segments clickable (navigate back)
- Current page (last segment) not clickable, different style

### 4.5 Mobile Navigation Pattern

**Hamburger Menu:**

- Icon top-left w TopBar
- Klick = slide-in sidebar from left (280px)
- Backdrop blur + semi-transparent overlay
- Close: click backdrop, X button, lub navigate to page
- Sidebar zawiera wszystkie nav items (full expanded)

**Bottom Navigation (optional future):**

- Alternative for mobile: bottom tab bar z 4-5 key sections
- Not in MVP

---

## 5. Kluczowe komponenty

### 5.1 Layout Components

#### `Sidebar`

- **Opis:** Główna nawigacja per role
- **Props:** `role`, `isCollapsed`, `onToggle`, `items`
- **Warianty:** AdminSidebar, TrainerSidebar, ClientSidebar
- **Features:**
  - Collapsible/expandable
  - Active state detection (useLocation)
  - Nested items (expandable sections)
  - Responsive (overlay na mobile)
  - Keyboard navigation
- **Accessibility:** ARIA navigation landmark, keyboard shortcuts

#### `TopBar`

- **Opis:** Top navigation bar z breadcrumbs i user menu
- **Props:** `breadcrumbs`, `user`, `onLogout`
- **Features:**
  - Breadcrumbs rendering
  - User menu dropdown
  - Global search (optional)
  - Notifications (future)
- **Accessibility:** Skip to main content link

#### `MainLayout`

- **Opis:** Wrapper dla protected pages
- **Props:** `children`, `role`
- **Features:**
  - Auth check (redirect if not logged in)
  - Role enforcement
  - Sidebar + TopBar composition
  - Main content area z scroll

#### `AuthLayout`

- **Opis:** Centered layout dla auth pages
- **Props:** `children`
- **Features:**
  - Centered card (max-w-md)
  - Logo at top
  - Gradient background
  - No navigation
- **Accessibility:** Focus trap w card

---

### 5.2 Data Display Components

#### `DataTable`

- **Opis:** Reusable table component z sorting, filtering, pagination
- **Props:** `data`, `columns`, `onSort`, `onFilter`, `pagination`, `loading`
- **Features:**
  - Sortable columns
  - Column definitions (header, accessor, render)
  - Loading skeletons
  - Empty state
  - Responsive (switch to cards on mobile via render prop)
  - Selection (checkboxes - optional)
- **Accessibility:** ARIA table roles, sortable headers announced

#### `Card`

- **Opis:** Generic card container
- **Props:** `children`, `title`, `actions`, `variant`
- **Warianty:** Default, outlined, elevated
- **Features:**
  - Header z title i actions
  - Body area
  - Footer (optional)
  - Clickable variant (hover effects)
- **Usage:** Plan cards, client cards, stats cards

#### `StatusBadge`

- **Opis:** Badge dla user/plan status
- **Props:** `status`, `variant`
- **Warianty:**
  - User: active (green), pending (yellow), suspended (red)
  - Plan: visible (blue), hidden (gray)
- **Features:** Color-coded, icon optional
- **Accessibility:** ARIA label z full status text

#### `UserAvatar`

- **Opis:** Avatar component z inicjałami
- **Props:** `userId`, `firstName`, `lastName`, `size`, `imageUrl` (future)
- **Features:**
  - Inicjały (first letter of first + last name)
  - Hash-based background color (8-10 colors from Tailwind palette)
  - Rozmiary: xs (24px), sm (32px), md (40px), lg (80px), xl (120px)
  - No image upload w MVP
- **Accessibility:** ARIA label z full name

#### `ProgressBar`

- **Opis:** Progress indicator dla plan completion
- **Props:** `value`, `max`, `showPercentage`, `variant`
- **Features:**
  - Animated fill
  - Percentage text (optional)
  - Color variants (success, warning, default)
- **Accessibility:** ARIA progressbar role

---

### 5.3 Form Components

#### `FormField`

- **Opis:** Wrapper dla form inputs z label, error, help text
- **Props:** `label`, `name`, `error`, `helpText`, `required`, `children`
- **Features:**
  - Consistent spacing
  - Error message display (w/ icon)
  - Required indicator (\*)
  - ARIA associations (label, describedby)
- **Integration:** React Hook Form + Zod

#### `SearchableSelect`

- **Opis:** Autocomplete select dla large lists (trainers, Clients, exercises)
- **Props:** `options`, `value`, `onChange`, `placeholder`, `loading`
- **Features:**
  - Debounced search (300ms)
  - Keyboard navigation
  - Loading state
  - Empty state ("Brak wyników")
  - Multi-select variant (future)
- **Accessibility:** Combobox ARIA pattern

#### `TextareaWithCounter`

- **Opis:** Textarea z character counter
- **Props:** `value`, `onChange`, `maxLength`, `rows`
- **Features:**
  - Live character count
  - Warning state near limit (e.g. 90%)
  - Prevents input beyond max
- **Accessibility:** ARIA live region dla counter

#### `DatePicker`

- **Opis:** Date picker component
- **Props:** `value`, `onChange`, `minDate`, `maxDate`
- **Features:**
  - Calendar popup
  - Keyboard input (dd/mm/yyyy)
  - Validation
- **Library:** React Day Picker lub shadcn/ui calendar
- **Accessibility:** Full keyboard navigation

#### `PasswordInput`

- **Opis:** Password input z show/hide toggle
- **Props:** `value`, `onChange`, `showRequirements`
- **Features:**
  - Toggle visibility (eye icon)
  - Password requirements checklist (optional)
  - Strength indicator (optional)
- **Accessibility:** Toggle button ARIA label

---

### 5.4 Interactive Components

#### `Modal`

- **Opis:** Generic modal/dialog component
- **Props:** `isOpen`, `onClose`, `title`, `children`, `size`, `variant`
- **Warianty:** Default, destructive (dla confirmation)
- **Features:**
  - Backdrop (blur + semi-transparent)
  - Close button (X)
  - Escape key to close
  - Click outside to close (optional)
  - Focus trap
  - Animations (fade-in backdrop, slide-in content)
- **Accessibility:** Dialog ARIA pattern, focus management

#### `ConfirmationModal`

- **Opis:** Modal dla destructive actions
- **Props:** `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`, `variant`
- **Features:**
  - Icon (warning)
  - Explanation text
  - Two buttons: Cancel (secondary), Confirm (primary, red for destructive)
  - Loading state na confirm button
- **Usage:** Delete user, delete plan, etc.

#### `Toast`

- **Opis:** Notification toast (via Sonner)
- **Props:** `type`, `message`, `duration`
- **Types:** success, error, info, loading
- **Features:**
  - Position: top-right (desktop), top-center (mobile)
  - Auto-dismiss (4s success/info, 6s error, infinite loading)
  - Stack multiple toasts
  - Swipe to dismiss (mobile)
  - Action button (optional)
- **Accessibility:** ARIA live region (role="status")

#### `Dropdown Menu`

- **Opis:** Contextual menu (action menus, filters)
- **Props:** `trigger`, `items`, `align`
- **Features:**
  - Trigger button (three dots, chevron, etc.)
  - Item list z icons
  - Separators
  - Disabled items
  - Keyboard navigation (Arrow keys, Enter, Escape)
- **Library:** Radix UI Dropdown Menu (shadcn/ui)
- **Accessibility:** Menu ARIA pattern

#### `Accordion`

- **Opis:** Expandable/collapsible sections
- **Props:** `items`, `allowMultiple`, `defaultOpen`
- **Features:**
  - Click header to toggle
  - Icon rotation (chevron)
  - Smooth expand/collapse animation
  - Keyboard navigation
- **Usage:** Exercise descriptions, plan exercises list
- **Library:** Radix UI Accordion (shadcn/ui)
- **Accessibility:** Accordion ARIA pattern

---

### 5.5 Feature-Specific Components

#### `VimeoPlayer`

- **Opis:** Vimeo video player wrapper
- **Props:** `videoId`, `autoplay`, `controls`
- **Features:**
  - 16:9 aspect ratio container
  - Responsive
  - react-player integration
  - Loading state
  - Error state (invalid video ID)
- **Security:** Vimeo private videos with token
- **Accessibility:** Video controls accessible

#### `DragDropList`

- **Opis:** Drag-and-drop sortable list
- **Props:** `items`, `onReorder`, `renderItem`
- **Features:**
  - @dnd-kit/sortable integration
  - Drag handle per item
  - Visual feedback (dragging state, drop zones)
  - Touch support
  - Keyboard support (Space to grab, Arrow keys to move)
  - Auto-scroll when dragging near edge
- **Usage:** Plan exercises reordering
- **Accessibility:** ARIA live announcements dla reorder

#### `PlanExerciseRow`

- **Opis:** Single exercise row w plan form (create/edit)
- **Props:** `exercise`, `values`, `onChange`, `onRemove`, `dragHandleProps`
- **Features:**
  - Drag handle
  - Exercise name (z link do preview)
  - Inline fields: Serie, Reps, Ciężar, Tempo
  - Remove button (X)
  - Validation per field
- **Integration:** React Hook Form (useFieldArray)

#### `ExerciseCompletionBadge`

- **Opis:** Badge showing exercise completion status
- **Props:** `status`, `reason` (optional)
- **Statuses:**
  - Completed: ✓ (green)
  - Not completed: ✗ (red) + reason tooltip
  - Pending: ⚪ (gray)
- **Features:**
  - Color-coded
  - Icon + text
  - Tooltip z reason (jeśli not completed)
- **Accessibility:** ARIA label z full status + reason

#### `FilterToolbar`

- **Opis:** Reusable toolbar dla filtering/searching lists
- **Props:** `filters`, `onFilterChange`, `onSearch`, `onClear`
- **Features:**
  - Search input (debounced)
  - Filter dropdowns/selects
  - Date range picker (optional)
  - Active filters badges bar
  - "Wyczyść wszystkie" button
  - Responsive (stack on mobile)
- **Integration:** URL state sync

#### `Pagination`

- **Opis:** Pagination component
- **Props:** `currentPage`, `totalPages`, `onPageChange`, `totalItems`, `itemsPerPage`
- **Features:**
  - Previous/Next buttons
  - Page numbers (max 7 pokazanych, ellipsis for overflow)
  - "Wyświetlono X-Y z Z wyników" text
  - Disabled states
  - Keyboard navigation
- **Accessibility:** ARIA navigation landmark, page buttons labeled

---

### 5.6 Loading & Empty States Components

#### `Skeleton`

- **Opis:** Loading placeholder
- **Props:** `variant`, `count`, `height`, `width`
- **Warianty:** Text, card, avatar, table-row
- **Features:**
  - Animated pulse
  - Match target component dimensions
- **Usage:** Initial page loads przed data fetch

#### `EmptyState`

- **Opis:** Placeholder gdy brak danych
- **Props:** `icon`, `title`, `description`, `action` (CTA button)
- **Features:**
  - Centered layout
  - Icon (48-64px, lucide-react)
  - Title (heading)
  - Description (1-2 zdania)
  - Primary CTA button (optional)
- **Examples:**
  - Brak planów: "Nie masz jeszcze planów" + "Stwórz pierwszy plan"
  - Brak wyników search: "Nie znaleziono wyników" + "Wyczyść filtry"

#### `LoadingSpinner`

- **Opis:** Spinner dla loading states
- **Props:** `size`, `variant`
- **Warianty:** Inline (w buttons), full-page, section
- **Features:**
  - Animated rotation
  - Sizes: sm, md, lg
- **Accessibility:** ARIA role="status", sr-only text "Ładowanie..."

#### `ErrorState`

- **Opis:** Error display component
- **Props:** `error`, `onRetry`
- **Features:**
  - Error icon (red)
  - Error message (user-friendly)
  - Retry button (optional)
  - Technical details (collapsible, for debugging)
- **Usage:** API fetch errors, form submission errors

---

### 5.7 Utility Components

#### `Breadcrumbs`

- **Opis:** Breadcrumb navigation trail
- **Props:** `items` (array of {label, href})
- **Features:**
  - Separator (chevron right)
  - Links dla all segments oprócz current
  - Truncation dla long labels
  - Tooltips dla truncated labels
- **Accessibility:** ARIA breadcrumb navigation

#### `PageHeader`

- **Opis:** Consistent page header
- **Props:** `title`, `description`, `actions` (buttons)
- **Features:**
  - Title (h1)
  - Description (optional subtitle)
  - Action buttons (aligned right)
  - Responsive (stack on mobile)
- **Usage:** Top of most pages

#### `StatsCard`

- **Opis:** Card displaying single stat/metric
- **Props:** `label`, `value`, `icon`, `trend` (optional)
- **Features:**
  - Icon (colored background circle)
  - Large value text
  - Label text
  - Optional trend indicator (↑↓ + %)
- **Usage:** Dashboard stats grids

#### `ActionMenu`

- **Opis:** Three-dot menu dla row actions
- **Props:** `items` (array of {label, icon, onClick, variant})
- **Features:**
  - Trigger: three-dot icon button
  - Dropdown z action items
  - Item variants: default, destructive
  - Separators between groups
- **Integration:** Dropdown Menu component

#### `CopyButton`

- **Opis:** Button to copy text to clipboard
- **Props:** `text`, `label`
- **Features:**
  - Click to copy
  - Toast confirmation
  - Icon change on success (copy → check)
- **Usage:** Copy links, IDs, etc.

---

### 5.8 Accessibility & UX Utilities

#### Focus Management Hook (`useFocusTrap`)

- **Opis:** Trap focus w modals/drawers
- **Usage:** Apply to modal containers
- **Features:** Return focus to trigger on close

#### Unsaved Changes Hook (`useUnsavedChanges`)

- **Opis:** Warn user when leaving page with unsaved form data
- **Integration:** React Hook Form `isDirty` state
- **Features:** Browser confirm dialog, in-app modal (optional)

#### Keyboard Shortcuts Hook (`useKeyboardShortcut`)

- **Opis:** Register global keyboard shortcuts
- **Usage:** Quick actions (e.g., Cmd+K for search)
- **Features:** Platform detection (Mac vs Windows keys)

#### Responsive Hook (`useMediaQuery`)

- **Opis:** Detect screen size for conditional rendering
- **Usage:** Switch between table/cards, show/hide elements
- **Features:** Matches Tailwind breakpoints

#### Debounce Hook (`useDebounce`)

- **Opis:** Debounce input values
- **Usage:** Search inputs (300ms delay)
- **Features:** Configurable delay

---

## 6. States i Edge Cases

### 6.1 Authentication States

#### Loading States

- **Initial app load:** Check JWT validity
  - Show: App-level spinner
  - Prevent: Flash of login page dla authenticated users
- **Login submit:** Validating credentials
  - Show: Button spinner + "Logowanie..."
  - Disable: Submit button
- **Token refresh:** Background JWT refresh
  - Show: Nothing (silent)
  - Fallback: Redirect to login if refresh fails

#### Error States

- **Invalid credentials:** "Nieprawidłowy email lub hasło"
- **Account pending:** "Twoje konto oczekuje na aktywację. Sprawdź email."
- **Account suspended:** "Twoje konto zostało zawieszone. Skontaktuj się z administratorem."
- **Session expired:** Toast + redirect to login
- **Network error:** "Błąd połączenia. Sprawdź internet i spróbuj ponownie."

#### Edge Cases

- **Multiple sessions:** Allow (no session limit MVP)
- **Password reset dla pending user:** Allow
- **Activation link już użyty:** "To konto zostało już aktywowane. Przejdź do logowania."
- **Role change during session:** Force logout + re-login

---

### 6.2 Form States

#### Validation States

- **Valid field:** Green checkmark (optional)
- **Invalid field:** Red border + error message + error icon
- **Required field not filled:** Error on blur or submit attempt
- **Async validation (email uniqueness):** Debounced check + spinner

#### Submission States

- **Submitting:** Button spinner + "Zapisywanie..." + disabled form
- **Success:** Toast + redirect lub reset form
- **Error:** Toast + keep form values + enable retry

#### Edge Cases

- **Network error during submit:** Show error toast, keep form state, allow retry
- **Validation error from API:** Display field-level errors from API response
- **Session expired during submit:** Save draft to localStorage (optional), redirect to login
- **Duplicate submission (double click):** Prevent with disabled state

---

### 6.3 Data Loading States

#### List Views

- **Initial load:** Skeleton rows (5-10)
- **Pagination:** keepPreviousData (show old data during fetch)
- **Filter change:** Show loading overlay + disabled filters
- **Empty result:** EmptyState component
- **Error:** ErrorState component z retry button

#### Detail Views

- **Initial load:** Skeleton layout (header + content blocks)
- **Refetch (after edit):** Subtle loading indicator (not full skeleton)
- **Not found (404):** EmptyState: "Nie znaleziono. Może został usunięty?"
- **Permission denied (403):** EmptyState: "Nie masz dostępu do tego zasobu"

#### Edge Cases

- **Stale data:** Auto-refetch w tle (TanStack Query staleTime)
- **Infinite loading:** Timeout fallback (30s) → error state
- **Partial load failure:** Show loaded data + error banner dla failed parts
- **Slow connection:** Show progress indicator jeśli >2s

---

### 6.4 CRUD Operation Edge Cases

#### Create Operations

- **Duplicate name:** API validation error → display field error
- **Required relation missing (client bez trainer):** Form validation prevents submit
- **Email notification failure:** Record saved, toast warning: "Utworzono, ale email nie został wysłany"

#### Update Operations

- **Concurrent edit (two users):** Last write wins (no conflict detection MVP)
- **Update non-existent record:** API 404 → error toast + redirect to list
- **Partial update failure:** Rollback + error toast
- **RLS prevents update:** API 403 → error toast + refresh data

#### Delete Operations

- **Cascade implications (delete trainer → hide plans):** Confirmation modal explains
- **Delete in-use entity (exercise w planach):** Confirmation modal shows count
- **Delete own account:** Prevent w UI (admin can't delete self)
- **Already deleted (by another user):** API 404 → toast info + remove from local list

---

### 6.5 Plan & Exercise Specific Edge Cases

#### Plan Creation/Edit

- **No exercises added:** Form validation error
- **client suspended podczas create:** API validation → error toast
- **Exercise deleted podczas edit planu:** Show warning: "Ćwiczenie [nazwa] jest niedostępne"
- **Bardzo długa lista ćwiczeń (>50):** Paginacja w add exercise modal
- **Drag-drop failure (mobile):** Fallback: manual reorder buttons

#### Exercise Completion

- **Mark completed bez watching video:** Allow (no tracking MVP)
- **Change from completed to not completed:** Confirmation modal
- **Reason required but not provided:** Form validation
- **Trainer edits plan podczas gdy client marks completion:** Both changes persist (no conflict)
- **Plan hidden po completion:** Completion saved ale plan disappears from list

#### Video Playback

- **Invalid Vimeo ID:** Error state w player: "Nie można załadować wideo"
- **Vimeo token expired:** Error state + contact admin message
- **Slow video load:** Show buffering spinner (native player behavior)
- **Video removed from Vimeo:** Error state, exercise still visible (z description)

---

### 6.6 Access Control Edge Cases

#### Role-Based Access

- **URL manipulation (client tries /admin):** Middleware redirect to proper dashboard
- **Direct link to unauthorized resource:** 403 error page
- **Role change (promote client to trainer):** Force logout, re-login required
- **RLS policy block:** API returns empty/error → show permission denied message

#### client-Trainer Assignment

- **Trainer suspended → client access:** client can still login, plans remain visible
- **Trainer deleted → client access:** Plans remain, no trainer info shown
- **client reassigned to new trainer:** Immediate (no grace period), old trainer loses access
- **client views plan immediately before hidden:** Can finish current session, refresh hides

---

### 6.7 Notification Edge Cases

#### Email Delivery

- **SendGrid API failure:** Toast warning: "Zapis udany, ale email nie został wysłany"
- **Invalid email address:** Validate w form, block creation
- **User email bounces/spam:** No retry mechanism MVP (admin manual resend)
- **Multiple activations sent:** Only newest link valid

#### In-App Notifications (Toasts)

- **Multiple toasts rapid-fire:** Stack z limit (max 3 visible)
- **Toast during page transition:** Persist toast across navigation (Sonner feature)
- **Toast accessibility:** Screen reader announces (ARIA live)

---

### 6.8 Responsive & Mobile Edge Cases

#### Small Screens

- **Long table on mobile:** Horizontal scroll z shadow indicators
- **Complex forms on mobile:** Stack fields, increase touch targets (min 44px)
- **Drag-drop on mobile:** Touch events supported (@dnd-kit), fallback buttons
- **Modal on small screen:** Full-screen modal variant

#### Touch Interactions

- **Swipe gestures:** Swipe to dismiss toasts, back navigation (optional)
- **Long press:** Optional context menu (not MVP)
- **Double-tap zoom:** Disabled dla UI elements (viewport meta tag)

#### Network Conditions

- **Offline detection:** Show banner: "Brak połączenia"
- **Slow 3G:** Extended timeouts, show loading states longer
- **Failed image/video loads:** Fallback placeholder images

---

### 6.9 Browser & Compatibility

#### Browser Support

- **Target:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Fallbacks:** Graceful degradation (no IE11 support)
- **LocalStorage unavailable:** Fallback dla sidebar state (default open)
- **Cookies disabled:** Auth still works (JWT in memory/localStorage)

#### Accessibility

- **Screen readers:** ARIA labels, roles, live regions
- **Keyboard-only navigation:** All actions accessible via keyboard
- **High contrast mode:** Respect system preferences
- **Reduced motion:** Disable animations (prefers-reduced-motion)
- **Zoom (up to 200%):** Layout doesn't break

---

## 7. Podsumowanie i Priorytety Implementacji

### 7.1 Fazie Implementacji

**Faza 1: Foundation (Week 1-2)**

- Setup projektu (Astro + React + TailwindCSS + shadcn/ui)
- Auth layouts i basic routing
- Layout components (Sidebar, TopBar, MainLayout)
- Auth flows (Login, Activate, Reset Password)
- User session management (Context + TanStack Query)

**Faza 2: Admin Core (Week 2-3)**

- Admin dashboard
- Users management (CRUD, list, detail)
- Exercises management (CRUD, list, detail)
- Reasons management (CRUD)
- Admin profile

**Faza 3: Trainer Core (Week 3-4)**

- Trainer dashboard
- Clients list i detail (read-only)
- Exercise library (read-only)
- Plans CRUD (basic, without drag-drop)
- Trainer profile

**Faza 4: Plan Management Advanced (Week 4-5)**

- Drag-drop exercises sorting
- Add Exercise modal (search, select)
- Inline editing per exercise
- Plan duplication
- Visibility toggle
- Email notifications integration

**Faza 5: Client Core (Week 5-6)**

- Client dashboard (plans list)
- Plan detail view
- Exercise completion view (z Vimeo player)
- Completion marking (completed/not completed + reasons)
- Client profile

**Faza 6: Polish & Testing (Week 6-7)**

- Responsive testing (mobile/tablet)
- Accessibility audit i fixes
- Loading states i error handling refinement
- Performance optimization (code splitting, lazy loading)
- E2E testing dla critical flows

**Faza 7: Deployment & Monitoring (Week 7-8)**

- Production build
- Deployment setup (Vercel/Netlify)
- Error monitoring (Sentry)
- Analytics setup (optional)
- Documentation (README, user guides)

---

### 7.2 Kluczowe Decyzje Architektoniczne

1. **Role-Based Routing:** Separate route prefixes per role dla clarity i security
2. **Layout Composition:** Hybrid sidebar + topbar dla flexibility
3. **State Management:** TanStack Query dla server state, Context API dla user session (no Redux overkill)
4. **Forms:** React Hook Form + Zod dla consistent validation
5. **Components:** shadcn/ui (Radix UI) dla accessibility i customizability
6. **Drag-Drop:** @dnd-kit dla modern, accessible DnD
7. **Video:** react-player dla Vimeo embeds (simple, reliable)
8. **Notifications:** sonner dla toast messages (lightweight, elegant)
9. **Responsive:** Mobile-first design, table→cards pattern
10. **Accessibility:** ARIA patterns, keyboard nav, screen reader support throughout

---

### 7.3 Metryki Sukcesu UI

- **Performance:** LCP <2s, FID <100ms, CLS <0.1
- **Accessibility:** WCAG 2.1 AA compliance, Lighthouse score >90
- **Responsiveness:** Wszystkie funkcje dostępne na mobile
- **User Satisfaction:** SUS score >70, task completion rate >90%
- **Error Rate:** <5% form submission errors, <1% critical errors
- **Load Time:** Initial page load <3s na 3G, subsequent <1s

---

## 8. Załączniki

### 8.1 User Flow Diagrams (tekstowe)

#### Admin: Create client Flow

```
[Admin Dashboard]
    ↓
[Click "Użytkownicy"]
    ↓
[Users List Page]
    ↓
[Click "Dodaj użytkownika"]
    ↓
[Create User Form]
    ↓ (fill form)
[Select role=client → Trainer field appears]
    ↓ (select trainer)
[Click "Zapisz i wyślij link"]
    ↓ (API call)
[Success: User created + email sent]
    ↓
[Redirect to User Detail]
    ↓
[Toast: "Podopieczny dodany"]
```

#### Trainer: Create Plan Flow

```
[Trainer Dashboard]
    ↓
[Click "Plany treningowe"]
    ↓
[Plans List]
    ↓
[Click "Stwórz plan"]
    ↓
[Create Plan Form]
    ↓ (fill basic info)
[Click "+ Dodaj ćwiczenie"]
    ↓
[Add Exercise Modal - Search/Select]
    ↓ (select exercises)
[Click "Dodaj" w modal]
    ↓
[Exercises appear in list]
    ↓ (drag-drop reorder)
    ↓ (fill inline fields: series, reps, etc.)
[Click "Zapisz"]
    ↓ (API call + email)
[Success: Plan created]
    ↓
[Redirect to Plan Detail]
    ↓
[Toast: "Plan utworzony i wysłany"]
```

#### client: Complete Exercise Flow

```
[Client Dashboard]
    ↓
[Click Plan Card]
    ↓
[Plan Detail View]
    ↓ (view exercises accordion)
[Click Exercise Row]
    ↓
[Exercise Completion View]
    ↓ (watch video, read description)
[Perform exercise]
    ↓
[Click "✓ Wykonane" OR "✗ Nie wykonano"]
    ↓ (if not completed)
[Modal: Select/Enter Reason]
    ↓
[Click "Zapisz" w modal]
    ↓ (API call)
[Success: Completion recorded]
    ↓
[Toast: "Status zapisany"]
    ↓
[Auto-redirect to Plan Detail]
    ↓
[Progress bar updated]
```

---

### 8.2 Component Dependency Map

```
App
├── AuthLayout
│   ├── Logo
│   ├── LoginForm
│   ├── ActivationForm
│   └── ResetPasswordForm
│
├── AdminLayout
│   ├── Sidebar
│   ├── TopBar
│   │   ├── Breadcrumbs
│   │   └── UserMenu
│   └── Pages
│       ├── Dashboard → StatsCard, RecentActivityList
│       ├── UsersList → DataTable, UserAvatar, StatusBadge, FilterToolbar, Pagination
│       ├── CreateUser → FormField, SearchableSelect
│       ├── ExercisesList → DataTable, ExerciseVideoPreview
│       ├── CreateExercise → FormField, VimeoPreview, MarkdownEditor
│       └── ReasonsList → DataTable, CreateReasonModal
│
├── TrainerLayout
│   ├── Sidebar
│   ├── TopBar
│   └── Pages
│       ├── Dashboard → StatsCard, ClientsQuickList
│       ├── ClientsList → DataTable, clientActionMenu
│       ├── PlansList → DataTable, PlanActionMenu
│       ├── CreatePlan → FormField, DragDropList, PlanExerciseRow, AddExerciseModal
│       └── PlanDetail → PlanExercisesList, ProgressBar, ExerciseCompletionBadge
│
└── ClientLayout
    ├── Sidebar (simplified)
    ├── TopBar
    └── Pages
        ├── Dashboard → PlanCardsGrid, PlanCard, SortDropdown
        ├── PlanDetail → PlanExercisesList, ProgressBar
        └── ExerciseCompletion → VimeoPlayer, ExerciseMetadataGrid, CompletionButtonsSection, NotCompletedReasonModal
```

---

### 8.3 Zod Schema Examples (koncepcja)

```typescript
// User Schema
const userSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  firstName: z.string().min(1, "Imię jest wymagane"),
  lastName: z.string().min(1, "Nazwisko jest wymagane"),
  role: z.enum(["administrator", "trainer", "client"]),
  trainerId: z.string().uuid().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.date().optional(),
});

// Exercise Schema
const exerciseSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  vimeoToken: z.string().regex(/^\d+$/, "ID musi składać się tylko z cyfr"),
  description: z.string().optional(),
  goals: z.string().optional(),
  steps: z.string().optional(),
  tips: z.string().optional(),
  tempo: z
    .string()
    .regex(/^(\d{4}|\d+-\d+-\d+)$/, "Tempo powinno być w formacie X-X-X lub XXXX")
    .optional(),
  defaultWeight: z.number().positive().optional(),
});

// Plan Schema
const planSchema = z.object({
  name: z.string().min(1, "Nazwa planu jest wymagana"),
  description: z.string().optional(),
  clientId: z.string().uuid("Wybierz podopiecznego"),
  isVisible: z.boolean(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        sortOrder: z.number().int().positive(),
        sets: z.number().int().positive("Podaj liczbę serii"),
        reps: z.number().int().positive("Podaj liczbę powtórzeń"),
        weight: z.number().positive().optional(),
        tempo: z.string().optional(),
      })
    )
    .min(1, "Dodaj przynajmniej jedno ćwiczenie"),
});
```

---

**Koniec dokumentu UI Architecture**
