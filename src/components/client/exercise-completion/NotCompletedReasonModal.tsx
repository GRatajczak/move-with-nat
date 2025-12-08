import { useEffect } from "react";
import type { NotCompletedReasonModalProps, ReasonFormValues } from "@/interface/exercise-completion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z
  .object({
    reasonId: z.string().optional(),
    customReason: z.string().max(200, "Maksymalnie 200 znaków").optional(),
  })
  .refine((data) => data.reasonId || (data.customReason && data.customReason.trim().length > 0), {
    message: "Wybierz powód z listy lub opisz sytuację",
    path: ["customReason"],
  });

export const NotCompletedReasonModal = ({
  isOpen,
  reasons,
  onConfirm,
  onClose,
  isSubmitting,
}: NotCompletedReasonModalProps) => {
  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reasonId: undefined,
      customReason: "",
    },
  });

  const handleSubmit = (values: ReasonFormValues) => {
    onConfirm(values);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dlaczego nie udało się wykonać?</DialogTitle>
          <DialogDescription>Wybierz powód lub opisz sytuację, aby trener mógł dostosować plan.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="reasonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Powód</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz powód" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dodatkowy opis (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Np. ból w kolanie przy 3 serii..."
                      className="resize-none"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
