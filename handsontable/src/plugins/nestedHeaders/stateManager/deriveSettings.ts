import { createDefaultHeaderSettings, createPlaceholderHeaderSettings } from './utils';
import type { ColumnArrangement } from './columnArrangement';
import type { SourceHeaderCell } from './sourceSettings';

/**
 * Computes, for one normalized header layer, the index of the header cell that owns each column.
 *
 * In the normalized representation a header that spans N columns is one cell at its left edge with
 * `origColspan = N`, followed by N-1 placeholder cells. The owner index of every column in that span
 * is the left-edge index. Because the authored configuration is properly nested, this left-edge
 * index is a stable identity for the group at that level - two distinct groups (even with the same
 * label) own different columns, so they never merge when a move makes them adjacent.
 *
 * @param {SourceHeaderCell[]} layer - A single normalized header layer (one row of the matrix).
 * @returns {number[]} For each column index, the owning header cell's index within the layer.
 */
function computeOwnerIndex(layer: SourceHeaderCell[]): number[] {
  const owners: number[] = [];
  let index = 0;

  while (index < layer.length) {
    const cell = layer[index];
    const span = cell.isPlaceholder ? 1 : Math.max(1, cell.origColspan ?? 1);

    for (let offset = 0; offset < span; offset++) {
      owners[index + offset] = index;
    }

    index += span;
  }

  return owners;
}

/**
 * Clones an authored owner cell into a visual-order header cell of the given run width.
 *
 * Array-valued fields are copied so that two banners derived from one authored group (after a split)
 * never share a mutable array with each other or with the authored source.
 *
 * @param {SourceHeaderCell} ownerCell - The authored cell that owns the run.
 * @param {number} runLength - The number of visually adjacent columns the run covers.
 * @param {number} authoredColumnIndex - The authored owner column index (stable group identity).
 * @returns {SourceHeaderCell} The cloned visual-order header cell.
 */
function cloneOwnerCell(ownerCell: SourceHeaderCell, runLength: number, authoredColumnIndex: number): SourceHeaderCell {
  const cell: SourceHeaderCell = {
    ...ownerCell,
    colspan: runLength,
    origColspan: runLength,
    isPlaceholder: false,
    // Stable identity of the authored group this run came from. Survives column moves (the authored
    // settings do not change on a move), so collapse state can be re-attached by it after a re-derive.
    authoredColumnIndex,
  };

  // Copy the array-valued fields so two banners derived from one authored group (after a split) never
  // share a mutable array with each other or with the source. SourceHeaderCell types these fields, so
  // `Array.isArray` narrows them precisely and the copy needs no cast.
  if (Array.isArray(cell.headerClassNames)) {
    cell.headerClassNames = cell.headerClassNames.slice();
  }

  if (Array.isArray(cell.crossHiddenColumns)) {
    cell.crossHiddenColumns = cell.crossHiddenColumns.slice();
  }

  return cell;
}

/**
 * Derives one visual-order header layer from an authored (physical-order) layer and an arrangement.
 *
 * Columns are visited in their current visual order; each maps through the arrangement to a physical
 * column whose authored owner identifies its group. Maximal runs of visually adjacent columns that
 * share the same owner are coalesced into a single header cell (with placeholders for the rest of the
 * span). A group split apart by a move therefore renders as several cells sharing the same label.
 *
 * @param {SourceHeaderCell[]} authoredLayer - One normalized header layer in authored order.
 * @param {ColumnArrangement} arrangement - The current visual-to-physical column arrangement.
 * @param {number} columnsCount - The number of visual columns the structure spans (authored width).
 * @returns {SourceHeaderCell[]} The header layer in visual order.
 */
function deriveVisualLayer(
  authoredLayer: SourceHeaderCell[],
  arrangement: ColumnArrangement,
  columnsCount: number
): SourceHeaderCell[] {
  const ownerIndex = computeOwnerIndex(authoredLayer);

  // Resolves the group key for a visual column. A physical column with no authored header at this
  // level (e.g. a column from outside the nested-headers definition moved into range) gets a unique
  // negative key so it never coalesces with a real group - it renders as a standalone header.
  const ownerKeyAt = (visualColumn: number): number => {
    const physical = arrangement.getPhysicalFromVisual(visualColumn);
    const owner = ownerIndex[physical];

    return owner === undefined ? -1 - physical : owner;
  };

  const visualLayer: SourceHeaderCell[] = [];
  let visualColumn = 0;

  while (visualColumn < columnsCount) {
    const ownerKey = ownerKeyAt(visualColumn);
    let runLength = 1;

    while (visualColumn + runLength < columnsCount && ownerKeyAt(visualColumn + runLength) === ownerKey) {
      runLength += 1;
    }

    const ownerCell = ownerKey >= 0 ? authoredLayer[ownerKey] : createDefaultHeaderSettings();

    visualLayer.push(cloneOwnerCell(ownerCell, runLength, ownerKey));

    for (let offset = 1; offset < runLength; offset++) {
      visualLayer.push(createPlaceholderHeaderSettings());
    }

    visualColumn += runLength;
  }

  return visualLayer;
}

/**
 * Derives the visual-order nested-header settings from the authored (physical-order) settings and a
 * column arrangement. This is the structural counterpart to `syncVisibilityOnTree`: visibility
 * answers "which columns are hidden", this answers "which header sits over each visual column".
 *
 * With an identity arrangement the output equals the authored input, so the legacy build is
 * reproduced exactly. With a moved arrangement the headers follow their physical columns, and groups
 * whose columns are no longer adjacent split into several same-label cells (the AG Grid model).
 *
 * The output width is the authored column count (every layer is normalized to that width), so the
 * structure spans exactly the columns the nested-headers definition covers - the same span as the
 * legacy build. The arrangement supplies only the visual-to-physical mapping.
 *
 * @param {SourceHeaderCell[][]} authoredSettings - The normalized header settings in authored order.
 * @param {ColumnArrangement} arrangement - The current visual-to-physical column arrangement.
 * @returns {SourceHeaderCell[][]} The normalized header settings in visual order.
 */
export function deriveVisualSettings(
  authoredSettings: SourceHeaderCell[][],
  arrangement: ColumnArrangement
): SourceHeaderCell[][] {
  const columnsCount = authoredSettings.length > 0 ? authoredSettings[0].length : 0;

  return authoredSettings.map(authoredLayer => deriveVisualLayer(authoredLayer, arrangement, columnsCount));
}
