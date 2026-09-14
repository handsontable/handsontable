import path from 'path';
import { test as baseTest, expect, Page } from '@playwright/test';
import { helpers } from './helpers';
import PageHolder from './page-holder';

helpers.init();

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

const shouldImplicitlyNavigate = new WeakSet();
const bandSettleInstalled = new WeakSet<Page>();
const pointerProbeInstalled = new WeakSet<Page>();

/**
 * How long a scrollbar-clearance band may stay on screen before a capture is judged, in milliseconds.
 * The band closes 1000 ms after the last scroll (`OVERLAY_SCROLLBAR_FADE_DELAY` in walkontable), so a
 * band still open at 5 s is either pinned by the pointer or stuck.
 */
const SETTLE_TIMEOUT = 5000;

/**
 * How long an unpinned band lives after the last scroll, in milliseconds: `OVERLAY_SCROLLBAR_FADE_DELAY`
 * in walkontable plus a margin for a loaded runner. The settle polls this long before it asks whether the
 * pointer is holding the band open, so a pinned capture costs about 1.5 s instead of the full timeout.
 */
const FADE_ALLOWANCE = 1500;

/**
 * Mirrors `OVERLAY_SCROLLBAR_PROXIMITY` in `handsontable/src/3rdparty/walkontable/src/overlay/constants.ts`:
 * a pointer resting this close to a scrollbar's edge holds that band open with no timer behind it. A
 * change to the engine's constant has to be mirrored here.
 */
const SCROLLBAR_PROXIMITY = 26;

/**
 * The shape the init script below leaves on `window`, so the settle wait can read where the pointer
 * came to rest. Playwright does not expose the mouse position, and the engine pins a band open while
 * the pointer sits beside a scrollbar, so the fixture has to track it itself.
 */
type VisualProbe = { pointer: { x: number; y: number } | null };

/**
 * Records the pointer's last viewport position from inside the page, before any navigation.
 *
 * Wired the way the engine wires its own tracker (`overlays.ts`): `pointermove` in the capture phase,
 * and `pointerleave` on `documentElement` in the bubble phase, which fires only when the pointer leaves
 * the window. A capture-phase `pointerleave` on `document` would fire on every cell-to-cell crossing and
 * on the hover re-evaluation a scroll triggers under a resting pointer, clearing the record exactly when
 * the engine still holds its own and pins the band.
 *
 * @param {Page} page The page to instrument.
 * @returns {Promise<void>} Resolves once the init script is registered.
 */
function installPointerProbe(page: Page) {
  if (pointerProbeInstalled.has(page)) {
    return Promise.resolve();
  }

  pointerProbeInstalled.add(page);

  // The callback runs in the browser, where `window` and `document` are the right globals to use.
  /* eslint-disable no-restricted-globals */
  return page.addInitScript(() => {
    const probe: VisualProbe = { pointer: null };

    (window as unknown as { __hotVisualProbe: VisualProbe }).__hotVisualProbe = probe;
    window.addEventListener('pointermove', (event) => {
      probe.pointer = { x: event.clientX, y: event.clientY };
    }, { capture: true, passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      probe.pointer = null;
    }, { passive: true });
  });
  /* eslint-enable no-restricted-globals */
}

/**
 * Waits out the scrollbar clearance (#10370), which is transient by design.
 *
 * Scrolling opens a band along the scrollbar's edge and clips the frozen overlays out of it; both go
 * away 1000 ms later. A screenshot taken inside that window records whichever half of the animation
 * the runner happened to reach, so the same test flips between two correct-looking images on nothing
 * but machine speed — 118 snapshots changed on one PR that way, none of them a real diff.
 *
 * Both halves have to be waited for. The clip can outlive the band: a grid with headers and nothing
 * frozen used to publish a clip with no band behind it, so counting fillers alone would have called
 * that settled while a 16px strip still showed the wrong cells.
 *
 * The wait starts two animation frames late, on purpose. The band is created inside the holder's
 * `scroll` handler, and the browser dispatches that event on the frame AFTER the action that scrolled
 * resolves. A poll that runs the moment `click()` returns therefore sees no band and no clip, passes,
 * and the capture lands with the band up: measured 16 of 20 times on the RTL selection spec, and 0 of
 * 20 once two frames had elapsed (DEV-2797). The two frames cost about 35 ms per capture.
 *
 * A band still open after the fade ({@link FADE_ALLOWANCE}) is one of two things, and the fixture tells
 * them apart instead of guessing. The engine pins a band open, with no timer, while the pointer rests
 * within {@link SCROLLBAR_PROXIMITY} of that band's scrollbar edge; a spec that ends a drag there
 * photographs a deterministic state, so the capture proceeds and the test is annotated. Anything still
 * open at {@link SETTLE_TIMEOUT} is a stuck transient, and the capture fails loudly so Playwright
 * re-renders the spec and a persistent defect turns the render job red — the silent 5 s give-up this
 * replaces produced diffs nobody could explain.
 *
 * @param {Page} page The page about to be captured.
 * @returns {Promise<void>} Resolves once nothing transient is on screen, or once the band is known to
 * be pinned; rejects when a band is stuck.
 */
async function waitForScrollbarClearanceToSettle(page: Page) {
  // The callbacks run in the browser, where `window` and `document` are the right globals to use.
  /* eslint-disable no-restricted-globals */
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));

  const settledWithin = (timeout: number) => page.waitForFunction(() => {
    const bands = document.querySelectorAll('.htScrollbarClearanceFiller').length;
    const clipped = [...document.querySelectorAll('[class*="ht_clone_"]')]
      .some(el => getComputedStyle(el).clipPath !== 'none');

    return bands === 0 && !clipped;
  }, undefined, { timeout, polling: 100 }).then(() => true, (error: Error) => {
    // Only the timeout means "still open". A closed page or a destroyed context is a different
    // failure and must surface as itself, not as a band diagnosis.
    if (error.name !== 'TimeoutError') {
      throw error;
    }

    return false;
  });

  if (await settledWithin(FADE_ALLOWANCE)) {
    return;
  }

  // Still open after the fade: a pointer resting beside an OPEN band's scrollbar holds exactly that
  // band open, with no timer. Judge the open fillers, which carry their edge and live in the holder
  // they belong to, so a menu's or a nested grid's own holder cannot vouch for the main grid's band
  // and a stuck bottom band is not excused by a pointer near the inline-end edge.
  const pinned = await page.evaluate((proximity) => {
    const probe = (window as unknown as { __hotVisualProbe?: VisualProbe }).__hotVisualProbe;
    const pointer = probe?.pointer;

    if (!pointer) {
      return false;
    }

    return [...document.querySelectorAll('.htScrollbarClearanceFiller')].some((filler) => {
      const holder = filler.closest('.wtHolder');

      if (!holder) {
        return false;
      }

      const edge = filler.getAttribute('data-ht-clearance-edge');
      const rect = holder.getBoundingClientRect();
      const rtl = getComputedStyle(holder).direction === 'rtl';
      const inReach = pointer.x >= rect.left && pointer.x <= rect.right
        && pointer.y >= rect.top && pointer.y <= rect.bottom;
      const nearBottomEdge = pointer.y >= rect.bottom - proximity;
      const nearInlineEndEdge = rtl
        ? pointer.x <= rect.left + proximity
        : pointer.x >= rect.right - proximity;

      return inReach && (edge === 'bottom' ? nearBottomEdge : nearInlineEndEdge);
    });
  }, SCROLLBAR_PROXIMITY);
  /* eslint-enable no-restricted-globals */

  if (pinned) {
    baseTest.info().annotations.push({
      type: 'scrollbar-band',
      description: 'captured with the scrollbar clearance band pinned open by the pointer',
    });

    return;
  }

  if (await settledWithin(SETTLE_TIMEOUT - FADE_ALLOWANCE)) {
    return;
  }

  throw new Error(`The scrollbar clearance band was still open ${SETTLE_TIMEOUT} ms after the last action, `
    + 'with the pointer away from the scrollbar. The capture would record a transient state, so it is '
    + 'refused; see waitForScrollbarClearanceToSettle() in visual-tests/src/test-runner.ts.');
}

/**
 * Drops the browser's own text-selection highlight, which a click sequence can leave behind.
 *
 * A filter flow can end with the column header's label selected - seen on `columns-filter-2` under
 * WebKit - and nothing in the grid takes it away: `clearTextSelection()` runs on a mousedown inside
 * the grid, and the last click of that flow lands in the dropdown menu. The highlight paints the
 * browser default over whatever text it covers, so the same spec publishes two correct-looking
 * images on nothing but where the run happened to leave the caret.
 *
 * The grid's own cell selection is drawn by Handsontable and is not a native selection - with one
 * exception. `CopyPaste` puts a real TD into a native range for its Safari clipboard path
 * (`makeElementContentEditableAndSelectItsContent`), so this does reach it. That range carries the
 * `invisibleSelection` class, which hides it, so clearing it changes no pixel today.
 *
 * `fragmentSelection` is the case to watch. It is a real setting whose whole point is a visible
 * native selection spanning TDs (`tableView.ts`), and no visual spec turns it on. A spec that did
 * would need this clear skipped, or its selection is stripped before the capture with nothing on
 * screen to explain why.
 *
 * A focused text control is the case where the engines split, measured on PR #13468. WebKit keeps
 * painting a selection made before the control took focus - the header highlight survived the focus
 * moving into the filter menu's inputs - and the Selection API cannot see it while the control has
 * focus: `getSelection()` reports one collapsed range at the control's parent whether or not a stray
 * highlight is on screen. Chromium, on the other hand, re-rasterizes the text of the whole grid when
 * the ranges under a focused control are removed - the run that cleared unconditionally moved 13
 * Tab-navigation captures by 3k-45k pixels across every theme - and moves the caret to 0. So a
 * focused text control is left alone on Chromium and Firefox (Firefox reports no range there at all),
 * and on WebKit the ranges are removed and the control's own selection is put straight back with
 * `setSelectionRange()`, which restores the caret, a selected range and its direction exactly.
 * `selectionStart` is the test for a control that owns a text selection at all; reading `value` would
 * wrongly skip a checkbox, radio, range or color input, each of which reports a non-empty default.
 *
 * Annotates the test with the text it removed, when it removed any, so a stray selection shows in
 * the Playwright report instead of only as a changed golden.
 *
 * @param {Page} page The page about to be captured.
 * @returns {Promise<void>} Resolves once no stray native selection is left.
 */
async function clearNativeTextSelection(page: Page) {
  // Only WebKit paints a selection the API no longer reports (see the docblock); the reset under a
  // focused text control costs Chromium a re-rasterized grid, so it is engine-gated.
  const resetUnderTextControl = baseTest.info().project.name === 'webkit';

  // The callback runs in the browser, where `window` and `document` are the right globals to use.
  /* eslint-disable no-restricted-globals */
  const cleared = await page.evaluate((resetUnderControl) => {
    const active = document.activeElement;
    const selection = window.getSelection();
    const textControl = (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
      && typeof active.selectionStart === 'number' ? active : null;

    if (textControl) {
      if (resetUnderControl) {
        const { selectionStart, selectionEnd, selectionDirection } = textControl;

        selection?.removeAllRanges();
        textControl.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? 'none');
      }

      return null;
    }

    const stray = selection && selection.rangeCount > 0 && !selection.isCollapsed
      ? selection.toString().slice(0, 60)
      : '';

    selection?.removeAllRanges();

    return stray ? { text: stray, active: active ? active.tagName.toLowerCase() : 'none' } : null;
  }, resetUnderTextControl);
  /* eslint-enable no-restricted-globals */

  if (cleared) {
    baseTest.info().annotations.push({
      type: 'native-selection-cleared',
      description: `"${cleared.text}" was selected (focus on <${cleared.active}>) and was cleared before the capture`,
    });
  }
}

/**
 * Makes every `screenshot()` on this page wait for that settle first, and drop any stray native text
 * selection. Wrapping the page is what makes it uniform: the specs call `tablePage.screenshot()`
 * directly, in a few hundred places. `locator.screenshot()` is not wrapped, and the lint tier bans it
 * for that reason (`visual-tests/.eslintrc.js`): capture through `tablePage.screenshot()`.
 *
 * Playwright's own failure screenshot (`screenshot: 'only-on-failure'`) comes through this same method,
 * after the test has already failed. It is let straight through: the page has to be recorded as it is —
 * a stuck band is the one thing that artifact exists to show — and a second 5 s settle inside teardown
 * would only re-throw into a recorder that swallows it.
 *
 * The two steps fail differently. A stuck band fails the capture (see `waitForScrollbarClearanceToSettle`).
 * The selection clear stays best-effort: a page torn down mid-capture must not turn into a failure, and
 * a selection that survived changes pixels the comparison will report rather than hide.
 *
 * @param {Page} page The page to instrument.
 */
function installScrollbarClearanceSettle(page: Page) {
  if (bandSettleInstalled.has(page)) {
    return;
  }

  bandSettleInstalled.add(page);

  const capture = page.screenshot.bind(page);

  // eslint-disable-next-line no-param-reassign
  page.screenshot = (async(options?: Parameters<Page['screenshot']>[0]) => {
    if (baseTest.info().errors.length > 0 || options?.caret === 'initial') {
      return capture(options);
    }

    await waitForScrollbarClearanceToSettle(page);
    await clearNativeTextSelection(page).catch(() => {});

    return capture(options);
  }) as Page['screenshot'];
}

type TestParams = {
  tablePage: Page;
  customTitle: string;
  goto: (url: string) => Promise<void>;
};

// Define your custom fixture
const test = baseTest.extend<TestParams>({
  async tablePage({ page }, use, testInfo) {
    PageHolder.getInstance().setPage(page);
    helpers.screenshotsCount = 0;
    installScrollbarClearanceSettle(page);
    await installPointerProbe(page);

    const isDarkTheme = helpers.hotTheme.includes('dark');

    // Headless Chromium on CI defaults prefers-color-scheme to 'light', so native
    // form controls (e.g. <input type="date">) always render in light mode even when
    // the active Handsontable theme sets `color-scheme: dark` via CSS. The CSS property
    // alone is not enough to override the browser-level media preference in headless mode.
    // Emulating the color scheme here aligns the browser with the theme before any
    // navigation happens, ensuring native controls render consistently with the theme.
    await page.emulateMedia({ colorScheme: isDarkTheme ? 'dark' : 'light' });

    if (shouldImplicitlyNavigate.has(page)) {
      await use(page);

      return;
    }

    await page.goto(
      helpers
        .setBaseUrl('/')
        .setPageParams({ direction: 'ltr' })
        .getFullUrl()
    );

    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(helpers.expectedPageTitle);

    helpers.setTestDetails({
      rootDir: testInfo.config.rootDir,
      testFilePath: testInfo.file,
      browser: testInfo.project.name,
      testedPageUrl: page.url(),
    });

    // disable animations and transitions on all testing pages (for consistent screenshots)
    await page.addStyleTag({
      content: `
        *,
        *::before,
        *::after {
            animation: none !important;
            transition: none !important;
        }
      `
    });

    stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

    const table = page.locator(helpers.selectors.anyTable).first();

    await table.waitFor();
    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern
  async customTitle({}, use, testInfo) {
    const title = helpers.testTitle(path.basename(testInfo.title));

    await use(title);
  },
  async goto({ page }, use, testInfo) {
    shouldImplicitlyNavigate.add(page);
    installScrollbarClearanceSettle(page);
    await installPointerProbe(page);

    const isDarkTheme = helpers.hotTheme.includes('dark');

    // See the same call in tablePage for the full explanation.
    await page.emulateMedia({ colorScheme: isDarkTheme ? 'dark' : 'light' });

    await use(async(url) => {
      await page.goto(url);

      helpers.setBaseUrl('/').setPageParams({ direction: 'ltr' });

      await page.waitForLoadState('load');
      await expect(page).toHaveTitle(helpers.expectedPageTitle);

      helpers.setTestDetails({
        rootDir: testInfo.config.rootDir,
        testFilePath: testInfo.file,
        browser: testInfo.project.name,
        testedPageUrl: page.url(),
      });

      // disable animations and transitions on all testing pages (for consistent screenshots)
      await page.addStyleTag({
        content: `
          *,
          *::before,
          *::after {
              animation: none !important;
              transition: none !important;
          }
        `
      });

      stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

      const table = page.locator(helpers.selectors.anyTable).first();

      await table.waitFor();
    });
  }
});

// Export the custom fixture
export { expect, test, waitForScrollbarClearanceToSettle };
