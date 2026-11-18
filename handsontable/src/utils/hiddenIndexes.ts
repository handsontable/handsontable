import { arrayEach } from '../helpers/array';
import type { HotInstance } from '../core/types';

type SelectionAxis = 'row' | 'col';

/**
 * Tells whether a selection layer was made from the header of `axis`. The layer's flag alone is not
 * enough: the header flags are keyed by layer index and are not remapped when a Ctrl/Cmd+click
 * removes a layer, so a flag can name a cell range. A range made from a column header starts in the
 * header row (a negative row index), and one made from a row header in the header column.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {SelectionAxis} axis The axis whose header is asked about.
 * @param {number} layerLevel The selection layer.
 * @param {{ from: { row: number | null, col: number | null } }} range The layer's range.
 * @returns {boolean}
 */
function isLayerSelectedByHeader(
  hot: HotInstance,
  axis: SelectionAxis,
  layerLevel: number,
  range: { from: { row: number | null, col: number | null }, to: { row: number | null, col: number | null } },
): boolean {
  const isFlagged = axis === 'col'
    ? hot.selection.isSelectedByColumnHeader(layerLevel)
    : hot.selection.isSelectedByRowHeader(layerLevel);
  const crossAxis = axis === 'col' ? 'row' : 'col';
  const crossStart = Math.min(range.from[crossAxis] ?? 0, range.to[crossAxis] ?? 0);

  return isFlagged && crossStart < 0;
}

/**
 * Collect the visual indexes the "Hide column" or "Hide row" context menu item acts on: every column
 * (or row) of every selection range made from that axis' header, so a Ctrl/Cmd+click selection of
 * several headers hides all of them. A cell range added beside them is left out, because the item
 * hides what the user selected as columns (or rows). A select-all from the corner covers every range.
 *
 * Shared by the HiddenColumns and HiddenRows menu items, which must not import each other.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {SelectionAxis} axis The axis to collect: `'col'` for columns, `'row'` for rows.
 * @param {number} [limit=Infinity] Stop once this many indexes are found. The menu item's label and its
 * visibility only ask whether there are one or more, and a select-all on a long grid would otherwise
 * collect every index on each render of the menu. The result is then not complete.
 * @returns {number[]} Visual indexes, sorted and without duplicates.
 */
export function collectHeaderSelectedIndexes(hot: HotInstance, axis: SelectionAxis, limit = Infinity): number[] {
  const ranges = hot.getSelectedRange() ?? [];
  const isSelectedByCorner = hot.selection.isSelectedByCorner();
  const indexes = new Set<number>();

  arrayEach(ranges, (range, layerLevel) => {
    const from = range.from[axis];
    const to = range.to[axis];

    if (from === null || to === null ||
        (!isSelectedByCorner && !isLayerSelectedByHeader(hot, axis, layerLevel, range))) {
      return;
    }

    for (let index = Math.max(Math.min(from, to), 0); index <= Math.max(from, to); index += 1) {
      indexes.add(index);

      if (indexes.size >= limit) {
        return false;
      }
    }
  });

  return Array.from(indexes).sort((a, b) => a - b);
}

/**
 * Collect physical indexes of the contiguous hidden stretches next to a visual index.
 *
 * Walks left, then right, from `visualIndex` and stops at the first visible or missing
 * neighbor. A middle gap is collected. A non-adjacent hidden index is not.
 *
 * Shared by HiddenColumns and HiddenRows Show-item `hidden()` callbacks (DEV-1040). Keep
 * this in `utils/` rather than duplicating it in either plugin — the plugins must not
 * import each other, and a copy trips Sonar duplication on new code.
 *
 * @param {number} visualIndex The selected visible visual index.
 * @param {number} visualCount Total visual index count.
 * @param {number[]} notTrimmedIndexes Map from visual index to physical index.
 * @param {Set<number>} hiddenPhysicalIndexes Hidden physical indexes.
 * @param {number[]} [target] Array to append into. A new array is used when omitted.
 * @returns {number[]} Adjacent hidden physical indexes in visual order.
 */
export function collectAdjacentHiddenPhysicalIndexes(
  visualIndex: number,
  visualCount: number,
  notTrimmedIndexes: number[],
  hiddenPhysicalIndexes: Set<number>,
  target: number[] = [],
): number[] {
  const leftPhysicalIndexes: number[] = [];

  for (let visual = visualIndex - 1; visual >= 0; visual -= 1) {
    const physical = notTrimmedIndexes[visual];

    if (typeof physical !== 'number' || !hiddenPhysicalIndexes.has(physical)) {
      break;
    }

    leftPhysicalIndexes.push(physical);
  }

  // Reverse after the left walk so visual order is preserved without an indexed copy loop
  // (typescript:S4138) and without `push(...array)` (stack overflow on a long stretch).
  // Keep `reverse()` in its own statement (typescript:S4043).
  leftPhysicalIndexes.reverse();
  arrayEach(leftPhysicalIndexes, (physical) => {
    target.push(physical);
  });

  for (let visual = visualIndex + 1; visual < visualCount; visual += 1) {
    const physical = notTrimmedIndexes[visual];

    if (typeof physical !== 'number' || !hiddenPhysicalIndexes.has(physical)) {
      break;
    }

    target.push(physical);
  }

  return target;
}
