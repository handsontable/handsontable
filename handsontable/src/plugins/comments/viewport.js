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
 * Caps the given size so it never exceeds the viewport minus 2 * margin on
 * each axis. Used to prevent the comments editor from rendering larger than
 * the visible viewport (most common on mobile portrait screens).
 *
 * @param {{ width: number, height: number }} size The desired size.
 * @param {{ innerWidth: number, innerHeight: number }} viewport The viewport
 *   dimensions (typically `window.innerWidth` / `innerHeight`).
 * @param {number} [margin] Distance to keep from the viewport edges. Defaults
 *   to `VIEWPORT_MARGIN`.
 * @returns {{ width: number, height: number }} The capped size.
 */
export function shrinkSizeToViewport(size, viewport, margin = VIEWPORT_MARGIN) {
  const maxWidth = Math.max(0, viewport.innerWidth - (2 * margin));
  const maxHeight = Math.max(0, viewport.innerHeight - (2 * margin));

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
 * @param {{ x: number, y: number, width: number, height: number }} rect The
 *   target rectangle.
 * @param {{
 *   innerWidth: number,
 *   innerHeight: number,
 *   scrollX: number,
 *   scrollY: number,
 *   verticalScrollbarWidth?: number,
 *   horizontalScrollbarWidth?: number,
 * }} viewport Viewport dimensions and scroll offsets.
 * @param {number} [margin] Distance to keep from the viewport edges. Defaults
 *   to `VIEWPORT_MARGIN`.
 * @returns {{ x: number, y: number }} The clamped x/y.
 */
export function clampPositionToViewport(rect, viewport, margin = VIEWPORT_MARGIN) {
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
