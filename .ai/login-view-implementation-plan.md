# Plan implementacji widoku Logowanie

## 1. Przegląd

Widok logowania umożliwia uwierzytelnienie wszystkich ról użytkowników (administrator, trener, podopieczny). Po poprawnym zalogowaniu użytkownik zostaje przekierowany do odpowiedniego dashboardu zgodnie z rolą.

## 2. Routing widoku

- **Ścieżka:** `/login`
- **Dostęp:** Publiczny; jeśli użytkownik jest już uwierzytelniony następuje automatyczne przekierowanie na jego domyślny dashboard.

## 3. Struktura komponentów

```
LoginPage (route level)
└── AuthLayout (centered card + gradient background)
    └── LoginForm (React Hook Form)
        ├── FormField (Email)
        ├── FormField (Password + show/hide)
        ├── RememberMeCheckbox (future ‑ MVP optional)
        └── SubmitButton
```

## 4. Szczegóły komponentów

### LoginPage

- **Opis:** Komponent routingu. Sprawdza, czy użytkownik jest zalogowany. Jeśli tak – redirect do `/admin`, `/trainer` lub `/client`.
- **Główne elementy:** `<AuthLayout>` zagnieżdżający `LoginForm`.
- **Obsługiwane interakcje:** brak (cała logika w `LoginForm`).
- **Walidacja:** n/a.
- **Typy:** `UserRole` (z kontekstu auth).
- **Propsy:** none.

### AuthLayout

- **Opis:** Wspólny layout dla wszystkich stron uwierzytelniania. Centruje kartę formularza na ekranie, funduje tło gradientowe oraz logo.
- **Główne elementy:** Logo, kontener karty (max-w-md), slot na dzieci.
- **Obsługiwane interakcje:** brak.
- **Walidacja:** n/a.
- **Typy:** none.
- **Propsy:** `children: ReactNode`.

### LoginForm

- **Opis:** Formularz z polami e-mail i hasło, walidacją, obsługą submitu i błędów.
- **Główne elementy:**
  - `FormField` dla `email` (input type="email")
  - `FormField` dla `password` (PasswordInput – pokazuje/ukrywa)
  - Link "Nie pamiętam hasła" (`/reset-password`)
  - `Button` "Zaloguj"
- **Obsługiwane interakcje:**
  - `onSubmit` → wywołanie mutacji `login`.
  - `onBlur` → walidacja pól (React Hook Form + Zod).
- **Walidacja:**
  - `email` – wymagany, poprawny format.
  - `password` – wymagane, min. 8 znaków.
- **Typy:** `LoginFormData`, `LoginErrorResponse`.
- **Propsy:** none (samodzielny w AuthLayout).

### FormField (reużywalny)

- **Opis:** Opakowanie pola formularza z etykietą, komunikatem błędu i htmlFor.
- **Elementy:** `label`, `input`, `error`, opcjonalny `helpText`.
- **Walidacja:** delegowana z React Hook Form.
- **Typy:** generics `<T>`.
- **Propsy:** `name`, `label`, `children` (input), `error`, `required`.

### PasswordInput (reuse z komponentów UI)

- **Opis:** Pole hasła z przyciskiem toggle show/hide.
- **Obsługiwane interakcje:** kliknięcie ikony oka.
- **Walidacja:** brak własnej – wykorzystuje walidację formularza.
- **Typy:** builtin.
- **Propsy:** standardowe input props.

## 5. Typy

```typescript
// DTO przesyłane do API
export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: "administrator" | "trainer" | "client";
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ViewModel dla formularza (React Hook Form)
export interface LoginFormData {
  email: string;
  password: string;
}
```

## 6. Zarządzanie stanem

- Lokalny stan formularza obsługiwany przez **React Hook Form**.
- Globalny stan sesji przechowywany w **AuthContext** (`useAuth`) oraz **TanStack Query** (mutation + setQueryData("currentUser")).
- Po udanym logowaniu: zapis tokenów w `localStorage` (lub `sessionStorage`), aktualizacja kontekstu użytkownika, redirect.

## 7. Integracja API

- **Endpoint:** `POST /auth/login`
- **Request body:** `LoginRequestDTO`
- **Sukces (200):** `LoginResponseDTO`
- **Błędy:**
  - `401 Unauthorized` – nieprawidłowe dane.
  - `429 Too Many Requests` – rate limit.
- **Implementacja w FE:**
  ```typescript
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequestDTO) => api.post<LoginResponseDTO>("/auth/login", data),
    onSuccess: ({ data }) => {
      auth.setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(["currentUser"], data.user);
      navigateByRole(data.user.role);
    },
  });
  ```

## 8. Interakcje użytkownika

1. Użytkownik wchodzi na `/login`.
2. Wpisuje e-mail → blur → walidacja formatu.
3. Wpisuje hasło.
4. `Enter` lub klik „Zaloguj”.
5. Przycisk pokazuje spinner „Logowanie…”, formularz disabled.
6. Sukces → przekierowanie + toast „Witaj ponownie, {firstName}!”.
7. Błąd → czerwony banner z komunikatem + focus na pole e-mail.
8. Link „Nie pamiętam hasła” prowadzi do `/reset-password`.

## 9. Warunki i walidacja

| Warunek                               | Komponent          | Akcja przy niespełnieniu                |
| ------------------------------------- | ------------------ | --------------------------------------- |
| Email wymagany                        | LoginForm/email    | komunikat „Wprowadź adres e-mail”       |
| Email ma poprawny format              | LoginForm/email    | komunikat „Podaj poprawny e-mail”       |
| Hasło wymagane                        | LoginForm/password | komunikat „Wprowadź hasło”              |
| Min. 8 znaków w haśle (frontend hint) | LoginForm/password | komunikat „Min. 8 znaków”               |
| 401 z API                             | LoginForm          | banner „Nieprawidłowy e-mail lub hasło” |

## 10. Obsługa błędów

| Scenariusz            | Obsługa UI                                      |
| --------------------- | ----------------------------------------------- |
| 401 Unauthorized      | Banner + reset hasła link                       |
| 429 Too Many Requests | Banner „Za dużo prób. Spróbuj ponownie za X s”  |
| Network error         | Banner „Błąd połączenia. Sprawdź internet.”     |
| Server 5xx            | Banner „Wystąpił błąd serwera. Spróbuj później” |

## 11. Kroki implementacji

1. **Routing** – dodaj trasę `/login` w `src/pages/login.astro` z `LoginPage`.
2. **Auth guard** – w `LoginPage` sprawdź `useAuth().isAuthenticated` i redirect.
3. **Stwórz komponent `AuthLayout`** w `src/layouts/AuthLayout.tsx`.
4. **Stwórz komponent `LoginForm`**:
   - Zainstaluj `react-hook-form` i `@hookform/resolvers`, dodaj Zod schema.
   - Użyj `FormField` i `PasswordInput` z biblioteki UI.
5. **Walidacja** – przenieś warunki do schematu Zod.
6. **Mutacja login** – utwórz `useLoginMutation` (TanStack Query).
7. **Integracja z `AuthContext`** – zapis tokenów, ustaw currentUser.
8. **UI/UX** – spinner na przycisku, disable form w trakcie.
9. **Toasty** – dodaj sonner toast przy sukcesie / błędzie.
10. **Testy** – napisz test e2e (Playwright) sprawdzający logowanie poprawne/niepoprawne.
11. **Accessibility** – dodaj ARIA labels, focus management po błędzie.
12. **QA** – sprawdź responsywność na mobile, tryb dark (Tailwind).
