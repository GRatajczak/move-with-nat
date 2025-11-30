import type { Database } from "./db";
import type { CreatePlanCommand, PlanExerciseDto } from "../interface/plans";

export type IsHidden = Database["public"]["Tables"]["plans"]["Insert"]["is_hidden"];

/** Update plan **/
export type UpdatePlanCommand = Partial<Omit<CreatePlanCommand, "exercises">> & {
  id: string;
  exercises?: PlanExerciseDto[];
};
