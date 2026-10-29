import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';

/**
 * A rectangular group of cells that a cell selection treats as one unit, such as a merged cell.
 * A cell selection never covers only part of a block.
 */
export interface CellBlock {
  /**
   * Visual index of the block's top row.
   */
  row: number;
  /**
   * Visual index of the block's start column.
   */
  col: number;
  /**
   * Number of rows the block spans.
   */
  rowspan: number;
  /**
   * Number of columns the block spans.
   */
  colspan: number;
  /**
   * Returns the block as a cell range.
   */
  getRange(): CellRange;
}

/**
 * Supplies the blocks a cell selection must cover whole. A plugin that groups cells (MergeCells)
 * registers one through `Selection#setCellBlockProvider()` when it is enabled, and passes `null` when
 * it is disabled. Selection then grows ranges over the blocks, snaps the highlight to a block's
 * top-left, and steps arrow keys and Shift+Arrow over blocks, all before the matching public hook runs.
 *
 * Both methods answer for the blocks on screen only, in visual coordinates. A block whose rows are all
 * trimmed must be left out: its coordinates point at other records, and a selection grown over them
 * reaches cells the block does not cover.
 */
export interface CellBlockProvider {
  /**
   * Returns the blocks that are on screen, in any order. Read once per range change and once per
   * Shift+Arrow step, so it may build a list.
   */
  getBlocks(): readonly CellBlock[];
  /**
   * Returns the on-screen block that covers the cell, or `null` when no block covers it. Read several
   * times per selection change (`Selection#isMultiple()` asks it), so it must be a lookup, not a scan.
   */
  getBlockAt(row: number, column: number): CellBlock | null;
}

/**
 * Grows the range until it cuts none of the blocks. Every block the range touches is added to it
 * whole. Adding one block can make the range touch another one that the walk has already passed,
 * so the walk repeats until a whole pass adds nothing. Each pass that repeats has grown the range,
 * so there are at most `blocks.length + 1` passes, and one pass when the range touches no block.
 *
 * @param {CellRange} range The range to grow. It is changed in place.
 * @param {CellBlock[]} blocks The blocks the range must not cut. Pass only the blocks that are on screen.
 * @param {boolean} changeDirection Passed on to `CellRange#expandByRange()`: `true` lets the range
 * flip its direction when the highlight ends up on its far edge.
 * @returns {boolean} `true` when the range grew.
 */
export function expandRangeToBlocks(
  range: CellRange,
  blocks: readonly CellBlock[],
  changeDirection: boolean,
): boolean {
  let grew = false;
  let grewInPass = true;

  while (grewInPass) {
    grewInPass = false;

    for (let i = 0; i < blocks.length; i += 1) {
      if (range.expandByRange(blocks[i].getRange(), changeDirection)) {
        grewInPass = true;
      }
    }

    grew = grew || grewInPass;
  }

  return grew;
}

/**
 * Tells whether the range's corners are exactly the corners of one block, so the range is one cell
 * to the user. Header coordinates count as `0`, so a full column whose only cells are one block
 * counts as that block.
 *
 * @param {CellRange} range The range to test.
 * @param {CellBlock[]} blocks The blocks to compare with. Pass only the blocks that are on screen.
 * @returns {boolean}
 */
export function isRangeOneBlock(range: CellRange, blocks: readonly CellBlock[]): boolean {
  const topStart = range.getTopStartCorner();
  const bottomEnd = range.getBottomEndCorner();

  for (let i = 0; i < blocks.length; i += 1) {
    const { row, col, rowspan, colspan } = blocks[i];

    if (
      topStart.row === row &&
      topStart.col === col &&
      bottomEnd.row === row + rowspan - 1 &&
      bottomEnd.col === col + colspan - 1
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Collects, per range line along the axis, the contributions of the blocks that intersect the range.
 * A line is a single row (for the `row` axis) or a single column (for the `col` axis) of the range.
 * Each block contributes, to every line it covers, its scan extent along the axis (the last covered
 * index when scanning forward, the first when scanning backward) and the number of range cells it
 * covers within the line. Lines without any block are absent from the returned map.
 *
 * @param {CellBlock[]} blocks The blocks on screen.
 * @param {CellRange} range The range to search within.
 * @param {'row' | 'col'} axis The axis to search within.
 * @param {number} scanDirection The direction to scan the range. `1` for forward, `-1` for backward.
 * @returns {Map<number, { extents: Set<number>, coveredCells: number }>} Map keyed by the line index.
 */
function collectLineContributions(
  blocks: readonly CellBlock[],
  range: CellRange,
  axis: 'row' | 'col',
  scanDirection: number,
) {
  const { row: rangeStartRow, col: rangeStartColumn } = range.getTopStartCorner();
  const { row: rangeEndRow, col: rangeEndColumn } = range.getBottomEndCorner();
  const startRow = rangeStartRow ?? 0;
  const startColumn = rangeStartColumn ?? 0;
  const endRow = rangeEndRow ?? 0;
  const endColumn = rangeEndColumn ?? 0;
  const isRowAxis = axis === 'row';
  const lineStart = isRowAxis ? startRow : startColumn;
  const lineEnd = isRowAxis ? endRow : endColumn;
  const crossStart = isRowAxis ? startColumn : startRow;
  const crossEnd = isRowAxis ? endColumn : endRow;
  const lines = new Map<number, { extents: Set<number>, coveredCells: number }>();

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockLineStart = isRowAxis ? block.row : block.col;
    const blockLineEnd = blockLineStart + (isRowAxis ? block.rowspan : block.colspan) - 1;
    const blockCrossStart = isRowAxis ? block.col : block.row;
    const blockCrossEnd = blockCrossStart + (isRowAxis ? block.colspan : block.rowspan) - 1;

    if (
      blockLineEnd < lineStart || blockLineStart > lineEnd ||
      blockCrossEnd < crossStart || blockCrossStart > crossEnd
    ) {
      continue;
    }

    const extent = scanDirection === 1 ? blockLineEnd : blockLineStart;
    const coveredCells = Math.min(blockCrossEnd, crossEnd) - Math.max(blockCrossStart, crossStart) + 1;
    const firstLine = Math.max(blockLineStart, lineStart);
    const lastLine = Math.min(blockLineEnd, lineEnd);

    for (let line = firstLine; line <= lastLine; line++) {
      let entry = lines.get(line);

      if (!entry) {
        entry = { extents: new Set(), coveredCells: 0 };
        lines.set(line, entry);
      }

      entry.extents.add(extent);
      entry.coveredCells += coveredCells;
    }
  }

  return lines;
}

/**
 * Finds the nearest index along the axis that does not intersect any block within the range. The
 * range's lines are scanned in the given direction; a line emits a candidate index when all of its
 * cells agree on a single index – its own index when no block touches it, or the shared scan extent
 * when blocks cover it uniformly. The first candidate at or past `visualIndex` (in the scan
 * direction) wins. The cost scales with the number of blocks, not with the area of the range.
 *
 * Shift+Arrow uses it to find the line a range's end moves from, so the end never stops inside a block.
 *
 * @param {CellBlock[]} blocks The blocks on screen.
 * @param {CellRange} range The range to search within.
 * @param {'row' | 'col'} axis The axis to search within.
 * @param {number} scanDirection The direction to scan the range. `1` for forward, `-1` for backward.
 * @param {number} visualIndex The visual row or column index the search relates to.
 * @returns {number} The found visual index, or `visualIndex` when every line intersects a block.
 */
export function findNonIntersectingIndex(
  blocks: readonly CellBlock[],
  range: CellRange,
  axis: 'row' | 'col',
  scanDirection: number,
  visualIndex: number,
): number {
  const { row: rangeStartRow, col: rangeStartColumn } = range.getTopStartCorner();
  const { row: rangeEndRow, col: rangeEndColumn } = range.getBottomEndCorner();
  const isRowAxis = axis === 'row';
  const lineStart = (isRowAxis ? rangeStartRow : rangeStartColumn) ?? 0;
  const lineEnd = (isRowAxis ? rangeEndRow : rangeEndColumn) ?? 0;
  const crossLength = isRowAxis
    ? ((rangeEndColumn ?? 0) - (rangeStartColumn ?? 0) + 1)
    : ((rangeEndRow ?? 0) - (rangeStartRow ?? 0) + 1);
  const matches = (index: number) => (scanDirection === 1 ? index >= visualIndex : index <= visualIndex);
  const lines = collectLineContributions(blocks, range, axis, scanDirection);
  const touchedLines = Array.from(lines.keys())
    .sort((lineA, lineB) => (lineA - lineB) * scanDirection);

  // The first block-touched line (in scan order) whose cells all agree on a single index that lies
  // at or past `visualIndex`.
  let touchedMatchLine = null;
  let touchedMatchIndex = 0;

  for (let i = 0; i < touchedLines.length; i++) {
    const line = touchedLines[i];
    const { extents, coveredCells } = lines.get(line)!;

    // Cells not covered by any block contribute the line's own index.
    if (coveredCells < crossLength) {
      extents.add(line);
    }

    if (extents.size === 1) {
      const candidate = extents.values().next().value!;

      if (matches(candidate)) {
        touchedMatchLine = line;
        touchedMatchIndex = candidate;
        break;
      }
    }
  }

  // The first block-free line in scan order that lies at or past `visualIndex`; such a line always
  // emits its own index.
  let freeMatchLine = scanDirection === 1
    ? Math.max(lineStart, visualIndex)
    : Math.min(lineEnd, visualIndex);

  while (freeMatchLine >= lineStart && freeMatchLine <= lineEnd && lines.has(freeMatchLine)) {
    freeMatchLine += scanDirection;
  }

  const hasFreeMatch = freeMatchLine >= lineStart && freeMatchLine <= lineEnd;

  if (touchedMatchLine === null) {
    return hasFreeMatch ? freeMatchLine : visualIndex;
  }

  if (!hasFreeMatch || (touchedMatchLine - freeMatchLine) * scanDirection <= 0) {
    return touchedMatchIndex;
  }

  return freeMatchLine;
}
