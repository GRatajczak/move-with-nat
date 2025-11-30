import { useState, useEffect } from "react";

/**
 * Custom hook to detect media query matches for responsive behavior
 *
 * @param query - Media query string to match (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") {
      return;
    }

    try {
      const media = window.matchMedia(query);

      // Set initial value
      setMatches(media.matches);

      // Create listener for changes
      const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

      // Add event listener
      media.addEventListener("change", listener);

      // Cleanup
      return () => media.removeEventListener("change", listener);
    } catch (error) {
      console.error("Media query error:", error);
      // Fallback to safe default (assume mobile for safety)
      setMatches(true);
    }
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks for common use cases
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
