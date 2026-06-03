import { test, expect } from "@playwright/test";

test.describe("SaaS Admin Users CRUD - Frontend UI Tests", () => {
  test("should render the users list correctly and display jaimedrodriguezf@gmail.com with merchant role and Free plan on tenant iapi", async ({ page }) => {
    // Navegar a la página de prueba de la UI
    await page.goto("/dashboard/admin/users/test-ui");

    // 1. Verificar el título principal
    const title = page.locator("h1");
    await expect(title).toHaveText("Test Usuarios SaaS");

    // 2. Verificar que aparezca el correo
    const emailCell = page.locator("text=jaimedrodriguezf@gmail.com");
    await expect(emailCell).toBeVisible();

    // 3. Verificar el nombre completo
    const nameCell = page.locator("text=Jaime Rodriguez");
    await expect(nameCell).toBeVisible();

    // 4. Verificar que su rol de plataforma sea "Vendedor"
    // Buscamos la fila que contiene el correo para evitar falsos positivos con otros roles
    const row = page.locator("tr", { hasText: "jaimedrodriguezf@gmail.com" });
    const badgeRole = row.locator("span.badge, span:has-text('Vendedor')");
    await expect(badgeRole).toBeVisible();

    // 5. Verificar que su sucursal sea "iapi" con plan "Free" y conteo de productos "12 productos"
    const tenantContainer = row.locator("div.border.text-xs", { hasText: "iapi" });
    await expect(tenantContainer).toBeVisible();

    const planBadge = tenantContainer.locator("span:has-text('Free')");
    await expect(planBadge).toBeVisible();

    const productCountText = tenantContainer.locator("text=12 productos");
    await expect(productCountText).toBeVisible();
  });
});
