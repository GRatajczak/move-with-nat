import { useTrainerDashboard } from "@/hooks/useTrainerDashboard";
import { StatsCard } from "@/components/admin/dashboard/StatsCard";
import { TrainerQuickActions } from "./TrainerQuickActions";
import { RecentClientsWidget } from "./RecentClientsWidget";
import { Users, Calendar } from "lucide-react";
import { QueryProvider } from "../../QueryProvider";

const TrainerDashboardContent = () => {
  const { data, isLoading, error } = useTrainerDashboard();

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TrainerQuickActions />

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Podopieczni"
          value={data?.stats.totalClients}
          icon={Users}
          isLoading={isLoading}
          description="Wszyscy podopieczni"
        />
        <StatsCard
          title="Aktywne Plany"
          value={data?.stats.activePlans}
          icon={Calendar}
          isLoading={isLoading}
          description="Plany treningowe"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <RecentClientsWidget clients={data?.recentClients || []} isLoading={isLoading} />
      </div>
    </div>
  );
};

export const TrainerDashboardContainer = () => {
  return (
    <QueryProvider>
      <TrainerDashboardContent />
    </QueryProvider>
  );
};
