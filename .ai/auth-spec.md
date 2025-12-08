### **Specyfikacja Techniczna: Moduł Uwierzytelniania i Zarządzania Kontem Użytkownika**

Poniższy dokument opisuje architekturę i implementację modułu rejestracji, logowania i odzyskiwania hasła w aplikacji MoveWithNat, zgodnie z wymaganiami z pliku `.ai/prd.md` oraz istniejącym stosem technologicznym.

---

### **1. Architektura Interfejsu Użytkownika (Frontend)**

Interfejs użytkownika zostanie zrealizowany przy użyciu stron Astro dla struktury i routingu oraz komponentów React do obsługi interaktywnych formularzy z walidacją po stronie klienta.

#### **1.1. Nowe Strony (Astro Pages)**

Zostaną utworzone następujące strony w katalogu `src/pages`:

- **`/login.astro`**: Strona logowania.
  - Będzie zawierać formularz logowania jako komponent React.
  - Dostępna dla niezalogowanych użytkowników.
  - Po pomyślnym zalogowaniu, użytkownik zostanie przekierowany do odpowiedniego dashboardu na podstawie swojej roli (`/admin/dashboard`, `/trainer/dashboard`, `/client/dashboard`).

- **`/forgot-password.astro`**: Strona odzyskiwania hasła.
  - Będzie zawierać formularz do wprowadzenia adresu e-mail, zrealizowany jako komponent React.
  - Po przesłaniu, użytkownik otrzyma informację o wysłaniu linku do resetu hasła.

- **`/reset-password.astro`**: Strona do ustawiania nowego hasła.
  - Strona ta będzie dostępna poprzez specjalny link z tokenem wysłany na e-mail w procesie odzyskiwania hasła.
  - Będzie zawierać formularz do ustawienia nowego hasła jako komponent React (`ResetPasswordForm.tsx`).

#### **1.2. Nowe i zmodyfikowane komponenty (React Components)**

Komponenty będą umieszczone w `src/components/auth` i `src/components/profile`:

- **`LoginForm.tsx`**:
  - Odpowiedzialny za logowanie użytkownika.
  - Pola: `email`, `password`.
  - Komunikacja z API: Wywołanie endpointu `/api/auth/login`.

- **`ForgotPasswordForm.tsx`**:
  - Odpowiedzialny za wysłanie prośby o reset hasła.
  - Pola: `email`.
  - Komunikacja z API: Wywołanie endpointu `/api/auth/forgot-password`.

- **`ResetPasswordForm.tsx`** (nowy):
  - Odpowiedzialny za ustawienie nowego hasła po resecie.
  - Pola: `password`, `confirmPassword`.
  - Odbiera token z propsów (przekazany z Astro).
  - Komunikacja z API: Wywołanie endpointu `/api/auth/reset-password`.

- **`ProfileContainer.tsx`** (modyfikacja):
  - Należy dodać do tego komponentu sekcję "Zmień hasło".
  - Sekcja będzie zawierać formularz z polami: `currentPassword`, `newPassword`, `confirmNewPassword`.
  - Formularz będzie widoczny tylko dla właściciela profilu.
  - Komunikacja z API: Wywołanie nowego endpointu `/api/auth/change-password` do zmiany hasła dla zalogowanego użytkownika.

#### **1.3. Modyfikacje Layoutów i Komponentów**

- **`src/layouts/Layout.astro`** (lub główny layout aplikacji):
  - Layout zostanie zmodyfikowany, aby warunkowo renderować elementy nawigacji w zależności od statusu zalogowania użytkownika (np. "Zaloguj" vs "Wyloguj", link do profilu).
  - Informacja o sesji użytkownika będzie dostępna w `Astro.locals` dzięki middleware.

- **`Header.tsx` / `Navbar.astro`**:
  - Komponent nawigacyjny będzie wyświetlał przycisk "Wyloguj", który będzie formularzem POST wysyłającym żądanie do `/api/auth/logout`.

#### **1.4. Scenariusze Użytkownika**

1.  **Logowanie**: (bez zmian)

2.  **Resetowanie hasła (dla niezalogowanych)**:
    - Użytkownik wchodzi na `/forgot-password`.
    - Wypełnia formularz, wysyłając żądanie do `/api/auth/forgot-password`.
    - Otrzymuje e-mail z linkiem do `/reset-password`.
    - Na stronie `/reset-password` ustawia nowe hasło. Formularz wysyła żądanie do `/api/auth/reset-password`.
    - Po pomyślnej zmianie jest przekierowywany do `/login`.

3.  **Zmiana hasła (dla zalogowanych)**:
    - Użytkownik wchodzi na swoją stronę profilu (np. `/client/profile`).
    - W komponencie `ProfileContainer.tsx` wypełnia formularz zmiany hasła.
    - Formularz wysyła żądanie POST do `/api/auth/change-password`.
    - Po pomyślnej zmianie hasła otrzymuje komunikat o sukcesie.

---

### **2. Logika Backendowa**

Logika backendowa zostanie zaimplementowana jako endpointy API w Astro (`src/pages/api`) oraz middleware do ochrony tras.

#### **2.1. Struktura Endpointów API (`src/pages/api/auth`)**

- **`login.ts` (POST)**: (bez zmian)
- **`logout.ts` (POST)**: (bez zmian)
- **`forgot-password.ts` (POST)**:
  - Odbiera `email`.
  - Wywołuje `supabase.auth.resetPasswordForEmail()`, z `redirectTo` wskazującym na `/reset-password`.
- **`reset-password.ts` (POST)**:
  - Odbiera `password` z ciała żądania. Sesja z tokenem odzyskiwania jest zarządzana przez Supabase.
  - Wywołuje `supabase.auth.updateUser()` do ustawienia nowego hasła.
- **`change-password.ts` (POST)** (nowy):
  - Endpoint tylko dla zalogowanych użytkowników.
  - Odbiera `currentPassword`, `newPassword`.
  - Weryfikuje `currentPassword` logując użytkownika.
  - Jeśli poprawne, wywołuje `supabase.auth.updateUser()` z `newPassword`.

#### **2.2. Middleware (`src/middleware/index.ts`)**

Middleware w Astro będzie kluczowym elementem systemu uwierzytelniania.

- **Logika działania**:
  1.  Na każde żądanie, middleware sprawdzi obecność ciasteczka sesji.
  2.  Jeśli ciasteczko istnieje, zweryfikuje je przy użyciu `supabase.auth.getUser(jwt)`.
  3.  Jeśli sesja jest ważna, dane użytkownika i sesja zostaną zapisane w `Astro.locals`, aby były dostępne w stronach i endpointach.
  4.  Jeśli użytkownik jest na stronie chronionej (np. `/admin/*`, `/client/*`, `/trainer/*`) i nie ma ważnej sesji, zostanie przekierowany na `/login`.
  5.  Jeśli zalogowany użytkownik próbuje wejść na stronę `/login` lub `/register`, zostanie przekierowany na swój dashboard.
  6.  Sprawdzi również, czy rola użytkownika z `Astro.locals` pasuje do ścieżki (np. użytkownik z rolą `client` nie wejdzie na `/admin/dashboard`).

---

### **3. System Autentykacji (Integracja z Supabase Auth)**

- **Konfiguracja Supabase**:
  - W ustawieniach Supabase Auth należy skonfigurować szablony e-maili (potwierdzenie rejestracji, reset hasła).
  - Należy podać adres URL aplikacji, na który będą kierowane linki z e-maili (`Site URL` w ustawieniach Supabase).

- **Zarządzanie Sesją**:
  - Supabase Auth operuje na tokenach JWT. Astro backend będzie zarządzał tymi tokenami, przechowując je w bezpiecznych ciasteczkach.
  - Klient Supabase na frontendzie (`supabaseClient`) automatycznie odczyta sesję, jeśli jest dostępna, co pozwoli na wykonywanie zapytań do bazy danych z uwzględnieniem RLS.

- **Role użytkowników**:
  - Rola użytkownika (administrator, trener, klient) będzie przechowywana w tabeli `profiles` (lub podobnej) w bazie danych, powiązanej z `auth.users` przez `user_id`.
  - Po zalogowaniu, middleware odczyta rolę użytkownika i zapisze ją w `Astro.locals.user.role`. Na tej podstawie będą realizowane przekierowania i kontrola dostępu.

- **Rejestracja i Zaproszenia**:
  - Rejestracja nowych użytkowników z poziomu UI jest wyłączona. Użytkownicy (trenerzy, podopieczni, admini) są dodawani do systemu przez administratora.
  - Proces zapraszania będzie wykorzystywał `supabase.auth.admin.inviteUserByEmail()`. Ta metoda pozwala na wysłanie linku zaproszeniowego, po kliknięciu którego użytkownik będzie mógł od razu ustawić hasło na stronie `/reset-password`.
