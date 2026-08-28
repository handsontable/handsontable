import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { TouchTapToEditPage } from '../fixtures/pages/TouchTapToEditPage';

/**
 * Regression spec for DEV-2687: double-tap-to-edit became nondeterministic on iPad
 * (desktop UA WebKit) after #12804 dropped only the synthesized `mouseup` that
 * follows a touch tap. Desktop UA + `hasTouch` reproduces the iPad listener setup
 * (both touch and mouse listeners) in Chromium, which synthesizes the same
 * mousedown/mouseup/click sequence after every tap.
 *
 * `page.clock` drives the double-click pairing timers and `Date.now()` so the
 * cadence under test is exact — no sleeps.
 */
test.use({
  ...devices['Desktop Chrome'],
  hasTouch: true,
  browserName: 'chromium',
});

const CLOCK_START = new Date('2026-08-28T10:00:00Z');

test.describe('touch tap-to-edit on a device with touch and mouse listeners', () => {
  let grid: TouchTapToEditPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    await page.clock.install({ time: CLOCK_START });
    grid = new TouchTapToEditPage(page, theme, bundle);
    await grid.goto();
    await page.clock.pauseAt(CLOCK_START.getTime() + 60_000);
  });

  test('a single tap fires the cell mouse hooks once — a first tap on an unselected cell is preventDefault-ed by Walkontable, so the browser synthesizes no mouse pair', async () => {
    await grid.tapCell(1, 1);

    await grid.expectHookCount('beforeOnCellMouseDown', 1);
    await grid.expectHookCount('beforeOnCellMouseUp', 1);
    await grid.expectEditorClosed();
  });

  test('a double-tap at a 700 ms cadence opens the editor', async ({ page }) => {
    // Select-first protocol from the ticket: one tap selects, then the double-tap.
    await grid.tapCell(1, 1);
    await page.clock.runFor(1500);

    await grid.tapCell(1, 1);
    await page.clock.runFor(700);
    await grid.tapCell(1, 1);
    await page.clock.runFor(50);

    await grid.expectEditorOpen();
    await grid.expectHookCount('afterBeginEditing', 1);
  });

  test('two taps more than a second apart are not a double-tap, and the second tap\'s synthesized mouse pair is ignored', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(1200);
    await grid.tapCell(1, 1);
    await page.clock.runFor(50);

    // The second tap hits an already-selected cell, so the browser synthesizes a mouse pair
    // here (a first tap is preventDefault'ed and gets none) — both halves must be dropped.
    await grid.expectHookCount('beforeOnCellMouseDown', 2);
    await grid.expectHookCount('beforeOnCellMouseUp', 2);
    await grid.expectEditorClosed();
  });

  test('tapping a context-menu item runs the command once (#12803 stays fixed)', async () => {
    await grid.tapCell(1, 1);
    await grid.openContextMenu(1, 1);

    await grid.tapContextMenuItem('Insert row above');

    await grid.expectHookCount('afterCreateRow', 1);
    expect(await grid.rowCount()).toBe(6);
  });

  test('mouse events without an origin right after a tap are ignored, then accepted once the window passed', async ({ page }) => {
    // Script-dispatched events carry sourceCapabilities === null, which is the
    // WebKit/Firefox path: the engine falls back to the 500 ms window after the tap.
    await grid.tapCell(1, 1);
    await grid.expectHookCount('beforeOnCellMouseDown', 1);
    await grid.expectHookCount('beforeOnCellMouseUp', 1);

    await grid.dispatchMouseEvent(1, 1, 'mousedown');
    await grid.dispatchMouseEvent(1, 1, 'mouseup');

    await grid.expectHookCount('beforeOnCellMouseDown', 1);
    await grid.expectHookCount('beforeOnCellMouseUp', 1);

    await page.clock.runFor(600);

    await grid.dispatchMouseEvent(1, 1, 'mousedown');
    await grid.dispatchMouseEvent(1, 1, 'mouseup');

    await grid.expectHookCount('beforeOnCellMouseDown', 2);
    await grid.expectHookCount('beforeOnCellMouseUp', 2);

    // The late pair is a real click as far as the grid can tell; it does not pair with the tap.
    await grid.expectEditorClosed();
  });

  test('a tap followed by a real mouse click on the same cell does not open the editor', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(300);

    // A physical mouse click: Chromium reports firesTouchEvents === false, so it is processed.
    await grid.clickCell(1, 1);
    await page.clock.runFor(50);

    await grid.expectHookCount('beforeOnCellMouseDown', 2);
    await grid.expectHookCount('beforeOnCellMouseUp', 2);
    await grid.expectEditorClosed();
  });

  test('a drifted tap that the touch path treats as a scroll still lets the browser mouse pair select the cell', async () => {
    // Script-dispatched touch events (no sourceCapabilities): touchstart, a 20 px touchmove,
    // touchend. Walkontable treats the gesture as a scroll and fires no cell mouse hooks.
    await grid.dispatchTouchDrag(2, 1, 20);
    await grid.expectHookCount('beforeOnCellMouseDown', 0);

    // The pair is what Blink synthesizes after a drifted gesture and carries
    // firesTouchEvents === true; the touch path left no stamp, so it must be processed.
    await grid.dispatchMouseEvent(2, 1, 'mousedown', true);
    await grid.dispatchMouseEvent(2, 1, 'mouseup', true);

    await grid.expectHookCount('beforeOnCellMouseDown', 1);
    await grid.expectHookCount('beforeOnCellMouseUp', 1);
    await grid.expectSelectedCell(2, 1);
  });
});
