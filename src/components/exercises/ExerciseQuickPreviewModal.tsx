import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import ReactPlayer from "react-player";
import type { ExerciseQuickPreviewModalProps } from "@/interface";

export const ExerciseQuickPreviewModal = ({ exercise, isOpen, onClose, onEdit }: ExerciseQuickPreviewModalProps) => {
  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between text-xl">{exercise.name}</DialogTitle>
        </DialogHeader>

        <div className="w-full aspect-video bg-black relative">
          <ReactPlayer
            src={`https://vimeo.com/${exercise.vimeoToken}`}
            width="100%"
            height="100%"
            controls
            light={exercise.thumbnailUrl || true} // Use thumbnail if available, else auto-generated
          />
        </div>

        <div className="p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block mb-1">Tempo</span>
            <span className="font-medium">{exercise.tempo || "Nie określono"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Domyślny ciężar</span>
            <span className="font-medium">{exercise.defaultWeight ? `${exercise.defaultWeight} kg` : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Utworzono</span>
            <span className="font-medium">{new Date(exercise.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Użycie</span>
            <span className="font-medium">{exercise.usageCount ? `${exercise.usageCount} planów` : "0 planów"}</span>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 bg-muted/20 flex justify-between items-center sm:justify-between">
          {onEdit && (
            <Button className="ml-auto" onClick={() => onEdit(exercise.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
