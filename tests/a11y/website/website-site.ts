import { expect, type BrowserContext, type Locator, type Page, type Request, type Response } from '@playwright/test';
import { WEBSITE_VIEWPORTS, websiteUrl } from './pages.mjs';

/**
 * How a test opens a page of handsontable.com and reaches its state: the website scan (`website-axe.spec.ts`) and the
 * site checks beyond axe (`a11y/sites/`) both open pages here, so a check measures the DOM the scan reads. Policy:
 * `tests/AGENTS.md`, "A11y: the website scan".
 *
 * **Nothing a test does reaches anyone.** The site's forms post from the browser to HubSpot, and the support call books
 * through the site's own Worker: a test submission would be a real lead in the CRM, a test booking a real meeting.
 * `guardSite()` routes every request the browser context starts, and closes every WebSocket it opens. Another origin
 * than the site's is aborted (the consent
 * banner, analytics, HubSpot's scripts and its submit endpoint, the media bucket, the docs assistant, video), as the
 * website's own browser gates do (`scripts/browser-isolation.mjs` there), so a run depends on nobody's uptime and no
 * visit reaches the marketing data. On the site's origin only a read goes through: every other method is aborted,
 * except the two writes a state answers on the page itself, the HubSpot submit of `form-sent` and the booking of
 * `booker-booked`, which are fulfilled here and never sent. Each is recorded, so a test proves both that its own write
 * was caught and that none went out. A redirect's later hops are not routed (Playwright routes a request's first hop
 * only), so a read the site redirects to another origin reaches it; a write never gets that far, since it is
 * answered or aborted at its first hop. The configs block service workers, whose requests no route sees.
 *
 * What makes two runs agree is the website's own recipe (`tests/browser/support/test.ts` there): every `client:visible`
 * island is woken on load (`wakeVisibleIslands()`), and a page is measured once every island hydrated, no request has
 * been in flight for half a second, the fonts are ready, the finite animations ended, and the DOM held still
 * (`settleWebsite()`).
 */

/**
 * HubSpot's form submit endpoint, which the lead forms post to from the browser.
 */
export const SUBMISSIONS = /^https:\/\/api-eu1\.hsforms\.com\/submissions\/v3\//;
/**
 * The support call's booking, posted to the site's own Worker.
 */
export const BOOKING = /^\/api\/meetings\/[^/]+\/book\/?$/;
/**
 * The forms refuse a submit sooner than this after they appear (`src/lib/spam-guard.ts` in the website repository,
 * `MIN_FILL_MS`), and a test fills in milliseconds, so a test that submits moves the page's clock past it.
 */
export const MIN_FILL_MS = 3000;

export interface Guard {
  /**
   * The other origins a page asked for, all aborted.
   */
  blocked: Set<string>;
  /**
   * The writes answered on the page: a HubSpot submit or a booking, never sent.
   */
  answered: string[];
  /**
   * The writes refused: any other request to the site that is not a read, and every WebSocket, which can write.
   */
  refused: string[];
}

export const VISITOR = Object.freeze({ first: 'Ada', last: 'Lovelace', email: 'ada@example.com', company: 'Analytical Engines Ltd' });

/**
 * Cuts a browser context off from everything but the site, lets the site's reads through, and answers or refuses
 * every write (see the module comment). Registered on the context, so a popup or an iframe of the site is guarded too.
 *
 * @param context The browser context.
 * @param origin The site's origin.
 * @param answers Which writes the state answers on the page.
 * @param answers.submissions Whether a HubSpot submit is answered with a success (`form-sent`).
 * @param answers.booking Whether a booking is answered with a success (`booker-booked`).
 * @returns What the guard saw.
 */
export async function guardSite(context: BrowserContext, origin: string, { submissions = false, booking = false } = {}): Promise<Guard> {
  const guard: Guard = { blocked: new Set(), answered: [], refused: [] };

  await context.route('**/*', async(route) => {
    const request = route.request();
    const url = new URL(request.url());
    const read = ['GET', 'HEAD'].includes(request.method());

    if (submissions && request.method() === 'POST' && SUBMISSIONS.test(request.url())) {
      guard.answered.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ inlineMessage: 'Thanks' }) });

      return;
    }
    if (url.origin !== origin) {
      guard.blocked.add(url.host);
      if (!read) {
        guard.refused.push(`${request.method()} ${url.origin}${url.pathname}`);
      }
      await route.abort('blockedbyclient');

      return;
    }
    if (booking && request.method() === 'POST' && BOOKING.test(url.pathname)) {
      const body = bookingBody(request);

      guard.answered.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ start: body.startTime, end: body.startTime + body.duration, duration: body.duration, isOffline: false }) });

      return;
    }
    if (!read) {
      guard.refused.push(`${request.method()} ${url.pathname}`);
      await route.abort('blockedbyclient');

      return;
    }
    await route.continue();
  });
  // A WebSocket is no request a route sees, and it sends as well as reads: each one is closed before it connects.
  await context.routeWebSocket('**', (socket) => {
    const url = new URL(socket.url());

    if (url.origin !== origin.replace(/^http/, 'ws')) {
      guard.blocked.add(url.host);
    }
    guard.refused.push(`WebSocket ${url.origin}${url.pathname}`);
    socket.close();
  });

  return guard;
}

/**
 * The booking the page posted, as the Worker reads it.
 *
 * @param request The request.
 * @returns Its start and duration.
 */
function bookingBody(request: Request): { startTime: number; duration: number } {
  try {
    const body = request.postDataJSON();

    return { startTime: Number(body?.startTime) || Date.now() + 86_400_000, duration: Number(body?.duration) || 1_800_000 };
  } catch {
    return { startTime: Date.now() + 86_400_000, duration: 1_800_000 };
  }
}

/**
 * Wakes every `client:visible` island on load: an observer that reports each island's child with a box as
 * intersecting at once, so a measurement straight after the load sees hydrated islands rather than server HTML (the
 * website's own `wakeVisibleIslands()`). A child with no box at this width is never reported, as a real observer never
 * would.
 *
 * @param page The page.
 */
export async function wakeVisibleIslands(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const Native = window.IntersectionObserver;

    if (!Native) {
      return;
    }

    /**
     * An observer that reports a visible island's child at once.
     *
     * @param callback The callback.
     * @param options The options.
     * @returns The observer.
     */
    function Woken(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      const observer = new Native(callback, options);
      const watched = new Set<Element>();
      const observe = observer.observe.bind(observer);
      const unobserve = observer.unobserve.bind(observer);
      const disconnect = observer.disconnect.bind(observer);

      observer.observe = (target: Element) => {
        observe(target);
        if (!target.parentElement?.matches('astro-island[client="visible"]') || target.getClientRects().length === 0) {
          return;
        }
        watched.add(target);
        queueMicrotask(() => {
          if (!watched.has(target)) {
            return;
          }

          const box = target.getBoundingClientRect();

          callback([{ target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: box, intersectionRect: box,
            rootBounds: null, time: performance.now() }], observer);
        });
      };
      observer.unobserve = (target: Element) => {
        watched.delete(target);
        unobserve(target);
      };
      observer.disconnect = () => {
        watched.clear();
        disconnect();
      };

      return observer;
    }
    Woken.prototype = Native.prototype;
    window.IntersectionObserver = Woken as unknown as typeof IntersectionObserver;
  });
}

/**
 * Every request the page makes, so a wait can tell when none is in flight. One per page, made before its first
 * `goto()` (`openWebsitePage()` keeps it, `requestsOf()` hands it out): a watch made later misses a request already in
 * flight, and each one adds listeners that stay for the page's life.
 *
 * @param page The page.
 * @returns A wait for quiet.
 */
export function watchRequests(page: Page) {
  const inFlight = new Set<Request>();
  let changedAt = Date.now();
  const start = (request: Request) => {
    inFlight.add(request);
    changedAt = Date.now();
  };
  const end = (request: Request) => {
    inFlight.delete(request);
    changedAt = Date.now();
  };

  page.on('request', start);
  page.on('requestfinished', end);
  page.on('requestfailed', end);

  return {
    /**
     * Resolves once no request has been in flight for `quietMs`; past `deadline` it fails with what still loads.
     *
     * @param deadline The longest wait.
     * @param quietMs How long the network must stay quiet.
     */
    async quiet(deadline: number, quietMs = 500) {
      await expect.poll(() => {
        if (inFlight.size > 0) {
          return [...inFlight].map(request => request.url()).slice(0, 5);
        }

        const quietFor = Date.now() - changedAt;

        // Nothing in flight is not yet quiet: a request that just ended can be followed by the one it causes.
        return quietFor >= quietMs ? [] : [`quiet for ${quietFor} of ${quietMs} ms`];
      }, { message: 'requests still in flight', timeout: deadline, intervals: [100] }).toEqual([]);
    },
  };
}

/**
 * Waits until the page is the page a visitor gets: every island hydrated (but `client:media`, and a `client:visible`
 * one with no box), the network quiet, the fonts ready, every running finite animation ended (an endless one, the logo
 * marquee, is left running, and a paused one holds still already), and the DOM holding still for three polls 100 ms
 * apart. Each wait is bounded by `deadline`, and one that runs out names what it waited for. `animations: false`
 * skips the animation wait, for a watch that measures what moves from load (2.2.2): waited out, a finite animation
 * would be over before the watch starts.
 *
 * @param page The page.
 * @param requests The request watch.
 * @param deadline The longest each wait may take.
 * @param options The settle.
 * @param options.animations Whether to wait for the running finite animations to end.
 */
export async function settleWebsite(page: Page, requests: ReturnType<typeof watchRequests>, deadline = 60_000,
  { animations = true }: { animations?: boolean } = {}): Promise<void> {
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('astro-island[ssr]:not([client="media"])')]
    .filter(island => island.getAttribute('client') !== 'visible' || [...island.children].some(child => child.getClientRects().length))
    .map(island => `${island.getAttribute('component-export') ?? '?'} (client:${island.getAttribute('client')})`)),
  { message: 'islands that never hydrated', timeout: deadline }).toEqual([]);
  await requests.quiet(deadline);

  const unfinished = !animations ? [] : await page.evaluate(async(timeout) => {
    await document.fonts.ready;

    // A paused animation holds still (the story's progress bar pauses until the stories are in view), which is all a
    // measurement needs; without the reduced-motion preference it would never finish.
    const finite = document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity
      && animation.playState !== 'paused');

    await Promise.race([
      Promise.all(finite.map(animation => animation.finished.catch(() => undefined))),
      new Promise<void>((resolve) => {
        const begin = performance.now();
        const tick = () => (performance.now() - begin >= timeout ? resolve() : requestAnimationFrame(tick));

        requestAnimationFrame(tick);
      }),
    ]);

    return finite.filter(animation => animation.playState === 'running')
      .map(animation => `${animation instanceof CSSAnimation ? animation.animationName : 'an animation'} (${animation.playState})`);
  }, deadline);

  expect(unfinished, 'animations that did not finish').toEqual([]);
  await page.waitForFunction(() => {
    const state = window as unknown as { __siteNodes?: number; __siteStill?: number };
    const count = document.getElementsByTagName('*').length;

    state.__siteStill = count === state.__siteNodes ? (state.__siteStill ?? 0) + 1 : 0;
    state.__siteNodes = count;

    return state.__siteStill >= 3;
  }, undefined, { polling: 100, timeout: deadline });
}

// The pages already prepared, with how: `openWebsitePage()` prepares a page once, however often a check opens it.
const PREPARED = new WeakMap<Page, { setup: string; guard: Guard; requests: ReturnType<typeof watchRequests> }>();

/**
 * The request watch of a page `openWebsitePage()` opened, listening since before its first request: a wait after a
 * key press or a resize sees a request that was in flight before it began.
 *
 * @param page The page.
 * @returns The request watch.
 */
export function requestsOf(page: Page): ReturnType<typeof watchRequests> {
  const prepared = PREPARED.get(page);

  if (!prepared) {
    throw new Error('requestsOf(): the page was not opened by openWebsitePage(), so nothing watched its requests');
  }

  return prepared.requests;
}

/**
 * Opens a page of the site at a width and waits until it can be measured: the viewport, the guard and the islands'
 * wake-up are set before the first request; the page answers with the status the entry expects and is the site, not a
 * bot challenge; it settles; and a tab or radio the address selects is the one selected.
 *
 * @param page The page.
 * @param entry The page entry.
 * @param options The run.
 * @param options.viewport The width (`phone`, `desktop`).
 * @param options.baseUrl The site's base URL.
 * @param options.pageErrors Where the page's uncaught errors go.
 * @param options.deadline The longest each wait may take.
 * @param options.answers Which writes the guard answers on the page; by default the ones the entry's state makes.
 * @param options.clock Whether the page's clock is installed, so a test can move it past the spam guard's minimum; by
 *   default when the entry's state submits a form.
 * @param options.animations Whether the settle waits for the running finite animations to end (`settleWebsite()`).
 * @returns The URL, the response, the guard and the request watch.
 */
export async function openWebsitePage(page: Page, entry: { route: string; state: string; status?: number; selected?: readonly string[] }, {
  viewport, baseUrl, pageErrors, deadline = 60_000,
  answers = { submissions: entry.state === 'form-sent', booking: entry.state === 'booker-booked' },
  clock = entry.state === 'form-sent', animations = true,
}: { viewport: string; baseUrl: string; pageErrors: string[]; deadline?: number; answers?: { submissions?: boolean; booking?: boolean };
  clock?: boolean; animations?: boolean }) {
  const url = websiteUrl(entry, viewport, baseUrl);
  const setup = JSON.stringify({ origin: new URL(baseUrl).origin, answers, clock });

  await page.setViewportSize(WEBSITE_VIEWPORTS[viewport as keyof typeof WEBSITE_VIEWPORTS]);

  let prepared = PREPARED.get(page);

  // A page opened again (a check reopens it after a key press that acted, or after a walk that loaded another page)
  // keeps its init script, clock, guard, request watch and error listener: added again, they would stack, the islands'
  // observer would be wrapped twice, and each uncaught error would be recorded once per visit.
  if (!prepared) {
    await wakeVisibleIslands(page);
    if (clock) {
      await page.clock.install();
    }
    prepared = { setup, guard: await guardSite(page.context(), new URL(baseUrl).origin, answers), requests: watchRequests(page) };
    PREPARED.set(page, prepared);
    page.on('pageerror', error => pageErrors.push(String(error.stack ?? error)));
  }
  expect(prepared.setup, 'a page is opened again with the guard and clock it was first opened with').toBe(setup);

  const { guard, requests } = prepared;

  const response: Response | null = await page.goto(url, { waitUntil: 'load' });

  await expect(page, `${url} is the site, not a bot challenge`).not.toHaveTitle(/just a moment|attention required|access denied/i);
  expect(response?.status(), `${url} answers with ${entry.status ?? 200}`).toBe(entry.status ?? 200);
  await settleWebsite(page, requests, deadline, { animations });
  if (entry.selected) {
    const [role, name] = entry.selected as ['tab' | 'radio', string];

    await expect(page.getByRole(role, { name, ...(role === 'tab' ? { selected: true } : { checked: true }) }),
      `${url} selects its ${role} "${name}"`).toBeVisible();
  }

  return { url, response, guard, requests };
}

/**
 * The page's lead form (a HubSpot form, not the footer's newsletter).
 *
 * @param page The page.
 * @returns The form.
 */
export function leadForm(page: Page) {
  return page.locator('form').filter({ has: page.getByRole('textbox', { name: /^Company name/i }) });
}

/**
 * Waits until an element's island has hydrated.
 *
 * @param page The page.
 * @param selector The element.
 */
export async function hydrated(page: Page, selector: string): Promise<void> {
  await page.waitForFunction((sel) => {
    const element = document.querySelector(sel);
    const island = element?.closest('astro-island');

    return Boolean(element) && (!island || !island.hasAttribute('ssr'));
  }, selector, { polling: 100 });
}

/**
 * Fills the page's lead form as a visitor would (`fillForm()`).
 *
 * @param page The page.
 * @returns The form.
 */
export async function fillLeadForm(page: Page) {
  await hydrated(page, 'form input');

  return fillForm(page, leadForm(page));
}

/**
 * Fills a form as a visitor would, and moves the clock past the spam guard's minimum. The fields are production's,
 * from the live HubSpot schema, and differ per form and per tab, so the filler reads them: each text field gets a value
 * its label asks for, each checkbox not marked optional is ticked (the consent, a product of interest), each choice gets
 * its first option, and the spam trap ("Leave this field empty") stays empty. The page's clock must be installed.
 *
 * @param page The page.
 * @param form The form, or the part of the page that holds its fields.
 * @returns The form.
 */
export async function fillForm(page: Page, form: Locator) {
  const valueFor = (label: string) => {
    const rules: Array<[RegExp, string]> = [
      [/e-?mail/i, VISITOR.email], [/first/i, VISITOR.first], [/last|surname/i, VISITOR.last], [/company|organi[sz]ation/i, VISITOR.company],
      [/phone/i, '+48 600 000 000'], [/web ?site|url|domain/i, 'https://example.com'], [/country/i, 'Poland'],
    ];

    return rules.find(([pattern]) => pattern.test(label))?.[1] ?? 'An accessibility check of the form';
  };
  const describe = (element: Element) => {
    const field = element as HTMLInputElement;
    const label = [...(field.labels ?? [])].map(item => item.textContent ?? '').join(' ') || field.getAttribute('aria-label') || '';

    return { label: label.replace(/\s+/g, ' ').trim(), trap: /leave this field empty/i.test(`${label} ${field.closest('div')?.textContent ?? ''}`)
      || field.tabIndex < 0, optional: /optional/i.test(label), checked: Boolean(field.checked) };
  };

  for (const textbox of await form.getByRole('textbox').all()) {
    const field = await textbox.evaluate(describe);

    if (!field.trap && !field.optional && await textbox.isVisible()) {
      await textbox.fill(valueFor(field.label));
    }
  }
  for (const checkbox of await form.getByRole('checkbox').all()) {
    const field = await checkbox.evaluate(describe);

    if (!field.trap && !field.optional && !field.checked) {
      // The box is drawn over a visually hidden input; a click on the input itself is what a click on its label does.
      await checkbox.evaluate(element => (element as HTMLInputElement).click());
    }
  }
  for (const group of await form.getByRole('radiogroup').all()) {
    if (await group.getByRole('radio', { checked: true }).count() === 0) {
      await group.getByRole('radio').first().evaluate(element => (element as HTMLInputElement).click());
    }
  }
  for (const select of await form.locator('select').all()) {
    if (!(await select.inputValue())) {
      await select.selectOption({ index: 1 });
    }
  }
  for (const combobox of await form.locator('[role="combobox"]:not(select):not(input)').all()) {
    await combobox.click();
    await page.getByRole('option').first().click();
  }
  await page.clock.fastForward(MIN_FILL_MS);

  return form;
}

/**
 * Picks the support call's first open time, which shows the details form. Nothing is booked.
 *
 * @param page The page.
 */
export async function pickTime(page: Page): Promise<void> {
  await hydrated(page, '[role="group"][aria-label="Time"]');
  await page.getByRole('group', { name: 'Time' }).getByRole('button').first().click();
}

/**
 * Picks the support call's first open time and fills the details.
 *
 * @param page The page.
 */
export async function pickTimeAndFill(page: Page): Promise<void> {
  await pickTime(page);
  await page.getByLabel('First name').fill(VISITOR.first);
  await page.getByLabel('Last name').fill(VISITOR.last);
  await page.getByLabel('Work email').fill(VISITOR.email);
}

export type WebsiteState = 'none' | 'form-errors' | 'form-sent' | 'booker-details' | 'booker-booked' | 'mobile-menu' | 'mega-menu' | 'ask-ai';

/**
 * What a test does before it measures, from the keyboard where a key reaches the state. A state that submits answers the
 * write on the page (`guardSite()`): nothing leaves the runner.
 */
export const WEBSITE_STATES: Record<WebsiteState, (page: Page) => Promise<void>> = {
  none: async() => {},
  'form-errors': async(page) => {
    await hydrated(page, 'form input');

    const form = leadForm(page);

    await form.getByRole('button', { name: /^(Submit|Get your license key)$/ }).click();
    await expect(form.locator('[aria-invalid="true"]').first()).toBeVisible();
  },
  'form-sent': async(page) => {
    const form = await fillLeadForm(page);

    await form.getByRole('button', { name: /^(Submit|Get your license key)$/ }).click();
    await expect(page.getByText(/^(Thank you — our team will get back to you shortly\.|Thanks for filling out the form\.)$/)).toBeVisible();
  },
  'booker-details': async(page) => {
    await pickTimeAndFill(page);
  },
  'booker-booked': async(page) => {
    await pickTimeAndFill(page);
    await page.getByRole('button', { name: 'Book the call' }).click();
    await expect(page.getByRole('heading', { name: 'You’re booked.' })).toBeVisible();
  },
  'mobile-menu': async(page) => {
    await hydrated(page, 'button[aria-label="Open menu"]');
    await page.getByRole('button', { name: 'Open menu' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Main menu' })).toBeVisible();
  },
  'mega-menu': async(page) => {
    const trigger = page.locator('header button[data-trigger]').first();

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
  'ask-ai': async(page) => {
    await page.getByRole('button', { name: 'Ask AI' }).first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Ask AI' })).toBeVisible();
  },
};
