// src/hooks/plans/useDuplicatePlan.test.ts

import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDuplicatePlan } from "../../../../hooks/plans/useDuplicatePlan";
import { NotFoundError, ValidationError } from "../../../../lib/errors";
import { toast } from "sonner";
import type { DuplicatePlanData, PlanViewModel } from "../../../../interface/plans";

// Mock dependencies
global.fetch = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useDuplicatePlan", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Successful Plan Duplication", () => {
    it("should duplicate plan with new name and client", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: "Original description",
        trainerId: "trainer-123",
        clientId: "client-old",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: 50,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-new",
        isHidden: true,
      };

      const newPlan = {
        id: "new-plan-456",
        name: "Duplicated Plan",
        clientId: "client-new",
      };

      // Mock fetch for both GET (original plan) and POST (create new plan)
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newPlan,
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      const duplicatedPlan = await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      // First call: fetch original plan
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/plans/${originalPlanId}`, {
        headers: { "Content-Type": "application/json" },
      });

      // Second call: create new plan
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "/api/plans",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      expect(duplicatedPlan.id).toBe("new-plan-456");
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should preserve original plan exercises in duplicated plan", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 4,
            reps: 12,
            tempo: "3-1-2",
            defaultWeight: 60,
            exercise: {
              id: "exercise-1",
              name: "Squat",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
          {
            id: "ex-2",
            exerciseId: "exercise-2",
            sortOrder: 2,
            sets: 3,
            reps: 10,
            tempo: "2-0-2",
            defaultWeight: null,
            exercise: {
              id: "exercise-2",
              name: "Push-up",
              vimeoToken: "456",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      const createCallBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);

      expect(createCallBody.exercises).toHaveLength(2);
      expect(createCallBody.exercises[0]).toEqual({
        exerciseId: "exercise-1",
        sortOrder: 1,
        sets: 4,
        reps: 12,
        tempo: "3-1-2",
        defaultWeight: 60,
      });
      expect(createCallBody.exercises[1]).toEqual({
        exerciseId: "exercise-2",
        sortOrder: 2,
        sets: 3,
        reps: 10,
        tempo: "2-0-2",
        defaultWeight: null,
      });
    });

    it("should preserve original trainerId in duplicated plan", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-999",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      const createCallBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);
      expect(createCallBody.trainerId).toBe("trainer-999");
    });

    it("should preserve original description in duplicated plan", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: "Original detailed description",
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      const createCallBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);
      expect(createCallBody.description).toBe("Original detailed description");
    });

    it("should handle null description in original plan", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      const createCallBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);
      expect(createCallBody.description).toBe("");
    });

    it("should show success toast on successful duplication", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Plan zduplikowany");
      });
    });

    it("should invalidate plans list cache on success", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["plans", "list"] });
      });
    });
  });

  describe("Error Handling - Original Plan Not Found", () => {
    it("should throw NotFoundError when original plan doesn't exist", async () => {
      // Arrange
      const nonExistentPlanId = "non-existent-plan";
      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId: nonExistentPlanId, data: duplicateData })).rejects.toThrow(
        NotFoundError
      );
    });

    it("should show error toast when original plan not found", async () => {
      // Arrange
      const nonExistentPlanId = "non-existent-plan";
      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId: nonExistentPlanId, data: duplicateData });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zduplikować planu");
      });
    });
  });

  describe("Error Handling - Create New Plan Fails", () => {
    it("should throw ValidationError when new plan data is invalid", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "AB", // Too short
        clientId: "client-456",
        isHidden: false,
      };

      // First fetch succeeds, second (create) fails
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: "Validation failed",
            details: { name: ["Name too short"] },
          }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId: originalPlanId, data: duplicateData })).rejects.toThrow(
        ValidationError
      );
    });

    it("should show error toast when plan creation fails", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: "Server error" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zduplikować planu");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle plan with no exercises", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });

      // This might fail validation, but we test that the duplication process works
      try {
        await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });
      } catch {
        // Expected - empty exercises should fail validation
      }

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle exercises with null defaultWeight", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
            exercise: {
              id: "exercise-1",
              name: "Exercise 1",
              vimeoToken: "123",
              description: "",
              defaultWeight: null,
              isHidden: false,
              tempo: null,
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      const createCallBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);
      expect(createCallBody.exercises[0].defaultWeight).toBeNull();
    });

    it("should handle plan with many exercises", async () => {
      // Arrange
      const originalPlanId = "original-plan-123";
      const manyExercises = Array.from({ length: 20 }, (_, i) => ({
        id: `ex-${i}`,
        exerciseId: `exercise-${i}`,
        sortOrder: i + 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: i * 10,
        exercise: {
          id: `exercise-${i}`,
          name: `Exercise ${i}`,
          vimeoToken: `${i}`,
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      }));

      const originalPlan: PlanViewModel = {
        id: originalPlanId,
        name: "Original Plan",
        description: null,
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: manyExercises,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      const duplicateData: DuplicatePlanData = {
        name: "Duplicated Plan",
        clientId: "client-456",
        isHidden: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => originalPlan,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-plan-456" }),
        });

      // Act
      const { result } = renderHook(() => useDuplicatePlan(), { wrapper });
      await result.current.mutateAsync({ planId: originalPlanId, data: duplicateData });

      // Assert
      const createCallBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);
      expect(createCallBody.exercises).toHaveLength(20);
    });
  });
});
