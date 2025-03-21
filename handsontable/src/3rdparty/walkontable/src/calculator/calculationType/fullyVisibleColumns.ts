import { ColumnsCalculationType, CalculatorContext } from '../../types';

/**
 * @class FullyVisibleColumnsCalculationType
 */
export class FullyVisibleColumnsCalculationType implements ColumnsCalculationType {
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
  initialize(): void {}

  /**
   * Processes the column.
   *
   * @param {number} column The column index.
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  process(column: number, viewportCalculator: CalculatorContext): void {
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
  finalize(viewportCalculator: CalculatorContext): void {
    const width = viewportCalculator.getWidth();
    const scrollOffset = viewportCalculator.getScrollOffset();
    const totalColumns = viewportCalculator.getTotalColumns();
    const rowHeaderWidth = viewportCalculator.getRowHeaderWidth();
    const {
      needReverse,
      startPositions,
      columnWidth,
      viewportWidth,
    } = viewportCalculator;

    // If the estimation has reached the last column and there is still some space available in the viewport,
    // we need to render in reverse in order to fill the whole viewport with columns
    if (this.endColumn === totalColumns - 1 && needReverse) {
      this.startColumn = this.endColumn;

      while (this.startColumn > 0) {
        // Calculate viewport height only if both columns are not null
        if (this.endColumn !== null) {
          const calculatedViewportHeight = startPositions[this.endColumn] +
            columnWidth -
            startPositions[this.startColumn - 1];

          if (calculatedViewportHeight <= viewportWidth) {
            this.startColumn -= 1;
          }

          if (calculatedViewportHeight >= viewportWidth) {
            break;
          }
        } else {
          break;
        }
      }
    }

    // Update startPosition based on startColumn
    if (this.startColumn !== null) {
      this.startPosition = startPositions[this.startColumn] ?? null;
    } else {
      this.startPosition = null;
    }

    const compensatedViewportWidth = scrollOffset > 0 ? viewportWidth + 1 : viewportWidth;
    const mostRightScrollOffset = scrollOffset + viewportWidth - compensatedViewportWidth;
    const inlineStartColumnOffset = this.startColumn === null ? 0 : viewportCalculator.getColumnWidth(this.startColumn);

    if (
      // the table is to the left of the viewport
      (
        mostRightScrollOffset < (-1) * rowHeaderWidth ||
        scrollOffset > (startPositions.length > 0 ? startPositions[startPositions.length - 1] : 0)
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
