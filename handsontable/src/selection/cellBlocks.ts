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
