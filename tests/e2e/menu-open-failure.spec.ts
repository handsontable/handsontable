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
  /** Uncaught page errors, newest last. Reset by each helper that needs a clean window. */
  let pageErrors: string[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    grid = new MenuOpenFailurePage(page, theme, bundle);
    await grid.goto();
  });

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
    await grid.clickColumnMenuButton(0);
    await expect.poll(() => pageErrors.length).toBeGreaterThan(0);

    // Only what happens AFTER the failed open matters here — the item's own throw above is
    // expected, and is pinned by its own test.
    pageErrors.length = 0;

    await grid.clickPageBackground();
    await grid.clickPageBackground();
    await grid.clickPageBackground();

    // The exact DEV-41 crash: `Menu.onDocumentMouseDown` -> `close()` -> `#navigator.clear()`.
    expect(pageErrors).toEqual([]);
  });

  test('does not crash when clicking a grid cell', async () => {
    await grid.clickColumnMenuButton(0);
    pageErrors.length = 0;

    await grid.cell(1, 1).click();

    // The grid stayed usable on the broken build — selection still worked — while every click
    // threw. So "the cell got selected" alone proves nothing; the error list is the assertion.
    await expect(grid.cell(1, 1)).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('opens normally once the item stops throwing', async () => {
    await grid.clickColumnMenuButton(0);
    pageErrors.length = 0;

    await grid.stopThrowing();
    await grid.clickColumnMenuButton(0);

    // The recovery half. `DropdownMenu.open()` early-returns while `isOpened()` is true, so a
    // stranded menu could never be opened again — silence alone would not have caught that.
    await expect(grid.openMenu()).toBeVisible();
    await expect(grid.openMenu()).toContainText('Recovered item');
    expect(pageErrors).toEqual([]);
  });

  test('closes again cleanly after recovering', async () => {
    await grid.clickColumnMenuButton(0);
    await grid.stopThrowing();
    await grid.clickColumnMenuButton(0);
    await expect(grid.openMenu()).toBeVisible();

    pageErrors.length = 0;
    await grid.clickPageBackground();

    // A menu reopened after a failed open must take the ordinary close path, navigator and all.
    await expect.poll(() => grid.menuState()).toEqual({
      isOpened: false,
      containerDisplay: 'none',
    });
    expect(pageErrors).toEqual([]);
  });

  test('destroys the grid cleanly, so the document listener cannot leak', async () => {
    await grid.clickColumnMenuButton(0);
    pageErrors.length = 0;

    // `destroy()` threw here on the broken build, which meant `eventManager.destroy()` never ran
    // and the `document` mousedown listener outlived the grid — the "fast change of page" in the
    // DEV-41 reports, where the leaked listener kept throwing on the next SPA route.
    expect(await grid.destroyGrid()).toBe('ok');

    await grid.clickPageBackground();

    expect(pageErrors).toEqual([]);
  });
});
