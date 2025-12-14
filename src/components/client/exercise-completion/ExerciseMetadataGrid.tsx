import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExerciseMetadataGridProps } from "@/interface/exercise-completion";

export const ExerciseMetadataGrid = ({ meta }: ExerciseMetadataGridProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Szczegóły ćwiczenia</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-2 pt-2">
        <div>
          <span className="text-sm text-muted-foreground">Serie</span>
          <p className="font-semibold text-2xl">{meta.sets}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Powtórzenia</span>
          <p className="font-semibold text-2xl">{meta.reps}</p>
        </div>
        {meta.weight !== undefined && meta.weight !== null && (
          <div>
            <span className="text-sm text-muted-foreground">Ciężar (kg)</span>
            <p className="font-semibold text-2xl">{meta.weight}</p>
          </div>
        )}
        {meta.tempo && (
          <div>
            <span className="text-sm text-muted-foreground">Tempo</span>
            <p className="font-semibold  text-2xl">{meta.tempo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
