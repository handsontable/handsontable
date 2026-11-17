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

/**
 * Cuts an index range down to its part that is drawn. A grid draws its rows or columns in up to three
 * bands: the frozen ones at the start, the ones the scrolled table renders, and the frozen ones at the end.
 * The frozen bands are drawn at every scroll position, so a range that reaches into one has cells there
 * even when the scrolled table renders none of it.
 *
 * @param {number} from The first index of the range.
 * @param {number} to The last index of the range.
 * @param {Array<Array<number>>} bands The drawn bands, each as `[first, last]`. A band with `last < first`
 *   is empty.
 * @returns {{ first: number, last: number } | null} The first and the last drawn index inside the range, or
 *   `null` when none of it is drawn.
 */
export function clampToDrawnBands(
  from: number, to: number, bands: Array<[number, number]>,
): { first: number, last: number } | null {
  let first: number | null = null;
  let last: number | null = null;

  bands.forEach(([bandFirst, bandLast]) => {
    const start = Math.max(from, bandFirst);
    const end = Math.min(to, bandLast);

    if (start <= end) {
      first = first === null ? start : Math.min(first, start);
      last = last === null ? end : Math.max(last, end);
    }
  });

  return first === null || last === null ? null : { first, last };
}
