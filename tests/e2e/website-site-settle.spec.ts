import { expect, test, type Page } from '@playwright/test';
import { siteDefinition } from '../a11y/sites/sites';
import { openWebsitePage } from '../a11y/website/website-site';
import { afterAtLeast } from '../fixtures/frames';

/**
 * The proof that a website page is measured settled and that the guard cuts it off (`a11y/website/website-site.ts`,
 * `tests/AGENTS.md`, "A11y: the website scan"): the network wait holds its quiet window, a site check's settle sees a
 * request already in flight when it began, and a WebSocket is closed and recorded. The site is a stand-in served by
 * routes on an origin that resolves nowhere, so nothing leaves the runner.
 */

const ORIGIN = 'https://site.test';
const PAGE = '<!doctype html><html lang="en"><head><title>Stand-in site</title></head><body><main><h1>Home</h1></main></body></html>';

/**
 * Serves the stand-in site: the home page, `/fast` answered at once, and `/slow` answered once `held` resolves.
 *
 * @param page The page.
 * @param held What `/slow` waits for.
 */
async function serveSite(page: Page, held: Promise<void> = Promise.resolve()) {
  await page.route(`${ORIGIN}/**`, async(route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname === '/slow') {
      await held;
    }
    await route.fulfill(pathname === '/' ? { contentType: 'text/html', body: PAGE } : { contentType: 'text/plain', body: 'late' });
  });
}

const open = (page: Page) => openWebsitePage(page, { route: '/', state: 'none' },
  { viewport: 'desktop', baseUrl: ORIGIN, pageErrors: [], deadline: 10_000 });

test('the network wait holds its quiet window after the last request ends', async({ page }) => {
  await serveSite(page);

  const { requests } = await open(page);
  // When the request ended, as the watch hears it: its listener runs first, in the same dispatch.
  const ended = page.waitForEvent('requestfinished', request => request.url().endsWith('/fast')).then(() => Date.now());

  await page.evaluate(() => fetch('/fast').then(response => response.text()));

  const endedAt = await ended;

  await requests.quiet(5_000);

  // Nothing in flight is not yet quiet: the wait ends 500 ms after the request did, a few ms of clock aside.
  expect(Date.now() - endedAt).toBeGreaterThanOrEqual(480);
});

test('a site check\'s settle waits for a request that was in flight before it began', async({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });

  await serveSite(page, held);
  await open(page);

  // A key press or a resize starts a request that adds content when it answers, and it is in flight before the
  // settle begins: a watch made by the settle would never hear of it.
  const started = page.waitForRequest(`${ORIGIN}/slow`);

  await page.evaluate(() => {
    void fetch('/slow').then(response => response.text()).then((text) => {
      const late = document.createElement('p');

      late.id = 'late';
      late.textContent = text;
      document.querySelector('main')?.append(late);
    });
  });
  await started;

  let settled = false;
  const settling = siteDefinition('website').settle(page).then(() => {
    settled = true;
  });

  // Bounded settle: well past what a settle that never heard of the request takes (the 500 ms quiet window, then
  // three still polls 100 ms apart). The release below is its positive control.
  await afterAtLeast(page, 2_000);
  expect(settled, 'the settle still waits while the request is in flight').toBe(false);

  release();
  await settling;
  // Counted, not awaited: the settle itself must have waited for it.
  expect(await page.locator('#late').count(), 'the content the request added is there when the settle returns').toBe(1);
});

test('the guard closes a WebSocket before it connects and records it', async({ page }) => {
  await serveSite(page);

  const { guard } = await open(page);
  const state = await page.evaluate(() => new Promise<string>((resolve) => {
    const socket = new WebSocket('wss://elsewhere.test/socket');

    socket.addEventListener('open', () => resolve('open'));
    socket.addEventListener('close', () => resolve('closed'));
  }));

  expect(state).toBe('closed');
  expect(guard.refused).toContain('WebSocket wss://elsewhere.test/socket');
  expect([...guard.blocked]).toContain('elsewhere.test');
});
