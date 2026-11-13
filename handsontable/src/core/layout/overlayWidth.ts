import { hasClass } from '../../helpers/dom/element';
import { getSideSlotsWidth } from '../rootSize';
import type { HotInstance } from '../types';

/**
 * Returns the width an overlays-layer element (the dialog, the license lock screen) must take to
 * cover the whole grid block: the table's workspace width (or its total width when the window
 * scrolls the columns) plus the width of the `start` and `end` side slots. The element is anchored
 * at the root wrapper's inline-start edge, which is where the `start` slot begins.
 *
 * When the window scrolls the columns, side panels are docked, and the table fits between them (the
 * wrapper has no `ht-grid-width-follows-content`), the grid track fills the wrapper and the `end`
 * panel sits at its far edge, so the element takes the wrapper's width.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {number} The width in pixels.
 */
export function getOverlayLayerWidth(hot: HotInstance): number {
  const { view, rootWrapperElement } = hot;
  const sideSlotsWidth = getSideSlotsWidth(hot);

  if (!view.isHorizontallyScrollableByWindow()) {
    return view.getWorkspaceWidth() + sideSlotsWidth;
  }

  if (sideSlotsWidth > 0 && rootWrapperElement && !hasClass(rootWrapperElement, 'ht-grid-width-follows-content')) {
    return rootWrapperElement.clientWidth;
  }

  return view.getTotalTableWidth() + sideSlotsWidth;
}
