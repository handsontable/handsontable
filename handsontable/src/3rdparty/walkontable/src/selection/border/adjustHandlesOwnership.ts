/**
 * Pure rules deciding which overlay draws each edge-adjustment handle (`selectionHandles`) of a
 * selection, and which part of the selection the handles are centered on.
 *
 * A selection that crosses a frozen-pane line is drawn once per overlay, each slice clamped to what
 * that overlay renders. Every overlay evaluates these rules on identical inputs (the fixed-pane
 * settings, the raw corners, and the master's visible range snapshotted for the draw), so each handle
 * is claimed by exactly one overlay. Kept free of DOM and Walkontable state so the rules can be unit
 * tested table-driven; `Border` resolves the inputs and applies the result.
 */
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_START_CORNER,
} from '../../overlay/constants';

/**
 * The four handle edges, in the order the handles are positioned.
 */
export const ADJUST_HANDLE_EDGES = ['top', 'bottom', 'start', 'end'] as const;

/**
 * One of the four handle edges.
 */
export type AdjustHandleEdge = typeof ADJUST_HANDLE_EDGES[number];

/**
 * The frozen-pane segment an index falls in on one axis: `start` for the `fixedRowsTop` /
 * `fixedColumnsStart` pane, `end` for the `fixedRowsBottom` pane, `main` for the scrollable part.
 */
export type AxisSegment = 'start' | 'main' | 'end';

/**
 * The master's visible tracks on one axis, as `[first, last]` renderable indexes. `partial` counts a
 * track the viewport shows any of, `full` only a track it shows whole. Both leave the frozen panes
 * out, and a range starting below 0 is empty.
 */
export interface AxisVisibleRange {
  partial: [number, number];
  full: [number, number];
}

/**
 * What the ownership rules know about one axis.
 */
export interface AdjustHandlesAxisLayout {
  total: number;
  main: [number, number];
  overlaySegment: AxisSegment;
  visible: AxisVisibleRange;
}

/**
 * The per-axis layout.
 */
export interface AdjustHandlesLayout {
  row: AdjustHandlesAxisLayout;
  column: AdjustHandlesAxisLayout;
}

/**
 * Tells which segment an overlay renders on one axis. The `inline_start` overlay and the corners
 * render the frozen columns; the `top`/`bottom` overlays and their corners render the frozen rows;
 * everything else belongs to the scrollable part.
 *
 * Every clone type in `CLONE_TYPES` (`overlay/constants.ts`) must be listed here: a name this
 * function does not know falls through to `main` on both axes, and that overlay would then claim the
 * handles of the scrollable part.
 *
 * @param {string} overlayName The overlay (table) name.
 * @param {'row'|'column'} axis The axis to test.
 * @returns {AxisSegment}
 */
export function getOverlaySegment(overlayName: string, axis: 'row' | 'column'): AxisSegment {
  if (axis === 'column') {
    return [CLONE_INLINE_START, CLONE_TOP_INLINE_START_CORNER, CLONE_BOTTOM_INLINE_START_CORNER]
      .includes(overlayName) ? 'start' : 'main';
  }
  if (overlayName === CLONE_TOP || overlayName === CLONE_TOP_INLINE_START_CORNER) {
    return 'start';
  }

  return overlayName === CLONE_BOTTOM || overlayName === CLONE_BOTTOM_INLINE_START_CORNER ? 'end' : 'main';
}

/**
 * Tells which segment a renderable index falls in on one axis.
 *
 * @param {AdjustHandlesAxisLayout} axis The axis layout.
 * @param {number} index The renderable index.
 * @returns {AxisSegment}
 */
export function getAxisSegment(axis: AdjustHandlesAxisLayout, index: number): AxisSegment {
  if (index < axis.main[0]) {
    return 'start';
  }

  return index > axis.main[1] ? 'end' : 'main';
}

/**
 * Tells whether an index lies inside an inclusive range. A range starting below 0 is empty.
 *
 * @param {number[]} range The `[from, to]` range.
 * @param {number} index The index to test.
 * @returns {boolean}
 */
function isInRange([from, to]: [number, number], index: number): boolean {
  return from >= 0 && index >= from && index <= to;
}

/**
 * Tells whether the start or end edge of a scrollable track is on screen. A track the viewport shows
 * only part of has one edge cut off: the first partially visible track loses its start edge (behind a
 * frozen pane or before the holder), the last one its end edge, unless the track is also fully visible.
 *
 * @param {AxisVisibleRange} visible The master's visible range on the axis.
 * @param {number} index The renderable index of the track.
 * @param {'start'|'end'} side Which edge of the track.
 * @returns {boolean}
 */
export function isTrackEdgeVisible(visible: AxisVisibleRange, index: number, side: 'start' | 'end'): boolean {
  const { partial, full } = visible;

  if (!isInRange(partial, index)) {
    return false;
  }

  return side === 'start'
    ? index > partial[0] || index === full[0]
    : index < partial[1] || index === full[1];
}

/**
 * Picks the segment the handles are centered in on one axis: the scrollable (`main`) part when the
 * viewport shows a whole track of the selection's scrollable part, otherwise the frozen pane the
 * selection reaches into. A sliver of a scrollable track does not count, or the handles would be
 * centered on it and land behind the frozen pane. The fallback also keeps the handles on screen when
 * the scrollable part is scrolled out of view.
 *
 * @param {AdjustHandlesAxisLayout} axis The axis layout.
 * @param {number} from The selection's first index on that axis.
 * @param {number} to The selection's last index on that axis.
 * @returns {AxisSegment}
 */
export function getCenterSegment(axis: AdjustHandlesAxisLayout, from: number, to: number): AxisSegment {
  const [mainFrom, mainTo] = axis.main;
  const [firstVisible, lastVisible] = axis.visible.full;

  if (firstVisible >= 0 && Math.max(from, mainFrom, firstVisible) <= Math.min(to, mainTo, lastVisible)) {
    return 'main';
  }

  const fromSegment = getAxisSegment(axis, from);

  return fromSegment === 'main' ? getAxisSegment(axis, to) : fromSegment;
}

/**
 * Tells which of the four handles the overlay described by `layout` draws:
 *
 * - The overlay's segment on the handle's own axis must contain the edge, and the overlay must
 * render that edge unclamped. An edge clamped to the rendered range lies inside the selection, not
 * on it. In the scrollable segment the edge must also be on screen, or its handle would sit behind a
 * frozen pane or outside the holder.
 * - The overlay's segment on the cross axis, where the handle is centered, must be the one
 * {@link getCenterSegment} picks.
 *
 * @param {AdjustHandlesLayout} layout The per-axis layout.
 * @param {number[]} corners The raw `[fromRow, fromColumn, toRow, toColumn]` renderable corners.
 * @param {number[]} clampedCorners The corners clamped to the range the overlay renders.
 * @returns {object} One flag per edge (`top`, `bottom`, `start`, `end`), `true` when the overlay
 * draws that edge's handle.
 */
export function getHandleOwnership(
  layout: AdjustHandlesLayout,
  corners: number[],
  clampedCorners: number[],
): Record<AdjustHandleEdge, boolean> {
  const [fromRow, fromColumn, toRow, toColumn] = corners;
  const [clampedFromRow, clampedFromColumn, clampedToRow, clampedToColumn] = clampedCorners;
  const { row, column } = layout;
  const ownsRowCenter = row.overlaySegment === getCenterSegment(row, fromRow, toRow);
  const ownsColumnCenter = column.overlaySegment === getCenterSegment(column, fromColumn, toColumn);
  const ownsEdge = (axis: AdjustHandlesAxisLayout, index: number, clampedIndex: number, side: 'start' | 'end') =>
    clampedIndex === index && getAxisSegment(axis, index) === axis.overlaySegment &&
    (axis.overlaySegment !== 'main' || isTrackEdgeVisible(axis.visible, index, side));

  return {
    top: ownsColumnCenter && ownsEdge(row, fromRow, clampedFromRow, 'start'),
    bottom: ownsColumnCenter && ownsEdge(row, toRow, clampedToRow, 'end'),
    start: ownsRowCenter && ownsEdge(column, fromColumn, clampedFromColumn, 'start'),
    end: ownsRowCenter && ownsEdge(column, toColumn, clampedToColumn, 'end'),
  };
}

/**
 * Returns the part of a clamped selection span the handles are centered on: the span inside the
 * overlay's own segment and, in the scrollable segment, inside the master's fully visible tracks (or
 * its partially visible ones, when no whole track of the span is on screen).
 *
 * @param {AdjustHandlesAxisLayout} axis The axis layout.
 * @param {number} from The clamped first index.
 * @param {number} to The clamped last index.
 * @returns {number[]} The `[from, to]` span, empty (`from > to`) when nothing is left.
 */
export function getHandlesSpan(axis: AdjustHandlesAxisLayout, from: number, to: number): [number, number] {
  const { main, total, overlaySegment, visible } = axis;

  if (overlaySegment === 'start') {
    return [Math.max(from, 0), Math.min(to, main[0] - 1)];
  }
  if (overlaySegment === 'end') {
    return [Math.max(from, main[1] + 1), Math.min(to, total - 1)];
  }

  const segmentFrom = Math.max(from, main[0]);
  const segmentTo = Math.min(to, main[1]);

  for (const range of [visible.full, visible.partial]) {
    const spanFrom = Math.max(segmentFrom, range[0]);
    const spanTo = Math.min(segmentTo, range[1]);

    if (range[0] >= 0 && spanFrom <= spanTo) {
      return [spanFrom, spanTo];
    }
  }

  return [segmentFrom, segmentTo];
}
