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
 * cadence under test is exact — no sleeps. `click` is the last event the browser
 * synthesizes after a tap, so `grid.settleOnClicks()` (poll the click counter) is the
 * settle barrier for the browser's asynchronous compatibility sequence; the mouse
 * counters are then read with `grid.expectHookCountExactly()`, a plain (non-polling)
 * assertion, so an over-count fails instead of passing on a first match.
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

  test('a first tap on an unselected cell is preventDefault-ed: no synthesized mouse pair, hooks fire once', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(100);

    await grid.expectHookCountExactly('click', 0);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 1);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 1);
    await grid.expectEditorClosed();
  });

  test('a double-tap at a 700 ms cadence opens the editor', async ({ page }) => {
    // Select-first protocol from the ticket: one tap selects, then the double-tap.
    await grid.tapCell(1, 1);
    await page.clock.runFor(1500);

    await grid.tapCell(1, 1);
    await page.clock.runFor(700);
    await grid.tapCell(1, 1);

    // Click count Chromium synthesizes: the select-first tap is preventDefault-ed (0), the second
    // tap lands on the already-selected cell and synthesizes a pair (1), and so does the third (2).
    await grid.settleOnClicks(2);
    await grid.expectHookCount('afterBeginEditing', 1);
    await grid.expectEditorOpen();
  });

  test('two taps more than a second apart are not a double-tap, and the second tap\'s synthesized mouse pair is ignored', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(1200);
    await grid.tapCell(1, 1);

    // The second tap hits an already-selected cell, so the browser synthesizes a mouse pair here
    // (the first tap is preventDefault-ed and gets none) — both halves must be dropped. This is
    // the test that proves the symmetric drop: pre-fix, the dropped mousedown would leak through
    // and beforeOnCellMouseDown would read 3.
    await grid.settleOnClicks(1);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 2);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 2);
    await grid.expectEditorClosed();
  });

  test('tapping a context-menu item runs the command once (#12803 stays fixed)', async ({ page }) => {
    await grid.tapCell(1, 1);
    await grid.openContextMenu(1, 1);

    await grid.tapContextMenuItem('Insert row above');

    await grid.expectHookCount('afterCreateRow', 1);

    // The menu tap's synthesized click lands on the ContextMenu's own Handsontable root, not the
    // fixture's main grid — the capture-phase counter attached to the main grid stays 0, so a
    // fixed wait is the barrier here instead of `settleOnClicks()`.
    await page.clock.runFor(100);
    await grid.expectHookCountExactly('afterCreateRow', 1);
    expect(await grid.rowCount()).toBe(6);
  });

  test('mouse events without an origin right after a tap are ignored, then accepted once the window passed', async ({ page }) => {
    // Script-dispatched events carry sourceCapabilities === null, which is the
    // WebKit/Firefox path: the engine falls back to the 500 ms window after the tap.
    await grid.tapCell(1, 1);
    await page.clock.runFor(100);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 1);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 1);

    // The first script-dispatched pair after the tap: both halves are the dropped synthesized
    // pair, and the mouseup half consumes #synthesizedPairPending.
    await grid.dispatchMouseEvent(1, 1, 'mousedown');
    await grid.dispatchMouseEvent(1, 1, 'mouseup');

    await page.clock.runFor(100);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 1);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 1);

    // Consume-once proof: still inside the TOUCH_SYNTHESIZED_MOUSE_WINDOW ceiling, but the pair
    // was already consumed by the previous mouseup, so this THIRD script pair is processed as a
    // real click — counters go 1 -> 2. This is the assertion that fails if #synthesizedPairPending
    // is not reset on mouseup (the pre-fix gate would keep dropping every event for the whole
    // 500 ms ceiling).
    await grid.dispatchMouseEvent(1, 1, 'mousedown');
    await grid.dispatchMouseEvent(1, 1, 'mouseup');

    await page.clock.runFor(100);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 2);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 2);

    await page.clock.runFor(600);

    // Well past the ceiling too: a fourth pair is processed just the same.
    await grid.dispatchMouseEvent(1, 1, 'mousedown');
    await grid.dispatchMouseEvent(1, 1, 'mouseup');

    await page.clock.runFor(100);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 3);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 3);

    // None of the late pairs pair with the tap.
    await grid.expectEditorClosed();
  });

  test('a tap followed by a real mouse click on the same cell does not open the editor', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(300);

    // A physical mouse click: Chromium reports firesTouchEvents === false, so it is processed.
    await grid.clickCell(1, 1);

    // Tap on an unselected cell synthesizes no click (0); the real mouse click is a trusted click (1).
    await grid.settleOnClicks(1);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 2);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 2);
    await grid.expectEditorClosed();
  });

  test('a drifted tap that the touch path treats as a scroll still lets the browser mouse pair select the cell', async ({ page }) => {
    // Script-dispatched touch events (no sourceCapabilities): touchstart, a 20 px touchmove,
    // touchend. Walkontable treats the gesture as a scroll and fires no cell mouse hooks.
    await grid.dispatchTouchDrag(2, 1, 20);
    await page.clock.runFor(100);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 0);

    // The pair is what Blink synthesizes after a drifted gesture and carries
    // firesTouchEvents === true; the touch path left no stamp, so it must be processed.
    await grid.dispatchMouseEvent(2, 1, 'mousedown', true);
    await grid.dispatchMouseEvent(2, 1, 'mouseup', true);

    await page.clock.runFor(100);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 1);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 1);
    await grid.expectSelectedCell(2, 1);
  });
});
