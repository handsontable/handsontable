import { A11Y_ROW, A11Y_ROWGROUP, A11Y_ROWINDEX, CELL_DESCRIPTION_ID_PREFIX } from '../../../../helpers/a11y';

const [ROLE, ROWGROUP] = A11Y_ROWGROUP();
const ROW = A11Y_ROW()[1];
const ROWINDEX = A11Y_ROWINDEX(0)[0];

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
  for (const name of element.getAttributeNames()) {
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

  for (const name of Object.keys(attributes)) {
    setAttributeIfChanged(element, name, attributes[name]);
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

/**
 * Gives a table section (THEAD or TBODY) whose rows hold cells the `rowgroup` role, written only when the
 * section carries another role or none. A section is a row group only while its rows hold cells: see
 * `dropRowGroupRole` for the others.
 *
 * @param {HTMLElement} section The THEAD or TBODY element.
 */
export function giveRowGroupRole(section: HTMLElement): void {
  setAttributeIfChanged(section, ROLE, ROWGROUP);
}

/**
 * Takes the `rowgroup` role off a table section (THEAD or TBODY) that holds no rows, or whose rows hold no
 * cells. A `rowgroup` with no `row` is an invalid structure, and the section elements are reused across draws,
 * so the role has to go when a section is drawn empty: a clone that renders no frozen rows, a corner, a grid
 * whose rows were all removed. Only a `rowgroup` role is taken off, so a role another module wrote on such a
 * section stays.
 *
 * @param {HTMLElement} section The THEAD or TBODY element.
 */
export function dropRowGroupRole(section: HTMLElement): void {
  if (section.getAttribute(ROLE) === ROWGROUP) {
    section.removeAttribute(ROLE);
  }
}

/**
 * Takes the `row` role and the row index off a table row that holds no cells. A side clone that is turned off
 * (the row headers, the frozen columns) is drawn one last time with the master's rows and none of its columns,
 * and is not drawn again, so its rows would stay in the accessibility tree as rows with nothing in them. The
 * row elements are reused, and get the role back with their cells.
 *
 * @param {HTMLElement} row The TR element.
 */
export function dropRowRole(row: HTMLElement): void {
  if (row.getAttribute(ROLE) === ROW) {
    row.removeAttribute(ROLE);
    row.removeAttribute(ROWINDEX);
  }
}
