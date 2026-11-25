/**
 * Tells whether an element can take the focus back when a popup closes: it is in the page, it
 * renders a box, and it is not inside an `inert` subtree.
 *
 * It reads `getClientRects()` rather than `Element#checkVisibility()`, which Chrome < 105 and
 * Safari < 17.4 lack. Those readers still reach the docs (see the `:has()` guard in `Head.astro`),
 * and a throw in the docs assistant's close effect would unmount the whole widget.
 *
 * @param {HTMLElement | null | undefined} element The element.
 * @returns {boolean} `true` when it can.
 */
export function canTakeFocus(element) {
  return Boolean(
    element?.isConnected
    && element.getClientRects().length > 0
    && !element.closest('[inert]'),
  );
}
