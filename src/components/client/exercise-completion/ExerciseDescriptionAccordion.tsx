import type { ExerciseDescriptionAccordionProps } from "@/interface/exercise-completion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

export const ExerciseDescriptionAccordion = ({ description }: ExerciseDescriptionAccordionProps) => {
  return (
    <Card className="mb-8 px-6">
      <Accordion type="multiple" defaultValue={["description"]}>
        {description.description && (
          <AccordionItem value="description">
            <AccordionTrigger className="text-lg font-semibold">Opis</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm dark:prose-invert">{description.description}</div>
            </AccordionContent>
          </AccordionItem>
        )}
        {description.tips && (
          <AccordionItem value="tips">
            <AccordionTrigger className="text-lg font-semibold">Wskazówki</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm dark:prose-invert">{description.tips}</div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </Card>
  );
};
