/**
 * The level of a nested row ends the accessible NAME of each data cell of the row, right after the cell's
 * value. The cell carries the text in an attribute, and the stylesheet draws it as visually hidden generated
 * content (`td[data-ht-row-level]::after`, `_cell-name-suffix.scss`), which is part of the cell's accessible
 * name and not part of its `textContent`, `innerText` or the copied text. The cell keeps its name from its
 * content, so VoiceOver reads the value and the level once, in that order.
 *
 * A row that holds such cells is named by the plain cell texts through `aria-labelledby`, pointing at a hidden
 * element that holds them. Without a name of its own Chromium builds the row's name from the cell names, and the
 * level repeats once per column. VoiceOver ignores an `aria-label` on a row and honors `aria-labelledby`.
 */
export const ROW_LEVEL_ATTRIBUTE = 'data-ht-row-level';

/**
 * The prefix of the ids of the row name elements. The grid's `guid` and a counter follow it.
 */
export const ROW_NAME_ID_PREFIX = 'ht-row-name-';

const LABELLED_BY = 'aria-labelledby';

/**
 * Sets the level text of a cell element, or takes it off when `text` is `null`. The attribute is written
 * only when it changes, so a paint that changes nothing writes nothing.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 * @param {string|null} text The text read after the cell's value (", Level 2, 4 of 6").
 * @returns {boolean} `true` when the cell carries or carried the attribute, so its row needs a look.
 */
export function setCellLevel(TD: HTMLTableCellElement, text: string | null): boolean {
  if (text === null) {
    return removeCellLevel(TD);
  }

  if (TD.getAttribute(ROW_LEVEL_ATTRIBUTE) !== text) {
    TD.setAttribute(ROW_LEVEL_ATTRIBUTE, text);
  }

  return true;
}

/**
 * Takes the level text off a cell element.
 *
 * @param {HTMLElement} TD The cell element.
 * @returns {boolean} `true` when the cell carried it.
 */
export function removeCellLevel(TD: HTMLElement): boolean {
  if (!TD.hasAttribute(ROW_LEVEL_ATTRIBUTE)) {
    return false;
  }

  TD.removeAttribute(ROW_LEVEL_ATTRIBUTE);

  return true;
}

/**
 * Reads the name of a row: the texts of its data cells, trimmed, the empty ones skipped and joined with a
 * space. Returns `null` when none of its cells carries the level text or none holds text.
 *
 * @param {HTMLTableRowElement} TR The row element.
 * @returns {string|null}
 */
function readRowName(TR: HTMLTableRowElement): string | null {
  const texts: string[] = [];
  let hasLevel = false;
  const cells = TR.children;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i] as HTMLElement;

    if (cell.tagName === 'TD') {
      const text = (cell.textContent ?? '').trim();

      hasLevel = hasLevel || cell.hasAttribute(ROW_LEVEL_ATTRIBUTE);

      if (text !== '') {
        texts.push(text);
      }
    }
  }

  return hasLevel && texts.length > 0 ? texts.join(' ') : null;
}

/**
 * The part of a grid that the row name elements need: where they live and a name that tells grids apart.
 */
export interface RowNamesHost {
  guid: string;
  rootElement: HTMLElement;
  rootDocument: Document;
}

/**
 * The row names of one grid. Each row element gets at most one hidden element holding its name, so the number
 * of elements is bounded by the rows the grid renders (Walkontable recycles them). The elements live in one
 * hidden container in the grid's root, not in the page's portal, because an id has to resolve in the tree the
 * row is in (a grid inside a shadow root).
 */
export class RowNames {
  /**
   * The grid the names belong to.
   *
   * @type {RowNamesHost}
   */
  #host: RowNamesHost;

  /**
   * The hidden container of the name elements, made on the first name.
   *
   * @type {HTMLElement|null}
   */
  #container: HTMLElement | null = null;

  /**
   * The name element of each row element this store named.
   *
   * @type {WeakMap<HTMLTableRowElement, HTMLElement>}
   */
  #elements = new WeakMap<HTMLTableRowElement, HTMLElement>();

  /**
   * The number the next id takes. It only grows, so an id is never used twice in a root.
   *
   * @type {number}
   */
  #next = 0;

  /**
   * @param {RowNamesHost} host The grid the names belong to.
   */
  constructor(host: RowNamesHost) {
    this.#host = host;
  }

  /**
   * Names a row by the texts of its data cells when one of its cells carries the level text and one holds
   * text, and takes this store's name off it otherwise (an empty name would name the row with nothing). A row
   * that carries an `aria-label`, or an `aria-labelledby` this store did not write, keeps it. The element's
   * text and the row's attribute are written only when they change.
   *
   * @param {HTMLTableRowElement} TR The row element.
   */
  nameRow(TR: HTMLTableRowElement): void {
    const name = readRowName(TR);

    if (name === null || this.#hasForeignName(TR)) {
      this.removeRowName(TR);

      return;
    }

    const element = this.#getElement(TR);

    if (element.textContent !== name) {
      element.textContent = name;
    }

    if (TR.getAttribute(LABELLED_BY) !== element.id) {
      TR.setAttribute(LABELLED_BY, element.id);
    }
  }

  /**
   * Takes this store's name off a row: the reference, when it still points at our element, and the element.
   *
   * @param {HTMLTableRowElement} TR The row element.
   */
  removeRowName(TR: HTMLTableRowElement): void {
    const element = this.#elements.get(TR);

    if (element === undefined) {
      return;
    }

    if (TR.getAttribute(LABELLED_BY) === element.id) {
      TR.removeAttribute(LABELLED_BY);
    }

    element.remove();
    this.#elements.delete(TR);
  }

  /**
   * Takes this store's name off a row and the level text off its cells.
   *
   * @param {HTMLTableRowElement} TR The row element.
   */
  removeRowLevel(TR: HTMLTableRowElement): void {
    this.removeRowName(TR);

    const cells = TR.children;

    for (let i = 0; i < cells.length; i++) {
      removeCellLevel(cells[i] as HTMLElement);
    }
  }

  /**
   * Removes the container with every name element still in it. Call it after the rendered rows lost their
   * references (`removeRowLevel()`).
   */
  destroy(): void {
    this.#container?.remove();
    this.#container = null;
    this.#elements = new WeakMap();
  }

  /**
   * Tells whether a row carries a name this store did not write.
   *
   * @param {HTMLTableRowElement} TR The row element.
   * @returns {boolean}
   */
  #hasForeignName(TR: HTMLTableRowElement): boolean {
    if (TR.hasAttribute('aria-label')) {
      return true;
    }

    const current = TR.getAttribute(LABELLED_BY);

    return current !== null && current !== this.#elements.get(TR)?.id;
  }

  /**
   * Returns the name element of a row, making it the first time, or again when a host's own markup removed it.
   *
   * @param {HTMLTableRowElement} TR The row element.
   * @returns {HTMLElement}
   */
  #getElement(TR: HTMLTableRowElement): HTMLElement {
    const container = this.#getContainer();
    const known = this.#elements.get(TR);

    if (known !== undefined && known.parentNode === container) {
      return known;
    }

    const element = this.#host.rootDocument.createElement('span');

    element.id = `${ROW_NAME_ID_PREFIX}${this.#host.guid}-${this.#next}`;
    this.#next += 1;
    container.appendChild(element);
    this.#elements.set(TR, element);

    return element;
  }

  /**
   * Returns the hidden container of the name elements, making it when it is missing from the grid's root.
   *
   * @returns {HTMLElement}
   */
  #getContainer(): HTMLElement {
    const { rootElement, rootDocument } = this.#host;

    if (this.#container !== null && this.#container.parentNode === rootElement) {
      return this.#container;
    }

    const container = rootDocument.createElement('div');

    container.hidden = true;
    rootElement.appendChild(container);
    this.#container = container;

    return container;
  }
}
