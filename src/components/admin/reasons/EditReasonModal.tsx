import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateReasonCommandSchema } from "@/lib/validation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { UpdateReasonFormData, ReasonViewModel } from "@/interface";

interface EditReasonModalProps {
  reason: ReasonViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: UpdateReasonFormData) => Promise<void>;
  isPending: boolean;
}

/**
 * Modal with form for editing an existing reason
 * Fields are optional, but at least one must be provided
 */
export const EditReasonModal = ({ reason, isOpen, onClose, onConfirm, isPending }: EditReasonModalProps) => {
  const form = useForm<UpdateReasonFormData>({
    resolver: zodResolver(UpdateReasonCommandSchema),
    defaultValues: {
      code: "",
      label: "",
    },
  });

  // Pre-fill form when reason changes
  useEffect(() => {
    if (isOpen && reason) {
      form.reset({
        code: reason.code,
        label: reason.label,
      });
    }
  }, [isOpen, reason, form]);

  const handleSubmit = async (data: UpdateReasonFormData) => {
    // Only send changed fields
    const updates: UpdateReasonFormData = {};
    if (data.code && data.code !== reason?.code) {
      updates.code = data.code;
    }
    if (data.label && data.label !== reason?.label) {
      updates.label = data.label;
    }

    // Check if there are any changes
    if (Object.keys(updates).length === 0) {
      form.setError("root", {
        message: "Musisz zmienić przynajmniej jedno pole",
      });
      return;
    }

    await onConfirm(updates);
    form.reset();
    onClose();
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  if (!reason) return null;

  const labelLength = form.watch("label")?.length || 0;
  const hasChanges =
    (form.watch("code") !== reason.code && form.watch("code") !== "") ||
    (form.watch("label") !== reason.label && form.watch("label") !== "");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj powód</DialogTitle>
          <DialogDescription>
            Zaktualizuj kod lub treść powodu. Wszystkie pola są opcjonalne, ale musisz zmienić przynajmniej jedno.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kod</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={reason.code}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    />
                  </FormControl>
                  <FormDescription>Małe litery, cyfry i podkreślniki (3-50 znaków)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treść powodu</FormLabel>
                  <FormControl>
                    <Textarea placeholder={reason.label} rows={3} {...field} className="resize-none" />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Tekst wyświetlany podopiecznym</span>
                    <span className={labelLength > 200 ? "text-destructive" : ""}>{labelLength}/200</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isPending || !hasChanges}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
