/**
 * The attributes the renderers write on a cell or header, by name, with the value the current draw
 * gives them. A name that is not a key is not kept.
 */
export type KeptAriaAttributes = Readonly<Record<string, string>>;

/**
 * The set for a draw that keeps nothing (`ariaTags: false`): every accessibility attribute is removed.
 */
export const NO_KEPT_ARIA_ATTRIBUTES: KeptAriaAttributes = Object.freeze({});

/**
 * Checks whether an attribute is one of the accessibility attributes a renderer clears before it paints a
 * recycled element. The test is a substring match on purpose: it is the one the renderers have always applied
 * (`/aria-(.*)/` and `/role/`, both unanchored), so a `data-role` or `data-aria-*` attribute set by a cell
 * renderer is cleared as well.
 *
 * @param {string} name The attribute name.
 * @returns {boolean}
 */
export function isClearedAriaAttribute(name: string): boolean {
  return name.includes('aria-') || name.includes('role');
}

/**
 * Clears the accessibility attributes the previous paint of a recycled element left on it, except the ones
 * this draw writes. Those stay in place for the caller to overwrite when their value differs, so a repaint of
 * an element with the attributes it already carries makes no DOM write, and a changed one costs one write.
 *
 * @param {HTMLElement} element The cell or header.
 * @param {KeptAriaAttributes} kept The attributes this draw writes, with their values.
 */
export function clearStaleAriaAttributes(element: HTMLElement, kept: KeptAriaAttributes): void {
  const attributeNames = element.getAttributeNames();

  for (let i = 0; i < attributeNames.length; i++) {
    const name = attributeNames[i];

    // No name of the object prototype contains `aria-` or `role`, so a plain lookup is safe here.
    if (isClearedAriaAttribute(name) && kept[name] === undefined) {
      element.removeAttribute(name);
    }
  }
}

/**
 * Brings an element's accessibility attributes to the given set: clears every one the set does not hold
 * (see `clearStaleAriaAttributes`), then writes each of the set's attributes whose value differs. For an
 * element whose renderer runs after this, so nothing has to defer to it.
 *
 * @param {HTMLElement} element The header.
 * @param {KeptAriaAttributes} attributes The attributes the element carries, with their values. It may hold
 * attributes the clearing pass never touches (`tabindex`, `scope`), which are then only written.
 */
export function syncAriaAttributes(element: HTMLElement, attributes: KeptAriaAttributes): void {
  clearStaleAriaAttributes(element, attributes);

  const names = Object.keys(attributes);

  for (let i = 0; i < names.length; i++) {
    setAttributeIfChanged(element, names[i], attributes[names[i]]);
  }
}

/**
 * Sets an attribute only when it is missing or holds another value.
 *
 * @param {HTMLElement} element The element.
 * @param {string} name The attribute name.
 * @param {string} value The value.
 */
export function setAttributeIfChanged(element: HTMLElement, name: string, value: string): void {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

/**
 * Sets an attribute only when it is missing. A value already there, written by this draw's renderer, wins.
 *
 * @param {HTMLElement} element The element.
 * @param {string} name The attribute name.
 * @param {string} value The value.
 */
export function setAttributeIfMissing(element: HTMLElement, name: string, value: string): void {
  if (!element.hasAttribute(name)) {
    element.setAttribute(name, value);
  }
}
