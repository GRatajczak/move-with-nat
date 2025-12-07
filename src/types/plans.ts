import type { Database } from "./db";
import type { CreatePlanCommand, PlanExerciseDto } from "../interface/plans";
import type { adminPlanFormSchema, planExerciseSchema, planFormSchema } from "../lib/validation";
import { z } from "zod";

export type IsHidden = Database["public"]["Tables"]["plans"]["Insert"]["is_hidden"];

/** Update plan **/
export type UpdatePlanCommand = Partial<Omit<CreatePlanCommand, "exercises">> & {
  id: string;
  exercises?: PlanExerciseDto[];
};
export type PlanFormSchema = z.infer<typeof planFormSchema>;
export type AdminPlanFormSchema = z.infer<typeof adminPlanFormSchema>;
export type PlanExerciseSchema = z.infer<typeof planExerciseSchema>;
