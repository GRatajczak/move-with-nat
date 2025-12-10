// src/hooks/plans/useDeletePlan.test.ts

import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDeletePlan } from "../../../../hooks/plans/useDeletePlan";
import { NotFoundError } from "../../../../lib/errors";
import { toast } from "sonner";

// Mock dependencies
global.fetch = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useDeletePlan", () => {
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

  describe("Soft Delete (Default)", () => {
    it("should perform soft delete by default", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${planId}`, {
        method: "DELETE",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should not include hard parameter for soft delete", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId, hard: false });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${planId}`, {
        method: "DELETE",
      });

      // URL should not contain ?hard=true
      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).not.toContain("hard");
    });

    it("should show success toast on successful soft delete", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId });

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Plan usunięty");
      });
    });

    it("should invalidate plans list cache on successful soft delete", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId });

      // Assert
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["plans", "list"] });
      });
    });
  });

  describe("Hard Delete", () => {
    it("should perform hard delete when hard=true", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId, hard: true });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${planId}?hard=true`, {
        method: "DELETE",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should show success toast on successful hard delete", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId, hard: true });

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Plan usunięty");
      });
    });

    it("should invalidate plans list cache on successful hard delete", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId, hard: true });

      // Assert
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["plans", "list"] });
      });
    });
  });

  describe("Error Handling - Plan Not Found", () => {
    it("should throw NotFoundError when plan doesn't exist (soft delete)", async () => {
      // Arrange
      const planId = "non-existent-plan";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId })).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when plan doesn't exist (hard delete)", async () => {
      // Arrange
      const planId = "non-existent-plan";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId, hard: true })).rejects.toThrow(NotFoundError);
    });

    it("should show error toast when plan not found", async () => {
      // Arrange
      const planId = "non-existent-plan";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się usunąć planu");
      });
    });
  });

  describe("Error Handling - Generic Errors", () => {
    it("should throw generic error on non-404 error response", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId })).rejects.toThrow("Failed to delete plan");
    });

    it("should handle network errors", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId })).rejects.toThrow("Network error");
    });

    it("should show error toast on generic error", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się usunąć planu");
      });
    });

    it("should handle 403 Forbidden error", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId })).rejects.toThrow("Failed to delete plan");
    });

    it("should handle 401 Unauthorized error", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // Assert
      await expect(result.current.mutateAsync({ planId })).rejects.toThrow("Failed to delete plan");
    });
  });

  describe("Edge Cases", () => {
    it("should handle deleting the same plan multiple times (sequential)", async () => {
      // Arrange
      const planId = "plan-123";

      // First delete succeeds, second fails (404)
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      // First delete
      await result.current.mutateAsync({ planId });

      // Assert first delete succeeded
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second delete should fail
      await expect(result.current.mutateAsync({ planId })).rejects.toThrow(NotFoundError);
    });

    it("should handle deletion of multiple different plans", async () => {
      // Arrange
      const plan1Id = "plan-1";
      const plan2Id = "plan-2";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      await result.current.mutateAsync({ planId: plan1Id });
      await result.current.mutateAsync({ planId: plan2Id });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/plans/${plan1Id}`, {
        method: "DELETE",
      });
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/plans/${plan2Id}`, {
        method: "DELETE",
      });
    });

    it("should handle very long plan IDs", async () => {
      // Arrange
      const longPlanId = "a".repeat(100);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId: longPlanId });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${longPlanId}`, {
        method: "DELETE",
      });
    });

    it("should handle UUID format plan IDs", async () => {
      // Arrange
      const uuidPlanId = "123e4567-e89b-12d3-a456-426614174000";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId: uuidPlanId });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("Hook State Management", () => {
    it("should set isPending to true during deletion", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                }),
              100
            )
          )
      );

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      const mutationPromise = result.current.mutateAsync({ planId });

      // Assert - Should be pending immediately after calling mutate
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      await mutationPromise;
    });

    it("should set isError to true on failure", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });

      try {
        await result.current.mutateAsync({ planId });
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should reset state after successful deletion", async () => {
      // Arrange
      const planId = "plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId });

      // Assert
      expect(result.current.isPending).toBe(false);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.isError).toBe(false);
    });
  });

  describe("Business Rules", () => {
    it("should allow soft delete for plans that are still visible to clients", async () => {
      // Arrange - This is more of a documentation test
      // Soft delete should work regardless of plan visibility
      const planId = "visible-plan-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId, hard: false });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should allow hard delete to permanently remove plan from database", async () => {
      // Arrange - Hard delete is permanent
      const planId = "plan-to-purge-123";

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const { result } = renderHook(() => useDeletePlan(), { wrapper });
      await result.current.mutateAsync({ planId, hard: true });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${planId}?hard=true`, {
        method: "DELETE",
      });
    });
  });
});
