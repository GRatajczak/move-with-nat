import { usePlan } from "@/hooks/plans/usePlan";
import { usePlanCompletion } from "@/hooks/plans/usePlanCompletion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PlayCircle, CheckCircle, Circle } from "lucide-react";
import { QueryProvider } from "@/components/QueryProvider";
import type { PlanExerciseDto } from "@/interface/plans";

const PlanDetailsContent = ({ planId }: { planId: string }) => {
  const { data: plan, isLoading, error } = usePlan(planId);

  const { data: completionData } = usePlanCompletion(planId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8 text-center" data-testid="plan-error-state">
        <h2 className="text-xl font-bold mb-2">Błąd ładowania planu</h2>
        <Button asChild variant="outline">
          <a href="/client">Wróć do dashboardu</a>
        </Button>
      </div>
    );
  }

  const getCompletionStatus = (exerciseId: string) => {
    if (!completionData) return false;
    return completionData.completionRecords.some((r) => r.exerciseId === exerciseId && r.isCompleted);
  };

  return (
    <div className=" mx-auto p-4 pb-20" data-testid="plan-details-page">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild data-testid="back-to-dashboard-button">
          <a href="/client">
            <ChevronLeft className="h-6 w-6" />
          </a>
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="plan-details-title">
            {plan.name}
          </h1>
          {plan.description && (
            <p className="text-muted-foreground text-sm" data-testid="plan-details-description">
              {plan.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4" data-testid="plan-exercises-list">
        {plan.exercises.map((planExercise: PlanExerciseDto) => {
          const isCompleted = getCompletionStatus(planExercise.exerciseId);

          return (
            <a
              key={planExercise.id}
              href={`/client/plans/${plan.id}/exercises/${planExercise.exerciseId}`}
              className="block"
              data-testid="plan-exercise-item"
              data-exercise-id={planExercise.exerciseId}
            >
              <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary transition-colors bg-card">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold" data-testid="exercise-name">
                      {planExercise.exercise?.name || "Ćwiczenie"}
                    </h3>
                    <div className="text-sm text-muted-foreground flex gap-2" data-testid="exercise-details">
                      <span data-testid="exercise-sets">{planExercise.sets} serii</span>
                      <span>•</span>
                      <span data-testid="exercise-reps">{planExercise.reps} powt.</span>
                    </div>
                  </div>
                </div>
                <PlayCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </a>
          );
        })}

        {plan.exercises.length === 0 && (
          <div
            className="text-center p-8 text-muted-foreground border rounded-lg border-dashed"
            data-testid="empty-exercises-state"
          >
            Ten plan nie ma jeszcze przypisanych ćwiczeń.
          </div>
        )}
      </div>
    </div>
  );
};

export const PlanDetailsPage = (props: { planId: string }) => {
  return (
    <QueryProvider>
      <PlanDetailsContent {...props} />
    </QueryProvider>
  );
};
