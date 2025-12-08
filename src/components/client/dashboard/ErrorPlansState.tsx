import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * Error state component with retry button
 */
export function ErrorPlansState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Nie udało się załadować planów treningowych. Sprawdź połączenie z internetem i spróbuj ponownie.
        </p>
        <Button onClick={onRetry} variant="outline">
          Spróbuj ponownie
        </Button>
      </CardContent>
    </Card>
  );
}
