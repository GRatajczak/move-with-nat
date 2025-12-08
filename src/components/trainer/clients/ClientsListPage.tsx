import { useState, useEffect } from "react";
import { useClientsQuery } from "@/hooks/clients/useClientsQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ClientsFilterToolbar } from "./ClientsFilterToolbar";
import { ClientsTable } from "./ClientsTable";
import { ClientsCards } from "./ClientsCards";
import { Pagination } from "../../exercises/Pagination";
import { QueryProvider } from "../../QueryProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import type { ClientDto, ClientsPageQuery, ClientStatus } from "@/interface/clients";
import type { PaginatedResponse } from "@/interface/common";

const ClientsListContent = () => {
  // URL state management
  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<ClientStatus | undefined>(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && ["active", "pending", "suspended"].includes(statusParam)) {
      return statusParam as ClientStatus;
    }
    return undefined;
  });
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 20;

  const debouncedSearch = useDebounce(search, 300);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Build query
  const query: ClientsPageQuery = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit,
  };

  // Fetch data
  const { data, isLoading, error } = useClientsQuery(query) as {
    data: PaginatedResponse<ClientDto> | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (page !== 1) params.set("page", String(page));

    const newUrl = params.toString() ? `?${params}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [debouncedSearch, status, page]);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleStatusChange = (value: ClientStatus | undefined) => {
    setStatus(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus(undefined);
    setPage(1);
  };

  const handleRowClick = (client: ClientDto) => {
    window.location.href = `/trainer/clients/${client.id}`;
  };

  const handleCreatePlan = (client: ClientDto) => {
    window.location.href = `/trainer/plans/new?clientId=${client.id}`;
  };

  const handleCreateClient = () => {
    window.location.href = "/trainer/clients/new";
  };

  const hasActiveFilters = search !== "" || status !== undefined;

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>
          Wystąpił błąd podczas ładowania listy podopiecznych:{" "}
          {error instanceof Error ? error.message : "Nieznany błąd"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  // Empty state when no clients at all (without filters)
  if (!isLoading && data?.data.length === 0 && !hasActiveFilters) {
    return (
      <div className="space-y-6">
        <Toaster />

        {/* Header */}
        <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Moi Podopieczni</h1>
            <p className="text-muted-foreground">Zarządzaj swoimi podopiecznymi i śledź ich postępy.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateClient} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj podopiecznego
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/trainer")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground mb-2">Brak przypisanych podopiecznych</p>
          <p className="text-sm text-muted-foreground">Możesz dodać nowego podopiecznego klikając przycisk powyżej.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Moi Podopieczni</h1>
          <p className="text-muted-foreground">Zarządzaj swoimi podopiecznymi i śledź ich postępy.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateClient} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj podopiecznego
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/trainer")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ClientsFilterToolbar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        isLoading={isLoading}
      />

      {/* Table or Cards */}
      {isDesktop ? (
        <ClientsTable
          clients={data?.data || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onCreatePlan={handleCreatePlan}
        />
      ) : (
        <ClientsCards
          clients={data?.data || []}
          isLoading={isLoading}
          onCardClick={handleRowClick}
          onCreatePlan={handleCreatePlan}
        />
      )}

      {/* Pagination */}
      {data && data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
};

export const ClientsListPage = () => {
  return (
    <QueryProvider>
      <ClientsListContent />
    </QueryProvider>
  );
};
