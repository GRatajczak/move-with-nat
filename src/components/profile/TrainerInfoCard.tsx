import type { TrainerInfoCardProps } from "@/interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/navigation/UserAvatar";

export function TrainerInfoCard({ trainer }: TrainerInfoCardProps) {
  if (!trainer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Twój trener</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nie masz przypisanego trenera. Skontaktuj się z administratorem.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Twój trener</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <UserAvatar
            userId={trainer.id}
            firstName={trainer.firstName}
            lastName={trainer.lastName}
            size="lg"
          />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">
              {trainer.firstName} {trainer.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{trainer.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


