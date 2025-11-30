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

/** Profile view models **/

/** Dane formularza edycji profilu */
export interface ProfileEditFormData {
  firstName: string;
  lastName: string;
  // email nie jest edytowalny, więc nie ma go w formData
}

/** Propsy głównego kontenera profilu */
export interface ProfileContainerProps {
  userId: string;
  userRole: UserRole;
}

/** Propsy nagłówka profilu */
export interface ProfileHeaderProps {
  userId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/** Propsy formularza edycji profilu */
export interface ProfileEditFormProps {
  userId: string;
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

/** Dane formularza zmiany hasła */
export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Propsy formularza zmiany hasła */
export interface ChangePasswordFormProps {
  // Brak propsów - komponent autonomiczny
}

/** Propsy karty informacyjnej o trenerze */
export interface TrainerInfoCardProps {
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

/** ViewModel dla trenera (uproszczony) */
export interface TrainerViewModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
