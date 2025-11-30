import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseActionMenu } from "./ExerciseActionMenu";
import type { ExerciseCardsProps } from "@/interface";
import { Button } from "../ui/button";

export const ExerciseCards = ({ exercises, isLoading, onCardClick, onEdit, onView, onDelete }: ExerciseCardsProps) => {
  if (isLoading) {
    return <CardsSkeleton />;
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
        <p className="text-muted-foreground">Brak ćwiczeń w bibliotece</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:px-0 px-4">
      {exercises.map((exercise) => (
        <Card
          key={exercise.id}
          className="hover:border-primary/50 transition-colors overflow-hidden pt-0"
          onClick={() => onCardClick(exercise)}
        >
          <div className="aspect-video w-full bg-muted relative">
            <img
              src={`https://vumbnail.com/${exercise.vimeoToken}.jpg`}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold leading-none tracking-tight">{exercise.name}</h3>
              <div className="text-sm text-muted-foreground">
                {exercise.tempo ? `Tempo: ${exercise.tempo}` : "Brak tempa"}
              </div>
            </div>

            <Button onClick={(e) => e.stopPropagation()}>
              <ExerciseActionMenu
                exerciseId={exercise.id}
                onEdit={() => onEdit(exercise.id)}
                onView={() => onView(exercise.id)}
                onDelete={() => onDelete(exercise)}
              />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

const CardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="border rounded-lg overflow-hidden space-y-3">
        <Skeleton className="aspect-video w-full" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
