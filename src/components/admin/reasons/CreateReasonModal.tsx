import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateReasonCommandSchema } from "@/lib/validation";
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
import type { CreateReasonFormData } from "@/interface";

interface CreateReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CreateReasonFormData) => Promise<void>;
  isPending: boolean;
}

/**
 * Modal with form for creating a new reason
 * Fields: code (lowercase alphanumeric + underscore), label (max 200 chars)
 */
export const CreateReasonModal = ({ isOpen, onClose, onConfirm, isPending }: CreateReasonModalProps) => {
  const form = useForm<CreateReasonFormData>({
    resolver: zodResolver(CreateReasonCommandSchema),
    defaultValues: {
      code: "",
      label: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSubmit = async (data: CreateReasonFormData) => {
    await onConfirm(data);
    form.reset();
    onClose();
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  const labelLength = form.watch("label")?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowy powód</DialogTitle>
          <DialogDescription>
            Utwórz nowy standardowy powód, który podopieczni będą mogli wybierać podczas oznaczania ćwiczeń jako
            niewykonanych.
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
                      placeholder="np. pain, fatigue, equipment_unavailable"
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
                    <Textarea
                      placeholder="np. Odczuwałem ból podczas ćwiczenia"
                      rows={3}
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Tekst wyświetlany podopiecznym</span>
                    <span className={labelLength > 200 ? "text-destructive" : ""}>{labelLength}/200</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isPending || !form.formState.isValid}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Dodaj powód
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
