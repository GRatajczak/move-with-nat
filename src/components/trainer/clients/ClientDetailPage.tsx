import { useClient } from "@/hooks/clients/useClient";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, ArrowLeft, Mail, Calendar, Phone, FileText, ExternalLink } from "lucide-react";
import { QueryProvider } from "@/components/QueryProvider";

const ClientDetailContent = ({ clientId }: { clientId: string }) => {
  const { data: client, isLoading, error } = useClient(clientId);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>
          Nie udało się załadować podopiecznego:{" "}
          {error ? (error instanceof Error ? error.message : "Nieznany błąd") : "Nie znaleziono"}
        </p>
        <a href="/trainer/clients" className={buttonVariants({ variant: "link", className: "pl-0 mt-2" })}>
          Wróć do listy
        </a>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "suspended":
        return "destructive";
      case "pending":
        return "outline";
      case "active":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "suspended":
        return "Zawieszony";
      case "pending":
        return "Oczekujący";
      case "active":
        return "Aktywny";
      default:
        return status;
    }
  };

  const getInitials = () => {
    if (client.firstName && client.lastName) {
      return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
    }
    return client.email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:px-0 px-4">
        <div className="flex items-center gap-4">
          <a href="/trainer/clients" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {client.firstName && client.lastName ? (
                  `${client.firstName} ${client.lastName}`
                ) : (
                  <span className="text-muted-foreground italic">Brak danych</span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Podopieczny</Badge>
                <Badge variant={getStatusBadgeVariant(client.status)}>{getStatusLabel(client.status)}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/trainer/clients/${clientId}/edit`}
            className={buttonVariants({ variant: "outline", className: "gap-2" })}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </a>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="md:px-0 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacje o podopiecznym</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informacje kontaktowe
              </h3>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Data urodzenia</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.dateOfBirth).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Szczegóły konta</h3>
              {client.createdAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Data utworzenia</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.createdAt).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
              )}
              {client.updatedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ostatnia aktualizacja</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.updatedAt).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User ID */}
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identyfikator</h3>
              <p className="text-xs font-mono text-muted-foreground break-all">{client.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Active Plan Section */}
      {client.lastActivePlan && (
        <div className="md:px-0 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ostatni aktywny plan treningowy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{client.lastActivePlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Utworzono:{" "}
                      {new Date(client.lastActivePlan.createdAt).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
                <a
                  href={`/trainer/plans/${client.lastActivePlan?.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}
                >
                  Zobacz plan
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Active Plans Message */}
      {!client.lastActivePlan && (
        <div className="md:px-0 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Plany treningowe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Brak aktywnych planów treningowych dla tego podopiecznego</p>
                <a
                  href={`/trainer/plans/new?clientId=${client.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
                >
                  Utwórz pierwszy plan
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const DetailSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto md:px-0 px-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
      </div>
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3 pt-3 border-t">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-3 pt-3 border-t">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export const ClientDetailPage = ({ clientId }: { clientId: string }) => {
  return (
    <QueryProvider>
      <ClientDetailContent clientId={clientId} />
    </QueryProvider>
  );
};
