import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllTrainers } from "@/hooks/useAllUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Select component for choosing a trainer (Admin only)
 * Fetches and displays all trainers in the system
 */
export const TrainerSelect = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const { data: trainers, isLoading, error } = useAllTrainers();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nie udało się załadować listy trenerów. Spróbuj odświeżyć stronę.</AlertDescription>
      </Alert>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Brak trenerów w systemie.</AlertDescription>
      </Alert>
    );
  }

  // Filter only active trainers
  const activeTrainers = trainers.filter((trainer) => trainer.firstName && trainer.lastName && trainer.isActive);

  if (activeTrainers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Brak aktywnych trenerów w systemie.</AlertDescription>
      </Alert>
    );
  }

  const handleValueChange = (selectedValue: string) => {
    // Convert "none" back to empty string for the form
    onChange(selectedValue === "none" ? "" : selectedValue);
  };

  return (
    <Select value={value || "none"} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Wybierz trenera (opcjonalnie)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Brak trenera</SelectItem>
        {activeTrainers.map((trainer) => (
          <SelectItem key={trainer.id} value={trainer.id}>
            <div className="flex flex-col">
              <span>
                {trainer.firstName} {trainer.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{trainer.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
