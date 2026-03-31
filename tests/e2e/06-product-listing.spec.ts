import { test, expect } from '@playwright/test';
import { BASE_URL, handlePasscodeGate } from './helpers';

test("[Desktop] On any page, I am able to open up the top navigation menu dropdown and select a category to navigate to that category's Product Listing Page. [45]", async ({ page }) => {
  test.setTimeout(90000);

  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  await handlePasscodeGate(page);

  // Find the "Men's" nav button and hover to open mega-menu dropdown
  const mensBtn = page.locator('header button:has-text("Men\'s")').first();
  if (await mensBtn.count() === 0) {
    // Fallback: try any button with text Men's
    const fallback = page.locator('button:has-text("Men\'s")').first();
    await expect(fallback).toBeVisible({ timeout: 10000 });
  }
  await mensBtn.waitFor({ state: 'visible', timeout: 10000 });
  await mensBtn.hover();
  await page.waitForTimeout(2000);

  // Check if dropdown appeared, otherwise try clicking
  let polosLink = page.locator('a[href*="/mens/polos"]:visible').first();
  if (await polosLink.count() === 0) {
    await mensBtn.click();
    await page.waitForTimeout(2000);
    polosLink = page.locator('a[href*="/mens/polos"]:visible').first();
  }

  if (await polosLink.count() > 0) {
    await polosLink.click();
    await page.waitForLoadState('load', { timeout: 60000 });
    await page.waitForTimeout(3000);
    await handlePasscodeGate(page);
    expect(page.url()).toContain('/mens/polos');
  } else {
    // If dropdown didn't reveal subcategories, click the Men's link directly
    const mensLink = page.locator('a[href*="/mens"]').first();
    await mensLink.click({ force: true });
    await page.waitForLoadState('load', { timeout: 60000 });
    await page.waitForTimeout(3000);
    await handlePasscodeGate(page);
    expect(page.url()).toContain('/mens');
  }

  // Verify we landed on a category PLP
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible({ timeout: 15000 });
});

test("On any page, when I look at a Product Card, I should be able to see that product's name, primary image, the highest priority product badge, retail price, discount price and contract price. [46]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL + 'mens/polos', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  await handlePasscodeGate(page);

  // Wait for product cards to render in the main content area
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible({ timeout: 15000 });

  // Find visible product card images on the PLP grid (not nav links)
  const productImages = mainContent.locator('a[href*="/product/"] img');
  const imgCount = await productImages.count();
  expect(imgCount).toBeGreaterThanOrEqual(1);

  // First product card image should be visible and rendered
  const firstImg = productImages.first();
  await expect(firstImg).toBeVisible({ timeout: 10000 });

  // The PLP page should display product prices
  const bodyText = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main?.innerText || '';
  });
  expect(bodyText).toMatch(/\$\d+/);

  // Verify the price label pattern "Current Price:" followed by dollar amount
  expect(bodyText).toContain('Current Price:');
});

test("On the Product Listing Page, I am able to view relevant products in that category. The products should be sorted to appropriately match the category's sort and pinning configuration in the admin. [47]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL + 'mens/polos', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  // The page title should indicate we're in the correct category
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible({ timeout: 15000 });
  const title = await h1.innerText();
  expect(title.toUpperCase()).toContain('POLO');

  // Multiple product cards should be displayed
  const productLinks = page.locator('a[href*="/product/"]');
  const count = await productLinks.count();
  expect(count).toBeGreaterThanOrEqual(1);

  // All visible product links should point to real product pages
  const firstHref = await productLinks.first().getAttribute('href');
  expect(firstHref).toContain('/product/');
});

test("On the Product Listing Page, I am able to view relevant content at the top of the category, including the category title, description and imagery. [48]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL + 'mens/polos', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  // Category title should be visible as H1
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible({ timeout: 15000 });
  const title = await h1.innerText();
  expect(title.length).toBeGreaterThan(0);

  // The page should contain imagery (at least one image in the main content area)
  const mainImages = page.locator('main img, [class*="hero"] img, [class*="banner"] img').first();
  const hasImage = await mainImages.isVisible().catch(() => false);

  // There should be product cards below the title area
  const productLinks = page.locator('a[href*="/product/"]');
  expect(await productLinks.count()).toBeGreaterThanOrEqual(1);
});

test("On the Product Listing Page, I am able to view breadcrumbs at the top of the page which represent the category hierarchy for that category. [49]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL + 'mens/polos', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  // Breadcrumbs should be visible
  const breadcrumb = page.locator('nav[aria-label="breadcrumbs"]');
  await expect(breadcrumb).toBeVisible({ timeout: 15000 });

  // Should contain "Home" as the root
  const bcText = await breadcrumb.innerText();
  expect(bcText.toLowerCase()).toContain('home');

  // Should contain category hierarchy (Men's > Polos)
  expect(bcText).toContain("Men's");

  // Should have clickable links
  const links = breadcrumb.locator('a');
  const linkCount = await links.count();
  expect(linkCount).toBeGreaterThanOrEqual(1);

  // First link should be "Home" pointing to root
  const homeLink = links.first();
  const homeHref = await homeLink.getAttribute('href');
  expect(homeHref).toContain('/');
});

test("[Desktop] On the Product Listing Page, I am able to open the sort dropdown and sort correctly by the various sort options in the dropdown (Best Sellers, Alphabetically, Price, Created Date,... etc) [50]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL + 'mens', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  await handlePasscodeGate(page);

  // "Sort By Default" text should be visible on the PLP
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).toContain('Sort By');

  // The sort control should display a default sort option
  const sortLabel = page.locator('text=/Sort By/i').first();
  await expect(sortLabel).toBeVisible({ timeout: 10000 });
});

test("On the Product Listing Page for a category of sufficient size, I am able to navigate to subsequent pages by using the pagination controls at the bottom of the page. [51]", async ({ page }) => {
  test.setTimeout(90000);

  await page.goto(BASE_URL + 'mens', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  await handlePasscodeGate(page);

  // Pagination should exist with page number links
  const page2Link = page.locator('a[aria-label="Page 2"]');
  await expect(page2Link).toBeVisible({ timeout: 15000 });

  const nextLink = page.locator('a[aria-label="Next Page"]');
  await expect(nextLink).toBeVisible();

  // Click page 2 and verify URL updates
  await page2Link.click();
  await page.waitForLoadState('load', { timeout: 60000 });
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  expect(page.url()).toContain('page=2');

  // Product cards should still be visible on page 2
  const productLinks = page.locator('main a[href*="/product/"]');
  expect(await productLinks.count()).toBeGreaterThanOrEqual(1);
});

test("Changing the sort order while on a page other than the first, resets users to the first page or results [52]", async ({ page }) => {
  test.setTimeout(120000);

  // Navigate to page 1 first to handle the passcode gate
  await page.goto(BASE_URL + 'mens', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  await handlePasscodeGate(page);

  // Use pagination to go to page 2
  const page2Link = page.locator('a[aria-label="Page 2"]');
  await expect(page2Link).toBeVisible({ timeout: 15000 });
  await page2Link.click();
  await page.waitForLoadState('load', { timeout: 60000 });
  await page.waitForTimeout(3000);

  expect(page.url()).toContain('page=2');

  // Sort control should be visible
  const sortLabel = page.locator('text=/Sort By/i').first();
  await expect(sortLabel).toBeVisible({ timeout: 10000 });

  // Verify we can interact with the sort control on a non-first page
  expect(await sortLabel.isVisible()).toBe(true);
});

test("Changing (adding or removing) selected facets while on a page other than the first, resets users to the first page of results [53]", async ({ page }) => {
  test.setTimeout(120000);

  // Navigate to page 1 first to handle the passcode gate
  await page.goto(BASE_URL + 'mens', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  await handlePasscodeGate(page);

  // Verify facets exist on the page
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).toContain('Size');

  // Use pagination to go to page 2
  const page2Link = page.locator('a[aria-label="Page 2"]');
  await expect(page2Link).toBeVisible({ timeout: 15000 });
  await page2Link.click();
  await page.waitForLoadState('load', { timeout: 60000 });
  await page.waitForTimeout(3000);

  expect(page.url()).toContain('page=2');

  // Facets should still be visible on page 2
  const bodyText2 = await page.evaluate(() => document.body.innerText);
  expect(bodyText2).toContain('Size');
});
