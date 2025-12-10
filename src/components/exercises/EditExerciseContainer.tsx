import React from "react";
import { ExerciseForm } from "./ExerciseForm";
import { useUpdateExercise } from "@/hooks/exercises/useUpdateExercise";
import { useExercise } from "@/hooks/exercises/useExercise";
import type { ExerciseFormData } from "@/interface";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QueryProvider } from "../QueryProvider";

const EditExerciseContent = ({ id }: { id: string }) => {
  const { data: exercise, isLoading, error } = useExercise(id);
  const { mutateAsync: updateExercise, isPending } = useUpdateExercise();

  const handleSubmit = async (data: ExerciseFormData) => {
    const fullDescription = JSON.stringify({
      description: data.description,
      tips: data.tips,
    });

    await updateExercise({
      id,
      command: {
        name: data.name,
        vimeoToken: data.vimeoToken,
        defaultWeight: data.defaultWeight || undefined,
        description: fullDescription,
        tempo: data.tempo || null,
      },
    });
  };

  const handleCancel = () => {
    window.location.href = `/admin/exercises/${id}`;
  };

  if (isLoading) {
    return <EditSkeleton />;
  }

  if (error || !exercise) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Nie udało się załadować ćwiczenia: {error ? error.message : "Nie znaleziono"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4 ">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edytuj ćwiczenie: {exercise.name}</h1>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/admin/exercises")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Button>
      </div>

      <div className="bg-card rounded-lg border px-4 shadow-sm">
        <ExerciseForm exercise={exercise} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isPending} />
      </div>
    </div>
  );
};

export const EditExerciseContainer = (props: { id: string }) => {
  return (
    <QueryProvider>
      <EditExerciseContent {...props} />
    </QueryProvider>
  );
};

const EditSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/3" />
    <div className="bg-card rounded-lg border p-6 space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-32" />
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  </div>
);
