import type { HotInstance } from '../core/types';

/**
 * Returns the column header sections (THEAD) of the clones that render the `fixedColumnsEnd` columns: the
 * inline-end overlay and its top corner.
 *
 * This lives in the core `src/utils/` on purpose: the NestedHeaders and CollapsibleColumns plugins both walk
 * these sections, and plugins must not import each other. A single copy means that a later end overlay that
 * starts to render headers has to be added in one place only.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {HTMLTableSectionElement[]}
 */
export function getEndOverlayHeaders(hotInstance: HotInstance): HTMLTableSectionElement[] {
  const { wtOverlays } = hotInstance.view._wt;

  return [
    wtOverlays.inlineEndOverlay?.clone?.wtTable.THEAD,
    wtOverlays.topInlineEndCornerOverlay?.clone?.wtTable.THEAD,
  ].filter((thead): thead is HTMLTableSectionElement => !!thead);
}
