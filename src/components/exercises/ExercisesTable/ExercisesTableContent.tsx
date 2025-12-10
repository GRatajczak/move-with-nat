import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExerciseActionMenu } from "../ExerciseActionMenu";
import type { ExercisesTableProps } from "@/interface";
import TableSkeleton from "./TableSkeleton";

export const ExercisesTableContent = ({
  exercises,
  isLoading,
  onRowClick,
  onEdit,
  onView,
  onDelete,
}: ExercisesTableProps) => {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
        <p className="text-muted-foreground">Brak ćwiczeń w bibliotece</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thumbnail</TableHead>
            <TableHead>Nazwa</TableHead>
            <TableHead>Domyślny ciężar</TableHead>
            <TableHead>Utworzono</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Użycie</TableHead>
            <TableHead>Widoczność</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((exercise) => (
            <TableRow
              key={exercise.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(exercise)}
            >
              <TableCell>
                <img
                  src={`https://vumbnail.com/${exercise.vimeoToken}.jpg`}
                  alt={exercise.name}
                  className="w-20 h-10 object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{exercise.name}</TableCell>
              <TableCell>{exercise.defaultWeight ? `${exercise.defaultWeight} kg` : "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(exercise.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>{exercise.tempo || "Nie określono"}</TableCell>
              <TableCell>{exercise.usageCount ? `${exercise.usageCount} planów` : "0 planów"}</TableCell>
              <TableCell>{exercise.isHidden ? "Ukryte" : "Widoczne"}</TableCell>
              <TableCell className="text-right">
                <ExerciseActionMenu
                  exerciseId={exercise.id}
                  onEdit={() => onEdit(exercise.id)}
                  onView={() => onView(exercise.id)}
                  onDelete={() => onDelete(exercise)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
