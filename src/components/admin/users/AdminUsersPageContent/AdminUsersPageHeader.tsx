import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const AdminUsersPageHeader = () => {
  return (
    <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Użytkownicy</h1>
        <p className="text-muted-foreground">
          Zarządzaj użytkownikami systemu (administratorzy, trenerzy, podopieczni).
        </p>
      </div>
      <a href="/admin" className={buttonVariants({ variant: "outline", className: "gap-2" })}>
        <ArrowLeft className="h-4 w-4" />
        Powrót do Dashboard
      </a>
    </div>
  );
};
