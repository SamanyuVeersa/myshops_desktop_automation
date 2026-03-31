import { test, expect } from '@playwright/test';
import { BASE_URL, handlePasscodeGate } from './helpers';

test("Static content pages, such as the privacy policy, renders the text set in Contentful for the selected language at `/content/{pageId}` [25]", async ({ page }) => {
  test.setTimeout(90000);

  const response = await page.goto(BASE_URL + 'content/privacy-policy', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  // URL should follow /content/{pageId} format
  expect(page.url()).toMatch(/\/content\/privacy-policy/);

  // Wait for the page title or heading containing "Privacy" to render
  const privacyHeading = page.locator('text=/privacy/i').first();
  await privacyHeading.waitFor({ state: 'visible', timeout: 20000 });

  // Verify the page renders text content
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText.toLowerCase()).toContain('privacy');
});
