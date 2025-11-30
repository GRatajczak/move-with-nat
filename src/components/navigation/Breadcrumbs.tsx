import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { BreadcrumbItem, BreadcrumbsProps } from "../../interface";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

/**
 * Truncate label if longer than maxLength
 */
function truncateLabel(label: string, maxLength = 30): { display: string; full: string } {
  if (label.length <= maxLength) {
    return { display: label, full: label };
  }
  return {
    display: label.slice(0, maxLength - 3) + "...",
    full: label,
  };
}

/**
 * Collapse breadcrumbs if more than 4 levels
 * Show first, ellipsis, and last two
 */
function collapseBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  if (items.length <= 4) return items;

  return [items[0], { label: "...", href: undefined }, ...items.slice(-2)];
}

/**
 * Breadcrumb navigation component
 * Shows hierarchical path of current location
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const displayItems = collapseBreadcrumbs(items);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      <ol className="flex items-center gap-1 text-sm">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === "...";
          const { display, full } = truncateLabel(item.label);
          const needsTooltip = display !== full;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}

              {isEllipsis ? (
                <span className="text-muted-foreground px-2">...</span>
              ) : isLast ? (
                <span className="font-medium text-foreground truncate max-w-[200px]" aria-current="page">
                  {display}
                </span>
              ) : needsTooltip ? (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={item.href}
                        className={cn(
                          "text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 -mx-1"
                        )}
                      >
                        {display}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{full}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 -mx-1"
                  )}
                >
                  {display}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
