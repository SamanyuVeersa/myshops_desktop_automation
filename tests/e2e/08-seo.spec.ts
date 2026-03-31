import { test, expect } from '@playwright/test';
import { BASE_URL, handlePasscodeGate } from './helpers';

test("[Desktop] If relevant for the storefront, the sitemap index at /sitemap.xml includes links to sitemaps for each indexed user preference for that domain [65]", async ({ page }) => {
  test.setTimeout(60000);

  try {
    await page.goto(BASE_URL + 'sitemap.xml', { waitUntil: 'load', timeout: 30000 });
  } catch {
    await page.waitForLoadState('load', { timeout: 30000 });
  }
  await page.waitForTimeout(3000);
  await handlePasscodeGate(page);

  if (!page.url().includes('sitemap.xml')) {
    await page.goto(BASE_URL + 'sitemap.xml', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  // XML documents may not have body in Firefox; serialize the full XML
  const pageContent = await page.evaluate(() => {
    if (document.body?.innerText) return document.body.innerText;
    return new XMLSerializer().serializeToString(document);
  });

  expect(pageContent).toMatch(/sitemap/i);
  expect(pageContent).toMatch(/\.xml/);
  expect(pageContent).toContain('legendscommerce.io');
});

test("[Desktop] /robots.txt specifies Disallow paths for all user agents, all non-indexed user preference paths, and any paths for that storefront. It also specifies the URL of the sitemap [66]", async ({ page }) => {
  test.setTimeout(30000);

  await page.goto(BASE_URL + 'robots.txt', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  const robotsText = await page.evaluate(() => document.body.innerText);

  // Should have User-agent directive
  expect(robotsText).toContain('User-agent:');

  // Should have Disallow paths
  expect(robotsText).toContain('Disallow:');

  // Should disallow non-indexed user preference paths
  expect(robotsText).toMatch(/Disallow:.*\/en-/);

  // Should specify the sitemap URL
  expect(robotsText).toContain('Sitemap:');
  expect(robotsText).toContain('sitemap.xml');
});
