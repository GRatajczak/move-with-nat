import React from "react";
import { useCreatePlan } from "@/hooks/plans/useCreatePlan";
import { PlanForm } from "./PlanForm";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { PlanFormSchema } from "@/lib/validation/planFormSchema";
import type { CreatePlanContainerProps } from "@/interface/plans";
import { Breadcrumbs } from "../navigation/Breadcrumbs";
import { QueryProvider } from "../QueryProvider";

const CreatePlanContent: React.FC<CreatePlanContainerProps> = ({ trainerId, userRole = "trainer" }) => {
  const { mutateAsync: createPlan, isPending } = useCreatePlan();
  const baseUrl = `/${userRole}`;

  const handleSubmit = async (data: PlanFormSchema) => {
    try {
      const newPlan = await createPlan({
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
      <Toaster />

      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-3xl font-bold tracking-tight">Nowy plan treningowy</h1>
          <p className="text-muted-foreground">Stwórz nowy plan treningowy dla swojego podopiecznego</p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = `${baseUrl}/plans`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Button>
      </div>

      {/* Form */}
      <PlanForm plan={null} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isPending} mode="create" />
    </div>
  );
};

export const CreatePlanContainer: React.FC<CreatePlanContainerProps> = ({ trainerId, userRole = "trainer" }) => {
  return (
    <QueryProvider>
      <CreatePlanContent trainerId={trainerId} userRole={userRole} />
    </QueryProvider>
  );
};
