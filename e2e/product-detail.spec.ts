import { test, expect } from "@playwright/test";

test("test clicking a product on the homepage opens the product detail modal", async ({ page }) => {
  // 1. Go to homepage
  await page.goto("/");

  // 2. Locate product card for 'BASE LIQUIDA LONGWEAR'
  const productCard = page.locator('article:has-text("BASE LIQUIDA LONGWEAR")');
  await expect(productCard).toBeVisible();

  // 3. Click the product card body (e.g. clicking the heading) to open the modal
  const productHeading = productCard.locator('h3:has-text("BASE LIQUIDA LONGWEAR")');
  await expect(productHeading).toBeVisible();
  
  console.log("Clicking product card to open details...");
  await productHeading.click();

  // 4. Verify that the product detail modal is open
  const modal = page.locator('div[role="dialog"]');
  await expect(modal).toBeVisible({ timeout: 5000 });

  // 5. Verify contents inside the modal
  await expect(modal.locator('text=BASE LIQUIDA LONGWEAR')).toBeVisible();
  await expect(modal.locator('text=Vendido por:')).toBeVisible();
  await expect(modal.locator('button:has-text("Agregar al carrito")')).toBeVisible();

  // Take screenshot of the open product detail modal
  await page.screenshot({ path: "scratch/product_detail_modal_open.png" });
});
