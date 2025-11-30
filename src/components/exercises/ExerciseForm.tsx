import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExerciseFormSchema } from "@/lib/validation";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { VimeoPreviewWidget } from "./VimeoPreviewWidget";
import { useParsedDescription } from "@/hooks/exercises/useParsedDescription";
import type { ExerciseFormData, ExerciseFormProps } from "@/interface";

export const ExerciseForm = ({ exercise, onSubmit, onCancel, isSubmitting }: ExerciseFormProps) => {
  const parsedDescription = useParsedDescription(exercise?.description);

  const defaultValues: ExerciseFormData = {
    name: exercise?.name || "",
    vimeoToken: exercise?.vimeoToken || "",
    description: parsedDescription.description,
    tips: parsedDescription.tips,
    tempo: exercise?.tempo || "",
    defaultWeight: exercise?.defaultWeight || null,
  };

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(ExerciseFormSchema),
    defaultValues,
  });

  // Watch vimeo token for preview
  const vimeoToken = form.watch("vimeoToken");

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleFormSubmit = async (data: ExerciseFormData) => {
    await onSubmit(data);
    form.reset(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 mx-auto py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa ćwiczenia</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Przysiad ze sztangą" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vimeoToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Vimeo (ID)</FormLabel>
                  <FormControl>
                    <Input placeholder="np. 123456789" {...field} />
                  </FormControl>
                  <FormDescription>Wprowadź ID wideo z Vimeo. Podgląd pojawi się automatycznie.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domyślny ciężar (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tempo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo (opcjonalne)</FormLabel>
                  <FormControl>
                    <Input placeholder="np. 3-0-1 lub 3010" {...field} />
                  </FormControl>
                  <FormDescription>Format: X-X-X (np. 3-1-3) lub XXXX (np. 2020)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormLabel className="block mb-2">Podgląd wideo</FormLabel>
            <VimeoPreviewWidget videoId={vimeoToken} />
          </div>
        </div>

        <div className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opis ćwiczenia</FormLabel>
                <FormControl>
                  <Textarea placeholder="Opisz główne cele i korzyści..." className="h-24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tips"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wskazówki trenera</FormLabel>
                <FormControl>
                  <Textarea placeholder="Pamiętaj o..." className="h-24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {exercise ? "Zapisz zmiany" : "Utwórz ćwiczenie"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
