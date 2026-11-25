import { test, expect, type Page } from '@playwright/test';

/**
 * Keyboard behavior of the docs assistant panel and the docs search (WCAG 2.4.3 Focus Order and
 * 2.1.4 Character Key Shortcuts).
 *
 * - The closed assistant panel holds no Tab stop: it is off screen, so a stop inside it is one
 *   nobody can see.
 * - Closing the assistant or the search gives the focus back to the control that opened it.
 * - The `/` key alone opens nothing: Ctrl+K (Cmd+K on macOS) is the search shortcut, and `/` types
 *   a slash in every field.
 *
 * The search renders in production builds only (`BUILD_MODE=production`, `Header.astro`), so the
 * search tests run against such a build and are skipped on one without the search button.
 */

const PAGE = '/javascript-data-grid/';
const SEARCH_BUTTON = 'sl-doc-search .DocSearch-Button';
const SEARCH_MODAL = '.DocSearch-Modal';

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
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hot-docs-chat-open', 'false');
    } catch {
      /* The widget starts closed without storage as well. */
    }
  });
});

/**
 * Opens the page at a viewport width with the assistant closed, and waits until the header
 * buttons are bound and the assistant is mounted.
 *
 * @param page The page.
 * @param baseURL The docs base URL.
 * @param width The viewport width.
 */
async function openPage(page: Page, baseURL: string | undefined, width = 1440): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseURL}${PAGE}`);
  await page.waitForLoadState('load');
  await expect(page.locator('body > #mobile-nav-overlay')).toBeAttached();
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
}

/**
 * Skips a search test on a build that renders no search.
 *
 * @param page The page.
 */
async function requireSearch(page: Page): Promise<void> {
  const hasSearch = await page.locator(SEARCH_BUTTON).count() > 0;

  test.skip(!hasSearch, 'The search renders in production builds only (BUILD_MODE=production)');
}

/**
 * Waits until DocSearch has replaced the static button with its own, so its key handler listens.
 *
 * @param page The page.
 */
async function waitForSearchReady(page: Page): Promise<void> {
  await expect(page.locator(`${SEARCH_BUTTON} .DocSearch-Button-Keys .DocSearch-Button-Key`).first()).toBeAttached();
}

/**
 * Lists the nodes of the browser's accessibility tree, not ignored, whose name is one of the given names.
 *
 * @param page The page.
 * @param names The accessible names.
 * @returns The role and the name of each node found.
 */
async function exposedNodes(page: Page, names: string[]): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');

  await session.detach();

  return nodes
    .filter(node => !node.ignored && names.includes(String(node.name?.value ?? '')))
    .map(node => `${node.role?.value} "${node.name?.value}"`);
}

/**
 * Removes the focus from every element, so a key press goes to the page body.
 *
 * @param page The page.
 */
async function blur(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(page.locator('body')).toBeFocused();
}

test('Tab and Shift+Tab pass the closed assistant panel without stopping inside it', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  await page.evaluate(() => {
    const root = document.getElementById('docs-assistant-root')!;

    for (const [id, where] of [['before-panel', 'beforebegin'], ['after-panel', 'afterend']] as const) {
      const button = document.createElement('button');

      button.type = 'button';
      button.id = id;
      button.textContent = id;
      root.insertAdjacentElement(where, button);
    }
  });

  const panel = page.locator('.da-panel');

  await expect(panel.locator('button, textarea').first()).toBeAttached();

  await page.locator('#before-panel').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-panel')).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#before-panel')).toBeFocused();

  expect(await exposedNodes(page, ['Docs assistant', 'Close assistant'])).toEqual([]);
});

test('opening the assistant from the header and closing it with Escape returns the focus to the header button', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  const askAi = page.locator('#header-assistant-btn');
  const composer = page.locator('.da-panel textarea');

  await askAi.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');
  await expect(composer).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(askAi).toBeFocused();
});

test('closing the assistant with its close button returns the focus to the header button', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  const askAi = page.locator('#header-assistant-btn');

  await askAi.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel textarea')).toBeFocused();

  await page.getByRole('button', { name: 'Close assistant' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(askAi).toBeFocused();
});

test('pressing the header button again closes the assistant and keeps the focus on that button', async ({ page, baseURL }) => {
  await page.clock.install();
  await openPage(page, baseURL);

  const askAi = page.locator('#header-assistant-btn');

  await askAi.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel textarea')).toBeFocused();

  await page.clock.fastForward(1000);
  await askAi.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(askAi).toBeFocused();
});

test('closing the assistant opened from the table of contents returns the focus to that button', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  const tocButton = page.locator('#toc-assistant-btn');

  await expect(tocButton).toBeVisible();
  await tocButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel textarea')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(tocButton).toBeFocused();
});

test('closing the assistant opened by a mouse click that left the focus on the body returns the focus to the table of contents button', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  const tocButton = page.locator('#toc-assistant-btn');

  await expect(tocButton).toBeVisible();
  await blur(page);
  await page.evaluate(() => {
    document.getElementById('toc-assistant-btn')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await expect(page.locator('.da-panel textarea')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(tocButton).toBeFocused();
});

test('closing the assistant opened by a mouse click on an "Ask AI about this API" button returns the focus to that button', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  await page.route('**/*', async(route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
    } else {
      await route.fallback();
    }
  });
  await page.evaluate(() => {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'ask-about-api-btn';
    button.dataset.option = 'colHeaders';
    button.textContent = 'Ask AI';
    document.querySelector('main')!.prepend(button);
  });

  const askAboutApi = page.locator('main .ask-about-api-btn').first();

  await blur(page);
  await askAboutApi.evaluate(button => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');

  await page.keyboard.press('Escape');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(askAboutApi).toBeFocused();
});

test('closing the assistant whose opener is gone moves the focus to the header button', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  await page.evaluate(() => {
    const opener = document.createElement('button');

    opener.type = 'button';
    opener.id = 'temporary-opener';
    opener.textContent = 'Ask';
    opener.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('docs-assistant:ask', { detail: { question: 'What is a cell?' } }));
    });
    document.querySelector('main')!.prepend(opener);
  });
  await page.route('**/*', async(route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
    } else {
      await route.fallback();
    }
  });

  await page.locator('#temporary-opener').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');
  await page.evaluate(() => document.getElementById('temporary-opener')!.remove());

  await page.getByRole('button', { name: 'Close assistant' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await expect(page.locator('#header-assistant-btn')).toBeFocused();
});

test('a slash typed in the assistant composer appears as text', async ({ page, baseURL }) => {
  await openPage(page, baseURL);

  await page.locator('#header-assistant-btn').focus();
  await page.keyboard.press('Enter');

  const composer = page.locator('.da-panel textarea');

  await expect(composer).toBeFocused();
  await page.keyboard.type('a/b');
  await expect(composer).toHaveValue('a/b');
  await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
});

test.describe('docs search', () => {
  test('the slash key alone does not open the search, and Ctrl+K or Cmd+K does', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    await blur(page);
    await page.keyboard.press('/');
    await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
    await expect(page.locator('body')).toBeFocused();

    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.locator(SEARCH_MODAL)).toBeVisible();
  });

  test('the slash key with Ctrl, Alt, or both (AltGr) does not open the search', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    for (const keys of ['Control+/', 'Alt+/', 'Control+Alt+/']) {
      await blur(page);
      await page.keyboard.press(keys);
      await expect(page.locator(SEARCH_MODAL), keys).toHaveCount(0);
      await expect(page.locator('body'), keys).toBeFocused();
    }
  });

  test('the slash key pressed on the page still reaches the page listeners', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    await page.evaluate(() => {
      const seen: string[] = [];

      (window as unknown as { seenKeys: string[] }).seenKeys = seen;
      document.addEventListener('keydown', event => seen.push(event.key));
    });

    await blur(page);
    await page.keyboard.press('/');

    expect(await page.evaluate(() => (window as unknown as { seenKeys: string[] }).seenKeys)).toEqual(['/']);
    await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
  });

  test('choosing a search result on the same page leaves the focus at the target, not on the search button', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    const heading = page.locator('.sl-markdown-content h2[id]').first();
    const headingId = await heading.getAttribute('id');
    const headingText = (await heading.textContent())?.trim() ?? '';
    const pageUrl = page.url().split('#')[0];

    expect(headingId).toBeTruthy();

    await page.route('**/1/indexes/*/queries**', async(route) => {
      const hierarchy = {
        lvl0: 'Getting started',
        lvl1: 'Introduction',
        lvl2: headingText,
        lvl3: null,
        lvl4: null,
        lvl5: null,
        lvl6: null,
      };
      const highlight = { value: headingText, matchLevel: 'full', matchedWords: [] };

      await route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({
          results: [{
            hits: [{
              objectID: 'same-page-heading',
              url: `${pageUrl}#${headingId}`,
              type: 'lvl2',
              content: null,
              hierarchy,
              _highlightResult: {
                hierarchy: {
                  lvl0: { ...highlight, value: hierarchy.lvl0 },
                  lvl1: { ...highlight, value: hierarchy.lvl1 },
                  lvl2: highlight,
                },
              },
              _snippetResult: {
                hierarchy: {
                  lvl1: { value: hierarchy.lvl1, matchLevel: 'none' },
                  lvl2: { value: headingText, matchLevel: 'full' },
                },
              },
            }],
            nbHits: 1,
            page: 0,
            nbPages: 1,
            hitsPerPage: 20,
            exhaustiveNbHits: true,
            processingTimeMS: 1,
            query: headingText,
            params: '',
            index: 'handsontable',
          }],
        }),
      });
    });

    const searchButton = page.locator(SEARCH_BUTTON);

    await searchButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.DocSearch-Input')).toBeFocused();
    await page.keyboard.type(headingText.slice(0, 12));
    await expect(page.locator('.DocSearch-Hit').first()).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
    await expect(page).toHaveURL(`${pageUrl}#${headingId}`);
    await expect(searchButton).not.toBeFocused();
    await expect(page.locator('body')).toBeFocused();

    await page.keyboard.press('Tab');
    expect(await heading.evaluate((target) => {
      const all = [...document.querySelectorAll('*')];

      return all.indexOf(document.activeElement!) > all.indexOf(target);
    })).toBe(true);
  });

  test('a slash typed in the search box appears as text', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    await page.locator(SEARCH_BUTTON).focus();
    await page.keyboard.press('Enter');

    const input = page.locator('.DocSearch-Input');

    await expect(input).toBeFocused();
    await page.keyboard.type('a/b');
    await expect(input).toHaveValue('a/b');
    await expect(page.locator(SEARCH_MODAL)).toBeVisible();
  });

  test('closing the search with Escape returns the focus to the search button', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    const searchButton = page.locator(SEARCH_BUTTON);

    await searchButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.DocSearch-Input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
    await expect(searchButton).toBeFocused();
  });

  test('closing the search opened with Ctrl+K or Cmd+K returns the focus to the element that had it', async ({ page, baseURL }) => {
    await openPage(page, baseURL);
    await requireSearch(page);
    await waitForSearchReady(page);

    const askAi = page.locator('#header-assistant-btn');

    await askAi.focus();
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.locator('.DocSearch-Input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
    await expect(askAi).toBeFocused();
  });

  test('closing the search opened from the phone header returns the focus to its search button', async ({ page, baseURL }) => {
    await openPage(page, baseURL, 390);
    await requireSearch(page);
    await expect(page.locator(SEARCH_BUTTON)).toBeAttached();

    const mobileSearch = page.locator('.mobile-search-btn');

    await expect(mobileSearch).toBeVisible();
    await mobileSearch.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.DocSearch-Input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator(SEARCH_MODAL)).toHaveCount(0);
    await expect(mobileSearch).toBeFocused();
  });
});
