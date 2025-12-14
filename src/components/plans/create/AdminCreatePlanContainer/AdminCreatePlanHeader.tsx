import { ArrowLeft } from "lucide-react";

import { Breadcrumbs } from "../../../navigation/Breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import type { BreadcrumbsProps } from "@/interface/navigation";

export const AdminCreatePlanHeader = ({ breadcrumbs, baseUrl }: { breadcrumbs: BreadcrumbsProps; baseUrl: string }) => {
  return (
    <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
      <div className="flex flex-col space-y-2">
        <Breadcrumbs items={breadcrumbs.items} />
        <h1 className="text-3xl font-bold tracking-tight">Nowy plan treningowy</h1>
        <p className="text-muted-foreground">Stwórz nowy plan dla wybranego trenera i podopiecznego</p>
      </div>
      <a href={`${baseUrl}/plans`} className={buttonVariants({ variant: "outline", className: "gap-2" })}>
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy
      </a>
    </div>
  );
};
