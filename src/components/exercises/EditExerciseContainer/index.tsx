import { QueryProvider } from "../../QueryProvider";
import { EditExerciseContent } from "./EditExerciseContent";

export const EditExerciseContainer = (props: { id: string }) => {
  return (
    <QueryProvider>
      <EditExerciseContent {...props} />
    </QueryProvider>
  );
};
