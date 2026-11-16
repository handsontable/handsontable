import { test, expect, type Page } from '@playwright/test';

/**
 * The Headway changelog bell in the docs header, against the real Headway widget (account
 * `xaD6ry`). The panel is a cross-origin iframe, so the spec asserts on the parts the docs
 * own: the bell's name and state, the panel's visibility class, its title, focus, and scroll.
 *
 * The spec needs the network: the page loads widget.js from cdn.headwayapp.co and the panel from
 * headway-widget.net. The `functional` job in `.github/workflows/docs.yml` runs it on a hosted
 * runner against the PR preview, where both hosts answer. When Headway is unreachable the tests
 * skip, and the job summary's "N skipped" count shows it. A bell that stays hidden while Headway
 * answered fails instead of skipping.
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
 * listener, a CSP change, a second init, an init that never ran) is a failure: the skip needs
 * Headway's own requests to have failed.
 *
 * @param {Page} page The page.
 * @param {{ width: number, height: number }} viewport The viewport.
 */
async function openPage(page: Page, viewport: { width: number, height: number }) {
  // A request can fail and be retried (the frame's first load is sometimes aborted), so this
  // records whether each one was ever served, not whether one attempt failed.
  const served = { script: false, frame: false };
  const frame = { requested: false, failed: false };

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
  page.on('request', (request) => {
    if (HEADWAY_FRAME.test(request.url()) && request.resourceType() === 'document') {
      frame.requested = true;
    }
  });
  page.on('requestfailed', (request) => {
    if (HEADWAY_FRAME.test(request.url()) && request.resourceType() === 'document') {
      frame.failed = true;
    }
  });

  await page.setViewportSize(viewport);
  await page.goto(PAGE_PATH);

  const bell = page.locator('#headway-bell');

  try {
    await expect(bell).toBeVisible({ timeout: 20_000 });
  } catch (error) {
    // Skip only when Headway itself failed: the script did not arrive, or the panel's page was
    // requested and never served. A script that arrived without a frame request means
    // `Headway.init()` never ran, which is a failure.
    test.skip(!served.script || (frame.requested && !served.frame), `Headway is unreachable (script served: ${served.script}, frame requested: ${frame.requested}, served: ${served.frame}, failed: ${frame.failed}).`);
    throw new Error(`The bell stayed hidden although Headway answered (script served: ${served.script}, frame requested: ${frame.requested}, served: ${served.frame}).`, { cause: error });
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

  // The panel marked the entries seen, so the badge no longer shows the accent color of an
  // unread count. Whether it then turns gray (soft hide) or disappears is a Headway dashboard
  // setting, so the spec accepts both.
  const accent = await page.evaluate(() => {
    const probe = document.createElement('span');

    probe.style.color = 'var(--sl-color-accent)';
    document.body.appendChild(probe);

    const color = getComputedStyle(probe).color;

    probe.remove();

    return color;
  });
  const badge = page.locator('#HW_badge');

  await expect(badge).not.toHaveCSS('background-color', accent);
}

test.describe('Headway changelog bell', () => {
  test('desktop: the bell opens the changelog panel from the keyboard and Shift+Tab leaves it', async ({ page }) => {
    await openPage(page, { width: 1440, height: 900 });

    await expect(page.locator('.right-group #headway-bell')).toBeAttached();
    await openAndLeaveFromKeyboard(page);
  });

  test('mobile: the bell sits in the mobile header and opens the panel', async ({ page }) => {
    await openPage(page, { width: 390, height: 844 });

    await expect(page.locator('.mobile-controls #headway-bell')).toBeAttached();

    const box = await page.locator('#headway-bell').boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await openAndLeaveFromKeyboard(page);
  });

  test('mobile at 360px: the bell fits beside the logo, search, and the other controls', async ({ page }) => {
    await openPage(page, { width: 360, height: 800 });

    const box = await page.locator('#headway-bell').boundingBox();
    const title = await page.locator('.header-row-1 .title-wrapper').boundingBox();
    const controls = await page.locator('.mobile-controls').boundingBox();

    // 24px is WCAG 2.2's target size minimum (2.5.8).
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
    // The controls must not run into the logo, and the row must not scroll sideways.
    expect(controls!.x).toBeGreaterThanOrEqual(title!.x + title!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await openAndLeaveFromKeyboard(page);
  });

  test('a panel that never loads does not hold up the header navigation', async ({ page }) => {
    // An iframe added before the window's `load` holds that event back, and the mobile navigation
    // starts on it. The panel's page never answers here, so the hamburger must still work.
    await page.route(HEADWAY_FRAME, () => { /* never answers */ });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded' });

    const menu = page.locator('.mobile-menu-btn');

    await expect(menu).toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true', { timeout: 10_000 });
  });

  test('the bell appearing does not move the other header controls', async ({ page }) => {
    // Hold the panel's page back, so the bell stays hidden long enough to measure the header
    // without it.
    await page.route(HEADWAY_FRAME, async (route) => {
      await new Promise((resolve) => { setTimeout(resolve, 2_000); });
      await route.continue();
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PAGE_PATH);

    const ask = page.locator('#header-assistant-btn');
    const bell = page.locator('#headway-bell');

    await expect(ask).toBeVisible();
    await expect(bell).toBeHidden();

    const before = await ask.boundingBox();

    // A late bell must leave Ask AI where it was: no layout shift.
    try {
      await expect(bell).toBeVisible({ timeout: 20_000 });
    } catch (error) {
      test.skip(true, 'Headway is unreachable.');
      throw error;
    }

    expect(await ask.boundingBox()).toEqual(before);
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

  for (const [menu, trigger, popup] of [
    ['Support', '#support-trigger', '.support-menu'],
    ['Versions', '#versions-trigger', '.versions-menu'],
  ]) {
    test(`a click on the bell closes an open ${menu} menu`, async ({ page }) => {
      await openPage(page, { width: 1440, height: 900 });

      // Headway stops the bell's click, so the menus listen for outside clicks in the capture phase.
      await page.locator(trigger).click();
      await expect(page.locator(popup)).toBeVisible();

      await page.getByRole('button', { name: /^Product updates/ }).click();

      await expect(page.locator('#HW_frame_cont')).toHaveClass(/HW_visible/);
      await expect(page.locator(popup)).toBeHidden();
    });
  }
});
