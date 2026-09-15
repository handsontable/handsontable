import { test, expect } from '../fixtures/test';
import { MenuOpenFailurePage } from '../fixtures/pages/MenuOpenFailurePage';

/**
 * DEV-41 / DEV-2922. `Menu.open()` assigns `this.hotMenu` — which is all `isOpened()` reads —
 * then runs the whole nested-grid `hotMenu.init()`, and only afterwards creates `#navigator`.
 * Rendering the items inside that init calls each item's `name()`, `disabled()`, `checked()` and
 * `ariaLabel()` callbacks, all public features, so user code can throw in the gap.
 *
 * It used to be unrecoverable. `close()` guarded on `isOpened()` alone and then called
 * `this.#navigator!.clear()` — the `!` is a TypeScript assertion, erased at build time, so there
 * was no runtime check. The menu stayed "open" for the life of the page and every later document
 * `mousedown` crashed on the missing navigator. On the Sentry issue this turned a handful of users
 * into 100+ events from one stack.
 *
 * Each test below pins one half of that blast radius, because they fail independently: a build
 * that only guards `close()` stops the crash but leaves the menu permanently unopenable, and a
 * build that only rolls back `open()` still crashes if anything else strands the navigator.
 */
test.describe('a menu item that throws while the menu is opening', () => {
  let grid: MenuOpenFailurePage;
  /** Uncaught page errors, newest last. */
  let pageErrors: string[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    grid = new MenuOpenFailurePage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * Open the menu, wait for the item's own throw to actually land, then clear the buffer.
   *
   * The wait is load-bearing, not politeness. A click resolves when the input is dispatched, but
   * the `pageerror` arrives as a separate protocol event — clearing the buffer without settling
   * first lets that error land *after* the reset and fail a later "no errors" assertion on a
   * correct build. Waiting for the message is also the positive control that makes the negative
   * assertions in each test meaningful.
   */
  async function failTheOpenAndResetErrors(): Promise<void> {
    await grid.clickColumnMenuButton(0);

    const itemError = await grid.itemErrorMessage();

    await expect.poll(() => pageErrors).toContain(itemError);

    pageErrors.length = 0;
  }

  test('still reports the item\'s own error, so the app\'s bug is not swallowed', async () => {
    await grid.clickColumnMenuButton(0);

    // The rollback must not turn a real application bug into silence. Asserted first, because
    // every other test here would also pass on a build that simply caught and dropped the error.
    await expect
      .poll(() => pageErrors)
      .toContain(await grid.itemErrorMessage());
  });

  test('leaves the menu closed instead of stranded half-open', async () => {
    await grid.clickColumnMenuButton(0);

    // `isOpened()` is the invariant that broke. The container was already hidden on the broken
    // build, so asserting only on the DOM would pass there too.
    await expect.poll(() => grid.menuState()).toEqual({
      isOpened: false,
      containerDisplay: 'none',
    });
  });

  test('does not crash on the next click anywhere on the page', async () => {
    await failTheOpenAndResetErrors();

    await grid.clickPageBackground();
    await grid.clickPageBackground();
    await grid.clickPageBackground();

    // The exact DEV-41 crash: `Menu.onDocumentMouseDown` -> `close()` -> `#navigator.clear()`.
    // Bounded settle, so an error delivered a beat after the last click still fails this.
    await expect.poll(() => pageErrors).toEqual([]);
  });

  test('does not crash when clicking a grid cell', async () => {
    await failTheOpenAndResetErrors();

    await grid.cell(1, 1).click();

    // The grid stayed usable on the broken build — selection still worked — while every click
    // threw. So "the cell got selected" alone proves nothing; the error list is the assertion.
    await expect(grid.cell(1, 1)).toBeVisible();
    await expect.poll(() => pageErrors).toEqual([]);
  });

  test('opens normally once the item stops throwing', async () => {
    await failTheOpenAndResetErrors();

    await grid.stopThrowing();
    await grid.clickColumnMenuButton(0);

    // The recovery half. `DropdownMenu.open()` early-returns while `isOpened()` is true, so a
    // stranded menu could never be opened again — silence alone would not have caught that.
    await expect(grid.openMenu()).toBeVisible();
    await expect(grid.openMenu()).toContainText('Recovered item');
    await expect.poll(() => pageErrors).toEqual([]);
  });

  test('closes again cleanly after recovering', async () => {
    await failTheOpenAndResetErrors();

    await grid.stopThrowing();
    await grid.clickColumnMenuButton(0);
    await expect(grid.openMenu()).toBeVisible();

    await grid.clickPageBackground();

    // A menu reopened after a failed open must take the ordinary close path, navigator and all.
    await expect.poll(() => grid.menuState()).toEqual({
      isOpened: false,
      containerDisplay: 'none',
    });
    await expect.poll(() => pageErrors).toEqual([]);
  });

  test('destroys the grid cleanly, so the document listener cannot leak', async () => {
    // Read before the menu is ever touched, so the comparison is against a known-clean grid.
    const baseline = await grid.listenerCount();

    await failTheOpenAndResetErrors();

    // `destroy()` threw here on the broken build, which meant `eventManager.destroy()` never ran.
    expect(await grid.destroyGrid()).toBe('ok');

    // The listener count is what actually proves the "cannot leak" in this test's name. Watching
    // for a page error cannot: a leaked `mousedown` handler early-returns once the menu reports
    // itself closed, so a leaking build stays silent on the click below too.
    //
    // The bar is measured, not guessed. On this fixture: 148 before the menu is touched, 270 while
    // a menu is open, 176 after it closes again - and a FAILED open also lands on 176, twice in a
    // row, so the rollback ends as clean as an ordinary close and does not accumulate. A completed
    // `destroy()` takes it to 0; the build where `destroy()` threw never ran `eventManager
    // .destroy()` and sat at 176, which is what this assertion catches.
    await expect.poll(() => grid.listenerCount()).toBeLessThanOrEqual(baseline);

    await grid.clickPageBackground();

    await expect.poll(() => pageErrors).toEqual([]);
  });
});

/**
 * The rest of the bug class, reached WITHOUT a throw.
 *
 * `isOpened()` used to be `this.hotMenu !== null`, and `open()` assigns `hotMenu` before it builds
 * the menu, so for the whole build it said `true` about a menu with no navigator and no keyboard
 * controller yet. Anything that ran in that window and trusted the answer acted on a menu that was
 * not there — a throw is one way in, and these are the others. `isOpened()` now turns true only
 * once the menu is fully built, and the plugins' "is a menu already in play" guards ask the new
 * `isClosed()` instead.
 *
 * Two of the tests pin what did NOT change, which is how this stays a non-breaking fix: a nested
 * `open()` is still ignored, and every public show/hide hook still reads the same `isOpened()`.
 * Both plugins share the `Menu` class but each has its own `open()` guard, so each runs the set.
 */
for (const plugin of ['dropdownMenu', 'contextMenu'] as const) {
  test.describe(`${plugin}: an item callback that reaches into the menu while it opens`, () => {
    let grid: MenuOpenFailurePage;
    /** Uncaught page errors, newest last. */
    let pageErrors: string[];

    test.beforeEach(async({ page, theme, bundle }) => {
      pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      grid = new MenuOpenFailurePage(page, theme, bundle);
      await grid.goto();
    });

    test('isOpened() never claims a menu that cannot be driven yet', async() => {
      await grid.setItemMode('probe', plugin);
      await grid.openMenuOf(plugin);
      await expect(grid.openMenu(plugin)).toBeVisible();

      // One more paint, with the menu fully open this time.
      await grid.repaintMenu();

      const probes = await grid.probes();

      // Both phases were sampled. Without the second, the invariant below holds over nothing.
      expect(probes.some(probe => !probe.isOpened)).toBe(true);
      expect(probes.some(probe => probe.isOpened)).toBe(true);
      // The promise every caller relies on. Before, the paint during the build read `true` with no
      // navigator behind it — the same navigator `close()`, `focus()` and the Filters focus
      // controller all went on to dereference.
      expect(probes.filter(probe => probe.isOpened && !probe.canDrive)).toEqual([]);
      await expect.poll(() => pageErrors).toEqual([]);
    });

    test('a close() while the menu is still opening leaves a working menu', async() => {
      await grid.setItemMode('close', plugin);
      await grid.openMenuOf(plugin);

      // The open in progress wins. The close() lands while the menu grid is mid-build, and tearing
      // it down under its own `init()` is what broke the page before.
      await expect(grid.openMenu(plugin)).toBeVisible();
      await expect.poll(() => grid.menuState()).toEqual({ isOpened: true, containerDisplay: 'block' });

      // And it is a real menu, not a husk: the ordinary close path works on it.
      await grid.clickPageBackground();

      await expect.poll(() => grid.menuState()).toEqual({ isOpened: false, containerDisplay: 'none' });
      await expect.poll(() => pageErrors).toEqual([]);
    });

    test('a nested open() while the menu is still opening is ignored, as it always was', async() => {
      await grid.setItemMode('reopen', plugin);
      await grid.openMenuOf(plugin);
      await expect(grid.openMenu(plugin)).toBeVisible();
      await expect.poll(() => grid.menuState()).toMatchObject({ isOpened: true });

      // Announced once, not twice. This passed before the change too: the plugins' guards asked
      // `isOpened()`, which was already true mid-build. It is false mid-build now, so they ask
      // `isClosed()` — asking `isOpened()` here would announce the menu a second time.
      const log = await grid.hookLog();

      expect(log.filter(entry => entry.event === 'beforeShow')).toHaveLength(1);
      expect(log.filter(entry => entry.event === 'afterShow')).toHaveLength(1);
      await expect.poll(() => pageErrors).toEqual([]);
    });

    test('the public show and hide hooks read the same open state as before', async() => {
      await grid.setItemMode('none', plugin);
      await grid.openMenuOf(plugin);
      await expect(grid.openMenu(plugin)).toBeVisible();

      await grid.clickPageBackground();

      await expect.poll(() => grid.menuState()).toMatchObject({ isOpened: false });
      // `isOpened()` changed only for the moments the menu is being built or torn down, and no
      // public hook runs then. These three bracket those moments, and each must read what it always
      // read. This passed before the change too; it is what keeps the change non-breaking.
      expect(await grid.hookLog()).toEqual([
        { event: 'beforeShow', isOpened: false },
        { event: 'afterShow', isOpened: true },
        { event: 'afterHide', isOpened: false },
      ]);
    });

    test('a throwing item leaves the menu closed, and the next click clean', async() => {
      await grid.setItemMode('throw', plugin);
      await grid.openMenuOf(plugin);

      await expect.poll(() => pageErrors).toContain(await grid.itemErrorMessage());

      pageErrors.length = 0;

      await grid.clickPageBackground();

      await expect.poll(() => grid.menuState()).toEqual({ isOpened: false, containerDisplay: 'none' });
      await expect.poll(() => pageErrors).toEqual([]);
    });
  });
}
