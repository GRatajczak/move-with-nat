import type { CreateUserFormData, EditUserFormData } from "@/types/users";
import type { Database, UserRole } from "../types/db";

/** USERS **/
/** List users query parameters **/
export interface ListUsersQuery {
  search?: string;
  role?: UserRole;
  status?: "active" | "pending" | "suspended";
  trainerId?: string;
  page?: number;
  limit?: number;
}

/** Users filters for UI state **/
export interface UsersFilters {
  search?: string;
  role?: "administrator" | "trainer" | "client";
  status?: "active" | "pending" | "suspended";
  trainerId?: string;
  page: number;
  limit: number;
}

/** User DTO for responses **/
export interface UserDto {
  id: Database["public"]["Tables"]["users"]["Row"]["id"];
  email: Database["public"]["Tables"]["users"]["Row"]["email"];
  role: Database["public"]["Tables"]["users"]["Row"]["role"];
  status: Database["public"]["Tables"]["users"]["Row"]["status"];
  firstName: Database["public"]["Tables"]["users"]["Row"]["first_name"];
  lastName: Database["public"]["Tables"]["users"]["Row"]["last_name"];
  phone: Database["public"]["Tables"]["users"]["Row"]["phone"];
  dateOfBirth: Database["public"]["Tables"]["users"]["Row"]["date_of_birth"];
  trainerId: Database["public"]["Tables"]["users"]["Row"]["trainer_id"];
  createdAt: Database["public"]["Tables"]["users"]["Row"]["created_at"];
  updatedAt: Database["public"]["Tables"]["users"]["Row"]["updated_at"];
}

/** Create user **/
export interface CreateUserCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
  role: UserRole; // "admin" | "trainer" | "client"
  firstName: Database["public"]["Tables"]["users"]["Insert"]["first_name"];
  lastName: Database["public"]["Tables"]["users"]["Insert"]["last_name"];
  phone?: Database["public"]["Tables"]["users"]["Insert"]["phone"];
  dateOfBirth?: Database["public"]["Tables"]["users"]["Insert"]["date_of_birth"];
  trainerId?: Database["public"]["Tables"]["users"]["Insert"]["trainer_id"]; // required when role='client'
}

/** Update user **/
export interface UpdateUserCommand {
  email?: Database["public"]["Tables"]["users"]["Insert"]["email"];
  firstName?: Database["public"]["Tables"]["users"]["Insert"]["first_name"];
  lastName?: Database["public"]["Tables"]["users"]["Insert"]["last_name"];
  phone?: Database["public"]["Tables"]["users"]["Insert"]["phone"];
  dateOfBirth?: Database["public"]["Tables"]["users"]["Insert"]["date_of_birth"];
  status?: Database["public"]["Tables"]["users"]["Row"]["status"];
  trainerId?: Database["public"]["Tables"]["users"]["Insert"]["trainer_id"];
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

export interface UsersFilterToolbarProps {
  filters: UsersFilters;
  onFiltersChange: (filters: Partial<UsersFilters>) => void;
  onCreateClick: () => void;
  isLoading?: boolean;
}

export interface UsersTableProps {
  users: UserDto[];
  isLoading: boolean;
  onRowClick: (user: UserDto) => void;
  onEdit: (userId: string) => void;
  onToggleActive: (user: UserDto) => void;
  onResendInvite: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
}

export interface UsersCardsProps {
  users: UserDto[];
  isLoading: boolean;
  onCardClick: (user: UserDto) => void;
  onEdit: (userId: string) => void;
  onToggleActive: (user: UserDto) => void;
  onResendInvite: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
}

export interface UserActionMenuProps {
  user: UserDto;
  onEdit: () => void;
  onToggleActive: () => void;
  onResendInvite: () => void;
  onDelete: () => void;
}

export interface EditUserFormProps {
  user: UserDto;
  onSubmit: (data: EditUserFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}
