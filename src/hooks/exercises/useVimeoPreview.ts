import { useState, useEffect } from "react";
import { useDebounce } from "../useDebounce";

export function useVimeoPreview(videoId: string | null) {
  const debouncedVideoId = useDebounce(videoId, 500);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!debouncedVideoId) {
      setIsValid(null);
      return;
    }

    setIsLoading(true);

    // Simple validation: check if ID is not empty
    // More advanced: could check Vimeo API (requires API key) but here we just check format
    // Vimeo IDs are usually numeric, but can be alphanumeric in some contexts
    const isValidFormat = /^[a-zA-Z0-9]+$/.test(debouncedVideoId);

    // Simulate network check delay if needed, or just set immediately
    // Here we just validate format locally for now as per plan
    setIsValid(isValidFormat);
    setIsLoading(false);
  }, [debouncedVideoId]);

  return {
    isValid,
    isLoading: videoId !== debouncedVideoId || isLoading,
  };
}
