import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePlan } from "./usePlan";
import { usePlanCompletion } from "./usePlanCompletion";
import type {
  CompletionStatus,
  ExerciseDescription,
  ExerciseMeta,
  ReasonFormValues,
} from "@/interface/exercise-completion";
import type { PlanExerciseDto, ExerciseCompletionRecord } from "@/interface/plans";
import { plansKeys } from "../queryKeys";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";

interface UseExerciseCompletionProps {
  planId: string;
  exerciseId: string;
}

interface UseExerciseCompletionResult {
  exerciseData: {
    name: string;
    videoId: string;
    meta: ExerciseMeta;
    description: ExerciseDescription;
  } | null;
  completionStatus: CompletionStatus;
  isLoading: boolean;
  error: Error | null;
  markCompletion: (data: { completed: boolean } & ReasonFormValues) => void;
  isUpdating: boolean;
}

export function useExerciseCompletion({ planId, exerciseId }: UseExerciseCompletionProps): UseExerciseCompletionResult {
  const queryClient = useQueryClient();
  const { data: plan, isLoading: isPlanLoading, error: planError } = usePlan(planId);
  const { data: completionData, isLoading: isCompletionLoading, error: completionError } = usePlanCompletion(planId);

  // Find the specific exercise in the plan
  const planExercise = useMemo(() => {
    if (!plan) return null;
    return plan.exercises.find((e: PlanExerciseDto) => e.exerciseId === exerciseId);
  }, [plan, exerciseId]);

  // Find completion record
  const completionRecord = useMemo(() => {
    if (!completionData) return null;
    return completionData.completionRecords.find((r) => r.exerciseId === exerciseId);
  }, [completionData, exerciseId]);

  // Derive UI data
  const exerciseData = useMemo(() => {
    if (!planExercise || !planExercise.exercise) return null;

    const { exercise } = planExercise;

    return {
      name: exercise.name,
      videoId: exercise.vimeoToken, // Assuming vimeoToken is the video ID
      meta: {
        sets: planExercise.sets,
        reps: planExercise.reps,
        weight: planExercise.defaultWeight ?? exercise.defaultWeight ?? undefined, // Fallback to undefined if null
        tempo: planExercise.tempo ?? exercise.tempo ?? undefined, // Fallback to undefined if null
      },
      description: ((): ExerciseDescription => {
        const desc = exercise.description || "";
        try {
          if (desc.startsWith("{")) {
            const parsed = JSON.parse(desc);
            return {
              description: typeof parsed.description === "string" ? parsed.description : undefined,
              tips: typeof parsed.tips === "string" ? parsed.tips : undefined,
            };
          }
        } catch (error) {
          console.warn("Failed to parse exercise description", error);
        }

        return {
          description: exercise.description || undefined,
        };
      })(),
    };
  }, [planExercise]);

  const completionStatus: CompletionStatus = useMemo(() => {
    if (!completionRecord) {
      return { completed: null };
    }
    return {
      completed: completionRecord.isCompleted,
      reason:
        completionRecord.customReason ||
        (completionRecord.reasonId ? "Reason ID: " + completionRecord.reasonId : undefined), // We might need to fetch reason label if only ID is here.
      // Ideally completionRecord would include the expanded reason label or we need to look it up from useReasonsList.
      // For now, simple mapping.
    };
  }, [completionRecord]);

  // Mutation
  const mutation = useMutation({
    mutationFn: async (payload: { completed: boolean } & ReasonFormValues) => {
      const response = await fetch(`/api/plans/${planId}/exercises/${exerciseId}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update completion status");
      }

      return response.json();
    },
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: plansKeys.completion(planId) });

      // Snapshot previous value
      const previousCompletion = queryClient.getQueryData(plansKeys.completion(planId));

      // Optimistically update
      queryClient.setQueryData(
        plansKeys.completion(planId),
        (old: { completionRecords: ExerciseCompletionRecord[] } | undefined) => {
          if (!old) return old;
          const newRecords = old.completionRecords.filter((r) => r.exerciseId !== exerciseId);
          newRecords.push({
            planId,
            exerciseId,
            isCompleted: newStatus.completed,
            reasonId: newStatus.reasonId || null,
            customReason: newStatus.customReason || null,
            completedAt: new Date().toISOString(),
          });
          return {
            ...old,
            completionRecords: newRecords,
          };
        }
      );

      return { previousCompletion };
    },
    onError: (err, newStatus, context) => {
      queryClient.setQueryData(plansKeys.completion(planId), context?.previousCompletion);
      toast.error("Nie udało się zapisać statusu. Spróbuj ponownie.");
    },
    onSuccess: () => {
      // toast.success("Status zapisany"); // Optional, maybe too noisy
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: plansKeys.completion(planId) });
      queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) }); // Refresh plan progress
    },
  });

  const markCompletion = useCallback(
    (data: { completed: boolean } & ReasonFormValues) => {
      mutation.mutate(data);
    },
    [mutation]
  );

  return {
    exerciseData,
    completionStatus,
    isLoading: isPlanLoading || isCompletionLoading,
    error: (planError as Error) || (completionError as Error),
    markCompletion,
    isUpdating: mutation.isPending,
  };
}
