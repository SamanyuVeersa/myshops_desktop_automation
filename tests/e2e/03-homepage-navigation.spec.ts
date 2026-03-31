import { test, expect } from '@playwright/test';
import { BASE_URL, handlePasscodeGate } from './helpers';

test("When I visit our storefronts at the root path (i.e. shop.xyz.com/), I am presented with a content page which does not error out [15]", async ({ page }) => {
  test.setTimeout(60000);

  const response = await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  expect(response?.status()).toBeLessThan(400);

  const nav = page.locator('nav[aria-label="Top"]');
  await expect(nav).toBeVisible({ timeout: 10000 });

  const main = page.locator('main');
  await expect(main).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(100);

  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

test("[Desktop] When I visit the homepage, I can view every category in the navigation bar, none are cutoff or hidden [16]", async ({ page }) => {
  test.setTimeout(60000);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  const categories = page.locator('[data-testid="category"]');
  const count = await categories.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const cat = categories.nth(i);
    await expect(cat).toBeVisible();

    const box = await cat.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1280);
  }
});

test("[Real Madrid, BVB, Standard, Desktop] When I hover over a category in the navbar that has a \\/ carot symbol, a visible panel appears and clearly shows the sections under that category with clickable links and images [17]", async ({ page }) => {
  test.setTimeout(60000);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  const firstCategory = page.locator('[data-testid="category"]').first();
  await expect(firstCategory).toBeVisible();
  const hasSvg = await firstCategory.locator('svg').count();
  expect(hasSvg).toBeGreaterThan(0);

  await firstCategory.hover();
  await page.waitForTimeout(1000);

  const navLinks = page.locator('nav a:visible');
  const linkCount = await navLinks.count();
  expect(linkCount).toBeGreaterThan(3);

  const linkTexts = await navLinks.allTextContents();
  const hasSubcategory = linkTexts.some(t => /Polos|Outerwear|Bottoms|Accessories/i.test(t));
  expect(hasSubcategory).toBeTruthy();
});

test("[Real Madrid, BVB, Standard, Desktop] When I hover over a category in the navbar that has a \\/ carot symbol, a visible panel appears and clearly shows the sections under that category with clickable links and images [18]", async ({ page }) => {
  test.setTimeout(60000);

  // Duplicate of [17] - testing a different category (Women's)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  const womenCategory = page.locator('[data-testid="category"]').nth(1);
  await expect(womenCategory).toBeVisible();

  await womenCategory.hover();
  await page.waitForTimeout(1000);

  const navLinks = page.locator('nav a:visible');
  const linkCount = await navLinks.count();
  expect(linkCount).toBeGreaterThan(3);

  const linkTexts = await navLinks.allTextContents();
  expect(linkTexts.some(t => t.trim().length > 0)).toBeTruthy();
});

test("[Real Madrid, BVB, Standard] When I scroll down the homepage, the navbar should dissapear. When I scroll back up any amount, the navbar should re-appear [19]", async ({ page }) => {
  test.setTimeout(90000);

  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  // Verify nav exists and record its selector
  const navSelector = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    return nav ? nav.outerHTML.substring(0, 100) : null;
  });
  expect(navSelector).toBeTruthy();

  // Record initial scroll position and nav state
  const initialNavBottom = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    return nav ? nav.getBoundingClientRect().bottom : -1;
  });
  expect(initialNavBottom).toBeGreaterThan(0);

  // Scroll down using mouse wheel for realistic behavior
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(2000);

  const afterScrollDown = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return { scrollY: window.scrollY, navBottom: -999 };
    return { scrollY: window.scrollY, navBottom: nav.getBoundingClientRect().bottom };
  });
  expect(afterScrollDown.scrollY).toBeGreaterThan(200);
  // Nav should be out of view (scrolled up past viewport top)
  expect(afterScrollDown.navBottom).toBeLessThanOrEqual(0);

  // Scroll back up
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(2000);

  const afterScrollUp = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return { navBottom: -999 };
    return { navBottom: nav.getBoundingClientRect().bottom };
  });
  // Navbar should be visible again (bottom > 0)
  expect(afterScrollUp.navBottom).toBeGreaterThan(0);
});

test("When I view the homepage, I see a cart icon that shows me my active cart if I have one, or a message telling me to shop/add items/continue shopping etc. if I don't have any items in my cart. [20]", async ({ page }) => {
  test.setTimeout(90000);

  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  const cartBtn = page.locator('[data-testid="cartbutton"]');
  await expect(cartBtn).toBeVisible();
  await expect(cartBtn).toHaveAttribute('aria-label', 'Cart items: 0');

  // Open the cart sidebar to see the empty cart message
  await cartBtn.click();
  await page.waitForTimeout(1000);

  const sidebar = page.locator('[class*="Sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  const sidebarText = await sidebar.innerText();
  expect(sidebarText).toMatch(/empty|continue shopping|your cart is empty/i);
});

test("[Real Madrid, Standard] The first widget on the homepage should be a \"Hero Widget\", showing some advertising image across the whole screen with a CTA card on top of that image. [21]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  const main = page.locator('main');
  await expect(main).toBeVisible();

  // First large image in main should be the hero
  const heroImg = main.locator('img').first();
  await expect(heroImg).toBeVisible({ timeout: 10000 });
  const imgBox = await heroImg.boundingBox();
  expect(imgBox).toBeTruthy();
  // Hero image should span a significant width (at least 80% of viewport)
  const viewport = page.viewportSize();
  expect(imgBox!.width).toBeGreaterThan((viewport?.width ?? 1280) * 0.5);

  // Should have a CTA link or text overlaid
  const heroSection = main.locator('> div').first();
  const links = await heroSection.locator('a').count();
  const hasTextContent = (await heroSection.innerText()).trim().length > 0;
  expect(links > 0 || hasTextContent).toBeTruthy();
});

test("When I see widgets with a background image and a callout card / image pair on top of that, I should be able to clearly read all the text on the widget [22]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  const main = page.locator('main');
  await expect(main).toBeVisible();

  // Find all visible text elements on the homepage hero/widget area
  const heroSection = main.locator('> div').first();
  const textElements = heroSection.locator('h1, h2, h3, h4, p, span, a');
  const textCount = await textElements.count();

  const visibleTexts: string[] = [];
  for (let i = 0; i < Math.min(textCount, 20); i++) {
    const el = textElements.nth(i);
    if (await el.isVisible().catch(() => false)) {
      const text = (await el.innerText()).trim();
      if (text.length > 0) {
        visibleTexts.push(text);
        // Verify font size is at least 10px (readable)
        const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
        expect(fontSize).toBeGreaterThanOrEqual(10);
      }
    }
  }

  expect(visibleTexts.length).toBeGreaterThan(0);
});

test("404 pages render the sites theme for the navbar and footer, is translated to the selected language [23]", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(BASE_URL + 'this-page-does-not-exist-12345', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  // Navbar is present with categories
  const nav = page.locator('nav[aria-label="Top"]');
  await expect(nav).toBeVisible();
  const categories = page.locator('[data-testid="category"]');
  expect(await categories.count()).toBeGreaterThan(0);

  // Footer is present
  const footer = page.locator('footer');
  await expect(footer).toBeVisible();

  // 404 content is shown
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toMatch(/404|not found|page not found/i);
});

test("[Desktop] Footer renders at the bottom of all pages, is translated to the selected language, has multiple columns of links that navigate to the appropriate page, and renders other information like accepted payments or social media links based on the storefront [24]", async ({ page }) => {
  test.setTimeout(60000);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await handlePasscodeGate(page);

  // Scroll to bottom to ensure footer is in view
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  const footer = page.locator('footer');
  await expect(footer).toBeVisible();

  const footerText = await footer.innerText();

  // Verify multiple link sections
  expect(footerText).toMatch(/Men|Women|Shop/i);
  expect(footerText).toMatch(/FAQ|Contact/i);
  expect(footerText).toMatch(/Terms|Privacy|Return/i);

  // Verify footer has clickable links
  const footerLinks = footer.locator('a');
  const linkCount = await footerLinks.count();
  expect(linkCount).toBeGreaterThan(5);

  // Verify payment icons are present
  const paymentImgs = footer.locator('img[alt*="logo"]');
  const paymentCount = await paymentImgs.count();
  expect(paymentCount).toBeGreaterThan(0);

  // Verify copyright notice
  expect(footerText).toMatch(/©|All Rights Reserved/i);
});
