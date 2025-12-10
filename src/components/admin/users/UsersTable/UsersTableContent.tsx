import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserActionMenu } from "../UserActionMenu";
import type { UsersTableProps } from "@/interface";
import { TableSkeleton } from "./TableSkeleton";

export const UsersTableContent = ({
  users,
  isLoading,
  onRowClick,
  onEdit,
  onToggleActive,
  onResendInvite,
  onDelete,
}: UsersTableProps) => {
  if (isLoading) {
    return <TableSkeleton />;
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trener</TableHead>
            <TableHead>Utworzono</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(user)}
            >
              <TableCell className="font-medium flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(user.firstName, user.lastName, user.email)}
                  </AvatarFallback>
                </Avatar>
                {user.firstName && user.lastName ? (
                  `${user.firstName} ${user.lastName}`
                ) : (
                  <span className="text-muted-foreground italic">Brak danych</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(user.status)}>{getStatusLabel(user.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.trainerId ? (
                  <span className="text-xs">Przypisany</span>
                ) : user.role === "client" ? (
                  <span className="text-xs text-muted-foreground italic">Brak</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(user.createdAt).toLocaleDateString("pl-PL")}
              </TableCell>
              <TableCell className="text-right">
                <UserActionMenu
                  user={user}
                  onEdit={() => onEdit(user.id)}
                  onToggleActive={() => onToggleActive(user)}
                  onResendInvite={() => onResendInvite(user)}
                  onDelete={() => onDelete(user)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
