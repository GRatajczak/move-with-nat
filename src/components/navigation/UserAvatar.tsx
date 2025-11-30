import { cn } from "../../lib/utils";
import type { UserAvatarProps } from "../../interface";

function getInitials(firstName: string, lastName: string): string {
  if (!firstName && !lastName) return "?";

  const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";

  return `${firstInitial}${lastInitial}` || "?";
}

function getColorFromId(userId: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * User avatar component with initials
 * Background color is generated based on userId for consistency
 */
export function UserAvatar({ userId, firstName, lastName, size = "md", imageUrl }: UserAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const bgColor = getColorFromId(userId);

  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };

  if (imageUrl) {
    // Future feature: display actual image
    return (
      <img
        src={imageUrl}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover", sizeClasses[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-semibold shrink-0",
        bgColor,
        sizeClasses[size]
      )}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
