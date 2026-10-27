// Accessibility: WCAG 2.2 AA via axe-core, plus keyboard, naming and motion checks axe can't do.
const { test, expect } = require('@playwright/test');
const { MOBILE, open, chromeAccessibleName, axe, describeViolations } = require('./helpers');

test.describe('axe-core finds no WCAG 2.2 A/AA violations', () => {
  const states = [
    { name: 'desktop, light', use: {} },
    { name: 'desktop, dark', use: { colorScheme: 'dark' } },
    { name: 'mobile, light', use: MOBILE },
    { name: 'mobile, dark', use: { ...MOBILE, colorScheme: 'dark' } },
  ];
  for (const state of states) {
    test.describe(state.name, () => {
      test.use(state.use);

      // Reduced motion: the hero tiles fade in, which would skew contrast checks mid-animation.
      test('before the deadline, bios expanded', async ({ page }) => {
        await open(page, { at: '2026-11-10T12:00:00Z', reduceMotion: true });
        for (const button of await page.locator('.bio-toggle').all()) await button.click();
        const { violations } = await axe(page).analyze();
        expect(violations, describeViolations(violations)).toEqual([]);
      });

      test('after the deadline, with passed dates', async ({ page }) => {
        await open(page, { at: '2027-01-10T12:00:00Z', reduceMotion: true });
        const { violations } = await axe(page).analyze();
        expect(violations, describeViolations(violations)).toEqual([]);
      });
    });
  }

  test.describe('mobile', () => {
    test.use(MOBILE);

    test('with the menu open', async ({ page }) => {
      await open(page, { reduceMotion: true });
      await page.getByRole('button', { name: 'Menu' }).click();
      const { violations } = await axe(page).analyze();
      expect(violations, describeViolations(violations)).toEqual([]);
    });
  });
});

test.describe('keyboard', () => {
  test('the first Tab reveals the skip link, which moves focus to the content', async ({ page }) => {
    await open(page, { reduceMotion: true });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  for (const direction of ['Tab', 'Shift+Tab']) {
    test(`every ${direction} stop has a visible focus ring and is not hidden under the sticky header`, async ({ page }) => {
      // Reduced motion: instant scrolling, so positions are final when measured.
      await open(page, { reduceMotion: true });
      if (direction === 'Shift+Tab') await page.locator('.footer-bottom a[href="#top"]').focus();

      const problems = [];
      let stops = 0;
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press(direction);
        const stop = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body || el.dataset.visited) return null;
          el.dataset.visited = 'yes';
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const header = document.querySelector('.site-header').getBoundingClientRect();
          return {
            name: (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().split('\n')[0],
            ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
            // The skip link is drawn above the header; header items belong there.
            hidden: !el.closest('.site-header') && !el.classList.contains('skip-link') && rect.top < header.bottom - 1,
          };
        });
        if (!stop) break;
        stops++;
        if (!stop.ring) problems.push(`${stop.name}: no visible focus ring`);
        if (stop.hidden) problems.push(`${stop.name}: hidden under the header`);
      }
      expect(stops).toBeGreaterThan(20);
      expect(problems).toEqual([]);
    });
  }
});

test.describe('screen reader semantics', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('one h1 and no skipped heading levels', async ({ page }) => {
    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((level, i) => {
      if (i > 0) expect(level, `heading #${i + 1} jumps from h${levels[i - 1]} to h${level}`).toBeLessThanOrEqual(levels[i - 1] + 1);
    });
  });

  test('decorative icons are hidden', async ({ page }) => {
    await expect(page.locator('svg.icon:not([aria-hidden="true"])')).toHaveCount(0);
  });

  test('links that open a new tab say so', async ({ page }) => {
    for (const link of await page.locator('a[target="_blank"]').all()) {
      await expect(link).toHaveAccessibleName(/\(opens in a new tab\)/);
    }
  });

  test('buttons have unique, descriptive names', async ({ page }) => {
    const names = [];
    for (const button of await page.locator('button').all()) names.push(await chromeAccessibleName(button));
    expect(names).toEqual(expect.arrayContaining([
      'Read full bio of Sara Tibidò',
      'Read full bio of Nadia Spatari',
      'Read full bio of Azzurra Ragone',
      'Read full bio of Angelo Furfaro',
      'Copy e-mail subject',
    ]));
    expect(new Set(names).size).toBe(names.length);
  });

  test('styled lists keep their list role', async ({ page }) => {
    for (const cls of ['nav-links', 'hero-meta', 'topic-grid', 'timeline', 'types', 'people']) {
      await expect(page.locator(`.${cls}`)).toHaveRole('list');
    }
  });
});

test.describe('motion', () => {
  test('decorative animations stop within 5 seconds', async ({ page }) => {
    await open(page);
    await page.waitForTimeout(5200);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
  });

  test('nothing animates with reduced motion', async ({ page }) => {
    await open(page, { reduceMotion: true });
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});
