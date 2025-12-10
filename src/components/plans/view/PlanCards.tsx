import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff } from "lucide-react";
import { PlanActionMenu } from "./PlanActionMenu";
import type { PlansTableProps } from "@/interface/plans";

export const PlanCards = ({
  plans,
  isLoading,
  onRowClick,
  onEdit,
  onToggleVisibility,
  onDuplicate,
  onDelete,
}: PlansTableProps) => {
  if (isLoading) {
    return <CardsSkeleton />;
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed mx-4">
        <p className="text-muted-foreground">Brak planów treningowych</p>
        <p className="text-sm text-muted-foreground mt-2">Stwórz pierwszy plan aby rozpocząć</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4">
      {plans.map((plan) => {
        const completionStats = plan.completionStats || { completed: 0, total: 0, percentage: 0 };

        return (
          <Card
            key={plan.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onRowClick(plan.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold leading-none tracking-tight">{plan.name}</h3>
                  <Badge variant={plan.isHidden ? "secondary" : "default"} className="mt-2">
                    {plan.isHidden ? "Ukryty" : "Widoczny"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(plan.id, !plan.isHidden);
                    }}
                  >
                    {plan.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <PlanActionMenu
                    plan={plan}
                    onEdit={() => onEdit(plan.id)}
                    onToggleVisibility={() => onToggleVisibility(plan.id, !plan.isHidden)}
                    onDuplicate={() => onDuplicate(plan.id)}
                    onDelete={() => onDelete(plan.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                {/* Client info */}
                <div className="flex items-center gap-2 text-sm">
                  {plan.clientAvatar && (
                    <img src={plan.clientAvatar} alt={plan.clientName || ""} className="w-6 h-6 rounded-full" />
                  )}
                  <span className="text-muted-foreground">{plan.clientName || "Nieznany podopieczny"}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {plan.exercises.length} {plan.exercises.length === 1 ? "ćwiczenie" : "ćwiczeń"}
                  </span>
                  <span className="text-muted-foreground">
                    {completionStats.completed}/{completionStats.total} wykonanych
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 text-xs text-muted-foreground">
              Utworzono: {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("pl-PL") : "—"}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

const CardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 px-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Skeleton className="h-3 w-32" />
        </CardFooter>
      </Card>
    ))}
  </div>
);
