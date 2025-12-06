import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, CheckCircle2, XCircle, Circle } from "lucide-react";
import type { ExerciseCompletionRowProps } from "@/interface/plans";

export const ExerciseCompletionRow = ({
  exercise,
  orderNumber,
  completion,
  onPreviewClick,
}: ExerciseCompletionRowProps) => {
  const getCompletionBadge = () => {
    if (!completion) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Circle className="h-3 w-3 fill-current" />
          Brak danych
        </Badge>
      );
    }

    if (completion.isCompleted) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Wykonane
        </Badge>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1 cursor-help">
              <XCircle className="h-3 w-3" />
              Nie wykonano
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-semibold mb-1">Powód:</p>
            <p className="text-sm">{completion.customReason || "Nie podano powodu"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      {/* Order Number */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold shrink-0">
        {orderNumber}
      </div>

      {/* Exercise Info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={onPreviewClick} className="text-base font-medium hover:underline text-left">
              {/* Exercise name will be denormalized from API */}
              Ćwiczenie {exercise.exerciseId.slice(0, 8)}
            </button>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onPreviewClick}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          {getCompletionBadge()}
        </div>

        {/* Parameters */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Serie:</span> {exercise.sets}
          </div>
          <div>
            <span className="font-medium">Powtórzenia:</span> {exercise.reps}
          </div>
          {exercise.defaultWeight && (
            <div>
              <span className="font-medium">Ciężar:</span> {exercise.defaultWeight} kg
            </div>
          )}
          <div>
            <span className="font-medium">Tempo:</span> {exercise.tempo || "3-0-3"}
          </div>
        </div>

        {/* Completion Date */}
        {completion?.completedAt && (
          <p className="text-xs text-muted-foreground">
            Wykonano: {new Date(completion.completedAt).toLocaleString("pl-PL")}
          </p>
        )}
      </div>
    </div>
  );
};
