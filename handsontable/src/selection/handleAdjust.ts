/**
 * Pure geometry helpers for the selection-adjustment handles feature. Kept DOM-free so the
 * clamp and boundary rules unit-test in isolation.
 */

/**
 * The four selection-edge handles: the block-axis `top`/`bottom` and the inline-axis `start`/`end`.
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

