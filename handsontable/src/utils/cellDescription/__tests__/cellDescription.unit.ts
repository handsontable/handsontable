import {
  CELL_DESCRIPTION_ID_PREFIX,
  CELL_DESCRIPTION_RANK,
  addCellDescriptionPart,
  applyCellDescription,
  beginCellDescription,
  removeCellDescriptionPart,
} from '../cellDescription';

describe('cellDescription', () => {
  const createHot = (guid = 'ht_a') => {
    const rootElement = document.createElement('div');

    document.body.appendChild(rootElement);

    return { guid, rootElement, rootDocument: document };
  };
  const createCell = (text = '3', describedBy?: string): HTMLTableCellElement => {
    const cell = document.createElement('td');

    cell.textContent = text;

    if (describedBy !== undefined) {
      cell.setAttribute('aria-describedby', describedBy);
    }

    return cell;
  };
  const describe_ = (
    hot: ReturnType<typeof createHot>,
    cell: HTMLTableCellElement,
    parts: Array<[number, string | null]>,
    enabled = true,
  ) => {
    beginCellDescription(cell);
    parts.forEach(([rank, text]) => addCellDescriptionPart(cell, rank, text));
    applyCellDescription(hot, cell, enabled);
  };
  /**
   * The text of the elements the cell's `aria-describedby` names, outside its header reference.
   */
  const descriptionOf = (hot: ReturnType<typeof createHot>, cell: HTMLTableCellElement): string | null => {
    const id = (cell.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .find(token => token.startsWith(CELL_DESCRIPTION_ID_PREFIX));

    return id === undefined ? null : hot.rootElement.querySelector(`#${id}`)?.textContent ?? null;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should point the cell at a hidden element that holds the text, and leave the cell alone', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    expect(descriptionOf(hot, cell)).toBe('read only');
    expect(hot.rootElement.querySelector(`[id^="${CELL_DESCRIPTION_ID_PREFIX}"]`)?.hasAttribute('hidden')).toBe(true);
    expect(cell.textContent).toBe('3');
    expect(cell.children).toHaveLength(0);
    expect(cell.className).toBe('');
    expect(cell.getAttribute('style')).toBeNull();
  });

  it('should join the parts in the order of their rank, whatever order they were added in', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [
      [CELL_DESCRIPTION_RANK.MERGED, 'merged through row 4 column 3'],
      [CELL_DESCRIPTION_RANK.LINK, 'link'],
      [CELL_DESCRIPTION_RANK.READ_ONLY, 'read only'],
    ]);

    expect(descriptionOf(hot, cell)).toBe('read only, link, merged through row 4 column 3');
  });

  it('should keep the reference to the column header first', () => {
    const hot = createHot();
    const cell = createCell('3', 'ht_a_header-2');

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    const tokens = cell.getAttribute('aria-describedby')!.split(' ');

    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toBe('ht_a_header-2');
    expect(descriptionOf(hot, cell)).toBe('read only');
  });

  it('should replace its own reference and keep the header when the description changes', () => {
    const hot = createHot();
    const cell = createCell('3', 'ht_a_header-2');

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.LINK, 'link']]);

    expect(cell.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2);
    expect(cell.getAttribute('aria-describedby')!.startsWith('ht_a_header-2 ')).toBe(true);
    expect(descriptionOf(hot, cell)).toBe('link');
  });

  it('should take its reference off a recycled element that has no parts now, and keep the header', () => {
    const hot = createHot();
    const cell = createCell('3', 'ht_a_header-2');

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, cell, []);

    expect(cell.getAttribute('aria-describedby')).toBe('ht_a_header-2');
  });

  it('should remove the attribute when the reference was the only token', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, cell, []);

    expect(cell.hasAttribute('aria-describedby')).toBe(false);
  });

  it('should not write the attribute again for the same text', () => {
    const hot = createHot();
    const cell = createCell('3', 'ht_a_header-2');

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    const setAttribute = jest.spyOn(cell, 'setAttribute');
    const removeAttribute = jest.spyOn(cell, 'removeAttribute');

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    expect(setAttribute).not.toHaveBeenCalled();
    expect(removeAttribute).not.toHaveBeenCalled();
  });

  it('should write nothing to a cell with no parts and no reference of its own', () => {
    const hot = createHot();
    const cell = createCell('3', 'ht_a_header-2');
    const setAttribute = jest.spyOn(cell, 'setAttribute');
    const removeAttribute = jest.spyOn(cell, 'removeAttribute');

    describe_(hot, cell, []);

    expect(setAttribute).not.toHaveBeenCalled();
    expect(removeAttribute).not.toHaveBeenCalled();
    expect(cell.getAttribute('aria-describedby')).toBe('ht_a_header-2');
  });

  it('should share one element between cells with the same description, and make one for another', () => {
    const hot = createHot();
    const first = createCell();
    const second = createCell();
    const third = createCell();

    describe_(hot, first, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, second, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, third, [[CELL_DESCRIPTION_RANK.LINK, 'link']]);

    expect(first.getAttribute('aria-describedby')).toBe(second.getAttribute('aria-describedby'));
    expect(third.getAttribute('aria-describedby')).not.toBe(first.getAttribute('aria-describedby'));
    expect(hot.rootElement.querySelectorAll(`[id^="${CELL_DESCRIPTION_ID_PREFIX}"]`)).toHaveLength(2);
  });

  it('should not give two elements one id when an element was removed from the root and made again', () => {
    const hot = createHot();
    const first = createCell();
    const second = createCell();
    const third = createCell();
    const fourth = createCell();

    describe_(hot, first, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, second, [[CELL_DESCRIPTION_RANK.LINK, 'link']]);

    // Host markup removes the element of the first text.
    hot.rootElement.querySelector(`[id^="${CELL_DESCRIPTION_ID_PREFIX}"]`)!.remove();

    describe_(hot, third, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, fourth, [[CELL_DESCRIPTION_RANK.MERGED, 'merged through row 4 column 3']]);

    const ids = Array.from(hot.rootElement.querySelectorAll(`[id^="${CELL_DESCRIPTION_ID_PREFIX}"]`)).map(el => el.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(3);
    expect(descriptionOf(hot, third)).toBe('read only');
    expect(descriptionOf(hot, fourth)).toBe('merged through row 4 column 3');
    expect(descriptionOf(hot, second)).toBe('link');
  });

  it('should not search the root for the element of a description it already made', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    const querySelector = jest.spyOn(hot.rootElement, 'querySelector');

    describe_(hot, createCell(), [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    expect(querySelector).not.toHaveBeenCalled();
  });

  it('should keep the elements of two grids apart', () => {
    const hotA = createHot('ht_a');
    const hotB = createHot('ht_b');
    const cellA = createCell();
    const cellB = createCell();

    describe_(hotA, cellA, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hotB, cellB, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);

    expect(cellA.getAttribute('aria-describedby')).not.toBe(cellB.getAttribute('aria-describedby'));
    expect(hotA.rootElement.querySelectorAll(`[id^="${CELL_DESCRIPTION_ID_PREFIX}"]`)).toHaveLength(1);
    expect(hotB.rootElement.querySelectorAll(`[id^="${CELL_DESCRIPTION_ID_PREFIX}"]`)).toHaveLength(1);
  });

  it('should take its reference off, and keep the header, while the grid writes no ARIA', () => {
    const hot = createHot();
    const cell = createCell('3', 'ht_a_header-2');

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']], false);

    expect(cell.getAttribute('aria-describedby')).toBe('ht_a_header-2');
  });

  it('should ignore an empty phrase, which a language no dictionary holds answers as null', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [
      [CELL_DESCRIPTION_RANK.READ_ONLY, null],
      [CELL_DESCRIPTION_RANK.LINK, ''],
    ]);

    expect(cell.hasAttribute('aria-describedby')).toBe(false);
    expect(hot.rootElement.children).toHaveLength(0);
  });

  it('should ignore a part for an element that is not the cell being painted', () => {
    const hot = createHot();
    const painted = createCell();
    const other = createCell();

    beginCellDescription(painted);
    addCellDescriptionPart(other, CELL_DESCRIPTION_RANK.READ_ONLY, 'read only');
    applyCellDescription(hot, painted, true);

    expect(painted.hasAttribute('aria-describedby')).toBe(false);
    expect(other.hasAttribute('aria-describedby')).toBe(false);
  });

  it('should not describe a cell that was not begun, and should take a stale reference off it', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.READ_ONLY, 'read only']]);
    applyCellDescription(hot, cell, true);

    expect(cell.hasAttribute('aria-describedby')).toBe(false);
  });

  it('should not carry the parts of one cell over to the next', () => {
    const hot = createHot();
    const first = createCell();
    const second = createCell();

    beginCellDescription(first);
    addCellDescriptionPart(first, CELL_DESCRIPTION_RANK.READ_ONLY, 'read only');
    // The first cell is never finished.
    beginCellDescription(second);
    applyCellDescription(hot, second, true);

    expect(second.hasAttribute('aria-describedby')).toBe(false);
  });

  it('should hold one part per rank, the last one added', () => {
    const hot = createHot();
    const cell = createCell();

    describe_(hot, cell, [[CELL_DESCRIPTION_RANK.LINK, 'link'], [CELL_DESCRIPTION_RANK.LINK, 'Link']]);

    expect(descriptionOf(hot, cell)).toBe('Link');
  });

  it('should take a part back out before the description is written', () => {
    const hot = createHot();
    const cell = createCell();

    beginCellDescription(cell);
    addCellDescriptionPart(cell, CELL_DESCRIPTION_RANK.READ_ONLY, 'read only');
    addCellDescriptionPart(cell, CELL_DESCRIPTION_RANK.LINK, 'link');
    removeCellDescriptionPart(cell, CELL_DESCRIPTION_RANK.LINK);
    removeCellDescriptionPart(cell, CELL_DESCRIPTION_RANK.MERGED);
    applyCellDescription(hot, cell, true);

    expect(descriptionOf(hot, cell)).toBe('read only');
  });

  it('should keep the parts of a cell whose paint contains the paint of another cell', () => {
    const hot = createHot();
    const outer = createCell();
    const inner = createCell();

    beginCellDescription(outer);
    addCellDescriptionPart(outer, CELL_DESCRIPTION_RANK.READ_ONLY, 'read only');

    // A renderer that builds a grid in its cell paints that grid's cells here.
    beginCellDescription(inner);
    addCellDescriptionPart(inner, CELL_DESCRIPTION_RANK.LINK, 'link');
    applyCellDescription(hot, inner, true);

    addCellDescriptionPart(outer, CELL_DESCRIPTION_RANK.MERGED, 'merged through row 4 column 3');
    applyCellDescription(hot, outer, true);

    expect(descriptionOf(hot, inner)).toBe('link');
    expect(descriptionOf(hot, outer)).toBe('read only, merged through row 4 column 3');
  });
});
