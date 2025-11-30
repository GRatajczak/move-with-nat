import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseActionMenu } from "./ExerciseActionMenu";
import type { ExercisesTableProps } from "@/interface";

export const ExercisesTable = ({ exercises, isLoading, onRowClick, onEdit, onView, onDelete }: ExercisesTableProps) => {
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

const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-8 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-12 w-20 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 ml-auto rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
