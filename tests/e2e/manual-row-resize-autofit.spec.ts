import { test, expect } from '../fixtures/test';
import { ManualRowResizeAutofitPage } from '../fixtures/pages/ManualRowResizeAutofitPage';

/**
 * Double-clicking a row's resize handle fits the row to its content.
 *
 * Both cases used to live in the frozen Jasmine suite (`manualRowResize.spec.js`, "should autosize
 * selected rows after double click on handler" and "... and move mouse to the next row"), which
 * simulated the events and then waited a fixed number of animation frames for the autofit. The
 * autofit does not run on the double-click: the first press arms a 500ms timer and the fit happens
 * when it fires. A frame count is a different clock, so on a loaded runner the check came before
 * the timer ("Expected 100 to be around 26"), and passed when the spec ran alone. Here the heights
 * are polled, so the test waits for the fit and not for a guess at how long it takes.
 *
 * The gestures are the user's: a drag on the handle to stretch a row, a press-move-release over
 * the row headers to select rows, and a double-click on the handle, which brings a stretched row
 * back to the height its content needs. That height is the grid's default row height, read from
 * the grid because the theme decides it, and a rendered height counts as equal within a pixel, as
 * the Jasmine cases compared them. Each case asserts the stretched heights first, so it cannot
 * pass on a grid whose rows never moved.
 */

/**
 * The height row 2 is stretched to before it is autofit, far above every theme's default row height.
 */
const TALL_ROW_PX = 300;

/**
 * The height row 1 is stretched to before it is autofit.
 */
const STRETCHED_ROW_PX = 100;

test.describe('Manual row resize autofit on a double-click', () => {
  let grid: ManualRowResizeAutofitPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualRowResizeAutofitPage(page, theme, bundle);
    await grid.goto();
  });

  // A user stretches row 2, selects rows 1-3 by dragging over their headers, and double-clicks the
  // handle on the last header: every selected row goes back to its default height, the stretched
  // one included.
  test('fits every selected row to its content when the handle is double-clicked', async() => {
    await grid.resizeRowTo(2, TALL_ROW_PX);
    await grid.selectRowsByHeaders(1, 3);

    // The premise: three rows are selected through their headers, the middle one stands at the
    // stretched height, and the other two are at the default. Without it a gesture that selected
    // nothing, or stretched nothing, would leave the check below nothing to prove.
    await expect.poll(() => grid.selectedRows(), { message: 'rows 1-3 are selected through their headers' })
      .toEqual({ first: 1, last: 3, byRowHeader: true });
    await expect.poll(() => grid.heightOffsets([1, 2, 3], [null, TALL_ROW_PX, null]), {
      message: 'rows 1 and 3 are at the default height and row 2 is stretched',
    }).toEqual([0, 0, 0]);

    // The pointer rests on the last header, and the handle is on the boundary under it.
    await grid.expectRowHandleOn(3);
    await grid.dblclickRowHandle();

    await expect.poll(() => grid.heightOffsets([1, 2, 3], [null, null, null]), {
      message: 'rows 1, 2 and 3 are at the default height after the double-click',
    }).toEqual([0, 0, 0]);
  });

  // A user stretches row 1, shows its handle, double-clicks it and moves on to the next row's header
  // at once: the double-clicked row is the one that gets fitted, not the row the pointer reached.
  test('fits the double-clicked row when the pointer moves to the next row right after it', async() => {
    await grid.resizeRowTo(1, STRETCHED_ROW_PX);
    await grid.showRowHandle(1);

    // The premise: row 1 stands at the stretched height, under the handle about to be pressed.
    await expect.poll(() => grid.heightOffsets([1], [STRETCHED_ROW_PX]), {
      message: 'row 1 is stretched before the double-click',
    }).toEqual([0]);

    await grid.dblclickRowHandleThenMoveOnto(2);

    await expect.poll(() => grid.heightOffsets([1], [null]), {
      message: 'row 1 is at the default height after the double-click',
    }).toEqual([0]);
  });
});
