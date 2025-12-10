import { QueryProvider } from "../../../QueryProvider";
import { EditPlanContent } from "./EditPlanContent";
import type { EditPlanContainerProps } from "@/interface/plans";

export const EditPlanContainer = ({ planId, userRole = "trainer" }: EditPlanContainerProps) => {
  return (
    <QueryProvider>
      <EditPlanContent planId={planId} userRole={userRole} />
    </QueryProvider>
  );
};
