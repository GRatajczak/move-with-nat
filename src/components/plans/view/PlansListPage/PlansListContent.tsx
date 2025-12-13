import { useState, useEffect } from "react";
import { useTrainerPlans } from "@/hooks/plans/useTrainerPlans";
import { useDeletePlan } from "@/hooks/plans/useDeletePlan";
import { useTogglePlanVisibility } from "@/hooks/plans/useTogglePlanVisibility";
import { useDuplicatePlan } from "@/hooks/plans/useDuplicatePlan";
import { PlansFilterToolbar } from "../PlansFilterToolbar";
import { PlansTable } from "../PlansTable";
import { PlanCards } from "../PlanCards";
import { Pagination } from "../../../exercises/Pagination";
import { DeletePlanConfirmationModal } from "../../edit/DeletePlanConfirmationModal";
import { DuplicatePlanModal } from "../../edit/DuplicatePlanModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import type { PlanViewModel, ListPlansQuery, DuplicatePlanData } from "@/interface/plans";
import type { PaginatedResponse } from "@/interface/common";

export const PlansListContent = ({
  userRole = "trainer",
  userId,
}: {
  userRole: "admin" | "trainer";
  userId: string;
}) => {
  const baseUrl = `/${userRole}`;
  // URL state management
  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [clientId, setClientId] = useState<string | null>(searchParams.get("clientId") || null);
  const [visible, setVisible] = useState<boolean | null>(() => {
    const visibleParam = searchParams.get("visible");
    if (visibleParam === "true") return false; // isHidden = false
    if (visibleParam === "false") return true; // isHidden = true
    return null;
  });
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "created_at");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const debouncedSearch = useDebounce(search, 300);

  // Modals state
  const [deleteModalPlan, setDeleteModalPlan] = useState<PlanViewModel | null>(null);
  const [duplicateModalPlan, setDuplicateModalPlan] = useState<PlanViewModel | null>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Build query
  const query: ListPlansQuery = {
    search: debouncedSearch || undefined,
    clientId: clientId || undefined,
    trainerId: userId || undefined,
    visible: visible !== null ? !visible : undefined, // Convert isHidden to visible
    sortBy: sortBy as "created_at",
    page,
    limit: 10,
  };

  // Fetch data
  const { data, isLoading, error } = useTrainerPlans(query) as {
    data: PaginatedResponse<PlanViewModel> | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  const { mutateAsync: deletePlan, isPending: isDeleting } = useDeletePlan();
  const { mutateAsync: toggleVisibility } = useTogglePlanVisibility();
  const { mutateAsync: duplicatePlan, isPending: isDuplicating } = useDuplicatePlan();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (clientId) params.set("clientId", clientId);
    if (visible !== null) params.set("visible", String(!visible)); // Convert isHidden to visible
    if (sortBy !== "created_at") params.set("sortBy", sortBy);
    if (page !== 1) params.set("page", String(page));

    const newUrl = params.toString() ? `?${params}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [debouncedSearch, clientId, visible, sortBy, page]);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page
  };

  const handleClientChange = (value: string | null) => {
    setClientId(value);
    setPage(1);
  };

  const handleVisibilityChange = (value: boolean | null) => {
    setVisible(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setClientId(null);
    setVisible(null);
    setSortBy("created_at");
    setPage(1);
  };

  const handleCreateClick = () => {
    window.location.href = `${baseUrl}/plans/new`;
  };

  const handleRowClick = (planId: string) => {
    window.location.href = `${baseUrl}/plans/${planId}`;
  };

  const handleEdit = (planId: string) => {
    window.location.href = `${baseUrl}/plans/${planId}/edit`;
  };

  const handleToggleVisibility = async (planId: string, isHidden: boolean) => {
    try {
      await toggleVisibility({ planId, isHidden });
    } catch {
      // Error is handled by React Query
    }
  };

  const handleDuplicateClick = (planId: string) => {
    const plan = data?.data.find((p: PlanViewModel) => p.id === planId);
    if (plan) setDuplicateModalPlan(plan);
  };

  const handleConfirmDuplicate = async (data: DuplicatePlanData) => {
    if (!duplicateModalPlan) return;

    try {
      await duplicatePlan({ planId: duplicateModalPlan.id, data });
      setDuplicateModalPlan(null);
    } catch {
      // Error is handled by React Query
    }
  };

  const handleDeleteClick = (planId: string) => {
    const plan = data?.data.find((p: PlanViewModel) => p.id === planId);
    if (plan) setDeleteModalPlan(plan);
  };

  const handleConfirmDelete = async (planId: string, hard: boolean) => {
    try {
      await deletePlan({ planId, hard });
      setDeleteModalPlan(null);
    } catch {
      // Error is handled by React Query
    }
  };

  const hasActiveFilters = search !== "" || clientId !== null || visible !== null || sortBy !== "created_at";

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Wystąpił błąd podczas ładowania planów: {error instanceof Error ? error.message : "Nieznany błąd"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Plany treningowe</h1>
          <p className="text-muted-foreground">Zarządzaj planami treningowymi dla swoich podopiecznych.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = baseUrl)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={handleCreateClick} className="gap-2" data-testid="create-plan-button">
            <Plus className="h-4 w-4" />
            Stwórz plan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <PlansFilterToolbar
        search={search}
        onSearchChange={handleSearchChange}
        clientId={clientId}
        onClientChange={handleClientChange}
        visible={visible}
        onVisibilityChange={handleVisibilityChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        isLoading={isLoading}
      />

      {/* Table or Cards */}
      {isDesktop ? (
        <PlansTable
          plans={data?.data || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onToggleVisibility={handleToggleVisibility}
          onDuplicate={handleDuplicateClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <PlanCards
          plans={data?.data || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onToggleVisibility={handleToggleVisibility}
          onDuplicate={handleDuplicateClick}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Pagination */}
      {data && data.meta && <Pagination meta={data.meta} onPageChange={setPage} itemLabel="planów treningowych" />}

      {/* Modals */}
      <DeletePlanConfirmationModal
        isOpen={!!deleteModalPlan}
        plan={deleteModalPlan}
        onClose={() => setDeleteModalPlan(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <DuplicatePlanModal
        isOpen={!!duplicateModalPlan}
        plan={duplicateModalPlan}
        onClose={() => setDuplicateModalPlan(null)}
        onConfirm={handleConfirmDuplicate}
        isSubmitting={isDuplicating}
        userRole={userRole}
      />
    </div>
  );
};
