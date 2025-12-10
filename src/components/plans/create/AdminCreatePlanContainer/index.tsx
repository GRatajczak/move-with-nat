import { QueryProvider } from "../../../QueryProvider";
import { AdminCreatePlanContent } from "./AdminCreatePlanContent";

export const AdminCreatePlanContainer = ({ userRole = "admin" }: { userRole: "admin" }) => {
  return (
    <QueryProvider>
      <AdminCreatePlanContent userRole={userRole} />
    </QueryProvider>
  );
};
