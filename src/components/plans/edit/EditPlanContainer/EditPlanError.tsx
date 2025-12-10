import { Button } from "@/components/ui/button";

export const EditPlanError = ({ error, baseUrl }: { error: unknown; baseUrl: string }) => {
  return (
    <div className="p-4">
      <div className="rounded-md border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive font-medium">Wystąpił błąd podczas ładowania planu</p>
        <p className="text-sm text-muted-foreground mt-1">{error instanceof Error ? error.message : "Nieznany błąd"}</p>
        <Button variant="outline" onClick={() => (window.location.href = `${baseUrl}/plans`)} className="mt-4">
          Powrót do listy planów
        </Button>
      </div>
    </div>
  );
};
