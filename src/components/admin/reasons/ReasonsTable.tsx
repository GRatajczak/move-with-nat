import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ReasonsTableRow } from "./ReasonsTableRow";
import type { ReasonViewModel } from "@/interface";

interface ReasonsTableProps {
  reasons: ReasonViewModel[];
  isLoading: boolean;
  onEdit: (reason: ReasonViewModel) => void;
  onDelete: (reason: ReasonViewModel) => void;
}

/**
 * Table component for displaying list of reasons on desktop
 * Shows: Code, Label, Usage Count, Created At, Actions
 */
export const ReasonsTable = ({ reasons, isLoading, onEdit, onDelete }: ReasonsTableProps) => {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (reasons.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
        <p className="text-muted-foreground">Brak powodów niewykonania</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kod</TableHead>
            <TableHead>Treść</TableHead>
            <TableHead className="text-center">Liczba użyć</TableHead>
            <TableHead>Data utworzenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reasons.map((reason) => (
            <ReasonsTableRow key={reason.id} reason={reason} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/**
 * Loading skeleton with 5 placeholder rows
 */
const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
            <TableHead className="text-center">
              <Skeleton className="h-4 w-24 mx-auto" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-28" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-16 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 ml-auto rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
