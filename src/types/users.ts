import { z } from "zod";
import { CreateUserFormSchema, EditUserFormSchema } from "@/lib/validation/userSchema";

export type EditUserFormData = z.infer<typeof EditUserFormSchema>;

export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;
