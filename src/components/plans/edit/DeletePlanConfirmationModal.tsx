import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import type { DeletePlanConfirmationModalProps } from "@/interface/plans";

export const DeletePlanConfirmationModal = ({
  isOpen,
  plan,
  onClose,
  onConfirm,
  isDeleting,
}: DeletePlanConfirmationModalProps) => {
  const handleConfirm = () => {
    if (plan) {
      onConfirm(plan.id, false); // soft delete by default
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Usuń plan?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Czy na pewno chcesz usunąć plan <strong>&quot;{plan?.name}&quot;</strong>?
            </p>
            <p className="text-sm">
              Plan zniknie z dashboardu podopiecznego i nie będzie już dostępny. Tej operacji nie można cofnąć.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
