import { describe, it, expect, vi } from "vitest";

describe("Example Unit Tests", () => {
  describe("Basic functionality", () => {
    it("should pass a simple assertion", () => {
      expect(true).toBe(true);
    });

    it("should perform basic arithmetic", () => {
      const result = 2 + 2;
      expect(result).toBe(4);
    });
  });

  describe("Mock functions", () => {
    it("should create and use mock functions", () => {
      const mockFn = vi.fn();
      mockFn("test");

      expect(mockFn).toHaveBeenCalledWith("test");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should use mockReturnValue", () => {
      const mockFn = vi.fn().mockReturnValue("mocked value");

      const result = mockFn();

      expect(result).toBe("mocked value");
    });
  });

  describe("Async operations", () => {
    it("should handle promises", async () => {
      const asyncFn = async () => {
        return "async result";
      };

      const result = await asyncFn();

      expect(result).toBe("async result");
    });

    it("should handle rejected promises", async () => {
      const asyncFn = async () => {
        throw new Error("test error");
      };

      await expect(asyncFn()).rejects.toThrow("test error");
    });
  });
});
