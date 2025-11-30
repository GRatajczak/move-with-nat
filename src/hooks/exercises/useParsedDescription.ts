import { useMemo } from "react";

interface ParsedDescription {
  description: string;
  tips: string;
}

/**
 * Hook to parse exercise description field that may contain JSON or plain text
 * @param description - The description string (may be JSON or plain text)
 * @returns Parsed description object with description and tips fields
 */
export const useParsedDescription = (description?: string | null): ParsedDescription => {
  return useMemo(() => {
    const defaultValue: ParsedDescription = {
      description: "",
      tips: "",
    };

    if (!description) {
      return defaultValue;
    }

    try {
      // Check if description is JSON format
      if (description.startsWith("{")) {
        const parsed = JSON.parse(description);
        return {
          description: parsed.description || "",
          tips: parsed.tips || "",
        };
      } else {
        // Plain text format
        return {
          description: description,
          tips: "",
        };
      }
    } catch (error) {
      console.error("Failed to parse exercise description:", error);
      // Fallback to plain text on error
      return {
        description: description,
        tips: "",
      };
    }
  }, [description]);
};
