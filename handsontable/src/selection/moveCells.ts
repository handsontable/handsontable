/**
 * Pure helpers for the `moveCells` (drag-to-move selection) feature. DOM-free so the clamp,
 * eligibility, and mapping rules unit-test in isolation.
 */

interface ClampMoveTargetOptions {
  pointerRow: number;
  pointerCol: number;
  grabRowOffset: number;
  grabColOffset: number;
  rangeHeight: number;
  rangeWidth: number;
  totalRows: number;
  totalCols: number;
}

/**
 * Computes the clamped top-left target cell for a move, keeping the whole block inside the grid.
 *
 * @param {ClampMoveTargetOptions} options The pointer cell, the grab offset within the range, the range
 *   dimensions, and the grid extents.
 * @returns {{ row: number, col: number }} The clamped top-left target coordinates.
 */
export function clampMoveTarget({
  pointerRow, pointerCol, grabRowOffset, grabColOffset,
  rangeHeight, rangeWidth, totalRows, totalCols,
}: ClampMoveTargetOptions): { row: number, col: number } {
  const rawRow = pointerRow - grabRowOffset;
  const rawCol = pointerCol - grabColOffset;
  const maxRow = Math.max(0, totalRows - rangeHeight);
  const maxCol = Math.max(0, totalCols - rangeWidth);

  return {
    row: Math.min(Math.max(0, rawRow), maxRow),
    col: Math.min(Math.max(0, rawCol), maxCol),
  };
}

interface CanMoveRangeOptions {
  rangeCount: number;
  isEntireRow: boolean;
  isEntireColumn: boolean;
  isHeader: boolean;
}

/**
 * Tells whether the current selection is eligible for a `moveCells` drag: exactly one contiguous cell
 * range that is not a full row, full column, or header selection.
 *
 * @param {CanMoveRangeOptions} options The selection shape flags.
 * @returns {boolean}
 */
export function canMoveRange({ rangeCount, isEntireRow, isEntireColumn, isHeader }: CanMoveRangeOptions): boolean {
  return rangeCount === 1 && !isEntireRow && !isEntireColumn && !isHeader;
}

interface BuildMoveMapOptions {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  targetRow: number;
  targetCol: number;
}

/**
 * Builds the per-cell source-to-target coordinate mapping for a move, preserving the block layout.
 *
 * @param {BuildMoveMapOptions} options The normalized source range corners and the target top-left.
 * @returns {Array<{ fromRow: number, fromCol: number, toRow: number, toCol: number }>}
 */
export function buildMoveMap({
  fromRow, fromCol, toRow, toCol, targetRow, targetCol,
}: BuildMoveMapOptions): Array<{ fromRow: number, fromCol: number, toRow: number, toCol: number }> {
  const map = [];

  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      map.push({ fromRow: r, fromCol: c, toRow: targetRow + (r - fromRow), toCol: targetCol + (c - fromCol) });
    }
  }

  return map;
}
