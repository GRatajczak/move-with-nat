import { useState } from "react";
import { ExerciseForm } from "./ExerciseForm";
import { useCreateExercise } from "@/hooks/exercises/useCreateExercise";
import type { ExerciseFormData } from "@/interface";
import { QueryProvider } from "../QueryProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

const CreateExerciseContent = () => {
  const { mutateAsync: createExercise, isPending } = useCreateExercise();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (data: ExerciseFormData) => {
    // Map UI fields to API DTO
    // Combine descriptions into one string or JSON for now since API expects string
    const fullDescription = JSON.stringify({
      description: data.description,
      tips: data.tips,
    });

    await createExercise({
      name: data.name,
      vimeoToken: data.vimeoToken,
      defaultWeight: data.defaultWeight || undefined, // fix for nullable
      description: fullDescription, // Storing JSON string in description
      tempo: data.tempo || null,
    });

    setShowSuccessModal(true);
  };

  const handleCancel = () => {
    window.location.href = "/admin/exercises";
  };

  const handleGoBack = () => {
    window.location.href = "/admin/exercises";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4 ">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nowe ćwiczenie</h1>
          <p className="text-muted-foreground">Dodaj nowe ćwiczenie do biblioteki.</p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/admin/exercises")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Button>
      </div>

      <div className="bg-card rounded-lg border px-4 shadow-sm">
        <ExerciseForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isPending} />
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="mb-2">Ćwiczenie utworzone</DialogTitle>
                <DialogDescription>Nowe ćwiczenie zostało pomyślnie dodane do biblioteki.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button onClick={handleGoBack} className="ml-auto w-full sm:w-auto">
              Wróć do listy ćwiczeń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const CreateExerciseContainer = () => {
  return (
    <QueryProvider>
      <CreateExerciseContent />
    </QueryProvider>
  );
};
