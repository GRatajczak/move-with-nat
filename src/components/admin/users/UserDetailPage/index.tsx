import { QueryProvider } from "@/components/QueryProvider";
import { UserDetailContent } from "./UserDetailPageContent";

interface UserDetailPageProps {
  userId: string;
}

export const UserDetailPage = ({ userId }: UserDetailPageProps) => {
  return (
    <QueryProvider>
      <UserDetailContent userId={userId} />
    </QueryProvider>
  );
};
