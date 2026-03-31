import { test, expect } from '@playwright/test';
import { BASE_URL, addProductToCart, handlePasscodeGate, openMiniCart } from './helpers';

test("On any page, I am able to open up the mini cart and see the details of what is currently in my cart. [0]", async ({ page }) => {
  test.setTimeout(90000);

  await addProductToCart(page);

  const sidebar = page.locator('[class*="Sidebar"]');
  await expect(sidebar).toBeVisible();

  const minicart = page.locator('[data-testid="minicart"]');
  await expect(minicart).toBeVisible();

  const minicartText = await minicart.innerText();
  expect(minicartText).toContain('Clone Mini Stripe Polo');
  expect(minicartText).toMatch(/\$\d+\.\d{2}/);

  await expect(page.locator('[data-testid="minicart"] button[aria-label="Decrease quantity"]')).toBeVisible();
  await expect(page.locator('[data-testid="minicart"] button[aria-label="Increase quantity"]')).toBeVisible();

  const qtyInput = page.locator('[data-testid="minicart"] input[name*="__quantity"]');
  await expect(qtyInput).toHaveValue('1');

  await expect(page.locator('[data-testid="checkoutbutton"]')).toBeVisible();
  await expect(page.locator('[data-testid="continueshoppingbutton"]')).toBeVisible();
});

test("When I have gone to checkout and submitted my address then gone back to the homepage and open my mini cart, I am able to view the line items on my order, their prices, the order subtotal, any relevant item level discounts, and relevant order level discounts, taxes, shipping, and then the final total. [1]", async ({ page }) => {
  test.setTimeout(120000);

  await addProductToCart(page);

  const viewCartBtn = page.locator('[data-testid="checkoutbutton"]');
  await viewCartBtn.click();
  await page.waitForTimeout(5000);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  await openMiniCart(page);

  const sidebar = page.locator('[class*="Sidebar"]');
  const sidebarText = await sidebar.innerText();

  expect(sidebarText).toContain('Clone Mini Stripe Polo');
  expect(sidebarText).toMatch(/\$\d+\.\d{2}/);
  expect(sidebarText).toMatch(/Subtotal/i);
  expect(sidebarText).toMatch(/Tax/i);
  expect(sidebarText).toMatch(/Shipping/i);
  expect(sidebarText).toMatch(/Total/i);
});

test("In the mini cart, line item prices appropriately take into account sale pricing and contract pricing. [2]", async ({ page }) => {
  test.setTimeout(90000);

  await addProductToCart(page);

  const minicart = page.locator('[data-testid="minicart"]');
  await expect(minicart).toBeVisible({ timeout: 10000 });

  const priceEl = minicart.locator('span.font-bold.text-black').first();
  await expect(priceEl).toBeVisible();
  const priceText = await priceEl.innerText();
  expect(priceText).toMatch(/\$\d+\.\d{2}/);

  const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
  expect(price).toBeGreaterThan(0);
});

test("In the mini cart, taxes and shipping are not calculated until I have added a shipping address at checkout, but if there is a shipping address they are displayed appropriately in the mini cart here. [3]", async ({ page }) => {
  test.setTimeout(90000);

  await addProductToCart(page);

  const sidebar = page.locator('[class*="Sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 10000 });

  const sidebarText = await sidebar.innerText();
  expect(sidebarText).toMatch(/Taxes/i);
  expect(sidebarText).toMatch(/Shipping/i);
  expect(sidebarText).toMatch(/Calculated at next step/i);
});

test("In the mini cart, I am able to modify the quantities of items in my cart [4]", async ({ page }) => {
  test.setTimeout(90000);

  await addProductToCart(page);

  const minicart = page.locator('[data-testid="minicart"]');
  await expect(minicart).toBeVisible({ timeout: 10000 });

  const qtyInput = minicart.locator('input[name*="__quantity"]');
  await expect(qtyInput).toHaveValue('1');

  const increaseBtn = minicart.locator('button[aria-label="Increase quantity"]');
  await increaseBtn.click();
  await expect(qtyInput).toHaveValue('2', { timeout: 10000 });

  const decreaseBtn = minicart.locator('button[aria-label="Decrease quantity"]');
  await decreaseBtn.click();
  await expect(qtyInput).toHaveValue('1', { timeout: 10000 });
});

test("Clicking the remove button in the cart removes the line item from the cart entirely [14]", async ({ page }) => {
  test.setTimeout(120000);

  await addProductToCart(page);
  await openMiniCart(page);

  const minicart = page.locator('[data-testid="minicart"]');
  await expect(minicart).toBeVisible({ timeout: 10000 });

  const removeBtn = minicart.locator('button[aria-label*="Remove"]');
  await expect(removeBtn).toBeVisible({ timeout: 5000 });
  await removeBtn.click();

  // The cart button may temporarily unmount during React re-render; wait for it to settle
  await page.waitForTimeout(3000);
  const cartBtn = page.locator('[data-testid="cartbutton"]');
  await cartBtn.waitFor({ state: 'attached', timeout: 20000 });
  await expect(cartBtn).toHaveAttribute('aria-label', 'Cart items: 0', { timeout: 20000 });
});
