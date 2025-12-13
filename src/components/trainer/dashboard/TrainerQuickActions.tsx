import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export const TrainerQuickActions = () => {
  return (
    <div className="flex gap-4 mb-6 flex-col md:flex-row">
      <Button asChild>
        <a href="/trainer/clients/new">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj Podopiecznego
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href="/trainer/plans/new">
          <Users className="mr-2 h-4 w-4" />
          Stwórz plan treningowy
        </a>
      </Button>
    </div>
  );
};
