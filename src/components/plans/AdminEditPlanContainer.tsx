import { usePlan } from "@/hooks/plans/usePlan";
import { useUpdatePlan } from "@/hooks/plans/useUpdatePlan";
import { AdminPlanForm } from "./AdminPlanForm";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "../navigation/Breadcrumbs";
import type { AdminPlanFormSchema } from "@/lib/validation";
import { QueryProvider } from "../QueryProvider";

const AdminEditPlanContent = ({ planId, userRole = "admin" }: { planId: string; userRole?: "admin" }) => {
  const { data: plan, isLoading, error } = usePlan(planId);
  const { mutateAsync: updatePlan, isPending } = useUpdatePlan();
  const baseUrl = `/${userRole}`;

  const handleSubmit = async (data: AdminPlanFormSchema) => {
    await updatePlan({
      planId,
      data: {
        id: planId,
        name: data.name,
        description: data.description || null,
        trainerId: data.trainerId || null, // Admin can change trainer (or set to null)
        clientId: data.clientId || null, // Admin can change client (or set to null)
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
    return (
      <div className="p-4">
        <Toaster />
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive font-medium">Wystąpił błąd podczas ładowania planu</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Nieznany błąd"}
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
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-3xl font-bold tracking-tight">Edycja planu: {plan.name}</h1>
          <p className="text-muted-foreground">Edytuj plan treningowy (możesz zmienić trenera i podopiecznego)</p>
        </div>
        <Button
          variant="outline"
          onClick={() => (window.location.href = `${baseUrl}/plans/${planId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do planu
        </Button>
      </div>

      {/* Form */}
      <AdminPlanForm plan={plan} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isPending} mode="edit" />
    </div>
  );
};

export const AdminEditPlanContainer = ({ planId, userRole = "admin" }: { planId: string; userRole?: "admin" }) => {
  return (
    <QueryProvider>
      <AdminEditPlanContent planId={planId} userRole={userRole} />
    </QueryProvider>
  );
};
