// Responsive layout.
const { test, expect } = require('@playwright/test');

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test.describe(`${width}px wide`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('no horizontal scrolling', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBe(0);
    });

    test(width > 1080 ? 'shows the full navigation' : 'collapses the navigation into a menu', async ({ page }) => {
      await page.goto('/');
      const toggle = page.getByRole('button', { name: 'Menu' });
      const link = page.locator('#nav-menu').getByRole('link', { name: 'Organisers' });
      if (width > 1080) {
        await expect(toggle).toBeHidden();
        await expect(link).toBeVisible();
      } else {
        await expect(toggle).toBeVisible();
        await expect(link).toBeHidden();
      }
    });
  });
}

test('the title stays on one line on desktop', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const { height, fontSize } = await page.locator('.hero-title').evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    fontSize: parseFloat(getComputedStyle(el).fontSize),
  }));
  expect(height).toBeLessThan(fontSize * 1.5);
});
