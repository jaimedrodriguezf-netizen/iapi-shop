import { test, expect } from "@playwright/test";

test("test liking product on main landing page and checking profile", async ({ page }) => {
  // 1. Log in
  await page.goto("/login");
  await page.fill('input[name="email"]', "cliente@iapi.shop");
  await page.fill('input[name="password"]', "danro32676");
  
  await Promise.all([
    page.click('button:has-text("Iniciar sesión")'),
    page.waitForURL("**/"),
  ]);

  console.log("Logged in successfully. Current URL:", page.url());

  // 2. Locate product 'BASE LIQUIDA LONGWEAR' on main landing page
  const productCard = page.locator('article:has-text("BASE LIQUIDA LONGWEAR")');
  await expect(productCard).toBeVisible();

  // 3. Click the heart button
  const heartBtn = productCard.locator('button[aria-label*="favoritos"]');
  await expect(heartBtn).toBeVisible();
  
  console.log("Clicking heart button...");
  await heartBtn.click();

  // Wait a bit to see what happens
  await page.waitForTimeout(2000);
  console.log("After clicking heart. Current URL:", page.url());

  // Take a screenshot of the main page
  await page.screenshot({ path: "scratch/after_click_main.png" });

  // 4. Navigate to profile
  await page.goto("/perfil");
  await page.waitForTimeout(2000);
  
  // Take a screenshot of the profile page
  await page.screenshot({ path: "scratch/profile_page.png" });

  // Print text content of favorites section
  const profileBody = await page.innerText("body");
  console.log("PROFILE PAGE TEXT:", profileBody);
});
