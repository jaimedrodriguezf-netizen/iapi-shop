import { test, expect } from "@playwright/test";

test.describe("Branding & Customization Integration (No Mocks)", () => {
  test("should update branding settings in dashboard and apply them dynamically to the public storefront", async ({ page }) => {
    // 1. Iniciar sesión como vendedor (dueño de la tienda 'evolution' en la BD real)
    await page.goto("/login");
    await page.fill('input[name="email"]', "jaimedrodriguezf@gmail.com");
    await page.fill('input[name="password"]', "danro32676");
    await Promise.all([
      page.click('button:has-text("Iniciar sesión")'),
      page.waitForURL("**/dashboard**"),
    ]);

    // 2. Navegar a Configuración
    await page.goto("/dashboard/settings");

    // 3. Completar campos de Branding e Identidad
    // Cambiar color a Verde (#22c55e)
    const colorInput = page.locator('input[placeholder="#HEX"]');
    await colorInput.clear();
    await colorInput.fill("#22C55E");

    // Llenar dirección física
    await page.fill('input[placeholder="Av. Amazonas 123"]', "Calle de Prueba E2E 123");
    await page.fill('input[placeholder="Quito"]', "Guayaquil");
    await page.fill('input[placeholder="Pichincha"]', "Guayas");
    await page.fill('input[placeholder="170150"]', "090150");
    await page.fill('input[placeholder="Ecuador"]', "Ecuador");

    // Llenar enlaces de redes sociales
    await page.fill('input[placeholder="https://instagram.com/usuario"]', "https://instagram.com/iapi_test");
    await page.fill('input[placeholder="https://facebook.com/pagina"]', "https://facebook.com/iapi_test");
    await page.fill('input[placeholder="https://tiktok.com/@usuario"]', "https://tiktok.com/@iapi_test");

    // 4. Guardar cambios
    await page.click('button:has-text("Guardar Cambios")');

    // 5. Verificar toast de confirmación exitoso
    await expect(page.locator("text=Configuración actualizada correctamente")).toBeVisible({ timeout: 5000 });

    // 6. Navegar al catálogo público del tenant "evolution"
    await page.goto("/evolution");

    // 7. ASERCIONES SIN MOCK
    // 7.1 Inyección del color en la variable CSS del main
    const mainElement = page.locator("main");
    await expect(mainElement).toHaveAttribute("style", /--brand-color:\s*#22c55e/i);

    // 7.2 Renderizado de la dirección formateada en el footer
    const footerAddress = page.locator("footer >> text=Calle de Prueba E2E 123, Guayaquil, Guayas, 090150, Ecuador");
    await expect(footerAddress).toBeVisible();

    // 7.3 Presencia de iconos de redes con enlaces correctos
    const instagramLink = page.locator('footer a[href="https://instagram.com/iapi_test"]');
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute("target", "_blank");

    const facebookLink = page.locator('footer a[href="https://facebook.com/iapi_test"]');
    await expect(facebookLink).toBeVisible();
    await expect(facebookLink).toHaveAttribute("target", "_blank");

    const tiktokLink = page.locator('footer a[href="https://tiktok.com/@iapi_test"]');
    await expect(tiktokLink).toBeVisible();
    await expect(tiktokLink).toHaveAttribute("target", "_blank");

    // 8. LIMPIEZA: Dejar el tenant en su estado original
    await page.goto("/dashboard/settings");
    
    // Restaurar color e inputs vacíos
    const restoreColorInput = page.locator('input[placeholder="#HEX"]');
    await restoreColorInput.clear();
    await restoreColorInput.fill("#7C3AED"); // Color violeta original
    
    await page.fill('input[placeholder="Av. Amazonas 123"]', "");
    await page.fill('input[placeholder="Quito"]', "");
    await page.fill('input[placeholder="Pichincha"]', "");
    await page.fill('input[placeholder="170150"]', "");
    await page.fill('input[placeholder="Ecuador"]', "");
    await page.fill('input[placeholder="https://instagram.com/usuario"]', "");
    await page.fill('input[placeholder="https://facebook.com/pagina"]', "");
    await page.fill('input[placeholder="https://tiktok.com/@usuario"]', "");

    await page.click('button:has-text("Guardar Cambios")');
    await expect(page.locator("text=Configuración actualizada correctamente")).toBeVisible({ timeout: 5000 });
  });
});
