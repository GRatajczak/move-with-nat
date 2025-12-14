import type { SupabaseTestClient } from "./supabase.fixture";

/**
 * E2E Test Teardown Helpers
 *
 * Provides utilities for cleaning up test data after E2E tests complete.
 * These helpers use authenticated Supabase client with admin privileges.
 */

export interface TeardownTracker {
  planIds: Set<string>;
  exerciseIds: Set<string>;
}

/**
 * No authentication needed for teardown operations
 * The Supabase client is already created with service role key which has full database access.
 * Previous authentication attempts were causing failures and are unnecessary.
 */

/**
 * Create a new teardown tracker
 */
export const createTeardownTracker = (): TeardownTracker => ({
  planIds: new Set(),
  exerciseIds: new Set(),
});

/**
 * Helper to retry operations with exponential backoff
 */
const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if not a rate limit error
      if (!error || typeof error !== "object" || !("status" in error) || error.status !== 429) {
        throw error;
      }

      // Wait with exponential backoff before retry
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Delete all tracked plans and their associated plan_exercises
 *
 * @param client - Supabase admin client (with service role key)
 * @param tracker - Teardown tracker containing plan IDs to delete
 */
export const cleanupPlans = async (client: SupabaseTestClient, tracker: TeardownTracker): Promise<void> => {
  if (tracker.planIds.size === 0) {
    return;
  }

  const planIds = Array.from(tracker.planIds);

  try {
    // Delete plan_exercises first (due to foreign key constraints)
    await retryWithBackoff(async () => {
      const { error: planExercisesError } = await client.from("plan_exercises").delete().in("plan_id", planIds);
      if (planExercisesError) {
        console.error("Failed to delete plan_exercises during teardown:", planExercisesError);
      }
    });

    // Then delete plans
    await retryWithBackoff(async () => {
      const { error: plansError } = await client.from("plans").delete().in("id", planIds);
      if (plansError) {
        console.error("Failed to delete plans during teardown:", plansError);
        throw plansError;
      }
    });

    console.log(`✓ Cleaned up ${planIds.length} test plan(s)`);
  } catch (error) {
    console.error("Failed to cleanup plans after retries:", error);
    // Don't throw - allow tests to complete even if cleanup fails
  }

  // Clear the tracker
  tracker.planIds.clear();
};

/**
 * Delete all tracked exercises
 *
 * Note: This should be used carefully as exercises may be referenced by plan_exercises.
 * Only delete exercises that were created specifically for testing.
 *
 * @param client - Supabase admin client (with service role key)
 * @param tracker - Teardown tracker containing exercise IDs to delete
 */
export const cleanupExercises = async (client: SupabaseTestClient, tracker: TeardownTracker): Promise<void> => {
  if (tracker.exerciseIds.size === 0) {
    return;
  }

  const exerciseIds = Array.from(tracker.exerciseIds);

  try {
    // First, delete any plan_exercises that reference these exercises
    await retryWithBackoff(async () => {
      const { error: planExercisesError } = await client.from("plan_exercises").delete().in("exercise_id", exerciseIds);

      if (planExercisesError) {
        console.error("Failed to delete plan_exercises for exercises during teardown:", planExercisesError);
      }
    });

    // Then delete the exercises
    await retryWithBackoff(async () => {
      const { error: exercisesError } = await client.from("exercises").delete().in("id", exerciseIds);

      if (exercisesError) {
        console.error("Failed to delete exercises during teardown:", exercisesError);
        throw exercisesError;
      }
    });

    console.log(`✓ Cleaned up ${exerciseIds.length} test exercise(s)`);
  } catch (error) {
    console.error("Failed to cleanup exercises after retries:", error);
    // Don't throw - allow tests to complete even if cleanup fails
  }

  // Clear the tracker
  tracker.exerciseIds.clear();
};

/**
 * Clean up all tracked test data
 *
 * @param client - Supabase admin client
 * @param tracker - Teardown tracker containing all IDs to delete
 */
export const cleanupAll = async (client: SupabaseTestClient, tracker: TeardownTracker): Promise<void> => {
  // Clean up plans first (this also handles plan_exercises)
  await cleanupPlans(client, tracker);

  // Then clean up exercises
  await cleanupExercises(client, tracker);
};

/**
 * Query and track plans created by a specific name pattern
 * Useful for tracking plans created during tests
 *
 * @param client - Supabase admin client (with service role key)
 * @param tracker - Teardown tracker to store found plan IDs
 * @param namePattern - SQL LIKE pattern for plan names (e.g., 'Test Training Plan%')
 */
export const trackPlansByName = async (
  client: SupabaseTestClient,
  tracker: TeardownTracker,
  namePattern: string
): Promise<void> => {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      const result = await client.from("plans").select("id").like("name", namePattern);
      if (result.error) throw result.error;
      return result;
    });

    if (error) {
      console.error("Failed to query plans for tracking:", error);
      return;
    }

    if (data) {
      data.forEach((plan) => tracker.planIds.add(plan.id));
    }
  } catch (error) {
    console.error("Failed to query plans for tracking after retries:", error);
  }
};

/**
 * Query and track plans created after a specific timestamp
 *
 * @param client - Supabase admin client (with service role key)
 * @param tracker - Teardown tracker to store found plan IDs
 * @param afterTimestamp - ISO timestamp string
 */
export const trackPlansAfterTimestamp = async (
  client: SupabaseTestClient,
  tracker: TeardownTracker,
  afterTimestamp: string
): Promise<void> => {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      const result = await client.from("plans").select("id").gt("created_at", afterTimestamp);
      if (result.error) throw result.error;
      return result;
    });

    if (error) {
      console.error("Failed to query plans for tracking:", error);
      return;
    }

    if (data) {
      data.forEach((plan) => tracker.planIds.add(plan.id));
    }
  } catch (error) {
    console.error("Failed to query plans for tracking after retries:", error);
  }
};
