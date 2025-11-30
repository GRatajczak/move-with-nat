import React from "react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { StatsCard } from "./StatsCard";
import { QuickActions } from "./QuickActions";
import { RecentUsersWidget } from "./RecentUsersWidget";
import { PendingActivationsWidget } from "./PendingActivationsWidget";
import { Users, UserCheck, Dumbbell, Calendar } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "../../QueryProvider";

const AdminDashboardContent = () => {
  const { data, isLoading, error, onResendInvite } = useAdminDashboard();

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toaster />
      <QuickActions />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Podopieczni"
          value={data?.stats.totalClients}
          icon={Users}
          isLoading={isLoading}
          description="Aktywni klienci"
        />
        <StatsCard
          title="Trenerzy"
          value={data?.stats.totalTrainers}
          icon={UserCheck}
          isLoading={isLoading}
          description="Zatrudnieni trenerzy"
        />
        <StatsCard
          title="Plany Treningowe"
          value={data?.stats.totalPlans}
          icon={Calendar}
          isLoading={isLoading}
          description="Aktywne plany treningowe"
        />
        <StatsCard
          title="Baza Ćwiczeń"
          value={data?.stats.totalExercises}
          icon={Dumbbell}
          isLoading={isLoading}
          description="Wszystkie ćwiczenia"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentUsersWidget users={data?.recentUsers || []} isLoading={isLoading} />
        </div>
        <div className="col-span-3">
          <PendingActivationsWidget
            users={data?.pendingUsers || []}
            isLoading={isLoading}
            onResendInvite={onResendInvite}
          />
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardContainer = () => {
  return (
    <QueryProvider>
      <AdminDashboardContent />
    </QueryProvider>
  );
};
