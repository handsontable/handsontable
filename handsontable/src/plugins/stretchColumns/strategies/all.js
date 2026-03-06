import { DEFAULT_COLUMN_WIDTH } from '../../../3rdparty/walkontable/src';
import { StretchStrategy } from './_base';

/**
 * The strategy calculates the column widths by stretching all columns evenly.
 *
 * @private
 * @class StretchAllStrategy
 */
export class StretchAllStrategy extends StretchStrategy {
  /**
   * Calculates the columns widths.
   */
  calculate() {
    const allColumnsWidth = Array.from(this.baseWidths).reduce((sum, [, width]) => sum + width, 0);
    const remainingViewportWidth = this.viewportWidth - allColumnsWidth;

    if (remainingViewportWidth < 0) {
      this.stretchedWidths.clear();

      return;
    }

    const initialStretchRatio = this.viewportWidth / allColumnsWidth;
    const stretchedWidths = [];
    const fixedColumns = [];
    let viewportWidth = this.viewportWidth;
    let allStretchedColumnsWidth = 0;

    this.baseWidths.forEach((columnWidth, columnVisualIndex) => {
      const stretchedWidth = Math.round(columnWidth * initialStretchRatio);
      const finalWidth = this.overwriteColumnWidthFn(stretchedWidth, columnVisualIndex);

      if (stretchedWidth === finalWidth && stretchedWidth >= DEFAULT_COLUMN_WIDTH) {
        stretchedWidths.push([columnVisualIndex, finalWidth]);
        allStretchedColumnsWidth += finalWidth;

      } else if (stretchedWidth !== finalWidth) {
        stretchedWidths.push([columnVisualIndex, finalWidth]);
        fixedColumns.push(columnVisualIndex);
        viewportWidth -= finalWidth;
      }
    });

    if (viewportWidth <= DEFAULT_COLUMN_WIDTH) {
      this.stretchedWidths.clear();

      return;
    }

    const finalStretchRatio = viewportWidth / allStretchedColumnsWidth;
    let lastColumnIndex = -1;
    let sumColumnsWithoutLastOne = 0;

    stretchedWidths.forEach(([columnVisualIndex, columnWidth], index) => {
      let newWidth = columnWidth;

      if (!fixedColumns.includes(columnVisualIndex)) {
        newWidth = Math.round(columnWidth * finalStretchRatio);
      }

      this.stretchedWidths.set(columnVisualIndex, newWidth);

      lastColumnIndex = columnVisualIndex;

      if (index < stretchedWidths.length - 1) {
        sumColumnsWithoutLastOne += newWidth;
      }
    });

    if (this.stretchedWidths.size > 1) {
      this.stretchedWidths.set(lastColumnIndex, Math.round(this.viewportWidth - sumColumnsWithoutLastOne));
    }
  }
}
