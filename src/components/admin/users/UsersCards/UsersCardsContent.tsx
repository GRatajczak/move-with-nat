import { Card } from "@/components/ui/card";
import { CardsSkeleton } from "./CardsSkeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserActionMenu } from "../UserActionMenu";
import type { UsersCardsProps } from "@/interface";
import { Mail, Calendar, User } from "lucide-react";

export const UsersCardsContent = ({
  users,
  isLoading,
  onCardClick,
  onEdit,
  onToggleActive,
  onResendInvite,
  onDelete,
}: UsersCardsProps) => {
  if (isLoading) {
    return <CardsSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
        <p className="text-muted-foreground">Brak użytkowników pasujących do kryteriów</p>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "trainer":
        return "default";
      case "client":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "trainer":
        return "Trener";
      case "client":
        return "Podopieczny";
      default:
        return role;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "suspended":
        return "destructive";
      case "pending":
        return "outline";
      case "active":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "suspended":
        return "Zawieszony";
      case "pending":
        return "Oczekujący";
      case "active":
        return "Aktywny";
      default:
        return status;
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:px-0 px-4">
      {users.map((user) => (
        <Card
          key={user.id}
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onCardClick(user)}
        >
          <div className="p-4">
            {/* Header with Avatar and Action Menu */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(user.firstName, user.lastName, user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold leading-none">
                    {user.firstName && user.lastName ? (
                      `${user.firstName} ${user.lastName}`
                    ) : (
                      <span className="text-muted-foreground italic">Brak danych</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs">
                      {getStatusLabel(user.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <UserActionMenu
                  user={user}
                  onEdit={() => onEdit(user.id)}
                  onToggleActive={() => onToggleActive(user)}
                  onResendInvite={() => onResendInvite(user)}
                  onDelete={() => onDelete(user)}
                />
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{user.email}</span>
              </div>

              {user.role === "client" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{user.trainerId ? "Trener przypisany" : "Brak trenera"}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Utworzono {new Date(user.createdAt).toLocaleDateString("pl-PL")}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
