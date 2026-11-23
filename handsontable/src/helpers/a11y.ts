/** Returns [attr, value] for setting on elements (e.g. tabindex, aria-*) */
export const A11Y_TABINDEX = (val: number | string): [string, string | number] => ['tabindex', val];
export const A11Y_TREEGRID = (): [string, string] => ['role', 'treegrid'];
export const A11Y_PRESENTATION = (): [string, string] => ['role', 'presentation'];
export const A11Y_GRIDCELL = (): [string, string] => ['role', 'gridcell'];
export const A11Y_GRIDCELL_BUTTON = (): [string, string] => ['role', 'gridcell button'];
export const A11Y_ROWHEADER = (): [string, string] => ['role', 'rowheader'];
export const A11Y_ROWGROUP = (): [string, string] => ['role', 'rowgroup'];
export const A11Y_COLUMNHEADER = (): [string, string] => ['role', 'columnheader'];
export const A11Y_ROW = (): [string, string] => ['role', 'row'];
export const A11Y_MENU = (): [string, string] => ['role', 'menu'];
export const A11Y_MENU_ITEM = (): [string, string] => ['role', 'menuitem'];
export const A11Y_MENU_ITEM_CHECKBOX = (): [string, string] => ['role', 'menuitemcheckbox'];
export const A11Y_MENU_ITEM_RADIO = (): [string, string] => ['role', 'menuitemradio'];
export const A11Y_SEPARATOR = (): [string, string] => ['role', 'separator'];
export const A11Y_COMBOBOX = (): [string, string] => ['role', 'combobox'];
export const A11Y_LISTBOX = (): [string, string] => ['role', 'listbox'];
export const A11Y_OPTION = (): [string, string] => ['role', 'option'];
export const A11Y_CHECKBOX = (): [string, string] => ['role', 'checkbox'];
export const A11Y_DIALOG = (): [string, string] => ['role', 'dialog'];
export const A11Y_ALERTDIALOG = (): [string, string] => ['role', 'alertdialog'];
export const A11Y_GROUP = (): [string, string] => ['role', 'group'];
export const A11Y_SCOPE_COL = (): [string, string] => ['scope', 'col'];
export const A11Y_SCOPE_ROW = (): [string, string] => ['scope', 'row'];
export const A11Y_TEXT = (): [string, string] => ['type', 'text'];
export const A11Y_LABEL = (val: string): [string, string] => ['aria-label', val];
export const A11Y_LABELED_BY = (val: string): [string, string] => ['aria-labelledby', val];
export const A11Y_DESCRIBED_BY = (val: string): [string, string] => ['aria-describedby', val];
export const A11Y_DESCRIPTION = (val: string): [string, string] => ['aria-description', val];
export const A11Y_HIDDEN = (): [string, string] => ['aria-hidden', 'true'];
export const A11Y_DISABLED = (val: boolean | string = true): [string, string | boolean] => ['aria-disabled', val];
export const A11Y_MULTISELECTABLE = (): [string, string] => ['aria-multiselectable', 'true'];
export const A11Y_HASPOPUP = (val: string): [string, string] => ['aria-haspopup', val];
export const A11Y_ROWCOUNT = (val: number): [string, number] => ['aria-rowcount', val];
export const A11Y_COLCOUNT = (val: number): [string, number] => ['aria-colcount', val];
export const A11Y_ROWINDEX = (val: number): [string, number] => ['aria-rowindex', val];
export const A11Y_COLINDEX = (val: number): [string, number] => ['aria-colindex', val];
export const A11Y_EXPANDED = (val: boolean | string): [string, boolean | string] => ['aria-expanded', val];
export const A11Y_SORT = (val: string): [string, string] => ['aria-sort', val];
export const A11Y_READONLY = (): [string, string] => ['aria-readonly', 'true'];
export const A11Y_INVALID = (): [string, string] => ['aria-invalid', 'true'];
export const A11Y_CHECKED = (val: boolean | string): [string, boolean | string] => ['aria-checked', val];
export const A11Y_SELECTED = (): [string, string] => ['aria-selected', 'true'];
export const A11Y_AUTOCOMPLETE = (): [string, string] => ['aria-autocomplete', 'list'];
export const A11Y_CONTROLS = (val: string): [string, string] => ['aria-controls', val];
export const A11Y_ACTIVEDESCENDANT = (val: string): [string, string] => ['aria-activedescendant', val];
export const A11Y_LIVE = (val: string): [string, string] => ['aria-live', val];
export const A11Y_RELEVANT = (val: string): [string, string] => ['aria-relevant', val];
export const A11Y_LEVEL = (val: number): [string, number] => ['aria-level', val];
export const A11Y_SETSIZE = (val: number): [string, number] => ['aria-setsize', val];
export const A11Y_POSINSET = (val: number): [string, number] => ['aria-posinset', val];
export const A11Y_MODAL = (): [string, string] => ['aria-modal', 'true'];
export const A11Y_BUSY = (): [string, string] => ['aria-busy', 'true'];

/**
 * The prefix of the ids of the hidden elements that hold the descriptions of a grid's cells (`utils/cellDescription`).
 * Walkontable keeps a reference with this prefix on a recycled cell, so it does not reset the cell's
 * `aria-describedby` to the column header and write the description again on every paint.
 */
export const CELL_DESCRIPTION_ID_PREFIX = 'ht-description-';

/**
 * Makes the browser build a new accessibility object for an element: its `role` is removed and written back in
 * the same task. A screen reader that has the focus on the element reads it again, with its column and row,
 * which it does not for an attribute that keeps its value. Every paint of a cell did this before the renderers
 * wrote only the attributes that differ, so the grid asks for it on purpose now, for the one cell that needs it.
 *
 * An element without a `role` (`ariaTags: false`) is left alone.
 *
 * @param {HTMLElement} element The element.
 */
export function rebuildAccessibilityObject(element: HTMLElement): void {
  const role = element.getAttribute('role');

  if (role === null) {
    return;
  }

  element.removeAttribute('role');
  element.setAttribute('role', role);
}

/**
 * The attribute a selection writes on a cell. It follows the selection, not what the cell shows, so a change
 * of it is not a change of the cell.
 */
const SELECTION_ATTRIBUTE = 'aria-selected';

/**
 * Form controls a cell may hold. Their state is a property, so it is not part of the cell's markup.
 */
const CONTROLS_SELECTOR = 'input, textarea, select';

/**
 * Reads what a screen reader would say about a cell: what it shows, the state of the controls inside it, and
 * its ARIA attributes, which include its column (`aria-colindex`, and the reference to its column header).
 * Two reads that return the same string describe a cell the reader has nothing new to say about.
 *
 * The cell's row is not in it: a row is the parent's attribute, and a draw has already written the new one by
 * the time its cells are painted. A cell that moves to another row while showing the same thing is not read
 * again, which is the rare case.
 *
 * @param {HTMLElement} cell The cell.
 * @returns {string}
 */
export function readCellAnnouncementSignature(cell: HTMLElement): string {
  const ariaState = cell.getAttributeNames()
    .filter(name => name.startsWith('aria-') && name !== SELECTION_ATTRIBUTE)
    .sort((a, b) => a.localeCompare(b))
    .map(name => `${name}=${cell.getAttribute(name)}`)
    .join(';');
  const controls = cell.querySelectorAll<HTMLInputElement>(CONTROLS_SELECTOR);
  const controlState: string[] = [];

  for (let i = 0; i < controls.length; i++) {
    controlState.push(`${controls[i].checked ? 1 : 0}:${controls[i].value}`);
  }

  return [cell.innerHTML, controlState.join(','), ariaState].join('|');
}

/**
 * The cell that holds the focus and what a screen reader last had to say about it. The focus is on one
 * element, so one slot is enough, and a cell that takes the focus overwrites it.
 */
let announcedCell: { cell: HTMLElement; signature: string; colIndex: string | null } | null = null;

/**
 * Records what a cell shows now as what the screen reader knows about it. Called when the cell takes the focus.
 *
 * @param {HTMLElement} cell The cell.
 * @param {boolean} [keepExisting=false] When `true`, a record of this same cell stays as it is. The browser
 * focuses a cell that is pressed before the grid selects it, and the record may be older than that.
 */
export function rememberAnnouncedCell(cell: HTMLElement, keepExisting = false): void {
  if (keepExisting && announcedCell?.cell === cell) {
    return;
  }

  announcedCell = {
    cell,
    signature: readCellAnnouncementSignature(cell),
    colIndex: cell.getAttribute('aria-colindex'),
  };
}

/**
 * Tells whether the focused cell shows something else than the screen reader knows about it, and records what
 * it shows now. A cell the slot does not hold, and an element recycled for another column since, only start
 * a new record: the first was never announced to compare with, the second is another cell, which the focus
 * move that follows announces on its own.
 *
 * @param {HTMLElement} cell The focused cell, painted.
 * @returns {boolean}
 */
export function hasCellChangedSinceAnnounced(cell: HTMLElement): boolean {
  const previous = announcedCell?.cell === cell ? announcedCell : null;
  const colIndex = cell.getAttribute('aria-colindex');
  const signature = readCellAnnouncementSignature(cell);

  announcedCell = { cell, signature, colIndex };

  return previous !== null && previous.colIndex === colIndex && previous.signature !== signature;
}
