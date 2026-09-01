/**
 * Represents the selection edge that the user drags.
 */
export type HandleEdge = 'top' | 'bottom' | 'start' | 'end';

interface ClampEdgeOptions {
  edge: HandleEdge;
  target: number;
  oppositeIndex: number;
}

/**
 * Clamps a dragged edge without allowing it to cross its opposite edge.
 *
 * @param {ClampEdgeOptions} options The dragged edge, target index, and opposite index.
 * @returns {number} The clamped index.
 */
export function clampEdge({ edge, target, oppositeIndex }: ClampEdgeOptions): number {
  const bounded = Math.max(0, target);

  return edge === 'top' || edge === 'start' ? Math.min(bounded, oppositeIndex) : Math.max(bounded, oppositeIndex);
}
