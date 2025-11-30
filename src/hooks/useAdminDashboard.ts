import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  DashboardData,
  DashboardState,
  PaginatedResponse,
  UserDto,
  PlanSummaryDto,
  ExerciseSummaryDto,
} from "@/interface";
import type { UserRole } from "@/types/db";

export const useAdminDashboard = () => {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const headers = { "Content-Type": "application/json" };

      // Parallel requests for dashboard data
      const [trainersRes, clientsRes, recentUsersRes, pendingUsersRes, plansRes, exercisesRes] = await Promise.all([
        fetch("/api/users?role=trainer&limit=1", { headers }),
        fetch("/api/users?role=client&limit=1", { headers }),
        fetch("/api/users?limit=5", { headers }),
        fetch("/api/users?status=pending&limit=5", { headers }),
        fetch("/api/plans?limit=1", { headers }),
        fetch("/api/exercises?limit=1", { headers }),
      ]);

      // Helper to safe parse JSON
      const parseJson = async <T>(res: Response): Promise<PaginatedResponse<T> | null> => {
        if (!res.ok) return null;
        return res.json();
      };

      const [trainersData, clientsData, recentUsersData, pendingUsersData, plansData, exercisesData] =
        await Promise.all([
          parseJson<UserDto>(trainersRes),
          parseJson<UserDto>(clientsRes),
          parseJson<UserDto>(recentUsersRes),
          parseJson<UserDto>(pendingUsersRes),
          parseJson<PlanSummaryDto>(plansRes),
          parseJson<ExerciseSummaryDto>(exercisesRes),
        ]);

      const data: DashboardData = {
        stats: {
          totalTrainers: trainersData?.meta?.total || 0,
          totalClients: clientsData?.meta?.total || 0,
          totalPlans: plansData?.meta?.total || 0,
          totalExercises: exercisesData?.meta?.total || 0,
        },
        recentUsers: recentUsersData?.data || [],
        pendingUsers: pendingUsersData?.data || [],
      };

      setState({ data, isLoading: false, error: null });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Nie udało się pobrać danych dashboardu. Spróbuj odświeżyć stronę.",
      }));
    }
  }, []);

  const onResendInvite = async (email: string, role: UserRole) => {
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, resend: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Błąd wysyłania zaproszenia");
      }

      toast.success("Zaproszenie zostało wysłane ponownie");
    } catch (error) {
      console.error("Resend invite error:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas wysyłania zaproszenia");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...state,
    onResendInvite,
    refetch: fetchDashboardData,
  };
};
