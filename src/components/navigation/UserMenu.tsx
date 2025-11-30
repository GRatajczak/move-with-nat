import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "../ui/badge";
import type { UserMenuProps } from "@/interface";
import type { UserRole } from "@/types/db";

/**
 * Get display name for user role
 */
function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: "Administrator",
    trainer: "Trener",
    client: "Podopieczny",
  };
  return roleNames[role] || role;
}

/**
 * Get profile path based on user role
 */
function getProfilePath(role: UserRole): string {
  return `/${role}/profile`;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const profilePath = getProfilePath(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
        <UserAvatar userId={user.id} firstName={user.firstName} lastName={user.lastName} size="sm" />
        <span className="hidden md:inline-block text-sm font-medium">
          {user.firstName} {user.lastName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info section */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-3">
            <UserAvatar userId={user.id} firstName={user.firstName} lastName={user.lastName} size="md" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <Badge variant="secondary" className="w-fit text-xs">
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        {/* Profile link */}
        <DropdownMenuItem asChild>
          <a href={profilePath} className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </a>
        </DropdownMenuItem>

        {/* Logout */}
        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Wyloguj</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
