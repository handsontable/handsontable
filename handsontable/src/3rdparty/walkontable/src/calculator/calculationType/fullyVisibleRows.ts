import type { ViewportRowsCalculator } from '../viewportRows';

/**
 * @class FullyVisibleRowsCalculationType
 */
export class FullyVisibleRowsCalculationType {
  /**
   * Total number of fully visible rows in the viewport.
   *
   * @type {number}
   */
  count: number = 0;
  /**
   * The row index of the first fully visible row in the viewport.
   *
   * @type {number|null}
   */
  startRow: number | null = null;
  /**
   * The row index of the last fully visible row in the viewport.
   *
   * @type {number|null}
   */
  endRow: number | null = null;
  /**
   * Position of the first fully visible row (in px).
   *
   * @type {number|null}
   */
  startPosition: number | null = null;
  /**
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer: boolean = false;

  /**
   * Initializes the calculation.
   */
  initialize(): void { // intentionally empty
  }

  /**
   * Processes the row.
   *
   * @param {number} row The row index.
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  process(row: number, viewportCalculator: ViewportRowsCalculator): void {
    const {
      totalCalculatedHeight,
      zeroBasedScrollOffset,
      innerViewportHeight,
      rowHeight,
    } = viewportCalculator;

    if (
      totalCalculatedHeight >= zeroBasedScrollOffset &&
      totalCalculatedHeight + rowHeight <= innerViewportHeight
    ) {
      if (this.startRow === null) {
        this.startRow = row;
      }

      this.endRow = row;
    }
  }

  /**
   * Finalizes the calculation.
   *
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator: ViewportRowsCalculator): void {
    const {
      scrollOffset,
      viewportHeight,
      horizontalScrollbarHeight,
      totalRows,
      needReverse,
      positionCache,
      rowHeight,
    } = viewportCalculator;

    // If the estimation has reached the last row and there is still some space available in the viewport,
    // we need to render in reverse in order to fill the whole viewport with rows
    if (this.endRow === totalRows - 1 && needReverse) {
      this.startRow = this.endRow;

      while (this.startRow > 0) {
        const calculatedViewportHeight = positionCache.getOffset(this.endRow) +
          rowHeight -
          positionCache.getOffset(this.startRow - 1);

        if (calculatedViewportHeight <= viewportHeight - horizontalScrollbarHeight) {
          this.startRow -= 1;
        }

        if (calculatedViewportHeight >= viewportHeight - horizontalScrollbarHeight) {
          break;
        }
      }
    }

    this.startPosition = this.startRow !== null ? positionCache.getOffset(this.startRow) : null;

    const mostBottomScrollOffset = scrollOffset + viewportHeight - horizontalScrollbarHeight;
    const topRowOffset = this.startRow === null ? 0 : viewportCalculator.getRowHeight(this.startRow);

    if (
      mostBottomScrollOffset < topRowOffset ||
      scrollOffset > positionCache.getOffset(viewportCalculator.lastProcessedIndex)
    ) {
      this.isVisibleInTrimmingContainer = false;
    } else {
      this.isVisibleInTrimmingContainer = true;
    }

    if (totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}
