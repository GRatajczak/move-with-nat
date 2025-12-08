import { z } from "zod";
import { CreateUserFormSchema, EditUserFormSchema } from "@/lib/validation";
import type { Database } from "@/db/database.types";

export type EditUserFormData = z.infer<typeof EditUserFormSchema>;

export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;

export type UserRole = Database["public"]["Enums"]["user_role"];
