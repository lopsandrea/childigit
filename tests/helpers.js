const AxeBuilder = require('@axe-core/playwright').default;

const EMAIL = 'nadia.spatari@imtlucca.it';
const SUBJECT = 'CHILDIGIT workshop_Submission_Surname, Name';

const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

/**
 * Opens the page. `at` freezes the clock so date-driven UI is deterministic;
 * `reduceMotion` emulates prefers-reduced-motion (the `reducedMotion` test option
 * is not applied with the system Chrome channel, page.emulateMedia is).
 */
async function open(page, { at, reduceMotion = false } = {}) {
  if (at) await page.clock.install({ time: new Date(at) });
  if (reduceMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
}

/**
 * The accessible name as Chrome computes it, i.e. what screen readers get.
 * Playwright's own toHaveAccessibleName ignores the CSS alt-text syntax
 * (content: "↓" / "") and would include decorative generated content.
 */
async function chromeAccessibleName(locator) {
  const node = await locator.page().accessibility.snapshot({ root: await locator.elementHandle(), interestingOnly: false });
  return node && node.name;
}

/** Runs axe with the WCAG 2.2 A/AA rule set plus best practices. */
function axe(page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']);
}

/** Compact, readable summary of axe violations for assertion messages. */
function describeViolations(violations) {
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n');
}

module.exports = { EMAIL, SUBJECT, MOBILE, open, chromeAccessibleName, axe, describeViolations };
