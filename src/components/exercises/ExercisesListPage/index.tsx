import { QueryProvider } from "../../QueryProvider";
import { ExercisesListContent } from "./ExercisesListPageContent";

export const ExercisesListPage = () => {
  return (
    <QueryProvider>
      <ExercisesListContent />
    </QueryProvider>
  );
};
