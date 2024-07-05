import { PartiallyVisibleColumnsCalculationType } from './partiallyVisibleColumns';

/**
 * @class RenderedColumnsCalculationType
 */
export class RenderedColumnsCalculationType extends PartiallyVisibleColumnsCalculationType {
  /**
   * Total number of rendered columns (all columns in the viewport + buffer columns above and below the viewport).
   *
   * @type {number}
   */
  count = 0;
  /**
   * The column index of the first rendered column in the viewport.
   *
   * @type {number|null}
   */
  startColumns = null;
  /**
   * The column index of the last rendered column in the viewport.
   *
   * @type {number|null}
   */
  endColumns = null;
  /**
   * Position of the first rendered column (in px).
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
      totalColumns,
    } = viewportCalculator;

    if (this.startColumn !== null && typeof overrideFn === 'function') {
      overrideFn(this);
    }

    if (totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }
}
