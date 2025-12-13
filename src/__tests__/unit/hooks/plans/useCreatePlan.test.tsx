// src/hooks/plans/useCreatePlan.test.ts

import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreatePlan } from "../../../../hooks/plans/useCreatePlan";
import { ValidationError } from "../../../../lib/errors";
import type { CreatePlanCommand } from "../../../../interface/plans";

// Mock fetch globally
global.fetch = vi.fn();

describe("useCreatePlan", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // Helper to wrap hook with QueryClientProvider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Successful Plan Creation", () => {
    it("should create plan with valid data", async () => {
      // Arrange
      const mockPlan = {
        id: "plan-123",
        name: "Test Plan",
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [],
      };

      const createCommand: CreatePlanCommand = {
        name: "Test Plan",
        trainerId: "trainer-123",
        clientId: "client-123",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
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
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      await result.current.mutateAsync(createCommand);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createCommand),
      });
    });

    it("should create plan with minimal required data", async () => {
      // Arrange
      const mockPlan = {
        id: "plan-123",
        name: "Minimal Plan",
        isHidden: false,
      };

      const minimalCommand: CreatePlanCommand = {
        name: "Minimal Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 1,
            reps: 1,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(minimalCommand);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should create plan with multiple exercises", async () => {
      // Arrange
      const mockPlan = {
        id: "plan-123",
        name: "Multi-Exercise Plan",
      };

      const multiExerciseCommand: CreatePlanCommand = {
        name: "Multi-Exercise Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
          {
            exerciseId: "exercise-2",
            sortOrder: 2,
            sets: 4,
            reps: 12,
            tempo: "2-0-2",
          },
          {
            exerciseId: "exercise-3",
            sortOrder: 3,
            sets: 5,
            reps: 8,
            tempo: "4-1-2",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(multiExerciseCommand);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/plans",
        expect.objectContaining({
          body: expect.stringContaining('"exerciseId":"exercise-1"'),
        })
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should invalidate plans list cache on success", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const createCommand: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(createCommand);

      // Assert
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["plans", "list"] });
      });
    });
  });

  describe("Validation Errors", () => {
    it("should throw ValidationError on 400 response", async () => {
      // Arrange
      const errorDetails = {
        error: "Validation failed",
        details: {
          name: ["Name is required"],
          exercises: ["At least one exercise is required"],
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: (name: string) => (name === "content-type" ? "application/json" : null),
        },
        json: async () => errorDetails,
      });

      const invalidCommand: CreatePlanCommand = {
        name: "",
        isHidden: false,
        exercises: [],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync(invalidCommand)).rejects.toThrow(ValidationError);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should handle validation error with message field", async () => {
      // Arrange
      const errorResponse = {
        error: "Invalid plan data",
        details: { message: "Plan name is too short" },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: (name: string) => (name === "content-type" ? "application/json" : null),
        },
        json: async () => errorResponse,
      });

      const invalidCommand: CreatePlanCommand = {
        name: "AB", // Too short
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync(invalidCommand)).rejects.toThrow(ValidationError);
    });
  });

  describe("Error Handling", () => {
    it("should throw generic error on non-400 error response", async () => {
      // Arrange
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: (name: string) => (name === "content-type" ? "application/json" : null),
        },
        json: async () => ({}),
      });

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync(command)).rejects.toThrow("Failed to create plan");
    });

    it("should handle network errors", async () => {
      // Arrange
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync(command)).rejects.toThrow("Network error");
    });

    it("should handle malformed JSON response", async () => {
      // Arrange
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: (name: string) => (name === "content-type" ? "application/json" : null),
        },
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync(command)).rejects.toThrow();
    });
  });

  describe("Business Rules", () => {
    it("should create plan with null trainerId and clientId (unassigned plan)", async () => {
      // Arrange
      const mockPlan = {
        id: "plan-123",
        name: "Unassigned Plan",
        trainerId: null,
        clientId: null,
      };

      const unassignedCommand: CreatePlanCommand = {
        name: "Unassigned Plan",
        trainerId: null,
        clientId: null,
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(unassignedCommand);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/plans",
        expect.objectContaining({
          body: expect.stringContaining('"trainerId":null'),
        })
      );
    });

    it("should create hidden plan (isHidden: true)", async () => {
      // Arrange
      const mockPlan = {
        id: "plan-123",
        name: "Hidden Plan",
        isHidden: true,
      };

      const hiddenCommand: CreatePlanCommand = {
        name: "Hidden Plan",
        isHidden: true,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(hiddenCommand);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should preserve exercise order via sortOrder", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Ordered Plan" };

      const orderedCommand: CreatePlanCommand = {
        name: "Ordered Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-3",
            sortOrder: 3,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
          {
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
          {
            exerciseId: "exercise-2",
            sortOrder: 2,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(orderedCommand);

      // Assert
      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.exercises[0].sortOrder).toBe(3);
      expect(callBody.exercises[1].sortOrder).toBe(1);
      expect(callBody.exercises[2].sortOrder).toBe(2);
    });

    it("should handle exercises with null defaultWeight", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: null,
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(command);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle empty description", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      const command: CreatePlanCommand = {
        name: "Test Plan",
        description: "",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(command);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle long description (up to 1000 chars)", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };
      const longDescription = "A".repeat(1000);

      const command: CreatePlanCommand = {
        name: "Test Plan",
        description: longDescription,
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(command);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle exercises with zero defaultWeight", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: 0,
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(command);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle exercises with very high sets/reps", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 100,
            reps: 1000,
            tempo: "3-0-3",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(command);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle different tempo formats (XXXX and X-X-X)", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "2020",
          },
          {
            exerciseId: "exercise-2",
            sortOrder: 2,
            sets: 3,
            reps: 10,
            tempo: "3-1-2",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });
      await result.current.mutateAsync(command);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("Hook State Management", () => {
    it("should set isPending to true during mutation", async () => {
      // Arrange
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockPlan,
                }),
              100
            )
          )
      );

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      const mutationPromise = result.current.mutateAsync(command);

      // Assert - Should be pending immediately after calling mutate
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      await mutationPromise;
    });

    it("should set isError to true on failure", async () => {
      // Arrange
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: (name: string) => (name === "content-type" ? "application/json" : null),
        },
        json: async () => ({ error: "Server error" }),
      });

      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "exercise-123",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useCreatePlan(), { wrapper });

      try {
        await result.current.mutateAsync(command);
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
