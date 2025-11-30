import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationProps } from "@/interface";

export const Pagination = ({ meta, onPageChange }: PaginationProps) => {
  const { page, limit, total } = meta;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-muted-foreground">
        Wyświetlono {startItem}-{endItem} z {total} ćwiczeń
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Poprzednia
        </Button>

        <div className="flex items-center gap-1 text-sm font-medium">
          Strona {page} z {totalPages}
        </div>

        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Następna
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
