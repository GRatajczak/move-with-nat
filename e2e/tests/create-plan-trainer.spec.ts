import { test, expect, testUsers, trackPlansByName } from "../fixtures";
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
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let plansPage: PlansPage;
  let createPlanPage: CreatePlanPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    plansPage = new PlansPage(page);
    createPlanPage = new CreatePlanPage(page);

    // Login as trainer and navigate to plans
    await loginPage.goto();
    await loginPage.login(testUsers.trainer.email, testUsers.trainer.password);
    await loginPage.waitForSuccessfulLogin();

    await dashboardPage.navigateTo("Plany treningowe");
    await plansPage.expectLoaded();

    await plansPage.startCreatePlan();
    await createPlanPage.expectLoaded();
  });

  test("should display create plan form correctly", async () => {
    // Assert - Verify main form elements are visible
    await expect(createPlanPage.heading).toBeVisible();
    await expect(createPlanPage.nameInput).toBeVisible();
    await expect(createPlanPage.descriptionInput).toBeVisible();
    await expect(createPlanPage.clientSelect).toBeVisible();
    await expect(createPlanPage.addExerciseButton).toBeVisible();
    await expect(createPlanPage.backButton).toBeVisible();

    // Scroll to bottom to see action buttons
    await createPlanPage.saveButton.scrollIntoViewIfNeeded();
    await expect(createPlanPage.saveButton).toBeVisible();
    await expect(createPlanPage.cancelButton).toBeVisible();
  });

  test("should create a basic plan with required fields only", async ({ supabaseTestClient, teardown }) => {
    const uniquePlanName = `Basic Plan ${Date.now()}`;

    // Act - Fill only required fields
    await createPlanPage.fillPlanName(uniquePlanName);
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();
    await createPlanPage.submit();

    // Assert - Verify success
    await createPlanPage.waitForSuccessModal();

    // Cleanup
    await trackPlansByName(supabaseTestClient, teardown, uniquePlanName);

    await createPlanPage.returnToListFromModal();
    await plansPage.expectLoaded();
    await plansPage.expectPlanVisible(uniquePlanName);
  });

  test("should create a complete plan with all fields", async ({ supabaseTestClient, teardown }) => {
    const uniquePlanName = `Complete Plan ${Date.now()}`;
    const description = "This is a complete test plan with all fields filled";

    // Act - Fill all fields
    await createPlanPage.fillPlanName(uniquePlanName);
    await createPlanPage.fillDescription(description);
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();
    await createPlanPage.submit();

    // Assert - Verify success
    await createPlanPage.waitForSuccessModal();

    // Cleanup
    await trackPlansByName(supabaseTestClient, teardown, uniquePlanName);

    await createPlanPage.returnToListFromModal();
    await plansPage.expectLoaded();
    await plansPage.expectPlanVisible(uniquePlanName);
  });

  test("should validate required fields", async () => {
    // Act - Try to submit without filling required fields
    // The save button should be disabled initially

    // Assert - Check validation
    const isSaveEnabled = await createPlanPage.isSaveButtonEnabled();
    expect(isSaveEnabled).toBe(false);
  });

  test("should show validation error when name is missing", async () => {
    // Act - Fill only client and exercises, skip name
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();

    // Save button should still be disabled
    const isSaveEnabled = await createPlanPage.isSaveButtonEnabled();
    expect(isSaveEnabled).toBe(false);
  });

  test("should create plan with visibility toggle", async ({ supabaseTestClient, teardown }) => {
    const uniquePlanName = `Visibility Plan ${Date.now()}`;

    // Act - Create plan (default visibility is visible)
    await createPlanPage.fillPlanName(uniquePlanName);
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();

    // Assert - Verify switch is present and interactable
    await expect(createPlanPage.hiddenSwitch).toBeVisible();
    await expect(createPlanPage.hiddenSwitch).toBeEnabled();

    await createPlanPage.submit();
    await createPlanPage.waitForSuccessModal();

    // Cleanup
    await trackPlansByName(supabaseTestClient, teardown, uniquePlanName);
  });

  test("should navigate back to plans list using back button", async ({ page }) => {
    // Act - Click back button
    await createPlanPage.clickBackButton();

    // Assert - Verify navigation to plans list
    await expect(page).toHaveURL(/\/trainer\/plans$/);
    await plansPage.expectLoaded();
  });

  test("should cancel plan creation and return to list", async ({ page }) => {
    // Arrange - Start filling form
    await createPlanPage.fillPlanName("Plan to Cancel");

    // Act - Click cancel button
    await createPlanPage.cancel();

    // Assert - Verify navigation back to plans
    await expect(page).toHaveURL(/\/trainer\/plans$/);
    await plansPage.expectLoaded();
  });

  test("should handle long description", async ({ supabaseTestClient, teardown }) => {
    const uniquePlanName = `Long Description Plan ${Date.now()}`;
    const longDescription = "A".repeat(450); // 450 characters

    // Act - Fill with long description
    await createPlanPage.fillPlanName(uniquePlanName);
    await createPlanPage.fillDescription(longDescription);
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();

    // Assert - Verify character count is shown (limit is 1000, not 500)
    const charCount = await createPlanPage.getDescriptionCharacterCount();
    expect(charCount).toMatch(/450.*1000/); // Flexible match for "450 / 1000" or "450/1000"

    await createPlanPage.submit();
    await createPlanPage.waitForSuccessModal();

    // Cleanup
    await trackPlansByName(supabaseTestClient, teardown, uniquePlanName);
  });
});
