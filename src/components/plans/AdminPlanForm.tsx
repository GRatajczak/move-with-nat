import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Plus } from "lucide-react";
import { adminPlanFormSchema } from "@/lib/validation";
import type { AdminPlanFormSchema } from "@/types/plans";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { PlanExercisesList } from "./PlanExercisesList";
import { AddExerciseModal } from "./AddExerciseModal";
import { AdminClientSelect } from "./AdminClientSelect";
import { TrainerSelect } from "./TrainerSelect";
import type { PlanExerciseFormData, AdminPlanFormProps } from "@/interface/plans";
import type { ExerciseDto } from "@/interface/exercises";

/**
 * Admin version of PlanForm with trainerId selection
 * Allows admin to select both trainer and client when creating/editing plans
 */
export const AdminPlanForm = ({ plan, onSubmit, onCancel, isSubmitting, mode }: AdminPlanFormProps) => {
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<PlanExerciseFormData[]>(
    plan?.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sortOrder: ex.sortOrder,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo || "3-0-3",
      defaultWeight: ex.defaultWeight || null,
      exercise: ex.exercise, // Preserve exercise details from plan
    })) || []
  );

  const form = useForm<AdminPlanFormSchema>({
    resolver: zodResolver(adminPlanFormSchema),
    defaultValues: {
      name: plan?.name || "",
      description: plan?.description || "",
      clientId: plan?.clientId || "",
      trainerId: plan?.trainerId || "", // NEW: trainerId field for admin
      isHidden: plan?.isHidden ?? false,
      exercises: selectedExercises,
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  // Update exercises in form when selectedExercises changes
  useEffect(() => {
    form.setValue("exercises", selectedExercises, { shouldValidate: true });
  }, [selectedExercises, form]);

  const handleAddExercises = (exercises: ExerciseDto[]) => {
    const newExercises: PlanExerciseFormData[] = exercises.map((ex, index) => ({
      exerciseId: ex.id,
      sortOrder: selectedExercises.length + index + 1,
      sets: 3,
      reps: 10,
      tempo: "3-0-3",
      defaultWeight: ex.defaultWeight || null,
      exercise: ex,
    }));

    setSelectedExercises([...selectedExercises, ...newExercises]);
    setIsAddExerciseModalOpen(false);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = selectedExercises.filter((_, i) => i !== index);
    // Update sort order
    const reordered = updated.map((ex, i) => ({ ...ex, sortOrder: i + 1 }));
    setSelectedExercises(reordered);
  };

  const handleUpdateExercise = (index: number, updates: Partial<PlanExerciseFormData>) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], ...updates };
    setSelectedExercises(updated);
  };

  const handleReorderExercises = (reordered: PlanExerciseFormData[]) => {
    // Update sort order
    const updated = reordered.map((ex, i) => ({ ...ex, sortOrder: i + 1 }));
    setSelectedExercises(updated);
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz opuścić?")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleSubmit = async (data: AdminPlanFormSchema) => {
    await onSubmit(data);
    form.reset(data);
  };

  const characterCount = form.watch("description")?.length || 0;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Warning for visible plans in edit mode */}
          {mode === "edit" && !form.watch("isHidden") && (
            <Alert variant="default" className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                ⚠️ Ten plan jest widoczny dla podopiecznego. Zmiany będą od razu widoczne.
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe informacje</CardTitle>
              <CardDescription>Nazwa planu jest wymagana. Trener i podopieczny są opcjonalni.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa planu *</FormLabel>
                    <FormControl>
                      <Input placeholder="np. Plan treningowy - Tydzień 1" {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Dodaj opis lub instrukcje dla podopiecznego..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormDescription>
                      <span className={characterCount > 900 ? "text-yellow-600" : ""}>
                        {characterCount} / 1000 znaków
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Trainer Select (Admin only) */}
              <FormField
                control={form.control}
                name="trainerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trener (opcjonalnie)</FormLabel>
                    <FormControl>
                      <TrainerSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        disabled={false} // Admin can change trainer even in edit mode
                      />
                    </FormControl>
                    <FormDescription>
                      Pozostaw puste, jeśli plan nie jest przypisany do konkretnego trenera
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Select (Admin) */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Podopieczny (opcjonalnie)</FormLabel>
                    <FormControl>
                      <AdminClientSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        disabled={false} // Admin can change client even in edit mode
                      />
                    </FormControl>
                    <FormDescription>
                      Pozostaw puste, jeśli plan nie jest przypisany do konkretnego podopiecznego
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visibility toggle */}
              <FormField
                control={form.control}
                name="isHidden"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Widoczność dla podopiecznego</FormLabel>
                      <FormDescription>
                        {field.value ? "Plan jest ukryty" : "Plan jest widoczny dla podopiecznego"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={!field.value} onCheckedChange={(checked) => field.onChange(!checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Exercises Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ćwiczenia</CardTitle>
                  <CardDescription>Dodaj ćwiczenia i określ ich parametry</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsAddExerciseModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj ćwiczenie
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedExercises.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
                  <p className="text-muted-foreground">Brak ćwiczeń</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Kliknij &quot;Dodaj ćwiczenie&quot;, aby rozpocząć
                  </p>
                </div>
              ) : (
                <PlanExercisesList
                  exercises={selectedExercises}
                  onRemove={handleRemoveExercise}
                  onUpdate={handleUpdateExercise}
                  onReorder={handleReorderExercises}
                  disabled={isSubmitting}
                />
              )}
              {form.formState.errors.exercises && (
                <p className="text-sm text-destructive mt-2">{form.formState.errors.exercises.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onConfirm={handleAddExercises}
        excludeExerciseIds={selectedExercises.map((ex) => ex.exerciseId)}
      />
    </>
  );
};
