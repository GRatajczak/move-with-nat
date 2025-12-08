import type { ProfileContainerProps } from "@/interface";
import { useUser } from "@/hooks/useUser";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { TrainerInfoCard } from "@/components/profile/TrainerInfoCard";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { QueryProvider } from "@/components/QueryProvider";

function ProfileContent({ userId, userRole }: ProfileContainerProps) {
  const { data: user, isLoading, isError } = useUser(userId);
  const trainerId = user?.role === "client" ? (user.trainerId ?? null) : null;

  const {
    data: trainerData,
    isLoading: isTrainerLoading,
    isError: isTrainerError,
    refetch: refetchTrainer,
  } = useUser(trainerId ?? "", { enabled: !!trainerId });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-16 w-1/2 rounded-lg bg-muted animate-pulse" />
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
        {userRole === "client" && (
          <Card>
            <CardHeader>
              <CardTitle>Twój trener</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-14 w-full rounded-md bg-muted animate-pulse" />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Zmiana hasła</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    const message = "Wystąpił nieoczekiwany błąd";

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">Nie udało się załadować profilu</p>
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const trainerSection = (() => {
    if (userRole !== "client") return null;

    if (!user.trainerId) {
      return <TrainerInfoCard trainer={null} />;
    }

    if (isTrainerLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Twój trener</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-14 w-full rounded-md bg-muted animate-pulse" />
          </CardContent>
        </Card>
      );
    }

    if (isTrainerError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Twój trener</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-3 py-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Nie udało się pobrać danych trenera</p>
              <Button variant="outline" size="sm" onClick={() => refetchTrainer()}>
                Spróbuj ponownie
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <TrainerInfoCard
        trainer={
          trainerData
            ? {
                id: trainerData.id,
                firstName: trainerData.firstName ?? "",
                lastName: trainerData.lastName ?? "",
                email: trainerData.email,
              }
            : null
        }
      />
    );
  })();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ProfileHeader
        userId={user.id}
        firstName={user.firstName ?? ""}
        lastName={user.lastName ?? ""}
        role={user.role}
      />

      <Card>
        <CardHeader>
          <CardTitle>Podstawowe informacje</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            userId={user.id}
            initialData={{
              firstName: user.firstName ?? "",
              lastName: user.lastName ?? "",
              email: user.email,
              phone: user.phone ?? "",
              dateOfBirth: user.dateOfBirth ?? "",
              status: user.status,
            }}
          />
        </CardContent>
      </Card>

      {trainerSection}

      <Card>
        <CardHeader>
          <CardTitle>Zmiana hasła</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="change-password">
              <AccordionTrigger>Kliknij aby zmienić hasło</AccordionTrigger>
              <AccordionContent>
                <ChangePasswordForm />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileContainer(props: ProfileContainerProps) {
  return (
    <QueryProvider>
      <ProfileContent userId={props.userId} userRole={props.userRole} />
    </QueryProvider>
  );
}
