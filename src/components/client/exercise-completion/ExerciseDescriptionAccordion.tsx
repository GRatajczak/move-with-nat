import type { ExerciseDescriptionAccordionProps } from "@/interface/exercise-completion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const ExerciseDescriptionAccordion = ({ description }: ExerciseDescriptionAccordionProps) => {
  return (
    <Accordion type="multiple" className="mb-8" defaultValue={["description"]}>
      {description.description && (
        <AccordionItem value="description">
          <AccordionTrigger>Opis</AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm dark:prose-invert">{description.description}</div>
          </AccordionContent>
        </AccordionItem>
      )}
      {description.tips && (
        <AccordionItem value="tips">
          <AccordionTrigger>Wskazówki</AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm dark:prose-invert">{description.tips}</div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
};
