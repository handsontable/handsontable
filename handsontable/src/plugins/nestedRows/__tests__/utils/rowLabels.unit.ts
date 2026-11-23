import { hasOwnLabel, labelCell, labelRow, removeOwnLabel, removeRowLabels } from '../../utils/rowLabels';

/**
 * Builds a row with the given number of data cells after a row header.
 *
 * @param {number} cellCount The number of `td` elements.
 * @returns {HTMLTableRowElement}
 */
function createRow(cellCount: number): HTMLTableRowElement {
  const TR = document.createElement('tr');

  TR.appendChild(document.createElement('th'));

  for (let i = 0; i < cellCount; i++) {
    TR.appendChild(document.createElement('td'));
  }

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

describe('NestedRows rowLabels', () => {
  it('should label a cell by itself and the level element, and give it one id for its whole life', () => {
    const [TD] = cellsOf(createRow(1));

    expect(labelCell('ht_a', TD, 'ht-description-ht_a-0')).toBe(true);

    const { id } = TD;

    expect(id.startsWith('ht_a-cell-')).toBe(true);
    expect(TD.getAttribute('aria-labelledby')).toBe(`${id} ht-description-ht_a-0`);

    labelCell('ht_a', TD, null);
    TD.removeAttribute('id');
    labelCell('ht_a', TD, 'ht-description-ht_a-1');

    expect(TD.id).toBe(id);
    expect(TD.getAttribute('aria-labelledby')).toBe(`${id} ht-description-ht_a-1`);
  });

  it('should give two cells different ids, also across grids', () => {
    const [first] = cellsOf(createRow(1));
    const [second] = cellsOf(createRow(1));

    labelCell('ht_a', first, 'ht-description-ht_a-0');
    labelCell('ht_b', second, 'ht-description-ht_b-0');

    expect(first.id).not.toBe(second.id);
  });

  it('should keep an id a renderer set and reference it', () => {
    const [TD] = cellsOf(createRow(1));

    TD.id = 'renderer-id';
    labelCell('ht_a', TD, 'ht-description-ht_a-0');

    expect(TD.id).toBe('renderer-id');
    expect(TD.getAttribute('aria-labelledby')).toBe('renderer-id ht-description-ht_a-0');
  });

  it('should write nothing when the label is already the one the cell carries', () => {
    const [TD] = cellsOf(createRow(1));

    labelCell('ht_a', TD, 'ht-description-ht_a-0');

    const setAttribute = jest.spyOn(TD, 'setAttribute');

    labelCell('ht_a', TD, 'ht-description-ht_a-0');

    expect(setAttribute).not.toHaveBeenCalled();
  });

  it('should leave a cell its renderer named alone and drop a label of ours from it', () => {
    const [labelled, named] = cellsOf(createRow(2));

    labelled.setAttribute('aria-labelledby', 'my-label');

    expect(labelCell('ht_a', labelled, 'ht-description-ht_a-0')).toBe(false);
    expect(labelled.getAttribute('aria-labelledby')).toBe('my-label');
    expect(labelled.hasAttribute('id')).toBe(false);

    labelCell('ht_a', named, 'ht-description-ht_a-0');
    named.setAttribute('aria-label', 'Custom');

    expect(labelCell('ht_a', named, 'ht-description-ht_a-0')).toBe(true);
    expect(named.hasAttribute('aria-labelledby')).toBe(false);
    expect(named.getAttribute('aria-label')).toBe('Custom');
  });

  it('should take the label off a cell that has no level any more', () => {
    const [TD] = cellsOf(createRow(1));

    labelCell('ht_a', TD, 'ht-description-ht_a-0');

    expect(labelCell('ht_a', TD, null)).toBe(true);
    expect(TD.hasAttribute('aria-labelledby')).toBe(false);
    expect(labelCell('ht_a', TD, null)).toBe(false);
  });

  it('should label a row with the ids of its labelled cells in DOM order', () => {
    const TR = createRow(3);
    const [first, second, third] = cellsOf(TR);

    labelCell('ht_a', first, 'ht-description-ht_a-0');
    labelCell('ht_a', third, 'ht-description-ht_a-0');
    second.setAttribute('aria-label', 'Custom');

    labelRow(TR);

    expect(TR.getAttribute('aria-labelledby')).toBe(`${first.id} ${third.id}`);
    expect(hasOwnLabel(TR)).toBe(true);
  });

  it('should take the label off a row none of whose cells is labelled any more', () => {
    const TR = createRow(1);
    const [TD] = cellsOf(TR);

    labelCell('ht_a', TD, 'ht-description-ht_a-0');
    labelRow(TR);
    labelCell('ht_a', TD, null);
    labelRow(TR);

    expect(TR.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('should remove only its own labels from a row and its cells', () => {
    const TR = createRow(2);
    const [ours, foreign] = cellsOf(TR);

    labelCell('ht_a', ours, 'ht-description-ht_a-0');
    foreign.setAttribute('aria-labelledby', 'my-label');
    labelRow(TR);

    removeRowLabels(TR);

    expect(TR.hasAttribute('aria-labelledby')).toBe(false);
    expect(ours.hasAttribute('aria-labelledby')).toBe(false);
    expect(foreign.getAttribute('aria-labelledby')).toBe('my-label');
    expect(removeOwnLabel(ours)).toBe(false);
  });
});
