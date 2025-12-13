// src/__tests__/unit/lib/validation.auth.test.ts

import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  InviteUserCommandSchema,
  ActivateAccountCommandSchema,
  RequestPasswordResetCommandSchema,
  ConfirmPasswordResetCommandSchema,
  ProfileEditFormSchema,
  CreateUserFormSchema,
  EditUserFormSchema,
  ListClientsQuerySchema,
  CreateClientFormSchema,
  UpdateClientFormSchema,
} from "../../../lib/validation";

describe("validation.auth", () => {
  describe("InviteUserCommandSchema", () => {
    it("should accept valid trainer invitation", () => {
      // Arrange
      const data = {
        email: "trainer@test.com",
        role: "trainer",
        resend: false,
      };

      // Act
      const result = InviteUserCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("trainer@test.com");
      expect(result.role).toBe("trainer");
    });

    it("should accept valid client invitation", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        role: "client",
      };

      // Act
      const result = InviteUserCommandSchema.parse(data);

      // Assert
      expect(result.role).toBe("client");
    });

    it("should set default resend to false", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        role: "trainer",
      };

      // Act
      const result = InviteUserCommandSchema.parse(data);

      // Assert
      expect(result.resend).toBe(false);
    });

    it("should transform email to lowercase", () => {
      // Arrange
      const data = {
        email: "USER@TEST.COM",
        role: "trainer",
      };

      // Act
      const result = InviteUserCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("user@test.com");
    });

    it("should trim and transform email", () => {
      // Arrange
      const data = {
        email: "User@Test.Com",
        role: "trainer",
      };

      // Act
      const result = InviteUserCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("user@test.com");
    });

    it("should reject admin role", () => {
      // Arrange
      const data = {
        email: "admin@test.com",
        role: "admin",
      };

      // Act & Assert
      expect(() => InviteUserCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject invalid email", () => {
      // Arrange
      const data = {
        email: "invalid-email",
        role: "trainer",
      };

      // Act & Assert
      expect(() => InviteUserCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("ActivateAccountCommandSchema", () => {
    it("should accept valid token", () => {
      // Arrange
      const data = { token: "valid-token-123" };

      // Act
      const result = ActivateAccountCommandSchema.parse(data);

      // Assert
      expect(result.token).toBe("valid-token-123");
    });

    it("should reject empty token", () => {
      // Arrange
      const data = { token: "" };

      // Act & Assert
      expect(() => ActivateAccountCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject missing token", () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => ActivateAccountCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("RequestPasswordResetCommandSchema", () => {
    it("should accept valid email", () => {
      // Arrange
      const data = { email: "user@test.com" };

      // Act
      const result = RequestPasswordResetCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("user@test.com");
    });

    it("should transform email to lowercase", () => {
      // Arrange
      const data = { email: "USER@TEST.COM" };

      // Act
      const result = RequestPasswordResetCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("user@test.com");
    });

    it("should trim and transform email", () => {
      // Arrange
      const data = { email: "User@Test.Com" };

      // Act
      const result = RequestPasswordResetCommandSchema.parse(data);

      // Assert
      expect(result.email).toBe("user@test.com");
    });

    it("should reject invalid email", () => {
      // Arrange
      const data = { email: "not-an-email" };

      // Act & Assert
      expect(() => RequestPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("ConfirmPasswordResetCommandSchema", () => {
    it("should accept valid token and password", () => {
      // Arrange
      const data = {
        token: "reset-token-123",
        newPassword: "NewPass123!",
      };

      // Act
      const result = ConfirmPasswordResetCommandSchema.parse(data);

      // Assert
      expect(result.token).toBe("reset-token-123");
      expect(result.newPassword).toBe("NewPass123!");
    });

    it("should reject password shorter than 8 characters", () => {
      // Arrange
      const data = {
        token: "token",
        newPassword: "Pass1!",
      };

      // Act & Assert
      expect(() => ConfirmPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without uppercase", () => {
      // Arrange
      const data = {
        token: "token",
        newPassword: "password123!",
      };

      // Act & Assert
      expect(() => ConfirmPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without lowercase", () => {
      // Arrange
      const data = {
        token: "token",
        newPassword: "PASSWORD123!",
      };

      // Act & Assert
      expect(() => ConfirmPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without digit", () => {
      // Arrange
      const data = {
        token: "token",
        newPassword: "Password!",
      };

      // Act & Assert
      expect(() => ConfirmPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without special character", () => {
      // Arrange
      const data = {
        token: "token",
        newPassword: "Password123",
      };

      // Act & Assert
      expect(() => ConfirmPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject empty token", () => {
      // Arrange
      const data = {
        token: "",
        newPassword: "ValidPass123!",
      };

      // Act & Assert
      expect(() => ConfirmPasswordResetCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("ProfileEditFormSchema", () => {
    it("should accept valid profile data", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+48123456789",
        dateOfBirth: "1990-01-01",
      };

      // Act
      const result = ProfileEditFormSchema.parse(data);

      // Assert
      expect(result.email).toBe("user@test.com");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("should accept empty phone", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        phone: "",
      };

      // Act
      const result = ProfileEditFormSchema.parse(data);

      // Assert
      expect(result.phone).toBe("");
    });

    it("should accept empty dateOfBirth", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "",
      };

      // Act
      const result = ProfileEditFormSchema.parse(data);

      // Assert
      expect(result.dateOfBirth).toBe("");
    });

    it("should reject future date of birth", () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const data = {
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: futureDate.toISOString().split("T")[0],
      };

      // Act & Assert
      expect(() => ProfileEditFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should trim names", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "  John  ",
        lastName: "  Doe  ",
      };

      // Act
      const result = ProfileEditFormSchema.parse(data);

      // Assert
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("should reject invalid phone format", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        phone: "invalid-phone",
      };

      // Act & Assert
      expect(() => ProfileEditFormSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("CreateUserFormSchema", () => {
    it("should require trainerId for client role", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        role: "client",
        firstName: "Jane",
        lastName: "Doe",
      };

      // Act & Assert
      expect(() => CreateUserFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept client with trainerId", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        role: "client",
        firstName: "Jane",
        lastName: "Doe",
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // Act
      const result = CreateUserFormSchema.parse(data);

      // Assert
      expect(result.trainerId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should transform empty trainerId to undefined", () => {
      // Arrange
      const data = {
        email: "trainer@test.com",
        role: "trainer",
        firstName: "John",
        lastName: "Trainer",
        trainerId: "",
      };

      // Act
      const result = CreateUserFormSchema.parse(data);

      // Assert
      expect(result.trainerId).toBeUndefined();
    });
  });

  describe("EditUserFormSchema", () => {
    it("should accept valid user edit data", () => {
      // Arrange
      const data = {
        email: "updated@test.com",
        firstName: "Updated",
        lastName: "User",
        role: "trainer",
        status: "active",
        phone: "+48123456789",
        dateOfBirth: "1990-01-01",
      };

      // Act
      const result = EditUserFormSchema.parse(data);

      // Assert
      expect(result.email).toBe("updated@test.com");
      expect(result.role).toBe("trainer");
      expect(result.status).toBe("active");
    });

    it("should require trainerId for client role", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        firstName: "Client",
        lastName: "User",
        role: "client",
        status: "active",
      };

      // Act & Assert
      expect(() => EditUserFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept client with trainerId", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        firstName: "Client",
        lastName: "User",
        role: "client",
        status: "active",
        trainerId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // Act
      const result = EditUserFormSchema.parse(data);

      // Assert
      expect(result.trainerId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should accept administrator role", () => {
      // Arrange
      const data = {
        email: "admin@test.com",
        firstName: "Admin",
        lastName: "User",
        role: "administrator",
        status: "active",
      };

      // Act
      const result = EditUserFormSchema.parse(data);

      // Assert
      expect(result.role).toBe("administrator");
    });
  });

  describe("CreateClientFormSchema", () => {
    it("should accept valid client data", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        firstName: "Jane",
        lastName: "Doe",
        phone: "+48123456789",
        dateOfBirth: "1995-05-15",
      };

      // Act
      const result = CreateClientFormSchema.parse(data);

      // Assert
      expect(result.email).toBe("client@test.com");
      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Doe");
    });

    it("should accept empty optional fields", () => {
      // Arrange
      const data = {
        email: "client@test.com",
        firstName: "Jane",
        lastName: "Doe",
        phone: "",
        dateOfBirth: "",
      };

      // Act
      const result = CreateClientFormSchema.parse(data);

      // Assert
      expect(result.phone).toBe("");
      expect(result.dateOfBirth).toBe("");
    });

    it("should accept valid phone number formats", () => {
      // Arrange
      const validPhones = ["+48123456789", "+1-555-123-4567", "123 456 789"];

      // Act & Assert
      validPhones.forEach((phone) => {
        const data = {
          email: "client@test.com",
          firstName: "Jane",
          lastName: "Doe",
          phone,
        };
        expect(() => CreateClientFormSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe("UpdateClientFormSchema", () => {
    it("should accept valid update data", () => {
      // Arrange
      const data = {
        email: "updated@test.com",
        firstName: "Updated",
        lastName: "Name",
        phone: "+48987654321",
        dateOfBirth: "1990-01-01",
      };

      // Act
      const result = UpdateClientFormSchema.parse(data);

      // Assert
      expect(result.email).toBe("updated@test.com");
      expect(result.phone).toBe("+48987654321");
    });

    it("should reject empty phone (required in update)", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "User",
        lastName: "Name",
        phone: "",
        dateOfBirth: "1990-01-01",
      };

      // Act & Assert
      expect(() => UpdateClientFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject empty dateOfBirth (required in update)", () => {
      // Arrange
      const data = {
        email: "user@test.com",
        firstName: "User",
        lastName: "Name",
        phone: "+48123456789",
        dateOfBirth: "",
      };

      // Act & Assert
      expect(() => UpdateClientFormSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject missing required fields", () => {
      // Arrange
      const data = {
        email: "user@test.com",
      };

      // Act & Assert
      expect(() => UpdateClientFormSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("ListClientsQuerySchema", () => {
    it("should set default pagination values", () => {
      // Arrange
      const data = {};

      // Act
      const result = ListClientsQuerySchema.parse(data);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should accept search parameter", () => {
      // Arrange
      const data = { search: "john" };

      // Act
      const result = ListClientsQuerySchema.parse(data);

      // Assert
      expect(result.search).toBe("john");
    });

    it("should trim search query", () => {
      // Arrange
      const data = { search: "  john doe  " };

      // Act
      const result = ListClientsQuerySchema.parse(data);

      // Assert
      expect(result.search).toBe("john doe");
    });

    it("should accept status filter", () => {
      // Arrange
      const data = { status: "active" };

      // Act
      const result = ListClientsQuerySchema.parse(data);

      // Assert
      expect(result.status).toBe("active");
    });

    it("should reject invalid status", () => {
      // Arrange
      const data = { status: "invalid" };

      // Act & Assert
      expect(() => ListClientsQuerySchema.parse(data)).toThrow(ZodError);
    });

    it("should reject search query longer than 100 characters", () => {
      // Arrange
      const data = { search: "a".repeat(101) };

      // Act & Assert
      expect(() => ListClientsQuerySchema.parse(data)).toThrow(ZodError);
    });

    it("should accept all valid status values", () => {
      // Arrange
      const validStatuses = ["active", "pending", "suspended"];

      // Act & Assert
      validStatuses.forEach((status) => {
        const data = { status };
        expect(() => ListClientsQuerySchema.parse(data)).not.toThrow();
      });
    });
  });
});
