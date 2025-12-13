import { test, testUsers, testPlan, trackPlansByName } from "../fixtures";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { PlansPage } from "../pages/PlansPage";
import { CreatePlanPage } from "../pages/CreatePlanPage";

/**
 * E2E Test Suite for Trainer Plan Creation
 *
 * Tests the flow of a trainer creating new training plans.
 * Uses automatic teardown to clean up created plans after tests complete.
 */
test.describe("Trainer Plan Creation", () => {
  test("trainer can create a new plan with exercises", async ({ page, supabaseTestClient, teardown }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const plansPage = new PlansPage(page);
    const createPlanPage = new CreatePlanPage(page);

    const uniquePlanName = `${testPlan.name} ${Date.now()}`;

    await loginPage.goto();
    await loginPage.login(testUsers.trainer.email, testUsers.trainer.password);
    await loginPage.waitForSuccessfulLogin();

    await dashboardPage.navigateTo("Plany treningowe");
    await plansPage.expectLoaded();

    await plansPage.startCreatePlan();
    await createPlanPage.expectLoaded();

    await createPlanPage.fillPlanName(uniquePlanName);
    await createPlanPage.fillDescription(testPlan.description);
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();
    await createPlanPage.submit();

    await createPlanPage.waitForSuccessModal();

    // Track the created plan for automatic cleanup
    // Query by name pattern to find the plan we just created
    await trackPlansByName(supabaseTestClient, teardown, uniquePlanName);

    await createPlanPage.returnToListFromModal();
    await plansPage.expectLoaded();
    await plansPage.expectPlanVisible(uniquePlanName);
  });
});
