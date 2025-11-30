import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRowItem } from "./UserRowItem";
import type { UserDto } from "@/interface";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentUsersWidgetProps {
  users: UserDto[];
  isLoading: boolean;
}

export const RecentUsersWidget = ({ users, isLoading }: RecentUsersWidgetProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ostatnio zarejestrowani</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </li>
            ))}
          </ul>
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
