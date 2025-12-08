import { useState, useEffect, useCallback } from "react";
import type {
  TrainerDashboardData,
  TrainerDashboardState,
  PaginatedResponse,
  UserDto,
  PlanSummaryDto,
} from "@/interface";

export const useTrainerDashboard = () => {
  const [state, setState] = useState<TrainerDashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const headers = { "Content-Type": "application/json" };

      // Parallel requests for dashboard data
      const [clientsRes, recentClientsRes, plansRes] = await Promise.all([
        fetch("/api/trainer/clients?limit=1", { headers }),
        fetch("/api/trainer/clients?limit=5", { headers }),
        fetch("/api/plans?limit=1", { headers }),
      ]);

      // Helper to safe parse JSON
      const parseJson = async <T>(res: Response): Promise<PaginatedResponse<T> | null> => {
        if (!res.ok) return null;
        return res.json();
      };

      const [clientsData, recentClientsData, plansData] = await Promise.all([
        parseJson<UserDto>(clientsRes),
        parseJson<UserDto>(recentClientsRes),
        parseJson<PlanSummaryDto>(plansRes),
      ]);

      const data: TrainerDashboardData = {
        stats: {
          totalClients: clientsData?.meta?.total || 0,
          activePlans: plansData?.meta?.total || 0,
        },
        recentClients: recentClientsData?.data || [],
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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...state,
    refetch: fetchDashboardData,
  };
};
