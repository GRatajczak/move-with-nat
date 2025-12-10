import { QueryProvider } from "@/components/QueryProvider";
import { CreateUserContent } from "./CreateUserPageContent";

export const CreateUserPage = () => {
  return (
    <QueryProvider>
      <CreateUserContent />
    </QueryProvider>
  );
};
