import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseCompletionRow } from "./ExerciseCompletionRow";
import { ExerciseQuickPreviewModal } from "../../exercises/ExerciseQuickPreviewModal";
import { useExercise } from "@/hooks/exercises/useExercise";
import type { PlanExercisesDetailListProps } from "@/interface/plans";
import type { ExerciseDto } from "@/interface/exercises";

export const PlanExercisesDetailList = ({ exercises, completionRecords }: PlanExercisesDetailListProps) => {
  const [previewExerciseId, setPreviewExerciseId] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<ExerciseDto | null>(null);

  const { data: exerciseData, isLoading: isLoadingExercise } = useExercise(previewExerciseId);

  useEffect(() => {
    if (exerciseData && !isLoadingExercise) {
      setPreviewExercise(exerciseData as ExerciseDto);
    }
  }, [exerciseData, isLoadingExercise]);

  // Sort exercises by sortOrder
  const sortedExercises = [...exercises].sort((a, b) => a.sortOrder - b.sortOrder);

  const getCompletionForExercise = (exerciseId: string) => {
    return completionRecords.find((record) => record.exerciseId === exerciseId);
  };

  const handlePreviewClick = (exerciseId: string) => {
    setPreviewExerciseId(exerciseId);
  };

  const handleClosePreview = () => {
    setPreviewExercise(null);
    setPreviewExerciseId(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista ćwiczeń ({exercises.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Brak ćwiczeń w tym planie</div>
          ) : (
            <div className="space-y-3">
              {sortedExercises.map((exercise, index) => (
                <ExerciseCompletionRow
                  key={exercise.exerciseId}
                  exercise={exercise}
                  orderNumber={index + 1}
                  completion={getCompletionForExercise(exercise.exerciseId)}
                  onPreviewClick={() => handlePreviewClick(exercise.exerciseId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Preview Modal */}
      <ExerciseQuickPreviewModal isOpen={!!previewExercise} exercise={previewExercise} onClose={handleClosePreview} />
    </>
  );
};
