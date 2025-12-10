// src/__tests__/unit/services/plans.service.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listPlans,
  createPlan,
  getPlan,
  updatePlan,
  deletePlan,
  togglePlanVisibility,
} from "../../../services/plans.service";
import { ForbiddenError, NotFoundError, DatabaseError, ValidationError } from "../../../lib/errors";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { CreatePlanCommand, ListPlansQuery, AuthenticatedUser } from "../../../interface";
import type { PlanExerciseRow } from "@/types/db";

// Mock dependencies
vi.mock("../../../lib/mappers", () => ({
  mapPlanToDTO: vi.fn((plan, clientData) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    clientId: plan.client_id,
    clientName: clientData ? `${clientData.first_name} ${clientData.last_name}`.trim() : null,
    trainerId: plan.trainer_id,
    isHidden: plan.is_hidden,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    exercises: [],
  })),
  mapPlanWithExercisesToDTO: vi.fn((plan, exercises, clientData) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    clientId: plan.client_id,
    clientName: clientData ? `${clientData.first_name} ${clientData.last_name}`.trim() : null,
    trainerId: plan.trainer_id,
    isHidden: plan.is_hidden,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    exercises: exercises.map((ex: PlanExerciseRow) => ({
      id: ex.id,
      exerciseId: ex.exercise_id,
      sortOrder: ex.exercise_order,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      defaultWeight: ex.default_weight,
    })),
  })),
  mapPlanExerciseToDTO: vi.fn((pe) => ({
    id: pe.id,
    exerciseId: pe.exercise_id,
    sortOrder: pe.exercise_order,
    sets: pe.sets,
    reps: pe.reps,
    tempo: pe.tempo,
    defaultWeight: pe.default_weight,
  })),
}));

// Helper to create mock Supabase client
function createMockSupabase(): SupabaseClient {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
}

describe("plans.service", () => {
  describe("listPlans", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Authorization - Admin
    it("should allow admin to list all plans without filters", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListPlansQuery = { page: 1, limit: 20 };

      const mockPlans = [
        { id: "plan-1", name: "Plan 1", trainer_id: "trainer-1", client_id: "client-1", is_hidden: false },
        { id: "plan-2", name: "Plan 2", trainer_id: "trainer-2", client_id: "client-2", is_hidden: false },
      ];

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "plans") {
          return {
            select: vi.fn().mockReturnValue({
              range: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockPlans,
                  error: null,
                  count: 2,
                }),
              }),
            }),
          };
        }
        if (table === "plan_exercises") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: "client-1", first_name: "John", last_name: "Doe" },
                  { id: "client-2", first_name: "Jane", last_name: "Smith" },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await listPlans(mockSupabase, query, adminUser);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    // ✅ Authorization - Trainer
    it("should force trainer to only see their own plans", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const query: ListPlansQuery = { page: 1, limit: 20 };

      const mockPlans = [
        { id: "plan-1", name: "My Plan", trainer_id: trainerId, client_id: "client-1", is_hidden: false },
      ];

      const mockEq = vi.fn().mockReturnValue({
        range: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPlans,
            error: null,
            count: 1,
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "plans") {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
            }),
          };
        }
        if (table === "plan_exercises") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "client-1", first_name: "John", last_name: "Doe" }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await listPlans(mockSupabase, query, trainerUser);

      // Assert
      expect(mockEq).toHaveBeenCalledWith("trainer_id", trainerId);
      expect(result.data).toHaveLength(1);
    });

    // ✅ Authorization - Client
    it("should force client to only see their own plans", async () => {
      // Arrange
      const clientId = "client-123";
      const clientUser: AuthenticatedUser = { id: clientId, role: "client" } as AuthenticatedUser;
      const query: ListPlansQuery = { page: 1, limit: 20 };

      const mockPlans = [
        { id: "plan-1", name: "My Plan", trainer_id: "trainer-1", client_id: clientId, is_hidden: false },
      ];

      const mockEq = vi.fn().mockReturnValue({
        range: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPlans,
            error: null,
            count: 1,
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "plans") {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
            }),
          };
        }
        if (table === "plan_exercises") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: clientId, first_name: "Client", last_name: "User" }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await listPlans(mockSupabase, query, clientUser);

      // Assert
      expect(mockEq).toHaveBeenCalledWith("client_id", clientId);
      expect(result.data).toHaveLength(1);
    });

    // ✅ Pagination
    it("should apply correct pagination", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListPlansQuery = { page: 3, limit: 10 };

      const mockRange = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 50,
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: mockRange,
        }),
      });

      // Act
      await listPlans(mockSupabase, query, adminUser);

      // Assert
      // Page 3, limit 10: offset = (3-1) * 10 = 20, range = 20 to 29
      expect(mockRange).toHaveBeenCalledWith(20, 29);
    });

    // ✅ Filtering - Visibility
    it("should filter by visibility", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListPlansQuery = { visible: true, page: 1, limit: 20 };

      const mockEq = vi.fn().mockReturnValue({
        range: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      // Act
      await listPlans(mockSupabase, query, adminUser);

      // Assert
      // visible: true means is_hidden: false
      expect(mockEq).toHaveBeenCalledWith("is_hidden", false);
    });

    // ✅ Error Handling
    it("should throw DatabaseError on query failure", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListPlansQuery = { page: 1, limit: 20 };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
              count: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(listPlans(mockSupabase, query, adminUser)).rejects.toThrow(DatabaseError);
    });
  });

  describe("createPlan", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when client tries to create plan", async () => {
      // Arrange
      const clientUser: AuthenticatedUser = { id: "client-123", role: "client" } as AuthenticatedUser;
      const command: CreatePlanCommand = {
        name: "New Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "550e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act & Assert
      await expect(createPlan(mockSupabase, command, clientUser)).rejects.toThrow(ForbiddenError);
      await expect(createPlan(mockSupabase, command, clientUser)).rejects.toThrow("Clients cannot create plans");
    });

    it("should throw ForbiddenError when trainer tries to create plan for another trainer", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const command: CreatePlanCommand = {
        name: "New Plan",
        trainerId: "other-trainer-456", // Different trainer
        isHidden: false,
        exercises: [
          {
            exerciseId: "550e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act & Assert
      await expect(createPlan(mockSupabase, command, trainerUser)).rejects.toThrow(ForbiddenError);
      await expect(createPlan(mockSupabase, command, trainerUser)).rejects.toThrow(
        "Trainers can only create plans for themselves"
      );
    });

    // ✅ Validation Tests
    it("should throw NotFoundError when exercise does not exist", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = { id: "trainer-123", role: "trainer" } as AuthenticatedUser;
      const command: CreatePlanCommand = {
        name: "New Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "non-existent-exercise-id",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createPlan(mockSupabase, command, trainerUser)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when clientId is not a client", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = { id: "trainer-123", role: "trainer" } as AuthenticatedUser;
      const command: CreatePlanCommand = {
        name: "New Plan",
        clientId: "not-a-client-id",
        isHidden: false,
        exercises: [
          {
            exerciseId: "550e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "not-a-client-id", role: "trainer" }, // Not a client
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createPlan(mockSupabase, command, trainerUser)).rejects.toThrow(ValidationError);
    });

    // ✅ Success Cases
    it("should successfully create plan with exercises", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = { id: "trainer-123", role: "trainer" } as AuthenticatedUser;
      const command: CreatePlanCommand = {
        name: "Strength Training",
        description: "Basic program",
        isHidden: false,
        exercises: [
          {
            exerciseId: "ex-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: 50,
          },
          {
            exerciseId: "ex-2",
            sortOrder: 2,
            sets: 4,
            reps: 8,
            tempo: "2-0-2",
            defaultWeight: 60,
          },
        ],
      };

      const mockPlan = {
        id: "plan-123",
        name: "Strength Training",
        description: "Basic program",
        trainer_id: null,
        client_id: null,
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockPlanExercises = [
        {
          id: "pe-1",
          plan_id: "plan-123",
          exercise_id: "ex-1",
          exercise_order: 1,
          sets: 3,
          reps: 10,
          tempo: "3-0-3",
          default_weight: 50,
        },
        {
          id: "pe-2",
          plan_id: "plan-123",
          exercise_id: "ex-2",
          exercise_order: 2,
          sets: 4,
          reps: 8,
          tempo: "2-0-2",
          default_weight: 60,
        },
      ];

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "exercises") {
          // Exercise validation
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "ex-1" },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "plans") {
          // Plan creation
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "plan_exercises") {
          // Plan exercises creation
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: mockPlanExercises,
                error: null,
              }),
            }),
          };
        }

        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      // Act
      const result = await createPlan(mockSupabase, command, trainerUser);

      // Assert
      expect(result.id).toBe("plan-123");
      expect(result.name).toBe("Strength Training");
      expect(result.exercises).toHaveLength(2);
    });

    // ✅ Rollback on Exercise Insert Failure
    it("should rollback plan creation if exercise insert fails", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = { id: "trainer-123", role: "trainer" } as AuthenticatedUser;
      const command: CreatePlanCommand = {
        name: "Test Plan",
        isHidden: false,
        exercises: [
          {
            exerciseId: "ex-1",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      const mockPlan = {
        id: "plan-123",
        name: "Test Plan",
        is_hidden: false,
      };

      const mockDelete = vi.fn().mockResolvedValue({ error: null });

      let fromCallCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        fromCallCount++;

        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "ex-1" },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "plans" && fromCallCount <= 2) {
          // First plan call - creation
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: mockDelete,
            }),
          };
        }

        if (table === "plans" && fromCallCount > 2) {
          // Second plan call - rollback
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockDelete,
            }),
          };
        }

        if (table === "plan_exercises") {
          // Exercise insert fails
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Insert failed" },
              }),
            }),
          };
        }

        return {};
      });

      // Act & Assert
      await expect(createPlan(mockSupabase, command, trainerUser)).rejects.toThrow(DatabaseError);
    });
  });

  describe("getPlan", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Validation Tests
    it("should throw ValidationError for invalid UUID", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const invalidId = "not-a-uuid";

      // Act & Assert
      await expect(getPlan(mockSupabase, invalidId, adminUser)).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when plan does not exist", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getPlan(mockSupabase, planId, adminUser)).rejects.toThrow(NotFoundError);
    });

    // ✅ Authorization Tests
    it("should allow admin to view any plan", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        name: "Test Plan",
        trainer_id: "other-trainer",
        client_id: "other-client",
        is_hidden: false,
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get plan
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (callCount === 2) {
          // Second call: get exercises
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        // Third call: get client data
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { first_name: "Client", last_name: "Name" },
                error: null,
              }),
            }),
          }),
        };
      });

      // Act
      const result = await getPlan(mockSupabase, planId, adminUser);

      // Assert
      expect(result.id).toBe(planId);
    });

    it("should throw NotFoundError when trainer tries to view other trainer's plan", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        name: "Other's Plan",
        trainer_id: "other-trainer-456",
        is_hidden: false,
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getPlan(mockSupabase, planId, trainerUser)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when client tries to view other client's plan", async () => {
      // Arrange
      const clientId = "client-123";
      const clientUser: AuthenticatedUser = { id: clientId, role: "client" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        name: "Other's Plan",
        client_id: "other-client-456",
        is_hidden: false,
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getPlan(mockSupabase, planId, clientUser)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updatePlan", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when client tries to update plan", async () => {
      // Arrange
      const clientUser: AuthenticatedUser = { id: "client-123", role: "client" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";
      const command = { id: planId, name: "Updated Name" };

      const mockPlan = {
        id: planId,
        name: "Original",
        trainer_id: "trainer-123",
        client_id: "client-123",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updatePlan(mockSupabase, planId, command, clientUser)).rejects.toThrow(ForbiddenError);
      await expect(updatePlan(mockSupabase, planId, command, clientUser)).rejects.toThrow(
        "Clients cannot update plans"
      );
    });

    it("should throw ForbiddenError when trainer tries to update other trainer's plan", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";
      const command = { id: planId, name: "Updated Name" };

      const mockPlan = {
        id: planId,
        name: "Original",
        trainer_id: "other-trainer-456",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updatePlan(mockSupabase, planId, command, trainerUser)).rejects.toThrow(ForbiddenError);
    });

    // ✅ Success Cases
    it("should successfully update plan name", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";
      const command = { id: planId, name: "Updated Plan Name" };

      const mockPlan = {
        id: planId,
        name: "Original Name",
        trainer_id: trainerId,
        is_hidden: false,
      };

      const mockUpdatedPlan = {
        ...mockPlan,
        name: "Updated Plan Name",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch plan
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (callCount === 2) {
          // Update plan
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdatedPlan,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        // Get exercises
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      });

      // Act
      const result = await updatePlan(mockSupabase, planId, command, trainerUser);

      // Assert
      expect(result.name).toBe("Updated Plan Name");
    });
  });

  describe("deletePlan", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when client tries to delete plan", async () => {
      // Arrange
      const clientUser: AuthenticatedUser = { id: "client-123", role: "client" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        trainer_id: "trainer-123",
        client_id: "client-123",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(deletePlan(mockSupabase, planId, clientUser)).rejects.toThrow(ForbiddenError);
      await expect(deletePlan(mockSupabase, planId, clientUser)).rejects.toThrow("Clients cannot delete plans");
    });

    // ✅ Soft Delete
    it("should soft delete plan by default (set is_hidden to true)", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        trainer_id: trainerId,
        is_hidden: false,
      };

      const mockUpdate = vi.fn().mockResolvedValue({ error: null });

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch plan
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          };
        }
        // Soft delete (update)
        return {
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        };
      });

      // Act
      await deletePlan(mockSupabase, planId, trainerUser, false);

      // Assert
      expect(mockUpdate).toHaveBeenCalled();
    });

    // ✅ Hard Delete
    it("should hard delete plan when hard=true", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        trainer_id: trainerId,
      };

      const mockDelete = vi.fn().mockResolvedValue({ error: null });

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch plan
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          };
        }
        // Hard delete
        return {
          delete: vi.fn().mockReturnValue({
            eq: mockDelete,
          }),
        };
      });

      // Act
      await deletePlan(mockSupabase, planId, trainerUser, true);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("togglePlanVisibility", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when client tries to toggle visibility", async () => {
      // Arrange
      const clientUser: AuthenticatedUser = { id: "client-123", role: "client" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        trainer_id: "trainer-123",
        client_id: "client-123",
        is_hidden: false,
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(togglePlanVisibility(mockSupabase, planId, true, clientUser)).rejects.toThrow(ForbiddenError);
    });

    // ✅ Success Cases
    it("should successfully toggle plan visibility to hidden", async () => {
      // Arrange
      const trainerId = "trainer-123";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const planId = "550e8400-e29b-41d4-a716-446655440000";

      const mockPlan = {
        id: planId,
        name: "Test Plan",
        trainer_id: trainerId,
        is_hidden: false,
      };

      const mockUpdatedPlan = {
        ...mockPlan,
        is_hidden: true,
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch plan
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (callCount === 2) {
          // Update visibility
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdatedPlan,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        // Get exercises
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      });

      // Act
      const result = await togglePlanVisibility(mockSupabase, planId, true, trainerUser);

      // Assert
      expect(result.isHidden).toBe(true);
    });
  });
});
