/**
 * @class PartiallyVisibleRowsCalculationType
 */
export class PartiallyVisibleRowsCalculationType {
  /**
   * Total number of partially visible rows in the viewport.
   *
   * @type {number}
   */
  count = 0;
  /**
   * The row index of the first partially visible row in the viewport.
   *
   * @type {number|null}
   */
  startRow = null;
  /**
   * The row index of the last partially visible row in the viewport.
   *
   * @type {number|null}
   */
  endRow = null;
  /**
   * Position of the first partially visible row (in px).
   *
   * @type {number|null}
   */
  startPosition = null;
  /**
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer = false;

  /**
   * Initializes the calculation.
   */
  initialize() {}

  /**
   * Processes the row.
   *
   * @param {number} row The row index.
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  process(row, viewportCalculator) {
    const {
      totalCalculatedHeight,
      zeroBasedScrollOffset,
      innerViewportHeight,
    } = viewportCalculator;

    if (totalCalculatedHeight <= zeroBasedScrollOffset) {
      this.startRow = row;
    }

    if (
      totalCalculatedHeight >= zeroBasedScrollOffset &&
      totalCalculatedHeight <= innerViewportHeight
    ) {
      if (this.startRow === null) {
        this.startRow = row;
      }
    }

    this.endRow = row;
  }

  /**
   * Finalizes the calculation.
   *
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator) {
    const {
      scrollOffset,
      viewportHeight,
      horizontalScrollbarHeight,
      totalRows,
      needReverse,
      startPositions,
      rowHeight,
    } = viewportCalculator;

    // If the estimation has reached the last row and there is still some space available in the viewport,
    // we need to render in reverse in order to fill the whole viewport with rows
    if (this.endRow === totalRows - 1 && needReverse) {
      this.startRow = this.endRow;

      while (this.startRow > 0) {
        const calculatedViewportHeight = startPositions[this.endRow] +
          rowHeight -
          startPositions[this.startRow - 1];

        this.startRow -= 1;

        if (calculatedViewportHeight >= viewportHeight - horizontalScrollbarHeight) {
          break;
        }
      }
    }

    this.startPosition = startPositions[this.startRow] ?? null;

    const mostBottomScrollOffset = scrollOffset + viewportHeight - horizontalScrollbarHeight;

    if (mostBottomScrollOffset < 0 || scrollOffset > startPositions.at(-1) + rowHeight) {
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
