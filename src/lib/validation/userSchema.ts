import { z } from "zod";

/**
 * Schema walidacji dla formularza edycji profilu
 * Zawiera podstawowe pola: imię i nazwisko
 */
export const ProfileEditFormSchema = z.object({
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
