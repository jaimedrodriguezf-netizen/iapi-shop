import { test, expect } from "@playwright/test";

test.describe("Storefront Draft and Publishing E2E tests", () => {
  test("should enforce publishing rules in settings form and block draft stores from public view", async ({ page }) => {
    // 1. Iniciar sesión como vendedor
    await page.goto("/login");
    await page.fill('input[name="email"]', "jaimedrodriguezf@gmail.com");
    await page.fill('input[name="password"]', "danro32676");
    await Promise.all([
      page.click('button:has-text("Iniciar sesión")'),
      page.waitForURL("**/dashboard**"),
    ]);

    // 2. Navegar a Configuración
    await page.goto("/dashboard/settings");

    // 3. Obtener elementos del formulario
    const nameInput = page.locator('input[id="store-name"]');
    const slugInput = page.locator('input[id="store-slug"]');
    const toggle = page.locator('input[id="status-toggle"]');

    // 4. Cambiar el nombre a 'Mi Tienda' y verificar que el toggle esté deshabilitado
    await nameInput.clear();
    await nameInput.fill("Mi Tienda");
    await expect(toggle).toBeDisabled();

    // 5. Cambiar a valores válidos, pero desactivar el toggle para guardarla como Borrador
    await nameInput.clear();
    await nameInput.fill("Mi Tienda Custom E2E");
    await slugInput.clear();
    await slugInput.fill("e2e-draft-test");

    // Esperar a que el toggle se habilite
    await expect(toggle).not.toBeDisabled();

    // Desactivar el toggle (ponerlo en borrador/draft)
    const isChecked = await toggle.isChecked();
    if (isChecked) {
      await page.click('label:has-text("Publicar Tienda")');
    }
    await expect(toggle).not.toBeChecked();

    // Guardar cambios
    await page.click('button:has-text("Guardar Cambios")');
    await expect(page.locator("text=Configuración actualizada correctamente")).toBeVisible({ timeout: 10000 });

    // 6. Visitar la tienda en modo borrador y verificar que aparezca la página de construcción
    await page.goto("/e2e-draft-test");
    await expect(page.locator("text=Tienda en construcción: Esta tienda está en modo borrador y no es pública aún.")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Mi Tienda Custom E2E")).toBeVisible();

    // 7. Limpieza / Restaurar a estado Activo y con slug original 'evolution'
    // Loguear de nuevo si la sesión se pierde, o ir directamente
    await page.goto("/dashboard/settings");
    await nameInput.clear();
    await nameInput.fill("Evolution");
    await slugInput.clear();
    await slugInput.fill("evolution");

    // Esperar que esté habilitado
    await expect(toggle).not.toBeDisabled();

    // Activar el toggle (ponerlo en active)
    const isCheckedNow = await toggle.isChecked();
    if (!isCheckedNow) {
      await page.click('label:has-text("Publicar Tienda")');
    }
    await expect(toggle).toBeChecked();

    // Guardar cambios
    await page.click('button:has-text("Guardar Cambios")');
    await expect(page.locator("text=Configuración actualizada correctamente")).toBeVisible({ timeout: 10000 });

    // 8. Verificar que la tienda vuelva a ser visible públicamente
    await page.goto("/evolution");
    await expect(page.locator("text=Tienda en construcción")).not.toBeVisible({ timeout: 5000 });
  });
});
