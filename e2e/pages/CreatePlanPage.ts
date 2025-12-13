import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Page Object Model for Create Plan Page
 * Represents the page where a trainer creates a new training plan
 */
export class CreatePlanPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly clientSelect: Locator;
  readonly addExerciseButton: Locator;
  readonly exerciseSearchInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly successDialog: Locator;
  readonly returnToListButton: Locator;
  readonly backButton: Locator;
  readonly exercisesList: Locator;
  readonly exerciseItems: Locator;
  readonly hiddenSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("create-plan-heading");
    this.nameInput = page.getByTestId("plan-name-input");
    this.descriptionInput = page.getByTestId("plan-description-input");
    this.clientSelect = page.getByTestId("client-select");
    this.addExerciseButton = page.getByTestId("add-exercise-button");
    this.exerciseSearchInput = page.getByPlaceholder(/szukaj ćwiczenia/i);
    this.saveButton = page.getByTestId("plan-form-submit");
    // Cancel button doesn't have test-id, use role and text
    this.cancelButton = page.getByRole("button", { name: /anuluj/i });
    this.successDialog = page.getByTestId("plan-success-modal");
    this.returnToListButton = page.getByTestId("return-to-plans-list");
    this.backButton = page.getByRole("button", { name: /powrót do listy/i });
    this.exercisesList = page.getByTestId("plan-exercises-list");
    this.exerciseItems = page.getByTestId("plan-exercise-item");
    // Hidden switch - use role and accessible name
    this.hiddenSwitch = page.getByRole("switch");
  }

  async expectLoaded() {
    await this.heading.waitFor({ state: "visible", timeout: 15000 });
    await this.page.waitForTimeout(1000); // Wait for form to hydrate
  }

  async fillPlanName(name: string) {
    await this.nameInput.click();
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.click();
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(description);
  }

  async selectFirstClientOption() {
    await this.clientSelect.click();
    const firstOption = this.page.getByRole("option").first();
    await firstOption.waitFor({ state: "visible", timeout: 15000 });
    await firstOption.click();
  }

  async addExerciseByName(name: string) {
    await this.addExerciseButton.click();
    const dialog = this.page.getByRole("dialog", { name: /dodaj ćwiczenia/i });
    await dialog.waitFor({ state: "visible", timeout: 15000 });

    await this.exerciseSearchInput.fill(name);

    const exerciseOption = dialog.getByLabel(new RegExp(name, "i")).first();
    await exerciseOption.waitFor({ state: "visible", timeout: 15000 });
    await exerciseOption.click();

    await dialog.getByRole("button", { name: /dodaj wybrane/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
  }

  async addFirstExerciseFromModal() {
    await this.addExerciseButton.click();
    const dialog = this.page.getByRole("dialog", { name: /dodaj ćwiczenia/i });
    await dialog.waitFor({ state: "visible", timeout: 15000 });

    const firstCheckbox = dialog.getByRole("checkbox").first();
    await firstCheckbox.waitFor({ state: "visible", timeout: 15000 });
    await firstCheckbox.click();

    await dialog.getByRole("button", { name: /dodaj wybrane/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
  }

  async submit() {
    await this.saveButton.waitFor({ state: "visible" });
    await this.saveButton.isEnabled();

    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes("/api/plans") && response.request().method() === "POST",
        { timeout: 15000 }
      ),
      this.saveButton.click(),
    ]);
  }

  async waitForSuccessModal() {
    await expect(this.successDialog).toBeVisible({ timeout: 20000 });
  }

  async returnToListFromModal() {
    await this.returnToListButton.click();
    await this.page.waitForURL(/\/trainer\/plans/);
  }

  async confirmSuccessAndReturn() {
    await this.waitForSuccessModal();
    await this.returnToListFromModal();
  }

  /**
   * Navigate to create plan page
   */
  async goto() {
    await this.page.goto("/trainer/plans/new");
    await this.expectLoaded();
  }

  /**
   * Get selected client name
   */
  async getSelectedClient(): Promise<string> {
    return (await this.clientSelect.textContent()) || "";
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationError(): Promise<boolean> {
    const errorMessage = this.page.getByRole("alert");
    return await errorMessage.isVisible();
  }

  /**
   * Get validation error message
   */
  async getValidationError(): Promise<string> {
    const errorMessage = this.page.getByRole("alert").first();
    return (await errorMessage.textContent()) || "";
  }

  /**
   * Check if save button is enabled
   */
  async isSaveButtonEnabled(): Promise<boolean> {
    return await this.saveButton.isEnabled();
  }

  /**
   * Get count of exercises in the plan
   */
  async getExercisesCount(): Promise<number> {
    return await this.exerciseItems.count();
  }

  /**
   * Check if plan has exercises
   */
  async hasExercises(): Promise<boolean> {
    const count = await this.getExercisesCount();
    return count > 0;
  }

  /**
   * Remove exercise by index
   */
  async removeExercise(index: number) {
    const exercise = this.exerciseItems.nth(index);
    const removeButton = exercise.getByTestId("remove-exercise-button");
    await removeButton.click();
  }

  /**
   * Get exercise name by index
   */
  async getExerciseName(index: number): Promise<string> {
    const exercise = this.exerciseItems.nth(index);
    const nameElement = exercise.getByTestId("exercise-name");
    return (await nameElement.textContent()) || "";
  }

  /**
   * Update exercise parameters (sets, reps, etc.)
   */
  async updateExerciseParams(index: number, params: { sets?: number; reps?: number; tempo?: string; weight?: number }) {
    const exercise = this.exerciseItems.nth(index);

    if (params.sets !== undefined) {
      const setsInput = exercise.getByTestId("exercise-sets-input");
      await setsInput.clear();
      await setsInput.fill(params.sets.toString());
    }

    if (params.reps !== undefined) {
      const repsInput = exercise.getByTestId("exercise-reps-input");
      await repsInput.clear();
      await repsInput.fill(params.reps.toString());
    }

    if (params.tempo !== undefined) {
      const tempoInput = exercise.getByTestId("exercise-tempo-input");
      await tempoInput.clear();
      await tempoInput.fill(params.tempo);
    }

    if (params.weight !== undefined) {
      const weightInput = exercise.getByTestId("exercise-weight-input");
      await weightInput.clear();
      await weightInput.fill(params.weight.toString());
    }
  }

  /**
   * Get exercise parameters
   */
  async getExerciseParams(index: number): Promise<{ sets: string; reps: string; tempo: string; weight: string }> {
    const exercise = this.exerciseItems.nth(index);

    const setsInput = exercise.getByTestId("exercise-sets-input");
    const repsInput = exercise.getByTestId("exercise-reps-input");
    const tempoInput = exercise.getByTestId("exercise-tempo-input");
    const weightInput = exercise.getByTestId("exercise-weight-input");

    return {
      sets: (await setsInput.inputValue()) || "",
      reps: (await repsInput.inputValue()) || "",
      tempo: (await tempoInput.inputValue()) || "",
      weight: (await weightInput.inputValue()) || "",
    };
  }

  /**
   * Toggle hidden plan switch
   */
  async toggleHidden() {
    await this.hiddenSwitch.click();
  }

  /**
   * Check if hidden switch is checked
   */
  async isHiddenEnabled(): Promise<boolean> {
    return await this.hiddenSwitch.isChecked();
  }

  /**
   * Click cancel button
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Click back button in header
   */
  async clickBackButton() {
    await this.backButton.click();
    await this.page.waitForURL(/\/trainer\/plans/);
  }

  /**
   * Add multiple exercises by selecting N first exercises
   */
  async addMultipleExercises(count: number) {
    const initialCount = await this.getExercisesCount();

    await this.addExerciseButton.click();
    const dialog = this.page.getByRole("dialog", { name: /dodaj ćwiczenia/i });
    await dialog.waitFor({ state: "visible", timeout: 15000 });

    // Select first N exercises
    const checkboxes = dialog.getByRole("checkbox");
    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);
      await checkbox.waitFor({ state: "visible", timeout: 15000 });
      await checkbox.click();
    }

    await dialog.getByRole("button", { name: /dodaj wybrane/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });

    // Wait for exercises to be added to the list
    await expect(this.exerciseItems).toHaveCount(initialCount + count, { timeout: 10000 });
  }

  /**
   * Search and add specific exercise by name
   */
  async searchAndAddExercise(searchTerm: string) {
    const initialCount = await this.getExercisesCount();

    await this.addExerciseButton.click();
    const dialog = this.page.getByRole("dialog", { name: /dodaj ćwiczenia/i });
    await dialog.waitFor({ state: "visible", timeout: 15000 });

    await this.exerciseSearchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for search to filter

    const firstCheckbox = dialog.getByRole("checkbox").first();
    await firstCheckbox.waitFor({ state: "visible", timeout: 15000 });
    await firstCheckbox.click();

    await dialog.getByRole("button", { name: /dodaj wybrane/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });

    // Wait for exercise to be added to the list
    await expect(this.exerciseItems).toHaveCount(initialCount + 1, { timeout: 10000 });
  }

  /**
   * Fill complete form with all required fields
   */
  async fillCompleteForm(data: { name: string; description?: string; clientIndex?: number; exercisesCount?: number }) {
    await this.fillPlanName(data.name);

    if (data.description) {
      await this.fillDescription(data.description);
    }

    if (data.clientIndex !== undefined) {
      await this.selectClientByIndex(data.clientIndex);
    } else {
      await this.selectFirstClientOption();
    }

    const exercisesToAdd = data.exercisesCount || 1;
    await this.addMultipleExercises(exercisesToAdd);
  }

  /**
   * Select client by index
   */
  async selectClientByIndex(index: number) {
    await this.clientSelect.click();
    const option = this.page.getByRole("option").nth(index);
    await option.waitFor({ state: "visible", timeout: 15000 });
    await option.click();
  }

  /**
   * Get character count for description
   */
  async getDescriptionCharacterCount(): Promise<string> {
    // Changed from /500 to /1000 based on actual UI (1000 char limit)
    const counter = this.page.getByText(/\d+\s*\/\s*1000/i);
    return (await counter.textContent()) || "0/1000";
  }

  /**
   * Verify success modal message
   */
  async expectSuccessMessage(message: string) {
    const modalContent = this.successDialog.getByText(new RegExp(message, "i"));
    await expect(modalContent).toBeVisible({ timeout: 20000 });
  }
}
