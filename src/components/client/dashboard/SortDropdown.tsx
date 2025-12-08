import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientPlansSortDropdownProps, ClientPlansSortOption } from "@/interface/client-dashboard";
import { ArrowUpDown } from "lucide-react";

/**
 * Sort options configuration
 */
const SORT_OPTIONS: { value: ClientPlansSortOption; label: string }[] = [
  { value: "createdAt_desc", label: "Najnowsze" },
  { value: "createdAt_asc", label: "Najstarsze" },
  { value: "progress_desc", label: "Najbardziej ukończone" },
  { value: "progress_asc", label: "Najmniej ukończone" },
];

/**
 * Sort dropdown for client plans
 * Updates URL search params on change
 */
export function SortDropdown({ value, onChange }: ClientPlansSortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="size-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Sortuj według..." />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
