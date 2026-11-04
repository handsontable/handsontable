import { test, expect, type Page } from '@playwright/test';

/**
 * The Headway changelog bell in the docs header, against the real Headway widget (account
 * `xaD6ry`). The panel is a cross-origin iframe, so the spec asserts on the parts the docs
 * own: the bell's name and state, the panel's visibility class, its title, focus, and scroll.
 */
const PAGE_PATH = '/docs/javascript-data-grid/';

test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || '');

  // Without a consent cookie, Cookiebot's implied-consent handler swallows the first click.
  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: url.hostname,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ?? '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Count Headway.init calls: a second init destroys the first widget and creates a new one, so
  // counting the panel elements afterwards cannot tell one init from two.
  await page.addInitScript(() => {
    let headway: { init: (...args: unknown[]) => unknown } | undefined;

    (window as unknown as { hwInitCalls: number }).hwInitCalls = 0;
    Object.defineProperty(window, 'Headway', {
      configurable: true,
      get: () => headway,
      set: (value) => {
        const init = value.init;

        value.init = function countedInit(...args: unknown[]) {
          (window as unknown as { hwInitCalls: number }).hwInitCalls += 1;

          return init.apply(this, args);
        };
        headway = value;
      },
    });
  });
});

const HEADWAY_SCRIPT = /cdn\.headwayapp\.co\/widget\.js/;
const HEADWAY_FRAME = /headway-widget\.net\/widgets\//;

/**
 * Loads the page and waits for the bell. The bell stays hidden by design when Headway is
 * unreachable, so that case is a skip. Any other hidden bell (a wrong selector, a broken load
 * listener, a CSP change, a second init) is a failure: the skip needs Headway's own requests to
 * have failed.
 *
 * @param {Page} page The page.
 * @param {{ width: number, height: number }} viewport The viewport.
 */
async function openPage(page: Page, viewport: { width: number, height: number }) {
  // A request can fail and be retried (the frame's first load is sometimes aborted), so this
  // records whether each one was ever served, not whether one attempt failed.
  const served = { script: false, frame: false };

  page.on('response', (response) => {
    if (!response.ok()) {
      return;
    }

    if (HEADWAY_SCRIPT.test(response.url())) {
      served.script = true;
    } else if (HEADWAY_FRAME.test(response.url()) && response.request().resourceType() === 'document') {
      served.frame = true;
    }
  });

  await page.setViewportSize(viewport);
  await page.goto(PAGE_PATH);

  const bell = page.locator('#headway-bell');

  try {
    await expect(bell).toBeVisible({ timeout: 20_000 });
  } catch (error) {
    test.skip(!served.script || !served.frame, `Headway is unreachable (script served: ${served.script}, frame served: ${served.frame}).`);
    throw new Error(`The bell stayed hidden although Headway answered (script: ${served.script}, frame: ${served.frame}).`, { cause: error });
  }
}

/**
 * Opens the bell from the keyboard and checks the panel, its title, and the focus move. Then it
 * leaves the panel with Shift+Tab from its first link: Headway's frame does not close on Escape,
 * so the focus guards around the panel are the keyboard way out. Focus must land on the bell,
 * and the guards, which sit at the end of <body>, must not scroll the page there.
 *
 * @param {Page} page The page.
 */
async function openAndLeaveFromKeyboard(page: Page) {
  const bell = page.getByRole('button', { name: /^Product updates/ });
  const panel = page.locator('#HW_frame_cont');

  await expect(bell).toHaveAttribute('aria-expanded', 'false');

  const scrollBefore = await page.evaluate(() => window.scrollY);

  await bell.focus();
  await page.keyboard.press('Enter');

  await expect(panel).toHaveClass(/HW_visible/);
  await expect(bell).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#HW_frame')).toHaveAttribute('title', 'Product updates');
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('HW_frame');

  // Into the panel's first link, then back out past its start.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');

  await expect(panel).not.toHaveClass(/HW_visible/);
  await expect(bell).toHaveAttribute('aria-expanded', 'false');
  await expect(bell).toBeFocused();
  await expect(page.locator('.headway-focus-guard')).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  expect(await page.evaluate(() => (window as unknown as { hwInitCalls: number }).hwInitCalls)).toBe(1);

  // The panel marked the entries seen: the badge turns into Headway's gray "nothing new" dot,
  // not the accent color of an unread count.
  const badge = page.locator('#HW_badge');

  await expect(badge).toHaveClass(/HW_softHidden/);
  await expect(badge).toHaveCSS('background-color', 'rgb(212, 212, 212)');
}

test.describe('Headway changelog bell', () => {
  test('desktop: the bell opens the changelog panel from the keyboard and Shift+Tab leaves it', async ({ page }) => {
    await openPage(page, { width: 1440, height: 900 });

    await expect(page.locator('.right-group #headway-bell')).toBeAttached();
    await openAndLeaveFromKeyboard(page);
  });

  test('mobile: the bell sits in the mobile header and opens the panel', async ({ page }) => {
    await openPage(page, { width: 375, height: 812 });

    await expect(page.locator('.mobile-controls #headway-bell')).toBeAttached();

    const box = await page.locator('#headway-bell').boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await openAndLeaveFromKeyboard(page);
  });

  test('Tab past the last entry closes the panel and returns to the bell', async ({ page }) => {
    await openPage(page, { width: 1440, height: 900 });

    const bell = page.getByRole('button', { name: /^Product updates/ });
    const panel = page.locator('#HW_frame_cont');

    await bell.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toHaveClass(/HW_visible/);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('HW_frame');

    // The number of entries changes with each release, so Tab until the panel closes.
    await expect.poll(async () => {
      await page.keyboard.press('Tab');

      return panel.getAttribute('class');
    }, { intervals: [100], timeout: 30_000 }).not.toMatch(/HW_visible/);

    await expect(bell).toBeFocused();
  });

  test('a mouse open also moves focus into the panel, and a click outside closes it', async ({ page }) => {
    await openPage(page, { width: 1440, height: 900 });

    const bell = page.getByRole('button', { name: /^Product updates/ });
    const panel = page.locator('#HW_frame_cont');

    await bell.click();
    await expect(panel).toHaveClass(/HW_visible/);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('HW_frame');
    // Focus moving into the panel must not close it.
    await expect(panel).toHaveClass(/HW_visible/);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');

    await page.locator('main h1, main h2').first().click();

    await expect(panel).not.toHaveClass(/HW_visible/);
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  test('the bell follows a resize across the breakpoint without a second init', async ({ page }) => {
    await openPage(page, { width: 1440, height: 900 });

    await page.setViewportSize({ width: 375, height: 812 });

    await expect(page.locator('.mobile-controls #headway-bell')).toBeVisible();
    await openAndLeaveFromKeyboard(page);
  });

  test('a click on the bell closes an open header menu', async ({ page }) => {
    await openPage(page, { width: 1440, height: 900 });

    // Headway stops the bell's click, so the menus listen for outside clicks in the capture phase.
    await page.locator('#support-trigger').click();
    await expect(page.locator('.support-menu')).toBeVisible();

    await page.getByRole('button', { name: /^Product updates/ }).click();

    await expect(page.locator('#HW_frame_cont')).toHaveClass(/HW_visible/);
    await expect(page.locator('.support-menu')).toBeHidden();
  });
});
