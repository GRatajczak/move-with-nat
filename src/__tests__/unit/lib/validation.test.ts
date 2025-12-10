// src/__tests__/unit/lib/validation.test.ts

import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  CreateUserCommandSchema,
  UpdateUserCommandSchema,
  ListUsersQuerySchema,
  CreatePlanCommandSchema,
  UpdatePlanCommandSchema,
  ExerciseFormSchema,
  ChangePasswordFormSchema,
  ListPlansQuerySchema,
  ListExercisesQuerySchema,
  isValidUUID,
  parseQueryParams,
} from "../../../lib/validation";

describe("validation", () => {
  describe("CreateUserCommandSchema", () => {
    // ✅ Valid Cases
    it("should accept valid admin user data", () => {
      // Arrange
      const validData = {
        email: "admin@test.com",
        role: "admin",
        firstName: "John",
        lastName: "Doe",
      };

      // Act
      const result = CreateUserCommandSchema.parse(validData);

      // Assert
      expect(result).toEqual({
        email: "admin@test.com",
        role: "admin",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should accept valid trainer user data", () => {
      // Arrange
      const validData = {
        email: "trainer@test.com",
        role: "trainer",
        firstName: "Jane",
        lastName: "Smith",
      };

      // Act
      const result = CreateUserCommandSchema.parse(validData);

      // Assert
      expect(result.role).toBe("trainer");
    });

    it("should accept valid client user data with trainerId", () => {
      // Arrange
      const validData = {
        email: "client@test.com",
        role: "client",
        firstName: "Bob",
        lastName: "Johnson",
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // Act
      const result = CreateUserCommandSchema.parse(validData);

      // Assert
      expect(result.trainerId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should accept valid phone number formats", () => {
      // Arrange
      const testCases = ["+48123456789", "+1 (555) 123-4567", "123-456-7890", "+44 20 1234 5678", "1234567"];

      // Act & Assert
      testCases.forEach((phone) => {
        const data = {
          email: "user@test.com",
          role: "trainer" as const,
          firstName: "Test",
          lastName: "User",
          phone,
        };
        expect(() => CreateUserCommandSchema.parse(data)).not.toThrow();
      });
    });

    it("should accept valid date of birth", () => {
      // Arrange
      const validData = {
        email: "user@test.com",
        role: "trainer" as const,
        firstName: "Test",
        lastName: "User",
        dateOfBirth: "1990-05-15",
      };

      // Act
      const result = CreateUserCommandSchema.parse(validData);

      // Assert
      expect(result.dateOfBirth).toBe("1990-05-15");
    });

    // ✅ Email Validation
    it("should transform email to lowercase", () => {
      // Arrange
      const data = {
        email: "TEST@EXAMPLE.COM",
        role: "admin" as const,
        firstName: "Test",
        lastName: "User",
      };

      // Act
      const result = CreateUserCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("test@example.com");
    });

    it("should trim whitespace from email", () => {
      // Arrange
      const data = {
        email: "  test@example.com  ",
        role: "admin" as const,
        firstName: "Test",
        lastName: "User",
      };

      // Act
      const result = CreateUserCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("test@example.com");
    });

    it("should reject invalid email format", () => {
      // Arrange
      const invalidEmails = ["notanemail", "@test.com", "test@", "test @test.com", ""];

      // Act & Assert
      invalidEmails.forEach((email) => {
        const data = {
          email,
          role: "admin" as const,
          firstName: "Test",
          lastName: "User",
        };
        expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
      });
    });

    // ✅ Role Validation
    it("should reject invalid roles", () => {
      // Arrange
      const data = {
        email: "test@test.com",
        role: "superadmin", // invalid role
        firstName: "Test",
        lastName: "User",
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
    });

    // ✅ Name Validation
    it("should trim whitespace from names", () => {
      // Arrange
      const data = {
        email: "test@test.com",
        role: "admin" as const,
        firstName: "  John  ",
        lastName: "  Doe  ",
      };

      // Act
      const result = CreateUserCommandSchema.parse(data);

      // Assert
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("should reject names that are too short", () => {
      // Arrange
      const data = {
        email: "test@test.com",
        role: "admin" as const,
        firstName: "J",
        lastName: "D",
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject names that are too long", () => {
      // Arrange
      const data = {
        email: "test@test.com",
        role: "admin" as const,
        firstName: "A".repeat(51),
        lastName: "B".repeat(51),
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
    });

    // ✅ TrainerId Validation
    it("should require trainerId when role is client", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        role: "client" as const,
        firstName: "Client",
        lastName: "User",
        // trainerId missing
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
      try {
        CreateUserCommandSchema.parse(data);
      } catch (error) {
        expect((error as ZodError).errors[0].path).toContain("trainerId");
      }
    });

    it("should not require trainerId for admin or trainer", () => {
      // Arrange
      const adminData = {
        email: "admin@test.com",
        role: "admin" as const,
        firstName: "Admin",
        lastName: "User",
      };

      const trainerData = {
        email: "trainer@test.com",
        role: "trainer" as const,
        firstName: "Trainer",
        lastName: "User",
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(adminData)).not.toThrow();
      expect(() => CreateUserCommandSchema.parse(trainerData)).not.toThrow();
    });

    it("should reject invalid UUID format for trainerId", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        role: "client" as const,
        firstName: "Client",
        lastName: "User",
        trainerId: "not-a-uuid",
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
    });

    // ✅ Date of Birth Validation
    it("should reject invalid date formats", () => {
      // Arrange
      const invalidDates = ["2024/01/01", "01-01-2024", "2024.01.01", "not-a-date"];

      // Act & Assert
      invalidDates.forEach((date) => {
        const data = {
          email: "test@test.com",
          role: "admin" as const,
          firstName: "Test",
          lastName: "User",
          dateOfBirth: date,
        };
        expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
      });
    });

    it("should reject future dates for dateOfBirth", () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const data = {
        email: "test@test.com",
        role: "admin" as const,
        firstName: "Test",
        lastName: "User",
        dateOfBirth: futureDateStr,
      };

      // Act & Assert
      expect(() => CreateUserCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("UpdateUserCommandSchema", () => {
    // ✅ Valid Cases
    it("should accept partial update with single field", () => {
      // Arrange
      const data = { firstName: "Updated" };

      // Act
      const result = UpdateUserCommandSchema.parse(data);

      // Assert
      expect(result.firstName).toBe("Updated");
    });

    it("should accept multiple fields", () => {
      // Arrange
      const data = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+48123456789",
      };

      // Act
      const result = UpdateUserCommandSchema.parse(data);

      // Assert
      expect(result).toEqual({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+48123456789",
      });
    });

    // ✅ Edge Cases
    it("should reject empty update (no fields)", () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => UpdateUserCommandSchema.parse(data)).toThrow(ZodError);
      try {
        UpdateUserCommandSchema.parse(data);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toContain("At least one field");
      }
    });

    it("should accept status update", () => {
      // Arrange
      const validStatuses = ["pending", "active", "suspended"];

      // Act & Assert
      validStatuses.forEach((status) => {
        const data = { status };
        expect(() => UpdateUserCommandSchema.parse(data)).not.toThrow();
      });
    });

    it("should reject invalid status values", () => {
      // Arrange
      const data = { status: "deleted" };

      // Act & Assert
      expect(() => UpdateUserCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept null for nullable fields", () => {
      // Arrange
      const data = {
        phone: null,
        dateOfBirth: null,
      };

      // Act
      const result = UpdateUserCommandSchema.parse(data);

      // Assert
      expect(result.phone).toBeNull();
      expect(result.dateOfBirth).toBeNull();
    });
  });

  describe("ListUsersQuerySchema", () => {
    // ✅ Valid Cases
    it("should set default values for pagination", () => {
      // Arrange
      const data = {};

      // Act
      const result = ListUsersQuerySchema.parse(data);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should accept valid query parameters", () => {
      // Arrange
      const data = {
        search: "john",
        role: "trainer",
        status: "active",
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
        page: "2",
        limit: "50",
      };

      // Act
      const result = ListUsersQuerySchema.parse(data);

      // Assert
      expect(result).toEqual({
        search: "john",
        role: "trainer",
        status: "active",
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
        page: 2,
        limit: 50,
      });
    });

    // ✅ Search Validation
    it("should trim search query", () => {
      // Arrange
      const data = { search: "  john doe  " };

      // Act
      const result = ListUsersQuerySchema.parse(data);

      // Assert
      expect(result.search).toBe("john doe");
    });

    it("should reject search queries that are too long", () => {
      // Arrange
      const data = { search: "a".repeat(101) };

      // Act & Assert
      expect(() => ListUsersQuerySchema.parse(data)).toThrow(ZodError);
    });

    // ✅ Pagination Validation
    it("should coerce string numbers to integers", () => {
      // Arrange
      const data = { page: "3", limit: "25" };

      // Act
      const result = ListUsersQuerySchema.parse(data);

      // Assert
      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
      expect(typeof result.page).toBe("number");
      expect(typeof result.limit).toBe("number");
    });

    it("should reject page less than 1", () => {
      // Arrange
      const data = { page: "0" };

      // Act & Assert
      expect(() => ListUsersQuerySchema.parse(data)).toThrow(ZodError);
    });

    it("should reject limit less than 1", () => {
      // Arrange
      const data = { limit: "0" };

      // Act & Assert
      expect(() => ListUsersQuerySchema.parse(data)).toThrow(ZodError);
    });

    it("should reject limit greater than 100", () => {
      // Arrange
      const data = { limit: "101" };

      // Act & Assert
      expect(() => ListUsersQuerySchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("CreatePlanCommandSchema", () => {
    // ✅ Valid Cases
    it("should accept valid plan with exercises", () => {
      // Arrange
      const data = {
        name: "Test Plan",
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        isHidden: false,
        description: "Test description",
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: 50,
          },
        ],
      };

      // Act
      const result = CreatePlanCommandSchema.parse(data);

      // Assert
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].tempo).toBe("3-0-3");
    });

    it("should accept nullable trainerId and clientId", () => {
      // Arrange
      const data = {
        name: "Unassigned Plan",
        trainerId: null,
        clientId: null,
        isHidden: false,
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const result = CreatePlanCommandSchema.parse(data);

      // Assert
      expect(result.trainerId).toBeNull();
      expect(result.clientId).toBeNull();
    });

    it("should accept various tempo formats", () => {
      // Arrange
      const validTempos = ["3-0-3", "2-1-2", "4-0-4-0", "2020", "3131"];

      // Act & Assert
      validTempos.forEach((tempo) => {
        const data = {
          name: "Test",
          isHidden: false,
          exercises: [
            {
              exerciseId: "770e8400-e29b-41d4-a716-446655440000",
              sortOrder: 1,
              sets: 3,
              reps: 10,
              tempo,
            },
          ],
        };
        expect(() => CreatePlanCommandSchema.parse(data)).not.toThrow();
      });
    });

    // ✅ Validation Rules
    it("should reject plan name that is too short", () => {
      // Arrange
      const data = {
        name: "AB",
        isHidden: false,
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act & Assert
      expect(() => CreatePlanCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject plan name that is too long", () => {
      // Arrange
      const data = {
        name: "A".repeat(101),
        isHidden: false,
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act & Assert
      expect(() => CreatePlanCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject plan without exercises", () => {
      // Arrange
      const data = {
        name: "Empty Plan",
        isHidden: false,
        exercises: [],
      };

      // Act & Assert
      expect(() => CreatePlanCommandSchema.parse(data)).toThrow(ZodError);
      try {
        CreatePlanCommandSchema.parse(data);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toContain("At least one exercise");
      }
    });

    it("should reject invalid tempo format", () => {
      // Arrange
      const invalidTempos = ["3-0", "ABC", "1-2-3-4-5", "fast", ""];

      // Act & Assert
      invalidTempos.forEach((tempo) => {
        const data = {
          name: "Test",
          isHidden: false,
          exercises: [
            {
              exerciseId: "770e8400-e29b-41d4-a716-446655440000",
              sortOrder: 1,
              sets: 3,
              reps: 10,
              tempo,
            },
          ],
        };
        expect(() => CreatePlanCommandSchema.parse(data)).toThrow(ZodError);
      });
    });

    it("should reject negative weight", () => {
      // Arrange
      const data = {
        name: "Test",
        isHidden: false,
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: -10,
          },
        ],
      };

      // Act & Assert
      expect(() => CreatePlanCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject sets less than 1", () => {
      // Arrange
      const data = {
        name: "Test",
        isHidden: false,
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 0,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act & Assert
      expect(() => CreatePlanCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("UpdatePlanCommandSchema", () => {
    // ✅ Valid Cases
    it("should accept partial update", () => {
      // Arrange
      const data = { name: "Updated Plan Name" };

      // Act
      const result = UpdatePlanCommandSchema.parse(data);

      // Assert
      expect(result.name).toBe("Updated Plan Name");
    });

    it("should accept exercises update", () => {
      // Arrange
      const data = {
        exercises: [
          {
            exerciseId: "770e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const result = UpdatePlanCommandSchema.parse(data);

      // Assert
      expect(result.exercises).toHaveLength(1);
    });

    // ✅ Validation Rules
    it("should reject empty update", () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => UpdatePlanCommandSchema.parse(data)).toThrow(ZodError);
      try {
        UpdatePlanCommandSchema.parse(data);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toContain("At least one field");
      }
    });
  });

  describe("ChangePasswordFormSchema", () => {
    // ✅ Valid Cases
    it("should accept valid password change", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "NewPass456@",
        confirmPassword: "NewPass456@",
      };

      // Act
      const result = ChangePasswordFormSchema.parse(data);

      // Assert
      expect(result.newPassword).toBe("NewPass456@");
    });

    // ✅ Password Strength
    it("should reject password without uppercase letter", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "newpass456@",
        confirmPassword: "newpass456@",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without lowercase letter", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "NEWPASS456@",
        confirmPassword: "NEWPASS456@",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without digit", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "NewPassword@",
        confirmPassword: "NewPassword@",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without special character", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password shorter than 8 characters", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "Pass1!",
        confirmPassword: "Pass1!",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });

    // ✅ Password Confirmation
    it("should reject when passwords do not match", () => {
      // Arrange
      const data = {
        currentPassword: "OldPass123!",
        newPassword: "NewPass456@",
        confirmPassword: "DifferentPass789#",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject when new password equals current password", () => {
      // Arrange
      const data = {
        currentPassword: "SamePass123!",
        newPassword: "SamePass123!",
        confirmPassword: "SamePass123!",
      };

      // Act & Assert
      expect(() => ChangePasswordFormSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("isValidUUID", () => {
    // ✅ Valid UUIDs
    it("should return true for valid UUID v4", () => {
      // Arrange
      const validUUIDs = [
        "550e8400-e29b-41d4-a716-446655440000",
        "123e4567-e89b-12d3-a456-426614174000",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
      ];

      // Act & Assert
      validUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    // ✅ Invalid UUIDs
    it("should return false for invalid UUID formats", () => {
      // Arrange
      const invalidUUIDs = [
        "not-a-uuid",
        "550e8400-e29b-41d4-a716",
        "550e8400e29b41d4a716446655440000",
        "550e8400-e29b-41d4-a716-446655440000-extra",
        "",
        "123",
        "550E8400-E29B-41D4-A716-44665544000G", // Invalid hex character
      ];

      // Act & Assert
      invalidUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe("parseQueryParams", () => {
    // ✅ Functionality
    it("should convert URLSearchParams to object", () => {
      // Arrange
      const url = new URL("http://example.com?page=2&limit=50&search=test");

      // Act
      const result = parseQueryParams(url);

      // Assert
      expect(result).toEqual({
        page: "2",
        limit: "50",
        search: "test",
      });
    });

    it("should handle empty query string", () => {
      // Arrange
      const url = new URL("http://example.com");

      // Act
      const result = parseQueryParams(url);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle multiple values for same key (takes last)", () => {
      // Arrange
      const url = new URL("http://example.com?status=active&status=pending");

      // Act
      const result = parseQueryParams(url);

      // Assert
      expect(result.status).toBe("pending");
    });
  });

  describe("ExerciseFormSchema", () => {
    // ✅ Valid Cases
    it("should accept valid exercise data", () => {
      // Arrange
      const data = {
        name: "Push-up",
        vimeoToken: "123456789",
        description: "Basic push-up exercise",
        tips: "Keep your back straight",
        tempo: "3-0-3",
        defaultWeight: 0,
      };

      // Act
      const result = ExerciseFormSchema.parse(data);

      // Assert
      expect(result.name).toBe("Push-up");
    });

    it("should accept null for defaultWeight", () => {
      // Arrange
      const data = {
        name: "Bodyweight Exercise",
        vimeoToken: "123456789",
        description: "No weight needed",
        tips: "Focus on form",
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = ExerciseFormSchema.parse(data);

      // Assert
      expect(result.defaultWeight).toBeNull();
    });

    // ✅ Validation Rules
    it("should reject name shorter than 3 characters", () => {
      // Arrange
      const data = {
        name: "AB",
        vimeoToken: "123456789",
        description: "",
        tips: "",
        tempo: "",
        defaultWeight: null,
      };

      // Act & Assert
      expect(() => ExerciseFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject description longer than 2000 characters", () => {
      // Arrange
      const data = {
        name: "Exercise",
        vimeoToken: "123456789",
        description: "A".repeat(2001),
        tips: "",
        tempo: "",
        defaultWeight: null,
      };

      // Act & Assert
      expect(() => ExerciseFormSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("ListPlansQuerySchema", () => {
    // ✅ Valid Cases
    it("should set default pagination values", () => {
      // Arrange
      const data = {};

      // Act
      const result = ListPlansQuerySchema.parse(data);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe("created_at");
    });

    it("should accept valid filter parameters", () => {
      // Arrange
      const data = {
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        visible: "true",
        page: "2",
        limit: "30",
      };

      // Act
      const result = ListPlansQuerySchema.parse(data);

      // Assert
      expect(result.trainerId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.clientId).toBe("660e8400-e29b-41d4-a716-446655440000");
      expect(result.visible).toBe(true);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(30);
    });

    it("should coerce string boolean to boolean", () => {
      // Arrange
      const testCases = [
        { input: "true", expected: true },
        { input: "false", expected: false },
        { input: "1", expected: true },
        { input: "0", expected: false },
      ];

      // Act & Assert
      testCases.forEach(({ input, expected }) => {
        const result = ListPlansQuerySchema.parse({ visible: input });
        expect(result.visible).toBe(expected);
      });
    });
  });

  describe("ListExercisesQuerySchema", () => {
    // ✅ Valid Cases
    it("should set default pagination values", () => {
      // Arrange
      const data = {};

      // Act
      const result = ListExercisesQuerySchema.parse(data);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should trim search query", () => {
      // Arrange
      const data = { search: "  bench press  " };

      // Act
      const result = ListExercisesQuerySchema.parse(data);

      // Assert
      expect(result.search).toBe("bench press");
    });

    it("should reject limit greater than 100", () => {
      // Arrange
      const data = { limit: "150" };

      // Act & Assert
      expect(() => ListExercisesQuerySchema.parse(data)).toThrow(ZodError);
    });
  });
});
