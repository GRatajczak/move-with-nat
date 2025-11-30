import type { Database } from "@/types";

/** Create / Update reason **/
export type CreateReasonCommand = Pick<Database["public"]["Tables"]["standard_reasons"]["Insert"], "code" | "label">;
export type UpdateReasonCommand = Partial<CreateReasonCommand> & {
  id: string;
};
