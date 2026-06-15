import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

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

test.describe("Categories Hierarchy E2E Tests", () => {
  test("should allow creating and selecting a 3-level categories hierarchy in the product modal", async ({ page }) => {
    test.skip(!process.env.E2E_ADMIN_PASSWORD, "E2E_ADMIN_PASSWORD not configured");

    const testId = Date.now().toString();
    const l1Name = `E2E-L1-${testId}`;
    const l2Name = `E2E-L2-${testId}`;
    const l3Name = `E2E-L3-${testId}`;
    const productName = `E2E-Product-${testId}`;

    // 1. Iniciar sesión como administrador (permitido crear L1 y L2)
    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await Promise.all([
      page.click('button:has-text("Iniciar sesión")'),
      page.waitForURL("**/dashboard**"),
    ]);

    // 2. Navegar a Catálogo de Productos
    await page.goto("/dashboard/products");

    // 3. Hacer clic en "Agregar Producto"
    await page.click('button:has-text("Agregar Producto")');
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // 4. Completar campos generales
    await page.fill('text=Nombre del producto >> xpath=.. >> input', productName);
    await page.fill('text=Precio (USD) >> xpath=.. >> input', "150.00");

    // 5. Ir a la pestaña "Categoría"
    await page.click('button[role="tab"]:has-text("Categoría")');

    // 6. Crear Categoría Principal (Nivel 1)
    // El parent dropdown por defecto debe ser "Ninguna (Categoría Principal)"
    await page.fill('input[id="new-category-input"]', l1Name);
    await page.click('button:has-text("Crear")');
    await expect(page.locator("text=Categoría creada").last()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000); // Esperar a que la carga de categorías se estabilice

    // Seleccionar la Categoría Principal creada
    await page.click('text=Categoría Principal >> xpath=.. >> button[role="combobox"]');
    const l1Option = page.getByRole("option", { name: l1Name, exact: true });
    await l1Option.waitFor({ state: "visible", timeout: 5000 });
    await l1Option.click();

    // 7. Crear Subcategoría (Nivel 2) bajo el Nivel 1 creado
    // Seleccionar L1 como padre
    await page.click('text=¿Depende de otra categoría? >> xpath=.. >> button[role="combobox"]');
    const l1ParentOption = page.getByRole("option", { name: `Principal > ${l1Name}`, exact: true });
    await l1ParentOption.waitFor({ state: "visible", timeout: 5000 });
    await l1ParentOption.click();
    
    // Rellenar nombre y crear
    await page.fill('input[id="new-category-input"]', l2Name);
    await page.click('button:has-text("Crear")');
    await expect(page.locator("text=Categoría creada").last()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000); // Esperar a que la carga de categorías se estabilice

    // Seleccionar la Subcategoría creada
    await page.click('text=Subcategoría >> xpath=.. >> button[role="combobox"]');
    const l2Option = page.getByRole("option", { name: l2Name, exact: true });
    await l2Option.waitFor({ state: "visible", timeout: 5000 });
    await l2Option.click();

    // 8. Crear Tercera Categoría (Nivel 3) bajo el Nivel 2 creado
    // Seleccionar L2 como padre
    await page.click('text=¿Depende de otra categoría? >> xpath=.. >> button[role="combobox"]');
    const l2ParentOption = page.getByRole("option", { name: `Subcategoría > ${l1Name} > ${l2Name}`, exact: true });
    await l2ParentOption.waitFor({ state: "visible", timeout: 5000 });
    await l2ParentOption.click();
    
    // Rellenar nombre y crear
    await page.fill('input[id="new-category-input"]', l3Name);
    await page.click('button:has-text("Crear")');
    await expect(page.locator("text=Categoría creada").last()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000); // Esperar a que la carga de categorías se estabilice

    // Seleccionar la Tercera Categoría creada
    await page.click('text=Tercera Categoría >> xpath=.. >> button[role="combobox"]');
    const l3Option = page.getByRole("option", { name: l3Name, exact: true });
    await l3Option.waitFor({ state: "visible", timeout: 5000 });
    await l3Option.click();

    // 9. Regresar a pestaña "General" e insertar descripción
    await page.click('button[role="tab"]:has-text("General")');
    await page.fill('textarea[placeholder="Describe tu producto…"]', "Este es un producto de prueba E2E para categorías.");

    // 10. Guardar el producto
    await page.click('button[type="submit"]:has-text("Finalizar Producto")');
    await expect(page.locator("text=¡Producto agregado!")).toBeVisible({ timeout: 5000 });

    // 11. Buscar el producto en la tabla y verificar que la categoría de tercer nivel se muestra
    await page.fill('input[placeholder="Buscar productos..."]', productName);
    
    const table = page.locator("table");
    await expect(table.getByText(productName)).toBeVisible();
    await expect(table.getByText(l3Name)).toBeVisible();
  });
});
