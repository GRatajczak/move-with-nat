import type { ClientPlanCardsGridProps } from "@/interface/client-dashboard";
import { PlanCard } from "./PlanCard";

/**
 * Grid wrapper for plan cards
 * Responsive layout: 1 column on mobile, 2 on tablet, 3 on desktop
 */
export function PlanCardsGrid({ plans }: ClientPlanCardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
