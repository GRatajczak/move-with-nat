import { QueryProvider } from "../../QueryProvider";
import { CreateExerciseContent } from "./CreateExerciseContent";

export const CreateExerciseContainer = () => {
  return (
    <QueryProvider>
      <CreateExerciseContent />
    </QueryProvider>
  );
};
