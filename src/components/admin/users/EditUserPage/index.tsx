import { QueryProvider } from "@/components/QueryProvider";
import { EditUserContent } from "./EditUserPageContent";

export const EditUserPage = ({ userId }: { userId: string }) => {
  return (
    <QueryProvider>
      <EditUserContent userId={userId} />
    </QueryProvider>
  );
};
