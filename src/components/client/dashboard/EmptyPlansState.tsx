import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

/**
 * Empty state component when no plans are available
 */
export function EmptyPlansState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileQuestion className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Brak planów treningowych</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Nie masz jeszcze przypisanych planów treningowych. Skontaktuj się ze swoim trenerem, aby otrzymać pierwszy
          plan.
        </p>
      </CardContent>
    </Card>
  );
}
