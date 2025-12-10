import { QueryProvider } from "../../../QueryProvider";
import { AdminDashboardContent } from "./AdminDashboardContent";

export const AdminDashboardContainer = () => {
  return (
    <QueryProvider>
      <AdminDashboardContent />
    </QueryProvider>
  );
};
