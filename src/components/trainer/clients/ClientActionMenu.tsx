import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Plus } from "lucide-react";
import type { ClientActionMenuProps } from "@/interface/clients";

export const ClientActionMenu = ({ onViewProfile, onCreatePlan }: ClientActionMenuProps) => {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={handleMenuClick}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Otwórz menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={handleMenuClick}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
        >
          <User className="mr-2 h-4 w-4" />
          Zobacz profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onCreatePlan();
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Stwórz plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
