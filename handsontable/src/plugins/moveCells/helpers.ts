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
