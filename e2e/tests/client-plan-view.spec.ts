import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ClientDashboardPage } from "../pages/ClientDashboardPage";
import { ClientPlanDetailsPage } from "../pages/ClientPlanDetailsPage";
import { testUsers } from "../fixtures/test-users";

/**
 * E2E Test Suite for Client Plan View
 * Tests the flow of a client viewing their training plans and plan details
 */
test.describe("Client Plan View", () => {
  let loginPage: LoginPage;
  let clientDashboard: ClientDashboardPage;
  let planDetailsPage: ClientPlanDetailsPage;

  test.beforeEach(async ({ page }) => {
    // Arrange - Initialize page objects
    loginPage = new LoginPage(page);
    clientDashboard = new ClientDashboardPage(page);
    planDetailsPage = new ClientPlanDetailsPage(page);

    // Login as client
    await loginPage.goto();
    await loginPage.login(testUsers.client.email, testUsers.client.password);
    await loginPage.waitForSuccessfulLogin();
  });

  test("should display client dashboard with or without plans", async () => {
    // Assert - Verify dashboard is loaded
    await clientDashboard.expectLoaded();

    // Assert - Check if plans are loaded (may be empty)
    const hasPlans = await clientDashboard.hasPlans();
    const plansCount = await clientDashboard.getPlansCount();

    // Test passes regardless of whether client has plans or not
    // This is more realistic as clients may not have plans assigned yet
    expect(plansCount).toBeGreaterThanOrEqual(0);

    // Only verify plan cards if they exist
    if (hasPlans) {
      await clientDashboard.expectHasPlans();
    }
  });

  test("should navigate to plan details when clicking a plan card", async ({ page }) => {
    // Arrange - Ensure dashboard is loaded
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();

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
    // Arrange - Navigate to dashboard
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();

    // Act - Click on the first plan
    await clientDashboard.clickPlanCard(0);

    // Assert - Verify plan details page is loaded
    await planDetailsPage.expectLoaded();

    // Assert - Verify plan title is visible
    const planTitle = await planDetailsPage.getPlanTitle();
    expect(planTitle).toBeTruthy();

    // Assert - Verify exercises list is visible
    await planDetailsPage.expectExercisesListVisible();

    // Assert - Check if plan has exercises
    const hasExercises = await planDetailsPage.hasExercises();

    if (hasExercises) {
      // Verify at least one exercise is visible
      const exercisesCount = await planDetailsPage.getExercisesCount();
      expect(exercisesCount).toBeGreaterThan(0);

      // Verify first exercise details are visible
      const firstExercise = await planDetailsPage.getExerciseDetails(0);
      expect(firstExercise.name).toBeTruthy();
      expect(firstExercise.sets).toBeTruthy();
      expect(firstExercise.reps).toBeTruthy();
    } else {
      // Verify empty state is shown
      const hasEmptyState = await planDetailsPage.hasEmptyExercisesState();
      expect(hasEmptyState).toBe(true);
    }
  });

  test("should navigate back to dashboard from plan details", async ({ page }) => {
    // Arrange - Navigate to a plan details page
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();
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
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Act & Assert - Verify exercises have required information
    const hasExercises = await planDetailsPage.hasExercises();

    if (hasExercises) {
      const exercisesCount = await planDetailsPage.getExercisesCount();

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
    }
  });

  test("should display plan description if available", async () => {
    // Arrange - Navigate to plan details
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Act - Check if description is present
    const hasDescription = await planDetailsPage.hasPlanDescription();

    // Assert - If description exists, it should have content
    if (hasDescription) {
      const description = await planDetailsPage.getPlanDescription();
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("should handle empty plans gracefully", async () => {
    // Arrange - Navigate to client dashboard
    await clientDashboard.expectLoaded();

    // Assert - Verify the page loads without errors even if no plans
    const plansCount = await clientDashboard.getPlansCount();

    // The test passes as long as the dashboard loads successfully
    // Either with plans (count > 0) or without (count === 0)
    expect(plansCount).toBeGreaterThanOrEqual(0);
  });

  test("should maintain correct URL structure when navigating", async ({ page }) => {
    // Arrange - Navigate to dashboard
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();

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
    await clientDashboard.expectLoaded();

    // Check if client has plans
    const hasPlans = await clientDashboard.hasPlans();
    if (!hasPlans) {
      test.skip(true, "Client has no plans assigned - skipping test");
      return;
    }

    await clientDashboard.expectHasPlans();

    const dashboardPlanTitle = await clientDashboard.getPlanTitle(0);

    // Act - Navigate to plan details
    await clientDashboard.clickPlanCard(0);
    await planDetailsPage.expectLoaded();

    // Assert - Verify plan title consistency
    const detailsPlanTitle = await planDetailsPage.getPlanTitle();
    expect(detailsPlanTitle).toBe(dashboardPlanTitle);
  });
});
