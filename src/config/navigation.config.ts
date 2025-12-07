import type { NavigationItemConfig, NavigationConfig } from "../interface";
import type { UserRole } from "../types/db";
import { LayoutDashboard, Users, Dumbbell, AlertCircle, User, Calendar, ClipboardList, Home } from "lucide-react";

/**
 * Navigation configuration for Administrator role
 */
const adminNavigation: NavigationItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    roles: ["admin"],
  },
  {
    id: "users",
    label: "Użytkownicy",
    icon: Users,
    href: "/admin/users",
    roles: ["admin"],
  },
  {
    id: "exercises",
    label: "Ćwiczenia",
    icon: Dumbbell,
    href: "/admin/exercises",
    roles: ["admin"],
  },
  {
    id: "plans",
    label: "Plany treningowe",
    icon: ClipboardList,
    href: "/admin/plans",
    roles: ["admin"],
  },
  {
    id: "reasons",
    label: "Powody niewykonania",
    icon: AlertCircle,
    href: "/admin/reasons",
    roles: ["admin"],
  },
  {
    id: "profile",
    label: "Profil",
    icon: User,
    href: "/admin/profile",
    roles: ["admin"],
  },
];

/**
 * Navigation configuration for Trainer role
 */
const trainerNavigation: NavigationItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/trainer",
    roles: ["trainer"],
  },
  {
    id: "clients",
    label: "Podopieczni",
    icon: Users,
    href: "/trainer/clients",
    roles: ["trainer"],
  },
  {
    id: "plans",
    label: "Plany treningowe",
    icon: ClipboardList,
    href: "/trainer/plans",
    roles: ["trainer"],
  },
  {
    id: "profile",
    label: "Profil",
    icon: User,
    href: "/trainer/profile",
    roles: ["trainer"],
  },
];

/**
 * Navigation configuration for Client role
 */
const clientNavigation: NavigationItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/client",
    roles: ["client"],
  },
  {
    id: "my-plans",
    label: "Mój plan",
    icon: Calendar,
    href: "/client/plans",
    roles: ["client"],
  },
  {
    id: "profile",
    label: "Profil",
    icon: User,
    href: "/client/profile",
    roles: ["client"],
  },
];

/**
 * Main navigation configuration mapped by role
 */
export const navigationConfig: NavigationConfig = {
  admin: adminNavigation,
  trainer: trainerNavigation,
  client: clientNavigation,
};

/**
 * Filter navigation items by user role
 *
 * @param items - Array of navigation items to filter
 * @param userRole - Current user's role
 * @returns Filtered navigation items accessible to the role
 */
export function filterNavigationByRole(items: NavigationItemConfig[], userRole: UserRole): NavigationItemConfig[] {
  return items
    .filter((item) => item.roles.includes(userRole))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavigationByRole(item.children, userRole) : undefined,
    }))
    .filter((item) => !item.expandable || (item.children && item.children.length > 0));
}

/**
 * Check if navigation item is active based on current path
 *
 * @param item - Navigation item to check
 * @param currentPath - Current route path
 * @returns true if item or any of its children are active
 */
export function isItemActive(item: NavigationItemConfig, currentPath: string): boolean {
  // Exact match
  if (item.href && currentPath === item.href) {
    return true;
  }

  // Check if any child is active
  if (item.children) {
    return item.children.some((child) => isItemActive(child, currentPath));
  }

  // Nested route match (only for items with children or expandable items)
  // This prevents sibling routes from being marked as active
  if (item.href && item.children && currentPath.startsWith(item.href + "/")) {
    return true;
  }

  return false;
}

/**
 * Get navigation items for a specific role
 *
 * @param role - User role
 * @returns Navigation items for the role
 */
export function getNavigationForRole(role: UserRole): NavigationItemConfig[] {
  return navigationConfig[role] || [];
}
