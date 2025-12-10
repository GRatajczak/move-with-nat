import { useState } from "react";
import { useExercise } from "@/hooks/exercises/useExercise";
import { useDeleteExercise } from "@/hooks/exercises/useDeleteExercise";
import { useParsedDescription } from "@/hooks/exercises/useParsedDescription";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash, ArrowLeft, Calendar, Dumbbell, Clock, Activity } from "lucide-react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { QueryProvider } from "../QueryProvider";

const ExerciseDetailContent = ({ id }: { id: string }) => {
  const { data: exercise, isLoading, error } = useExercise(id);
  const { mutateAsync: deleteExercise, isPending: isDeleting } = useDeleteExercise();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Parse description fields - must be called before any conditional returns
  const parsedDescription = useParsedDescription(exercise?.description);

  const handleEdit = () => {
    window.location.href = `/admin/exercises/${id}/edit`;
  };

  const handleBack = () => {
    window.location.href = "/admin/exercises";
  };

  const handleDeleteConfirm = async (id: string, hard: boolean) => {
    try {
      await deleteExercise({ id, hard });
      window.location.href = "/admin/exercises";
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !exercise) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Nie udało się załadować ćwiczenia: {error ? error.message : "Nie znaleziono"}</p>
        <Button variant="link" onClick={handleBack} className="pl-0 mt-2">
          Wróć do listy
        </Button>
      </div>
    );
  }

  // Mock usage data if not present (api might not return it yet depending on backend impl)
  // The plan says usageCount is part of ExerciseViewModel but endpoint might need update
  const usageCount = exercise.usageCount || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DeleteConfirmationModal
        exercise={exercise}
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:px-0 px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 hidden md:flex">
              <span className={exercise.isHidden ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
                {exercise.isHidden ? "Ukryte" : "Aktywne"}
              </span>
              <span>•</span>
              <span>ID: {exercise.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Usuń
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 md:px-0 px-4">
        {/* Main Content (Video + Desc) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
            <ReactPlayer src={`https://vimeo.com/${exercise.vimeoToken}`} width="100%" height="100%" controls />
          </div>

          {/* Description Sections */}
          <div className="bg-card rounded-lg border shadow-sm">
            <Accordion type="multiple" defaultValue={["description", "tips"]} className="w-full">
              <AccordionItem value="description">
                <AccordionTrigger className="px-4">Cele ćwiczenia</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground whitespace-pre-wrap">
                  {parsedDescription.description || "Nie dodano opisu celów."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tips">
                <AccordionTrigger className="px-4">Wskazówki trenera</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground whitespace-pre-wrap">
                  {parsedDescription.tips || "Nie dodano wskazówek."}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Sidebar (Metadata) */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-lg mb-4">Informacje</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="block text-sm font-medium">Domyślny ciężar</span>
                  <span className="text-sm text-muted-foreground">
                    {exercise.defaultWeight ? `${exercise.defaultWeight} kg` : "Nie określono"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="block text-sm font-medium">Tempo</span>
                  <span className="text-sm text-muted-foreground">{exercise.tempo || "Nie określono"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="block text-sm font-medium">Użycie w planach</span>
                  <span className="text-sm text-muted-foreground">{usageCount} planów</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="block text-sm font-medium">Utworzono</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(exercise.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {usageCount > 0 && (
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="font-semibold mb-4">Wykorzystano w {usageCount} planach</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ExerciseDetailContainer = (props: { id: string }) => {
  return (
    <QueryProvider>
      <ExerciseDetailContent {...props} />
    </QueryProvider>
  );
};

const DetailSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex justify-between">
      <Skeleton className="h-10 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
);
