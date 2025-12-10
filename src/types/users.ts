// src/types/users.ts
import { z } from "zod";
import { EditUserFormSchema, CreateUserFormSchema } from "@/lib/validation";

export type EditUserFormData = z.infer<typeof EditUserFormSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;

export type UserStatus = "pending" | "active" | "inactive";

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "trainer" | "client";
  status: UserStatus;
  trainerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersQuery {
  search?: string;
  role?: "admin" | "trainer" | "client";
  status?: UserStatus;
  trainerId?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserCommand {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "trainer" | "client";
  trainerId?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdateUserCommand {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  status?: UserStatus;
  trainerId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "admin" | "trainer" | "client";
}

export type AuthenticatedUserWithFullName = AuthenticatedUser & {
  firstName: string;
  lastName: string;
};
