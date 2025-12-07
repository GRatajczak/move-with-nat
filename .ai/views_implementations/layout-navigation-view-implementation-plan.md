# Plan implementacji widoku Layout Navigation (Sidebar, TopBar, Breadcrumbs)

## 1. Przegląd

Widok Layout Navigation jest fundamentalnym komponentem aplikacji MoveWithNat, który zapewnia spójną nawigację dla wszystkich ról użytkowników (Administrator, Trener, Podopieczny). Składa się z trzech głównych elementów:

- **Sidebar**: Boczny panel nawigacji z menu kontekstowym dla każdej roli, wspierający collapsible behavior i responsive design
- **TopBar**: Górny pasek zawierający breadcrumbs, wyszukiwanie globalne (opcjonalne w MVP) oraz menu użytkownika
- **Breadcrumbs**: System okruszków nawigacyjnych pokazujący ścieżkę użytkownika w aplikacji

System nawigacji jest role-aware - dostosowuje wyświetlane opcje menu w zależności od roli zalogowanego użytkownika i zapewnia bezpieczny dostęp tylko do autoryzowanych zasobów.

## 2. Routing widoku

Layout Navigation nie jest samodzielnym widokiem z dedykowaną ścieżką, ale komponentem layoutu używanym przez wszystkie chronione widoki aplikacji:

- `/admin/*` - Wszystkie ścieżki administratora
- `/trainer/*` - Wszystkie ścieżki trenera  
- `/client/*` - Wszystkie ścieżki podopiecznego

Layout Navigation opakowuje główną zawartość każdego z tych widoków, zapewniając spójne doświadczenie nawigacji.

## 3. Struktura komponentów

```
MainLayout (wrapper dla protected routes)
├── Sidebar
│   ├── Logo
│   ├── NavigationList
│   │   ├── NavigationItem (wielokrotnie)
│   │   │   ├── Icon (lucide-react)
│   │   │   ├── Label
│   │   │   └── ExpandableSection (opcjonalnie)
│   │   │       └── SubNavigationItem (wielokrotnie)
│   │   └── LogoutButton
│   └── CollapseToggle
│
├── TopBar
│   ├── LeftSection
│   │   └── Breadcrumbs
│   │       └── BreadcrumbItem (wielokrotnie)
│   └── RightSection
│       ├── GlobalSearch (opcjonalnie, future MVP)
│       └── UserMenu
│           ├── UserAvatar
│           ├── UserInfo (imię, rola badge)
│           └── DropdownMenu
│               ├── ProfileLink
│               └── LogoutButton
│
└── MainContent
    └── {children} (treść strony)
```

## 4. Szczegóły komponentów

### MainLayout

- **Opis komponentu**: Główny komponent layoutu aplikacji, który łączy Sidebar, TopBar i MainContent. Odpowiada za weryfikację autoryzacji, enforcement roli użytkownika oraz zarządzanie globalnym stanem layoutu (collapsed sidebar).

- **Główne elementy**:
  - `<div className="flex h-screen overflow-hidden">` - kontener flex dla całego layoutu
  - `<Sidebar />` - boczny panel nawigacji
  - `<div className="flex-1 flex flex-col">` - kontener dla TopBar i MainContent
    - `<TopBar />` - górny pasek nawigacji
    - `<main className="flex-1 overflow-auto">` - scrollowalna zawartość strony
      - `{children}` - treść renderowanej strony

- **Obsługiwane interakcje**:
  - Wykrywanie stanu autoryzacji i redirect jeśli niezalogowany
  - Toggle sidebar (collapsed/expanded)
  - Persystencja stanu sidebar w localStorage
  - Obsługa responsive behavior (desktop/tablet/mobile)

- **Obsługiwana walidacja**:
  - Weryfikacja obecności tokenu JWT
  - Sprawdzenie zgodności roli użytkownika z wymaganą rolą dla ścieżki
  - Weryfikacja aktywności konta użytkownika (status !== 'suspended')

- **Typy**:
  - `MainLayoutProps`
  - `UserRole` (z interface/users.ts)
  - `User` (z interface/users.ts)

- **Propsy**:
  ```typescript
  interface MainLayoutProps {
    children: React.ReactNode;
    requiredRole: UserRole | UserRole[];
  }
  ```

### Sidebar

- **Opis komponentu**: Boczny panel nawigacji wyświetlający logo aplikacji, menu nawigacyjne dostosowane do roli użytkownika oraz przycisk collapse. Wspiera tryb collapsed (tylko ikony) i expanded (ikony + labels). Na mobile wyświetlany jako overlay.

- **Główne elementy**:
  - `<aside>` z dynamicznymi klasami dla collapsed/expanded state
  - `<div className="logo-container">` z logo aplikacji
  - `<nav>` z listą elementów nawigacji
  - `<NavigationList items={navigationItems} />` - główna lista nawigacji
  - `<CollapseToggle />` - przycisk do collapse/expand

- **Obsługiwane interakcje**:
  - Kliknięcie na element nawigacji → przekierowanie do odpowiedniej ścieżki
  - Kliknięcie na expandable section → rozwinięcie/zwinięcie podmenu
  - Kliknięcie na collapse toggle → zmiana stanu sidebar
  - Na mobile: kliknięcie backdrop → zamknięcie sidebar overlay
  - Hover na collapsed sidebar (tablet) → temporary expand

- **Obsługiwana walidacja**:
  - Wyświetlanie tylko elementów menu dozwolonych dla danej roli
  - Oznaczanie aktywnej ścieżki (current route matching)
  - Disabled state dla elementów niedostępnych

- **Typy**:
  - `SidebarProps`
  - `NavigationItem`
  - `UserRole`

- **Propsy**:
  ```typescript
  interface SidebarProps {
    role: UserRole;
    isCollapsed: boolean;
    onToggle: () => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
  }
  ```

### NavigationList

- **Opis komponentu**: Lista elementów nawigacji renderowana w Sidebar. Mapuje konfigurację menu na komponenty NavigationItem. Odpowiada za wykrywanie aktywnej ścieżki i zarządzanie stanem rozwiniętych sekcji.

- **Główne elementy**:
  - `<ul className="navigation-list">` - lista nieuporządkowana
  - `<NavigationItem />` (wielokrotnie) - elementy menu
  - Warunkowe renderowanie SubNavigationItem dla expandable sections

- **Obsługiwane interakcje**:
  - Delegowanie kliknięć do NavigationItem
  - Zarządzanie stanem rozwiniętych sekcji (expand/collapse)
  - Keyboard navigation (Tab, Arrow keys, Enter)

- **Obsługiwana walidacja**:
  - Filtrowanie elementów menu według roli użytkownika
  - Walidacja czy href jest dostępny dla danej roli
  - Highlight aktywnej ścieżki

- **Typy**:
  - `NavigationListProps`
  - `NavigationItem[]`

- **Propsy**:
  ```typescript
  interface NavigationListProps {
    items: NavigationItem[];
    isCollapsed: boolean;
    currentPath: string;
  }
  ```

### NavigationItem

- **Opis komponentu**: Pojedynczy element menu w Sidebar. Może być prostym linkiem lub expandable section z podmenu. Wyświetla ikonę (lucide-react) i label (ukrywany w collapsed mode). Wspiera active state highlighting.

- **Główne elementy**:
  - `<li>` wrapper
  - `<Link>` lub `<button>` (jeśli expandable)
    - `<Icon />` (lucide-react)
    - `<span className="label">` - tekst menu
    - `<ChevronIcon />` (jeśli expandable) - wskaźnik rozwinięcia

- **Obsługiwane interakcje**:
  - Kliknięcie na link → nawigacja do href
  - Kliknięcie na expandable → toggle podmenu
  - Hover → wyświetlenie tooltip z nazwą (jeśli collapsed)
  - Focus keyboard → highlight element

- **Obsługiwana walidacja**:
  - Sprawdzenie czy href pasuje do currentPath (active state)
  - Disabled state jeśli brak uprawnień

- **Typy**:
  - `NavigationItemProps`
  - `NavigationItemConfig`

- **Propsy**:
  ```typescript
  interface NavigationItemProps {
    item: NavigationItemConfig;
    isCollapsed: boolean;
    isActive: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
  }
  ```

### TopBar

- **Opis komponentu**: Górny pasek nawigacji rozciągnięty na całą szerokość content area. Zawiera breadcrumbs po lewej stronie oraz globalny search i user menu po prawej. Zapewnia kontekst nawigacyjny i szybki dostęp do akcji użytkownika.

- **Główne elementy**:
  - `<header className="topbar">` - kontener sticky/fixed
  - `<div className="left-section">` - lewa sekcja
    - `<Breadcrumbs />` - okruszki nawigacyjne
  - `<div className="right-section">` - prawa sekcja
    - `<GlobalSearch />` (opcjonalnie) - wyszukiwanie
    - `<UserMenu />` - menu użytkownika

- **Obsługiwane interakcje**:
  - Kliknięcie elementu breadcrumb → nawigacja do danej sekcji
  - Kliknięcie search icon → otwarcie search modal
  - Kliknięcie avatar → toggle user menu dropdown

- **Obsługiwana walidacja**:
  - Nie wymaga specjalnej walidacji, głównie prezentacyjny

- **Typy**:
  - `TopBarProps`
  - `BreadcrumbItem[]`
  - `User`

- **Propsy**:
  ```typescript
  interface TopBarProps {
    breadcrumbs: BreadcrumbItem[];
    user: User;
    onLogout: () => void;
  }
  ```

### Breadcrumbs

- **Opis komponentu**: System okruszków nawigacyjnych pokazujący hierarchię aktualnej lokalizacji w aplikacji. Renderuje listę linków oddzielonych separatorami. Ostatni element (current page) nie jest klikalny.

- **Główne elementy**:
  - `<nav aria-label="breadcrumb">` - kontener breadcrumb
  - `<ol className="breadcrumbs-list">` - uporządkowana lista
  - `<BreadcrumbItem />` (wielokrotnie) - elementy breadcrumb
    - `<Link>` lub `<span>` (dla ostatniego)
    - `<ChevronRight />` - separator

- **Obsługiwane interakcje**:
  - Kliknięcie na breadcrumb (nie ostatni) → nawigacja do href
  - Hover na truncated label → wyświetlenie tooltip z pełną nazwą

- **Obsługiwana walidacja**:
  - Truncacja długich nazw (>30 znaków)
  - Collapse middle segments jeśli breadcrumbs >4 poziomy
  - Ostatni segment non-clickable

- **Typy**:
  - `BreadcrumbsProps`
  - `BreadcrumbItem`

- **Propsy**:
  ```typescript
  interface BreadcrumbsProps {
    items: BreadcrumbItem[];
  }
  ```

### UserMenu

- **Opis komponentu**: Dropdown menu w prawym górnym rogu TopBar. Wyświetla avatar użytkownika, imię, rolę oraz menu z linkami (Profil, Wyloguj). Używa Radix UI Dropdown Menu (shadcn/ui).

- **Główne elementy**:
  - `<DropdownMenu>` (radix-ui)
  - `<DropdownMenuTrigger>` - przycisk z avatarem
    - `<UserAvatar />` - avatar użytkownika
  - `<DropdownMenuContent>` - zawartość dropdown
    - `<div className="user-info">` - imię i rola badge
    - `<DropdownMenuSeparator />`
    - `<DropdownMenuItem>` (link do profilu)
    - `<DropdownMenuItem>` (wyloguj, destructive)

- **Obsługiwane interakcje**:
  - Kliknięcie avatar → toggle dropdown
  - Kliknięcie "Profil" → nawigacja do /[role]/profile
  - Kliknięcie "Wyloguj" → wywołanie handleLogout
  - Escape lub click outside → zamknięcie dropdown

- **Obsługiwana walidacja**:
  - Nie wymaga walidacji

- **Typy**:
  - `UserMenuProps`
  - `User`

- **Propsy**:
  ```typescript
  interface UserMenuProps {
    user: User;
    onLogout: () => void;
  }
  ```

### UserAvatar

- **Opis komponentu**: Komponent wyświetlający avatar użytkownika z inicjałami. Tło avatara jest generowane na podstawie hash userId (color-coding). Wspiera różne rozmiary (xs, sm, md, lg, xl).

- **Główne elementy**:
  - `<div className="avatar">` - okrągły kontener
    - `<span>` - inicjały (pierwsza litera imienia + nazwiska)

- **Obsługiwane interakcje**:
  - Hover → wyświetlenie tooltip z pełnym imieniem (opcjonalnie)

- **Obsługiwana walidacja**:
  - Generowanie inicjałów z firstName i lastName
  - Fallback do "?" jeśli brak danych
  - Hash-based color selection (8-10 kolorów z palety Tailwind)

- **Typy**:
  - `UserAvatarProps`

- **Propsy**:
  ```typescript
  interface UserAvatarProps {
    userId: string;
    firstName: string;
    lastName: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    imageUrl?: string; // future feature
  }
  ```

### CollapseToggle

- **Opis komponentu**: Przycisk w Sidebar umożliwiający collapse/expand panelu. Na desktop widoczny zawsze, na mobile ukryty (sidebar działa jako overlay). Wyświetla ikonę strzałki wskazującej kierunek akcji.

- **Główne elementy**:
  - `<button>` - przycisk toggle
    - `<ChevronLeft />` lub `<ChevronRight />` - ikona stanu

- **Obsługiwane interakcje**:
  - Kliknięcie → wywołanie onToggle callback
  - Keyboard (Enter/Space) → toggle

- **Obsługiwana walidacja**:
  - Nie wymaga walidacji

- **Typy**:
  - `CollapseToggleProps`

- **Propsy**:
  ```typescript
  interface CollapseToggleProps {
    isCollapsed: boolean;
    onToggle: () => void;
  }
  ```

## 5. Typy

### NavigationItemConfig

Konfiguracja pojedynczego elementu nawigacji w menu:

```typescript
interface NavigationItemConfig {
  id: string; // unikalny identyfikator elementu
  label: string; // tekst wyświetlany w menu
  icon: LucideIcon; // ikona z lucide-react
  href?: string; // ścieżka docelowa (jeśli prosty link)
  roles: UserRole[]; // role, które mają dostęp do tego elementu
  expandable?: boolean; // czy element ma podmenu
  children?: NavigationItemConfig[]; // elementy podmenu
  badge?: {
    text: string;
    variant: 'default' | 'warning' | 'error';
  }; // opcjonalny badge (np. "Beta", liczba notyfikacji)
}
```

### BreadcrumbItem

Element okruszka nawigacyjnego:

```typescript
interface BreadcrumbItem {
  label: string; // tekst wyświetlany w breadcrumb
  href?: string; // ścieżka (undefined dla ostatniego elementu)
  truncate?: boolean; // czy truncate długie nazwy
}
```

### SidebarState

Stan sidebar przechowywany w localStorage:

```typescript
interface SidebarState {
  isCollapsed: boolean; // czy sidebar jest zwinięty
  expandedSections: string[]; // ID rozwiniętych sekcji (dla expandable items)
}
```

### LayoutContextType

Kontekst globalny dla layoutu:

```typescript
interface LayoutContextType {
  sidebarState: SidebarState;
  toggleSidebar: () => void;
  toggleSection: (sectionId: string) => void;
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}
```

### NavigationConfig (per role)

Konfiguracja nawigacji dla każdej roli:

```typescript
type NavigationConfig = {
  [key in UserRole]: NavigationItemConfig[];
};

// Przykład dla administratora:
const adminNavigation: NavigationItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    roles: ['administrator']
  },
  {
    id: 'users',
    label: 'Użytkownicy',
    icon: Users,
    roles: ['administrator'],
    expandable: true,
    children: [
      {
        id: 'users-admins',
        label: 'Administratorzy',
        href: '/admin/users?role=administrator',
        roles: ['administrator']
      },
      {
        id: 'users-trainers',
        label: 'Trenerzy',
        href: '/admin/users?role=trainer',
        roles: ['administrator']
      },
      {
        id: 'users-clients',
        label: 'Podopieczni',
        href: '/admin/users?role=client',
        roles: ['administrator']
      }
    ]
  },
  {
    id: 'exercises',
    label: 'Ćwiczenia',
    icon: Dumbbell,
    href: '/admin/exercises',
    roles: ['administrator']
  },
  {
    id: 'reasons',
    label: 'Powody niewykonania',
    icon: AlertCircle,
    href: '/admin/reasons',
    roles: ['administrator']
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: User,
    href: '/admin/profile',
    roles: ['administrator']
  }
];
```

## 6. Zarządzanie stanem

### Layout Context (useLayoutContext)

Globalny kontekst dla stanu layoutu, dostępny dla wszystkich komponentów w drzewie. Zapewnia:

- Stan sidebar (collapsed/expanded)
- Stan mobile sidebar (open/closed)
- Aktualną ścieżkę (currentPath)
- Breadcrumbs
- Funkcje do manipulacji stanem

**Implementacja:**

```typescript
// contexts/LayoutContext.tsx
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    // Odczyt z localStorage
    const saved = localStorage.getItem('sidebar-state');
    return saved ? JSON.parse(saved) : { isCollapsed: false, expandedSections: [] };
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Persystencja do localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-state', JSON.stringify(sidebarState));
  }, [sidebarState]);

  // Zamykanie mobile sidebar przy zmianie ścieżki
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  };

  const toggleSection = (sectionId: string) => {
    setSidebarState(prev => ({
      ...prev,
      expandedSections: prev.expandedSections.includes(sectionId)
        ? prev.expandedSections.filter(id => id !== sectionId)
        : [...prev.expandedSections, sectionId]
    }));
  };

  const value = {
    sidebarState,
    toggleSidebar,
    toggleSection,
    isMobileSidebarOpen,
    openMobileSidebar: () => setIsMobileSidebarOpen(true),
    closeMobileSidebar: () => setIsMobileSidebarOpen(false),
    currentPath: location.pathname,
    breadcrumbs,
    setBreadcrumbs
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutProvider');
  }
  return context;
}
```

### Custom Hooks

#### useMediaQuery

Hook do wykrywania rozmiaru ekranu (responsive behavior):

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Użycie:
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

#### useBreadcrumbs

Hook do automatycznego generowania breadcrumbs na podstawie currentPath:

```typescript
function useBreadcrumbs(pathname: string, role: UserRole): BreadcrumbItem[] {
  return useMemo(() => {
    // Parsowanie pathname i generowanie breadcrumbs
    // np. /admin/users/123/edit → [Admin, Użytkownicy, Jan Kowalski, Edytuj]
    const segments = pathname.split('/').filter(Boolean);
    // ... logika generowania breadcrumbs
  }, [pathname, role]);
}
```

## 7. Integracja API

Layout Navigation nie wymaga bezpośredniej integracji z API. Dane użytkownika (user object) są dostarczane z context autentykacji.

### User Context (dla dostępu do danych użytkownika)

```typescript
// Typ użytkownika z interface/users.ts
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  // ... inne pola
}

// Dostęp do usera przez context
const { user, logout } = useAuth(); // custom hook z auth context
```

### Akcja Logout

```typescript
async function handleLogout() {
  try {
    // Wywołanie API logout (Supabase)
    await supabase.auth.signOut();
    
    // Czyszczenie localStorage
    localStorage.removeItem('sidebar-state');
    
    // Redirect do login page
    navigate('/login');
    
    // Toast notification
    toast.success('Wylogowano pomyślnie');
  } catch (error) {
    console.error('Logout failed:', error);
    toast.error('Błąd podczas wylogowania');
  }
}
```

## 8. Interakcje użytkownika

### Sidebar Interactions

1. **Toggle Collapse (Desktop)**
   - Użytkownik klika przycisk CollapseToggle
   - Sidebar animuje się do collapsed state (64px width, tylko ikony)
   - Label elementów menu ukrywane
   - Stan persystowany w localStorage
   - Tooltips pokazywane przy hover na ikonach

2. **Expand/Collapse Section**
   - Użytkownik klika na expandable section (np. "Użytkownicy")
   - Podmenu rozwijane się z animacją
   - Ikona chevron rotuje (90° lub 180°)
   - Stan expandedSections aktualizowany
   - Możliwość wielu rozwiniętych sekcji jednocześnie

3. **Navigate to Page**
   - Użytkownik klika element menu z href
   - Nawigacja do odpowiedniej ścieżki (React Router)
   - Aktywny element highlightowany (bg color + border)
   - Na mobile: sidebar zamyka się automatycznie

4. **Mobile Sidebar**
   - Użytkownik klika hamburger icon (top-left w TopBar)
   - Sidebar slide-in from left (280px)
   - Backdrop blur + semi-transparent overlay
   - Kliknięcie backdrop → zamknięcie sidebar
   - Kliknięcie X button → zamknięcie sidebar
   - Zmiana route → automatyczne zamknięcie

### TopBar Interactions

1. **Breadcrumb Navigation**
   - Użytkownik klika segment breadcrumb (nie ostatni)
   - Nawigacja do odpowiedniej ścieżki
   - Hover na truncated label → tooltip z pełną nazwą

2. **User Menu**
   - Użytkownik klika avatar w prawym górnym rogu
   - Dropdown menu otwiera się
   - Kliknięcie "Profil" → nawigacja do /[role]/profile
   - Kliknięcie "Wyloguj" → wywołanie handleLogout + redirect

### Keyboard Interactions

1. **Sidebar Navigation**
   - Tab → przechodzenie między elementami menu
   - Enter/Space → aktywacja linku lub toggle expandable
   - Arrow Up/Down → nawigacja między elementami (opcjonalnie)
   - Escape → zamknięcie mobile sidebar

2. **User Menu Dropdown**
   - Tab → focus na trigger
   - Enter/Space → toggle dropdown
   - Arrow Up/Down → nawigacja między menu items
   - Enter → aktywacja selected item
   - Escape → zamknięcie dropdown

## 9. Warunki i walidacja

### Role-Based Access Control

**Komponenty:** Sidebar, NavigationList, NavigationItem

**Warunki:**
- Element menu jest wyświetlany tylko jeśli `user.role` zawiera się w `item.roles`
- Link jest aktywny (clickable) tylko jeśli użytkownik ma dostęp do href
- Expandable section jest widoczna jeśli przynajmniej jedno child ma matching role

**Implementacja:**
```typescript
function filterNavigationByRole(items: NavigationItemConfig[], userRole: UserRole): NavigationItemConfig[] {
  return items
    .filter(item => item.roles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children ? filterNavigationByRole(item.children, userRole) : undefined
    }))
    .filter(item => !item.expandable || (item.children && item.children.length > 0));
}
```

### Active Route Highlighting

**Komponenty:** NavigationItem

**Warunki:**
- Element jest active jeśli `currentPath` === `item.href`
- Dla expandable sections: active jeśli którykolwiek child jest active
- Partial match dla list views z query params (np. /admin/users?role=trainer)

**Implementacja:**
```typescript
function isItemActive(item: NavigationItemConfig, currentPath: string): boolean {
  if (item.href && currentPath === item.href) return true;
  if (item.href && currentPath.startsWith(item.href + '/')) return true; // nested routes
  if (item.children) {
    return item.children.some(child => isItemActive(child, currentPath));
  }
  return false;
}
```

### Breadcrumbs Truncation

**Komponenty:** Breadcrumbs, BreadcrumbItem

**Warunki:**
- Label dłuższy niż 30 znaków → truncate z ellipsis + tooltip
- Więcej niż 4 poziomy → collapse middle segments (show first, last, and ellipsis)
- Ostatni segment (current page) nie jest linkiem

**Implementacja:**
```typescript
function truncateLabel(label: string, maxLength: number = 30): { display: string; full: string } {
  if (label.length <= maxLength) {
    return { display: label, full: label };
  }
  return {
    display: label.slice(0, maxLength - 3) + '...',
    full: label
  };
}

function collapseBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  if (items.length <= 4) return items;
  return [
    items[0],
    { label: '...', href: undefined },
    ...items.slice(-2)
  ];
}
```

### Responsive Behavior Validation

**Komponenty:** MainLayout, Sidebar

**Warunki:**
- Desktop (>1024px): Sidebar persistent, collapsible
- Tablet (768-1023px): Sidebar collapsed by default, expand on hover
- Mobile (<768px): Sidebar hidden, hamburger menu, overlay mode

**Implementacja:**
```typescript
function getSidebarBehavior(isMobile: boolean, isTablet: boolean, isDesktop: boolean) {
  if (isMobile) return 'overlay';
  if (isTablet) return 'collapsed-hover';
  if (isDesktop) return 'persistent';
}
```

## 10. Obsługa błędów

### Authentication Errors

**Scenariusz:** Użytkownik nie jest zalogowany lub token wygasł

**Obsługa:**
- Middleware sprawdza JWT przy każdym routingu
- Jeśli invalid/expired → redirect do /login
- Toast: "Sesja wygasła. Zaloguj się ponownie."
- Zapisanie intended destination dla post-login redirect

```typescript
// W MainLayout
useEffect(() => {
  if (!user || !isValidToken(token)) {
    const intendedPath = location.pathname;
    localStorage.setItem('intended-path', intendedPath);
    navigate('/login');
    toast.error('Sesja wygasła. Zaloguj się ponownie.');
  }
}, [user, token]);
```

### Authorization Errors

**Scenariusz:** Użytkownik próbuje dostać się do zasobu poza swoją rolą (np. client próbuje /admin)

**Obsługa:**
- MainLayout sprawdza `requiredRole` vs `user.role`
- Jeśli mismatch → redirect do odpowiedniego dashboardu dla roli
- Toast: "Nie masz dostępu do tego zasobu"
- 403 error page (opcjonalnie)

```typescript
useEffect(() => {
  if (user && !hasRequiredRole(user.role, requiredRole)) {
    const dashboardPath = getRoleDashboard(user.role);
    navigate(dashboardPath);
    toast.error('Nie masz dostępu do tego zasobu');
  }
}, [user, requiredRole]);
```

### Navigation Configuration Errors

**Scenariusz:** Błąd w konfiguracji menu (np. brakujący href, niepoprawna ikona)

**Obsługa:**
- Validation schema dla NavigationConfig (Zod)
- Development mode: console.warn dla invalid items
- Fallback: ukrywanie broken items w production
- Error boundary dla całego Sidebar

```typescript
const NavigationItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.any(), // lucide icon
  href: z.string().optional(),
  roles: z.array(z.enum(['administrator', 'trainer', 'client'])).min(1),
  expandable: z.boolean().optional(),
  children: z.lazy(() => z.array(NavigationItemSchema).optional())
});

// Validate navigation config
try {
  NavigationItemSchema.array().parse(adminNavigation);
} catch (error) {
  console.error('Invalid navigation config:', error);
}
```

### LocalStorage Errors

**Scenariusz:** localStorage niedostępny (prywatny tryb przeglądarki) lub pełny

**Obsługa:**
- Try-catch przy odczycie/zapisie do localStorage
- Fallback do state w pamięci (bez persystencji)
- Graceful degradation: sidebar działa, ale nie pamięta stanu

```typescript
function saveSidebarState(state: SidebarState) {
  try {
    localStorage.setItem('sidebar-state', JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save sidebar state to localStorage:', error);
    // Continue without persistence
  }
}

function loadSidebarState(): SidebarState {
  try {
    const saved = localStorage.getItem('sidebar-state');
    return saved ? JSON.parse(saved) : getDefaultSidebarState();
  } catch (error) {
    console.warn('Unable to load sidebar state from localStorage:', error);
    return getDefaultSidebarState();
  }
}
```

### Responsive Behavior Errors

**Scenariusz:** Błędy w media queries lub ResizeObserver

**Obsługa:**
- Fallback do mobile layout jeśli błąd wykrywania rozmiaru
- Error boundary dla responsive components
- Testowanie na różnych urządzeniach i przeglądarkach

```typescript
// W useMediaQuery hook
useEffect(() => {
  try {
    const media = window.matchMedia(query);
    // ... reszta implementacji
  } catch (error) {
    console.error('Media query error:', error);
    // Fallback to safe default (mobile)
    setMatches(true);
  }
}, [query]);
```

### Logout Errors

**Scenariusz:** Błąd podczas wylogowania (API failure)

**Obsługa:**
- Force local logout nawet jeśli API fail
- Clear wszystkich local data (localStorage, session)
- Redirect do login page
- Toast z informacją o błędzie

```typescript
async function handleLogout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout API error:', error);
    toast.error('Wystąpił błąd podczas wylogowania, ale zostałeś wylogowany lokalnie');
  } finally {
    // Force local logout regardless of API result
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  }
}
```

## 11. Kroki implementacji

### Faza 1: Setup i Foundation (1-2 dni)

1. **Utworzenie struktury folderów**
   ```
   src/
   ├── layouts/
   │   ├── MainLayout.tsx
   │   ├── AdminLayout.tsx
   │   ├── TrainerLayout.tsx
   │   └── ClientLayout.tsx
   ├── components/
   │   ├── navigation/
   │   │   ├── Sidebar.tsx
   │   │   ├── NavigationList.tsx
   │   │   ├── NavigationItem.tsx
   │   │   ├── CollapseToggle.tsx
   │   │   ├── TopBar.tsx
   │   │   ├── Breadcrumbs.tsx
   │   │   ├── UserMenu.tsx
   │   │   └── UserAvatar.tsx
   ├── contexts/
   │   └── LayoutContext.tsx
   ├── config/
   │   └── navigation.config.ts
   └── hooks/
       ├── useMediaQuery.ts
       └── useBreadcrumbs.ts
   ```

2. **Instalacja zależności**
   ```bash
   npm install lucide-react @radix-ui/react-dropdown-menu
   ```

3. **Utworzenie typów w interface/index.ts**
   - `NavigationItemConfig`
   - `BreadcrumbItem`
   - `SidebarState`
   - `LayoutContextType`

4. **Konfiguracja Tailwind classes**
   - Dodanie custom transitions dla sidebar collapse
   - Responsive breakpoints
   - Color palette dla avatars

### Faza 2: Layout Context i Hooks (1 dzień)

5. **Implementacja LayoutContext**
   - `LayoutProvider` component
   - `useLayoutContext` hook
   - State management (sidebar, breadcrumbs)
   - LocalStorage persistence

6. **Implementacja useMediaQuery hook**
   - Media query detection
   - Responsive breakpoints
   - SSR safety (window check)

7. **Implementacja useBreadcrumbs hook**
   - Path parsing logic
   - Breadcrumb generation per role
   - Dynamic entity names (future enhancement)

### Faza 3: Navigation Configuration (0.5 dnia)

8. **Utworzenie navigation.config.ts**
   - Admin navigation items
   - Trainer navigation items
   - Client navigation items
   - Helper functions (filterByRole, isActive)

9. **Zod validation schemas dla config**
   - NavigationItemConfig schema
   - Validation w development mode

### Faza 4: Sidebar Implementation (2 dni)

10. **Implementacja Sidebar component**
    - Layout structure (aside, nav)
    - Logo section
    - Collapsed/expanded states
    - Mobile overlay behavior
    - Backdrop dla mobile

11. **Implementacja NavigationList component**
    - Items mapping
    - Active state detection
    - Expanded sections management

12. **Implementacja NavigationItem component**
    - Link rendering
    - Icon + Label
    - Expandable section toggle
    - Active highlighting
    - Tooltips dla collapsed mode

13. **Implementacja CollapseToggle component**
    - Toggle button
    - Icon rotation
    - Callback handling

14. **Styling i animacje**
    - Smooth transitions (250ms)
    - Hover effects
    - Active state styling
    - Responsive behavior (media queries)

### Faza 5: TopBar Implementation (1.5 dnia)

15. **Implementacja TopBar component**
    - Layout structure (header, sections)
    - Sticky/fixed positioning
    - Left/right sections

16. **Implementacja Breadcrumbs component**
    - Items rendering
    - Separator (ChevronRight)
    - Last item styling (non-clickable)
    - Truncation logic
    - Tooltip dla truncated labels

17. **Implementacja UserMenu component**
    - Radix UI Dropdown Menu
    - Avatar trigger
    - User info section
    - Menu items (Profile, Logout)
    - Logout handling

18. **Implementacja UserAvatar component**
    - Initials generation
    - Hash-based color selection
    - Size variants
    - Responsive sizing

### Faza 6: MainLayout Integration (1 dzień)

19. **Implementacja MainLayout component**
    - Sidebar + TopBar + MainContent composition
    - LayoutProvider wrapper
    - Auth check
    - Role enforcement
    - Responsive container

20. **Implementacja role-specific layouts**
    - AdminLayout (z MainLayout + requiredRole='administrator')
    - TrainerLayout (z MainLayout + requiredRole='trainer')
    - ClientLayout (z MainLayout + requiredRole='client')

21. **Route protection middleware**
    - Auth check w MainLayout
    - Role validation
    - Redirect logic
    - Intended path saving

### Faza 7: Responsive & Accessibility (1 dzień)

22. **Mobile optimizations**
    - Hamburger menu w TopBar
    - Touch-friendly hit areas (min 44px)
    - Swipe gestures (opcjonalnie)
    - Viewport meta tag

23. **Accessibility improvements**
    - ARIA labels (navigation, breadcrumb, menu)
    - Keyboard navigation (Tab, Arrow keys, Enter, Escape)
    - Focus management (trap w dropdown)
    - Screen reader announcements (ARIA live)
    - Focus visible indicators

24. **Testowanie responsive behavior**
    - Desktop (>1024px)
    - Tablet (768-1023px)
    - Mobile (<768px)
    - Różne przeglądarki (Chrome, Firefox, Safari)

### Faza 8: Error Handling & Edge Cases (0.5 dnia)

25. **Error boundaries**
    - Sidebar error boundary
    - TopBar error boundary
    - Graceful degradation

26. **Edge cases handling**
    - localStorage unavailable
    - Invalid navigation config
    - Missing user data
    - Auth errors
    - Network errors podczas logout

### Faza 9: Testing & Polish (1 dzień)

27. **Unit tests**
    - useLayoutContext hook
    - useMediaQuery hook
    - useBreadcrumbs hook
    - Navigation filtering functions

28. **Integration tests**
    - Sidebar navigation flow
    - Breadcrumbs generation
    - UserMenu interactions
    - Responsive behavior

29. **Visual polish**
    - Animations timing
    - Color consistency
    - Icon sizes
    - Spacing adjustments
    - Dark mode support (jeśli w roadmap)

### Faza 10: Documentation & Handoff (0.5 dnia)

30. **Code documentation**
    - JSDoc comments dla głównych komponentów
    - README dla navigation system
    - Przykłady użycia

31. **Storybook stories** (opcjonalnie)
    - Sidebar variations
    - TopBar variations
    - Navigation states

32. **Final review**
    - Code review checklist
    - Performance check (Lighthouse)
    - Accessibility audit (axe DevTools)
    - Cross-browser testing

---

**Szacowany czas implementacji:** 8-10 dni roboczych

**Priorytety:**
1. **Must-have (MVP):** Fazy 1-6 (core functionality)
2. **Should-have:** Faza 7 (responsive & accessibility)
3. **Nice-to-have:** Fazy 8-10 (testing, polish, documentation)

**Dependencies:**
- Auth context musi być gotowy przed rozpoczęciem (user object, logout function)
- shadcn/ui components (Button, DropdownMenu) muszą być zainstalowane
- Routing setup (React Router) musi być skonfigurowany

**Potencjalne blokery:**
- Brak jasnej specyfikacji jak generować entity names w breadcrumbs (może wymagać dodatkowego API call)
- Design system colors - upewnij się, że paleta kolorów dla avatars jest zatwierdzona
- Performance na mobile z wieloma elementami menu - może wymagać lazy loading lub virtualization

