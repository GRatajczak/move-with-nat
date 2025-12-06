import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, UserCheck, UserX, Mail } from "lucide-react";
import type { UserActionMenuProps } from "@/interface";

export const UserActionMenu = ({ user, onEdit, onToggleActive, onResendInvite, onDelete }: UserActionMenuProps) => {
  const isPending = user.isActive && (!user.firstName || !user.lastName);
  const isActive = user.isActive && user.firstName && user.lastName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Otwórz menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edytuj
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Toggle Active/Suspend */}
        {isActive && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
          >
            <UserX className="mr-2 h-4 w-4" />
            Dezaktywuj
          </DropdownMenuItem>
        )}

        {!isActive && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Aktywuj
          </DropdownMenuItem>
        )}

        {/* Resend Invite - only for pending users */}
        {isPending && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onResendInvite();
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Wyślij link aktywacyjny
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
