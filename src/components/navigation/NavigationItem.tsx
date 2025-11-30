import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import type { NavigationItemProps } from "../../interface";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

/**
 * Single navigation item component
 * Can be a simple link or an expandable section with submenu
 */
export function NavigationItem({
  item,
  isCollapsed,
  isActive,
  isExpanded = false,
  onToggleExpand,
}: NavigationItemProps) {
  const Icon = item.icon;
  // Item is treated as having children whenever nested items exist,
  // regardless of the optional `expandable` flag
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  // Base classes for the item
  const baseClasses = cn(
    "flex items-center gap-3 p-2 rounded-lg transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive && "bg-accent text-accent-foreground font-medium"
  );

  // Content of the item (icon + label + chevron)
  const content = (
    <>
      <Icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                item.badge.variant === "default" && "bg-muted text-muted-foreground",
                item.badge.variant === "warning" && "bg-yellow-100 text-yellow-800",
                item.badge.variant === "error" && "bg-red-100 text-red-800"
              )}
            >
              {item.badge.text}
            </span>
          )}
          {hasChildren && (
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")} />
          )}
        </>
      )}
    </>
  );

  // If collapsed, wrap in tooltip
  if (isCollapsed) {
    return (
      <li>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {hasChildren ? (
                <button
                  onClick={onToggleExpand}
                  className={cn(baseClasses, "w-full")}
                  aria-expanded={isExpanded}
                  aria-label={item.label}
                >
                  {content}
                </button>
              ) : (
                <a
                  href={item.href}
                  className={cn(baseClasses, "w-full")}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </a>
              )}
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.label}
              {item.badge && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-muted">{item.badge.text}</span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  }

  // Regular (not collapsed) item
  return (
    <li>
      {hasChildren ? (
        <button onClick={onToggleExpand} className={cn(baseClasses, "w-full text-left")} aria-expanded={isExpanded}>
          {content}
        </button>
      ) : (
        <a href={item.href} className={baseClasses} aria-current={isActive ? "page" : undefined}>
          {content}
        </a>
      )}
    </li>
  );
}
