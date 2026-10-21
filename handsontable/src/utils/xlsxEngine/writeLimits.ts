import { DROPPED_FEATURES, type DroppedFeatures } from './capabilities';
import { MAX_COLUMN_WIDTH_UNITS, MAX_ROW_HEIGHT_POINTS } from './units';

/**
 * The most characters (UTF-16 code units) Excel stores in one cell. A longer string reaches the
 * file through either writer, and Excel then truncates it on open or offers to repair the file.
 */
export const MAX_CELL_TEXT_LENGTH = 32767;

/**
 * Cuts a cell string down to `MAX_CELL_TEXT_LENGTH` and records the cut. The cut never splits a
 * surrogate pair: an astral character straddling the limit is dropped whole, so no lone surrogate
 * (which `TextEncoder` turns into U+FFFD) reaches the file.
 *
 * @param {string} text The cell string.
 * @param {DroppedFeatures} dropped The write's dropped-feature report.
 * @returns {string}
 */
export function clampCellText(text: string, dropped: DroppedFeatures): string {
  if (text.length <= MAX_CELL_TEXT_LENGTH) {
    return text;
  }

  dropped.record(DROPPED_FEATURES.cellTextTruncated);

  const lastKept = text.charCodeAt(MAX_CELL_TEXT_LENGTH - 1);
  const end = lastKept >= 0xD800 && lastKept <= 0xDBFF ? MAX_CELL_TEXT_LENGTH - 1 : MAX_CELL_TEXT_LENGTH;

  return text.slice(0, end);
}

/**
 * Clamps a column width, in Excel column-width units, to `MAX_COLUMN_WIDTH_UNITS` and records the
 * clamp. Both readers bound a width the same way (the native one discards a wider value), so an
 * unclamped 1820+ px column used to come back at the default width rather than at the widest one.
 *
 * @param {number} width The width in Excel column-width units.
 * @param {DroppedFeatures} dropped The write's dropped-feature report.
 * @returns {number}
 */
export function clampColumnWidth(width: number, dropped: DroppedFeatures): number {
  if (width <= MAX_COLUMN_WIDTH_UNITS) {
    return width;
  }

  dropped.record(DROPPED_FEATURES.columnWidthClamped);

  return MAX_COLUMN_WIDTH_UNITS;
}

/**
 * Clamps a row height, in points, to `MAX_ROW_HEIGHT_POINTS` (Excel's own maximum) and records the
 * clamp, for the same reason as `clampColumnWidth`.
 *
 * @param {number} height The height in points.
 * @param {DroppedFeatures} dropped The write's dropped-feature report.
 * @returns {number}
 */
export function clampRowHeight(height: number, dropped: DroppedFeatures): number {
  if (height <= MAX_ROW_HEIGHT_POINTS) {
    return height;
  }

  dropped.record(DROPPED_FEATURES.rowHeightClamped);

  return MAX_ROW_HEIGHT_POINTS;
}
