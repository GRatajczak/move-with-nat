# Dokument Wymagań Produktowych (PRD) - MoveWithNat

## 1. Przegląd Produktu

MoveWithNat to responsywna aplikacja webowa zaprojektowana dla trenerów personalnych niezalenie czy to trener trójboju, sztuk walk czy wspinania. Umożliwia trenerom i administratorom tworzenie, zarządzanie i udostępnianie ustrukturyzowanych planów treningowych swoim podopiecznym, eliminując konieczność używania arkuszy kalkulacyjnych i zapewniając płynne doświadczenie użytkownika.

Cele:

- Dostarczyć minimalny produkt działający (MVP) wspierający role użytkowników (administrator, trener, podopieczny).
- Zapewnić funkcjonalność CRUD dla ćwiczeń i planów treningowych.
- Gwarantować bezpieczne uwierzytelnianie, kontrolę dostępu opartą na rolach oraz rejestrowanie zdarzeń (audit log).
- Zintegrować prywatne odtwarzanie wideo za pomocą Vimeo oraz wysyłanie maili transakcyjnych przez SendGrid.

Zakres (MVP):

- Zarządzanie użytkownikami i uwierzytelnianie
- Zarządzanie biblioteką ćwiczeń
- Tworzenie, edytowanie, ukrywanie i usuwanie planów treningowych
- Powiadomienia e-mail i wewnątrz aplikacji
- Podstawowa paginacja i filtrowanie
- Proste rejestrowanie zdarzeń (audit log)

## 2. Problem Użytkownika

Trenerzy personalni nie mają scentralizowanego, przyjaznego narzędzia do tworzenia i udostępniania planów treningowych. Obecnie plany są zarządzane w arkuszach kalkulacyjnych, co utrudnia dostęp podopiecznym. Trenerzy potrzebują intuicyjnego systemu do dodawania ćwiczeń, tworzenia planów i udostępniania ich klientom. Podopieczni wymagają prostego sposobu przeglądania przydzielonych planów.

## 3. Wymagania Funkcjonalne

1. Uwierzytelnianie i autoryzacja
   - Supabase Auth do logowania za pomocą linków jednorazowych ważnych 1 godziny oraz resetu hasła.
   - Polityki RLS (Row-Level Security): administrator (pełny dostęp), trener (zarządzanie własnymi planami i podopiecznymi), podopieczny (wyświetlanie tylko własnych planów, edycja profilu).
2. Zarządzanie ćwiczeniami
   - Administrator może tworzyć, odczytywać, aktualizować i usuwać ćwiczenia.
   - Każde ćwiczenie zawiera: nazwę, opis tekstowy (cele, kroki, wskazówki) oraz link do Vimeo (token przechowywany w .env).
3. Zarządzanie planami treningowymi
   - Trener może tworzyć, edytować, usuwać oraz ukrywać/odkrywać plany dla przypisanych podopiecznych.
   - Plany nie mają daty wygaśnięcia; widoczność kontrolowana ręcznie.
4. Zarządzanie użytkownikami
   - Administrator może dodawać, edytować, usuwać, zawieszać i reaktywować trenerów i podopiecznych.
   - Aktywacja konta i reset hasła odbywa się za pomocą linków wysyłanych e-mailem.
5. Powiadomienia
   - E-maile SendGrid: aktywacja konta, reset hasła, powiadomienie o nowym planie.
6. Paginacja i filtrowanie
   - Paginacja offset–limit (domyślnie 20 elementów na stronę).
   - Filtrowanie list po nazwie, statusie konta, dacie utworzenia i trenerze.
7. Audit log
   - Rejestrowanie kluczowych operacji CRUD na planach i kontach z metadanymi: użytkownik, typ akcji, znacznik czasu.
   - Przechowywanie logów przez 90 dni.

## 4. Granice Produktu

Włączone w MVP:

- Tylko powiadomienia e-mail (bez czatu ani wiadomości w czasie rzeczywistym).
- Integracja wideo za pomocą linków (brak przesyłania plików wideo).
- Ręczna kontrola widoczności planów (bez harmonogramowania czy automatycznego wygaśnięcia).
- Podstawowy audit log bez dedykowanego dashboardu analitycznego.

Wyłączone w MVP:

- Śledzenie postępów podopiecznego ani przesyłanie danych treningowych.
- Czat w czasie rzeczywistym między trenerami i podopiecznymi.
- Automatyczne wygasanie planów czy harmonogramowanie.
- Hostowanie wideo na platformie; tylko osadzenie linków do Vimeo.

## 5. Historie użytkownika

US-001
Tytuł: Logowanie administratora
Opis: Administrator loguje się za pomocą linku przesłanego na e-mail, ważnego 1 godziny.
Kryteria akceptacji:

- Mając prawidłowy adres e-mail administratora, po żądaniu linku otrzymuje e-mail z linkiem.
- Mając wygasły lub nieprawidłowy link, po użyciu wyświetlany jest komunikat o błędzie.

US-002
Tytuł: Logowanie trenera
Opis: Trener loguje się przez link e-mailowy i trafia na pulpit z listą podopiecznych.
Kryteria akceptacji:

- Mając prawidłowy adres e-mail trenera, po żądaniu linku otrzymuje e-mail.
- Po kliknięciu w link trener jest uwierzytelniony i przekierowany do listy podopiecznych.

US-003
Tytuł: Logowanie podopiecznego
Opis: Podopieczny loguje się przez link e-mailowy i przegląda swój dashboard.
Kryteria akceptacji:

- Mając przydzielony adres e-mail podopiecznego, po żądaniu linku otrzymuje e-mail.
- Po kliknięciu w link podopieczny widzi tylko swoje plany i możliwość edycji profilu.

US-004
Tytuł: Dodanie trenera
Opis: Administrator dodaje nowego trenera, podając jego e-mail; trener otrzymuje link aktywacyjny.
Kryteria akceptacji:

- Po utworzeniu trenera przez administratora, rekord trenera jest zapisany i wysłany zostaje e-mail aktywacyjny.
- Nowy trener widoczny w panelu z statusem "oczekuje na aktywację".

US-005
Tytuł: Edycja trenera
Opis: Administrator aktualizuje dane trenera (imię, e-mail).
Kryteria akceptacji:

- Po zapisaniu zmian, nowe dane są widoczne w panelu.

US-006
Tytuł: Usunięcie trenera
Opis: Administrator deaktywuje konto trenera; powiązane plany zostają zarchiwizowane.
Kryteria akceptacji:

- Po usunięciu konto trenera jest zablokowane i trener nie może się logować.

US-007
Tytuł: Dodanie podopiecznego
Opis: Administrator dodaje nowego podopiecznego i przypisuje go do trenera; podopieczny otrzymuje link aktywacyjny.
Kryteria akceptacji:

- Po utworzeniu podopiecznego rekord jest zapisany z statusem oczekiwania i wysyłany jest e-mail aktywacyjny.

US-008
Tytuł: Edycja podopiecznego
Opis: Administrator lub przypisany trener aktualizuje dane podopiecznego.
Kryteria akceptacji:

- Tylko przypisany trener lub administrator może edytować dane, a zmiany są zapisywane.

US-009
Tytuł: Zawieszenie podopiecznego
Opis: Trener lub administrator zawiesza konto podopiecznego; podopieczny nie może się logować.
Kryteria akceptacji:

- Przy próbie logowania podopieczny widzi komunikat o zawieszeniu konta.

US-010
Tytuł: Reaktywacja podopiecznego
Opis: Trener lub administrator reaktywuje zawieszone konto podopiecznego.
Kryteria akceptacji:

- Po reaktywacji podopieczny może się ponownie logować i przeglądać plany.

US-011
Tytuł: CRUD ćwiczeń
Opis: Administrator zarządza ćwiczeniami z nazwą, opisem i linkiem Vimeo.
Kryteria akceptacji:

- Create: nowe ćwiczenie pojawia się w bibliotece.
- Read: wszystkie ćwiczenia widoczne w liście z paginacją.
- Update: edytowane dane zostają zapisane.
- Delete: ćwiczenie usuwane z biblioteki i nie jest dostępne przy tworzeniu planów.

US-012
Tytuł: Tworzenie planu treningowego
Opis: Trener tworzy plan dla przypisanego podopiecznego, wybierając ćwiczenia.
Kryteria akceptacji:

- Plan musi zawierać co najmniej jedno ćwiczenie.
- Po zapisaniu podopieczny otrzymuje powiadomienie o nowym planie.

US-013
Tytuł: Edycja planu treningowego
Opis: Trener aktualizuje listę ćwiczeń lub opisy w istniejącym planie.
Kryteria akceptacji:

- Zmiany są zapisywane, a podopieczny widzi zaktualizowany plan.

US-014
Tytuł: Usunięcie planu treningowego
Opis: Trener usuwa plan; przestaje być widoczny dla podopiecznego.
Kryteria akceptacji:

- Usunięty plan jest archiwizowany w audit log i ukrywany przed podopiecznym.

US-015
Tytuł: Ukrywanie/odkrywanie planu
Opis: Trener przełącza widoczność planu dla podopiecznego.
Kryteria akceptacji:

- Ukryte plany nie pojawiają się w dashboardzie podopiecznego.
- Odkrycie planu powoduje jego natychmiastowe wyświetlenie.

US-016
Tytuł: Wyświetlanie planów przez podopiecznego
Opis: Podopieczny przegląda listę przydzielonych, widocznych planów.
Kryteria akceptacji:

- Pokazywane są tylko widoczne plany, z paginacją po 20.

US-017
Tytuł: Edycja profilu podopiecznego
Opis: Podopieczny edytuje swoje dane (imię, kontakt).
Kryteria akceptacji:

- Zmiany są zapisywane i widoczne w profilu.

US-018
Tytuł: Powiadomienia e-mail
Opis: System wysyła e-maile transakcyjne: aktywacja konta, reset hasła, nowy plan.
Kryteria akceptacji:

- E-maile kolejkują się przez SendGrid i są dostarczane w ciągu 2 minut.

US-019
Tytuł: Powiadomienia w aplikacji
Opis: Po zalogowaniu użytkownik widzi baner z liczbą nieprzeczytanych powiadomień.
Kryteria akceptacji:

- Baner pokazuje liczbę nieprzeczytanych powiadomień i linki do szczegółów.

US-020
Tytuł: Paginacja i filtrowanie
Opis: Użytkownicy mogą paginować i filtrować listy ćwiczeń, planów i użytkowników.
Kryteria akceptacji:

- Domyślny rozmiar strony to 20; filtrowanie po nazwie, statusie, dacie utworzenia i trenerze działa poprawnie.

US-021
Tytuł: Wpisy w audit log
Opis: System zapisuje wszystkie operacje CRUD na planach i kontach.
Kryteria akceptacji:

- Każda akcja rejestrowana jest z informacją o użytkowniku, typie akcji i znaczniku czasu; logi dostępne dla administratora.

US-022
Tytuł: Wymuszanie kontroli dostępu
Opis: Polityki RLS uniemożliwiają użytkownikom dostęp do nieautoryzowanych danych.
Kryteria akceptacji:

- Trenerzy widzą tylko własne plany i podopiecznych.
- Podopieczni nie mają dostępu do planów innych ani sekcji administratora/trenera.

## 6. Mierniki sukcesu

- 50 planów treningowych utworzonych w ciągu 1 miesiąca od uruchomienia.
- 200 planów utworzonych w ciągu 3 miesięcy.
- 90% dostępność aplikacji (uptime) mierzona co miesiąc.
- Średni czas ładowania strony poniżej 2 sekund na urządzeniach mobilnych.
