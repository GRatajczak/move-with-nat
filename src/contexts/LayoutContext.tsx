import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { LayoutContextType, SidebarState, BreadcrumbItem } from "../interface";

// Create context
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// Default sidebar state
const getDefaultSidebarState = (): SidebarState => ({
  isCollapsed: false,
  expandedSections: [],
});

// Load sidebar state from localStorage
function loadSidebarState(): SidebarState {
  if (typeof window === "undefined") {
    return getDefaultSidebarState();
  }

  try {
    const saved = localStorage.getItem("sidebar-state");
    return saved ? JSON.parse(saved) : getDefaultSidebarState();
  } catch (error) {
    console.warn("Unable to load sidebar state from localStorage:", error);
    return getDefaultSidebarState();
  }
}

// Save sidebar state to localStorage
function saveSidebarState(state: SidebarState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem("sidebar-state", JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save sidebar state to localStorage:", error);
    // Continue without persistence
  }
}

interface LayoutProviderProps {
  children: ReactNode;
  currentPath: string;
}

/**
 * Layout Provider component
 * Provides global state for layout (sidebar, breadcrumbs, etc.)
 */
export function LayoutProvider({ children, currentPath }: LayoutProviderProps) {
  const [sidebarState, setSidebarState] = useState<SidebarState>(loadSidebarState);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    saveSidebarState(sidebarState);
  }, [sidebarState]);

  // Close mobile sidebar when path changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentPath]);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarState((prev) => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  };

  // Toggle expanded section
  const toggleSection = (sectionId: string) => {
    setSidebarState((prev) => ({
      ...prev,
      expandedSections: prev.expandedSections.includes(sectionId)
        ? prev.expandedSections.filter((id) => id !== sectionId)
        : [...prev.expandedSections, sectionId],
    }));
  };

  // Mobile sidebar handlers
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const value: LayoutContextType = {
    sidebarState,
    toggleSidebar,
    toggleSection,
    isMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    currentPath,
    breadcrumbs,
    setBreadcrumbs,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

/**
 * Custom hook to access layout context
 *
 * @throws Error if used outside LayoutProvider
 * @returns LayoutContextType
 */
export function useLayoutContext(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within LayoutProvider");
  }
  return context;
}
