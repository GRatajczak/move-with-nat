import type { ErrorDisplayProps } from "@/interface";

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
      <p>Wystąpił błąd podczas ładowania użytkowników: {error instanceof Error ? error.message : "Nieznany błąd"}</p>
    </div>
  );
};
