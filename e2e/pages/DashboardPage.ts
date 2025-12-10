import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Dashboard Page
 * Common elements across admin/trainer/client dashboards
 */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { level: 1 });
    this.userMenu = page.getByRole("button", { name: /user menu|account/i });
    this.logoutButton = page.getByRole("menuitem", { name: /log out|sign out/i });
    this.navigationMenu = page.getByRole("navigation");
  }

  /**
   * Check if user is on dashboard
   */
  async isOnDashboard() {
    return await this.heading.isVisible();
  }

  /**
   * Get dashboard heading text
   */
  async getHeading() {
    return await this.heading.textContent();
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.userMenu.click();
  }

  /**
   * Perform logout
   */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  /**
   * Navigate using menu
   */
  async navigateTo(linkName: string) {
    await this.navigationMenu.getByRole("link", { name: new RegExp(linkName, "i") }).click();
  }

  /**
   * Check if navigation link exists
   */
  async hasNavigationLink(linkName: string) {
    return await this.navigationMenu.getByRole("link", { name: new RegExp(linkName, "i") }).isVisible();
  }
}
