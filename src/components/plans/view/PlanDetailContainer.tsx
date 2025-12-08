import React, { useState } from "react";
import { usePlan } from "@/hooks/plans/usePlan";
import { usePlanCompletion } from "@/hooks/plans/usePlanCompletion";
import { useTogglePlanVisibility } from "@/hooks/plans/useTogglePlanVisibility";
import { useDeletePlan } from "@/hooks/plans/useDeletePlan";
import { useDuplicatePlan } from "@/hooks/plans/useDuplicatePlan";
import { PlanDetailHeader } from "./PlanDetailHeader";
import { PlanDescriptionSection } from "./PlanDescriptionSection";
import { ProgressSection } from "./ProgressSection";
import { PlanExercisesDetailList } from "./PlanExercisesDetailList";
import { DeletePlanConfirmationModal } from "../edit/DeletePlanConfirmationModal";
import { DuplicatePlanModal } from "../edit/DuplicatePlanModal";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "../../navigation/Breadcrumbs";
import type { PlanDetailContainerProps, PlanViewModel, DuplicatePlanData } from "@/interface/plans";
import { QueryProvider } from "../../QueryProvider";

const PlanDetailContent = ({ planId, userRole = "trainer" }: PlanDetailContainerProps) => {
  const { data: plan, isLoading: isPlanLoading, error: planError } = usePlan(planId);
  const { data: completionData, isLoading: isCompletionLoading } = usePlanCompletion(planId);
  const { mutateAsync: toggleVisibility } = useTogglePlanVisibility();
  const { mutateAsync: deletePlan, isPending: isDeleting } = useDeletePlan();
  const { mutateAsync: duplicatePlan, isPending: isDuplicating } = useDuplicatePlan();

  const [deleteModalPlan, setDeleteModalPlan] = useState<PlanViewModel | null>(null);
  const [duplicateModalPlan, setDuplicateModalPlan] = useState<PlanViewModel | null>(null);

  const isLoading = isPlanLoading || isCompletionLoading;
  const completionRecords = completionData?.completionRecords || [];
  const baseUrl = `/${userRole}`;

  const handleEdit = () => {
    window.location.href = `${baseUrl}/plans/${planId}/edit`;
  };

  const handleToggleVisibility = async () => {
    if (!plan) return;

    await toggleVisibility({ planId, isHidden: !plan.isHidden });
  };

  const handleDuplicate = (plan: PlanViewModel) => {
    setDuplicateModalPlan(plan);
  };

  const handleConfirmDuplicate = async (data: DuplicatePlanData) => {
    if (!duplicateModalPlan) return;

    try {
      const newPlan = await duplicatePlan({ planId: duplicateModalPlan.id, data });
      setDuplicateModalPlan(null);
      toast.success("Plan zduplikowany");
      window.location.href = `/trainer/plans/${newPlan.id}/edit`;
    } catch {
      toast.error("Nie udało się zduplikować planu");
    }
  };

  const handleDelete = (plan: PlanViewModel) => {
    setDeleteModalPlan(plan);
  };

  const handleConfirmDelete = async (planId: string, hard: boolean) => {
    try {
      await deletePlan({ planId, hard });
      setDeleteModalPlan(null);
      toast.success("Plan usunięty");
      window.location.href = "/trainer/plans";
    } catch {
      toast.error("Nie udało się usunąć planu");
    }
  };

  const breadcrumbs = [
    { label: "Dashboard", href: baseUrl },
    { label: "Plany", href: `${baseUrl}/plans` },
    { label: plan?.name || "...", href: `${baseUrl}/plans/${planId}` },
  ];

  // Error state
  if (planError) {
    return (
      <div className="p-4">
        <Toaster />
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive font-medium">Wystąpił błąd podczas ładowania planu</p>
          <p className="text-sm text-muted-foreground mt-1">
            {planError instanceof Error ? planError.message : "Nieznany błąd"}
          </p>
          <Button variant="outline" onClick={() => (window.location.href = `${baseUrl}/plans`)} className="mt-4">
            Powrót do listy planów
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !plan) {
    return (
      <div className="space-y-6">
        <Toaster />
        <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
          <div className="flex flex-col space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Back button and breadcrumbs */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <Breadcrumbs items={breadcrumbs} />
        <Button variant="outline" onClick={() => (window.location.href = `${baseUrl}/plans`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Lista planów
        </Button>
      </div>

      {/* Header with title, status, client info, and actions */}
      <PlanDetailHeader
        plan={plan}
        onEdit={handleEdit}
        onToggleVisibility={handleToggleVisibility}
        onDuplicate={() => handleDuplicate(plan)}
        onDelete={() => handleDelete(plan)}
      />

      {/* Description */}
      <PlanDescriptionSection description={plan.description} />

      {/* Progress Section */}
      <ProgressSection totalExercises={plan.exercises.length} completionRecords={completionRecords} />

      {/* Exercises List */}
      <PlanExercisesDetailList exercises={plan.exercises} completionRecords={completionRecords} />

      {/* Modals */}
      <DeletePlanConfirmationModal
        isOpen={!!deleteModalPlan}
        plan={deleteModalPlan}
        onClose={() => setDeleteModalPlan(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <DuplicatePlanModal
        isOpen={!!duplicateModalPlan}
        plan={duplicateModalPlan}
        onClose={() => setDuplicateModalPlan(null)}
        onConfirm={handleConfirmDuplicate}
        isSubmitting={isDuplicating}
      />
    </div>
  );
};

export const PlanDetailContainer: React.FC<PlanDetailContainerProps> = ({ planId, userRole = "trainer" }) => {
  return (
    <QueryProvider>
      <PlanDetailContent planId={planId} userRole={userRole} />
    </QueryProvider>
  );
};
