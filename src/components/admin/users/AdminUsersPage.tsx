import React, { useState, useMemo } from "react";
import { useUsersList } from "@/hooks/useUsersList";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useResendInvite } from "@/hooks/useResendInvite";
import { UsersFilterToolbar } from "./UsersFilterToolbar";
import { UsersTable } from "./UsersTable";
import { UsersCards } from "./UsersCards";
import { Pagination } from "@/components/exercises/Pagination";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
import type { UserDto, UsersFilters } from "@/interface";
import { QueryProvider } from "@/components/QueryProvider";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

const AdminUsersContent = () => {
  // Filters state
  const [filters, setFilters] = useState<UsersFilters>({
    search: undefined,
    role: undefined,
    status: undefined,
    trainerId: undefined,
    page: 1,
    limit: 20,
  });

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search || "", 300);

  // Build query with debounced search and map role
  const query = useMemo(() => {
    // Map form role to API role
    const apiRole: "admin" | "trainer" | "client" | undefined =
      filters.role === "administrator" ? "admin" : filters.role;

    return {
      search: debouncedSearch || undefined,
      role: apiRole,
      status: filters.status,
      trainerId: filters.trainerId,
      page: filters.page,
      limit: filters.limit,
    };
  }, [debouncedSearch, filters.role, filters.status, filters.trainerId, filters.page, filters.limit]);

  const { data, isLoading, error } = useUsersList(query);
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutateAsync: resendInvite } = useResendInvite();

  // Modal state
  const [deleteModalUser, setDeleteModalUser] = useState<UserDto | null>(null);
  const [toggleActiveUser, setToggleActiveUser] = useState<UserDto | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleFiltersChange = (newFilters: Partial<UsersFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleCreateClick = () => {
    window.location.href = "/admin/users/new";
  };

  const handleRowClick = (user: UserDto) => {
    window.location.href = `/admin/users/${user.id}`;
  };

  const handleEdit = (userId: string) => {
    window.location.href = `/admin/users/${userId}/edit`;
  };

  const handleToggleActive = (user: UserDto) => {
    setToggleActiveUser(user);
  };

  const confirmToggleActive = async () => {
    if (!toggleActiveUser) return;

    try {
      const newStatus = toggleActiveUser.status === "active" ? "suspended" : "active";
      await updateUser({
        userId: toggleActiveUser.id,
        command: { status: newStatus },
      });
      setToggleActiveUser(null);
    } catch {
      // Error is handled by the hook via toast
    }
  };

  const handleResendInvite = async (user: UserDto) => {
    // Only allow resending invites for trainers and clients
    if (user.role === "admin") {
      toast.error("Nie można wysłać zaproszenia dla administratora");
      return;
    }

    try {
      await resendInvite({
        email: user.email,
        role: user.role as "trainer" | "client",
        resend: true,
      });
    } catch {
      // Error is handled by the hook via toast
    }
  };

  const handleDeleteClick = (user: UserDto) => {
    setDeleteModalUser(user);
  };

  const confirmDelete = async () => {
    if (!deleteModalUser) return;

    try {
      await deleteUser(deleteModalUser.id);
      setDeleteModalUser(null);
      // Reset to first page if we're not there
      if (filters.page !== 1) {
        setFilters((prev) => ({ ...prev, page: 1 }));
      }
    } catch {
      // Error is handled by the hook via toast
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Wystąpił błąd podczas ładowania użytkowników: {error instanceof Error ? error.message : "Nieznany błąd"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Użytkownicy</h1>
          <p className="text-muted-foreground">
            Zarządzaj użytkownikami systemu (administratorzy, trenerzy, podopieczni).
          </p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/admin")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do Dashboard
        </Button>
      </div>

      <UsersFilterToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onCreateClick={handleCreateClick}
        isLoading={isLoading}
      />

      {isDesktop ? (
        <UsersTable
          users={data?.data || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onResendInvite={handleResendInvite}
          onDelete={handleDeleteClick}
        />
      ) : (
        <UsersCards
          users={data?.data || []}
          isLoading={isLoading}
          onCardClick={handleRowClick}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onResendInvite={handleResendInvite}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Pagination */}
      {data?.meta && <Pagination meta={data.meta} onPageChange={(page) => handleFiltersChange({ page })} />}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteModalUser} onOpenChange={(open) => !open && setDeleteModalUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Użytkownik{" "}
              <strong>
                {deleteModalUser?.firstName} {deleteModalUser?.lastName}
              </strong>{" "}
              ({deleteModalUser?.email}) zostanie trwale usunięty z systemu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Confirmation Modal */}
      <AlertDialog open={!!toggleActiveUser} onOpenChange={(open) => !open && setToggleActiveUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleActiveUser?.status === "active" ? "Zawiesić użytkownika?" : "Aktywować użytkownika?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleActiveUser?.status === "active" ? (
                <>
                  Użytkownik{" "}
                  <strong>
                    {toggleActiveUser?.firstName} {toggleActiveUser?.lastName}
                  </strong>{" "}
                  zostanie zawieszony i utraci dostęp do systemu.
                </>
              ) : (
                <>
                  Użytkownik{" "}
                  <strong>
                    {toggleActiveUser?.firstName} {toggleActiveUser?.lastName}
                  </strong>{" "}
                  zostanie aktywowany i odzyska dostęp do systemu.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive} disabled={isUpdating}>
              {isUpdating ? "Zapisywanie..." : toggleActiveUser?.status === "active" ? "Zawieś" : "Aktywuj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const AdminUsersPage: React.FC = () => {
  return (
    <QueryProvider>
      <AdminUsersContent />
    </QueryProvider>
  );
};
