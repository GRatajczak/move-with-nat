# Plan Testów Aplikacji "MoveWithNat"

## 1. Wprowadzenie i cele testowania

### Wprowadzenie

Plan testów dotyczy aplikacji webowej "MoveWithNat", narzędzia dla trenerów personalnych do zarządzania planami treningowymi swoich podopiecznych. Aplikacja obsługuje role Administratora, Trenera i Podopiecznego, eliminując potrzebę korzystania z arkuszy kalkulacyjnych.

### Cele testowania

Głównym celem testów jest weryfikacja zgodności aplikacji z dokumentacją produktu (PRD) oraz zapewnienie jej wysokiej jakości przed wdrożeniem produkcyjnym. Cele szczegółowe to:

- **Weryfikacja funkcjonalności:** Potwierdzenie, że wszystkie kluczowe funkcje, takie jak zarządzanie użytkownikami, ćwiczeniami i planami, działają poprawnie.
- **Zapewnienie jakości:** Wykrycie i zaraportowanie błędów w celu ich eliminacji.
- **Ocena użyteczności:** Sprawdzenie, czy interfejs jest intuicyjny i przyjazny dla użytkownika.
- **Weryfikacja bezpieczeństwa:** Upewnienie się, że mechanizmy autoryzacji i kontroli dostępu (RLS) skutecznie chronią dane.
- **Ocena wydajności:** Zapewnienie, że aplikacja działa płynnie pod standardowym obciążeniem.

## 2. Zakres testów

### Funkcjonalności objęte testami

- **Uwierzytelnianie:** Logowanie, wylogowywanie, aktywacja konta, reset hasła.
- **Zarządzanie użytkownikami:** Pełen cykl życia kont (CRUD) dla wszystkich ról.
- **Kontrola dostępu (RLS):** Weryfikacja uprawnień zgodnie z rolą.
- **Zarządzanie ćwiczeniami:** CRUD dla biblioteki ćwiczeń, w tym integracja z Vimeo.
- **Zarządzanie planami:** CRUD dla planów treningowych, w tym ich widoczność.
- **Panel Podopiecznego:** Przeglądanie planów i oznaczanie postępów.
- **Interfejs użytkownika:** Responsywność i spójność wizualna.
- **API:** Testy wszystkich publicznych endpointów.

### Funkcjonalności wyłączone z testów (MVP)

- Czat w czasie rzeczywistym.
- Automatyzacja planów (harmonogramowanie, wygasanie).
- Moduł planów dietetycznych.
- Zaawansowane testy penetracyjne i obciążeniowe.

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests):** Weryfikacja pojedynczych komponentów i funkcji.
- **Testy integracyjne (Integration Tests):** Sprawdzenie współpracy między modułami (np. UI-API-Baza danych).
- **Testy End-to-End (E2E):** Automatyzacja pełnych scenariuszy użytkownika.
- **Testy funkcjonalne i manualne:** Weryfikacja zgodności z wymaganiami PRD.
- **Testy API:** Sprawdzenie logiki, obsługi błędów i kontraktu API.
- **Testy regresyjne:** Zapewnienie, że nowe zmiany nie zepsuły istniejących funkcji.
- **Testy użyteczności (Usability Testing):** Ocena UX pod kątem intuicyjności.
- **Testy kompatybilności:** Weryfikacja działania na kluczowych przeglądarkach i urządzeniach.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

Główne scenariusze będą obejmować pełne przepływy użytkowników, np.:

1.  **Rejestracja i aktywacja:** Administrator tworzy konto Trenera -> Trener otrzymuje e-mail aktywacyjny -> Trener ustawia hasło i loguje się.
2.  **Pełen cykl planu treningowego:** Trener loguje się -> Tworzy nowego Podopiecznego -> Administrator tworzy nowe ćwiczenie -> Trener tworzy plan z nowym ćwiczeniem i przypisuje go do Podopiecznego -> Podopieczny otrzymuje e-mail -> Loguje się i widzi plan -> Oznacza ćwiczenie jako wykonane -> Trener widzi postęp Podopiecznego.
3.  **Kontrola dostępu:** Podopieczny próbuje uzyskać dostęp do panelu administracyjnego i jego żądanie jest blokowane.

## 5. Środowisko testowe

- **Infrastruktura:** Osobne środowisko testowe na DigitalOcean, odzwierciedlające produkcję.
- **Baza danych:** Dedykowana instancja Supabase z danymi testowymi.
- **Usługi zewnętrzne:** Testowe klucze API dla SendGrid i Vimeo.
- **Platformy:**
  - **Przeglądarki:** Chrome, Firefox, Safari (najnowsze wersje).
  - **Systemy mobilne:** Android, iOS (emulatory lub urządzenia fizyczne).

## 6. Narzędzia do testowania

| Kategoria                 | Narzędzie                     | Zastosowanie                                        |
| :------------------------ | :---------------------------- | :-------------------------------------------------- |
| **Zarządzanie projektem** | Jira                          | Śledzenie zadań i raportowanie błędów.              |
| **Testy API**             | Postman / Insomnia            | Manualne i automatyczne testy endpointów.           |
| **Automatyzacja E2E**     | Playwright / Cypress          | Automatyzacja scenariuszy testowych w przeglądarce. |
| **CI/CD**                 | GitHub Actions                | Uruchamianie testów automatycznych w pipeline.      |
| **Testy jednostkowe**     | Vitest, React Testing Library | Testowanie komponentów React i logiki TypeScript.   |

## 7. Harmonogram testów

Testy będą prowadzone iteracyjnie, w ścisłej współpracy z cyklem deweloperskim.

| Faza                                       | Orientacyjny czas trwania | Główne działania                                                 |
| :----------------------------------------- | :------------------------ | :--------------------------------------------------------------- |
| **Faza 1: Uwierzytelnianie i użytkownicy** | 1 tydzień                 | Testy funkcjonalne i E2E dla logowania, ról i CRUD użytkowników. |
| **Faza 2: Ćwiczenia i plany**              | 2 tygodnie                | Testy CRUD dla ćwiczeń i planów, powiadomień e-mail.             |
| **Faza 3: Testy kompleksowe**              | 1 tydzień                 | Pełne testy E2E, testy regresyjne, testy kompatybilności.        |
| **Faza 4: UAT i stabilizacja**             | 1 tydzień                 | Testy akceptacyjne użytkownika, poprawki ostatnich błędów.       |

## 8. Kryteria akceptacji testów

### Kryteria rozpoczęcia testów

- Wdrożenie funkcjonalności na środowisku testowym.
- Ukończenie testów jednostkowych i podstawowych testów integracyjnych.
- Dostępność danych testowych.

### Kryteria zakończenia testów

- Wykonanie wszystkich zaplanowanych scenariuszy testowych.
- Naprawienie 100% błędów krytycznych i blokujących.
- Naprawienie co najmniej 90% błędów o wysokim priorytecie.
- Pomyślne ukończenie testów akceptacyjnych (UAT).

## 9. Role i odpowiedzialności w procesie testowania

| Rola              | Główne odpowiedzialności                                                |
| :---------------- | :---------------------------------------------------------------------- |
| **QA Engineer**   | Projektowanie i wykonywanie testów, automatyzacja, raportowanie błędów. |
| **Deweloper**     | Implementacja, testy jednostkowe, naprawa błędów, wsparcie techniczne.  |
| **Product Owner** | Definiowanie wymagań, priorytetyzacja błędów, udział w UAT.             |
| **DevOps**        | Utrzymanie środowiska testowego i pipeline'ów CI/CD.                    |

## 10. Procedury raportowania błędów

1.  **Narzędzie:** Wszystkie błędy są raportowane i śledzone w Jirze.
2.  **Format zgłoszenia:** Każde zgłoszenie musi zawierać:
    - **Tytuł:** Zwięzły i jasny opis problemu.
    - **Kroki do odtworzenia:** Numerowana lista kroków.
    - **Rezultat oczekiwany vs. rzeczywisty:** Porównanie zachowania.
    - **Dowody:** Zrzuty ekranu, nagrania wideo, logi z konsoli.
    - **Priorytet:** (Krytyczny, Wysoki, Średni, Niski).
3.  **Cykl życia:** Nowy -> Potwierdzony -> W trakcie naprawy -> Gotowy do weryfikacji -> Zamknięty.
4.  **Triage:** Regularne spotkania w celu przeglądu i priorytetyzacji zgłoszonych błędów.
