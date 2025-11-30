// src/lib/validation.ts

import { z } from "zod";

/**
 * Validation schema for GET /api/exercises query parameters
 * Validates pagination and search parameters for listing exercises
 */
export const ListExercisesQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
});

/**
 * Validation schema for GET /api/plans query parameters
 * Validates pagination and filtering parameters for listing plans
 */
export const ListPlansQuerySchema = z.object({
  trainerId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  visible: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
  sortBy: z.enum(["created_at"]).default("created_at"),
});

/**
 * Validation schema for POST /api/users (Create user)
 */
export const CreateUserCommandSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .toLowerCase()
      .transform((val) => val.trim()),
    role: z.enum(["trainer", "client"], {
      errorMap: () => ({ message: "Role must be either 'trainer' or 'client'" }),
    }),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters")
      .transform((val) => val.trim()),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters")
      .transform((val) => val.trim()),
    trainerId: z.string().uuid("Invalid trainer ID format").optional(),
  })
  .refine((data) => data.role !== "client" || !!data.trainerId, {
    message: "trainerId is required when role is 'client'",
    path: ["trainerId"],
  });

/**
 * Validation schema for GET /api/users query parameters
 */
export const ListUsersQuerySchema = z.object({
  role: z.enum(["admin", "trainer", "client"]).optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  trainerId: z.string().uuid("Invalid trainer ID format").optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
});

/**
 * Validation schema for user ID parameter
 */
export const UserIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

/**
 * Validation schema for PUT /api/users/:id (Update user)
 */
export const UpdateUserCommandSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .toLowerCase()
      .transform((val) => val.trim())
      .optional(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters")
      .transform((val) => val.trim())
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters")
      .transform((val) => val.trim())
      .optional(),
    isActive: z.boolean().optional(),
    trainerId: z.string().uuid("Invalid trainer ID format").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Parses query parameters from URL
 * Converts URLSearchParams to a plain object for Zod validation
 */
export function parseQueryParams(url: URL): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};

  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

/**
 * Validation schema for POST /api/plans/:planId/exercises (Add exercise to plan)
 */
export const AddPlanExerciseCommandSchema = z.object({
  exerciseId: z.string().uuid("Invalid exercise ID format"),
  sortOrder: z.number().int().min(1, "Sort order must be at least 1"),
  sets: z.number().int().min(1, "Sets must be at least 1").optional(),
  reps: z.number().int().min(1, "Reps must be at least 1").optional(),
  tempo: z
    .string()
    .regex(/^\d{4}$|^\d+-\d+-\d+$/, "Tempo must be in format XXXX or X-X-X")
    .default("3-0-3"),
  defaultWeight: z.number().min(0, "Weight must be non-negative").optional().nullable(),
});

/**
 * Validation schema for PATCH /api/plans/:planId/exercises/:exerciseId (Update exercise in plan)
 */
export const UpdatePlanExerciseCommandSchema = z
  .object({
    sortOrder: z.number().int().min(1, "Sort order must be at least 1").optional(),
    sets: z.number().int().min(1, "Sets must be at least 1").optional(),
    reps: z.number().int().min(1, "Reps must be at least 1").optional(),
    tempo: z
      .string()
      .regex(/^\d{4}$|^\d+-\d+-\d+$/, "Tempo must be in format XXXX or X-X-X")
      .optional(),
    defaultWeight: z.number().min(0, "Weight must be non-negative").optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Validation schema for POST /api/plans/:planId/exercises/:exerciseId/completion (Mark completion)
 */
export const MarkCompletionCommandSchema = z
  .object({
    completed: z.boolean(),
    reasonId: z.string().uuid("Invalid reason ID format").optional(),
    customReason: z.string().max(500, "Custom reason too long").optional(),
  })
  .refine(
    (data) => {
      // If not completed, require reason
      if (!data.completed && !data.reasonId && !data.customReason) {
        return false;
      }
      return true;
    },
    {
      message: "Either reasonId or customReason is required when not completed",
    }
  );

/**
 * Validation schema for POST /api/reasons (Create reason)
 */
export const CreateReasonCommandSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
    .transform((val) => val.toLowerCase()),
  label: z
    .string()
    .min(3, "Label must be at least 3 characters")
    .max(200, "Label must be at most 200 characters")
    .transform((val) => val.trim()),
});

/**
 * Validation schema for PUT /api/reasons/:id (Update reason)
 */
export const UpdateReasonCommandSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(50, "Code must be at most 50 characters")
      .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
      .transform((val) => val.toLowerCase())
      .optional(),
    label: z
      .string()
      .min(3, "Label must be at least 3 characters")
      .max(200, "Label must be at most 200 characters")
      .transform((val) => val.trim())
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Validation schema for POST /api/auth/invite (Send invitation/activation email)
 */
export const InviteUserCommandSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .transform((val) => val.trim()),
  role: z.enum(["trainer", "client"], {
    errorMap: () => ({ message: "Role must be either 'trainer' or 'client'" }),
  }),
  resend: z.boolean().default(false),
});

/**
 * Validation schema for POST /api/auth/activate (Activate account)
 */
export const ActivateAccountCommandSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * Validation schema for POST /api/auth/reset-password/request (Request password reset)
 */
export const RequestPasswordResetCommandSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .transform((val) => val.trim()),
});

/**
 * Validation schema for POST /api/auth/reset-password/confirm (Confirm password reset)
 */
export const ConfirmPasswordResetCommandSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((pwd) => /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd), {
      message: "Password must contain uppercase, lowercase, number, and special character",
    }),
});

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validation schema for Exercise Form
 */
export const ExerciseFormSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć minimum 3 znaki").max(100, "Nazwa może mieć maksymalnie 100 znaków").trim(),

  vimeoToken: z.string().min(1, "Link Vimeo jest wymagany").max(50, "Link Vimeo jest zbyt długi").trim(),

  description: z.string().max(2000, "Opis może mieć maksymalnie 2000 znaków").trim(),

  tips: z.string().max(1000, "Wskazówki mogą mieć maksymalnie 1000 znaków").trim(),

  tempo: z
    .string()
    .regex(/^(\d{4}|\d+-\d+-\d+)$/, "Tempo powinno być w formacie X-X-X (np. 3-1-3) lub XXXX (np. 2020)")
    .or(z.literal("")),

  defaultWeight: z.number().min(0, "Ciężar musi być liczbą dodatnią").nullable(),
});
