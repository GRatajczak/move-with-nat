import { QueryProvider } from "../../../QueryProvider";
import { PlanDetailContent } from "./PlanDetailContent";
import type { PlanDetailContainerProps } from "@/interface/plans";

export const PlanDetailContainer = ({ planId, userRole = "trainer" }: PlanDetailContainerProps) => {
  return (
    <QueryProvider>
      <PlanDetailContent planId={planId} userRole={userRole} />
    </QueryProvider>
  );
};
