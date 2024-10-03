import { DEFAULT_COLUMN_WIDTH } from '../../../3rdparty/walkontable/src';
import { StretchStrategy } from './_base';

/**
 * The strategy calculates the column widths by stretching all columns evenly.
 */
export class StretchAllStrategy extends StretchStrategy {
  /**
   * The index of the last calculated column.
   *
   * @type {number}
   */
  #lastColumnIndex = -1;

  /**
   * Prepares the strategy for the calculation.
   *
   * @param {{ viewportWidth: number, allColumnsWidth: number }} calcArgs The calculation arguments.
   */
  prepare(calcArgs) {
    super.prepare(calcArgs);
    this.lastColumnIndex = -1;
  }

  /**
   * Calculates the width of the column.
   *
   * @param {number} columnVisualIndex The column visual index to calculate.
   * @param {number} columnWidth The current column width.
   */
  calculate(columnVisualIndex, columnWidth) {
    const stretchRatio = this.viewportWidth / this.allColumnsWidth;
    const stretchedWidth = Math.round(columnWidth * stretchRatio);

    if (stretchedWidth >= DEFAULT_COLUMN_WIDTH) {
      this.widths.set(columnVisualIndex, stretchedWidth);
      this.#lastColumnIndex = columnVisualIndex;
    }
  }

  /**
   * Finishes the calculation.
   */
  finish() {
    const size = this.widths.size;

    if (size > 1) {
      const sumColumns = Array.from(this.widths)
        .reduce((sumWidth, [, width], currentIndex) => {
          return sumWidth + (currentIndex === size - 1 ? 0 : width);
        }, 0);

      this.widths.set(this.#lastColumnIndex, Math.round(this.viewportWidth - sumColumns));
    }
  }
}
