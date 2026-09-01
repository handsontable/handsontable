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

    // A real mouse click is a positive barrier: its trusted `click` lands after anything the tap
    // could still have in flight, so the counts below are final — the tap contributed exactly one
    // mousedown/mouseup and no synthesized pair.
    await grid.clickCell(1, 1);
    await grid.settleOnClicks(1);

    await grid.expectHookCountExactly('beforeOnCellMouseDown', 2);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 2);
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
    await grid.expectHookCountExactly('afterBeginEditing', 1);
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

  test('tapping a context-menu item runs the command once (#12803 stays fixed)', async () => {
    await grid.tapCell(1, 1);
    await grid.openContextMenu(1, 1);

    await grid.tapContextMenuItem('Insert row above');

    // Click trace with the document-wide counter: the first tap lands on an unselected cell and
    // is preventDefault-ed, synthesizing nothing (0); the right-click that opens the context menu
    // never fires a `click` event at all — Chromium fires `click` only for the primary button (0);
    // the menu item's `.tap()` synthesizes one click on the ContextMenu's own Handsontable root,
    // which the document-wide listener now covers (1). Total: 1 — the settle barrier for the
    // duplicate-command guard this test exists for (#12803).
    await grid.settleOnClicks(1);
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

  test('a drifted gesture over the selected cell lets the browser mouse pair through on the fallback path', async ({ page }) => {
    // Select the cell first; its own tap is preventDefault-ed and synthesizes nothing.
    await grid.tapCell(2, 1);
    await page.clock.runFor(200);

    // Drift over the SELECTED cell — nothing is preventDefault-ed there, so real engines do
    // synthesize a compatibility pair for this gesture; its touchend (scroll branch) cleared the
    // pending flag, so the pair, carrying no origin information, must be processed. The counts
    // are absolute on purpose: the tap above contributed exactly one mousedown/mouseup, and a
    // scroll-classified drift must contribute none — this is the assertion that proves the
    // deferred-mousedown scroll classification (#11659) still holds.
    await grid.dispatchTouchDrag(2, 1, 20);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 1);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 1);

    await grid.dispatchMouseEvent(2, 1, 'mousedown');
    await grid.dispatchMouseEvent(2, 1, 'mouseup');

    await grid.expectHookCountExactly('beforeOnCellMouseDown', 2);
    await grid.expectHookCountExactly('beforeOnCellMouseUp', 2);
    await grid.expectEditorClosed();
  });

  test('a scroll gesture between two taps cancels the double-tap pairing', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(200);

    // A drifted (scroll-classified) gesture on the same cell resets the tap detector.
    await grid.dispatchTouchDrag(1, 1, 20);
    await page.clock.runFor(200);

    await grid.tapCell(1, 1);
    await page.clock.runFor(100);

    await grid.expectHookCountExactly('afterBeginEditing', 0);
    await grid.expectEditorClosed();
  });

  test('a pair armed by a tap that synthesized nothing does not swallow the next gesture\'s pair', async ({ page }) => {
    // First tap on an unselected cell: preventDefault-ed, no pair arrives, but the gate was armed.
    await grid.tapCell(1, 1);
    await page.clock.runFor(200);

    // A drifted gesture ON THE SELECTED CELL, still inside the armed ceiling: selectedCellWasTouched()
    // is true, so nothing is preventDefault-ed and Blink does synthesize a pair for it (firesTouchEvents
    // === true, no veto). The touch path left no stamp, and the scroll-classified touchend cleared the
    // still-pending flag from the first tap, so this gesture's own pair must be processed.
    await grid.dispatchTouchDrag(1, 1, 20);
    await grid.dispatchMouseEvent(3, 1, 'mousedown', true);
    await grid.dispatchMouseEvent(3, 1, 'mouseup', true);

    await grid.expectSelectedCell(3, 1);
  });

  test('a cancelled gesture does not leave real mouse clicks pairing as taps', async ({ page }) => {
    await grid.dispatchTouchCancel(1, 1);

    // The cancel also killed the long-press timer: well past LONG_PRESS_DELAY nothing fires —
    // no long-press mousedown, no synthetic contextmenu.
    await page.clock.runFor(600);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 0);
    await grid.expectContextMenuClosed();

    // Two real right-clicks on the same cell inside the double-tap window: with touchApplied
    // stuck they would route into the tap detector and open the editor.
    await grid.openContextMenu(1, 1);
    await page.keyboard.press('Escape');
    await page.clock.runFor(300);
    await grid.openContextMenu(1, 1);
    await page.keyboard.press('Escape');
    await page.clock.runFor(100);

    await grid.expectHookCountExactly('afterBeginEditing', 0);
    await grid.expectEditorClosed();
  });

  test('a cancelled gesture does not leave a stale pending pair swallowing the next real mouse pair', async ({ page }) => {
    // First tap on an unselected cell: preventDefault-ed, no pair arrives, but the gate was armed.
    await grid.tapCell(1, 1);
    await page.clock.runFor(200);

    // The next gesture is cancelled, not ended: the cancel must clear the leftover flag the same
    // way a scroll gesture's touchend does.
    await grid.dispatchTouchCancel(2, 1);

    // A real mouse pair with no origin information (the WebKit/Firefox fallback), still inside
    // the 500 ms ceiling from the tap: were the stale flag to survive the cancel, the mousedown
    // half would be dropped and the selection would stay on the tapped cell.
    await grid.dispatchMouseEvent(3, 1, 'mousedown');
    await grid.dispatchMouseEvent(3, 1, 'mouseup');

    await grid.expectSelectedCell(3, 1);
  });

  test('a cancelled long-press releases the mouse-down flag: no drag-selection follows', async ({ page }) => {
    // A held touch: the long-press timer fires the mousedown (selecting the cell) and opens the
    // context menu through the synthetic contextmenu event.
    await grid.dispatchTouchEvent(1, 1, 'touchstart');
    await page.clock.runFor(600);
    await grid.expectHookCountExactly('beforeOnCellMouseDown', 1);
    await grid.expectSelectedCell(1, 1);
    await grid.expectContextMenuOpen();

    // The system claims the touch: no touchend follows, so no mouseup ever pairs the long-press
    // mousedown — only the cancel path can release the mouse-down flag.
    await grid.dispatchTouchEvent(1, 1, 'touchcancel');
    await page.keyboard.press('Escape');

    // A mousemove far outside the viewport: with the mouse-down flag stuck, drag-selection would
    // extend the selection to the nearest edge cell.
    await grid.dispatchMouseMove(10_000, 10_000);
    await grid.expectSelectedCell(1, 1);
  });
});
