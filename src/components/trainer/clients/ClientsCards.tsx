import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { ClientActionMenu } from "./ClientActionMenu";
import type { ClientsCardsProps, ClientStatus } from "@/interface/clients";

const getStatusBadgeVariant = (status: ClientStatus) => {
  switch (status) {
    case "active":
      return "default";
    case "pending":
      return "secondary";
    case "suspended":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: ClientStatus) => {
  switch (status) {
    case "active":
      return "Aktywny";
    case "pending":
      return "Oczekujący";
    case "suspended":
      return "Zawieszony";
    default:
      return status;
  }
};

const formatLastActivity = (date: string | null) => {
  if (!date) return "Brak aktywności";
  const activityDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - activityDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Aktywny dzisiaj";
  if (diffInDays === 1) return "Aktywny wczoraj";
  if (diffInDays < 7) return `Aktywny ${diffInDays} dni temu`;
  return `Aktywny ${activityDate.toLocaleDateString("pl-PL")}`;
};

export const ClientsCards = ({ clients, isLoading, onCardClick, onCreatePlan, onResendInvite }: ClientsCardsProps) => {
  if (isLoading) {
    return <CardsSkeleton />;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed mx-4">
        <p className="text-muted-foreground">Brak podopiecznych pasujących do filtrów</p>
        <p className="text-sm text-muted-foreground mt-2">Spróbuj zmienić kryteria wyszukiwania</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onCardClick(client)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                {client.avatarUrl ? (
                  <img
                    src={client.avatarUrl}
                    alt={`${client.firstName} ${client.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {client.firstName[0]}
                      {client.lastName[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold leading-none tracking-tight">
                    {client.firstName} {client.lastName}
                  </h3>
                  <Badge variant={getStatusBadgeVariant(client.status)} className="mt-2">
                    {getStatusLabel(client.status)}
                  </Badge>
                </div>
              </div>
              <ClientActionMenu
                client={client}
                onViewProfile={() => onCardClick(client)}
                onCreatePlan={() => onCreatePlan(client)}
                onResendInvite={onResendInvite ? () => onResendInvite(client) : undefined}
              />
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aktywne plany</span>
                <span className="font-medium">
                  {client.totalActivePlans} {client.totalActivePlans === 1 ? "plan" : "planów"}
                </span>
              </div>

              {/* Last activity */}
              <div className="text-sm text-muted-foreground">{formatLastActivity(client.lastActivityAt)}</div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onCreatePlan(client);
              }}
            >
              <Plus className="h-4 w-4" />
              Stwórz plan
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const CardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 px-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ))}
  </div>
);
