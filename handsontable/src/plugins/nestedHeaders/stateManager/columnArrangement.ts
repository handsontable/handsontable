import type { HotInstance } from '../../../core/types';

/**
 * A port that exposes the current visual-to-physical column arrangement, abstracting the
 * Handsontable column index mapper away from the header-tree derivation logic.
 *
 * The nested-header structure is authored in physical-column space (the position of each header in
 * the `nestedHeaders` settings, where visual equals physical at initialization). Deriving the render
 * structure means walking the columns in their current visual order and reading the header authored
 * for whatever physical column now sits at each visual position - which is exactly what this port
 * provides. It is the structural counterpart to `ColumnVisibility`.
 */
export interface ColumnArrangement {
  /**
   * Returns the physical column index currently mapped to the given visual column index.
   *
   * @param {number} visualColumnIndex - The visual column index to translate.
   * @returns {number} The physical column index.
   */
  getPhysicalFromVisual(visualColumnIndex: number): number;
}

/**
 * Creates a ColumnArrangement port adapter backed by the Handsontable column index mapper.
 * The adapter reports the live visual-to-physical mapping, so a column move (which reorders the
 * mapper's index sequence) is reflected the next time the structure is derived.
 *
 * @param {HotInstance} hot - The Handsontable instance.
 * @returns {ColumnArrangement} The arrangement port backed by the column index mapper.
 */
export function createColumnArrangementAdapter(hot: HotInstance): ColumnArrangement {
  return {
    getPhysicalFromVisual(visualColumnIndex: number) {
      const physicalIndex = hot.columnIndexMapper.getPhysicalFromVisualIndex(visualColumnIndex);

      // A null result means the visual index is out of range; fall back to the identity mapping so
      // the caller (which only iterates indexes within the authored width) stays well defined.
      return physicalIndex === null ? visualColumnIndex : physicalIndex;
    },
  };
}

/**
 * Creates an identity ColumnArrangement where every visual column maps to the same physical column.
 * This reproduces the pre-move state (visual equals physical) and is used as the regression baseline
 * and in tests, where deriving against it must yield the same structure as the legacy build.
 *
 * @returns {ColumnArrangement} An identity arrangement.
 */
export function createIdentityColumnArrangement(): ColumnArrangement {
  return {
    getPhysicalFromVisual(visualColumnIndex: number) {
      return visualColumnIndex;
    },
  };
}
