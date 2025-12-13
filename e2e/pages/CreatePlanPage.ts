import { expect, type Locator, type Page } from "@playwright/test";

export class CreatePlanPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly clientSelect: Locator;
  readonly addExerciseButton: Locator;
  readonly exerciseSearchInput: Locator;
  readonly saveButton: Locator;
  readonly successDialog: Locator;
  readonly returnToListButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /nowy plan treningowy/i });
    this.nameInput = page.getByLabel(/nazwa planu/i);
    this.descriptionInput = page.getByLabel(/^opis/i);
    this.clientSelect = page.getByRole("combobox");
    this.addExerciseButton = page.getByRole("button", { name: /dodaj ćwiczenie/i });
    this.exerciseSearchInput = page.getByPlaceholder(/szukaj ćwiczenia/i);
    this.saveButton = page.getByRole("button", { name: /^zapisz/i });
    this.successDialog = page.getByRole("dialog", { name: /plan utworzony/i });
    this.returnToListButton = page.getByRole("button", { name: /wróć do listy planów/i });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async fillPlanName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillDescription(description: string) {
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
    await this.saveButton.click();
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
}
