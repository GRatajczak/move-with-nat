import React from "react";
import { ExerciseDetailHeader } from "./ExerciseDetailHeader";
import { VimeoPlayer } from "./VimeoPlayer";
import { ExerciseMetadataGrid } from "./ExerciseMetadataGrid";
import { ExerciseDescriptionAccordion } from "./ExerciseDescriptionAccordion";
import { CompletionSection } from "./CompletionSection";
import { useExerciseCompletion } from "@/hooks/plans/useExerciseCompletion";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryProvider } from "@/components/QueryProvider";
import type { ReasonFormValues, ExerciseCompletionPageProps } from "@/interface/exercise-completion";

const ExerciseCompletionContent = ({ planId, exerciseId }: ExerciseCompletionPageProps) => {
  const { exerciseData, completionStatus, isLoading, error, markCompletion, isUpdating } = useExerciseCompletion({
    planId,
    exerciseId,
  });

  const handleUpdate = (data: { completed: boolean } & ReasonFormValues) => {
    markCompletion(data);
    if (data.completed) {
      toast.success("Ćwiczenie oznaczone jako wykonane");
    } else {
      toast.success("Status zapisany");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="aspect-video w-full rounded-md" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !exerciseData) {
    return (
      <div className="mx-auto p-8 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Wystąpił błąd</h2>
        <p className="text-muted-foreground">Nie udało się załadować danych ćwiczenia.</p>
        <Button asChild variant="outline">
          <a href={`/client/plans/${planId}`}>Wróć do planu</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 pb-24 md:pb-4">
      <ExerciseDetailHeader name={exerciseData.name} planId={planId} />

      <VimeoPlayer videoId={exerciseData.videoId} />

      <ExerciseMetadataGrid meta={exerciseData.meta} />

      <ExerciseDescriptionAccordion description={exerciseData.description} />

      <CompletionSection currentStatus={completionStatus} onUpdate={handleUpdate} isUpdating={isUpdating} />
    </div>
  );
};

export const ExerciseCompletionPage = (props: ExerciseCompletionPageProps) => {
  return (
    <QueryProvider>
      <ExerciseCompletionContent {...props} />
    </QueryProvider>
  );
};
