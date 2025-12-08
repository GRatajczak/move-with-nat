import type { ExerciseMetadataGridProps } from "@/interface/exercise-completion";

export const ExerciseMetadataGrid = ({ meta }: ExerciseMetadataGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6 bg-secondary/20  rounded-lg">
      <div>
        <span className="text-sm text-muted-foreground">Serie</span>
        <p className="font-semibold">{meta.sets}</p>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">Powtórzenia</span>
        <p className="font-semibold">{meta.reps}</p>
      </div>
      {meta.weight !== undefined && meta.weight !== null && (
        <div>
          <span className="text-sm text-muted-foreground">Ciężar (kg)</span>
          <p className="font-semibold">{meta.weight}</p>
        </div>
      )}
      {meta.tempo && (
        <div>
          <span className="text-sm text-muted-foreground">Tempo</span>
          <p className="font-semibold font-mono">{meta.tempo}</p>
        </div>
      )}
    </div>
  );
};
