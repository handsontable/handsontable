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
