import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export function CollapseToggle({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="w-full justify-center"
      aria-label={isCollapsed ? "Rozwiń menu" : "Zwiń menu"}
    >
      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  );
}
