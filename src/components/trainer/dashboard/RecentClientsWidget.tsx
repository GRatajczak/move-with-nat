import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import type { UserDto } from "@/interface";

interface RecentClientsWidgetProps {
  clients: UserDto[];
  isLoading: boolean;
}

export const RecentClientsWidget = ({ clients, isLoading }: RecentClientsWidgetProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Brak daty";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Nieprawidłowa data";

    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "??";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  console.log(clients);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ostatnio Dodani Podopieczni</CardTitle>
        <CardDescription>5 ostatnio dodanych podopiecznych</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nie masz jeszcze żadnych podopiecznych</p>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <a
                key={client.id}
                href={`/trainer/clients/${client.id}`}
                className="flex items-center space-x-4 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar>
                  <AvatarFallback>{getInitials(client.firstName ?? "", client.lastName ?? "")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : client.email}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="mr-1 h-3 w-3" />
                    Dodano: {formatDate(client.createdAt)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
