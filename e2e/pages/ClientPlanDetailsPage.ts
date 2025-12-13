import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Page Object Model for Client Plan Details Page
 * Represents the page where a client views details of a specific training plan
 */
export class ClientPlanDetailsPage {
  readonly page: Page;
  readonly planDetailsContainer: Locator;
  readonly backButton: Locator;
  readonly planTitle: Locator;
  readonly planDescription: Locator;
  readonly exercisesList: Locator;
  readonly exerciseItems: Locator;
  readonly emptyExercisesState: Locator;
  readonly errorState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators using stable data-testid selectors
    this.planDetailsContainer = page.getByTestId("plan-details-page");
    this.backButton = page.getByTestId("back-to-dashboard-button");
    this.planTitle = page.getByTestId("plan-details-title");
    this.planDescription = page.getByTestId("plan-details-description");
    this.exercisesList = page.getByTestId("plan-exercises-list");
    this.exerciseItems = page.getByTestId("plan-exercise-item");
    this.emptyExercisesState = page.getByTestId("empty-exercises-state");
    this.errorState = page.getByTestId("plan-error-state");
  }

  /**
   * Navigate to a specific plan details page
   */
  async goto(planId: string) {
    await this.page.goto(`/client/plans/${planId}`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    await this.planDetailsContainer.waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Verify the page is loaded and visible
   */
  async expectLoaded() {
    await expect(this.planDetailsContainer).toBeVisible({ timeout: 20000 });
    await expect(this.planTitle).toBeVisible();
  }

  /**
   * Get the plan title text
   */
  async getPlanTitle(): Promise<string> {
    return (await this.planTitle.textContent()) || "";
  }

  /**
   * Get the plan description text
   */
  async getPlanDescription(): Promise<string> {
    return (await this.planDescription.textContent()) || "";
  }

  /**
   * Check if plan description is visible
   */
  async hasPlanDescription(): Promise<boolean> {
    return await this.planDescription.isVisible();
  }

  /**
   * Get the count of exercises in the plan
   */
  async getExercisesCount(): Promise<number> {
    return await this.exerciseItems.count();
  }

  /**
   * Check if the plan has exercises
   */
  async hasExercises(): Promise<boolean> {
    const count = await this.getExercisesCount();
    return count > 0;
  }

  /**
   * Check if empty exercises state is shown
   */
  async hasEmptyExercisesState(): Promise<boolean> {
    return await this.emptyExercisesState.isVisible();
  }

  /**
   * Get exercise details by index
   */
  async getExerciseDetails(index: number) {
    const exercise = this.exerciseItems.nth(index);
    const name = await exercise.getByTestId("exercise-name").textContent();
    const sets = await exercise.getByTestId("exercise-sets").textContent();
    const reps = await exercise.getByTestId("exercise-reps").textContent();

    return {
      name: name?.trim() || "",
      sets: sets?.trim() || "",
      reps: reps?.trim() || "",
    };
  }

  /**
   * Verify an exercise is visible by name
   */
  async expectExerciseVisible(exerciseName: string) {
    const exerciseLocator = this.exerciseItems.filter({
      has: this.page.getByTestId("exercise-name").filter({ hasText: exerciseName }),
    });
    await expect(exerciseLocator).toBeVisible({ timeout: 10000 });
  }

  /**
   * Click on an exercise by index
   */
  async clickExercise(index: number) {
    await this.exerciseItems.nth(index).click();
  }

  /**
   * Click on an exercise by name
   */
  async clickExerciseByName(exerciseName: string) {
    const exerciseLocator = this.exerciseItems.filter({
      has: this.page.getByTestId("exercise-name").filter({ hasText: exerciseName }),
    });
    await exerciseLocator.click();
  }

  /**
   * Click the back button to return to dashboard
   */
  async clickBackButton() {
    await Promise.all([this.page.waitForURL(/\/client$/, { timeout: 10000 }), this.backButton.click()]);
  }

  /**
   * Check if error state is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorState.isVisible();
  }

  /**
   * Verify exercises list is visible
   */
  async expectExercisesListVisible() {
    await expect(this.exercisesList).toBeVisible();
  }

  /**
   * Verify specific number of exercises
   */
  async expectExercisesCount(count: number) {
    await expect(this.exerciseItems).toHaveCount(count, { timeout: 10000 });
  }

  /**
   * Verify plan title matches expected text
   */
  async expectPlanTitle(title: string) {
    await expect(this.planTitle).toHaveText(title);
  }

  /**
   * Verify plan description contains specific text
   */
  async expectPlanDescriptionContains(text: string) {
    await expect(this.planDescription).toContainText(text);
  }
}
