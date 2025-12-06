import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExerciseCompletionRecord } from "@/interface/plans";

export const ProgressSection = ({
  totalExercises,
  completionRecords,
}: {
  totalExercises: number;
  completionRecords: ExerciseCompletionRecord[];
}) => {
  const completedCount = completionRecords.filter((record) => record.isCompleted).length;
  const percentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Postęp wykonania</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ukończone ćwiczenia</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Postęp wykonania: ${percentage}%`}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6 pb-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {completedCount}/{totalExercises}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Ćwiczeń wykonanych</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6 pb-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{percentage}%</p>
                <p className="text-sm text-muted-foreground mt-1">Ukończone</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
