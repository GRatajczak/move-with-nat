import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ClientActionMenu } from "./ClientActionMenu";
import type { ClientsTableProps, ClientStatus } from "@/interface/clients";

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
  if (!date) return "—";
  const activityDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - activityDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Dzisiaj";
  if (diffInDays === 1) return "Wczoraj";
  if (diffInDays < 7) return `${diffInDays} dni temu`;
  return activityDate.toLocaleDateString("pl-PL");
};

export const ClientsTable = ({ clients, isLoading, onRowClick, onCreatePlan, onResendInvite }: ClientsTableProps) => {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-md border border-dashed">
        <p className="text-muted-foreground">Brak podopiecznych pasujących do filtrów</p>
        <p className="text-sm text-muted-foreground mt-2">Spróbuj zmienić kryteria wyszukiwania</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Podopieczny</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aktywne plany</TableHead>
            <TableHead>Ostatnia aktywność</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(client)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {client.avatarUrl ? (
                    <img
                      src={client.avatarUrl}
                      alt={`${client.firstName} ${client.lastName}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {client.firstName[0]}
                        {client.lastName[0]}
                      </span>
                    </div>
                  )}
                  <span>
                    {client.firstName} {client.lastName}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(client.status)}>{getStatusLabel(client.status)}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {client.totalActivePlans} {client.totalActivePlans === 1 ? "plan" : "planów"}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatLastActivity(client.lastActivityAt)}
              </TableCell>
              <TableCell className="text-right">
                <ClientActionMenu
                  client={client}
                  onViewProfile={() => onRowClick(client)}
                  onCreatePlan={() => onCreatePlan(client)}
                  onResendInvite={onResendInvite ? () => onResendInvite(client) : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-28" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-12 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-20 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
