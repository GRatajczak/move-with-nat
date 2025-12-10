import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration for DOM testing
    environment: "jsdom",

    // Setup files to run before each test file
    setupFiles: ["./test-setup.ts"],

    // Global test configuration
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test-setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
        "**/build/**",
        "**/.astro/**",
        "**/coverage/**",
        "**/e2e/**",
      ],
      // Thresholds for coverage (configure as needed)
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test file patterns
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "build", ".astro", "e2e"],

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Timeout configuration (in milliseconds)
    testTimeout: 10000,
  },

  // Path resolution
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@db": fileURLToPath(new URL("./src/db", import.meta.url)),
    },
  },
});
