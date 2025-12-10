import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import type { CreateUserSuccessModalProps } from "@/interface";

export const CreateUserSuccessModal = ({ isOpen, onOpenChange, onConfirm }: CreateUserSuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 min-w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="mb-2">Użytkownik utworzony</DialogTitle>
              <DialogDescription>
                Nowe konto użytkownika zostało pomyślnie utworzone. Link aktywacyjny został wysłany na podany adres
                email.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button onClick={onConfirm} className="ml-auto w-full sm:w-auto">
            Wróć do listy użytkowników
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
