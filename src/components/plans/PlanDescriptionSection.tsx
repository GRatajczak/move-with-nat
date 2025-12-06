import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

export const PlanDescriptionSection = ({ description }: { description?: string | null }) => {
  if (!description || description.trim() === "") {
    return null; // Don't render if no description
  }

  return (
    <Card>
      <Accordion type="single" collapsible defaultValue="description">
        <AccordionItem value="description" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <h3 className="text-lg font-semibold">Opis planu</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
