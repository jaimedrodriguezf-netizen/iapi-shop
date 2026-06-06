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

    // 6. Verificar que la tabla contiene los usuarios registrados (usando la tabla para evitar conflictos con el sidebar)
    const table = page.locator("table");
    
    // Verificar que el administrador de la plataforma está listado en la tabla
    await expect(table.getByText("admin@iapi.shop")).toBeVisible();

    // 7. Verificar que el vendedor jaimedrodriguezf@gmail.com está registrado y listado
    await expect(table.getByText("jaimedrodriguezf@gmail.com")).toBeVisible();

    // 8. Verificar que el vendedor vendedor@iapi.shop está registrado y listado
    await expect(table.getByText("vendedor@iapi.shop")).toBeVisible();

    // 9. Verificar que la tienda 'evolution' asociada a jaimedrodriguezf esté listada
    const jaimeRow = table.locator("tr", { hasText: "jaimedrodriguezf@gmail.com" });
    await expect(jaimeRow.getByText("evolution").first()).toBeVisible();

    // 10. Verificar que la tienda 'tienda' asociada a vendedor esté listada
    const vendedorRow = table.locator("tr", { hasText: "vendedor@iapi.shop" });
    await expect(vendedorRow.getByText("tienda")).toBeVisible();

    // 11. Verificar que los planes estén visibles
    await expect(jaimeRow.getByText("Free")).toBeVisible();
    await expect(vendedorRow.getByText("Business")).toBeVisible();
  });
});
