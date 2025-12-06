import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import type { PlanActionMenuProps } from "@/interface/plans";

export const PlanActionMenu = ({ plan, onEdit, onToggleVisibility, onDuplicate, onDelete }: PlanActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Otwórz menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edytuj
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
        >
          {plan.isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Pokaż podopiecznemu
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              {plan.isHidden ? "Pokaż podopiecznemu" : "Ukryj przed podopiecznym"}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplikuj
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
