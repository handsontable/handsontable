import type { HotInstance } from '../types';

/**
 * Returns the width an overlays-layer element (the dialog, the license lock screen) must take to
 * cover the whole grid block: the table's workspace width (or its total width when the window
 * scrolls the columns) plus the width of the `start` and `end` side slots. The element is anchored
 * at the root wrapper's inline-start edge, which is where the `start` slot begins.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {number} The width in pixels.
 */
export function getOverlayLayerWidth(hot: HotInstance): number {
  const { view, rootSlotStartElement, rootSlotEndElement } = hot;
  const gridWidth = view.isHorizontallyScrollableByWindow()
    ? view.getTotalTableWidth() : view.getWorkspaceWidth();
  const startWidth = rootSlotStartElement?.offsetWidth ?? 0;
  const endWidth = rootSlotEndElement?.offsetWidth ?? 0;

  return gridWidth + startWidth + endWidth;
}
