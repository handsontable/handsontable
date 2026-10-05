import type { CellSnapshot, CellStyleSnapshot } from './model';

/**
 * The formatting a writer gives a cell, the three fields a style index or an ExcelJS style is
 * built from.
 */
export interface CellFormatting {
  numFmt: string | null;
  style: CellStyleSnapshot | null;
  locked: boolean | null;
}

/**
 * Two borders merged side by side, `over` winning a side both set. `null` when neither sets one.
 */
function mergeBorders(
  under: CellStyleSnapshot['border'], over: CellStyleSnapshot['border'],
): CellStyleSnapshot['border'] {
  if (!under) {
    return over;
  }

  return over ? { ...under, ...over } : under;
}

/**
 * Whether a cell carries no formatting of its own.
 */
function isUnformatted(cell: CellSnapshot | null | undefined): boolean {
  return !cell || (cell.numFmt === null && cell.style === null && cell.locked === null);
}

/**
 * The formatting a writer gives one covered (non-master) member of a merge. Both writers use it,
 * so a merged block looks the same whichever engine wrote it.
 *
 * - A covered cell with no formatting of its own takes the master's whole formatting, which is what
 *   ExcelJS's `mergeCells` always did: a merged header's border and fill reach every edge.
 * - A covered cell with formatting of its own keeps it - its lock above all, or an unlocked covered
 *   cell imports read-only once unmerged - and takes the master's fill and border on top of its
 *   own. Those are the two properties a covered cell shows: LibreOffice draws a block's right and
 *   bottom edges from its covered cells, so a covered cell in a `numeric` column (which always
 *   carries a number format and an alignment) dropped the master's box border. The border is merged
 *   side by side, the master's side winning: a border drawn around the whole block puts its right
 *   edge on the covered cell itself, which the master does not carry.
 *
 * @param {CellSnapshot|null} master The merge's master cell.
 * @param {CellSnapshot|null} covered The covered cell, `null` or `undefined` when the snapshot holds none.
 * @returns {CellFormatting}
 */
export function coveredCellFormatting(
  master: CellSnapshot | null | undefined,
  covered: CellSnapshot | null | undefined,
): CellFormatting {
  if (isUnformatted(covered)) {
    return {
      numFmt: master?.numFmt ?? null,
      style: master?.style ?? null,
      locked: master?.locked ?? null,
    };
  }

  const own = covered as CellSnapshot;
  const border = mergeBorders(own.style?.border ?? null, master?.style?.border ?? null);
  const fill = master?.style?.fill ?? own.style?.fill ?? null;
  const alignment = own.style?.alignment ?? null;
  const font = own.style?.font ?? null;
  const style = border || fill || alignment || font ? { alignment, font, fill, border } : null;

  return { numFmt: own.numFmt, style, locked: own.locked };
}
