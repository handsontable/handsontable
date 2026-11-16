import { test, expect, type Page } from '@playwright/test';

/**
 * The first click on a docs page with no consent cookie reaches its control at once.
 *
 * Cookiebot's `uc.js` stops that click at the document and replays it about two seconds later as
 * an untrusted click (`src/lib/cookiebot-first-click.mjs` has the mechanism). The spec replaces
 * `uc.js` with a stub that does the same, so the result does not depend on Cookiebot's servers,
 * its banner settings, or the visitor's region. The stub copies what the live script was measured
 * doing: a capture-phase `document` listener that fires on the first click inside a link or a
 * button, sets `hasResponse`, stops the click, and dispatches a synthetic click on the same target
 * after two seconds.
 *
 * The page has no `CookieConsent` cookie, which is the point. The other specs set the cookie to
 * keep Cookiebot out of the way, so they never cover this path.
 */
const PAGE_PATH = '/docs/javascript-data-grid/';
const REPLAY_DELAY_MS = 2000;

const COOKIEBOT_STUB = `
(function () {
  var cookiebot = window.Cookiebot = window.CookieConsent = { hasResponse: false };

  function submitImpliedConsent(event) {
    if (cookiebot.hasResponse) {
      return;
    }

    var node = event.target;

    while (node && node.nodeType === 1 && node.tagName !== 'A' && node.tagName !== 'BUTTON') {
      node = node.parentNode;
    }

    if (!node || node.nodeType !== 1) {
      return;
    }

    var target = event.target;

    cookiebot.hasResponse = true;
    document.removeEventListener('click', submitImpliedConsent, true);
    setTimeout(function () {
      target.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
    }, ${REPLAY_DELAY_MS});
    event.stopPropagation();
    event.preventDefault();
  }

  document.addEventListener('click', submitImpliedConsent, true);
})();
`;

/**
 * Opens the docs page with the Cookiebot stub and no consent cookie.
 *
 * @param page The page.
 */
async function openWithCookiebotStub(page: Page) {
  if (process.env.PASS_COOKIE) {
    await page.context().addCookies([
      {
        name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
        value: process.env.PASS_COOKIE,
        domain: 'dev.handsontable.com',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  }

  await page.route(/consent\.cookiebot\.com\/uc\.js/, route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: COOKIEBOT_STUB,
  }));

  await page.goto(PAGE_PATH, { waitUntil: 'load' });

  // A missing flag means the route did not match and the real uc.js ran instead.
  await expect.poll(() => page.evaluate(() => (window as any).Cookiebot?.hasResponse)).toBe(false);
}

test.describe('Cookiebot implied consent', () => {
  test('a first mouse click opens the Support menu without waiting for Cookiebot', async ({ page }) => {
    await openWithCookiebotStub(page);

    const trigger = page.locator('#support-trigger');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: REPLAY_DELAY_MS / 2 });

    // Cookiebot's own replay would close the menu again.
    await page.waitForTimeout(REPLAY_DELAY_MS + 1000);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // The module did not keep Cookiebot from recording the consent.
    expect(await page.evaluate(() => (window as any).Cookiebot.hasResponse)).toBe(true);
  });

  test('a first click on the icon inside a control is replayed on the icon, once', async ({ page }) => {
    await openWithCookiebotStub(page);

    const trigger = page.locator('#support-trigger');

    await trigger.locator('svg').first().click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: REPLAY_DELAY_MS / 2 });

    await page.waitForTimeout(REPLAY_DELAY_MS + 1000);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('a first Enter press on a focused control activates it without waiting for Cookiebot', async ({ page }) => {
    await openWithCookiebotStub(page);

    const trigger = page.locator('#support-trigger');

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: REPLAY_DELAY_MS / 2 });

    await page.waitForTimeout(REPLAY_DELAY_MS + 1000);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
