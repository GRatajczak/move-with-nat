<authentication_analysis>

### 1. Przepływy autentykacji

- **Tworzenie Użytkownika (przez Admina/Trenera)**: Zalogowany administrator lub trener tworzy nowego użytkownika w systemie.
- **Aktywacja Konta**: Nowy użytkownik otrzymuje e-mail z linkiem do ustawienia hasła i aktywacji konta.
- **Logowanie użytkownika**: Istniejący użytkownik loguje się przy użyciu e-maila i hasła.
- **Odzyskiwanie hasła**: Użytkownik, który zapomniał hasła, resetuje je poprzez link wysłany na e-mail.
- **Weryfikacja i odświeżanie sesji**: System weryfikuje token dostępowy przy każdym żądaniu do chronionych zasobów.

### 2. Główni aktorzy i ich interakcje

- **Admin/Trener (Przeglądarka)**: Inicjuje proces tworzenia nowego użytkownika.
- **Nowy Użytkownik (Przeglądarka)**: Odbiera e-mail, klika link aktywacyjny i ustawia swoje hasło.
- **Astro API (`/api/users`)**: Endpoint odpowiedzialny za tworzenie użytkowników.
- **UserService**: Serwis obsługujący logikę biznesową związaną z użytkownikami (tworzenie, walidacja).
- **EmailService**: Serwis odpowiedzialny za wysyłanie e-maili (np. aktywacyjnych).
- **Supabase Auth**: Zarządza tożsamościami użytkowników i generuje linki aktywacyjne.

</authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber

    box Tworzenie i Aktywacja Użytkownika
        actor Admin/Trener
        participant Przeglądarka
        participant API as POST /api/users
        participant UserService
        participant EmailService
        participant Supabase as Supabase Auth
        actor Nowy Użytkownik

        Admin/Trener->>+Przeglądarka: 1. Wypełnia formularz (np. w /admin/users/new)
        Przeglądarka->>+API: 2. Żądanie utworzenia użytkownika z danymi
        API->>+UserService: 3. Przekaż dane do serwisu
        UserService->>+Supabase: 4. Utwórz użytkownika (np. inviteUserByEmail)
        Supabase-->>-UserService: 5. Zwraca sukces i link aktywacyjny
        UserService->>+EmailService: 6. Wyślij e-mail aktywacyjny
        EmailService-->>Nowy Użytkownik: 7. Dostarcza e-mail z linkiem
        API-->>-Przeglądarka: 8. Potwierdzenie utworzenia użytkownika
        deactivate Przeglądarka

        Nowy Użytkownik->>+Przeglądarka: 9. Klika link aktywacyjny (/reset-password)
        Przeglądarka->>+API: 10. Żądanie ustawienia hasła
        API->>+Supabase: 11. Aktualizuj użytkownika (ustaw hasło)
        Supabase-->>-API: 12. Potwierdzenie aktywacji
        API-->>-Przeglądarka: 13. Konto aktywowane, przekieruj do logowania
        deactivate Przeglądarka
    end

    box Logowanie i Sesja
        actor Użytkownik
        participant Przeglądarka
        participant Middleware
        participant API
        participant Supabase as Supabase Auth

        Użytkownik->>+Przeglądarka: 1. Wprowadza e-mail i hasło
        Przeglądarka->>+API: 2. POST /api/auth/login
        API->>+Supabase: 3. signInWithPassword
        Supabase-->>-API: 4. Zwraca tokeny (access & refresh)
        API-->>-Przeglądarka: 5. Zapisz tokeny, przekieruj
        deactivate Przeglądarka

        Przeglądarka->>+Middleware: 6. Żądanie do chronionego zasobu
        Middleware->>+Supabase: 7. Weryfikuj access_token (getUser)
        alt Token poprawny
            Supabase-->>-Middleware: 8a. Zwraca dane użytkownika
            Middleware-->>Przeglądarka: 9a. Zezwól na dostęp
        else Token wygasł
            Supabase-->>-Middleware: 8b. Błąd: Token wygasł
            Middleware->>API: 9b. Żądanie odświeżenia tokenu
            API->>Supabase: 10b. refreshSession
            Supabase-->>API: 11b. Nowy access_token
            API-->>Middleware: 12b. Przekaż nowy token
            Middleware-->>Przeglądarka: 13b. Zezwól na dostęp
        end
    end

```

</mermaid_diagram>
