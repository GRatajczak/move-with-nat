import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * Encapsulates all interactions with the login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators using stable data-testid selectors
    this.form = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email");
    this.passwordInput = page.getByTestId("login-password");
    this.submitButton = page.getByTestId("login-submit");
    this.errorMessage = page.getByTestId("login-error");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password");
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto("/auth/login");
    await this.page.waitForSelector('[data-testid="login-form"][data-hydrated="true"]');
  }

  /**
   * Fill in login credentials
   */
  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit(options: { expectResponse?: boolean } = {}) {
    const { expectResponse = true } = options;
    if (!expectResponse) {
      await this.submitButton.click();
      return;
    }

    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes("/api/auth/login") && response.request().method() === "POST"
      ),
      this.submitButton.click(),
    ]);
  }

  /**
   * Perform complete login action
   */
  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * Check if error message is visible
   */
  async hasError() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    const message = await this.errorMessage.textContent();
    return message?.trim() ?? "";
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Wait for successful login navigation
   */
  async waitForSuccessfulLogin() {
    await this.page.waitForFunction(() => !!localStorage.getItem("user"), null, {
      timeout: 30000,
    });
    await this.page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 30000 });
  }
}
