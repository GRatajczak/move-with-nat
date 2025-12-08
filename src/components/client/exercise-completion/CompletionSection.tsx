import React, { useState } from "react";
import type { CompletionButtonsProps, ReasonFormValues } from "@/interface/exercise-completion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { NotCompletedReasonModal } from "./NotCompletedReasonModal";
import { useReasonsList } from "@/hooks/useReasonsList";

export const CompletionSection = ({ currentStatus, onUpdate, isUpdating }: CompletionButtonsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { reasons } = useReasonsList();

  const handleCompleted = () => {
    onUpdate({ completed: true });
  };

  const handleNotCompletedClick = () => {
    setIsModalOpen(true);
  };

  const handleModalConfirm = (values: ReasonFormValues) => {
    onUpdate({ completed: false, ...values });
    setIsModalOpen(false);
  };

  const isCompleted = currentStatus?.completed === true;
  const isFailed = currentStatus?.completed === false;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-4 md:relative md:bg-transparent md:border-0 md:p-0">
        <Button
          variant={isFailed ? "default" : "outline"}
          className={`flex-1 ${isFailed ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
          size="lg"
          onClick={handleNotCompletedClick}
          disabled={isUpdating}
        >
          <X className="mr-2 h-4 w-4" />
          {isFailed ? "Nie wykonano" : "Nie wykonano"}
        </Button>
        <Button
          variant={isCompleted ? "default" : "default"}
          className={`flex-1 ${isCompleted ? "bg-green-600 hover:bg-green-700" : ""}`}
          size="lg"
          onClick={handleCompleted}
          disabled={isUpdating}
        >
          <Check className="mr-2 h-4 w-4" />
          {isCompleted ? "Wykonane" : "Wykonane"}
        </Button>
      </div>

      <NotCompletedReasonModal
        isOpen={isModalOpen}
        reasons={reasons}
        onConfirm={handleModalConfirm}
        onClose={() => setIsModalOpen(false)}
        isSubmitting={isUpdating}
      />
    </>
  );
};
