import { test, expect } from "@playwright/test";

test.describe("SaaS Admin Panel - Real E2E Tests with Chromium", () => {
  test("should login as admin@iapi.shop and verify jaimedrodriguezf@gmail.com is listed under SaaS Users CRUD", async ({ page }) => {
    // 1. Ir a la página de login
    await page.goto("/login");

    // 2. Completar las credenciales reales provistas por el usuario
    await page.fill('input[name="email"]', "admin@iapi.shop");
    await page.fill('input[name="password"]', "danro32676");

    // 3. Hacer clic en iniciar sesión y esperar la navegación al dashboard
    await Promise.all([
      page.click('button:has-text("Iniciar sesión")'),
      page.waitForURL("**/dashboard"),
    ]);

    // 4. Navegar directamente al panel de administración de usuarios
    await page.goto("/dashboard/admin/users");

    // 5. Verificar que se renderiza el título del panel de administración
    const title = page.locator("h1");
    await expect(title).toHaveText("Control de Usuarios SaaS");

    // 6. Verificar que el administrador de la plataforma está listado
    const adminEmailCell = page.locator("text=admin@iapi.shop");
    await expect(adminEmailCell).toBeVisible();

    // 7. Verificar que el vendedor jaimedrodriguezf@gmail.com está registrado y listado
    const merchantEmailCell = page.locator("text=jaimedrodriguezf@gmail.com");
    await expect(merchantEmailCell).toBeVisible();

    // 8. Verificar que la tienda 'iapi' asociada al vendedor esté listada
    const merchantRow = page.locator("tr", { hasText: "jaimedrodriguezf@gmail.com" });
    const tenantContainer = merchantRow.locator("div.border.text-xs", { hasText: "iapi" });
    await expect(tenantContainer).toBeVisible();

    // 9. Verificar que el plan asignado a la sucursal iapi sea visible
    const planBadge = tenantContainer.locator("span:has-text('Free')");
    await expect(planBadge).toBeVisible();
  });
});
