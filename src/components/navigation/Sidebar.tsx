import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { getNavigationForRole } from "../../config/navigation.config";
import type { SidebarProps } from "../../interface";
import { NavigationList } from "./NavigationList";
import { CollapseToggle } from "./CollapseToggle";
import { Button } from "../ui/button";

export function Sidebar({ role, isCollapsed, onToggle, isMobileOpen, onMobileClose, currentPath }: SidebarProps) {
  const navigationItems = getNavigationForRole(role);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
          // Desktop behavior
          "lg:relative lg:z-auto",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile behavior
          "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo section */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <a href="/" className="w-full flex items-center justify-center">
            <img src="/nata-logo.svg" alt="Nata Logo" className="w-16 h-auto" />
          </a>

          {/* Mobile close button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileClose} aria-label="Zamknij menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Nawigacja główna">
          <NavigationList items={navigationItems} isCollapsed={isCollapsed} currentPath={currentPath} />
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block border-t border-border p-2">
          <CollapseToggle isCollapsed={isCollapsed} onToggle={onToggle} />
        </div>
      </aside>
    </>
  );
}
