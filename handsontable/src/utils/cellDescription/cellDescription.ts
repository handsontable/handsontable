import { CELL_DESCRIPTION_ID_PREFIX } from '../../helpers/a11y';

/**
 * A cell points at the hidden element that holds its description through `aria-describedby`, after the reference
 * Walkontable writes to its column header, so a screen reader reads the description with the cell and the header.
 * The text is never inside the cell and never drawn, so the cell's own text, its accessible name, `textContent`,
 * `innerText`, the copied text and its box stay as they were. The ids start with {@link CELL_DESCRIPTION_ID_PREFIX}.
 */
export { CELL_DESCRIPTION_ID_PREFIX };

/**
 * The position of each part in the description. A part with a lower rank is read first.
 */
export const CELL_DESCRIPTION_RANK = {
  PENDING: 5,
  READ_ONLY: 10,
  LINK: 20,
  MERGED: 30,
  ROW_LEVEL: 40,
} as const;

/**
 * The separator between the parts of a description.
 */
const PARTS_SEPARATOR = ', ';

const DESCRIBED_BY = 'aria-describedby';

interface DescriptionPart {
  rank: number;
  text: string;
}

/**
 * The parts collected for each cell being painted. Keyed by the element, not held in one slot, so a cell
 * painted inside another cell's paint (a renderer that builds a grid in its cell) cannot take the outer
 * cell's parts, and a paint that threw leaves nothing but an entry the garbage collector takes with the element.
 */
const partsOfCell = new WeakMap<HTMLTableCellElement, DescriptionPart[]>();

/**
 * The parts a cell was last painted with, so that one part of a painted cell can be changed without a paint
 * ({@link redescribeRenderedCell}). A paint with no part leaves no entry.
 */
const lastPartsOfCell = new WeakMap<HTMLTableCellElement, DescriptionPart[]>();

/**
 * Starts collecting the parts of the description of a cell. Called by the cell painter before the cell's
 * renderers run, so a part left over from a paint that never finished cannot reach this one.
 *
 * @param {HTMLTableCellElement} TD The cell element being painted.
 */
export function beginCellDescription(TD: HTMLTableCellElement): void {
  const parts = partsOfCell.get(TD);

  if (parts) {
    parts.length = 0;
  } else {
    partsOfCell.set(TD, []);
  }
}

/**
 * Adds a part to the description of the cell being painted. A rank holds one part, so a second call with the
 * same rank replaces the first: two plugins that both find a link in a cell describe it once. A call for an
 * element that is not being painted (a cell painted outside the grid, such as a measuring table) is ignored.
 *
 * @param {HTMLTableCellElement} TD The cell element being painted.
 * @param {number} rank The part's place in the description, one of {@link CELL_DESCRIPTION_RANK}.
 * @param {string|null|undefined} text The translated phrase. An empty value adds nothing: a phrase that no
 *   dictionary holds answers `null`.
 */
export function addCellDescriptionPart(
  TD: HTMLTableCellElement,
  rank: number,
  text: string | null | undefined,
): void {
  const parts = partsOfCell.get(TD);

  if (parts === undefined || typeof text !== 'string' || text === '') {
    return;
  }

  const existing = parts.find(part => part.rank === rank);

  if (existing) {
    existing.text = text;

    return;
  }

  parts.push({ rank, text });
}

/**
 * Takes a part back out of the description of the cell being painted. A listener that rewrites the cell after
 * the one that described it (the Formulas plugin showing formulas as text, which removes the link) calls it.
 *
 * @param {HTMLTableCellElement} TD The cell element being painted.
 * @param {number} rank The part's place in the description, one of {@link CELL_DESCRIPTION_RANK}.
 */
export function removeCellDescriptionPart(TD: HTMLTableCellElement, rank: number): void {
  const parts = partsOfCell.get(TD);
  const index = parts === undefined ? -1 : parts.findIndex(part => part.rank === rank);

  if (parts !== undefined && index !== -1) {
    parts.splice(index, 1);
  }
}

/**
 * Joins the collected parts in the order of their rank.
 *
 * @param {DescriptionPart[]} parts The parts of one cell.
 * @returns {string}
 */
function composeParts(parts: DescriptionPart[]): string {
  if (parts.length === 0) {
    return '';
  }

  if (parts.length > 1) {
    parts.sort((a, b) => a.rank - b.rank);
  }

  return parts
    .filter(part => part.rank !== CELL_DESCRIPTION_RANK.ROW_LEVEL)
    .map(part => part.text)
    .join(PARTS_SEPARATOR);
}

/**
 * The part of a grid that the description elements need: where they live and a name that tells grids apart.
 */
export interface CellDescriptionHost {
  guid: string;
  rootElement: HTMLElement;
  rootDocument: Document;
}

/**
 * The description elements of one grid: by text, and the number the next id takes. The number only grows, so an id is
 * never used twice in a root, whatever was removed from it.
 */
interface DescriptionElements {
  byText: Map<string, HTMLElement>;
  next: number;
  level: HTMLElement | null;
}

/**
 * The description elements of each grid. Keyed by the grid's root element, which the elements are children of, so
 * they go with it.
 */
const elementsOfRoot = new WeakMap<HTMLElement, DescriptionElements>();

/**
 * Returns the description elements of a grid, making the record the first time.
 *
 * @param {CellDescriptionHost} hot The Handsontable instance.
 * @returns {DescriptionElements}
 */
function getDescriptionElements(hot: CellDescriptionHost): DescriptionElements {
  let elements = elementsOfRoot.get(hot.rootElement);

  if (elements === undefined) {
    elements = { byText: new Map(), next: 0, level: null };
    elementsOfRoot.set(hot.rootElement, elements);
  }

  return elements;
}

/**
 * Returns the id of the one hidden element that holds the level of a row, and sets its text. Only the
 * highlighted cell of a nested row carries the level, so one element serves the whole walk: the text is
 * written in place, where an element per text would stay in the root for every row the user visited.
 *
 * @param {CellDescriptionHost} hot The Handsontable instance.
 * @param {string} text The level of the row.
 * @returns {string}
 */
function getLevelElementId(hot: CellDescriptionHost, text: string): string {
  const elements = getDescriptionElements(hot);
  let element = elements.level;

  if (element === null || element.parentNode !== hot.rootElement) {
    element = hot.rootDocument.createElement('span');
    element.id = `${CELL_DESCRIPTION_ID_PREFIX}${hot.guid}-level`;
    element.hidden = true;
    hot.rootElement.appendChild(element);
    elements.level = element;
  }

  if (element.textContent !== text) {
    element.textContent = text;
  }

  return element.id;
}

/**
 * Returns the id of the hidden element that holds a text in the grid's root, making it the first time. One element
 * serves every cell with the same description. It sits in the root, not in the page's portal, because an id has to
 * resolve in the tree the cell is in (a grid inside a shadow root). The element is remembered, so a paint that finds
 * it still in the root searches nothing; one that a host's own markup removed is made again under a new id.
 *
 * @param {CellDescriptionHost} hot The Handsontable instance.
 * @param {string} text The description.
 * @returns {string}
 */
function getDescriptionElementId(hot: CellDescriptionHost, text: string): string {
  const elements = getDescriptionElements(hot);
  const known = elements.byText.get(text);

  if (known !== undefined && known.parentNode === hot.rootElement) {
    return known.id;
  }

  const element = hot.rootDocument.createElement('span');

  element.id = `${CELL_DESCRIPTION_ID_PREFIX}${hot.guid}-${elements.next}`;
  elements.next += 1;
  element.hidden = true;
  element.textContent = text;
  hot.rootElement.appendChild(element);
  elements.byText.set(text, element);

  return element.id;
}

/**
 * Ends the description of the cell being painted: points the cell at the element that holds the text, or takes
 * the reference off when there is none. The reference joins the one Walkontable wrote to the column header and
 * never replaces it. The attribute is written only when it changes, so a paint that changes nothing writes nothing.
 *
 * @param {CellDescriptionHost} hot The Handsontable instance.
 * @param {HTMLTableCellElement} TD The cell element being painted.
 * @param {boolean} enabled `false` when the grid writes no ARIA (`ariaTags: false`): the cell then carries
 *   no description, whatever the parts said.
 */
export function applyCellDescription(hot: CellDescriptionHost, TD: HTMLTableCellElement, enabled: boolean): void {
  const parts = partsOfCell.get(TD);
  const text = enabled && parts !== undefined ? composeParts(parts) : '';
  const level = enabled && parts !== undefined ?
    (parts.find(part => part.rank === CELL_DESCRIPTION_RANK.ROW_LEVEL)?.text ?? '') : '';
  const current = TD.getAttribute(DESCRIBED_BY) ?? '';

  partsOfCell.delete(TD);

  if (parts !== undefined && parts.length > 0) {
    lastPartsOfCell.set(TD, parts);
  } else {
    lastPartsOfCell.delete(TD);
  }

  // The commonest cell has neither a description nor a reference of ours from an earlier paint.
  if (text === '' && level === '' && !current.includes(CELL_DESCRIPTION_ID_PREFIX)) {
    return;
  }

  const tokens = current.split(' ').filter(token => token !== '' && !token.startsWith(CELL_DESCRIPTION_ID_PREFIX));

  if (text !== '') {
    tokens.push(getDescriptionElementId(hot, text));
  }

  if (level !== '') {
    tokens.push(getLevelElementId(hot, level));
  }

  const next = tokens.join(' ');

  if (next === current) {
    return;
  }

  if (next === '') {
    TD.removeAttribute(DESCRIBED_BY);
  } else {
    TD.setAttribute(DESCRIBED_BY, next);
  }
}

/**
 * Sets or takes away one part of the description of a cell that is already painted, without a paint. The other
 * parts are the ones the cell was last painted with. A selection change draws with a fast draw, which runs no
 * cell renderer, so a part that follows the selection is written here, on the elements the grid shows now; the
 * part is also added by the plugin in `afterRenderer`, so the next paint keeps it.
 *
 * @param {CellDescriptionHost} hot The Handsontable instance.
 * @param {HTMLTableCellElement} TD The cell element that is painted.
 * @param {number} rank The part's place in the description, one of {@link CELL_DESCRIPTION_RANK}.
 * @param {string|null|undefined} text The translated phrase, or an empty value to take the part away.
 * @param {boolean} enabled `false` when the grid writes no ARIA (`ariaTags: false`).
 */
export function redescribeRenderedCell(
  hot: CellDescriptionHost,
  TD: HTMLTableCellElement,
  rank: number,
  text: string | null | undefined,
  enabled: boolean,
): void {
  const parts = (lastPartsOfCell.get(TD) ?? []).filter(part => part.rank !== rank);

  if (typeof text === 'string' && text !== '') {
    parts.push({ rank, text });
  }

  partsOfCell.set(TD, parts);
  applyCellDescription(hot, TD, enabled);
}

/**
 * Returns every cell element of a grid that points at its level description. A cell in a frozen corner is drawn
 * in up to four tables, and a paint adds the description to each copy, so taking it away has to find them all.
 *
 * @param {CellDescriptionHost} hot The Handsontable instance.
 * @returns {HTMLTableCellElement[]}
 */
export function findCellsWithLevelDescription(hot: CellDescriptionHost): HTMLTableCellElement[] {
  return Array.from(hot.rootElement.querySelectorAll<HTMLTableCellElement>(
    `td[${DESCRIBED_BY}*="${CELL_DESCRIPTION_ID_PREFIX}${hot.guid}-level"]`,
  ));
}
