import type { ViewportColumnsCalculator } from '../viewportColumns';

/**
 * @class PartiallyVisibleColumnsCalculationType
 */
export class PartiallyVisibleColumnsCalculationType {
  /**
   * Total number of partially visible columns in the viewport.
   *
   * @type {number}
   */
  count: number = 0;
  /**
   * The column index of the first partially visible column in the viewport.
   *
   * @type {number|null}
   */
  startColumn: number | null = null;
  /**
   * The column index of the last partially visible column in the viewport.
   *
   * @type {number|null}
   */
  endColumn: number | null = null;
  /**
   * Position of the first partially visible column (in px).
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
   * Processes the column.
   *
   * @param {number} column The column index.
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  process(column: number, viewportCalculator: ViewportColumnsCalculator): void {
    const {
      totalCalculatedWidth,
      zeroBasedScrollOffset,
      viewportWidth,
    } = viewportCalculator;

    if (totalCalculatedWidth <= zeroBasedScrollOffset) {
      this.startColumn = column;
    }

    const compensatedViewportWidth = zeroBasedScrollOffset > 0 ? viewportWidth + 1 : viewportWidth;

    if (
      totalCalculatedWidth >= zeroBasedScrollOffset &&
      totalCalculatedWidth <= zeroBasedScrollOffset + compensatedViewportWidth
    ) {
      if (this.startColumn === null || this.startColumn === undefined) {
        this.startColumn = column;
      }
    }

    this.endColumn = column;
  }

  /**
   * Finalizes the calculation.
   *
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator: ViewportColumnsCalculator): void {
    const {
      scrollOffset,
      viewportWidth,
      inlineStartOffset,
      zeroBasedScrollOffset,
      totalColumns,
      needReverse,
      positionCache,
      columnWidth,
    } = viewportCalculator;

    if (!positionCache) {
      return;
    }

    // If the estimation has reached the last column and there is still some space available in the viewport,
    // we need to render in reverse in order to fill the whole viewport with columns
    if (this.endColumn === totalColumns - 1 && needReverse) {
      this.startColumn = this.endColumn;

      while (this.startColumn > 0) {
        const calculatedViewportWidth = positionCache.getOffset(this.endColumn) +
          columnWidth -
          positionCache.getOffset(this.startColumn - 1);

        this.startColumn -= 1;

        if (calculatedViewportWidth > viewportWidth) {
          break;
        }
      }
    }

    this.startPosition = this.startColumn !== null ? positionCache.getOffset(this.startColumn) : null;

    const compensatedViewportWidth = zeroBasedScrollOffset > 0 ? viewportWidth + 1 : viewportWidth;
    const mostRightScrollOffset = scrollOffset + viewportWidth - compensatedViewportWidth;

    if (
      // the table is to the left of the viewport
      (
        mostRightScrollOffset < (-1) * inlineStartOffset ||
        scrollOffset > positionCache.getOffset(viewportCalculator.lastProcessedIndex) + columnWidth
      ) ||
      // the table is to the right of the viewport
      (((-1) * scrollOffset) - viewportWidth > 0)
    ) {
      this.isVisibleInTrimmingContainer = false;
    } else {
      this.isVisibleInTrimmingContainer = true;
    }

    if (this.endColumn !== null && totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null && this.endColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }
}
