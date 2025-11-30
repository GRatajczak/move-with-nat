import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReasonViewModel } from "@/interface";

interface DeleteReasonModalProps {
  reason: ReasonViewModel | null;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (id: string) => Promise<void>;
  isPending: boolean;
}

/**
 * Modal with confirmation for deleting a reason
 * Shows usage count and warning if reason is in use
 */
export const DeleteReasonModal = ({ reason, isOpen, onCancel, onConfirm, isPending }: DeleteReasonModalProps) => {
  if (!reason) return null;

  const usageCount = reason.usageCount || 0;
  const isUsedInPlans = usageCount > 0;

  const handleConfirm = () => {
    onConfirm(reason.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle>Usuń powód?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Czy na pewno chcesz usunąć powód{" "}
              <span className="font-semibold text-foreground">&quot;{reason.label}&quot;</span> (kod:{" "}
              <span className="font-mono text-foreground">{reason.code}</span>)?
            </p>
            <p className="text-sm">
              Ten powód został użyty <span className="font-semibold text-foreground">{usageCount} razy</span>.
            </p>
            {isUsedInPlans && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm">
                <p className="font-medium">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Uwaga: Nie można usunąć powodu, który jest w użyciu.
                </p>
                <p className="mt-1">
                  Ten powód jest używany w planach treningowych i nie może być usunięty. Najpierw usuń wszystkie
                  odniesienia do tego powodu.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
