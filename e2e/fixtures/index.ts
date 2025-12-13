import { test as base } from "@playwright/test";
import { createSupabaseTestClient, type SupabaseTestClient } from "./supabase.fixture";
import { createTeardownTracker, cleanupAll, type TeardownTracker } from "./teardown.fixture";
import { createTestPlan, type TestPlanData } from "./test-plan.fixture";

/**
 * Extended Playwright Test with E2E Fixtures
 *
 * This extends the base Playwright test with custom fixtures:
 * - supabaseTestClient: Admin Supabase client for database operations
 * - teardown: Automatic cleanup tracker that runs after each test
 * - testPlan: Pre-created test plan for client tests (worker-scoped)
 *
 * Usage:
 * ```typescript
 * import { test } from '../fixtures';
 *
 * test('my test', async ({ page, teardown, testPlan }) => {
 *   // testPlan is already created and will be cleaned up automatically
 *   console.log(`Testing with plan: ${testPlan.id}`);
 * });
 * ```
 */

interface E2EFixtures {
  supabaseTestClient: SupabaseTestClient;
  teardown: TeardownTracker;
}

interface E2EWorkerFixtures {
  testPlan: TestPlanData;
}

export const test = base.extend<E2EFixtures, E2EWorkerFixtures>({
  supabaseTestClient: async ({}, use) => {
    const client = createSupabaseTestClient();
    await use(client);
  },

  teardown: async ({ supabaseTestClient }, use) => {
    const tracker = createTeardownTracker();
    await use(tracker);
    await cleanupAll(supabaseTestClient, tracker);
  },

  testPlan: [
    async ({}, use) => {
      const client = createSupabaseTestClient();
      const plan = await createTestPlan(client);
      await use(plan);
      // Cleanup will be handled by teardown fixture in tests that use this
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";

// Re-export fixtures and helpers for convenience
export { createSupabaseTestClient } from "./supabase.fixture";
export type { SupabaseTestClient } from "./supabase.fixture";
export {
  createTeardownTracker,
  cleanupPlans,
  cleanupExercises,
  cleanupAll,
  trackPlansByName,
  trackPlansAfterTimestamp,
} from "./teardown.fixture";
export type { TeardownTracker } from "./teardown.fixture";
export { createTestPlan } from "./test-plan.fixture";
export type { TestPlanData } from "./test-plan.fixture";

// Re-export test users for convenience
export { testUsers, testPlan, testExercise } from "./test-users";
