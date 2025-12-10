import { QueryProvider } from "@/components/QueryProvider";
import { AdminUsersContent } from "./AdminUsersPageContent";

export const AdminUsersPage = () => {
  return (
    <QueryProvider>
      <AdminUsersContent />
    </QueryProvider>
  );
};
