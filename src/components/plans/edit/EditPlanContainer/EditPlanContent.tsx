import { usePlan } from "@/hooks/plans/usePlan";
import { useUpdatePlan } from "@/hooks/plans/useUpdatePlan";
import { PlanForm } from "../PlanForm";
import type { EditPlanContainerProps } from "@/interface/plans";
import type { PlanFormSchema } from "@/types/plans";
import { EditPlanError } from "./EditPlanError";
import { EditPlanHeader } from "./EditPlanHeader";
import { EditPlanLoading } from "./EditPlanLoading";

export const EditPlanContent = ({ planId, userRole = "trainer" }: EditPlanContainerProps) => {
  const { data: plan, isLoading, error } = usePlan(planId);
  const { mutateAsync: updatePlan, isPending } = useUpdatePlan();
  const baseUrl = `/${userRole}`;

  const handleSubmit = async (data: PlanFormSchema) => {
    await updatePlan({
      planId,
      data: {
        id: planId,
        name: data.name,
        description: data.description || null,
        isHidden: data.isHidden,
        exercises: data.exercises.map((ex) => ({
          id: ex.exerciseId,
          exerciseId: ex.exerciseId,
          sortOrder: ex.sortOrder,
          sets: ex.sets,
          reps: ex.reps,
          tempo: ex.tempo || "3-0-3",
          defaultWeight: ex.defaultWeight || null,
        })),
      },
    });
  };

  const handleCancel = () => {
    window.location.href = `${baseUrl}/plans/${planId}`;
  };

  const breadcrumbs = [
    { label: "Dashboard", href: baseUrl },
    { label: "Plany", href: `${baseUrl}/plans` },
    { label: plan?.name || "...", href: `${baseUrl}/plans/${planId}` },
    { label: "Edycja", href: `${baseUrl}/plans/${planId}/edit` },
  ];

  // Error state
  if (error) {
    return <EditPlanError error={error} baseUrl={baseUrl} />;
  }

  // Loading state
  if (isLoading || !plan) {
    return <EditPlanLoading />;
  }

  return (
    <div className="space-y-6">
      <EditPlanHeader
        breadcrumbs={{ items: breadcrumbs }}
        baseUrl={baseUrl}
        planName={plan?.name || ""}
        planId={planId}
      />

      <PlanForm plan={plan} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isPending} mode="edit" />
    </div>
  );
};
