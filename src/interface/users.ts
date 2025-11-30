import type { Database, UserRole } from "../types/db";

/** USERS **/
/** List users query parameters **/
export interface ListUsersQuery {
  role?: UserRole;
  status?: "active" | "pending" | "suspended";
  trainerId?: string;
  page?: number;
  limit?: number;
}

/** User DTO for responses **/
export interface UserDto {
  id: Database["public"]["Tables"]["users"]["Row"]["id"];
  email: Database["public"]["Tables"]["users"]["Row"]["email"];
  role: Database["public"]["Tables"]["users"]["Row"]["role"];
  isActive: Database["public"]["Tables"]["users"]["Row"]["is_active"];
  firstName: Database["public"]["Tables"]["users"]["Row"]["first_name"];
  lastName: Database["public"]["Tables"]["users"]["Row"]["last_name"];
  trainerId: Database["public"]["Tables"]["users"]["Row"]["trainer_id"];
  createdAt: Database["public"]["Tables"]["users"]["Row"]["created_at"];
  updatedAt: Database["public"]["Tables"]["users"]["Row"]["updated_at"];
}

/** Create user **/
export interface CreateUserCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
  role: Extract<UserRole, "trainer" | "client">;
  firstName: string;
  lastName: string;
  trainerId?: string; // required when role='client'
}

/** Update user **/
export interface UpdateUserCommand {
  email?: Database["public"]["Tables"]["users"]["Insert"]["email"];
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  trainerId?: string;
}
