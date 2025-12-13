import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ClientPlanCardProps } from "@/interface/client-dashboard";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

/**
 * Progress bar component for plan completion
 */
function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Postęp</span>
        <span className="font-medium">
          {value} / {max} ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            percentage === 100 ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Trainer info chip component
 */
function TrainerInfoChip({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">{name}</span>
    </div>
  );
}

/**
 * Plan card component for client dashboard
 * Displays a single plan with progress, trainer info, and creation date
 */
export function PlanCard({ plan }: ClientPlanCardProps) {
  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(plan.createdAt);

  const isCompleted = plan.progressValue === plan.progressMax && plan.progressMax > 0;
  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => {
        window.location.href = `/client/plans/${plan.id}`;
      }}
      role="link"
      aria-label={`Zobacz plan ${plan.name}`}
      data-testid="client-plan-card"
      data-plan-id={plan.id}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className="line-clamp-2 group-hover:text-primary transition-colors text-lg font-semibold"
            data-testid="plan-card-title"
          >
            {plan.name}
          </CardTitle>
          {isCompleted && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 shrink-0">
              Ukończony
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {plan.descriptionExcerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">{plan.descriptionExcerpt}</p>
        )}

        <ProgressBar value={plan.progressValue} max={plan.progressMax} />

        <div className="flex items-center justify-between gap-4 pt-2">
          <TrainerInfoChip name={plan.trainerName} avatar={plan.trainerAvatar} />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
