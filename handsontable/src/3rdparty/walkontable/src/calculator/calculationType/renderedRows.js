import { PartiallyVisibleRowsCalculationType } from './partiallyVisibleRows';

/**
 * @class RenderedRowsCalculationType
 */
export class RenderedRowsCalculationType extends PartiallyVisibleRowsCalculationType {
  /**
   * Total number of rendered rows (all rows in the viewport + buffer rows above and below the viewport).
   *
   * @type {number}
   */
  count = 0;
  /**
   * The row index of the first rendered row in the viewport.
   *
   * @type {number|null}
   */
  startRow = null;
  /**
   * The row index of the last rendered row in the viewport.
   *
   * @type {number|null}
   */
  endRow = null;
  /**
   * Position of the first rendered row (in px).
   *
   * @type {number}
   */
  startPosition = 0;
  /**
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer = false;

  finalize(viewportCalculator) {
    super.finalize(viewportCalculator);

    const {
      overrideFn,
      totalRows,
    } = viewportCalculator;

    if (this.startRow !== null && typeof overrideFn === 'function') {
      overrideFn(this);
    }

    if (totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}
