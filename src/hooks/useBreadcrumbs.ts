import { useMemo } from "react";
import type { BreadcrumbItem } from "../interface";
import type { UserRole } from "../types/db";

/**
 * Route configuration for breadcrumb generation
 */
const routeConfig: Record<string, string> = {
  // Admin routes
  admin: "Dashboard",
  users: "Użytkownicy",
  exercises: "Ćwiczenia",
  reasons: "Powody niewykonania",
  profile: "Profil",

  // Trainer routes
  trainer: "Dashboard",
  clients: "Podopieczni",
  plans: "Plany treningowe",

  // Client routes
  client: "Dashboard",

  // Common
  new: "Nowy",
  edit: "Edytuj",
  settings: "Ustawienia",
};

/**
 * Custom hook to generate breadcrumbs from current path
 *
 * @param pathname - Current route pathname
 * @param role - Current user's role
 * @returns Array of breadcrumb items
 *
 * @example
 * useBreadcrumbs('/admin/exercises/123/edit', 'admin')
 * // Returns: [
 * //   { label: 'Dashboard', href: '/admin' },
 * //   { label: 'Ćwiczenia', href: '/admin/exercises' },
 * //   { label: 'Edytuj' }
 * // ]
 */
export function useBreadcrumbs(pathname: string, role: UserRole): BreadcrumbItem[] {
  return useMemo(() => {
    // Split path into segments and filter empty strings
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return [];
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Get display label for segment
      const label = routeConfig[segment] || segment;

      // Skip UUID-like segments (entity IDs) - we'll use the next segment or parent label
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

      if (isUuid) {
        // Skip adding UUID to breadcrumbs, but keep building the path
        return;
      }

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        truncate: label.length > 30,
      });
    });

    return breadcrumbs;
  }, [pathname, role]);
}
