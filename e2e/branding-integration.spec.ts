import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "";

test.beforeAll(() => {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
});

test.describe("Branding & Customization Integration (No Mocks)", () => {
  test("should update branding settings in dashboard and apply them dynamically to the public storefront", async ({ page }) => {
    test.skip(!process.env.E2E_TEST_PASSWORD, "E2E_TEST_PASSWORD not configured");

    // 1. Iniciar sesión como vendedor (dueño de la tienda 'evolution' en la BD real)
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await Promise.all([
      page.click('button:has-text("Iniciar sesión")'),
      page.waitForURL("**/dashboard**"),
    ]);

    // 2. Navegar a Configuración
    await page.goto("/dashboard/settings");

    // 3. Completar campos de Branding e Identidad
    // Cambiar color a Verde (#22c55e)
    const colorInput = page.locator('input[name="brand_color"]');
    await colorInput.clear();
    await colorInput.fill("#22C55E");

    // Llenar dirección física
    await page.fill('input[placeholder="Av. Amazonas 123"]', "Calle de Prueba E2E 123");
    
    // Seleccionar país (Ecuador)
    await page.click('#address-country');
    await page.getByRole('option', { name: 'Ecuador', exact: true }).click();
    
    // Seleccionar provincia (Guayas)
    await page.click('#address-state');
    await page.getByRole('option', { name: 'Guayas', exact: true }).click();
    
    // Seleccionar cantón (Guayaquil)
    await page.click('#address-city');
    await page.getByRole('option', { name: 'Guayaquil', exact: true }).click();
    
    await page.fill('input[placeholder="170150"]', "090150");

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
    const footerAddress = page.locator("footer >> text=Calle de Prueba E2E 123, Guayaquil, Guayas, Ecuador");
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
    const restoreColorInput = page.locator('input[name="brand_color"]');
    await restoreColorInput.clear();
    await restoreColorInput.fill("#7C3AED"); // Color violeta original
    
    await page.fill('input[placeholder="Av. Amazonas 123"]', "");
    
    // Cambiar país a Colombia para limpiar como inputs de texto
    await page.click('#address-country');
    await page.getByRole('option', { name: 'Colombia', exact: true }).click();
    
    await page.fill('input[placeholder="Quito"]', "");
    await page.fill('input[placeholder="Pichincha"]', "");
    await page.fill('input[placeholder="170150"]', "");
    await page.fill('input[placeholder="https://instagram.com/usuario"]', "");
    await page.fill('input[placeholder="https://facebook.com/pagina"]', "");
    await page.fill('input[placeholder="https://tiktok.com/@usuario"]', "");

    await page.click('button:has-text("Guardar Cambios")');
    await expect(page.locator("text=Configuración actualizada correctamente")).toBeVisible({ timeout: 5000 });
  });
});
