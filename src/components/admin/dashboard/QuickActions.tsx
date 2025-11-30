import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const QuickActions = () => {
  return (
    <div className="flex gap-4 mb-6  flex-col md:flex-row">
      <Button asChild>
        <a href="/admin/users/new">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj Użytkownika
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href="/admin/exercises/new">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj Ćwiczenie
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href="/admin/reasons">
          <Plus className="mr-2 h-4 w-4" />
          Zarządzaj Powodami
        </a>
      </Button>
    </div>
  );
};
