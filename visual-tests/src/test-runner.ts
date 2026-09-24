import path from 'path';
import { test as baseTest, expect, Page, TestInfo } from '@playwright/test';
import { helpers } from './helpers';
import PageHolder from './page-holder';
import { CLASSIC, CROSS_BROWSERS, JS_VARIANTS, REFERENCE_FRAMEWORK, WRAPPERS } from './config.mjs';
import {
  VISUAL_VARIANTS_ANNOTATION,
  WRAPPERS_REASON_UNAUDITED,
  isDeclared,
  normalizeDeclaration,
} from '../lib/visual-declarations.mjs';

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
/**
 * How long a requested stylesheet gets to arrive before the render is refused.
 *
 * Generous on purpose: this waits only when something is genuinely still in flight, and the cost of
 * being too strict is a flaky failure on a slow runner — the exact thing the guard exists to stop
 * being photographed.
 */
const STYLESHEET_TIMEOUT = 5000;

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
 * Deliberately NOT wired the way the engine wires its own tracker. `overlays.ts:531` registers
 * `pointermove` on the window with `{ passive: true }` and no capture flag — the bubble phase — while
 * this listens in the capture phase, so the probe still records a move that something upstream stops
 * from bubbling. The two therefore agree on every event the engine sees and the probe sees a superset;
 * a handler that called `stopPropagation()` would split them, and the fixture's copy is the one that
 * must not go blind, because a missed move makes a pinned band read as a stuck one.
 *
 * `pointerleave` is on `documentElement` in the bubble phase, which fires only when the pointer leaves
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
 * This reports the state and decides nothing. Two callers act on it, and they want different things:
 * a capture can live with a pinned band (it is deterministic), while a spec that is about to click
 * into that strip cannot. {@link settleScrollbarClearanceForCapture} and
 * {@link waitForScrollbarClearanceToClose} are those two policies.
 *
 * @param {Page} page The page to inspect.
 * @returns {Promise<'closed' | 'pinned' | 'stuck'>} `closed` when nothing transient is on screen,
 * `pinned` when a resting pointer holds a band open by design, `stuck` when neither is true in time.
 */
async function awaitScrollbarClearance(page: Page): Promise<'closed' | 'pinned' | 'stuck'> {
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
    return 'closed';
  }

  // The slow path is about to spend up to another SETTLE_TIMEOUT - FADE_ALLOWANCE, so buy that budget
  // here rather than from the config. A flat per-test bump only helps a test that still has room left:
  // `tab-navigation-through-all-components.spec.ts` takes a dozen captures plus keyed navigation, so a
  // band stuck on a late one would die on "Test timeout of 15000ms exceeded" and the message naming
  // the cause — the whole point of failing loudly — would never be printed. Granting it here makes the
  // diagnosis win on whichever capture hits it.
  baseTest.info().setTimeout(baseTest.info().timeout + SETTLE_TIMEOUT);

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
    return 'pinned';
  }

  return await settledWithin(SETTLE_TIMEOUT - FADE_ALLOWANCE) ? 'closed' : 'stuck';
}

/**
 * The capture-time policy: wait the band out, and accept a pinned one.
 *
 * A band a resting pointer holds open is a deterministic state — the pointer is where the spec left
 * it, every run — so the capture proceeds and the test is annotated rather than failed. Anything still
 * open with the pointer away is a stuck transient, and failing here makes Playwright re-render the
 * spec; a persistent one turns the render job red with a message naming the cause, which is what the
 * silent 5 s give-up this replaces never did.
 *
 * @param {Page} page The page about to be captured.
 * @returns {Promise<void>} Resolves once the capture may proceed; rejects on a stuck band.
 */
async function settleScrollbarClearanceForCapture(page: Page) {
  const state = await awaitScrollbarClearance(page);

  if (state === 'pinned') {
    baseTest.info().annotations.push({
      type: 'scrollbar-band',
      description: 'captured with the scrollbar clearance band pinned open by the pointer',
    });

    return;
  }

  if (state === 'stuck') {
    throw new Error(`The scrollbar clearance band was still open ${SETTLE_TIMEOUT} ms after the last action, `
      + 'with the pointer away from the scrollbar. The capture would record a transient state, so it is '
      + 'refused; see settleScrollbarClearanceForCapture() in visual-tests/src/test-runner.ts.');
  }
}

/**
 * The spec-facing policy: wait until the band is really gone.
 *
 * For a spec that is about to CLICK where the band is, "pinned" is not good enough — the strip belongs
 * to the scrollbar while it is up, so the click is swallowed and the spec goes on with a selection it
 * never made (`copy-paste.spec.ts` copies one cell instead of the range, and its assertions still
 * pass, so it surfaces only as a changed screenshot). That is why this is a separate export from the
 * capture policy: the capture may proceed on a pinned band, a click may not, and one function cannot
 * promise both.
 *
 * @param {Page} page The page to wait on.
 * @returns {Promise<void>} Resolves once no band and no clip are on screen; rejects otherwise.
 */
async function waitForScrollbarClearanceToClose(page: Page) {
  const state = await awaitScrollbarClearance(page);

  if (state === 'closed') {
    return;
  }

  throw new Error(state === 'pinned'
    ? 'The scrollbar clearance band is pinned open by a pointer resting beside the scrollbar, so it '
      + 'will not close on its own and a click into that strip would be swallowed. Move the pointer '
      + 'away from the edge first; see waitForScrollbarClearanceToClose() in visual-tests/src/test-runner.ts.'
    : `The scrollbar clearance band was still open ${SETTLE_TIMEOUT} ms after the last action, with the `
      + 'pointer away from the scrollbar. A click into that strip would be swallowed; see '
      + 'waitForScrollbarClearanceToClose() in visual-tests/src/test-runner.ts.');
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
  // focused text control costs Chromium a re-rasterized grid, so it is engine-gated. Read from the
  // browser that is actually running, never from the project's name or its `use`: a renamed project or
  // a second WebKit project for another theme would silently stop resetting and let `columns-filter-2`
  // poison the baseline again, and `use.browserName` is undefined here anyway — the cross-browser
  // config builds its projects from `devices['Desktop Safari']`, which carries `defaultBrowserType`.
  const resetUnderTextControl = page.context().browser()?.browserType().name() === 'webkit';

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
 * Fails the render when a stylesheet the demo asked for did not arrive.
 *
 * The js demo loads its theme, and each route's own CSS, as a `<link class="dynamic-css">` and waits
 * for the `load` event before it builds the grid. That event is not proof the stylesheet exists: vite's
 * preview server answers an unknown path with `index.html` and a 200, Chromium fires `load` for it, and
 * the demo carries on with no theme applied. The first CI dispatch of the stability matrix rendered every
 * themed pass that way (run 35230835319, 2026-09-17): the job had built the base stylesheet but never
 * the theme ones, ten runners agreed byte for byte on an unthemed grid, and because that matrix compares
 * runners with each other nothing downstream could tell. A stylesheet that arrived has at least one rule; one that did not has a
 * null `sheet` or an empty rule list, and that is what is asserted — the place the wrong picture is
 * cheapest to catch is before the first capture, with the missing file named.
 *
 * The two states are waited for and reported separately, because a link element existing is not a
 * stylesheet having loaded. The js demo waits on a promise before it builds the grid, but the wrapper
 * demos attach the link synchronously in `<head>` and leave the ordering to the browser, so reading
 * `sheet` once — the moment the table appears — could read it before the fetch resolved and refuse a
 * render that was fine. That is the flake shape this file spends its length avoiding, arriving inside
 * the guard meant to prevent one. So: wait for every requested sheet to arrive, then judge what it
 * carries. A sheet still absent after {@link STYLESHEET_TIMEOUT} never loaded (a 404 outside vite's
 * index.html fallback, or a server that hung); a sheet that arrived with no rules is the fallback
 * being served as CSS. The messages say which, because the remedies differ.
 *
 * With `HOT_THEME` set the run's own theme file must be among them, by name: a themed run that asked
 * for no theme stylesheet, or for a different one, is the same wrong picture by another route. A demo
 * that does not use the convention has no such links and passes trivially. All four demos set the class,
 * so a themed wrapper run would be checked the same way the js run is — no tier themes a wrapper today,
 * which is why that path has never been exercised. A cross-origin sheet hides its rules behind a SecurityError; that is reported as
 * unknown, not as empty, so a demo that ever loads a CDN stylesheet is not failed for being unreadable.
 *
 * @param {Page} page The page whose grid has just rendered.
 * @returns {Promise<void>} Resolves when every requested stylesheet carries rules.
 */
async function assertStylesheetsLoaded(page: Page) {
  // The callbacks run in the browser, where `document` is the right global to use.
  /* eslint-disable no-restricted-globals */
  await page.waitForFunction(
    () => [...document.querySelectorAll<HTMLLinkElement>('link.dynamic-css')]
      .every(link => link.sheet !== null),
    undefined,
    { timeout: STYLESHEET_TIMEOUT, polling: 50 },
  ).catch((error: Error) => {
    // Only a timeout means "still not here"; a closed page or a destroyed context is a different
    // failure and must surface as itself. The timeout is not thrown — the read below names the files.
    if (error.name !== 'TimeoutError') {
      throw error;
    }
  });

  const links = await page.evaluate(() => [...document.querySelectorAll<HTMLLinkElement>('link.dynamic-css')]
    .map((link) => {
      let rules: number | null;

      try {
        rules = link.sheet ? link.sheet.cssRules.length : null;
      } catch {
        rules = -1;
      }

      return { href: link.getAttribute('href') ?? '', rules };
    }));
  /* eslint-enable no-restricted-globals */

  const pending = links.filter(link => link.rules === null);

  if (pending.length > 0) {
    throw new Error(`${pending.length} stylesheet(s) the demo asked for never loaded within `
      + `${STYLESHEET_TIMEOUT} ms — ${pending.map(link => link.href).join(', ')} — so the grid is about `
      + 'to be photographed unstyled. The request failed or never answered; a path the server answers '
      + 'with index.html and a 200 shows up as the empty-rules failure instead. See '
      + 'assertStylesheetsLoaded() in visual-tests/src/test-runner.ts.');
  }

  const empty = links.filter(link => link.rules === 0);

  if (empty.length > 0) {
    throw new Error(`The demo asked for ${empty.length} stylesheet(s) that carry no rules — `
      + `${empty.map(link => link.href).join(', ')} — so the grid is about to be photographed unstyled. `
      + 'The file is missing from the served tree (a build that never produced `styles/`, or a preview '
      + 'server answering the path with index.html and a 200). See assertStylesheetsLoaded() in '
      + 'visual-tests/src/test-runner.ts.');
  }

  // The exact file, not any `ht-theme-` link. The demo maps a theme and its dark variant onto one
  // stylesheet (`main` and `main-dark` both load `ht-theme-main.css`, and so on for horizon and
  // classic — `loadThemeCSS()` in examples/next/visual-tests/js/demo/src/index.js), so the name this
  // run should have asked for is the theme with any `-dark` suffix removed. Matching the prefix alone
  // would pass a demo that mapped `horizon` onto `ht-theme-main.css` and save main-theme pixels under
  // the horizon name — the same wrong picture this function exists to refuse, arriving by a route the
  // loose check cannot see.
  if (helpers.hotTheme) {
    const themeFile = `ht-theme-${helpers.hotTheme.replace(/-dark$/, '')}.css`;

    if (!links.some(link => link.href.endsWith(themeFile))) {
      throw new Error(`HOT_THEME is "${helpers.hotTheme}" but the demo attached no ${themeFile} link `
        + `(it asked for: ${links.map(link => link.href).join(', ') || 'nothing'}), so the capture would `
        + 'carry the theme\'s name and none of its pixels. See assertStylesheetsLoaded() in '
        + 'visual-tests/src/test-runner.ts.');
    }
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
 * The two steps fail differently. A stuck band fails the capture (see `settleScrollbarClearanceForCapture`).
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

    await settleScrollbarClearanceForCapture(page);
    await clearNativeTextSelection(page).catch(() => {});

    return capture(options);
  }) as Page['screenshot'];
}

type TestParams = {
  tablePage: Page;
  customTitle: string;
  goto: (url: string) => Promise<void>;
};

/**
 * The spec file a test was declared in, as an absolute path.
 *
 * Not `testInfo.file`: that is the file `test()` was CALLED from, and since `visualTest()` registers every
 * spec it is this file for all of them — measured on Playwright 1.60.0, where a helper that calls `test()`
 * puts its own path there and its own line in the report's location. Every golden path is keyed on the spec
 * file: `helpers.setTestDetails()` turns it into `screenshotDirName`, and `helpers.screenshotPath()` reads
 * `/cross-browser/` out of it to pick the layout. Reading `testInfo.file` here would collapse all 1676
 * records onto one name, which is a silent catastrophe rather than a failure.
 *
 * The file suite's title is the spec path relative to the run's root, and Playwright destructures its own
 * `titlePath()` as `[file, ...titles]` when it builds a test id, so that is the value to read. The guard
 * makes a future change in that shape fail loudly on the first capture instead of rewriting the baseline.
 *
 * @param {TestInfo} testInfo The running test's info.
 * @returns {string} The absolute path of the `.spec.ts` file that declared the test.
 */
function specFilePath(testInfo: TestInfo): string {
  const [relativeSpecPath] = testInfo.titlePath;

  if (typeof relativeSpecPath !== 'string' || !relativeSpecPath.endsWith('.spec.ts')) {
    throw new Error('Cannot tell which spec file declared this test: testInfo.titlePath[0] is '
      + `${JSON.stringify(relativeSpecPath)}, not a path ending in .spec.ts. Every golden path is derived `
      + 'from the spec file, so capturing under a wrong name would rewrite the baseline. See '
      + 'specFilePath() in src/test-runner.ts.');
  }

  return path.join(testInfo.config.rootDir, relativeSpecPath);
}

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
      testFilePath: specFilePath(testInfo),
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
    await assertStylesheetsLoaded(page);
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
        testFilePath: specFilePath(testInfo),
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
      await assertStylesheetsLoaded(page);
    });
  }
});

/**
 * What a spec declares it renders on. `themes` is the js axis — `CLASSIC` plus any of `THEMES`, because the
 * bare run is a variant like any other and only differs in having no name to pass through `HOT_THEME`.
 * `browsers` is the cross-browser leg's projects. `wrappers` are the wrappers that hold a golden of this
 * spec, and `wrappersReason` says what their render proves; it is mandatory whenever `wrappers` is not
 * empty. `lib/visual-declarations.mjs` validates the whole shape.
 *
 * All three axes are required on purpose, although `normalizeDeclaration()` defaults each one: what a
 * spec costs is meant to be readable in the spec, so the default is a shape you copy (from the template,
 * or from the example in `AGENTS.md`) rather than a shape you get by leaving a key out. The defaulting
 * exists so a half-written declaration cannot render on a variant nobody named.
 */
export type VisualDeclaration = {
  themes: string[];
  browsers: string[];
  wrappers: string[];
  wrappersReason?: string;
};

/**
 * The test body, as Playwright types it for this tier's fixtures.
 */
type VisualTestBody = Parameters<typeof test>[2];

/**
 * Registers a visual spec and states, in the spec itself, which variants it produces goldens for.
 *
 * The runner still launches every variant the tier asks for (`scripts/run-tests.mjs` runs one Playwright
 * pass per framework and one per theme); a variant this spec does not declare skips here. Both skips are
 * file-scope modifiers, which is what makes them free and also why a file may hold only one declaration:
 * a modifier declared at file scope applies to every test in the file, so the skips of two `visualTest()`
 * calls COMBINE. The file then renders only the variants both declarations name — the intersection, which
 * can be empty, so a variant either declaration asked for on its own can stop rendering entirely
 * (measured: `main`-only and `horizon`-only declarations in one file render nothing under `HOT_THEME=main`).
 * The static sweep in `lib/__tests__/visual-declarations.test.mjs` enforces the one-declaration rule;
 * `tests/cross-browser/copy-paste.spec.ts` is the only file with several tests today and all five agree.
 *
 * The framework and theme axis uses the boolean form, which Playwright resolves at collection and never
 * dispatches to a worker: measured, the 69 js-only skips added nothing to the 3.5 s collection, while the
 * in-body form they replace cost about 40 ms per test on CI's single worker because the page fixture is set
 * up before the skip is reached. The browser axis has to use the callback form, because no project
 * information exists at file scope otherwise — and `browserName` has to come from the fixture, not from
 * `testInfo.project.use`, which is undefined here (the cross-browser config builds its projects from
 * `devices[...]`, which carries `defaultBrowserType`).
 *
 * The declaration is also attached as a static `annotation`, which `npx playwright test --list
 * --reporter=json` reports for every collected test, skipped ones included. That is the only form a reader
 * outside the run can trust: the callback skip above is evaluated in a worker and never reaches `--list`.
 *
 * @param {string} title The test title — `__filename` for a spec whose file name is its name, or a plain
 * string for the cross-browser specs that loop over demo routes.
 * @param {VisualDeclaration} variants Which variants this spec renders on.
 * @param {VisualTestBody} body The test body.
 * @returns {void} Registers the test, the way `test()` does.
 */
export function visualTest(title: string, variants: VisualDeclaration, body: VisualTestBody) {
  // The title doubles as the label a validation failure carries: it is `__filename` for every spec but
  // the five looped cross-browser ones, and their plain titles are unique too, so whichever a spec used
  // is enough to find it. Without it the message states the rule and leaves the author guessing which of
  // the 112 specs broke it.
  const declaration = normalizeDeclaration(variants, title);
  // `helpers.init()` ran at import, so both are already resolved. An unset HOT_THEME is the bare run, which
  // is what `CLASSIC` names; the token never travels back through the environment.
  const framework = helpers.hotWrapper;
  const theme = helpers.hotTheme || CLASSIC;
  const variantName = framework === REFERENCE_FRAMEWORK ? `${framework}/${theme}` : framework;

  test.skip(
    !isDeclared(declaration, { framework, theme }),
    `Visual variant not declared by this spec: ${variantName}.`
  );
  test.skip(
    ({ browserName }) => !declaration.browsers.includes(browserName),
    `Visual browsers declared by this spec: ${declaration.browsers.join(', ')}.`
  );

  return test(
    title,
    { annotation: { type: VISUAL_VARIANTS_ANNOTATION, description: JSON.stringify(declaration) } },
    body
  );
}

// Export the custom fixture, the declaration API, and the vocabulary a spec declares with, so a spec needs
// one import for all of it.
export {
  expect,
  test,
  waitForScrollbarClearanceToClose,
  CLASSIC,
  JS_VARIANTS,
  WRAPPERS,
  CROSS_BROWSERS,
  WRAPPERS_REASON_UNAUDITED,
};
