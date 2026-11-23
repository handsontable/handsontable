import { CELL_DESCRIPTION_ID_PREFIX } from '../../../../helpers/a11y';

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
 * Tells whether a cell's `aria-describedby` already holds what this draw would leave there, so the draw does not
 * reset it to the column header. It does when the value is the reference to the cell's own column header, followed
 * by any number of references to cell description elements (`CELL_DESCRIPTION_ID_PREFIX`), which are written after
 * the renderer by the cell painter. A value that holds any other reference, the header of another column
 * (a recycled cell moved to another column) or a renderer's own, is not kept.
 *
 * @param {string|null} value The attribute's current value, `null` when the cell has none.
 * @param {string} columnHeaderId The id of the cell's column header, empty when the cell has none.
 * @returns {boolean}
 */
export function isKeptDescribedBy(value: string | null, columnHeaderId: string): boolean {
  if (value === null || value === '') {
    return false;
  }

  const tokens = value.split(' ');
  const first = columnHeaderId === '' ? 0 : 1;

  if (columnHeaderId !== '' && tokens[0] !== columnHeaderId) {
    return false;
  }

  for (let i = first; i < tokens.length; i++) {
    if (!tokens[i].startsWith(CELL_DESCRIPTION_ID_PREFIX)) {
      return false;
    }
  }

  return true;
}

/**
 * Tells whether a cell's `aria-labelledby` is the one a plugin wrote to give the cell's name a suffix, so the draw
 * does not remove it before the renderer runs. It is when the value is the cell's own id followed by references to
 * hidden text elements (`CELL_DESCRIPTION_ID_PREFIX`): the cell names itself with its content, then the text. A value
 * that holds any other reference, a renderer's own included, or that a recycled cell carries under another id, is
 * not kept.
 *
 * @param {string|null} value The attribute's current value, `null` when the cell has none.
 * @param {string} cellId The cell's `id`, empty when it has none.
 * @returns {boolean}
 */
export function isKeptLabelledBy(value: string | null, cellId: string): boolean {
  if (value === null || cellId === '') {
    return false;
  }

  const tokens = value.split(' ');

  if (tokens.length < 2 || tokens[0] !== cellId) {
    return false;
  }

  for (let i = 1; i < tokens.length; i++) {
    if (!tokens[i].startsWith(CELL_DESCRIPTION_ID_PREFIX)) {
      return false;
    }
  }

  return true;
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
