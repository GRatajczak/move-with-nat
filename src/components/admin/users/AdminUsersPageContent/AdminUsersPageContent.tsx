import React, { useState, useMemo } from "react";
import { useUsersList } from "@/hooks/useUsersList";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useResendInvite } from "@/hooks/useResendInvite";
import { UsersFilterToolbar } from "../UsersFilterToolbar";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { UsersCards } from "@/components/admin/users/UsersCards";
import { Pagination } from "@/components/exercises/Pagination";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { UserDto, UsersFilters } from "@/interface";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { DeleteUserModal } from "./DeleteUserModal";
import { ToggleActiveUserModal } from "./ToggleActiveUserModal";
import { AdminUsersPageHeader } from "./AdminUsersPageHeader";
import { ErrorDisplay } from "./ErrorDisplay";

export const AdminUsersContent = () => {
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
    return <ErrorDisplay error={error} />;
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
        isOpen={!!deleteModalUser}
        user={deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <ToggleActiveUserModal
        isOpen={!!toggleActiveUser}
        user={toggleActiveUser}
        onClose={() => setToggleActiveUser(null)}
        onConfirm={confirmToggleActive}
        isUpdating={isUpdating}
      />
    </div>
  );
};
