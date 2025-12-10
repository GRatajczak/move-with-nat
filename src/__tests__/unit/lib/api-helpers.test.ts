// src/__tests__/unit/lib/api-helpers.test.ts

import { describe, it, expect } from "vitest";
import { ZodError, z } from "zod";
import { handleAPIError, isValidUUID } from "../../../lib/api-helpers";
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  EmailError,
} from "../../../lib/errors";

describe("api-helpers", () => {
  describe("handleAPIError", () => {
    // ✅ ZodError Handling
    it("should convert ZodError to 400 response with field details", async () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      let zodError: ZodError | undefined;
      try {
        schema.parse({ email: "invalid", age: 10 });
      } catch (error) {
        zodError = error as ZodError;
      }

      // Act
      expect(zodError).toBeDefined();
      const response = handleAPIError(zodError as ZodError);

      // Assert
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(body.details).toBeDefined();
      expect(body.details.email).toBeDefined();
      expect(body.details.age).toBeDefined();
    });

    it("should handle nested ZodError paths correctly", async () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });

      let zodError: ZodError | undefined;
      try {
        schema.parse({ user: { profile: { email: "invalid" } } });
      } catch (error) {
        zodError = error as ZodError;
      }

      // Act
      expect(zodError).toBeDefined();
      const response = handleAPIError(zodError as ZodError);
      const body = await response.json();

      // Assert
      expect(body.details["user.profile.email"]).toBeDefined();
    });

    // ✅ ValidationError Handling
    it("should convert ValidationError to 400 response", async () => {
      // Arrange
      const error = new ValidationError({ field: "Invalid value" });

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(body.details).toEqual({ field: "Invalid value" });
    });

    // ✅ UnauthorizedError Handling
    it("should convert UnauthorizedError to 401 response", async () => {
      // Arrange
      const error = new UnauthorizedError("Authentication required");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Authentication required");
      expect(body.code).toBe("UNAUTHORIZED");
      expect(body.details).toBeUndefined();
    });

    it("should use default message for UnauthorizedError", async () => {
      // Arrange
      const error = new UnauthorizedError();

      // Act
      const response = handleAPIError(error);
      const body = await response.json();

      // Assert
      expect(body.error).toBe("Authentication required");
    });

    // ✅ ForbiddenError Handling
    it("should convert ForbiddenError to 403 response", async () => {
      // Arrange
      const error = new ForbiddenError("Access denied");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Access denied");
      expect(body.code).toBe("FORBIDDEN");
    });

    // ✅ NotFoundError Handling
    it("should convert NotFoundError to 404 response", async () => {
      // Arrange
      const error = new NotFoundError("User not found");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("User not found");
      expect(body.code).toBe("NOT_FOUND");
    });

    // ✅ ConflictError Handling
    it("should convert ConflictError to 409 response", async () => {
      // Arrange
      const error = new ConflictError("Email already exists");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toBe("Email already exists");
      expect(body.code).toBe("CONFLICT");
    });

    // ✅ DatabaseError Handling
    it("should convert DatabaseError to 500 response", async () => {
      // Arrange
      const error = new DatabaseError("Database connection failed");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Database connection failed");
      expect(body.code).toBe("DATABASE_ERROR");
    });

    // ✅ EmailError Handling
    it("should convert EmailError to 500 response", async () => {
      // Arrange
      const error = new EmailError("Failed to send email");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Failed to send email");
      expect(body.code).toBe("EMAIL_ERROR");
    });

    // ✅ Unknown Error Handling
    it("should convert unknown Error to 500 response", async () => {
      // Arrange
      const error = new Error("Unexpected error");

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Internal server error");
      expect(body.code).toBe("INTERNAL_ERROR");
    });

    it("should handle string errors", async () => {
      // Arrange
      const error = "Something went wrong";

      // Act
      const response = handleAPIError(error);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Internal server error");
      expect(body.code).toBe("INTERNAL_ERROR");
    });

    it("should handle null/undefined errors", async () => {
      // Arrange & Act
      const response1 = handleAPIError(null);
      const response2 = handleAPIError(undefined);

      // Assert
      expect(response1.status).toBe(500);
      expect(response2.status).toBe(500);
    });

    // ✅ AppError with Details
    it("should include details when AppError has them", async () => {
      // Arrange
      const error = new ValidationError({
        email: "Invalid email format",
        phone: "Invalid phone number",
      });

      // Act
      const response = handleAPIError(error);
      const body = await response.json();

      // Assert
      expect(body.details).toEqual({
        email: "Invalid email format",
        phone: "Invalid phone number",
      });
    });

    // ✅ Edge Cases
    it("should handle ZodError with empty issues array", async () => {
      // Arrange
      const zodError = new ZodError([]);

      // Act
      const response = handleAPIError(zodError);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(body.details).toEqual({});
    });

    it("should handle ZodError with complex error messages", async () => {
      // Arrange
      const schema = z.string().min(5).max(10);
      let zodError: ZodError | undefined;
      try {
        schema.parse("abc");
      } catch (error) {
        zodError = error as ZodError;
      }

      // Act
      expect(zodError).toBeDefined();
      const response = handleAPIError(zodError as ZodError);
      const body = await response.json();

      // Assert
      expect(body.details).toBeDefined();
    });
  });

  describe("isValidUUID", () => {
    // ✅ Valid UUIDs
    it("should return true for valid UUID v1", () => {
      // Arrange
      const validUUID = "550e8400-e29b-11d4-a716-446655440000";

      // Act
      const result = isValidUUID(validUUID);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for valid UUID v4", () => {
      // Arrange
      const validUUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

      // Act
      const result = isValidUUID(validUUID);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for all-zeros UUID", () => {
      // Arrange
      const validUUID = "00000000-0000-0000-0000-000000000000";

      // Act
      const result = isValidUUID(validUUID);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for all-Fs UUID", () => {
      // Arrange
      const validUUID = "ffffffff-ffff-5fff-afff-ffffffffffff";

      // Act
      const result = isValidUUID(validUUID);

      // Assert
      expect(result).toBe(true);
    });

    it("should be case-insensitive", () => {
      // Arrange
      const mixedCaseUUID = "550E8400-E29B-41D4-A716-446655440000";

      // Act
      const result = isValidUUID(mixedCaseUUID);

      // Assert
      expect(result).toBe(true);
    });

    // ✅ Invalid UUIDs
    it("should return false for UUID without hyphens", () => {
      // Arrange
      const invalidUUID = "550e8400e29b41d4a716446655440000";

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for UUID with wrong hyphen positions", () => {
      // Arrange
      const invalidUUID = "550e8400-e29b41d4-a716-446655440000";

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for too short string", () => {
      // Arrange
      const invalidUUID = "550e8400-e29b-41d4";

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for too long string", () => {
      // Arrange
      const invalidUUID = "550e8400-e29b-41d4-a716-446655440000-extra";

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      // Arrange
      const invalidUUID = "";

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for random text", () => {
      // Arrange
      const invalidUUID = "not-a-valid-uuid-at-all-here";

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for UUID with invalid characters", () => {
      // Arrange
      const invalidUUID = "550e8400-e29b-41d4-a716-44665544000g"; // 'g' is invalid hex

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for UUID with invalid version digit", () => {
      // Arrange
      const invalidUUID = "550e8400-e29b-71d4-a716-446655440000"; // version 7 doesn't exist in v1-v5

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for UUID with invalid variant", () => {
      // Arrange
      const invalidUUID = "550e8400-e29b-41d4-1716-446655440000"; // Invalid variant (should be 8, 9, a, or b)

      // Act
      const result = isValidUUID(invalidUUID);

      // Assert
      expect(result).toBe(false);
    });

    // ✅ Edge Cases
    it("should handle null gracefully", () => {
      // Arrange
      const invalidUUID = null as unknown as string;

      // Act & Assert
      expect(() => isValidUUID(invalidUUID)).toThrow();
    });

    it("should handle undefined gracefully", () => {
      // Arrange
      const invalidUUID = undefined as unknown as string;

      // Act & Assert
      expect(() => isValidUUID(invalidUUID)).toThrow();
    });
  });
});
