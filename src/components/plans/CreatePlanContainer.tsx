import React, { useState } from "react";
import { useCreatePlan } from "@/hooks/plans/useCreatePlan";
import { PlanForm } from "./PlanForm";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanFormSchema } from "@/types/plans";
import type { CreatePlanContainerProps } from "@/interface/plans";
import { Breadcrumbs } from "../navigation/Breadcrumbs";
import { QueryProvider } from "../QueryProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CreatePlanContent = ({ trainerId, userRole = "trainer" }: CreatePlanContainerProps) => {
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

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="mb-2">Plan utworzony</DialogTitle>
                <DialogDescription>Nowy plan treningowy został pomyślnie utworzony.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button className="ml-auto w-full sm:w-auto" onClick={handleGoBack}>
              Wróć do listy planów
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
