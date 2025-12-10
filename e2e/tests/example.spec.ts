import { test, expect } from "@playwright/test";

test.describe("Example E2E Tests", () => {
  test("has title", async ({ page }) => {
    await page.goto("/");

    // Expect page to have a title
    await expect(page).toHaveTitle(/MoveWithNat|Move with Nat/);
  });

  test("can navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click on login link (adjust selector based on your app)
    const loginLink = page.getByRole("link", { name: /login|sign in/i });

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });

  test("homepage loads without errors", async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    // Check for critical errors (ignore minor warnings)
    const criticalErrors = errors.filter((err) => !err.includes("favicon") && !err.includes("404"));

    expect(criticalErrors).toHaveLength(0);
  });

  test("can take screenshot", async ({ page }) => {
    await page.goto("/");

    // Take a screenshot for visual regression testing
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      // First run will create baseline, subsequent runs compare
    });
  });
});
