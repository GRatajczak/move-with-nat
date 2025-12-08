# Dokument Wymagań Produktowych (PRD) - MoveWithNat

## 1. Przegląd Produktu

MoveWithNat to responsywna aplikacja webowa zaprojektowana dla trenerów personalnych niezalenie czy to trener trójboju, sztuk walk czy wspinania. Umożliwia trenerom i administratorom tworzenie, zarządzanie i udostępnianie ustrukturyzowanych planów treningowych swoim podopiecznym, eliminując konieczność używania arkuszy kalkulacyjnych i zapewniając płynne doświadczenie użytkownika.

Cele:

- Dostarczyć minimalny produkt działający (MVP) wspierający role użytkowników (administrator, trener, podopieczny).
- Zapewnić funkcjonalność CRUD dla ćwiczeń i planów treningowych.
- Gwarantować bezpieczne uwierzytelnianie, kontrolę dostępu opartą na rolach.
- Zintegrować prywatne odtwarzanie wideo za pomocą Vimeo oraz wysyłanie maili o dodaniu nowego planu, zedytowaniu istniejącego planu przez SendGrid.
- Mozliwość edycji profilu dla trenera i podopiecznego.
- Tylko administaror moze edytować swój profil
- Dodanie struktury ćwiczenia - film instruktarzowy, opis, tempo wykonywanego ćwiczenia, cięzar

Zakres (MVP):

- Zarządzanie użytkownikami i uwierzytelnianie
- Zarządzanie biblioteką ćwiczeń
- Tworzenie, edytowanie, ukrywanie i usuwanie planów treningowych
- Powiadomienia e-mail
- Podstawowa paginacja i filtrowanie
- Mozlowość przez podopiecznego dodawania zaznaczania czy dane ćwiczenie zostało wykonane a jeśli nie to podopieczny moze zaznaczyć z kilku standardowych przyczyn lub napisać swoją własną
- Trener dodaje cały profil swojego podopiecznego i przy zatwierdzeniu jest wysyłany email do podopiecznego wraz z linkiem do utworzenia hasła, link moze być wysłany kilkukrotnie a długość aktywności tego linku to 1h
- Administratora moze dodać tylko inny administrator
- Dodanie nowego konta trenera działa tak samo jak dodanie nowego podopiecznego ale tylko administrator moze go dodać

## 2. Problem Użytkownika

Trenerzy personalni nie mają scentralizowanego, przyjaznego narzędzia do tworzenia i udostępniania planów treningowych. Obecnie plany są zarządzane w arkuszach kalkulacyjnych, co utrudnia dostęp podopiecznym. Trenerzy potrzebują intuicyjnego systemu do dodawania ćwiczeń, tworzenia planów i udostępniania ich klientom. Podopieczni wymagają prostego sposobu przeglądania przydzielonych planów i zaznaczaniu progresu swoich ćwiczeń.

## 3. Wymagania Funkcjonalne

1. Uwierzytelnianie i autoryzacja
   - Supabase Auth do resetu hasła jednorazowych ważnych 1 godziny.
   - Polityki RLS (Row-Level Security): administrator (pełny dostęp), trener (zarządzanie własnymi planami i podopiecznymi), podopieczny (wyświetlanie tylko własnych planów i dodawanie czy dane ćwiczenie w danym planie zostało wykonane, edycja profilu).
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

## 4. Granice Produktu

Włączone w MVP:

- Tylko powiadomienia e-mail (bez czatu ani wiadomości w czasie rzeczywistym).
- Integracja wideo za pomocą linków (brak przesyłania plików wideo).
- Ręczna kontrola widoczności planów (bez harmonogramowania czy automatycznego wygaśnięcia).

Wyłączone w MVP:

- Czat w czasie rzeczywistym między trenerami i podopiecznymi.
- Automatyczne wygasanie planów czy harmonogramowanie.
- Mozliwość dodawania planów dietetycznych

## 5. Historie użytkownika

US-001
Tytuł: Logowanie administratora
Opis: Administrator loguje się przez stronę logowania, podając swój e-mail i hasło.
Kryteria akceptacji:

- Po podaniu prawidłowego e-maila i hasła administrator jest uwierzytelniony i przekierowany do dashboardu.
- Przy podaniu nieprawidłowego e-maila lub hasła wyświetlany jest komunikat o błędzie.

US-002
Tytuł: Logowanie trenera
Opis: Trener loguje się przez stronę logowania, podając swój e-mail i hasło, i trafia na pulpit z listą przypisanych podopiecznych.
Kryteria akceptacji:

- Po podaniu prawidłowego e-maila i hasła trener jest uwierzytelniony i widzi listę podopiecznych.
- Przy podaniu nieprawidłowego e-maila lub hasła wyświetlany jest komunikat o błędzie.

US-003
Tytuł: Logowanie podopiecznego
Opis: Podopieczny loguje się przez stronę logowania, podając swój e-mail i hasło, i przegląda swój dashboard z planami.
Kryteria akceptacji:

- Po podaniu prawidłowego e-maila i hasła podopieczny jest uwierzytelniony i widzi swoje plany i profil.
- Przy podaniu nieprawidłowego e-maila lub hasła wyświetlany jest komunikat o błędzie.

US-004
Tytuł: Reset hasła
Opis: Użytkownik żąda resetu hasła i otrzymuje link ważny 1 godzinę do ustawienia nowego hasła.
Kryteria akceptacji:

- E-mail resetu jest wysyłany i dostarczany.
- Wygasły/nieprawidłowy link zwraca komunikat o błędzie.
- Po ustawieniu nowego hasła użytkownik może się zalogować.

US-005
Tytuł: Zaproszenie trenera i aktywacja konta
Opis: Administrator zaprasza trenera; trener otrzymuje link do ustawienia hasła (1h) i może poprosić o ponowne wysłanie.
Kryteria akceptacji:

- Po utworzeniu trenera rekord ma status „oczekuje na aktywację”.
- E-mail aktywacyjny jest wysyłany i można go wysłać ponownie.
- Po aktywacji status się aktualizuje, a trener może się logować.

US-006
Tytuł: Edycja profilu trenera
Opis: Administrator aktualizuje dane trenera (np. imię, e-mail, opis profilu).
Kryteria akceptacji:

- Zmiany zapisują się i są widoczne w panelu.

US-007
Tytuł: Dezaktywacja/Reaktywacja trenera
Opis: Administrator dezaktywuje lub reaktywuje konto trenera.
Kryteria akceptacji:

- Po dezaktywacji trener nie może się logować, powiązane plany stają się ukryte.
- Po reaktywacji trener może ponownie się logować, a plany mogą zostać przywrócone.

US-008
Tytuł: Dodanie podopiecznego i przypisanie do trenera
Opis: Administrator tworzy profil podopiecznego, przypisuje go do trenera i wysyła link do ustawienia hasła (1h) z możliwością ponownego wysłania.
Kryteria akceptacji:

- Rekord podopiecznego zapisany ze statusem „oczekuje na aktywację”.
- E-mail aktywacyjny wysłany; możliwe ponowne wysłanie.

US-009
Tytuł: Edycja profilu podopiecznego
Opis: Administrator lub przypisany trener aktualizuje dane podopiecznego.
Kryteria akceptacji:

- Tylko administrator lub przypisany trener mogą edytować dane.
- Zmiany zapisują się i są widoczne w profilu.

US-010
Tytuł: Zawieszenie/Reaktywacja podopiecznego
Opis: Administrator lub trener zawiesza lub reaktywuje konto podopiecznego.
Kryteria akceptacji:

- Zawieszony podopieczny nie może się logować i widzi komunikat o zawieszeniu.
- Po reaktywacji może się logować i przeglądać swoje plany.

US-011
Tytuł: CRUD ćwiczeń (z linkiem Vimeo)
Opis: Administrator zarządza ćwiczeniami zawierającymi nazwę, opis (cele, kroki, wskazówki), link do Vimeo oraz atrybuty: tempo (np. 3-1-3) i domyślny ciężar.
Kryteria akceptacji:

- Create: nowe ćwiczenie pojawia się w bibliotece.
- Read: ćwiczenia widoczne na liście z paginacją.
- Update: zmiany w ćwiczeniu (w tym tempo i ciężar) zapisane.
- Delete: usunięte ćwiczenie nie jest dostępne przy tworzeniu planów.
- Pola tempo i ciężar są opcjonalne, walidowane i poprawnie wyświetlane.

US-012
Tytuł: Prywatne odtwarzanie wideo Vimeo w ćwiczeniu
Opis: Użytkownik odtwarza materiał wideo ćwiczenia w aplikacji; odtwarzanie jest prywatne i zabezpieczone.
Kryteria akceptacji:

- Autoryzowani użytkownicy mogą odtwarzać wideo powiązane z ćwiczeniem.
- Nieautoryzowani użytkownicy nie mają dostępu do odtwarzania.

US-013
Tytuł: Tworzenie planu treningowego
Opis: Trener tworzy plan dla przypisanego podopiecznego, wybierając ćwiczenia.
Kryteria akceptacji:

- Plan zawiera co najmniej jedno ćwiczenie.
- Po zapisaniu podopieczny otrzymuje e-mail o nowym planie.

US-014
Tytuł: Edycja planu treningowego
Opis: Trener aktualizuje listę ćwiczeń lub opisy w istniejącym planie.
Kryteria akceptacji:

- Zmiany są zapisywane i widoczne dla podopiecznego.
- Po aktualizacji wysyłany jest e-mail z informacją o zmianach.

US-015
Tytuł: Usunięcie planu treningowego
Opis: Trener usuwa plan; plan przestaje być dostępny dla podopiecznego.
Kryteria akceptacji:

- Usunięty plan nie jest widoczny na liście planów podopiecznego.

US-016
Tytuł: Ukrywanie/Odkrywanie planu
Opis: Trener przełącza widoczność planu dla podopiecznego.
Kryteria akceptacji:

- Ukryte plany nie pojawiają się w dashboardzie podopiecznego.
- Odkrycie planu powoduje jego natychmiastowe wyświetlenie.

US-017
Tytuł: Dashboard trenera – lista podopiecznych
Opis: Trener przegląda przypisanych podopiecznych z podstawowym filtrowaniem.
Kryteria akceptacji:

- Widoczni są tylko podopieczni przypisani do trenera.
- Działa filtrowanie po nazwie i statusie.

US-018
Tytuł: Dashboard podopiecznego – lista planów
Opis: Podopieczny przegląda listę przydzielonych, widocznych planów z paginacją i filtrowaniem.
Kryteria akceptacji:

- Pokazywane są tylko widoczne plany.
- Domyślna paginacja 20 na stronę; podstawowe filtrowanie działa.

US-019
Tytuł: Zaznaczanie wykonania ćwiczeń przez podopiecznego
Opis: Podopieczny oznacza ćwiczenie jako wykonane lub niewykonane; w przypadku niewykonania wybiera standardowy powód lub wpisuje własny.
Kryteria akceptacji:

- Status wykonania i powód (gdy dotyczy) zapisują się.
- Trener widzi statusy i powody w kontekście planu.

US-020
Tytuł: Powiadomienia e-mail (SendGrid)
Opis: System wysyła e-maile transakcyjne: aktywacja konta, reset hasła, nowy plan, zaktualizowany plan.
Kryteria akceptacji:

- E-maile kolejkują się i są dostarczane w ciągu 2 minut.

US-021
Tytuł: Paginacja i filtrowanie list
Opis: Użytkownicy mogą paginować i filtrować listy ćwiczeń, planów i użytkowników.
Kryteria akceptacji:

- Domyślny rozmiar strony to 20.
- Filtrowanie po nazwie, statusie, dacie utworzenia i trenerze działa poprawnie.

US-022
Tytuł: Kontrola dostępu (RLS)
Opis: Polityki RLS uniemożliwiają użytkownikom dostęp do nieautoryzowanych danych.
Kryteria akceptacji:

- Trenerzy widzą tylko własnych podopiecznych i ich plany.
- Podopieczni nie mają dostępu do planów innych oraz sekcji administratora/trenera.

US-023
Tytuł: Edycja profilu trenera (samodzielna)
Opis: Trener edytuje swój profil (np. imię, bio, avatar, dane kontaktowe).
Kryteria akceptacji:

- Zmiany zapisują się i są widoczne w profilu.
- Tylko zalogowany trener może edytować własny profil.

US-024
Tytuł: Edycja profilu podopiecznego (samodzielna)
Opis: Podopieczny edytuje swój profil (np. imię, preferencje, avatar).
Kryteria akceptacji:

- Zmiany zapisują się i są widoczne w profilu.
- Tylko zalogowany podopieczny może edytować własny profil.

US-025
Tytuł: Edycja profilu administratora (samodzielna)
Opis: Administrator edytuje wyłącznie swój profil (np. imię, avatar).
Kryteria akceptacji:

- Zmiany zapisują się i są widoczne w profilu administratora.
- Profil administratora nie może być edytowany przez innych użytkowników.

US-026
Tytuł: Zaproszenie administratora i aktywacja konta
Opis: Administrator zaprasza nowego administratora; zaproszony otrzymuje link do ustawienia hasła (1h) i może poprosić o ponowne wysłanie.
Kryteria akceptacji:

- Po utworzeniu rekord ma status „oczekuje na aktywację”.
- E-mail aktywacyjny jest wysyłany i można go ponownie wysłać.
- Po aktywacji status się aktualizuje, a administrator może się logować.

US-027
Tytuł: Usunięcie trenera
Opis: Administrator usuwa konto trenera.
Kryteria akceptacji:

- Po usunięciu trener nie może się logować.
- Powiązane plany trenera stają się ukryte lub niedostępne dla podopiecznych.
- Podopieczni dalej mogą się logować do systemu i widzą swoje plany

US-028
Tytuł: Usunięcie podopiecznego
Opis: Administrator usuwa konto podopiecznego.
Kryteria akceptacji:

- Po usunięciu podopieczny nie może się logować.
- Plany powiązane z podopiecznym stają się niedostępne w jego dashboardzie.

US-029
Tytuł: Zarządzanie standardowymi powodami niewykonania ćwiczenia
Opis: Administrator zarządza listą standardowych powodów, które podopieczny może wybrać przy oznaczaniu ćwiczenia jako niewykonanego.
Kryteria akceptacji:

- Create/Read/Update/Delete powodów dostępne dla administratora.
- Podopieczny widzi aktualną listę powodów podczas oznaczania niewykonania.

US-030
Tytuł: Zmiana przypisania podopiecznego do innego trenera
Opis: Administrator zmienia przypisanego trenera dla podopiecznego.
Kryteria akceptacji:

- Po zmianie nowy trener widzi podopiecznego na swojej liście.
- Poprzedni trener traci dostęp do danych podopiecznego objętych RLS.

US-031
Tytuł: Przypisanie istniejącego podopiecznego do trenera (przez administratora)
Opis: Administrator przypisuje wcześniej utworzonego (nieprzypisanego) podopiecznego do konkretnego trenera.
Kryteria akceptacji:

- Administrator wybiera podopiecznego i trenera i zatwierdza przypisanie.
- Po przypisaniu trener widzi podopiecznego na swojej liście, a podopieczny widzi trenera w swoim profilu/dashboardzie.
- Dostęp do danych jest kontrolowany przez RLS; inni trenerzy nie widzą podopiecznego.
- Nie można przypisać podopiecznego do trenera o statusie nieaktywnym/zawieszonym.
- Jeśli podopieczny jest już przypisany, system informuje o istniejącym przypisaniu i sugeruje zmianę przypisania (US-030).

US-032
Tytuł: Wyświetlanie ćwiczenia z planu
Opis: Podopieczny otwiera przypisany plan, a aplikacja prezentuje ćwiczenia pojedynczo – każda strona odpowiada jednemu ćwiczeniu i łączy dane z tabel „exercises” oraz „plans_exercise”. W przypadku konfliktu danych priorytet mają wartości z „plans_exercise” (np. tempo, ciężar).
Kryteria akceptacji:

- Po wejściu w plan podopieczny widzi ekran pierwszego ćwiczenia; nawigacja „poprzednie/następne” umożliwia przechodzenie między ćwiczeniami.
- Strona ćwiczenia wyświetla: nazwę, opis, tempo, ciężar, liczbę serii i powtórzeń, link do wideo.
- Gdy pole jest zdefiniowane zarówno w „exercises”, jak i „plans_exercise”, używana jest wartość z „plans_exercise”.
- Widoczny jest status wykonania ćwiczenia oraz przyciski do oznaczenia wykonania lub niewykonania (zgodnie z US-019).

## 6. Mierniki sukcesu

- 50 planów treningowych utworzonych w ciągu 1 miesiąca od uruchomienia.
- 200 planów utworzonych w ciągu 3 miesięcy.
- 90% dostępność aplikacji (uptime) mierzona co miesiąc.
- Średni czas ładowania strony poniżej 2 sekund na urządzeniach mobilnych.
