import React, { useState, useMemo } from "react";
import { useUsersList } from "@/hooks/useUsersList";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useResendInvite } from "@/hooks/useResendInvite";
import { UsersFilterToolbar } from "../UsersFilterToolbar";
import { UsersTable } from "../UsersTable";
import { UsersCards } from "../UsersCards";
import { Pagination } from "@/components/exercises/Pagination";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { UserDto, UsersFilters } from "@/interface";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { DeleteUserModal } from "./DeleteUserModal";
import { ToggleActiveUserModal } from "./ToggleActiveUserModal";
import { AdminUsersPageHeader } from "./AdminUsersPageHeader";

export const AdminUsersContent = () => {
  const [filters, setFilters] = useState<UsersFilters>({
    search: undefined,
    role: undefined,
    status: undefined,
    trainerId: undefined,
    page: 1,
    limit: 20,
  });

  const debouncedSearch = useDebounce(filters.search || "", 300);

  const query = useMemo(() => {
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
      <AdminUsersPageHeader />
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
      {data?.meta && <Pagination meta={data.meta} onPageChange={(page) => handleFiltersChange({ page })} />}
      <DeleteUserModal
        user={deleteModalUser}
        isOpen={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
      <ToggleActiveUserModal
        user={toggleActiveUser}
        isOpen={!!toggleActiveUser}
        onClose={() => setToggleActiveUser(null)}
        onConfirm={confirmToggleActive}
        isUpdating={isUpdating}
      />
    </div>
  );
};
