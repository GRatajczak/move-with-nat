import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { PlansPage } from "../pages/PlansPage";
import { CreatePlanPage } from "../pages/CreatePlanPage";
import { testUsers, testPlan } from "../fixtures/test-users";

test.describe("Trainer Plan Creation", () => {
  test("trainer can create a new plan with exercises", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const plansPage = new PlansPage(page);
    const createPlanPage = new CreatePlanPage(page);

    const uniquePlanName = `${testPlan.name} ${Date.now()}`;

    await loginPage.goto();
    await loginPage.login(testUsers.trainer.email, testUsers.trainer.password);
    await loginPage.waitForSuccessfulLogin();

    await dashboardPage.navigateTo("Plany treningowe");
    await plansPage.expectLoaded();

    await plansPage.startCreatePlan();
    await createPlanPage.expectLoaded();

    await createPlanPage.fillPlanName(uniquePlanName);
    await createPlanPage.fillDescription(testPlan.description);
    await createPlanPage.selectFirstClientOption();
    await createPlanPage.addFirstExerciseFromModal();
    await createPlanPage.submit();

    await createPlanPage.waitForSuccessModal();
    await createPlanPage.returnToListFromModal();
    await plansPage.expectLoaded();
    await plansPage.expectPlanVisible(uniquePlanName);
  });
});
