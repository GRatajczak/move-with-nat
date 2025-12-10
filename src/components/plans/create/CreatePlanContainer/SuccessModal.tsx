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

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const SuccessModal = ({ open, onOpenChange, onConfirm }: SuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="mb-2">Plan utworzony</DialogTitle>
              <DialogDescription>Nowy plan treningowy został pomyślnie utworzony.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button className="ml-auto w-full sm:w-auto" onClick={onConfirm}>
            Wróć do listy planów
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
