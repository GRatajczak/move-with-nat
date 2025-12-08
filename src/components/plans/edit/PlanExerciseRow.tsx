import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { PlanExerciseFormData, PlanExerciseRowProps } from "@/interface/plans";
import { ExerciseQuickPreviewModal } from "../../exercises/ExerciseQuickPreviewModal";
import { tempoRegex } from "@/lib/regex";

export const PlanExerciseRow = ({ exercise, index, onRemove, onUpdate, disabled = false }: PlanExerciseRowProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.exerciseId,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFieldChange = (field: keyof PlanExerciseFormData, value: number | null | string) => {
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));
    let error = "";

    const handleSetValueError = (value: number) => {
      if (isNaN(value) || value < 1) error = "Min. 1 seria";
      else if (value > 100) error = "Max. 100 serii";
    };
    const handleRepsValueError = (value: number) => {
      if (isNaN(value) || value < 1) error = "Min. 1 powtórzenie";
      else if (value > 1000) error = "Max. 1000 powtórzeń";
    };
    const handleDefaultWeightValueError = (value: number) => {
      if (isNaN(value) || value < 0) {
        error = "Ciężar nie może być ujemny";
      }
    };
    const handleTempoValueError = (value: string) => {
      if (value && typeof value === "string" && !tempoRegex.test(value)) {
        error = "Format: XXXX lub X-X-X (np. 3-0-3)";
      }
    };

    switch (field) {
      case "sets": {
        handleSetValueError(Number(value));
        break;
      }
      case "reps": {
        handleRepsValueError(Number(value));
        break;
      }
      case "defaultWeight": {
        handleDefaultWeightValueError(Number(value));
        break;
      }
      case "tempo": {
        handleTempoValueError(value as string);
        break;
      }
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      onUpdate({ [field]: value });
    }
  };

  return (
    <>
      <Card ref={setNodeRef} style={style} className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
            {...attributes}
            {...listeners}
            aria-label={`Przeciągnij aby zmienić kolejność ćwiczenia ${index + 1}`}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="flex-1 space-y-4">
            {/* Exercise header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-sm font-medium hover:underline text-left"
                >
                  {exercise.exercise?.name || `Ćwiczenie ${exercise.exerciseId.slice(0, 8)}`}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                disabled={disabled}
                className="text-destructive hover:text-destructive h-8 w-8"
                aria-label="Usuń ćwiczenie"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Inline fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Sets */}
              <div className="space-y-1">
                <Label htmlFor={`sets-${exercise.exerciseId}`} className="text-xs">
                  Serie *
                </Label>
                <Input
                  id={`sets-${exercise.exerciseId}`}
                  type="number"
                  min="1"
                  max="100"
                  value={exercise.sets}
                  onChange={(e) => handleFieldChange("sets", Number(e.target.value))}
                  disabled={disabled}
                  className={errors.sets ? "border-destructive" : ""}
                />
                {errors.sets && <p className="text-xs text-destructive">{errors.sets}</p>}
              </div>

              {/* Reps */}
              <div className="space-y-1">
                <Label htmlFor={`reps-${exercise.exerciseId}`} className="text-xs">
                  Powtórzenia *
                </Label>
                <Input
                  id={`reps-${exercise.exerciseId}`}
                  type="number"
                  min="1"
                  max="1000"
                  value={exercise.reps}
                  onChange={(e) => handleFieldChange("reps", Number(e.target.value))}
                  disabled={disabled}
                  className={errors.reps ? "border-destructive" : ""}
                />
                {errors.reps && <p className="text-xs text-destructive">{errors.reps}</p>}
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <Label htmlFor={`weight-${exercise.exerciseId}`} className="text-xs">
                  Ciężar (kg)
                </Label>
                <Input
                  id={`weight-${exercise.exerciseId}`}
                  type="number"
                  min="0"
                  step="0.5"
                  value={exercise.defaultWeight ?? ""}
                  onChange={(e) =>
                    handleFieldChange("defaultWeight", e.target.value === "" ? null : Number(e.target.value))
                  }
                  disabled={disabled}
                  placeholder="Opcjonalnie"
                  className={errors.defaultWeight ? "border-destructive" : ""}
                />
                {errors.defaultWeight && <p className="text-xs text-destructive">{errors.defaultWeight}</p>}
              </div>

              {/* Tempo */}
              <div className="space-y-1">
                <Label htmlFor={`tempo-${exercise.exerciseId}`} className="text-xs">
                  Tempo
                </Label>
                <Input
                  id={`tempo-${exercise.exerciseId}`}
                  type="text"
                  value={exercise.tempo || ""}
                  onChange={(e) => handleFieldChange("tempo", e.target.value)}
                  disabled={disabled}
                  placeholder="3-0-3"
                  className={errors.tempo ? "border-destructive" : ""}
                />
                {errors.tempo && <p className="text-xs text-destructive">{errors.tempo}</p>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Preview Modal */}
      {exercise.exercise && (
        <ExerciseQuickPreviewModal
          isOpen={isPreviewOpen}
          exercise={exercise.exercise}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
};
