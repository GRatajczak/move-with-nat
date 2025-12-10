import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRowItem } from "../UserRowItem";
import type { RecentUsersWidgetProps } from "@/interface";
import { RecentUsersSkeleton } from "./RecentUsersSkeleton";

export const RecentUsersWidgetContent = ({ users, isLoading }: RecentUsersWidgetProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ostatnio zarejestrowani</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <RecentUsersSkeleton />
        ) : users.length > 0 ? (
          <ul className="flex flex-col">
            {users.map((user) => (
              <UserRowItem key={user.id} user={user} />
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-8">Brak nowych użytkowników</div>
        )}
      </CardContent>
    </Card>
  );
};
