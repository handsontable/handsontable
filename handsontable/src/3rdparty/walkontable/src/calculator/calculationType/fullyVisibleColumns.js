/**
 * @class FullyVisibleColumnsCalculationType
 */
export class FullyVisibleColumnsCalculationType {
  /**
   * Total number of fully visible columns in the viewport.
   *
   * @type {number}
   */
  count = 0;
  /**
   * The column index of the first fully visible column in the viewport.
   *
   * @type {number|null}
   */
  startColumn = null;
  /**
   * The column index of the last fully visible column in the viewport.
   *
   * @type {number|null}
   */
  endColumn = null;
  /**
   * Position of the first fully visible column (in px).
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
      columnWidth,
    } = viewportCalculator;

    const compensatedViewportWidth = zeroBasedScrollOffset > 0 ? viewportWidth + 1 : viewportWidth;

    if (
      totalCalculatedWidth >= zeroBasedScrollOffset &&
      totalCalculatedWidth + columnWidth <= zeroBasedScrollOffset + compensatedViewportWidth
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
        const calculatedViewportHeight = startPositions[this.endColumn] +
          columnWidth -
          startPositions[this.startColumn - 1];

        if (calculatedViewportHeight <= viewportWidth) {
          this.startColumn -= 1;
        }

        if (calculatedViewportHeight >= viewportWidth) {
          break;
        }
      }
    }

    this.startPosition = startPositions[this.startColumn] ?? null;

    const compensatedViewportWidth = zeroBasedScrollOffset > 0 ? viewportWidth + 1 : viewportWidth;
    const mostRightScrollOffset = scrollOffset + viewportWidth - compensatedViewportWidth;
    const inlineStartColumnOffset = this.startColumn === null ? 0 : viewportCalculator.getColumnWidth(this.startColumn);

    if (
      // the table is to the left of the viewport
      (
        mostRightScrollOffset < (-1) * inlineStartOffset ||
        scrollOffset > startPositions.at(-1)
      ) ||
      // the table is to the right of the viewport
      (((-1) * scrollOffset) - viewportWidth > (-1) * inlineStartColumnOffset)
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
