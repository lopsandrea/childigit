// Interactive behaviour from assets/js/main.js.
const { test, expect } = require('@playwright/test');
const { SUBJECT, MOBILE, open, chromeAccessibleName } = require('./helpers');

test.describe('submission countdown', () => {
  // Deadline: end of November 30, 2026, Anywhere on Earth (2026-12-01T11:59:59Z).
  const cases = [
    { now: '2026-11-10T12:00:00Z', num: '20', label: 'days to go' },
    { now: '2026-11-29T12:00:00Z', num: '1', label: 'day to go' },
    { now: '2026-11-30T12:00:00Z', num: '<1', label: 'day to go' },
    { now: '2026-12-02T00:00:00Z', num: '0', label: 'submissions closed' },
  ];
  for (const { now, num, label } of cases) {
    test(`at ${now} shows "${num} ${label}"`, async ({ page }) => {
      await open(page, { at: now });
      await expect(page.locator('.deadline-count')).toBeVisible();
      await expect(page.locator('[data-count]')).toHaveText(num);
      await expect(page.locator('[data-count-label]')).toHaveText(label);
      if (label === 'submissions closed') await expect(page.locator('.deadline')).toHaveClass(/is-closed/);
    });
  }
});

test.describe('timeline status', () => {
  const cases = [
    { now: '2026-11-10T12:00:00Z', statuses: ['Next up', 'Upcoming', 'Upcoming'] },
    { now: '2027-01-10T12:00:00Z', statuses: ['Passed', 'Passed', 'Next up'] },
    { now: '2027-03-01T12:00:00Z', statuses: ['Passed', 'Passed', 'Passed'] },
  ];
  for (const { now, statuses } of cases) {
    test(`at ${now}: ${statuses.join(' / ')}`, async ({ page }) => {
      await open(page, { at: now });
      await expect(page.locator('.tl-status')).toHaveText(statuses);
      await expect(page.locator('.tl-item.is-next')).toHaveCount(statuses.includes('Next up') ? 1 : 0);
    });
  }
});

test('copy button puts the e-mail subject on the clipboard and announces it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  // Located by class: the accessible name changes while "Copied!" is shown.
  const button = page.locator('.copy-btn');
  await expect(button).toHaveAccessibleName('Copy e-mail subject');
  await button.click();
  await expect(button).toContainText('Copied!');
  await expect(page.locator('#copy-status')).toHaveText('E-mail subject copied to the clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(SUBJECT);
});

test('bio toggles expand and collapse, keeping the person in the button name', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('[aria-controls="bio-furfaro"]');
  const bio = page.locator('#bio-furfaro');
  expect(await chromeAccessibleName(button)).toBe('Read full bio of Angelo Furfaro');
  const collapsed = await bio.evaluate((el) => el.clientHeight);

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(await chromeAccessibleName(button)).toBe('Hide full bio of Angelo Furfaro');
  expect(await bio.evaluate((el) => el.clientHeight)).toBeGreaterThan(collapsed * 2);
  await expect(bio).toContainText('serves on program committees for major international security and AI conferences.');

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(await chromeAccessibleName(button)).toBe('Read full bio of Angelo Furfaro');
});

test('the nav highlights the section in view', async ({ page }) => {
  await page.goto('/');
  await page.locator('#organisers').evaluate((el) => el.scrollIntoView());
  await expect(page.locator('.nav-links a[href="#organisers"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.nav-links a[aria-current]')).toHaveCount(1);
});

test.describe('mobile menu', () => {
  test.use(MOBILE);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens and closes with the toggle', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Menu' });
    const menu = page.locator('#nav-menu');
    await expect(menu).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('link', { name: 'Organisers' })).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
  });

  test('Escape closes it and returns focus to the toggle', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Menu' });
    await toggle.click();
    await page.getByRole('link', { name: 'Dates' }).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-menu')).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('choosing a section closes it and jumps there', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('#nav-menu').getByRole('link', { name: 'Organisers' }).click();
    await expect(page.locator('#nav-menu')).toBeHidden();
    await expect(page).toHaveURL(/#organisers$/);
  });

  test('tabbing out of it closes it', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Menu' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    const items = await page.locator('#nav-menu a').count();
    for (let i = 0; i <= items; i++) await page.keyboard.press('Tab');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-menu')).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all content is still there and nothing half-rendered shows', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Organising Committee' })).toBeVisible();
    await expect(page.locator('.deadline-count')).toBeHidden();
    await expect(page.locator('.tl-status').first()).toBeHidden();
    await expect(page.locator('#bio-furfaro')).toContainText('major international security and AI conferences.');
  });
});
