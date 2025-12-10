import { QueryProvider } from "../../QueryProvider";
import { ExerciseDetailContent } from "./ExerciseDetailContent";

export const ExerciseDetailContainer = (props: { id: string }) => {
  return (
    <QueryProvider>
      <ExerciseDetailContent {...props} />
    </QueryProvider>
  );
};
