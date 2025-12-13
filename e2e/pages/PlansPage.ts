import { expect, type Locator, type Page } from "@playwright/test";

export class PlansPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createPlanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /plany treningowe/i });
    this.createPlanButton = page.getByTestId("create-plan-button");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 20000 });
  }

  async startCreatePlan() {
    await this.page.waitForLoadState("networkidle");
    await this.createPlanButton.waitFor({ state: "visible" });
    await this.createPlanButton.click();
    await this.page.waitForURL(/\/trainer\/plans\/new/, { timeout: 15000 });
  }

  async expectPlanVisible(planName: string) {
    await expect(this.page.getByRole("cell", { name: planName })).toBeVisible({ timeout: 20000 });
  }
}
