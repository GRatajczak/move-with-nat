import type { UserRole } from "../types/db";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** NAVIGATION TYPES **/

/** Single navigation item configuration **/
export interface NavigationItemConfig {
  id: string; // unique identifier for the item
  label: string; // text displayed in menu
  icon: LucideIcon; // icon from lucide-react
  href?: string; // target path (if simple link)
  roles: UserRole[]; // roles that have access to this item
  expandable?: boolean; // whether item has submenu
  children?: NavigationItemConfig[]; // submenu items
  badge?: {
    text: string;
    variant: "default" | "warning" | "error";
  }; // optional badge (e.g. "Beta", notification count)
}

/** Breadcrumb navigation item **/
export interface BreadcrumbItem {
  label: string; // text displayed in breadcrumb
  href?: string; // path (undefined for last element)
  truncate?: boolean; // whether to truncate long names
}

/** Sidebar state stored in localStorage **/
export interface SidebarState {
  isCollapsed: boolean; // whether sidebar is collapsed
  expandedSections: string[]; // IDs of expanded sections (for expandable items)
}

/** Layout context type **/
export interface LayoutContextType {
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

/** Navigation configuration per role **/
export type NavigationConfig = Record<UserRole, NavigationItemConfig[]>;

/** Sidebar component props **/
export interface SidebarProps {
  role: UserRole;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
}

/** Main layout component props **/
export interface MainLayoutProps {
  children: ReactNode;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  currentPath: string;
  requiredRole?: UserRole | UserRole[];
}

/** Top bar component props **/
export interface TopBarProps {
  breadcrumbs: BreadcrumbItem[];
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  onLogout: () => void;
  onMobileMenuOpen: () => void;
}

/** Navigation list component props **/
export interface NavigationListProps {
  items: NavigationItemConfig[];
  isCollapsed: boolean;
  currentPath: string;
}

/** Breadcrumbs component props **/
export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Navigation item component props **/
export interface NavigationItemProps {
  item: NavigationItemConfig;
  isCollapsed: boolean;
  isActive: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

/** User avatar component props **/
export interface UserAvatarProps {
  userId: string;
  firstName: string;
  lastName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  imageUrl?: string; // future feature
}

/** User menu component props **/
export interface UserMenuProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  onLogout: () => void;
}
