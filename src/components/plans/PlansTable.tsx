import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlanActionMenu } from "./PlanActionMenu";
import type { PlansTableProps } from "@/interface/plans";

export const PlansTable = ({
  plans,
  isLoading,
  onRowClick,
  onEdit,
  onToggleVisibility,
  onDuplicate,
  onDelete,
}: PlansTableProps) => {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
        <p className="text-muted-foreground">Brak planów treningowych</p>
        <p className="text-sm text-muted-foreground mt-2">Stwórz pierwszy plan aby rozpocząć</p>
      </div>
    );
  }

  console.log(plans);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa planu</TableHead>
            <TableHead>Podopieczny</TableHead>
            <TableHead>Data utworzenia</TableHead>
            <TableHead>Widoczność</TableHead>
            <TableHead>Liczba ćwiczeń</TableHead>
            <TableHead>Postęp</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => {
            const completionStats = plan.completionStats || { completed: 0, total: 0 };

            return (
              <TableRow
                key={plan.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(plan.id)}
              >
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {plan.clientAvatar && (
                      <img src={plan.clientAvatar} alt={plan.clientName || ""} className="w-6 h-6 rounded-full" />
                    )}
                    <span>{plan.clientName || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("pl-PL") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={plan.isHidden ? "secondary" : "default"}>
                    {plan.isHidden ? "Ukryty" : "Widoczny"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {plan.exercises.length} {plan.exercises.length === 1 ? "ćwiczenie" : "ćwiczeń"}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {completionStats.completed}/{completionStats.total}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <PlanActionMenu
                    plan={plan}
                    onEdit={() => onEdit(plan.id)}
                    onToggleVisibility={() => onToggleVisibility(plan.id, !plan.isHidden)}
                    onDuplicate={() => onDuplicate(plan.id)}
                    onDelete={() => onDelete(plan.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-28" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-12 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-2 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-20 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
