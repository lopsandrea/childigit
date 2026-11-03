// Content required by the workshop brief.
const { test, expect } = require('@playwright/test');
const { EMAIL, SUBJECT } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('names the workshop and links the main conference', async ({ page }) => {
  await expect(page).toHaveTitle(/^CHILDIGIT 2027/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    'CHILDIGIT – Children in a Digital World: Bridging Technical and Legal Perspectives on Security, Safety and Participation',
  );
  await expect(page.getByRole('link', { name: /^ITASEC & SERICS 2027/ }).first()).toHaveAttribute('href', 'https://itasec.it');
  await expect(page.locator('.hero-meta')).toContainText('February 8, 2027 · Afternoon');
  await expect(page.locator('.hero-meta')).toContainText('Siena, Italy');
});

test('has the four sections of the brief, plus dates and submission', async ({ page }) => {
  for (const name of [
    'Call for Participation',
    'Important Dates',
    'Submission Information',
    'Organising Committee',
    'Technical Program Committee',
    'Workshop Program',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }
});

test('lists the six topics of interest', async ({ page }) => {
  const topics = page.locator('.topic-text');
  await expect(topics).toHaveCount(6);
  await expect(topics).toHaveText([
    'Children’s privacy and data protection',
    'Cybersecurity and online safety for children',
    'Age assurance and age verification solutions',
    'Human-Computer interaction and child-centred design',
    'Legal and regulatory requirements for digital technologies used by children',
    'Evaluation and auditing of technologies with respect to children’s security, safety and rights to participation and agency',
  ]);
  await expect(page.locator('.notice')).toContainText('accepted papers will NOT be included in the Proceedings');
});

test('shows the important dates', async ({ page }) => {
  await expect(page.locator('.tl-date')).toHaveCount(3);
  const datetimes = await page.locator('.tl-date').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')));
  expect(datetimes).toEqual(['2026-11-30', '2026-12-15', '2027-02-08']);
  await expect(page.locator('.tl-item h3')).toHaveText(['Submission Deadline', 'Notification of Acceptance', 'Workshop Day']);
});

test('every e-mail link reaches the submission address with the required subject', async ({ page }) => {
  const hrefs = await page.locator('a[href^="mailto:"]').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThanOrEqual(3);
  for (const href of hrefs) {
    const url = new URL(href);
    expect(url.pathname).toBe(EMAIL);
    const subject = url.searchParams.get('subject');
    if (subject !== null) expect(subject).toBe(SUBJECT);
  }
  await expect(page.locator('#subject-line')).toHaveText(SUBJECT);
});

test('links the official CEURART template and the ITASEC call for papers', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'CEURART template (ZIP)' })).toHaveAttribute('href', 'https://ceur-ws.org/Vol-XXX/CEURART.zip');
  await expect(page.getByRole('link', { name: /^Overleaf/ })).toHaveAttribute('href', /overleaf\.com\/latex\/templates\/template-for-submissions-to-ceur-workshop-proceedings/);
  await expect(page.getByRole('link', { name: /^ITASEC 2027 Call for Papers/ })).toHaveAttribute('href', 'https://itasec.it/call-for-papers/');
});

test('describes the four submission types with their limits', async ({ page }) => {
  const types = page.locator('.type');
  await expect(types).toHaveCount(4);
  const expected = [
    ['Abstracts', '500', 'words max.'],
    ['Position Papers', '3', 'pages max.'],
    ['Short Papers', '3', 'pages max.'],
    ['Reports on already published results', '16', 'pages max.'],
  ];
  for (const [i, [title, num, unit]] of expected.entries()) {
    await expect(types.nth(i).getByRole('heading', { level: 4 })).toHaveText(title);
    await expect(types.nth(i).locator('.type-num')).toHaveText(num);
    await expect(types.nth(i).locator('.type-unit')).toHaveText(unit);
    await expect(types.nth(i)).toContainText('Excluding bibliography');
  }
  await expect(page.locator('.selection')).toContainText('must register to the workshop and present the work submitted');
});

test('introduces the organisers with their photos', async ({ page }) => {
  const people = page.locator('.person');
  await expect(people.locator('.person-name')).toHaveText(['Sara Tibidò', 'Nadia Spatari', 'Azzurra Ragone', 'Angelo Furfaro']);
  for (const img of await people.locator('img.avatar').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
});

test('lists the Technical Program Committee with name and affiliation only', async ({ page }) => {
  await expect(page.locator('#tpc .committee-name')).toHaveText([
    'Sara Tibidò',
    'Nadia Spatari',
    'Azzurra Ragone',
    'Angelo Furfaro',
    'Francesco Blefari',
    'Matteo Lupinacci',
    'Francesco Romeo',
    'Samuele Del Vescovo',
    'Gabriel Cellammare',
  ]);
  await expect(page.locator('#tpc .committee-aff')).toHaveText([
    'IMT Lucca / University of Bari “Aldo Moro”',
    'IMT Lucca',
    'University of Bari “Aldo Moro”',
    'University of Calabria',
    'University of Calabria',
    'University of Calabria',
    'IMT Lucca',
    'University of Bari “Aldo Moro”',
    'University of Bari “Aldo Moro”',
  ]);
  await expect(page.locator('#tpc .placeholder')).toHaveCount(0);
});

test('keeps the TBD placeholder for the program', async ({ page }) => {
  await expect(page.locator('#program .placeholder-badge')).toHaveText('TBD');
});

test('the call opens with body-size text and the deadline stands out in red', async ({ page }) => {
  const paragraphs = page.locator('#call .prose p');
  const sizes = await paragraphs.evaluateAll((ps) => ps.map((p) => getComputedStyle(p).fontSize));
  expect(new Set(sizes).size).toBe(1);
  const deadline = page.locator('.glance-list .is-deadline dd');
  await expect(deadline).toHaveText('November 30, 2026');
  const [r, g, b] = (await deadline.evaluate((el) => getComputedStyle(el).color)).match(/\d+/g).map(Number);
  expect(r).toBeGreaterThan(150);
  expect(r).toBeGreaterThan(g * 2.5);
  expect(r).toBeGreaterThan(b * 2.5);
});

test('credits the website author', async ({ page }) => {
  const credit = page.locator('.site-footer').getByRole('link', { name: /^Andrea Lops/ });
  await expect(credit).toHaveAttribute('href', 'https://www.linkedin.com/in/lopsandrea');
});
