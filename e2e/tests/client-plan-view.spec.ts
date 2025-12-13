import { test, expect, testUsers } from "../fixtures";
import { LoginPage } from "../pages/LoginPage";
import { ClientDashboardPage } from "../pages/ClientDashboardPage";
import { ClientPlanDetailsPage } from "../pages/ClientPlanDetailsPage";

/**
 * E2E Test Suite for Client Plan View
 * Tests the flow of a client viewing their training plans and plan details
 *
 * Note: Uses testPlan fixture which creates a plan once before all tests.
 * The plan is cleaned up after ALL tests in this suite complete.
 */
test.describe("Client Plan View", () => {
  let loginPage: LoginPage;
  let clientDashboard: ClientDashboardPage;
  let planDetailsPage: ClientPlanDetailsPage;
  let testPlanId: string;

  test.beforeAll(async ({ testPlan }) => {
    // Store test plan ID for cleanup
    testPlanId = testPlan.id;
    console.log(`✓ Using test plan: ${testPlan.id}`);
  });

  test.beforeEach(async ({ page }) => {
    // Arrange - Initialize page objects
    loginPage = new LoginPage(page);
    clientDashboard = new ClientDashboardPage(page);
    planDetailsPage = new ClientPlanDetailsPage(page);

    // Login as client
    await loginPage.goto();
    await loginPage.login(testUsers.client.email, testUsers.client.password);
    await loginPage.waitForSuccessfulLogin();

    // Wait for dashboard to load
    await clientDashboard.expectLoaded();
    // Ensure at least the test plan exists (may be multiple plans in parallel execution)
    await clientDashboard.expectHasPlans();
  });

  test.afterAll(async ({ supabaseTestClient }) => {
    // Cleanup test plan after ALL tests complete
    console.log(`✓ Cleaning up test plan: ${testPlanId}`);
    const { cleanupPlans, createTeardownTracker } = await import("../fixtures/teardown.fixture");
    const tracker = createTeardownTracker();
    tracker.planIds.add(testPlanId);
    await cleanupPlans(supabaseTestClient, tracker);
  });

  test("should display client dashboard with test plan", async () => {
    // Assert - Verify dashboard is loaded with test plan
    await clientDashboard.expectHasPlans();

    const plansCount = await clientDashboard.getPlansCount();
    expect(plansCount).toBeGreaterThanOrEqual(1);
  });

  test("should navigate to plan details when clicking a plan card", async ({ page }) => {
    // Get the first plan's title for verification
    const firstPlanTitle = await clientDashboard.getPlanTitle(0);

    // Act - Click on the first plan card
    await clientDashboard.clickPlanCard(0);

    // Assert - Verify navigation to plan details page
    await expect(page).toHaveURL(/\/client\/plans\/.+/);
    await planDetailsPage.expectLoaded();

    // Assert - Verify plan title matches
    await planDetailsPage.expectPlanTitle(firstPlanTitle);
  });

  test("should display plan details with exercises", async () => {
    // Act - Click on the first plan
    await clientDashboard.clickPlanCard(0);

    // Assert - Verify plan details page is loaded
    await planDetailsPage.expectLoaded();

    // Assert - Verify plan title is visible
    const planTitle = await planDetailsPage.getPlanTitle();
    expect(planTitle.length).toBeGreaterThan(0);

    // Assert - Verify exercises list is visible
    await planDetailsPage.expectExercisesListVisible();

    // Assert - Verify plan has at least one exercise (test plan should have exercises)
    const exercisesCount = await planDetailsPage.getExercisesCount();
    expect(exercisesCount).toBeGreaterThan(0);

    // Verify first exercise details are visible
    const firstExercise = await planDetailsPage.getExerciseDetails(0);
    expect(firstExercise.name).toBeTruthy();
    expect(firstExercise.sets).toBeTruthy();
    expect(firstExercise.reps).toBeTruthy();
  });

  test("should navigate back to dashboard from plan details", async ({ page }) => {
    // Arrange - Navigate to a plan details page
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Act - Click back button
    await planDetailsPage.clickBackButton();

    // Assert - Verify navigation back to dashboard
    await expect(page).toHaveURL(/\/client$/);
    await clientDashboard.expectLoaded();
  });

  test("should display exercise details correctly", async () => {
    // Arrange - Navigate to plan details
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Act & Assert - Verify exercises have required information
    const exercisesCount = await planDetailsPage.getExercisesCount();
    expect(exercisesCount).toBeGreaterThan(0);

    // Verify each exercise has name, sets, and reps
    for (let i = 0; i < exercisesCount; i++) {
      const exercise = await planDetailsPage.getExerciseDetails(i);

      // Assert - Exercise has a name
      expect(exercise.name).toBeTruthy();
      expect(exercise.name.length).toBeGreaterThan(0);

      // Assert - Exercise has sets information
      expect(exercise.sets).toContain("serii");

      // Assert - Exercise has reps information
      expect(exercise.reps).toContain("powt.");
    }
  });

  test("should display plan description", async () => {
    // Arrange - Navigate to plan details
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Act - Check if description is present
    const hasDescription = await planDetailsPage.hasPlanDescription();

    // Assert - Test plan should have a description
    expect(hasDescription).toBe(true);
    const description = await planDetailsPage.getPlanDescription();
    expect(description.length).toBeGreaterThan(0);
  });

  test("should have at least one plan visible", async () => {
    // Assert - Verify at least one plan is visible
    const plansCount = await clientDashboard.getPlansCount();
    expect(plansCount).toBeGreaterThanOrEqual(1);

    // Verify the first plan has a title
    const firstPlanTitle = await clientDashboard.getPlanTitle(0);
    expect(firstPlanTitle.length).toBeGreaterThan(0);
  });

  test("should maintain correct URL structure when navigating", async ({ page }) => {
    // Act - Click on first plan
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Assert - Verify URL follows expected pattern
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/client\/plans\/[a-f0-9-]+/);

    // Act - Navigate back
    await planDetailsPage.clickBackButton();

    // Assert - Verify URL is correct after navigation
    await expect(page).toHaveURL(/\/client$/);
  });

  test("should display all plan information consistently", async () => {
    // Arrange - Get plan info from dashboard
    const dashboardPlanTitle = await clientDashboard.getPlanTitle(0);
    expect(dashboardPlanTitle.length).toBeGreaterThan(0);

    // Act - Navigate to plan details
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Assert - Verify plan title consistency between dashboard and details page
    const detailsPlanTitle = await planDetailsPage.getPlanTitle();
    expect(detailsPlanTitle).toBe(dashboardPlanTitle);
  });
});
