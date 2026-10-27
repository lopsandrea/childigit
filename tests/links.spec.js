// Links and assets. The @external test calls third-party sites: run it with `npm run test:links`.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('in-page links point to existing sections', async ({ page }) => {
  const targets = await page.locator('a[href^="#"]').evaluateAll((els) => els.map((el) => el.getAttribute('href').slice(1)));
  expect(targets.length).toBeGreaterThan(5);
  for (const id of new Set(targets)) {
    await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
  }
});

test('every local file referenced by the page exists', async ({ page, request }) => {
  const paths = await page.evaluate(() => {
    const local = (url) => url && !/^(https?:|mailto:|#|data:)/.test(url);
    const urls = [
      ...[...document.querySelectorAll('img[src], script[src]')].map((el) => el.getAttribute('src')),
      ...[...document.querySelectorAll('link[href]')].map((el) => el.getAttribute('href')),
      ...[...document.querySelectorAll('a[href]')].map((el) => el.getAttribute('href')),
    ];
    return [...new Set(urls.filter(local))];
  });
  // Social preview image: absolute URL on the live site, same path locally.
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  paths.push(new URL(og).pathname.replace(/^\/childigit\//, ''));

  expect(paths).toEqual(expect.arrayContaining(['assets/css/styles.css', 'assets/js/main.js', 'assets/img/og-image.png']));
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('external links respond @external', async ({ page, request }) => {
  test.setTimeout(120_000);
  const urls = await page.locator('a[href^="http"]').evaluateAll((els) => [...new Set(els.map((el) => el.href))]);
  const broken = [];
  for (const url of urls) {
    // LinkedIn rejects automated requests (HTTP 999) even for valid profiles.
    if (new URL(url).hostname.endsWith('linkedin.com')) continue;
    const response = await request.get(url, { maxRedirects: 5, timeout: 30_000, failOnStatusCode: false });
    if (response.status() >= 400) broken.push(`${response.status()} ${url}`);
  }
  expect(broken).toEqual([]);
});
