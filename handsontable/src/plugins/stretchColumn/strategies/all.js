import { DEFAULT_COLUMN_WIDTH } from '../../../3rdparty/walkontable/src';

export class StretchAllStrategy {
  #viewportWidth;
  #allColumnsWidth;
  #widths = new Map();
  #lastColumnIndex = 0;

  prepare({ viewportWidth, allColumnsWidth }) {
    this.#viewportWidth = viewportWidth;
    this.#allColumnsWidth = allColumnsWidth;

    this.#lastColumnIndex = 0;
    this.#widths.clear();
  }

  calculate(columnVisualIndex, columnWidth) {
    const stretchRatio = this.#viewportWidth / this.#allColumnsWidth;
    const stretchedWidth = Math.round(columnWidth * stretchRatio);

    if (stretchedWidth >= DEFAULT_COLUMN_WIDTH) {
      this.#widths.set(columnVisualIndex, stretchedWidth);
      this.#lastColumnIndex = columnVisualIndex;
    }
  }

  finish() {
    const size = this.#widths.size;

    if (size > 1) {
      const sumColumns = Array.from(this.#widths)
        .reduce((sumWidth, [i, width], currentIndex) => {
          return sumWidth + (currentIndex === size - 1 ? 0 : width);
        }, 0);

      this.#widths.set(this.#lastColumnIndex, Math.round(this.#viewportWidth - sumColumns));
    }
  }

  getWidths() {
    return Array.from(this.#widths);
  }
}
