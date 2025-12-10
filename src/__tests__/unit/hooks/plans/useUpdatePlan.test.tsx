// src/hooks/plans/useUpdatePlan.test.ts

import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdatePlan } from "../../../../hooks/plans/useUpdatePlan";
import { ValidationError } from "../../../../lib/errors";
import { toast } from "sonner";
import type { UpdatePlanCommand } from "../../../../interface/plans";

// Mock dependencies
global.fetch = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../../hooks/queryKeys", () => ({
  plansKeys: {
    detail: (id: string) => ["plans", "detail", id],
    lists: () => ["plans", "list"],
  },
}));

describe("useUpdatePlan", () => {
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

  describe("Successful Plan Updates", () => {
    it("should update plan with valid data", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan Name",
        description: "Updated description",
      };

      const mockUpdatedPlan = {
        id: planId,
        name: "Updated Plan Name",
        description: "Updated description",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedPlan,
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should update only plan name (partial update)", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "New Name Only",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, name: "New Name Only" }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/plans/${planId}`,
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });

    it("should update only visibility (isHidden)", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        isHidden: true,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, isHidden: true }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should update exercises list", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 4,
            reps: 12,
            tempo: "3-0-3",
            defaultWeight: 60,
          },
          {
            id: "ex-2",
            exerciseId: "exercise-2",
            sortOrder: 2,
            sets: 3,
            reps: 10,
            tempo: "2-0-2",
            defaultWeight: 50,
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, exercises: updateData.exercises }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should show success toast on successful update", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Plan zaktualizowany pomyślnie");
      });
    });

    it("should invalidate plan detail and list caches on success", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId }),
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["plans", "detail", planId] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["plans", "list"] });
      });
    });
  });

  describe("Business Rules - Unassign Trainer/Client", () => {
    it("should allow setting trainerId to null (unassign trainer)", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        trainerId: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, trainerId: null }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/plans/${planId}`,
        expect.objectContaining({
          body: expect.stringContaining('"trainerId":null'),
        })
      );
    });

    it("should allow setting clientId to null (unassign client)", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        clientId: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, clientId: null }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should allow setting description to null (clear description)", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        description: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, description: null }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("Validation Errors", () => {
    it("should throw ValidationError on 400 response", async () => {
      // Arrange
      const planId = "plan-123";
      const invalidData: UpdatePlanCommand = {
        id: planId,
        name: "AB", // Too short
      };

      const errorDetails = {
        error: "Validation failed",
        details: {
          name: ["Name must be at least 3 characters"],
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorDetails,
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId, data: invalidData })).rejects.toThrow(ValidationError);
    });

    it("should show error toast on validation error", async () => {
      // Arrange
      const planId = "plan-123";
      const invalidData: UpdatePlanCommand = {
        id: planId,
        name: "AB",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Validation failed" }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId, data: invalidData });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should handle validation error for empty exercises array", async () => {
      // Arrange
      const planId = "plan-123";
      const invalidData: UpdatePlanCommand = {
        id: planId,
        exercises: [],
      };

      const errorResponse = {
        error: "Validation failed",
        details: {
          exercises: ["At least one exercise is required"],
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId, data: invalidData })).rejects.toThrow(ValidationError);
    });
  });

  describe("Error Handling", () => {
    it("should throw generic error on non-400 error response", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId, data: updateData })).rejects.toThrow("Failed to update plan");
    });

    it("should show error toast with custom message on error", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan",
      };

      const customError = new Error("Custom error message");
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(customError);

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId, data: updateData });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Custom error message");
      });
    });

    it("should handle network errors", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId, data: updateData })).rejects.toThrow("Network error");
    });

    it("should show fallback error message when error has no message", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Updated Plan",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce({});

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId, data: updateData });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zaktualizować planu");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle update with all fields", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Complete Update",
        description: "New description",
        isHidden: false,
        trainerId: "trainer-456",
        clientId: "client-789",
        exercises: [
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: 50,
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...updateData }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle very long description (1000 chars)", async () => {
      // Arrange
      const planId = "plan-123";
      const longDescription = "A".repeat(1000);
      const updateData: UpdatePlanCommand = {
        id: planId,
        description: longDescription,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, description: longDescription }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle update with special characters in name", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        name: "Plan:週1 (Day 1) - [Advanced]",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, name: updateData.name }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle multiple simultaneous updates to different plans", async () => {
      // Arrange
      const plan1Id = "plan-1";
      const plan2Id = "plan-2";

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: plan1Id }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: plan2Id }),
        });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });

      await Promise.all([
        result.current.mutateAsync({ planId: plan1Id, data: { id: plan1Id, name: "Plan 1" } }),
        result.current.mutateAsync({ planId: plan2Id, data: { id: plan2Id, name: "Plan 2" } }),
      ]);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle exercise reordering", async () => {
      // Arrange
      const planId = "plan-123";
      const updateData: UpdatePlanCommand = {
        id: planId,
        exercises: [
          {
            id: "ex-2",
            exerciseId: "exercise-2",
            sortOrder: 1, // Was 2, now 1
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
          {
            id: "ex-1",
            exerciseId: "exercise-1",
            sortOrder: 2, // Was 1, now 2
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: planId, exercises: updateData.exercises }),
      });

      // Act
      const { result } = renderHook(() => useUpdatePlan(), { wrapper });
      await result.current.mutateAsync({ planId, data: updateData });

      // Assert
      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.exercises[0].exerciseId).toBe("exercise-2");
      expect(callBody.exercises[0].sortOrder).toBe(1);
      expect(callBody.exercises[1].exerciseId).toBe("exercise-1");
      expect(callBody.exercises[1].sortOrder).toBe(2);
    });
  });
});
