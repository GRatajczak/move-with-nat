import type { SupabaseTestClient } from "./supabase.fixture";
import { testUsers } from "./test-users";

/**
 * E2E Test Plan Setup Fixture
 *
 * Creates a test plan for the client user before tests run.
 * The plan will be automatically cleaned up by the teardown fixture.
 */

export interface TestPlanData {
  id: string;
  name: string;
  description: string;
}

/**
 * Create a test plan for E2E client
 */
export const createTestPlan = async (client: SupabaseTestClient): Promise<TestPlanData> => {
  // Sign in as trainer to create the plan
  const { error: signInError } = await client.auth.signInWithPassword({
    email: testUsers.trainer.email,
    password: testUsers.trainer.password,
  });

  if (signInError) {
    console.error("Failed to sign in as trainer:", signInError);
    throw signInError;
  }

  // Get a sample exercise to add to the plan
  const { data: exercises, error: exercisesError } = await client.from("exercises").select("id").limit(1).single();

  if (exercisesError || !exercises) {
    console.error("Failed to fetch exercise:", exercisesError);
    throw new Error("No exercises available for test plan");
  }

  // Create the plan
  const planData = {
    name: "E2E Test Plan (Seed)",
    description: "This plan is created for E2E tests and will be cleaned up automatically",
    client_id: testUsers.client.id,
    trainer_id: testUsers.trainer.id,
    is_hidden: false,
  };

  const { data: plan, error: planError } = await client.from("plans").insert(planData).select().single();

  if (planError || !plan) {
    console.error("Failed to create test plan:", planError);
    throw planError;
  }

  // Add an exercise to the plan
  const { error: planExerciseError } = await client.from("plan_exercises").insert({
    plan_id: plan.id,
    exercise_id: exercises.id,
    exercise_order: 1,
    sets: 3,
    reps: 10,
    tempo: "2-0-2-0",
    default_weight: 10,
    is_completed: false,
  });

  if (planExerciseError) {
    console.error("Failed to add exercise to plan:", planExerciseError);
    // Don't throw - plan is created, just without exercises
  }

  console.log(`✓ Created test plan: ${plan.id}`);

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || "",
  };
};
