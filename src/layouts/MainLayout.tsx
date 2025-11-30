import { useEffect } from "react";
import { LayoutProvider, useLayoutContext } from "../contexts/LayoutContext";
import { Sidebar } from "../components/navigation/Sidebar";
import { TopBar } from "../components/navigation/TopBar";
import { useBreadcrumbs } from "../hooks/useBreadcrumbs";
import { useIsMobile } from "../hooks/useMediaQuery";
import { toast } from "sonner";
import type { MainLayoutProps } from "../interface";

function MainLayoutContent({ children, user, requiredRole }: Omit<MainLayoutProps, "currentPath">) {
  const {
    sidebarState,
    toggleSidebar,
    isMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    currentPath,
    breadcrumbs,
    setBreadcrumbs,
  } = useLayoutContext();

  const isMobile = useIsMobile();
  const generatedBreadcrumbs = useBreadcrumbs(currentPath, user.role);

  // Update breadcrumbs when path changes
  useEffect(() => {
    setBreadcrumbs(generatedBreadcrumbs);
  }, [generatedBreadcrumbs, setBreadcrumbs]);

  // Role enforcement
  useEffect(() => {
    if (!requiredRole) return;

    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard
      const dashboardPath = `/${user.role}`;
      window.location.href = dashboardPath;
      toast.error("Nie masz dostępu do tego zasobu");
    }
  }, [user.role, requiredRole]);

  // Handle logout
  const handleLogout = async () => {
    try {
      // TODO: Implement actual logout logic with Supabase
      // await supabase.auth.signOut();

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("sidebar-state");
      }

      // Redirect to login
      window.location.href = "/login";
      toast.success("Wylogowano pomyślnie");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Błąd podczas wylogowania");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        role={user.role}
        isCollapsed={sidebarState.isCollapsed && !isMobile}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
        currentPath={currentPath}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar breadcrumbs={breadcrumbs} user={user} onLogout={handleLogout} onMobileMenuOpen={openMobileSidebar} />
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function MainLayout({ children, user, currentPath, requiredRole }: MainLayoutProps) {
  return (
    <LayoutProvider currentPath={currentPath}>
      <MainLayoutContent user={user} requiredRole={requiredRole}>
        {children}
      </MainLayoutContent>
    </LayoutProvider>
  );
}
