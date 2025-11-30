import { useLayoutContext } from "../../contexts/LayoutContext";
import { isItemActive } from "../../config/navigation.config";
import type { NavigationListProps } from "../../interface";
import { NavigationItem } from "./NavigationItem";

export function NavigationList({ items, isCollapsed, currentPath }: NavigationListProps) {
  const { sidebarState, toggleSection } = useLayoutContext();

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isItemActive(item, currentPath);
        const expanded = sidebarState.expandedSections.includes(item.id);
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={item.id}>
            <NavigationItem
              item={item}
              isCollapsed={isCollapsed}
              isActive={active && !hasChildren}
              isExpanded={expanded}
              onToggleExpand={hasChildren ? () => toggleSection(item.id) : undefined}
            />

            {/* Render children if expanded and not collapsed */}
            {hasChildren && expanded && !isCollapsed && item.children && (
              <ul className="mt-1 ml-8 space-y-1 border-l border-border pl-3">
                {item.children.map((child) => (
                  <NavigationItem
                    key={child.id}
                    item={child}
                    isCollapsed={isCollapsed}
                    isActive={isItemActive(child, currentPath)}
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </ul>
  );
}
