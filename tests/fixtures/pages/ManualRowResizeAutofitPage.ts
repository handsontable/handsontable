import { type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';
import { ManualResizePage } from './ManualResizePage';

/**
 * How far a rendered row height may sit from the height a test expects, in CSS pixels. It is the
 * tolerance the frozen Jasmine suite compared these heights with (`toBeAroundValue`, inclusive).
 */
export const ROW_HEIGHT_TOLERANCE_PX = 1;

/**
 * What a selection by row headers looks like, read from the grid.
 */
export type RowSelection = {
  /** The first selected visual row. */
  first: number,
  /** The last selected visual row. */
  last: number,
  /** Whether the selection came from the row headers, which is what makes a resize cover every row. */
  byRowHeader: boolean,
};

/**
 * Page Object for the double-click autofit fixture.
 *
 * The locators and the reveal and drag gestures come from `ManualResizePage`. What this fixture
 * adds is a nine-row grid with row headers only, the gestures a double-click autofit needs on top
 * of them (selecting rows through their headers with a real pointer, double-clicking the handle),
 * and a one-round-trip read of the rendered row heights.
 */
export class ManualRowResizeAutofitPage extends ManualResizePage {
  /**
   * A data cell, addressed by the visual indexes the fixture stamps on it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * How far each row's rendered height sits from the height expected for it, in CSS pixels, read in
   * ONE `evaluate` together with the grid's own default row height.
   *
   * Two reads (the heights, then the default) could straddle a re-render, and `boundingBox()` or
   * `locator.evaluate()` per row resolve a node that Walkontable may recycle in between
   * (tests/AGENTS.md, Determinism). The master's cells are read, because the rows here are never
   * frozen.
   *
   * An offset within `ROW_HEIGHT_TOLERANCE_PX` reads as `0` and a larger one as itself, so a poll
   * pins the exact array `[0, 0, 0]` and a failure prints how far the offending row is.
   *
   * @param {number[]} rows The visual row indexes to read.
   * @param {Array<number | null>} expected One entry per row: the height the row should render at, or
   *                                        `null` for the grid's default row height (read from the grid,
   *                                        so it follows the theme).
   * @returns {Promise<number[]>}
   */
  async heightOffsets(rows: number[], expected: (number | null)[]): Promise<number[]> {
    const { heights, defaultHeight } = await this.page.evaluate((visualRows) => {
      const hot = (window as unknown as {
        hot: {
          getCell: (row: number, col: number, topmost: boolean) => HTMLElement,
          view: { _wt: { wtSettings: { getSetting: (name: string) => { getDefaultRowHeight: () => number } } } },
        },
      }).hot;

      return {
        defaultHeight: hot.view._wt.wtSettings.getSetting('stylesHandler').getDefaultRowHeight(),
        heights: visualRows.map(row => hot.getCell(row, 0, true).offsetHeight),
      };
    }, rows);

    return heights.map((height, index) => {
      const offset = height - (expected[index] ?? defaultHeight);

      return Math.abs(offset) <= ROW_HEIGHT_TOLERANCE_PX ? 0 : offset;
    });
  }

  /**
   * The rows the grid has selected, read in one round trip.
   *
   * @returns {Promise<RowSelection | null>} `null` when nothing is selected.
   */
  async selectedRows(): Promise<RowSelection | null> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as {
        hot: {
          getSelectedRangeLast: () => {
            getTopStartCorner: () => { row: number },
            getBottomEndCorner: () => { row: number },
          } | undefined,
          selection: { isSelectedByRowHeader: () => boolean },
        },
      }).hot;
      const range = hot.getSelectedRangeLast();

      if (!range) {
        return null;
      }

      return {
        first: range.getTopStartCorner().row,
        last: range.getBottomEndCorner().row,
        byRowHeader: hot.selection.isSelectedByRowHeader(),
      };
    });
  }

  /**
   * How far the row resize handle's center sits from the boundary under a row header, in CSS pixels
   * (`NaN` while the plugin has not attached the handle). The plugin draws the handle centered one
   * pixel above the row's bottom boundary, so a handle that belongs to another header reads far from
   * zero. Read in one round trip, with the header, so both describe one frame.
   *
   * @param {number} row The visual row index of the header.
   * @returns {Promise<number>}
   */
  async handleDistanceFromRowBoundary(row: number): Promise<number> {
    return this.page.evaluate((visualRow) => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const header = grid.querySelectorAll('.ht_clone_inline_start tbody tr')[visualRow]?.querySelector('th');
      const handle = grid.querySelector('.manualRowResizer');

      if (!header || !handle) {
        return Number.NaN;
      }

      const headerBox = header.getBoundingClientRect();
      const handleBox = handle.getBoundingClientRect();

      return Math.abs(((handleBox.top + handleBox.bottom) / 2) - (headerBox.bottom - 1));
    }, row);
  }

  /**
   * Waits until the plugin has drawn the row resize handle on a row header's boundary. The handle is
   * attached once and moved from header to header, so "the handle is visible" would also pass for a
   * handle still left on the previous header.
   *
   * @param {number} row The visual row index of the header.
   */
  async expectRowHandleOn(row: number): Promise<void> {
    await expect.poll(() => this.handleDistanceFromRowBoundary(row), {
      message: `the row resize handle sits on the boundary of row ${row}`,
    }).toBeLessThanOrEqual(1);
  }

  /**
   * Hovers a row header and waits until the handle has moved onto its boundary: the state a user
   * sees before pressing the handle.
   *
   * @param {number} row The visual row index.
   */
  async showRowHandle(row: number): Promise<void> {
    await this.hoverRowHeader(row);
    await this.expectRowHandleOn(row);
  }

  /**
   * Resizes a row to a rendered height by dragging its resize handle, the way a user does, and
   * waits until the row renders at that height.
   *
   * @param {number} row The visual row index.
   * @param {number} height The height the row should render at, in CSS pixels.
   */
  async resizeRowTo(row: number, height: number): Promise<void> {
    const startHeight = await this.page.evaluate(visualRow => (window as unknown as {
      hot: { getCell: (row: number, col: number, topmost: boolean) => HTMLElement }
    }).hot.getCell(visualRow, 0, true).offsetHeight, row);

    await this.dragRowHandle(row, height - startHeight);

    await expect.poll(() => this.heightOffsets([row], [height]), {
      message: `row ${row} renders at ${height}px after the drag`,
    }).toEqual([0]);
  }

  /**
   * Selects the rows from `first` to `last` the way a user does: presses the pointer on the first
   * row header, moves it over the headers in between and releases it on the last one. Every move is
   * a real pointer event, so the pointer ends on the last header, which is where the handle follows.
   *
   * @param {number} first The visual row index to press on.
   * @param {number} last The visual row index to release on.
   */
  async selectRowsByHeaders(first: number, last: number): Promise<void> {
    await this.rowHeader(first).hover();
    await this.page.mouse.down();

    for (let row = first + 1; row <= last; row++) {
      await this.rowHeader(row).hover();
    }

    await this.page.mouse.up();
  }

  /**
   * Double-clicks the row resize handle, with the two presses as close together as the browser sends
   * them, so they fall inside the plugin's double-click window.
   */
  async dblclickRowHandle(): Promise<void> {
    await this.rowHandle.dblclick();
  }

  /**
   * Double-clicks the row resize handle and moves the pointer onto another row's header right after
   * it, still inside the plugin's double-click window. The header's position is read BEFORE the
   * double-click, while the layout stands as the user left it: the autofit that follows moves the
   * rows below the double-clicked one, and reading it afterwards would aim at wherever they went.
   *
   * @param {number} row The visual row index of the header to move onto.
   */
  async dblclickRowHandleThenMoveOnto(row: number): Promise<void> {
    const box = await this.rowHeader(row).boundingBox();

    if (!box) {
      throw new Error(`Row header ${row} has no layout box.`);
    }

    await this.dblclickRowHandle();
    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
  }

  /**
   * Navigate, wait for the grid to be built (the shared `awaitFixtureBuilt()` rethrows a constructor
   * failure the fixture captured in `htBuildError`, with its cause, rather than letting it surface as a
   * visibility timeout), and wait for the row headers and the first cell to render - a real DOM
   * condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-row-resize-autofit.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);

    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.rowHeader(8)).toBeVisible();
  }
}
