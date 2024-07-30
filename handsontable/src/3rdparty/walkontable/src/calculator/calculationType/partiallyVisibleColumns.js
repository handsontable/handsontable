/**
 * @class PartiallyVisibleColumnsCalculationType
 */
export class PartiallyVisibleColumnsCalculationType {
  /**
   * Total number of partially visible columns in the viewport.
   *
   * @type {number}
   */
  count = 0;
  /**
   * The column index of the first partially visible column in the viewport.
   *
   * @type {number|null}
   */
  startColumn = null;
  /**
   * The column index of the last partially visible column in the viewport.
   *
   * @type {number|null}
   */
  endColumn = null;
  /**
   * Position of the first partially visible column (in px).
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
   * Processes the column.
   *
   * @param {number} column The column index.
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  process(column, viewportCalculator) {
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
  finalize(viewportCalculator) {
    const {
      scrollOffset,
      viewportWidth,
      inlineStartOffset,
      zeroBasedScrollOffset,
      totalColumns,
      needReverse,
      startPositions,
      columnWidth,
    } = viewportCalculator;

    // If the estimation has reached the last column and there is still some space available in the viewport,
    // we need to render in reverse in order to fill the whole viewport with columns
    if (this.endColumn === totalColumns - 1 && needReverse) {
      this.startColumn = this.endColumn;

      while (this.startColumn > 0) {
        const calculatedViewportWidth = startPositions[this.endColumn] +
          columnWidth -
          startPositions[this.startColumn - 1];

        this.startColumn -= 1;

        if (calculatedViewportWidth > viewportWidth) {
          break;
        }
      }
    }

    this.startPosition = startPositions[this.startColumn] ?? null;

    const compensatedViewportWidth = zeroBasedScrollOffset > 0 ? viewportWidth + 1 : viewportWidth;
    const mostRightScrollOffset = scrollOffset + viewportWidth - compensatedViewportWidth;

    if (
      // the table is to the left of the viewport
      (
        mostRightScrollOffset < (-1) * inlineStartOffset ||
        scrollOffset > startPositions.at(-1) + columnWidth
      ) ||
      // the table is to the right of the viewport
      (((-1) * scrollOffset) - viewportWidth > 0)
    ) {
      this.isVisibleInTrimmingContainer = false;
    } else {
      this.isVisibleInTrimmingContainer = true;
    }

    if (totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }
}
