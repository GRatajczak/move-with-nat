import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlanActionMenu } from "./PlanActionMenu";
import type { PlanDetailHeaderProps } from "@/interface/plans";

export const PlanDetailHeader = ({
  plan,
  onEdit,
  onToggleVisibility,
  onDuplicate,
  onDelete,
}: PlanDetailHeaderProps) => {
  return (
    <div className="space-y-6">
      {/* Title and Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
            <Badge variant={plan.isHidden ? "secondary" : "default"} className="text-sm">
              {plan.isHidden ? "Ukryty" : "Widoczny"}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <PlanActionMenu
            plan={plan}
            onEdit={onEdit}
            onToggleVisibility={onToggleVisibility}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Client Info and Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Podopieczny</h3>
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">{plan.clientName || "—"}</p>
                {plan.clientId && (
                  <a
                    href={`/trainer/clients/${plan.clientId}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Zobacz profil →
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Informacje</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Data utworzenia:</span>
                <span className="font-medium">
                  {plan.createdAt
                    ? new Date(plan.createdAt).toLocaleString("pl-PL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ostatnia edycja:</span>
                <span className="font-medium">
                  {plan.updatedAt
                    ? new Date(plan.updatedAt).toLocaleString("pl-PL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Liczba ćwiczeń:</span>
                <span className="font-medium">{plan.exercises.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
