import {
  ROW_LEVEL_ATTRIBUTE,
  ROW_NAME_ID_PREFIX,
  RowNames,
  removeCellLevel,
  setCellLevel,
} from '../../utils/rowLevelName';

/**
 * Builds a row with a row header followed by data cells holding the given texts.
 *
 * @param {string[]} texts The text of each `td`.
 * @returns {HTMLTableRowElement}
 */
function createRow(texts: string[]): HTMLTableRowElement {
  const TR = document.createElement('tr');
  const TH = document.createElement('th');

  TH.textContent = '7';
  TR.appendChild(TH);

  texts.forEach((text) => {
    const TD = document.createElement('td');

    TD.textContent = text;
    TR.appendChild(TD);
  });

  return TR;
}

/**
 * Returns the data cells of a row.
 *
 * @param {HTMLTableRowElement} TR The row.
 * @returns {HTMLTableCellElement[]}
 */
function cellsOf(TR: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(TR.querySelectorAll('td'));
}

/**
 * Builds a grid stand-in with a root element attached to the document.
 *
 * @returns {{ guid: string, rootElement: HTMLElement, rootDocument: Document }}
 */
function createHost() {
  const rootElement = document.createElement('div');

  document.body.appendChild(rootElement);

  return { guid: 'ht_test', rootElement, rootDocument: document };
}

/**
 * Returns the element a row's `aria-labelledby` points at.
 *
 * @param {HTMLTableRowElement} TR The row.
 * @returns {HTMLElement|null}
 */
function nameElementOf(TR: HTMLTableRowElement): HTMLElement | null {
  const id = TR.getAttribute('aria-labelledby');

  return id === null ? null : document.getElementById(id);
}

describe('NestedRows rowLevelName', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('should write the level text on a cell and leave its text content alone', () => {
    const [TD] = cellsOf(createRow(['Grape']));

    expect(setCellLevel(TD, ', Level 2, 4 of 6')).toBe(true);
    expect(TD.getAttribute(ROW_LEVEL_ATTRIBUTE)).toBe(', Level 2, 4 of 6');
    expect(TD.textContent).toBe('Grape');
  });

  it('should write nothing when the cell already carries the same text', () => {
    const [TD] = cellsOf(createRow(['Grape']));

    setCellLevel(TD, ', Level 2, 4 of 6');

    const setAttribute = jest.spyOn(TD, 'setAttribute');

    expect(setCellLevel(TD, ', Level 2, 4 of 6')).toBe(true);
    expect(setAttribute).not.toHaveBeenCalled();
  });

  it('should take the text off a cell that has no level any more, and report whether it had one', () => {
    const [TD] = cellsOf(createRow(['Grape']));

    setCellLevel(TD, ', Level 2, 4 of 6');

    expect(setCellLevel(TD, null)).toBe(true);
    expect(TD.hasAttribute(ROW_LEVEL_ATTRIBUTE)).toBe(false);
    expect(setCellLevel(TD, null)).toBe(false);
    expect(removeCellLevel(TD)).toBe(false);
  });

  it('should name a row through aria-labelledby by the trimmed texts of its data cells, skipping empty ones', () => {
    const host = createHost();
    const rowNames = new RowNames(host);
    const TR = createRow([' Grape ', '', '12']);

    setCellLevel(cellsOf(TR)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    const element = nameElementOf(TR);

    expect(TR.hasAttribute('aria-label')).toBe(false);
    expect(element?.textContent).toBe('Grape 12');
    expect(element?.id.startsWith(`${ROW_NAME_ID_PREFIX}ht_test-`)).toBe(true);
    expect(element?.parentElement?.hidden).toBe(true);
    expect(element?.parentElement?.parentElement).toBe(host.rootElement);
  });

  it('should keep one name element per row and one container for every row', () => {
    const host = createHost();
    const rowNames = new RowNames(host);
    const first = createRow(['Grape', '12']);
    const second = createRow(['Cherry', '7']);

    setCellLevel(cellsOf(first)[0], ', Level 2, 4 of 6');
    setCellLevel(cellsOf(second)[0], ', Level 2, 5 of 6');
    rowNames.nameRow(first);
    rowNames.nameRow(second);
    rowNames.nameRow(first);

    expect(host.rootElement.children.length).toBe(1);
    expect(host.rootElement.children[0].children.length).toBe(2);
    expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'));
  });

  it('should write the row name only when it changes', () => {
    const rowNames = new RowNames(createHost());
    const TR = createRow(['Grape', '12']);

    setCellLevel(cellsOf(TR)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    const element = nameElementOf(TR)!;
    const setAttribute = jest.spyOn(TR, 'setAttribute');
    const textSetter = jest.spyOn(element, 'textContent', 'set');

    rowNames.nameRow(TR);

    expect(setAttribute).not.toHaveBeenCalled();
    expect(textSetter).not.toHaveBeenCalled();

    cellsOf(TR)[1].textContent = '13';
    rowNames.nameRow(TR);

    expect(nameElementOf(TR)).toBe(element);
    expect(element.textContent).toBe('Grape 13');
    expect(setAttribute).not.toHaveBeenCalled();
  });

  it('should not name a row none of whose cells carries the level, and take our name off it', () => {
    const host = createHost();
    const rowNames = new RowNames(host);
    const TR = createRow(['Grape', '12']);

    rowNames.nameRow(TR);

    expect(TR.hasAttribute('aria-labelledby')).toBe(false);

    setCellLevel(cellsOf(TR)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    const element = nameElementOf(TR)!;

    setCellLevel(cellsOf(TR)[0], null);
    rowNames.nameRow(TR);

    expect(TR.hasAttribute('aria-labelledby')).toBe(false);
    expect(element.isConnected).toBe(false);
  });

  it('should not name a row whose cells are all empty', () => {
    const rowNames = new RowNames(createHost());
    const TR = createRow(['', ' ']);

    setCellLevel(cellsOf(TR)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    expect(TR.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('should leave an aria-label someone else wrote on a row', () => {
    const rowNames = new RowNames(createHost());
    const TR = createRow(['Grape', '12']);

    TR.setAttribute('aria-label', 'Custom');
    setCellLevel(cellsOf(TR)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    expect(TR.getAttribute('aria-label')).toBe('Custom');
    expect(TR.hasAttribute('aria-labelledby')).toBe(false);

    rowNames.removeRowLevel(TR);

    expect(TR.getAttribute('aria-label')).toBe('Custom');
  });

  it('should leave an aria-labelledby someone else wrote, before or over ours', () => {
    const rowNames = new RowNames(createHost());
    const foreign = createRow(['Grape', '12']);
    const overwritten = createRow(['Cherry', '7']);

    foreign.setAttribute('aria-labelledby', 'app-name');
    setCellLevel(cellsOf(foreign)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(foreign);

    expect(foreign.getAttribute('aria-labelledby')).toBe('app-name');

    setCellLevel(cellsOf(overwritten)[0], ', Level 2, 5 of 6');
    rowNames.nameRow(overwritten);

    const element = nameElementOf(overwritten)!;

    overwritten.setAttribute('aria-labelledby', 'app-name');
    rowNames.nameRow(overwritten);

    expect(overwritten.getAttribute('aria-labelledby')).toBe('app-name');
    expect(element.isConnected).toBe(false);
  });

  it('should make the name element again when a host removed it', () => {
    const host = createHost();
    const rowNames = new RowNames(host);
    const TR = createRow(['Grape', '12']);

    setCellLevel(cellsOf(TR)[0], ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    const firstId = TR.getAttribute('aria-labelledby');

    host.rootElement.replaceChildren();
    rowNames.nameRow(TR);

    expect(TR.getAttribute('aria-labelledby')).not.toBe(firstId);
    expect(nameElementOf(TR)?.textContent).toBe('Grape 12');
  });

  it('should take our name off a row and the level text off its cells, and remove the container on destroy', () => {
    const host = createHost();
    const rowNames = new RowNames(host);
    const TR = createRow(['Grape', '12']);
    const [first, second] = cellsOf(TR);

    setCellLevel(first, ', Level 2, 4 of 6');
    setCellLevel(second, ', Level 2, 4 of 6');
    rowNames.nameRow(TR);

    const element = nameElementOf(TR)!;

    rowNames.removeRowLevel(TR);

    expect(TR.hasAttribute('aria-labelledby')).toBe(false);
    expect(element.isConnected).toBe(false);
    expect(first.hasAttribute(ROW_LEVEL_ATTRIBUTE)).toBe(false);
    expect(second.hasAttribute(ROW_LEVEL_ATTRIBUTE)).toBe(false);

    rowNames.destroy();

    expect(host.rootElement.children.length).toBe(0);
  });
});
