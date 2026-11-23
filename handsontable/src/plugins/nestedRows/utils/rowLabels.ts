import { A11Y_LABELED_BY } from '../../../helpers/a11y';

/**
 * The level of a nested row is added to the accessible NAME of each data cell of the row, after the cell's
 * content: the cell is labelled by itself and by a hidden element that holds ", Level 2, 4 of 6"
 * (`aria-labelledby="<cell id> <level element id>"`). A description would be read before the value by VoiceOver,
 * and the text never goes inside the cell, so the cell's `textContent` does not change.
 *
 * A row that holds such cells is labelled by their ids too. Per the accessible name computation, an element
 * reached through `aria-labelledby` gives its content and does not follow its own `aria-labelledby`, so the row
 * is named by the plain cell texts. Without it Chromium builds the row name from the cell names, and the level
 * repeats once per column.
 */
const LABELED_BY = A11Y_LABELED_BY('')[0];

/**
 * The id this module gave each cell element. A cell keeps one id for its whole life, in every overlay copy its
 * own one, so the references never point at another element.
 */
const ownCellIds = new WeakMap<HTMLElement, string>();

/**
 * The `aria-labelledby` value this module wrote on each cell or row element. A value that differs from it was
 * written by someone else (a renderer), and is never touched.
 */
const ownLabels = new WeakMap<HTMLElement, string>();

/**
 * The number the next cell id takes. Ids carry the grid's `guid` as well, so two grids on a page never share one.
 */
let nextCellId = 0;

/**
 * Returns the id a cell is referenced by. A cell with an `id` keeps it, whoever set it; a cell without one gets
 * the id this module gave the element before, or a new one.
 *
 * @param {string} guid The grid's unique id.
 * @param {HTMLTableCellElement} TD The cell.
 * @returns {string}
 */
function ensureCellId(guid: string, TD: HTMLTableCellElement): string {
  if (TD.id !== '') {
    return TD.id;
  }

  let id = ownCellIds.get(TD);

  if (id === undefined) {
    id = `${guid}-cell-${nextCellId}`;
    nextCellId += 1;
    ownCellIds.set(TD, id);
  }

  TD.id = id;

  return id;
}

/**
 * Tells whether an element carries the `aria-labelledby` this module wrote, unchanged.
 *
 * @param {HTMLElement} element A cell or a row.
 * @returns {boolean}
 */
export function hasOwnLabel(element: HTMLElement): boolean {
  const own = ownLabels.get(element);

  return own !== undefined && element.getAttribute(LABELED_BY) === own;
}

/**
 * Takes this module's `aria-labelledby` off an element. A value someone else wrote stays.
 *
 * @param {HTMLElement} element A cell or a row.
 * @returns {boolean} `true` when the element carried a label of this module.
 */
export function removeOwnLabel(element: HTMLElement): boolean {
  if (!ownLabels.has(element)) {
    return false;
  }

  if (hasOwnLabel(element)) {
    element.removeAttribute(LABELED_BY);
  }

  ownLabels.delete(element);

  return true;
}

/**
 * Writes an `aria-labelledby` value of this module, only when it changes.
 *
 * @param {HTMLElement} element A cell or a row.
 * @param {string} value The ids.
 */
function writeOwnLabel(element: HTMLElement, value: string): void {
  if (element.getAttribute(LABELED_BY) !== value) {
    element.setAttribute(LABELED_BY, value);
  }

  ownLabels.set(element, value);
}

/**
 * Labels a data cell with its own content followed by the level element, or takes the label off when the cell
 * has no level (`levelElementId` is `null`). A cell that carries an `aria-label`, or an `aria-labelledby` that
 * this module did not write, was named by its renderer: it is left alone, and a label of ours on it goes.
 *
 * @param {string} guid The grid's unique id.
 * @param {HTMLTableCellElement} TD The cell, painted by its renderer.
 * @param {string|null} levelElementId The id of the hidden element that holds the level text.
 * @returns {boolean} `true` when the cell carries or carried a label of this module, so its row needs a look.
 */
export function labelCell(guid: string, TD: HTMLTableCellElement, levelElementId: string | null): boolean {
  const current = TD.getAttribute(LABELED_BY);
  const isNamedByRenderer = TD.hasAttribute('aria-label') || (current !== null && current !== ownLabels.get(TD));

  if (levelElementId === null || isNamedByRenderer) {
    return removeOwnLabel(TD);
  }

  writeOwnLabel(TD, `${ensureCellId(guid, TD)} ${levelElementId}`);

  return true;
}

/**
 * Labels a row with the ids of its cells that carry a label of this module, in DOM order, or takes the label
 * off when none does.
 *
 * @param {HTMLTableRowElement} TR The row.
 */
export function labelRow(TR: HTMLTableRowElement): void {
  const ids: string[] = [];
  const cells = TR.children;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i] as HTMLElement;

    if (cell.tagName === 'TD' && hasOwnLabel(cell)) {
      ids.push(cell.id);
    }
  }

  if (ids.length === 0) {
    removeOwnLabel(TR);
  } else {
    writeOwnLabel(TR, ids.join(' '));
  }
}

/**
 * Takes this module's labels off a row and off its cells.
 *
 * @param {HTMLTableRowElement} TR The row.
 */
export function removeRowLabels(TR: HTMLTableRowElement): void {
  removeOwnLabel(TR);

  const cells = TR.children;

  for (let i = 0; i < cells.length; i++) {
    removeOwnLabel(cells[i] as HTMLElement);
  }
}
