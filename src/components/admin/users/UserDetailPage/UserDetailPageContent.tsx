import React, { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useUsersList } from "@/hooks/useUsersList";
import { useResendInvite } from "@/hooks/useResendInvite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash, ArrowLeft, Mail, Calendar, User, UserCheck, UserX, Users, Phone } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
        <Skeleton className="h-10 w-28" />
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

export const UserDetailContent = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, error } = useUser(userId);
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutateAsync: resendInvite, isPending: isResendingInvite } = useResendInvite();

  // Fetch trainer details if user is a client with assigned trainer
  const { data: trainer, isLoading: isLoadingTrainer } = useUser(user?.trainerId || "", {
    enabled: !!user?.trainerId,
  });

  // Fetch clients if user is a trainer
  const { data: clientsData, isLoading: isLoadingClients } = useUsersList({
    role: "client",
    trainerId: userId,
    page: 1,
    limit: 100,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isToggleActiveModalOpen, setIsToggleActiveModalOpen] = useState(false);

  const handleEdit = () => {
    window.location.href = `/admin/users/${userId}/edit`;
  };

  const handleBack = () => {
    window.location.href = "/admin/users";
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userId);
      window.location.href = "/admin/users";
    } catch {
      // Error is handled by the hook via toast
    }
  };

  const handleToggleActiveConfirm = async () => {
    if (!user) return;

    try {
      const newStatus = user.status === "active" ? "suspended" : "active";
      await updateUser({
        userId: user.id,
        command: { status: newStatus },
      });
      toast.success(newStatus === "active" ? "Użytkownik został aktywowany" : "Użytkownik został zawieszony");
      setIsToggleActiveModalOpen(false);
    } catch {
      // Error is handled by the hook via toast
    }
  };

  const handleResendInvite = async () => {
    if (!user) return;

    // Map user role to invite API role (admin is not supported by invite API)
    const inviteRole = user.role === "admin" ? null : user.role === "client" ? "client" : "trainer";

    if (!inviteRole) {
      toast.error("Nie można wysłać zaproszenia dla administratora przez ten interfejs");
      return;
    }

    try {
      await resendInvite({
        email: user.email,
        role: inviteRole,
      });
    } catch {
      // Error is handled by the hook via toast
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>
          Nie udało się załadować użytkownika:{" "}
          {error ? (error instanceof Error ? error.message : "Nieznany błąd") : "Nie znaleziono"}
        </p>
        <Button variant="link" onClick={handleBack} className="pl-0 mt-2">
          Wróć do listy
        </Button>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "trainer":
        return "default";
      case "client":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "trainer":
        return "Trener";
      case "client":
        return "Podopieczny";
      default:
        return role;
    }
  };

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
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:px-0 px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {user.firstName && user.lastName ? (
                  `${user.firstName} ${user.lastName}`
                ) : (
                  <span className="text-muted-foreground italic">Brak danych</span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                <Badge variant={getStatusBadgeVariant(user.status)}>{getStatusLabel(user.status)}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </Button>
          {user.status === "pending" && (user.role === "trainer" || user.role === "client") && (
            <Button variant="outline" onClick={handleResendInvite} disabled={isResendingInvite}>
              <Mail className="mr-2 h-4 w-4" />
              {isResendingInvite ? "Wysyłanie..." : "Wyślij zaproszenie"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsToggleActiveModalOpen(true)}>
            {user.status === "active" ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
            {user.status === "active" ? "Zawieś" : "Aktywuj"}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Usuń
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="md:px-0 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacje o użytkowniku</CardTitle>
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
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  </div>
                </div>
              )}
              {user.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Data urodzenia</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.dateOfBirth).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Szczegóły konta</h3>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Data utworzenia</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ostatnia aktualizacja</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.updatedAt).toLocaleDateString("pl-PL", { dateStyle: "long" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Trainer (only for clients) */}
            {user.role === "client" && (
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Przypisany trener
                </h3>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    {user.trainerId ? (
                      <>
                        {isLoadingTrainer ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        ) : trainer ? (
                          <>
                            <p className="text-lg font-medium">
                              {trainer.firstName && trainer.lastName
                                ? `${trainer.firstName} ${trainer.lastName}`
                                : "Brak danych"}
                            </p>
                            <p className="text-sm text-muted-foreground">{trainer.email}</p>
                            <a
                              href={`/admin/users/${trainer.id}`}
                              className="text-sm text-primary hover:underline mt-1 inline-block"
                            >
                              Zobacz profil trenera →
                            </a>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">Trener przypisany</p>
                            <p className="text-xs text-muted-foreground">ID: {user.trainerId}</p>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Brak przypisanego trenera</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User ID */}
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identyfikator</h3>
              <p className="text-xs font-mono text-muted-foreground break-all">{user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer's Clients Section */}
      {user.role === "trainer" && (
        <div className="md:px-0 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Podopieczni ({clientsData?.data.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingClients ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : clientsData?.data && clientsData.data.length > 0 ? (
                <div className="space-y-2">
                  {clientsData.data.map((client) => (
                    <a
                      key={client.id}
                      href={`/admin/users/${client.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {client.firstName && client.lastName
                            ? `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase()
                            : client.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {client.firstName && client.lastName ? (
                            `${client.firstName} ${client.lastName}`
                          ) : (
                            <span className="text-muted-foreground italic">Brak danych</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(client.status)} className="text-xs">
                        {getStatusLabel(client.status)}
                      </Badge>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Ten trener nie ma jeszcze przypisanych podopiecznych</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Użytkownik{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>{" "}
              ({user.email}) zostanie trwale usunięty z systemu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Confirmation Modal */}
      <AlertDialog open={isToggleActiveModalOpen} onOpenChange={setIsToggleActiveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.status === "active" ? "Zawiesić użytkownika?" : "Aktywować użytkownika?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.status === "active" ? (
                <>
                  Użytkownik{" "}
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>{" "}
                  zostanie zawieszony i utraci dostęp do systemu.
                </>
              ) : (
                <>
                  Użytkownik{" "}
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>{" "}
                  zostanie aktywowany i odzyska dostęp do systemu.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActiveConfirm} disabled={isUpdating}>
              {isUpdating ? "Zapisywanie..." : user.status === "active" ? "Zawieś" : "Aktywuj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
