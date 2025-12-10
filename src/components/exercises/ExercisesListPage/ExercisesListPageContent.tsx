import React, { useState } from "react";
import { useExercisesList } from "@/hooks/exercises/useExercisesList";
import { useDeleteExercise } from "@/hooks/exercises/useDeleteExercise";
import { ExercisesFilterToolbar } from "../ExercisesFilterToolbar";
import { ExercisesTable } from "../ExercisesTable";
import { ExerciseCards } from "../ExerciseCards";
import { Pagination } from "../Pagination";
import { ExerciseQuickPreviewModal } from "../ExerciseQuickPreviewModal";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ExerciseViewModel } from "@/interface";

export const ExercisesListContent = () => {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const { exercises, pagination, isLoading, error } = useExercisesList({ search, page });

  const { mutateAsync: deleteExercise, isPending: isDeleting } = useDeleteExercise();

  const [previewExercise, setPreviewExercise] = useState<ExerciseViewModel | null>(null);
  const [deleteModalExercise, setDeleteModalExercise] = useState<ExerciseViewModel | null>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCreateClick = () => {
    window.location.href = "/admin/exercises/new";
  };

  const handleRowClick = (exercise: ExerciseViewModel) => {
    setPreviewExercise(exercise);
  };

  const handleEdit = (id: string) => {
    window.location.href = `/admin/exercises/${id}/edit`;
  };

  const handleView = (id: string) => {
    window.location.href = `/admin/exercises/${id}`;
  };

  const handleDeleteClick = (exercise: ExerciseViewModel) => {
    setDeleteModalExercise(exercise);
  };

  const handleConfirmDelete = async (id: string, hard: boolean) => {
    try {
      await deleteExercise({ id, hard });
      setDeleteModalExercise(null);
    } catch (error) {
      // Error handling is done in hook via toast
      console.error(error);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Wystąpił błąd podczas ładowania ćwiczeń: {error instanceof Error ? error.message : "Nieznany błąd"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex  items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Biblioteka Ćwiczeń</h1>
          <p className="text-muted-foreground">Zarządzaj bazą ćwiczeń dostępnych w planach treningowych.</p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/admin")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do Dashboard
        </Button>
      </div>

      <ExercisesFilterToolbar
        search={search}
        onSearchChange={(value) => setSearch(value)}
        onCreateClick={handleCreateClick}
        isLoading={isLoading}
      />

      {isDesktop ? (
        <ExercisesTable
          exercises={exercises}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDeleteClick}
        />
      ) : (
        <ExerciseCards
          exercises={exercises}
          isLoading={isLoading}
          onCardClick={handleRowClick}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDeleteClick}
        />
      )}

      {pagination && <Pagination meta={pagination} onPageChange={setPage} />}

      {/* Modals */}
      <ExerciseQuickPreviewModal
        exercise={previewExercise}
        isOpen={!!previewExercise}
        onClose={() => setPreviewExercise(null)}
        onEdit={(id) => {
          setPreviewExercise(null);
          handleEdit(id);
        }}
      />

      <DeleteConfirmationModal
        exercise={deleteModalExercise}
        isOpen={!!deleteModalExercise}
        onCancel={() => setDeleteModalExercise(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
