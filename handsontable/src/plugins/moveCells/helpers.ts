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
 * Computes the clamped top-left target cell for a move.
 *
 * @param {ClampMoveTargetOptions} options The pointer, grab offset, range dimensions, and grid extents.
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

interface BuildMoveMapOptions {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  targetRow: number;
  targetCol: number;
}

/**
 * Builds source-to-target coordinate mappings for a move.
 *
 * @param {BuildMoveMapOptions} options The source corners and target top-left.
 * @returns {Array<{ fromRow: number, fromCol: number, toRow: number, toCol: number }>}
 */
export function buildMoveMap({
  fromRow, fromCol, toRow, toCol, targetRow, targetCol,
}: BuildMoveMapOptions): Array<{ fromRow: number, fromCol: number, toRow: number, toCol: number }> {
  const map = [];

  for (let row = fromRow; row <= toRow; row++) {
    for (let col = fromCol; col <= toCol; col++) {
      map.push({ fromRow: row, fromCol: col, toRow: targetRow + (row - fromRow), toCol: targetCol + (col - fromCol) });
    }
  }

  return map;
}
