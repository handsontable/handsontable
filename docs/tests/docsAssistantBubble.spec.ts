import { test, expect, type Page } from '@playwright/test';

/**
 * Docs assistant proactive bubble (SU-598, stage I).
 *
 * The bubble appears when a reader reaches the bottom of a long page (2 viewports or
 * more, within 64px of the end) and stays idle for 3 seconds. It can show again on
 * later page loads, never opens the chat on its own, and never comes back once the
 * reader closes it.
 *
 * Time runs on Playwright's clock (`page.clock`), so the 3-second rule is pinned to the
 * millisecond and no test waits for real time to pass.
 */

const LONG_PAGE = '/javascript-data-grid/performance/';
const IDLE_MS = 3000;
const BOTTOM_TOLERANCE_PX = 64;
const DISMISSED_KEY = 'hot-docs-chat-bubble-dismissed';

// Mirror the cookie setup used by the other docs E2E tests.
test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || 'http://localhost');

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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install();
});

/**
 * Stops the page clock. `clock.install()` fakes the timers, but its time still flows in
 * real time; paused, it moves only through `runFor()`, so a countdown is exact.
 */
async function freezeClock(page: Page): Promise<void> {
  // A paused clock also stops CSS animations and transitions, so the card would stay
  // off-screen at the start of its slide-in. Zero durations end them in their final
  // state at once and keep their names for the reduced-motion check.
  await page.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }',
  });

  const now = await page.evaluate(() => Date.now());

  await page.clock.pauseAt(now + 1000);
}

/**
 * Reloads the page, waits for the widget, and freezes the clock again.
 */
async function reloadPage(page: Page): Promise<void> {
  await page.reload();
  await page.waitForLoadState('load');
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  await freezeClock(page);
}

/**
 * Loads the long page with the chat closed and waits until the widget is mounted.
 */
async function openLongPage(page: Page, baseURL: string | undefined, { checkLong = true } = {}): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hot-docs-chat-open', 'false');
    } catch {
      // localStorage may be unavailable; the widget defaults to closed.
    }
  });
  await page.goto(`${baseURL}${LONG_PAGE}`);
  await page.waitForLoadState('load');
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  // The dev toolbar is tabbable and sits after the widget; production builds have none.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  await freezeClock(page);

  if (checkLong) {
    const isLong = await page.evaluate(
      () => document.documentElement.scrollHeight >= window.innerHeight * 2
    );

    expect(isLong, `${LONG_PAGE} must be at least two viewports tall`).toBe(true);
  }
}

/**
 * Scrolls to `offsetFromBottom` px above the end of the page and resolves once the
 * scroll event has run, so the bubble's countdown has started from this moment.
 */
async function scrollToBottom(page: Page, offsetFromBottom = 0): Promise<void> {
  await page.evaluate((offset) => new Promise<void>((resolve) => {
    const target = document.documentElement.scrollHeight - window.innerHeight - offset;

    if (Math.round(window.scrollY) === Math.round(target)) {
      // No scroll event comes for a no-op scroll; count it as activity anyway.
      window.dispatchEvent(new Event('scroll'));
      resolve();

      return;
    }

    window.addEventListener('scroll', () => resolve(), { once: true });
    // Instant: the site scrolls smoothly, and the trail of scroll events a smooth
    // scroll leaves would restart the countdown at unpredictable moments.
    window.scrollTo({ top: target, behavior: 'instant' });
  }), offsetFromBottom);
}

/**
 * Shows the bubble: the reader reaches the bottom and stays idle for the full countdown.
 */
async function showBubble(page: Page): Promise<void> {
  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS);
  await expect(page.locator('.da-proactive')).toBeVisible();
}

test('shows the bubble after exactly 3 seconds idle at the bottom, without opening the chat', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);

  const bubble = page.locator('.da-proactive');

  // Not at the bottom: nothing appears, however long the reader waits.
  await page.clock.runFor(IDLE_MS * 3);
  await expect(bubble).toHaveCount(0);

  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS - 1);
  await expect(bubble).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText('Ask AI');

  // The bubble is a suggestion only: the chat stays closed.
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
});

test('restarts the countdown on activity', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  const bubble = page.locator('.da-proactive');

  await page.clock.runFor(IDLE_MS - 1000);
  await page.keyboard.press('Shift');
  await page.clock.runFor(IDLE_MS - 1);
  await expect(bubble).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(bubble).toBeVisible();
});

test('does not show on a page shorter than two viewports', async ({ page, baseURL }) => {
  // The same page in a viewport tall enough to make it "short".
  await page.setViewportSize({ width: 1440, height: 4000 });
  await openLongPage(page, baseURL, { checkLong: false });

  const isShort = await page.evaluate(
    () => document.documentElement.scrollHeight < window.innerHeight * 2
  );

  expect(isShort, 'the page must be shorter than two viewports here').toBe(true);

  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS * 3);
  await expect(page.locator('.da-proactive')).toHaveCount(0);
});

test(`counts the last ${BOTTOM_TOLERANCE_PX}px of the page as the bottom`, async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);

  const bubble = page.locator('.da-proactive');

  await scrollToBottom(page, BOTTOM_TOLERANCE_PX + 6);
  await page.clock.runFor(IDLE_MS * 2);
  await expect(bubble).toHaveCount(0);

  await scrollToBottom(page, BOTTOM_TOLERANCE_PX - 6);
  await page.clock.runFor(IDLE_MS);
  await expect(bubble).toBeVisible();
});

test('does not come back after the reader dismisses it, in this tab or a new one', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);
  await page.getByRole('button', { name: 'Dismiss suggestion' }).click();

  const bubble = page.locator('.da-proactive');

  await expect(bubble).toHaveCount(0);

  // Same page, idle at the bottom again.
  await page.mouse.move(10, 10);
  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS * 2);
  await expect(bubble).toHaveCount(0);

  // New page load.
  await reloadPage(page);
  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS * 2);
  await expect(bubble).toHaveCount(0);

  // A new tab starts a new session, and the dismissal still holds.
  const newTab = await page.context().newPage();

  await newTab.setViewportSize({ width: 1440, height: 900 });
  await newTab.clock.install();
  await openLongPage(newTab, baseURL);
  await scrollToBottom(newTab);
  await newTab.clock.runFor(IDLE_MS * 2);
  await expect(newTab.locator('.da-proactive')).toHaveCount(0);
});

test('stays dismissed when localStorage throws', async ({ page, baseURL }) => {
  // Blocked site data: every read and write of the dismissal key throws.
  await page.addInitScript((key) => {
    const { getItem, setItem } = Storage.prototype;

    Storage.prototype.getItem = function(name: string) {
      if (name === key) throw new DOMException('Blocked', 'SecurityError');

      return getItem.call(this, name);
    };
    Storage.prototype.setItem = function(name: string, value: string) {
      if (name === key) throw new DOMException('Blocked', 'SecurityError');

      return setItem.call(this, name, value);
    };
  }, DISMISSED_KEY);
  await openLongPage(page, baseURL);
  await showBubble(page);
  await page.getByRole('button', { name: 'Dismiss suggestion' }).click();

  const bubble = page.locator('.da-proactive');

  await expect(bubble).toHaveCount(0);

  // The reader is still at the bottom; the countdown must not bring it back.
  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS * 3);
  await expect(bubble).toHaveCount(0);
});

test('shows again on the next page load when the reader did not close it', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);

  const bubble = page.locator('.da-proactive');

  await reloadPage(page);
  await expect(bubble).toHaveCount(0);
  await showBubble(page);
});

test('comes back after the chat it opened is closed', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);

  const bubble = page.locator('.da-proactive');

  await page.locator('.da-proactive-ask').click();
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');
  await expect(bubble).toHaveCount(0);
  // The open panel raises the widget above the header through a `:has()` rule, which the
  // docs build turns into a class a timer-driven script sets; let that script run.
  await page.clock.runFor(500);

  // Opening the chat only hides the bubble; it is not a dismissal.
  await page.getByRole('button', { name: 'Close assistant' }).click();
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS);
  await expect(bubble).toBeVisible();
});

test('"Ask AI" in the bubble opens the chat with a draft about the page', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);
  await page.locator('.da-proactive-ask').click();

  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.da-proactive')).toHaveCount(0);
  await expect(page.locator('.da-panel textarea')).toHaveValue(/I have a question about the ".+" page\./);
});

test('"Ask AI" keeps an existing conversation', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hot-docs-chat-thread', JSON.stringify([
        { id: 'q1', role: 'user', content: 'How do I freeze columns?', ts: 1 },
        { id: 'a1', role: 'assistant', content: 'Use the fixedColumnsStart option.', ts: 2 },
      ]));
    } catch {
      // The test cannot set up a thread without localStorage.
    }
  });
  await openLongPage(page, baseURL);
  await showBubble(page);
  await page.locator('.da-proactive-ask').click();

  const panel = page.locator('.da-panel');

  await expect(panel).toHaveAttribute('data-open', 'true');
  await expect(panel).toContainText('How do I freeze columns?');
  await expect(panel).toContainText('Use the fixedColumnsStart option.');
  await expect(panel.locator('textarea')).toHaveValue(/I have a question about the ".+" page\./);
});

test('waits for a hidden tab to come back before it shows', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);

  const setHidden = (hidden: boolean) => page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  const bubble = page.locator('.da-proactive');

  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS - 1000);
  await setHidden(true);
  await page.clock.runFor(IDLE_MS * 2);
  await expect(bubble).toHaveCount(0);

  // Coming back counts as activity: a fresh countdown, with no other event needed.
  await setHidden(false);
  await page.clock.runFor(IDLE_MS - 1);
  await expect(bubble).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(bubble).toBeVisible();
});

test('does not show when the page grew away from the reader during the countdown', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  const bubble = page.locator('.da-proactive');

  // A lazy block mounts below the reader; no scroll or input event fires.
  await page.evaluate(() => {
    const spacer = document.createElement('div');

    spacer.style.height = '3000px';
    document.querySelector('main')?.appendChild(spacer);
  });
  await page.clock.runFor(IDLE_MS * 2);
  await expect(bubble).toHaveCount(0);

  // Reaching the new bottom starts it again.
  await showBubble(page);
});

test('is hidden in print and only fades in under reduced motion', async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLongPage(page, baseURL);
  await showBubble(page);

  const motion = await page.evaluate(() => ({
    card: getComputedStyle(document.querySelector('.da-proactive')!).animationName,
    illustration: getComputedStyle(document.querySelector('.da-proactive-illustration')!).animationName,
  }));

  expect(motion).toEqual({ card: 'da-proactive-fade-in', illustration: 'none' });

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.da-proactive')).toBeHidden();
});

test('paints above positioned page content', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  // Positioned page content with a positive z-index, as an example grid's root has.
  // It stays under the card because the page content sits in .main-pane, which
  // isolates its own stacking context, while the widget's root comes after it.
  await page.evaluate(() => {
    const layer = document.createElement('div');

    layer.style.cssText = 'position: fixed; inset: 0; z-index: 1;';
    document.querySelector('main')?.appendChild(layer);
  });
  await showBubble(page);

  const onTop = await page.evaluate(() => {
    const card = document.querySelector('.da-proactive')!;
    const box = card.getBoundingClientRect();

    return card.contains(document.elementFromPoint(box.left + 24, box.top + 24));
  });

  expect(onTop, 'the card is the topmost element at its own position').toBe(true);
});

test('never takes the focus and is not announced', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);

  const state = await page.evaluate(() => {
    const card = document.querySelector('.da-proactive')!;
    const liveSelector = '[aria-live], [role="status"], [role="alert"], [role="log"]';

    return {
      focusInside: card.contains(document.activeElement),
      live: card.closest(liveSelector) !== null || card.querySelector(liveSelector) !== null,
    };
  });

  expect(state).toEqual({ focusInside: false, live: false });
});

test('can be reached, named, and dismissed with the keyboard only', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);

  const bubble = page.getByRole('region', { name: 'Docs assistant suggestion' });
  const askButton = bubble.getByRole('button', { name: /^Ask AI Questions about ".+"\?$/ });
  const dismissButton = bubble.getByRole('button', { name: 'Dismiss suggestion' });

  // The card is the last thing in the document, so Shift+Tab from its end lands on Dismiss.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Shift+Tab');
  await expect(dismissButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(askButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dismissButton).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(bubble).toHaveCount(0);
});

test('steps aside while the keyboard focus is on something it covers', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await showBubble(page);

  const bubble = page.locator('.da-proactive');

  // A focusable element under the card (at 1440px, links in the page sidebar).
  const covered = await page.evaluate(() => {
    const card = document.querySelector('.da-proactive') as HTMLElement;
    const box = card.getBoundingClientRect();

    for (const el of document.querySelectorAll<HTMLElement>('a[href], button')) {
      const r = el.getBoundingClientRect();

      if (!card.contains(el) && r.width > 0 && r.left < box.right && box.left < r.right
        && r.top < box.bottom && box.top < r.bottom) {
        el.setAttribute('data-test-covered', '');

        return true;
      }
    }

    return false;
  });

  expect(covered, 'the card must cover a focusable element at 1440x900').toBe(true);

  await page.locator('[data-test-covered]').focus();
  await expect(bubble).toHaveCount(0);

  // Not while that element keeps the focus.
  await page.clock.runFor(IDLE_MS * 3);
  await expect(bubble).toHaveCount(0);

  // Once the focus moves on, the countdown runs again.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await scrollToBottom(page);
  await page.clock.runFor(IDLE_MS);
  await expect(bubble).toBeVisible();
});
