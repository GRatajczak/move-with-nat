import { QueryProvider } from "../../../QueryProvider";
import { PlansListContent } from "./PlansListContent";

export const PlansListPage = ({ userRole = "trainer", userId }: { userRole: "admin" | "trainer"; userId: string }) => {
  return (
    <QueryProvider>
      <PlansListContent userRole={userRole} userId={userId} />
    </QueryProvider>
  );
};
