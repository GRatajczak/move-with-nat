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
import type { ToggleActiveUserModalProps } from "@/interface";

export const ToggleActiveUserModal = ({ user, isOpen, onClose, onConfirm, isUpdating }: ToggleActiveUserModalProps) => {
  if (!user) return null;

  const isActivating = user.status !== "active";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActivating ? "Aktywować użytkownika?" : "Zawiesić użytkownika?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isActivating ? (
              <>
                Użytkownik{" "}
                <strong>
                  {user.firstName} {user.lastName}
                </strong>{" "}
                zostanie aktywowany i odzyska dostęp do systemu.
              </>
            ) : (
              <>
                Użytkownik{" "}
                <strong>
                  {user.firstName} {user.lastName}
                </strong>{" "}
                zostanie zawieszony i utraci dostęp do systemu.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating} onClick={onClose}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isUpdating}>
            {isUpdating ? "Zapisywanie..." : isActivating ? "Aktywuj" : "Zawieś"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
