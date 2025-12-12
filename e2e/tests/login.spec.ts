import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { testUsers, invalidCredentials } from "../fixtures/test-users";

test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form", async () => {
    // Assert that all login elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should login successfully as admin", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);

    // Act
    await loginPage.login(testUsers.admin.email, testUsers.admin.password);

    // Assert
    await loginPage.waitForSuccessfulLogin();
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("user") || "{}").email), { timeout: 10000 })
      .toBe(testUsers.admin.email);
    await expect(dashboardPage.heading).toBeVisible({ timeout: 15000 });
  });

  test("should login successfully as trainer", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);

    // Act
    await loginPage.login(testUsers.trainer.email, testUsers.trainer.password);

    // Assert
    await loginPage.waitForSuccessfulLogin();
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("user") || "{}").email), { timeout: 10000 })
      .toBe(testUsers.trainer.email);
    await expect(dashboardPage.heading).toBeVisible({ timeout: 15000 });
  });

  test("should show error message for invalid credentials", async () => {
    // Act
    await loginPage.login(invalidCredentials.email, invalidCredentials.password);

    // Assert
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 15000 });
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toMatch(/invalid|incorrect|wrong|failed/i);
  });

  test("should show error for empty email", async () => {
    // Act
    await loginPage.fillCredentials("", "password123");
    await loginPage.submit({ expectResponse: false });

    // Assert
    await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/required/i);
  });

  test("should show error for empty password", async () => {
    // Act
    await loginPage.fillCredentials("test@example.com", "");
    await loginPage.submit({ expectResponse: false });

    // Assert
    await expect(loginPage.passwordInput).toHaveAttribute("aria-invalid", "true");
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/required/i);
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // Act
    await loginPage.clickForgotPassword();

    // Assert
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});

test.describe("Authenticated User Flow", () => {
  test("should logout successfully", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login(testUsers.admin.email, testUsers.admin.password);
    await loginPage.waitForSuccessfulLogin();

    // Act
    await dashboardPage.logout();

    // Assert
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
