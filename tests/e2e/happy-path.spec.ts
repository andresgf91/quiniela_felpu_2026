import { test, expect } from "@playwright/test";

test.describe("quiniela happy path", () => {
  test("register, predict, see ranking", async ({ page }) => {
    const name = `test_${Date.now()}`;

    await page.goto("/register");
    await page.fill('input[value=""]', "felpu2026");
    await page.locator('input').nth(1).fill(name);
    await page.locator('input[type="password"]').fill("1234");
    await page.getByRole("button", { name: /Registrarme/i }).click();

    await expect(page).toHaveURL(/mis-predicciones/);

    const inputs = page.locator(".input-score");
    await inputs.first().fill("2");
    await inputs.nth(1).fill("1");

    await expect(page.getByText(/Guardado/i)).toBeVisible({ timeout: 10000 });

    await page.goto("/ranking");
    await expect(page.getByText(name)).toBeVisible();
  });
});
