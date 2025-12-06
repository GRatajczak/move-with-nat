// src/lib/validation/planFormSchema.ts

import { z } from "zod";

export const planExerciseSchema = z.object({
  exerciseId: z.string().uuid("Nieprawidłowy ID ćwiczenia"),
  sortOrder: z.number().int().min(0),
  sets: z.number().int().min(1, "Min. 1 seria").max(100, "Max. 100 serii"),
  reps: z.number().int().min(1, "Min. 1 powtórzenie").max(1000, "Max. 1000 powtórzeń"),
  tempo: z
    .string()
    .regex(/^\d{4}$|^\d+-\d+-\d+(-\d+)?$/, "Format: XXXX lub X-X-X (np. 3-0-3)")
    .optional()
    .or(z.literal("")),
  defaultWeight: z.number().min(0, "Ciężar nie może być ujemny").nullable().optional(),
  exercise: z.any().optional(), // Denormalized exercise data for UI
});

export const planFormSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć min. 3 znaki").max(100, "Nazwa może mieć max. 100 znaków").trim(),
  description: z.string().max(1000, "Opis może mieć max. 1000 znaków").trim().optional().or(z.literal("")),
  clientId: z.string().uuid("Wybierz podopiecznego"),
  isHidden: z.boolean(),
  exercises: z.array(planExerciseSchema).min(1, "Dodaj przynajmniej jedno ćwiczenie"),
});

// Admin plan form schema with additional trainerId field
// Both clientId and trainerId are optional for admin (can be null in DB)
export const adminPlanFormSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć min. 3 znaki").max(100, "Nazwa może mieć max. 100 znaków").trim(),
  description: z.string().max(1000, "Opis może mieć max. 1000 znaków").trim().optional().or(z.literal("")),
  clientId: z.string().uuid("Nieprawidłowy ID podopiecznego").optional().or(z.literal("")),
  trainerId: z.string().uuid("Nieprawidłowy ID trenera").optional().or(z.literal("")),
  isHidden: z.boolean(),
  exercises: z.array(planExerciseSchema).min(1, "Dodaj przynajmniej jedno ćwiczenie"),
});

export type PlanFormSchema = z.infer<typeof planFormSchema>;
export type AdminPlanFormSchema = z.infer<typeof adminPlanFormSchema>;
export type PlanExerciseSchema = z.infer<typeof planExerciseSchema>;
