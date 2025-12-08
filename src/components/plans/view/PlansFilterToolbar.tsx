import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { PlansFilterToolbarProps } from "@/interface/plans";
import { ClientSelect } from "../shared/ClientSelect";

export const PlansFilterToolbar = ({
  search,
  onSearchChange,
  clientId,
  onClientChange,
  visible,
  onVisibilityChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  isLoading = false,
}: PlansFilterToolbarProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {/* Search input */}
      <div className="relative flex-1 ">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Szukaj po nazwie..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isLoading}
          maxLength={100}
        />
      </div>

      {/* Client filter */}
      <ClientSelect value={clientId} onChange={onClientChange} disabled={isLoading} className="w-full" allowAll />

      {/* Visibility filter */}
      <Select
        value={visible === null ? "all" : visible ? "visible" : "hidden"}
        onValueChange={(value) => {
          if (value === "all") onVisibilityChange(null);
          else if (value === "visible")
            onVisibilityChange(false); // isHidden = false
          else onVisibilityChange(true); // isHidden = true
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Widoczność" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          <SelectItem value="visible">Widoczne</SelectItem>
          <SelectItem value="hidden">Ukryte</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort filter */}
      <Select value={sortBy} onValueChange={onSortChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sortowanie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Najnowsze</SelectItem>
          <SelectItem value="-created_at">Najstarsze</SelectItem>
          <SelectItem value="name">Nazwa A-Z</SelectItem>
          <SelectItem value="-name">Nazwa Z-A</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters} disabled={isLoading} className="gap-2">
          <X className="h-4 w-4" />
          Wyczyść filtry
        </Button>
      )}
    </div>
  );
};
