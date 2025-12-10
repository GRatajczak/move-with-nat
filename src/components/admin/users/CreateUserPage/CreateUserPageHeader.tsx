import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { CreateUserPageHeaderProps } from "@/interface";

export const CreateUserPageHeader = ({ onCancel }: CreateUserPageHeaderProps) => {
  return (
    <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dodaj użytkownika</h1>
        <p className="text-muted-foreground">
          Utwórz nowe konto użytkownika. Link aktywacyjny zostanie wysłany na podany adres email.
        </p>
      </div>
      <Button variant="outline" onClick={onCancel} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy
      </Button>
    </div>
  );
};
