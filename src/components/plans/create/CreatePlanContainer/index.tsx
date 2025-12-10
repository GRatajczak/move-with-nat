import { QueryProvider } from "../../../QueryProvider";
import { CreatePlanContent } from "./CreatePlanContent";
import type { CreatePlanContainerProps } from "@/interface/plans";

export const CreatePlanContainer = ({ trainerId, userRole = "trainer" }: CreatePlanContainerProps) => {
  return (
    <QueryProvider>
      <CreatePlanContent trainerId={trainerId} userRole={userRole} />
    </QueryProvider>
  );
};
