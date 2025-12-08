import type { UserRole } from "@/types";

const HIERARCHY: UserRole[] = ["client", "trainer", "admin"];

export const hasRequiredRole = (requiredRole: UserRole, userRole: UserRole) => {
  const requiredRoleIndex = HIERARCHY.indexOf(requiredRole);
  const userRoleIndex = HIERARCHY.indexOf(userRole);

  return userRoleIndex >= requiredRoleIndex;
};
