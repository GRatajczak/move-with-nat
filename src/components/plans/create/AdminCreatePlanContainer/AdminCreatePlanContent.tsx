import { useCreatePlan } from "@/hooks/plans/useCreatePlan";
import { AdminPlanForm } from "../../edit/AdminPlanForm";
import { toast } from "sonner";
import type { AdminPlanFormSchema } from "@/types/plans";
import { AdminCreatePlanHeader } from "./AdminCreatePlanHeader"; // ... other imports // ... component definition

export const AdminCreatePlanContent = ({ userRole = "admin" }: { userRole: "admin" }) => {
  const { mutateAsync: createPlan, isPending } = useCreatePlan();
  const baseUrl = `/${userRole}`;

  const handleSubmit = async (data: AdminPlanFormSchema) => {
    try {
      const newPlan = await createPlan({
        name: data.name,
        description: data.description || null,
        clientId: data.clientId || null, // Optional - can be null in DB
        trainerId: data.trainerId || null, // Optional - can be null in DB
        isHidden: data.isHidden,
        exercises: data.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sortOrder: ex.sortOrder,
          sets: ex.sets,
          reps: ex.reps,
          tempo: ex.tempo || "3-0-3",
          defaultWeight: ex.defaultWeight || null,
        })),
      });

      toast.success("Plan utworzony pomyślnie");
      // Navigate to plan detail page
      window.location.href = `${baseUrl}/plans/${newPlan.id}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(`Nie udało się utworzyć planu: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    window.location.href = `${baseUrl}/plans`;
  };

  const breadcrumbs = [
    { label: "Dashboard", href: baseUrl },
    { label: "Plany", href: `${baseUrl}/plans` },
    { label: "Nowy plan", href: `${baseUrl}/plans/new` },
  ];

  return (
    <div className="space-y-6">
      <AdminCreatePlanHeader breadcrumbs={{ items: breadcrumbs }} baseUrl={baseUrl} />
      <AdminPlanForm
        plan={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isPending}
        mode="create"
      />
    </div>
  );
};
