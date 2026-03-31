import { expect, Page } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL ?? '';
if (!BASE_URL) {
  throw new Error('Set BASE_URL in .env (e.g. BASE_URL=https://your-uat-site.example/)');
}

export const PRODUCT_SLUG = 'product/mini-stripe-polo-clone';
export const ORIGINAL_POLO_SLUG = 'product/mini-stripe-polo';
export const UAT_PASSCODE = '79az-abd1-nm12';

export async function handlePasscodeGate(page: Page) {
  const passcodeInput = page.locator('input[name="passcode"]');
  const isGateVisible = await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (!isGateVisible) return;

  await passcodeInput.fill(UAT_PASSCODE);
  await page.locator('button[type="submit"]').click({ force: true });
  await page.waitForLoadState('load', { timeout: 60000 });
  await page.waitForTimeout(3000);
}

export async function addProductToCart(page: Page, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await page.goto(BASE_URL + PRODUCT_SLUG, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(2000);
      await handlePasscodeGate(page);

      const sizeRadioGroup = page.locator('[role="radiogroup"][aria-label="Size"]');
      await sizeRadioGroup.waitFor({ state: 'visible', timeout: 20000 });

      const sizeBtn = sizeRadioGroup.locator('button[aria-label="M"]');
      await sizeBtn.click();

      const atcBtn = page.locator('button[aria-label="Add to Cart"]');
      await expect(atcBtn).toBeEnabled({ timeout: 15000 });
      await atcBtn.click();

      const cartBtn = page.locator('[data-testid="cartbutton"]');
      await expect(cartBtn).toHaveAttribute('aria-label', /Cart items: [1-9]/, { timeout: 15000 });
      return;
    } catch (e) {
      if (attempt === retries) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

export async function openMiniCart(page: Page) {
  const cartButton = page.locator('[data-testid="cartbutton"]');
  await cartButton.click();
  await page.waitForTimeout(1000);
}

export async function closeMiniCart(page: Page) {
  const closeBtn = page.locator('[class*="Sidebar"] button[aria-label="Close"]');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }
}

export async function goToCheckoutForm(page: Page, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await page.goto(BASE_URL + 'cart', { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(3000);
      await handlePasscodeGate(page);

      const proceedBtn = page.locator('button:has-text("Proceed to Checkout")');
      await proceedBtn.waitFor({ state: 'visible', timeout: 20000 });
      await proceedBtn.click();
      await page.waitForTimeout(5000);
      await handlePasscodeGate(page);

      await page.locator('#Full\\ Name').waitFor({ state: 'visible', timeout: 15000 });
      return;
    } catch (e) {
      if (attempt === retries) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

export async function fillCheckoutForm(page: Page, data?: {
  name?: string; email?: string; phone?: string;
  country?: string; address1?: string; address2?: string;
  city?: string; state?: string; postcode?: string;
}) {
  const d = {
    name: 'John Doe', email: 'john.doe@test.com', phone: '2025551234',
    country: 'United States', address1: '123 Main St', address2: '',
    city: 'New York', state: 'New York', postcode: '10001',
    ...data,
  };

  await page.locator('#Full\\ Name').fill(d.name);
  await page.locator('#Email').fill(d.email);
  await page.locator('#Phone').fill(d.phone);

  const countryInput = page.locator('input[aria-label="Country"]');
  await countryInput.click({ force: true });
  await countryInput.fill(d.country);
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  await page.locator('input[name="addressLine1"]').fill(d.address1);
  if (d.address2) {
    await page.locator('#Apartment\\,\\ suite\\ etc\\ \\(optional\\)').fill(d.address2);
  }
  await page.locator('#City').fill(d.city);

  const stateInput = page.locator('input[aria-label="State/Province/Region"]');
  await stateInput.click({ force: true });
  await stateInput.fill(d.state);
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  await page.locator('#Postcode').fill(d.postcode);
}

export async function continueToShipping(page: Page) {
  const btn = page.locator('button:has-text("Continue to Shipping")');
  await expect(btn).toBeEnabled({ timeout: 10000 });
  await btn.click({ force: true });
  await page.waitForTimeout(8000);
}

export async function continueToPayment(page: Page) {
  const btn = page.locator('button:has-text("Continue to Payment")');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click({ force: true });
  await page.waitForTimeout(8000);
}
