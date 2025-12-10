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
  visible: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (val === "true" || val === "1") return true;
      if (val === "false" || val === "0") return false;
      return undefined;
    })
    .optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
  sortBy: z.enum(["created_at"]).default("created_at"),
  includeExerciseDetails: z.coerce.boolean().optional(),
});

/**
 * Validation schema for POST /api/users (Create user)
 */
export const CreateUserCommandSchema = z
  .object({
    email: z
      .string()
      .transform((val) => val.trim())
      .pipe(z.string().email("Invalid email format").toLowerCase()),
    role: z.enum(["admin", "trainer", "client"], {
      errorMap: () => ({ message: "Role must be either 'admin', 'trainer' or 'client'" }),
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
    phone: z
      .union([
        z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format"),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .nullable(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => new Date(date) <= new Date(), "Date of birth cannot be in the future")
      .optional()
      .nullable(),
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
  search: z
    .string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
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
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format")
      .optional()
      .nullable(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => new Date(date) <= new Date(), "Date of birth cannot be in the future")
      .optional()
      .nullable(),
    status: z.enum(["pending", "active", "suspended"]).optional(),
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
    .regex(/^(\d{4}|\d+-\d+-\d+(-\d+)?)$/, "Tempo must be in Format XXXX or X-X-X-X")
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
      .regex(/^(\d{4}|\d+-\d+-\d+(-\d+)?)$/, "Tempo must be in Format XXXX or X-X-X-X")
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

export const planExerciseSchema = z.object({
  exerciseId: z.string().uuid("Nieprawidłowy ID ćwiczenia"),
  sortOrder: z.number().int().min(0),
  sets: z.number().int().min(1, "Min. 1 seria").max(100, "Max. 100 serii"),
  reps: z.number().int().min(1, "Min. 1 powtórzenie").max(1000, "Max. 1000 powtórzeń"),
  tempo: z
    .string()
    .regex(/^(\d{4}|\d+-\d+-\d+(-\d+)?)$/, "Tempo must be in Format XXXX or X-X-X-X")
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

/**
 * Schema walidacji dla formularza edycji profilu
 * Zawiera podstawowe pola: email, imię, nazwisko, telefon i data urodzenia
 */
export const ProfileEditFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email").trim().toLowerCase(),
  firstName: z
    .string()
    .min(1, "Imię jest wymagane")
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(50, "Imię może mieć maksymalnie 50 znaków")
    .trim(),
  lastName: z
    .string()
    .min(1, "Nazwisko jest wymagane")
    .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
    .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Nieprawidłowy format numeru telefonu")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD")
    .refine((date) => !date || new Date(date) <= new Date(), "Data urodzenia nie może być w przyszłości")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema walidacji dla formularza zmiany hasła
 * Zawiera walidację siły hasła oraz potwierdzenia
 */
export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
    newPassword: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
      .regex(/[^A-Za-z0-9]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi być różne od obecnego",
    path: ["newPassword"],
  });

/**
 * Schema walidacji dla formularza tworzenia użytkownika
 */
export const CreateUserFormSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email").trim().toLowerCase(),
    role: z.enum(["administrator", "trainer", "client"], {
      required_error: "Rola jest wymagana",
      invalid_type_error: "Nieprawidłowa rola",
    }),
    firstName: z
      .string()
      .min(1, "Imię jest wymagane")
      .min(2, "Imię musi mieć co najmniej 2 znaki")
      .max(50, "Imię może mieć maksymalnie 50 znaków")
      .trim(),
    lastName: z
      .string()
      .min(1, "Nazwisko jest wymagane")
      .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
      .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
      .trim(),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Nieprawidłowy format numeru telefonu")
      .optional()
      .or(z.literal("")),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD")
      .refine((date) => !date || new Date(date) <= new Date(), "Data urodzenia nie może być w przyszłości")
      .optional()
      .or(z.literal("")),
    trainerId: z.string().uuid("Nieprawidłowy identyfikator trenera").optional(),
  })
  .refine((data) => data.role !== "client" || !!data.trainerId, {
    message: "Trener jest wymagany dla podopiecznego",
    path: ["trainerId"],
  });

/**
 * Schema walidacji dla formularza edycji użytkownika (administrator)
 */
export const EditUserFormSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email").trim().toLowerCase(),
    firstName: z
      .string()
      .min(1, "Imię jest wymagane")
      .min(2, "Imię musi mieć co najmniej 2 znaki")
      .max(50, "Imię może mieć maksymalnie 50 znaków")
      .trim(),
    lastName: z
      .string()
      .min(1, "Nazwisko jest wymagane")
      .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
      .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
      .trim(),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Nieprawidłowy format numeru telefonu")
      .optional()
      .or(z.literal("")),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD")
      .refine((date) => !date || new Date(date) <= new Date(), "Data urodzenia nie może być w przyszłości")
      .optional()
      .or(z.literal("")),
    role: z.enum(["administrator", "trainer", "client"], {
      required_error: "Rola jest wymagana",
      invalid_type_error: "Nieprawidłowa rola",
    }),
    status: z.enum(["pending", "active", "suspended"], {
      required_error: "Status jest wymagany",
      invalid_type_error: "Nieprawidłowy status",
    }),
    trainerId: z.string().uuid("Nieprawidłowy identyfikator trenera").nullable().optional(),
  })
  .refine((data) => data.role !== "client" || !!data.trainerId, {
    message: "Trener jest wymagany dla podopiecznego",
    path: ["trainerId"],
  });

/**
 * Validation schema for GET /api/trainer/clients query parameters
 */
export const ListClientsQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
});

/**
 * Validation schema for POST /api/trainer/clients (Create client by trainer)
 * Trainers can only create clients, and the trainer is automatically assigned
 */
export const CreateClientFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email").trim().toLowerCase(),
  firstName: z
    .string()
    .min(1, "Imię jest wymagane")
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(50, "Imię może mieć maksymalnie 50 znaków")
    .trim(),
  lastName: z
    .string()
    .min(1, "Nazwisko jest wymagane")
    .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
    .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Nieprawidłowy format numeru telefonu")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD")
    .refine((date) => !date || new Date(date) <= new Date(), "Data urodzenia nie może być w przyszłości")
    .optional()
    .or(z.literal("")),
});

/**
 * Validation schema for PUT /api/trainer/clients/:id (Update client by trainer)
 */
export const UpdateClientFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email").trim().toLowerCase(),
  firstName: z
    .string()
    .min(1, "Imię jest wymagane")
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(50, "Imię może mieć maksymalnie 50 znaków")
    .trim(),
  lastName: z
    .string()
    .min(1, "Nazwisko jest wymagane")
    .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
    .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Nieprawidłowy format numeru telefonu")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD")
    .refine((date) => !date || new Date(date) <= new Date(), "Data urodzenia nie może być w przyszłości")
    .optional()
    .or(z.literal("")),
});

/**
 * Validation schema for creating a plan
 * Both trainerId and clientId are optional (can be null in DB)
 */
export const CreatePlanCommandSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  trainerId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  isHidden: z.boolean().default(false),
  description: z.string().max(1000).trim().optional().or(z.literal("")).nullable(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        sortOrder: z.number().int().min(1),
        sets: z.number().int().min(1),
        reps: z.number().int().min(1),
        tempo: z
          .string()
          .regex(/^(\d{4}|\d+-\d+-\d+(-\d+)?)$/, "Tempo must be in Format XXXX or X-X-X-X")
          .default("3-0-3"),
        defaultWeight: z.number().min(0).optional().nullable(),
      })
    )
    .min(1, "At least one exercise is required"),
});

/**
 * Validation schema for updating a plan
 * trainerId and clientId can be set to null to unassign
 */
export const UpdatePlanCommandSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional().nullable(),
    isHidden: z.boolean().optional(),
    trainerId: z.string().uuid().optional().nullable(),
    clientId: z.string().uuid().optional().nullable(),
    exercises: z
      .array(
        z.object({
          exerciseId: z.string().uuid(),
          sortOrder: z.number().int().min(1),
          sets: z.number().int().min(1),
          reps: z.number().int().min(1),
          tempo: z
            .string()
            .regex(/^(\d{4}|\d+-\d+-\d+(-\d+)?)$/, "Tempo must be in Format XXXX or X-X-X-X")
            .default("3-0-3"),
          defaultWeight: z.number().min(0).optional().nullable(),
        })
      )
      .min(1, "At least one exercise is required")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Validation schema for toggling plan visibility
 */
export const TogglePlanVisibilityCommandSchema = z.object({
  isHidden: z.boolean(),
});
