import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import type { DeletePlanConfirmationModalProps } from "@/interface/plans";

export const DeletePlanConfirmationModal = ({
  isOpen,
  plan,
  onClose,
  onConfirm,
  isDeleting,
}: DeletePlanConfirmationModalProps) => {
  const [isHardDelete, setIsHardDelete] = useState(false);

  const handleConfirm = () => {
    if (plan) {
      onConfirm(plan.id, isHardDelete);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setIsHardDelete(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
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
        <div className="flex items-center space-x-2 pb-2">
          <Checkbox
            id="hard-delete"
            checked={isHardDelete}
            onCheckedChange={(checked) => setIsHardDelete(checked === true)}
            disabled={isDeleting}
          />
          <label
            htmlFor="hard-delete"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Trwale usuń plan
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : isHardDelete ? "Usuń trwale" : "Ukryj plan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
