import type { ProfileHeaderProps } from "@/interface";
import { UserAvatar } from "@/components/navigation/UserAvatar";
import { Badge } from "@/components/ui/badge";

function getRoleLabel(role: ProfileHeaderProps["role"]): string {
  if (role === "admin") return "Administrator";
  if (role === "trainer") return "Trener";
  return "Podopieczny";
}

export function ProfileHeader({ userId, firstName, lastName, role }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <UserAvatar userId={userId} firstName={firstName} lastName={lastName} size="xl" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {firstName} {lastName}
          </h1>
          <Badge variant="secondary">{getRoleLabel(role)}</Badge>
        </div>
      </div>
    </div>
  );
}
