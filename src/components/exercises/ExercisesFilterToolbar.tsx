import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

interface ExercisesFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  isLoading?: boolean;
}

export const ExercisesFilterToolbar: React.FC<ExercisesFilterToolbarProps> = ({
  search,
  onSearchChange,
  onCreateClick,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:px-0 px-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Szukaj ćwiczenia..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isLoading}
          maxLength={100}
        />
      </div>

      <Button onClick={onCreateClick} disabled={isLoading}>
        <Plus className="mr-2 h-4 w-4" />
        Dodaj ćwiczenie
      </Button>
    </div>
  );
};
