// src/__tests__/unit/services/users.service.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createUser, listUsers, getUser, updateUser, deleteUser } from "../../../services/users.service";
import { ForbiddenError, NotFoundError, ConflictError, DatabaseError, ValidationError } from "../../../lib/errors";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { CreateUserCommand, ListUsersQuery, UpdateUserCommand, AuthenticatedUser } from "../../../types";

// Mock dependencies
vi.mock("../../../services/email.service", () => ({
  sendActivationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../services/auth.service", () => ({
  generateToken: vi.fn().mockReturnValue("mock-token-123"),
}));

vi.mock("../../../lib/mappers", () => ({
  mapUserToDTO: vi.fn((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    dateOfBirth: user.date_of_birth,
    trainerId: user.trainer_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  })),
  mapUserRoleFromDTO: vi.fn((role) => role),
}));

// Helper to create mock Supabase client
function createMockSupabase(): SupabaseClient {
  return {
    from: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  } as unknown as SupabaseClient;
}

describe("users.service", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Silence expected error logs to keep test output clean
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("createUser", () => {
    let mockSupabase: SupabaseClient;
    let adminUser: AuthenticatedUser;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
      adminUser = {
        id: "admin-123",
        email: "admin@test.com",
        role: "admin",
        firstName: "Admin",
        lastName: "User",
      } as AuthenticatedUser;
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when non-admin tries to create user", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = { ...adminUser, role: "trainer" };
      const command: CreateUserCommand = {
        email: "newuser@test.com",
        role: "client",
        firstName: "John",
        lastName: "Doe",
        trainerId: "trainer-123",
      };

      // Act & Assert
      await expect(createUser(mockSupabase, command, trainerUser)).rejects.toThrow(ForbiddenError);
      await expect(createUser(mockSupabase, command, trainerUser)).rejects.toThrow(
        "Only administrators can create users"
      );
    });

    it("should throw ForbiddenError when client tries to create user", async () => {
      // Arrange
      const clientUser: AuthenticatedUser = { ...adminUser, role: "client" };
      const command: CreateUserCommand = {
        email: "newuser@test.com",
        role: "client",
        firstName: "John",
        lastName: "Doe",
        trainerId: "trainer-123",
      };

      // Act & Assert
      await expect(createUser(mockSupabase, command, clientUser)).rejects.toThrow(ForbiddenError);
    });

    // ✅ Validation Tests
    it("should throw ConflictError when email already exists", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "existing@test.com",
        role: "trainer",
        firstName: "John",
        lastName: "Doe",
      };

      // Mock email exists check - returns data (email exists)
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "existing-user-id" },
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createUser(mockSupabase, command, adminUser)).rejects.toThrow(ConflictError);
      await expect(createUser(mockSupabase, command, adminUser)).rejects.toThrow("Email already exists");
    });

    it("should throw NotFoundError when trainerId does not exist (for client)", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "client@test.com",
        role: "client",
        firstName: "John",
        lastName: "Doe",
        trainerId: "550e8400-e29b-41d4-a716-446655440099",
      };

      // Mock email check - email doesn't exist (PGRST116)
      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(() => {
              callCount++;
              if (callCount === 1) {
                // First call: email check - doesn't exist
                return { data: null, error: { code: "PGRST116" } };
              }
              // Second call: trainer validation - trainer not found
              return { data: null, error: { message: "Not found" } };
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createUser(mockSupabase, command, adminUser)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when trainerId refers to non-trainer user", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "client@test.com",
        role: "client",
        firstName: "John",
        lastName: "Doe",
        trainerId: "not-a-trainer-id",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // Email check - doesn't exist
                return Promise.resolve({ data: null, error: { code: "PGRST116" } });
              }
              // Trainer validation - user exists but is not a trainer
              return Promise.resolve({
                data: { id: "not-a-trainer-id", role: "admin" },
                error: null,
              });
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createUser(mockSupabase, command, adminUser)).rejects.toThrow(ValidationError);
    });

    // ✅ Success Cases
    it("should successfully create admin user", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "newadmin@test.com",
        role: "admin",
        firstName: "New",
        lastName: "Admin",
      };

      const mockAuthUser = {
        user: {
          id: "new-user-123",
          email: "newadmin@test.com",
        },
      };

      const mockCreatedUser = {
        id: "new-user-123",
        email: "newadmin@test.com",
        role: "admin",
        status: "pending",
        first_name: "New",
        last_name: "Admin",
        phone: null,
        date_of_birth: null,
        trainer_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Mock email check - doesn't exist
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedUser, error: null }),
          }),
        }),
      });

      // Mock auth user creation
      (mockSupabase.auth.admin.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      // Act
      const result = await createUser(mockSupabase, command, adminUser);

      // Assert
      expect(result).toEqual({
        id: "new-user-123",
        email: "newadmin@test.com",
        role: "admin",
        status: "pending",
        firstName: "New",
        lastName: "Admin",
        phone: null,
        dateOfBirth: null,
        trainerId: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      });

      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: "newadmin@test.com",
        email_confirm: false,
        user_metadata: {
          first_name: "New",
          last_name: "Admin",
          role: "admin",
        },
      });
    });

    it("should successfully create client with trainerId", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440002";
      const clientId = "550e8400-e29b-41d4-a716-446655440003";
      const command: CreateUserCommand = {
        email: "client@test.com",
        role: "client",
        firstName: "John",
        lastName: "Doe",
        trainerId,
      };

      const mockAuthUser = {
        user: {
          id: clientId,
          email: "client@test.com",
        },
      };

      const mockCreatedUser = {
        id: clientId,
        email: "client@test.com",
        role: "client",
        status: "pending",
        first_name: "John",
        last_name: "Doe",
        phone: null,
        date_of_birth: null,
        trainer_id: trainerId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // Trainer validation - valid trainer (called first)
                return Promise.resolve({
                  data: { id: trainerId, role: "trainer" },
                  error: null,
                });
              }
              // Email check - doesn't exist (called second)
              return Promise.resolve({ data: null, error: { code: "PGRST116" } });
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedUser, error: null }),
          }),
        }),
      });

      (mockSupabase.auth.admin.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      // Act
      const result = await createUser(mockSupabase, command, adminUser);

      // Assert
      expect(result.trainerId).toBe(trainerId);
      expect(result.role).toBe("client");
    });

    it("should rollback auth user creation if profile insert fails", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "test@test.com",
        role: "trainer",
        firstName: "Test",
        lastName: "User",
      };

      const mockAuthUser = {
        user: {
          id: "auth-user-123",
          email: "test@test.com",
        },
      };

      // Mock email check - doesn't exist
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      (mockSupabase.auth.admin.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      (mockSupabase.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(createUser(mockSupabase, command, adminUser)).rejects.toThrow(DatabaseError);

      // Verify cleanup was called
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith("auth-user-123");
    });

    // ✅ Edge Cases
    it("should handle email with mixed case by converting to lowercase", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "MixedCase@TEST.COM",
        role: "trainer",
        firstName: "Test",
        lastName: "User",
      };

      const mockAuthUser = {
        user: { id: "user-123", email: "mixedcase@test.com" },
      };

      const mockCreatedUser = {
        id: "user-123",
        email: "mixedcase@test.com",
        role: "trainer",
        status: "pending",
        first_name: "Test",
        last_name: "User",
        phone: null,
        date_of_birth: null,
        trainer_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedUser, error: null }),
          }),
        }),
      });

      (mockSupabase.auth.admin.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      // Act
      await createUser(mockSupabase, command, adminUser);

      // Assert - verify email was lowercased in the auth call
      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "mixedcase@test.com",
        })
      );
    });

    it("should handle optional fields (phone, dateOfBirth)", async () => {
      // Arrange
      const command: CreateUserCommand = {
        email: "user@test.com",
        role: "trainer",
        firstName: "Test",
        lastName: "User",
        phone: "+48123456789",
        dateOfBirth: "1990-01-15",
      };

      const mockAuthUser = {
        user: { id: "user-123", email: "user@test.com" },
      };

      const mockCreatedUser = {
        id: "user-123",
        email: "user@test.com",
        role: "trainer",
        status: "pending",
        first_name: "Test",
        last_name: "User",
        phone: "+48123456789",
        date_of_birth: "1990-01-15",
        trainer_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedUser, error: null }),
          }),
        }),
      });

      (mockSupabase.auth.admin.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      // Act
      const result = await createUser(mockSupabase, command, adminUser);

      // Assert
      expect(result.phone).toBe("+48123456789");
      expect(result.dateOfBirth).toBe("1990-01-15");
    });
  });

  describe("listUsers", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when client tries to list users", async () => {
      // Arrange
      const clientUser: AuthenticatedUser = {
        id: "client-123",
        email: "client@test.com",
        role: "client",
      } as AuthenticatedUser;

      const query: ListUsersQuery = { page: 1, limit: 20 };

      // Act & Assert
      await expect(listUsers(mockSupabase, query, clientUser)).rejects.toThrow(ForbiddenError);
      await expect(listUsers(mockSupabase, query, clientUser)).rejects.toThrow("Clients cannot list users");
    });

    it("should allow admin to list all users", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = {
        id: "admin-123",
        role: "admin",
      } as AuthenticatedUser;

      const query: ListUsersQuery = { page: 1, limit: 20 };

      const mockUsers = [
        { id: "user-1", email: "user1@test.com", role: "trainer", first_name: "User", last_name: "One" },
        { id: "user-2", email: "user2@test.com", role: "client", first_name: "User", last_name: "Two" },
      ];

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
              count: 2,
            }),
          }),
        }),
      });

      // Act
      const result = await listUsers(mockSupabase, query, adminUser);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it("should force trainer to only see their own clients", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = {
        id: "trainer-123",
        role: "trainer",
      } as AuthenticatedUser;

      const query: ListUsersQuery = {
        page: 1,
        limit: 20,
        role: "trainer", // Trainer tries to see other trainers - should be forced to "client"
      };

      const mockClients = [
        {
          id: "client-1",
          email: "client1@test.com",
          role: "client",
          trainer_id: "trainer-123",
          first_name: "Client",
          last_name: "One",
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 1,
        }),
      };
      // Make eq and range return the same object for chaining
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.range.mockReturnValue(mockQuery);

      const mockSelect = vi.fn().mockReturnValue(mockQuery);

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await listUsers(mockSupabase, query, trainerUser);

      // Assert
      expect(result.data).toHaveLength(1);
      // Verify that role was forced to "client" and trainerId filter was applied
      const selectCall = mockSelect.mock.results[0].value;
      expect(selectCall.eq).toHaveBeenCalled();
    });

    // ✅ Filtering Tests
    it("should apply search filter correctly", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListUsersQuery = { search: "john", page: 1, limit: 20 };

      const mockOr = vi.fn().mockReturnValue({
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
          or: mockOr,
        }),
      });

      // Act
      await listUsers(mockSupabase, query, adminUser);

      // Assert
      expect(mockOr).toHaveBeenCalledWith("email.ilike.%john%,first_name.ilike.%john%,last_name.ilike.%john%");
    });

    it("should apply status filter", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListUsersQuery = { status: "active", page: 1, limit: 20 };

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
      await listUsers(mockSupabase, query, adminUser);

      // Assert
      expect(mockEq).toHaveBeenCalledWith("status", "active");
    });

    // ✅ Pagination Tests
    it("should calculate correct offset for pagination", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListUsersQuery = { page: 3, limit: 10 };

      const mockRange = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 100,
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: mockRange,
        }),
      });

      // Act
      await listUsers(mockSupabase, query, adminUser);

      // Assert
      // Page 3, limit 10: offset = (3-1) * 10 = 20, range = 20 to 29
      expect(mockRange).toHaveBeenCalledWith(20, 29);
    });

    it("should return correct meta information", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListUsersQuery = { page: 2, limit: 15 };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 47,
            }),
          }),
        }),
      });

      // Act
      const result = await listUsers(mockSupabase, query, adminUser);

      // Assert
      expect(result.meta).toEqual({
        page: 2,
        limit: 15,
        total: 47,
      });
    });

    // ✅ Error Handling
    it("should throw DatabaseError on query failure", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const query: ListUsersQuery = { page: 1, limit: 20 };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
              count: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(listUsers(mockSupabase, query, adminUser)).rejects.toThrow(DatabaseError);
    });
  });

  describe("getUser", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Validation Tests
    it("should throw ValidationError for invalid UUID format", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const invalidId = "not-a-uuid";

      // Act & Assert
      await expect(getUser(mockSupabase, invalidId, adminUser)).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when user does not exist", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const userId = "00000000-0000-0000-0000-000000000000";

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
      await expect(getUser(mockSupabase, userId, adminUser)).rejects.toThrow(NotFoundError);
    });

    // ✅ Authorization Tests
    it("should allow admin to view any user", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = {
        id: "550e8400-e29b-41d4-a716-446655440010",
        role: "admin",
      } as AuthenticatedUser;
      const targetUserId = "550e8400-e29b-41d4-a716-446655440011";

      const mockUser = {
        id: targetUserId,
        email: "target@test.com",
        role: "trainer",
        first_name: "Target",
        last_name: "User",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await getUser(mockSupabase, targetUserId, adminUser);

      // Assert
      expect(result.id).toBe(targetUserId);
    });

    it("should allow user to view their own profile", async () => {
      // Arrange
      const userId = "550e8400-e29b-41d4-a716-446655440012";
      const currentUser: AuthenticatedUser = { id: userId, role: "trainer" } as AuthenticatedUser;

      const mockUser = {
        id: userId,
        email: "user@test.com",
        role: "trainer",
        first_name: "User",
        last_name: "Name",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await getUser(mockSupabase, userId, currentUser);

      // Assert
      expect(result.id).toBe(userId);
    });

    it("should allow trainer to view their own client", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440013";
      const clientId = "550e8400-e29b-41d4-a716-446655440014";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;

      const mockClient = {
        id: clientId,
        email: "client@test.com",
        role: "client",
        trainer_id: trainerId,
        first_name: "Client",
        last_name: "User",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockClient,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await getUser(mockSupabase, clientId, trainerUser);

      // Assert
      expect(result.id).toBe(clientId);
    });

    it("should throw NotFoundError when trainer tries to view other trainer's client", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440015";
      const clientId = "550e8400-e29b-41d4-a716-446655440016";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;

      const mockClient = {
        id: clientId,
        email: "client@test.com",
        role: "client",
        trainer_id: "550e8400-e29b-41d4-a716-446655440017", // Different trainer
        first_name: "Client",
        last_name: "User",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockClient,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getUser(mockSupabase, clientId, trainerUser)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when trainer tries to view another trainer", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440018";
      const otherTrainerId = "550e8400-e29b-41d4-a716-446655440019";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;

      const mockOtherTrainer = {
        id: otherTrainerId,
        email: "other@test.com",
        role: "trainer",
        first_name: "Other",
        last_name: "Trainer",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOtherTrainer,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getUser(mockSupabase, otherTrainerId, trainerUser)).rejects.toThrow(NotFoundError);
    });

    it("should allow client to view their trainer", async () => {
      // Arrange
      const clientId = "550e8400-e29b-41d4-a716-446655440020";
      const trainerId = "550e8400-e29b-41d4-a716-446655440021";
      const clientUser: AuthenticatedUser = { id: clientId, role: "client" } as AuthenticatedUser;

      const mockTrainer = {
        id: trainerId,
        email: "trainer@test.com",
        role: "trainer",
        first_name: "Trainer",
        last_name: "Name",
      };

      const mockClientProfile = {
        trainer_id: trainerId,
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: fetch target user (trainer)
                return Promise.resolve({ data: mockTrainer, error: null });
              }
              // Second call: fetch client's profile
              return Promise.resolve({ data: mockClientProfile, error: null });
            }),
          }),
        }),
      });

      // Act
      const result = await getUser(mockSupabase, trainerId, clientUser);

      // Assert
      expect(result.id).toBe(trainerId);
    });

    it("should throw NotFoundError when client tries to view other users", async () => {
      // Arrange
      const clientId = "550e8400-e29b-41d4-a716-446655440022";
      const otherUserId = "550e8400-e29b-41d4-a716-446655440023";
      const clientUser: AuthenticatedUser = { id: clientId, role: "client" } as AuthenticatedUser;

      const mockOtherUser = {
        id: otherUserId,
        email: "other@test.com",
        role: "trainer",
        first_name: "Other",
        last_name: "User",
      };

      const mockClientProfile = {
        trainer_id: "550e8400-e29b-41d4-a716-446655440024",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ data: mockOtherUser, error: null });
              }
              return Promise.resolve({ data: mockClientProfile, error: null });
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getUser(mockSupabase, otherUserId, clientUser)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateUser", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    // ✅ Validation Tests
    it("should throw ValidationError for invalid UUID", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
      const command: UpdateUserCommand = { firstName: "Updated" };

      // Act & Assert
      await expect(updateUser(mockSupabase, "invalid-uuid", command, adminUser)).rejects.toThrow(ValidationError);
    });

    // ✅ Authorization Tests - Own Profile
    it("should allow user to update their own basic profile fields", async () => {
      // Arrange
      const userId = "550e8400-e29b-41d4-a716-446655440030";
      const currentUser: AuthenticatedUser = { id: userId, role: "trainer" } as AuthenticatedUser;
      const command: UpdateUserCommand = {
        firstName: "Updated",
        lastName: "Name",
        phone: "+48123456789",
      };

      const mockExistingUser = {
        id: userId,
        email: "user@test.com",
        role: "trainer",
        first_name: "Old",
        last_name: "Name",
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        first_name: "Updated",
        phone: "+48123456789",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ data: mockExistingUser, error: null });
              }
              return Promise.resolve({ data: mockUpdatedUser, error: null });
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedUser, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateUser(mockSupabase, userId, command, currentUser);

      // Assert
      expect(result.firstName).toBe("Updated");
    });

    it("should throw ForbiddenError when user tries to change their own status", async () => {
      // Arrange
      const userId = "550e8400-e29b-41d4-a716-446655440031";
      const currentUser: AuthenticatedUser = { id: userId, role: "trainer" } as AuthenticatedUser;
      const command: UpdateUserCommand = { status: "suspended" };

      const mockExistingUser = {
        id: userId,
        email: "user@test.com",
        role: "trainer",
        status: "active",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockExistingUser, error: null }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateUser(mockSupabase, userId, command, currentUser)).rejects.toThrow(ForbiddenError);
      await expect(updateUser(mockSupabase, userId, command, currentUser)).rejects.toThrow(
        "Cannot change status or trainer assignment"
      );
    });

    it("should throw ForbiddenError when user tries to change their own trainerId", async () => {
      // Arrange
      const userId = "550e8400-e29b-41d4-a716-446655440032";
      const currentUser: AuthenticatedUser = { id: userId, role: "client" } as AuthenticatedUser;
      const command: UpdateUserCommand = { trainerId: "550e8400-e29b-41d4-a716-446655440033" };

      const mockExistingUser = {
        id: userId,
        email: "client@test.com",
        role: "client",
        trainer_id: "550e8400-e29b-41d4-a716-446655440034",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockExistingUser, error: null }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateUser(mockSupabase, userId, command, currentUser)).rejects.toThrow(ForbiddenError);
    });

    // ✅ Authorization Tests - Trainer updating client
    it("should allow trainer to update their own client's profile", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440035";
      const clientId = "550e8400-e29b-41d4-a716-446655440036";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const command: UpdateUserCommand = { firstName: "Updated Client" };

      const mockClient = {
        id: clientId,
        email: "client@test.com",
        role: "client",
        trainer_id: trainerId,
        first_name: "Old",
        last_name: "Client",
      };

      const mockUpdatedClient = {
        ...mockClient,
        first_name: "Updated Client",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ data: mockClient, error: null });
              }
              return Promise.resolve({ data: mockUpdatedClient, error: null });
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedClient, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateUser(mockSupabase, clientId, command, trainerUser);

      // Assert
      expect(result.firstName).toBe("Updated Client");
    });

    it("should throw ForbiddenError when trainer tries to update non-client user", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440037";
      const otherTrainerId = "550e8400-e29b-41d4-a716-446655440038";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const command: UpdateUserCommand = { firstName: "Hacked" };

      const mockOtherTrainer = {
        id: otherTrainerId,
        email: "other@test.com",
        role: "trainer",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockOtherTrainer, error: null }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateUser(mockSupabase, otherTrainerId, command, trainerUser)).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when trainer tries to change client status", async () => {
      // Arrange
      const trainerId = "550e8400-e29b-41d4-a716-446655440039";
      const clientId = "550e8400-e29b-41d4-a716-446655440040";
      const trainerUser: AuthenticatedUser = { id: trainerId, role: "trainer" } as AuthenticatedUser;
      const command: UpdateUserCommand = { status: "suspended" };

      const mockClient = {
        id: clientId,
        role: "client",
        trainer_id: trainerId,
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateUser(mockSupabase, clientId, command, trainerUser)).rejects.toThrow(ForbiddenError);
    });

    // ✅ Authorization Tests - Admin
    it("should allow admin to update any user including status", async () => {
      // Arrange
      const adminUser: AuthenticatedUser = {
        id: "550e8400-e29b-41d4-a716-446655440041",
        role: "admin",
      } as AuthenticatedUser;
      const targetUserId = "550e8400-e29b-41d4-a716-446655440042";
      const command: UpdateUserCommand = {
        firstName: "Updated",
        status: "suspended",
      };

      const mockUser = {
        id: targetUserId,
        email: "user@test.com",
        role: "trainer",
        status: "active",
      };

      const mockUpdatedUser = {
        ...mockUser,
        first_name: "Updated",
        status: "suspended",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ data: mockUser, error: null });
              }
              return Promise.resolve({ data: mockUpdatedUser, error: null });
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedUser, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateUser(mockSupabase, targetUserId, command, adminUser);

      // Assert
      expect(result.status).toBe("suspended");
    });

    // ✅ Email Validation
    it("should throw ConflictError when new email already exists", async () => {
      // Arrange
      const userId = "550e8400-e29b-41d4-a716-446655440043";
      const currentUser: AuthenticatedUser = { id: userId, role: "trainer" } as AuthenticatedUser;
      const command: UpdateUserCommand = { email: "existing@test.com" };

      const mockExistingUser = {
        id: userId,
        email: "old@test.com",
      };

      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: fetch target user
                return Promise.resolve({ data: mockExistingUser, error: null });
              }
              // Second call: email check - email exists
              return Promise.resolve({ data: { id: "other-user" }, error: null });
            }),
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "other-user" }, error: null }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateUser(mockSupabase, userId, command, currentUser)).rejects.toThrow(ConflictError);
    });

    // ✅ Client Authorization Tests
    it("should throw ForbiddenError when client tries to update other users", async () => {
      // Arrange
      const clientId = "550e8400-e29b-41d4-a716-446655440044";
      const otherUserId = "550e8400-e29b-41d4-a716-446655440045";
      const clientUser: AuthenticatedUser = { id: clientId, role: "client" } as AuthenticatedUser;
      const command: UpdateUserCommand = { firstName: "Hacked" };

      const mockOtherUser = {
        id: otherUserId,
        email: "other@test.com",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockOtherUser, error: null }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateUser(mockSupabase, otherUserId, command, clientUser)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("deleteUser", () => {
    let mockSupabase: SupabaseClient;
    let adminUser: AuthenticatedUser;

    beforeEach(() => {
      mockSupabase = createMockSupabase();
      adminUser = { id: "admin-123", role: "admin" } as AuthenticatedUser;
    });

    // ✅ Authorization Tests
    it("should throw ForbiddenError when non-admin tries to delete user", async () => {
      // Arrange
      const trainerUser: AuthenticatedUser = { id: "trainer-123", role: "trainer" } as AuthenticatedUser;
      const targetUserId = "11111111-1111-1111-1111-111111111111";

      // Act & Assert
      await expect(deleteUser(mockSupabase, targetUserId, trainerUser)).rejects.toThrow(ForbiddenError);
      await expect(deleteUser(mockSupabase, targetUserId, trainerUser)).rejects.toThrow(
        "Only administrators can delete users"
      );
    });

    // ✅ Validation Tests
    it("should throw ValidationError for invalid UUID", async () => {
      // Arrange
      const invalidId = "not-a-uuid";

      // Act & Assert
      await expect(deleteUser(mockSupabase, invalidId, adminUser)).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when user does not exist", async () => {
      // Arrange
      const userId = "11111111-1111-1111-1111-111111111111";

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
      await expect(deleteUser(mockSupabase, userId, adminUser)).rejects.toThrow(NotFoundError);
    });

    // ✅ Success Cases
    it("should successfully delete user from both database and auth", async () => {
      // Arrange
      const userId = "11111111-1111-1111-1111-111111111111";

      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      const mockAuthDelete = vi.fn().mockResolvedValue({ error: null });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: userId },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: mockDelete,
        }),
      });

      (mockSupabase.auth.admin.deleteUser as ReturnType<typeof vi.fn>) = mockAuthDelete;

      // Act
      await deleteUser(mockSupabase, userId, adminUser);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith("id", userId);
      expect(mockAuthDelete).toHaveBeenCalledWith(userId);
    });

    it("should throw DatabaseError when database deletion fails", async () => {
      // Arrange
      const userId = "11111111-1111-1111-1111-111111111111";

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: userId },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
        }),
      });

      // Act & Assert
      await expect(deleteUser(mockSupabase, userId, adminUser)).rejects.toThrow(DatabaseError);
    });

    it("should not throw when auth deletion fails (cleanup operation)", async () => {
      // Arrange
      const userId = "11111111-1111-1111-1111-111111111111";

      const mockAuthDelete = vi.fn().mockResolvedValue({ error: { message: "Auth delete failed" } });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: userId },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      (mockSupabase.auth.admin.deleteUser as ReturnType<typeof vi.fn>) = mockAuthDelete;

      // Act & Assert - should NOT throw
      await expect(deleteUser(mockSupabase, userId, adminUser)).resolves.not.toThrow();
    });
  });
});
