import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DeleteConfirmationModalProps } from "@/interface";

export const DeleteConfirmationModal = ({
  exercise,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationModalProps) => {
  const [isHardDelete, setIsHardDelete] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) setIsHardDelete(false);
  }, [isOpen]);

  if (!exercise) return null;

  const usageCount = exercise.usageCount || 0;
  const isUsedInPlans = usageCount > 0;

  const handleConfirm = () => {
    onConfirm(exercise.id, isHardDelete);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle>Usuń ćwiczenie</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Czy na pewno chcesz usunąć ćwiczenie{" "}
            <span className="font-semibold text-foreground">&quot;{exercise.name}&quot;</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isUsedInPlans && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm">
              <p className="font-medium mb-1">To ćwiczenie jest używane w {usageCount} planach treningowych.</p>
              <p>
                Zalecamy <strong>ukrycie</strong> ćwiczenia zamiast usuwania, aby zachować historię planów.
              </p>
            </div>
          )}

          <div className="flex items-start space-x-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hard-delete"
                      checked={isHardDelete}
                      onCheckedChange={(checked) => setIsHardDelete(checked as boolean)}
                      disabled={isUsedInPlans}
                    />
                    <label
                      htmlFor="hard-delete"
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        isUsedInPlans ? "text-muted-foreground" : ""
                      }`}
                    >
                      Usuń trwale z bazy danych
                    </label>
                  </div>
                </TooltipTrigger>
                {isUsedInPlans && (
                  <TooltipContent>
                    <p>Trwałe usunięcie możliwe tylko dla nieużywanych ćwiczeń</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {isHardDelete && <p className="text-xs text-destructive mt-1 ml-6">Tej operacji nie można cofnąć.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isHardDelete ? "Usuń trwale" : "Ukryj ćwiczenie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
