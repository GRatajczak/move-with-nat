# Plan implementacji widoku Admin Dashboard

## 1. Przegląd

Widok Dashboardu Administratora (`AdminDashboard`) służy jako centralny hub dla użytkownika z rolą Administratora. Jego celem jest dostarczenie szybkiego wglądu w stan systemu (statystyki użytkowników i treści), monitorowanie procesów aktywacji kont oraz umożliwienie szybkiego dostępu do kluczowych akcji (tworzenie użytkowników, ćwiczeń).

## 2. Routing widoku

- **Ścieżka:** `/admin`
- **Dostęp:** Chroniony (tylko zalogowani użytkownicy z rolą `admin`).
- **Plik Astro:** `src/pages/admin/index.astro`

## 3. Struktura komponentów

Hierarchia plików i komponentów w katalogu `src/components/admin/dashboard`:

- `AdminDashboardContainer` (Główny komponent React, zarządza stanem)
  - `DashboardHeader` (Tytuł i powitanie)
  - `QuickActions` (Przyciski akcji)
  - `StatsGrid` (Siatka kart ze statystykami)
    - `StatsCard` (Pojedyncza karta statystyki z ikoną i liczbą)
  - `ActivitySection` (Siatka dla list aktywności)
    - `RecentUsersWidget` (Lista ostatnio dodanych użytkowników)
      - `UserAvatarItem` (Pojedynczy wiersz użytkownika)
    - `PendingActivationsWidget` (Lista oczekujących na aktywację)
      - `PendingUserItem` (Wiersz z przyciskiem ponownego wysłania)

## 4. Szczegóły komponentów

### `AdminDashboardContainer`

- **Opis:** Główny kontener (Smart Component). Odpowiada za pobranie danych z API, obsługę stanu ładowania i błędów oraz dystrybucję danych do komponentów prezentacyjnych.
- **Główne elementy:** `div` (layout container), `Toaster` (z sonner).
- **Obsługiwane interakcje:** Inicjalne pobranie danych, obsługa odświeżenia danych po akcji (np. resend invite).
- **Typy:** `DashboardData` (zdefiniowany w sekcji Typy).

### `StatsCard`

- **Opis:** Karta prezentująca pojedynczą metrykę (np. "Liczba Podopiecznych").
- **Główne elementy:** `Card` (shadcn/ui), `LucideIcon` (ikona), `Skeleton` (stan ładowania).
- **Propsy:**
  - `title: string`
  - `value: number | undefined`
  - `icon: React.ComponentType`
  - `isLoading: boolean`
  - `description?: string`

### `QuickActions`

- **Opis:** Sekcja z przyciskami przekierowującymi do formularzy tworzenia.
- **Główne elementy:** `Button` (shadcn/ui) z ikonami `Plus`.
- **Obsługiwane interakcje:** Kliknięcie przekierowuje do `/admin/users/new` lub `/admin/exercises/new`.
- **Propsy:** Brak.

### `RecentUsersWidget`

- **Opis:** Widget wyświetlający listę 5-10 ostatnio zarejestrowanych użytkowników.
- **Główne elementy:** `Card`, `CardHeader`, `CardContent`, lista `ul/li`, `Badge` (status roli).
- **Propsy:**
  - `users: UserDto[]`
  - `isLoading: boolean`

### `PendingActivationsWidget`

- **Opis:** Widget wyświetlający użytkowników ze statusem "pending". Zawiera akcję ponownego wysłania zaproszenia.
- **Główne elementy:** `Card`, `Button` (rozmiar sm, variant outline/ghost).
- **Obsługiwane interakcje:** Kliknięcie "Wyślij ponownie" wywołuje funkcję `onResendInvite`.
- **Propsy:**
  - `users: UserDto[]`
  - `isLoading: boolean`
  - `onResendInvite: (email: string, role: UserRole) => Promise<void>`

## 5. Typy

Należy utworzyć/rozszerzyć plik `src/types.ts` lub stworzyć lokalne typy w folderze komponentu, jeśli są specyficzne tylko dla widoku.

```typescript
// Modele widoku dla Dashboardu

export interface DashboardStats {
  totalClients: number;
  totalTrainers: number;
  totalPlans: number; // Placeholder jeśli endpoint niegotowy
  totalExercises: number; // Placeholder jeśli endpoint niegotowy
}

export interface DashboardData {
  stats: DashboardStats;
  recentUsers: UserDto[];
  pendingUsers: UserDto[];
}

export interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem powinno odbywać się poprzez custom hook `useAdminDashboard` wewnątrz `AdminDashboardContainer`.

- **Hook `useAdminDashboard`:**
  - **Stan:** `data` (DashboardData), `isLoading` (boolean), `error` (string).
  - **Effect:** Przy montowaniu komponentu wywołuje `fetchDashboardData`.
  - **Funkcja `fetchDashboardData`:** Wykonuje `Promise.all` dla wielu zapytań API (patrz sekcja Integracja API).
  - **Funkcja `resendInvite`:** Obsługuje logikę ponownego wysłania maila i obsługę błędów/sukcesu (Toast).

## 7. Integracja API

Widok integruje się z backendem poprzez zestaw równoległych zapytań HTTP (`fetch`).

### Pobieranie danych (GET)

1.  **Statystyki Trenerów:**
    - Endpoint: `/api/users?role=trainer&limit=1`
    - Cel: Odczytanie wartości `meta.total` z odpowiedzi.
2.  **Statystyki Klientów:**
    - Endpoint: `/api/users?role=client&limit=1`
    - Cel: Odczytanie wartości `meta.total` z odpowiedzi.
3.  **Ostatni Użytkownicy:**
    - Endpoint: `/api/users?limit=5` (Domyślne sortowanie w serwisie to `created_at` DESC).
    - Cel: Pobranie tablicy `data`.
4.  **Oczekujące Aktywacje:**
    - Endpoint: `/api/users?status=pending&limit=5`
    - Cel: Pobranie tablicy `data`.
5.  **Statystyki Planów/Ćwiczeń:**
    - Endpointy: `/api/plans?limit=1`, `/api/exercises?limit=1`.
    - _Uwaga:_ Jeśli endpointy nie istnieją, należy wyświetlić 0 lub tymczasowo pominąć te zapytania.

### Akcje (POST)

1.  **Ponowne zaproszenie:**
    - Endpoint: `/api/auth/invite`
    - Metoda: `POST`
    - Body: `{ email: string, role: UserRole, resend: true }`
    - Nagłówki: `Content-Type: application/json`

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Automatyczne ładowanie danych (wyświetlanie szkieletów/spinnerów).
2.  **Kliknięcie "Szybkie dodanie użytkownika":** Przekierowanie do `/admin/users/new`.
3.  **Kliknięcie "Wyślij ponownie" (przy użytkowniku pending):**
    - Przycisk wchodzi w stan `loading`.
    - Wywołanie API.
    - Pokaż Toast: "Zaproszenie zostało wysłane ponownie" (Sukces) lub komunikat błędu.
    - Przycisk wraca do stanu domyślnego.

## 9. Warunki i walidacja

- **Autoryzacja:** Strona `index.astro` musi sprawdzić w `locals.user`, czy rola to `admin`. Jeśli nie -> przekierowanie na `/login` lub `/dashboard`.
- **Status Pending:** Logika backendu (`users.service.ts`) definiuje `pending` jako `is_active=true` ORAZ brak imienia/nazwiska. Frontend polega na filtrze `status=pending` w zapytaniu API.

## 10. Obsługa błędów

- **Błąd ładowania danych:** Jeśli którekolwiek z zapytań w `Promise.all` zawiedzie, wyświetl ogólny komunikat błędu w kontenerze dashboardu z przyciskiem "Spróbuj ponownie".
- **Błąd akcji (Resend):** Wyświetlenie komunikatu błędu w komponencie `Toast` (np. "Nie udało się wysłać zaproszenia"). Nie blokuje to reszty interfejsu.
- **Puste stany:** Jeśli brak danych w listach (np. brak użytkowników pending), wyświetl odpowiedni komponent "Empty State" (np. "Brak oczekujących aktywacji").

## 11. Kroki implementacji

1.  **Przygotowanie strony Astro:**
    - Utwórz `src/pages/admin/index.astro`.
    - Zaimplementuj sprawdzanie roli admina i użyj layoutu administracyjnego.
2.  **Stworzenie typów i serwisu API (frontend):**
    - Zdefiniuj interfejsy w `types.ts` (jeśli brakuje).
    - Stwórz helpery do fetchowania w `src/lib/api-client.ts` (lub lokalnie w hooku), aby obsłużyć zapytania z parametrami.
3.  **Implementacja komponentów UI (Atomic):**
    - Stwórz `StatsCard.tsx`.
    - Stwórz `QuickActions.tsx`.
    - Stwórz `UserRowItem.tsx` (re-używalny dla list).
4.  **Implementacja Widgetów:**
    - Złóż `RecentUsersWidget.tsx`.
    - Złóż `PendingActivationsWidget.tsx`.
5.  **Implementacja Logiki (Hook):**
    - Napisz `useAdminDashboard` zawierający logikę `fetch` z `Promise.all`.
6.  **Integracja (DashboardContainer):**
    - Połącz wszystkie widgety w `AdminDashboardContainer.tsx`.
    - Podepnij hooka i przekaż dane.
7.  **Stylizacja i Responsywność:**
    - Upewnij się, że grid jest responsywny (1 kolumna na mobile, 2-4 na desktop).
    - Dopracuj stany ładowania (Skeletons).
