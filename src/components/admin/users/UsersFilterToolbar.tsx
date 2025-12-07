import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X } from "lucide-react";
import type { UsersFilters, UsersFilterToolbarProps } from "@/interface/users";

export const UsersFilterToolbar = ({
  filters,
  onFiltersChange,
  onCreateClick,
  isLoading = false,
}: UsersFilterToolbarProps) => {
  const hasActiveFilters = filters.search || filters.role || filters.status || filters.trainerId;

  const handleClearFilters = () => {
    onFiltersChange({
      search: undefined,
      role: undefined,
      status: undefined,
      trainerId: undefined,
      page: 1,
    });
  };

  return (
    <div className="space-y-4 mb-6 md:px-0 px-4">
      {/* Search and Create Button Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Szukaj użytkownika..."
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined, page: 1 })}
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        <Button onClick={onCreateClick} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj użytkownika
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Role Filter */}
        <Select
          value={filters.role || "all"}
          onValueChange={(value) =>
            onFiltersChange({ role: value === "all" ? undefined : (value as UsersFilters["role"]), page: 1 })
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie role</SelectItem>
            <SelectItem value="administrator">Administrator</SelectItem>
            <SelectItem value="trainer">Trener</SelectItem>
            <SelectItem value="client">Podopieczny</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFiltersChange({ status: value === "all" ? undefined : (value as UsersFilters["status"]), page: 1 })
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="active">Aktywny</SelectItem>
            <SelectItem value="pending">Oczekujący</SelectItem>
            <SelectItem value="suspended">Zawieszony</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            <X className="mr-2 h-4 w-4" />
            Wyczyść filtry
          </Button>
        )}
      </div>
    </div>
  );
};
