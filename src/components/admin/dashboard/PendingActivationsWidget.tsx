import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRowItem } from "./UserRowItem";
import type { UserDto } from "@/interface";
import type { UserRole } from "@/types/db";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PendingActivationsWidgetProps {
  users: UserDto[];
  isLoading?: boolean;
}

export const PendingActivationsWidget = ({ users, isLoading = false }: PendingActivationsWidgetProps) => {
  const [resendingId, setResendingId] = useState<string | null>(null);

  const onResendInvite = async (email: string, role: UserRole) => {
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, role, resend: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Błąd wysyłania zaproszenia");
      }

      toast.success("Zaproszenie zostało wysłane ponownie");
    } catch (error) {
      console.error("Resend invite error:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas wysyłania zaproszenia");
    }
  };

  const handleResend = async (user: UserDto) => {
    setResendingId(user.id);
    await onResendInvite(user.email, user.role as UserRole);
    setResendingId(null);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Oczekujące aktywacje</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </li>
            ))}
          </ul>
        ) : users.length > 0 ? (
          <ul className="flex flex-col">
            {users.map((user) => (
              <UserRowItem key={user.id} user={user}>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  disabled={resendingId === user.id}
                  onClick={() => handleResend(user)}
                >
                  {resendingId === user.id ? (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    "Wyślij ponownie"
                  )}
                </Button>
              </UserRowItem>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-8">Brak oczekujących aktywacji</div>
        )}
      </CardContent>
    </Card>
  );
};
