import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { ClientStatus } from "@/interface/clients";

interface ClientsFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: ClientStatus;
  onStatusChange: (value: ClientStatus | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

export const ClientsFilterToolbar = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  isLoading,
}: ClientsFilterToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 md:px-0 px-4">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Szukaj po imieniu lub nazwisku..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          disabled={isLoading}
        />
      </div>

      {/* Status filter */}
      <Select
        value={status || "all"}
        onValueChange={(value) => onStatusChange(value === "all" ? undefined : (value as ClientStatus))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie statusy</SelectItem>
          <SelectItem value="active">Aktywny</SelectItem>
          <SelectItem value="pending">Oczekujący</SelectItem>
          <SelectItem value="suspended">Zawieszony</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters} disabled={isLoading} className="gap-2">
          <X className="h-4 w-4" />
          Wyczyść
        </Button>
      )}
    </div>
  );
};
