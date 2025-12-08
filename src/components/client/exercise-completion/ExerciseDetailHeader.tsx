import type { ExerciseHeaderProps } from "@/interface/exercise-completion";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const ExerciseDetailHeader = ({ name, planId }: ExerciseHeaderProps) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" asChild>
        <a href={`/client/plans/${planId}`}>
          <ChevronLeft className="h-6 w-6" />
        </a>
      </Button>
      <h1 className="text-xl font-bold">{name}</h1>
    </div>
  );
};
