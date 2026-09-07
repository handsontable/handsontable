import type { ViewportColumnsCalculator } from '../viewportColumns';

/**
 * @class FullyVisibleColumnsCalculationType
 */
export class FullyVisibleColumnsCalculationType {
  /**
   * Total number of fully visible columns in the viewport.
   *
   * @type {number}
   */
  count: number = 0;
  /**
   * The column index of the first fully visible column in the viewport.
   *
   * @type {number|null}
   */
  startColumn: number | null = null;
  /**
   * The column index of the last fully visible column in the viewport.
   *
   * @type {number|null}
   */
  endColumn: number | null = null;
  /**
   * Position of the first fully visible column (in px).
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
      columnWidth,
    } = viewportCalculator;

    if (
      totalCalculatedWidth >= zeroBasedScrollOffset &&
      totalCalculatedWidth + columnWidth <= zeroBasedScrollOffset + viewportWidth
    ) {
      if (this.startColumn === null || this.startColumn === undefined) {
        this.startColumn = column;
      }

      this.endColumn = column;
    }
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
        const calculatedViewportHeight = positionCache.getOffset(this.endColumn) +
          columnWidth -
          positionCache.getOffset(this.startColumn - 1);

        if (calculatedViewportHeight <= viewportWidth) {
          this.startColumn -= 1;
        }

        if (calculatedViewportHeight >= viewportWidth) {
          break;
        }
      }
    }

    this.startPosition = this.startColumn !== null ? positionCache.getOffset(this.startColumn) : null;

    const inlineStartColumnOffset = this.startColumn === null ? 0 : viewportCalculator.getColumnWidth(this.startColumn);

    if (
      // the table is to the left of the viewport. `scrollOffset` is compared as-is: the row header
      // carries its inline-end border at every scroll position, so the viewport width is exact
      // whether or not the table is scrolled and needs no 1px compensation (#6673).
      (
        scrollOffset < (-1) * inlineStartOffset ||
        scrollOffset > positionCache.getOffset(viewportCalculator.lastProcessedIndex)
      ) ||
      // the table is to the right of the viewport
      (((-1) * scrollOffset) - viewportWidth > (-1) * inlineStartColumnOffset)
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
