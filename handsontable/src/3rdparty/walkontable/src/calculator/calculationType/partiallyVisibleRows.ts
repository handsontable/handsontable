import { RowsCalculationType, CalculatorContext } from '../../types';

/**
 * @class PartiallyVisibleRowsCalculationType
 */
export class PartiallyVisibleRowsCalculationType implements RowsCalculationType {
  /**
   * Total number of partially visible rows in the viewport.
   *
   * @type {number}
   */
  count: number = 0;
  /**
   * The row index of the first partially visible row in the viewport.
   *
   * @type {number|null}
   */
  startRow: number | null = null;
  /**
   * The row index of the last partially visible row in the viewport.
   *
   * @type {number|null}
   */
  endRow: number | null = null;
  /**
   * Position of the first partially visible row (in px).
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
   * Processes the row.
   *
   * @param {number} row The row index.
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  process(row: number, viewportCalculator: CalculatorContext): void {
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
  finalize(viewportCalculator: CalculatorContext): void {
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
        if (this.endRow !== null) {
          const calculatedViewportHeight = startPositions[this.endRow] +
            rowHeight -
            startPositions[this.startRow - 1];

          this.startRow -= 1;

          if (calculatedViewportHeight >= viewportHeight - horizontalScrollbarHeight) {
            break;
          }
        } else {
          break;
        }
      }
    }

    if (this.startRow !== null) {
      this.startPosition = startPositions[this.startRow] ?? null;
    }

    const mostBottomScrollOffset = scrollOffset + viewportHeight - horizontalScrollbarHeight;
    const lastPosition = startPositions.length > 0 ? startPositions[startPositions.length - 1] : 0;

    if (mostBottomScrollOffset < 0 || scrollOffset > lastPosition + rowHeight) {
      this.isVisibleInTrimmingContainer = false;
    } else {
      this.isVisibleInTrimmingContainer = true;
    }

    if (this.endRow !== null && totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null && this.endRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}
