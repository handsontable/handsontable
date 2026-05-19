/**
 * Viewport helpers for the Comments plugin editor.
 *
 * Both functions are pure and have no DOM or Handsontable dependency, so they
 * can be unit-tested in isolation.
 *
 * @private
 */

export const VIEWPORT_MARGIN = 8;

/**
 * Caps the given size so it never exceeds the viewport (minus any reserved
 * scrollbar widths and 2 * margin) on each axis. Used to prevent the comments
 * editor from rendering larger than the visible viewport (most common on
 * mobile portrait screens).
 *
 * @param {{ width: number, height: number }} size The desired size.
 * @param {object} viewport Viewport dimensions.
 * @param {number} viewport.innerWidth Viewport inner width in pixels.
 * @param {number} viewport.innerHeight Viewport inner height in pixels.
 * @param {number} [viewport.verticalScrollbarWidth] Width of the vertical scrollbar, if any.
 * @param {number} [viewport.horizontalScrollbarWidth] Height of the horizontal scrollbar, if any.
 * @param {number} [margin] Distance to keep from the viewport edges. Defaults to `VIEWPORT_MARGIN`.
 * @returns {{ width: number, height: number }} The capped size.
 */
export function shrinkSizeToViewport(
  size: { width: number; height: number },
  viewport: {
    innerWidth: number;
    innerHeight: number;
    verticalScrollbarWidth?: number;
    horizontalScrollbarWidth?: number;
  },
  margin = VIEWPORT_MARGIN
): { width: number; height: number } {
  const {
    innerWidth,
    innerHeight,
    verticalScrollbarWidth = 0,
    horizontalScrollbarWidth = 0,
  } = viewport;
  const maxWidth = Math.max(0, innerWidth - verticalScrollbarWidth - (2 * margin));
  const maxHeight = Math.max(0, innerHeight - horizontalScrollbarWidth - (2 * margin));

  return {
    width: Math.min(size.width, maxWidth),
    height: Math.min(size.height, maxHeight),
  };
}

/**
 * Clamps a rectangle's document-space x/y so it remains fully inside the
 * viewport, accounting for page scroll and reserved scrollbar widths.
 *
 * When the rect is wider/taller than the available viewport area (which can
 * happen if `shrinkSizeToViewport` was not applied first), the function
 * prefers the top/left edge so the rect stays anchored to the visible area
 * rather than wrapping into negative coordinates.
 *
 * @param {{ x: number, y: number, width: number, height: number }} rect The target rectangle.
 * @param {object} viewport Viewport dimensions and scroll offsets.
 * @param {number} viewport.innerWidth Viewport inner width in pixels.
 * @param {number} viewport.innerHeight Viewport inner height in pixels.
 * @param {number} viewport.scrollX Horizontal page scroll offset.
 * @param {number} viewport.scrollY Vertical page scroll offset.
 * @param {number} [viewport.verticalScrollbarWidth] Width of the vertical scrollbar, if any.
 * @param {number} [viewport.horizontalScrollbarWidth] Height of the horizontal scrollbar, if any.
 * @param {number} [margin] Distance to keep from the viewport edges. Defaults to `VIEWPORT_MARGIN`.
 * @returns {{ x: number, y: number }} The clamped x/y.
 */
export function clampPositionToViewport(
  rect: { x: number; y: number; width: number; height: number },
  viewport: {
    innerWidth: number;
    innerHeight: number;
    scrollX: number;
    scrollY: number;
    verticalScrollbarWidth?: number;
    horizontalScrollbarWidth?: number;
  },
  margin = VIEWPORT_MARGIN
): { x: number; y: number } {
  const {
    innerWidth,
    innerHeight,
    scrollX,
    scrollY,
    verticalScrollbarWidth = 0,
    horizontalScrollbarWidth = 0,
  } = viewport;
  const leftEdge = scrollX;
  const topEdge = scrollY;
  const rightEdge = scrollX + innerWidth - verticalScrollbarWidth;
  const bottomEdge = scrollY + innerHeight - horizontalScrollbarWidth;
  let { x, y } = rect;

  if (x < leftEdge) {
    x = leftEdge + margin;
  } else if (x + rect.width > rightEdge) {
    x = Math.max(leftEdge + margin, rightEdge - rect.width - margin);
  }

  if (y < topEdge) {
    y = topEdge + margin;
  } else if (y + rect.height > bottomEdge) {
    y = Math.max(topEdge + margin, bottomEdge - rect.height - margin);
  }

  return { x, y };
}
