import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useExercisesList } from "@/hooks/exercises/useExercisesList";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseQuickPreviewModal } from "../../exercises/ExerciseQuickPreviewModal";
import type { ExerciseDto } from "@/interface/exercises";
import type { AddExerciseModalProps } from "@/interface/plans";

export const AddExerciseModal = ({ isOpen, onClose, onConfirm, excludeExerciseIds = [] }: AddExerciseModalProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewExercise, setPreviewExercise] = useState<ExerciseDto | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { exercises, pagination, isLoading } = useExercisesList({
    search: searchQuery,
    page: currentPage,
    limit: 10,
  });

  const availableExercises = exercises?.filter((ex) => !excludeExerciseIds.includes(ex.id)) || [];

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleToggle = (exerciseId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selected = availableExercises.filter((ex) => selectedIds.has(ex.id));
    onConfirm(selected);
    setSelectedIds(new Set());
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery("");
    setCurrentPage(1);
    onClose();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Dodaj ćwiczenia</DialogTitle>
            <DialogDescription>Wybierz ćwiczenia z biblioteki, które chcesz dodać do planu</DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Szukaj ćwiczenia..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Exercise list */}
            <ScrollArea className="pr-4 h-[calc(80vh-340px)]">
              {isLoading ? (
                <ExerciseListSkeleton />
              ) : availableExercises.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? "Nie znaleziono ćwiczeń" : "Wszystkie ćwiczenia są już dodane"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.has(exercise.id)}
                        onCheckedChange={() => handleToggle(exercise.id)}
                        id={`exercise-${exercise.id}`}
                      />
                      <label
                        htmlFor={`exercise-${exercise.id}`}
                        className="flex-1 cursor-pointer flex items-center gap-3"
                      >
                        {exercise.vimeoToken && (
                          <img
                            src={`https://vumbnail.com/${exercise.vimeoToken}.jpg`}
                            alt={exercise.name}
                            className="w-16 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.defaultWeight ? `${exercise.defaultWeight} kg` : "Brak domyślnego ciężaru"} •{" "}
                            {exercise.tempo || "Tempo nie określone"}
                          </p>
                        </div>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewExercise(exercise);
                        }}
                        className="shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
              <div className="flex items-center justify-center gap-2 py-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Poprzednia
                </Button>

                <div className="flex items-center gap-1 text-sm font-medium px-2">
                  Strona {currentPage} z {Math.ceil(pagination.total / pagination.limit)}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(pagination.total / pagination.limit)}
                >
                  Następna
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <p className="text-sm text-muted-foreground">Wybrano: {selectedIds.size} ćwiczeń</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Anuluj
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={selectedIds.size === 0}>
                Dodaj wybrane
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewExercise && (
        <ExerciseQuickPreviewModal
          isOpen={!!previewExercise}
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}
    </>
  );
};

const ExerciseListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="w-16 h-10 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    ))}
  </div>
);
