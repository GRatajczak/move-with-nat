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
import type { DeleteUserModalProps } from "@/interface";

export const DeleteUserModal = ({ user, isOpen, onClose, onConfirm, isDeleting }: DeleteUserModalProps) => {
  if (!user) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Użytkownik{" "}
            <strong>
              {user.firstName} {user.lastName}
            </strong>{" "}
            ({user.email}) zostanie trwale usunięty z systemu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onClose}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
