import React, { useState } from "react";
import { useReasonsList } from "@/hooks/useReasonsList";
import { useCreateReason } from "@/hooks/useCreateReason";
import { useUpdateReason } from "@/hooks/useUpdateReason";
import { useDeleteReason } from "@/hooks/useDeleteReason";
import { ReasonsTable } from "./ReasonsTable";
import { CreateReasonModal } from "./CreateReasonModal";
import { EditReasonModal } from "./EditReasonModal";
import { DeleteReasonModal } from "./DeleteReasonModal";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import type { ReasonViewModel, CreateReasonFormData, UpdateReasonFormData } from "@/interface";

/**
 * Main content component for reasons list management
 * Handles all CRUD operations for standard reasons
 */
const ReasonsListContent: React.FC = () => {
  const { reasons, isLoading, error, refetch } = useReasonsList();

  const { mutateAsync: createReason, isPending: isCreating } = useCreateReason();
  const { mutateAsync: updateReason, isPending: isUpdating } = useUpdateReason();
  const { mutateAsync: deleteReason, isPending: isDeleting } = useDeleteReason();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ReasonViewModel | null>(null);
  const [deletingReason, setDeletingReason] = useState<ReasonViewModel | null>(null);

  const handleBackToDashboard = () => {
    window.location.href = "/admin";
  };

  const handleCreateClick = () => {
    setCreateModalOpen(true);
  };

  const handleEditClick = (reason: ReasonViewModel) => {
    setEditingReason(reason);
  };

  const handleDeleteClick = (reason: ReasonViewModel) => {
    setDeletingReason(reason);
  };

  const handleConfirmCreate = async (data: CreateReasonFormData) => {
    try {
      await createReason(data);
      setCreateModalOpen(false);
    } catch {
      // Error handling is done in hook via toast
    }
  };

  const handleConfirmEdit = async (data: UpdateReasonFormData) => {
    if (!editingReason) return;

    try {
      await updateReason({ id: editingReason.id, data });
      setEditingReason(null);
    } catch {
      // Error handling is done in hook via toast
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteReason(id);
      setDeletingReason(null);
    } catch {
      // Error handling is done in hook via toast
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Toaster />
        <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Zarządzanie powodami</h1>
            <p className="text-muted-foreground">Zarządzaj standardowymi powodami niewykonania ćwiczeń.</p>
          </div>
          <Button variant="outline" onClick={handleBackToDashboard} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Powrót do Dashboard
          </Button>
        </div>

        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
          <p className="font-semibold mb-2">Wystąpił błąd podczas ładowania powodów</p>
          <p className="text-sm mb-4">{error instanceof Error ? error.message : "Nieznany błąd"}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  const isEmpty = !isLoading && reasons.length === 0;

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header Section */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Zarządzanie powodami</h1>
          <p className="text-muted-foreground">
            Zarządzaj standardowymi powodami niewykonania ćwiczeń dostępnymi dla podopiecznych.
          </p>
        </div>
        <Button variant="outline" onClick={handleBackToDashboard} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do Dashboard
        </Button>
      </div>

      {/* Toolbar Section */}
      <div className="flex items-center justify-between md:px-0 px-4">
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj powód
          </Button>
        </div>
        {!isEmpty && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Łącznie: <span className="font-semibold">{reasons.length}</span>{" "}
            {reasons.length === 1 ? "powód" : "powodów"}
          </p>
        )}
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-semibold">Brak powodów niewykonania</h3>
            <p className="text-muted-foreground">
              Dodaj pierwszy powód, który podopieczni będą mogli wybierać podczas oznaczania ćwiczeń jako niewykonanych.
            </p>
            <Button onClick={handleCreateClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj pierwszy powód
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isEmpty && (
        <div className="md:px-0 px-4">
          <ReasonsTable reasons={reasons} isLoading={isLoading} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </div>
      )}

      {/* Modals */}
      <CreateReasonModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleConfirmCreate}
        isPending={isCreating}
      />

      <EditReasonModal
        reason={editingReason}
        isOpen={!!editingReason}
        onClose={() => setEditingReason(null)}
        onConfirm={handleConfirmEdit}
        isPending={isUpdating}
      />

      <DeleteReasonModal
        reason={deletingReason}
        isOpen={!!deletingReason}
        onCancel={() => setDeletingReason(null)}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </div>
  );
};

/**
 * Main page component for reasons management
 * Wrapped with QueryProvider for React Query
 */
export const ReasonsListPage: React.FC = () => {
  return (
    <QueryProvider>
      <ReasonsListContent />
    </QueryProvider>
  );
};
