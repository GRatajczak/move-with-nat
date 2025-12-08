import type { PaginatedResponse } from "./common";

/** CLIENTS MODULE TYPES **/

/** Status enum received from backend */
export type ClientStatus = "active" | "pending" | "suspended";

/** Single client data transfer object */
export interface ClientDto {
  id: string;
  firstName: string;
  lastName: string;
  status: ClientStatus;
  avatarUrl?: string | null;
  totalActivePlans: number;
  /** ISO date string or null when no activity */
  lastActivityAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  trainerId?: string | null;
  /** Last active plan for detail view */
  lastActivePlan?: {
    id: string;
    name: string;
    createdAt: string;
  } | null;
}

/** Query params accepted by backend endpoint */
export interface ClientsPageQuery {
  search?: string;
  status?: ClientStatus;
  page?: number; // default 1
  limit?: number; // default 20 (allowed: 10,20,50)
}

/** Filters state used on the frontend (URL ⇆ state) */
export interface ClientsFilters {
  searchText: string;
  status?: ClientStatus;
  page: number;
  limit: number;
}

/** Convenience alias keeping backend response shape */
export type ClientsPaginatedResponse = PaginatedResponse<ClientDto>;

/** Component props **/

export interface ClientsTableProps {
  clients: ClientDto[];
  isLoading: boolean;
  onRowClick: (client: ClientDto) => void;
  onCreatePlan: (client: ClientDto) => void;
}

export interface ClientsCardsProps {
  clients: ClientDto[];
  isLoading: boolean;
  onCardClick: (client: ClientDto) => void;
  onCreatePlan: (client: ClientDto) => void;
}

export interface ClientActionMenuProps {
  client: ClientDto;
  onViewProfile: () => void;
  onCreatePlan: () => void;
}

/** Commands for client operations **/

export interface CreateClientCommand {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdateClientCommand {
  firstName: string;
  lastName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
}

/** Form data types **/

export interface CreateClientFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface EditClientFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

/** Form props **/

export interface CreateClientFormProps {
  onSubmit: (data: CreateClientFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface EditClientFormProps {
  client: ClientDto;
  onSubmit: (data: EditClientFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}
