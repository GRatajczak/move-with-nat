import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Page Object Model for Client Dashboard Page
 * Represents the main dashboard page where a client views their training plans
 */
export class ClientDashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly plansContent: Locator;
  readonly planCards: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators using stable data-testid selectors
    this.heading = page.getByTestId("client-dashboard-heading");
    this.plansContent = page.getByTestId("client-plans-content");
    this.planCards = page.getByTestId("client-plan-card");
  }

  /**
   * Navigate to the client dashboard
   */
  async goto() {
    await this.page.goto("/client");
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    await this.heading.waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Verify the page is loaded
   */
  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 20000 });
    await expect(this.plansContent).toBeVisible();
  }

  /**
   * Get the count of plan cards
   */
  async getPlansCount(): Promise<number> {
    return await this.planCards.count();
  }

  /**
   * Check if plans are visible
   */
  async hasPlans(): Promise<boolean> {
    const count = await this.getPlansCount();
    return count > 0;
  }

  /**
   * Get plan card by index
   */
  getPlanCard(index: number): Locator {
    return this.planCards.nth(index);
  }

  /**
   * Get plan card by plan name
   */
  getPlanCardByName(planName: string): Locator {
    return this.planCards.filter({
      has: this.page.getByTestId("plan-card-title").filter({ hasText: planName }),
    });
  }

  /**
   * Click on a plan card by index
   */
  async clickPlanCard(index: number) {
    const planCard = this.getPlanCard(index);
    const planId = await planCard.getAttribute("data-plan-id");

    await Promise.all([
      this.page.waitForURL(new RegExp(`/client/plans/${planId}`), { timeout: 10000 }),
      planCard.click(),
    ]);
  }

  /**
   * Click on a plan card by name
   */
  async clickPlanCardByName(planName: string) {
    const planCard = this.getPlanCardByName(planName);
    const planId = await planCard.getAttribute("data-plan-id");

    await Promise.all([
      this.page.waitForURL(new RegExp(`/client/plans/${planId}`), { timeout: 10000 }),
      planCard.click(),
    ]);
  }

  /**
   * Get plan card title by index
   */
  async getPlanTitle(index: number): Promise<string> {
    const planCard = this.getPlanCard(index);
    const title = await planCard.getByTestId("plan-card-title").textContent();
    return title?.trim() || "";
  }

  /**
   * Verify plan card is visible by name
   */
  async expectPlanVisible(planName: string) {
    const planCard = this.getPlanCardByName(planName);
    await expect(planCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify specific number of plans
   */
  async expectPlansCount(count: number) {
    await expect(this.planCards).toHaveCount(count, { timeout: 10000 });
  }

  /**
   * Verify at least one plan is visible
   */
  async expectHasPlans() {
    await expect(this.planCards.first()).toBeVisible({ timeout: 10000 });
  }
}
