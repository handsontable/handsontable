/**
 * Pure geometry helpers for the selection-adjustment handles feature. Kept DOM-free so the
 * clamp and boundary rules unit-test in isolation.
 */

export type HandleEdge = 'top' | 'bottom' | 'start' | 'end';

interface ClampEdgeOptions {
  edge: HandleEdge;
  target: number;
  oppositeIndex: number;
}

/**
 * Clamps a dragged edge index so the dragged edge never crosses the opposite edge (no flip) and
 * never enters the headers (index < 0). Preserves a minimum selection size of one cell.
 *
 * @param {ClampEdgeOptions} options The dragged edge, its target index, and the anchored opposite index.
 * @returns {number} The clamped index.
 */
export function clampEdge({ edge, target, oppositeIndex }: ClampEdgeOptions): number {
  const bounded = Math.max(0, target);

  if (edge === 'top' || edge === 'start') {
    return Math.min(bounded, oppositeIndex);
  }

  return Math.max(bounded, oppositeIndex);
}

interface HiddenEdgesOptions {
  fromRow: number;
  toRow: number;
  fromCol: number;
  toCol: number;
  lastRow: number;
  lastCol: number;
  isRtl: boolean;
}

/**
 * Determines which handle edges must be hidden because they are flush with the grid boundary.
 *
 * @param {HiddenEdgesOptions} options The selection corners and grid extents.
 * @returns {Set<HandleEdge>} The set of edges whose handles must not render.
 */
export function getHiddenHandleEdges({
  fromRow, toRow, fromCol, toCol, lastRow, lastCol,
}: HiddenEdgesOptions): Set<HandleEdge> {
  const hidden = new Set<HandleEdge>();

  if (fromRow <= 0) {
    hidden.add('top');
  }
  if (toRow >= lastRow) {
    hidden.add('bottom');
  }
  if (fromCol <= 0) {
    hidden.add('start');
  }
  if (toCol >= lastCol) {
    hidden.add('end');
  }

  return hidden;
}
