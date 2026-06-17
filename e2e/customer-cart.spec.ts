import { test, expect } from "@playwright/test";

test("test adding product to cart on main landing page and opening marketplace cart drawer", async ({ page }) => {
  // 1. Go to homepage
  await page.goto("/");

  // 2. Locate product card for 'BASE LIQUIDA LONGWEAR'
  const productCard = page.locator('article:has-text("BASE LIQUIDA LONGWEAR")');
  await expect(productCard).toBeVisible();

  // 3. Locate and click the Add to Cart button (plus icon)
  const addToCartBtn = productCard.locator('button[aria-label*="al carrito"]');
  await expect(addToCartBtn).toBeVisible();
  
  console.log("Adding product to cart...");
  await addToCartBtn.click();

  // 4. Verify toast notification is displayed
  const toastMsg = page.locator('text=BASE LIQUIDA LONGWEAR agregado');
  await expect(toastMsg).toBeVisible({ timeout: 5000 });

  // 5. Locate and click the Cart button in the header
  const cartTrigger = page.locator('button[aria-label="Abrir carrito"]');
  await expect(cartTrigger).toBeVisible();
  
  console.log("Opening cart drawer...");
  await cartTrigger.click();

  // 6. Verify cart drawer content
  await expect(page.locator("text=Tu Carrito")).toBeVisible({ timeout: 5000 });
  
  // Specific selector for the item inside the cart drawer
  const cartItemTitle = page.locator('h4:has-text("BASE LIQUIDA LONGWEAR")');
  await expect(cartItemTitle).toBeVisible();
  
  // Verify checkout button (which dynamically displays the store name and WhatsApp) is visible
  const checkoutBtn = page.locator('button:has-text("WhatsApp")');
  await expect(checkoutBtn).toBeVisible({ timeout: 5000 });

  // Take screenshot of the open cart drawer
  await page.screenshot({ path: "scratch/marketplace_cart_open.png" });
});
