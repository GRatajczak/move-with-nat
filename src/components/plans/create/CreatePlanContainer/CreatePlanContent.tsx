import React, { useState } from "react";
import { CreatePlanHeader } from "./CreatePlanHeader";
import { SuccessModal } from "./SuccessModal";
import { useCreatePlan } from "@/hooks/plans/useCreatePlan";
import { PlanForm } from "../../edit/PlanForm";
import { toast } from "sonner";
import type { PlanFormSchema } from "@/types/plans";
import type { CreatePlanContainerProps } from "@/interface/plans";

export const CreatePlanContent = ({ trainerId, userRole = "trainer" }: CreatePlanContainerProps) => {
  const { mutateAsync: createPlan, isPending } = useCreatePlan();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const baseUrl = `/${userRole}`;

  const handleSubmit = async (data: PlanFormSchema) => {
    try {
      await createPlan({
        name: data.name,
        description: data.description || null,
        clientId: data.clientId,
        trainerId,
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

      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(`Nie udało się utworzyć planu: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    window.location.href = `${baseUrl}/plans`;
  };

  const handleGoBack = () => {
    window.location.href = `${baseUrl}/plans`;
  };

  const breadcrumbs = [
    { label: "Dashboard", href: baseUrl },
    { label: "Plany", href: `${baseUrl}/plans` },
    { label: "Nowy plan", href: `${baseUrl}/plans/new` },
  ];

  return (
    <div className="space-y-6">
      <CreatePlanHeader breadcrumbs={{ items: breadcrumbs }} baseUrl={baseUrl} />
      <PlanForm plan={null} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isPending} mode="create" />
      <SuccessModal open={showSuccessModal} onOpenChange={setShowSuccessModal} onConfirm={handleGoBack} />
    </div>
  );
};
