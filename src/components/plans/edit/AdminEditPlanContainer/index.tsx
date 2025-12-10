import { QueryProvider } from "../../../QueryProvider";
import { AdminEditPlanContent } from "./AdminEditPlanContent";

export const AdminEditPlanContainer = ({ planId, userRole = "admin" }: { planId: string; userRole?: "admin" }) => {
  return (
    <QueryProvider>
      <AdminEditPlanContent planId={planId} userRole={userRole} />
    </QueryProvider>
  );
};
