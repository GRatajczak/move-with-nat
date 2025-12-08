import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlanExerciseRow } from "./PlanExerciseRow";
import type { PlanExercisesListProps } from "@/interface/plans";

export const PlanExercisesList = ({
  exercises,
  onRemove,
  onUpdate,
  onReorder,
  disabled = false,
}: PlanExercisesListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex((ex) => ex.exerciseId === active.id);
      const newIndex = exercises.findIndex((ex) => ex.exerciseId === over.id);

      const reordered = arrayMove(exercises, oldIndex, newIndex);
      onReorder(reordered);

      // Announce to screen readers
      const announcement = `Ćwiczenie przeniesione z pozycji ${oldIndex + 1} na pozycję ${newIndex + 1}`;
      const liveRegion = document.getElementById("dnd-live-region");
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }
  };

  return (
    <>
      {/* ARIA live region for screen readers */}
      <div id="dnd-live-region" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={exercises.map((ex) => ex.exerciseId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <PlanExerciseRow
                key={exercise.exerciseId}
                exercise={exercise}
                index={index}
                onRemove={() => onRemove(index)}
                onUpdate={(updates) => onUpdate(index, updates)}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
};
