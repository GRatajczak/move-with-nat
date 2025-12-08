import type { UserRole } from "../types/db";
import type { UserDto } from "./users";
import type { LucideIcon } from "lucide-react";

/** ADMIN DASHBOARD **/
export interface DashboardStats {
  totalClients: number;
  totalTrainers: number;
  totalPlans: number;
  totalExercises: number;
  totalReasons: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentUsers: UserDto[];
  pendingUsers: UserDto[];
}

export interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

export interface StatsCardProps {
  title: string;
  value: number | undefined;
  icon: LucideIcon;
  isLoading: boolean;
  description?: string;
}

export interface UserRowItemProps {
  user: UserDto;
  children?: React.ReactNode;
}

export interface PendingActivationsWidgetProps {
  users: UserDto[];
  isLoading: boolean;
  onResendInvite: (email: string, role: UserRole) => Promise<void>;
}

export interface RecentUsersWidgetProps {
  users: UserDto[];
  isLoading: boolean;
}

/** TRAINER DASHBOARD **/
export interface TrainerDashboardStats {
  totalClients: number;
  activePlans: number;
}

export interface TrainerDashboardData {
  stats: TrainerDashboardStats;
  recentClients: UserDto[];
}

export interface TrainerDashboardState {
  data: TrainerDashboardData | null;
  isLoading: boolean;
  error: string | null;
}
