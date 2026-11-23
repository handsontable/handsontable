import {
  clearStaleAriaAttributes,
  isClearedAriaAttribute,
  isKeptDescribedBy,
  isKeptLabelledBy,
  NO_KEPT_ARIA_ATTRIBUTES,
  setAttributeIfChanged,
  setAttributeIfMissing,
  syncAriaAttributes,
} from '../../../src/render/ariaAttributes';

/**
 * Builds a TD carrying the given attributes, in order.
 *
 * @param {Array<[string, string]>} attributes The attributes.
 * @returns {HTMLTableCellElement}
 */
function createCell(attributes: [string, string][]): HTMLTableCellElement {
  const TD = document.createElement('td');

  attributes.forEach(([name, value]) => TD.setAttribute(name, value));

  return TD;
}

/**
 * Lists an element's attributes in their DOM order.
 *
 * @param {HTMLElement} element The element.
 * @returns {Array<[string, string]>}
 */
function attributesOf(element: HTMLElement): [string, string][] {
  return element.getAttributeNames().map(name => [name, element.getAttribute(name) ?? '']);
}

describe('isClearedAriaAttribute', () => {
  it('matches every name containing `aria-` or `role`, anywhere in the name, as the renderers always did', () => {
    expect(isClearedAriaAttribute('aria-colindex')).toBe(true);
    expect(isClearedAriaAttribute('role')).toBe(true);
    expect(isClearedAriaAttribute('data-role')).toBe(true);
    expect(isClearedAriaAttribute('data-aria-x')).toBe(true);
    expect(isClearedAriaAttribute('tabindex')).toBe(false);
    expect(isClearedAriaAttribute('scope')).toBe(false);
    expect(isClearedAriaAttribute('id')).toBe(false);
    expect(isClearedAriaAttribute('class')).toBe(false);
  });
});

describe('clearStaleAriaAttributes', () => {
  it('removes every accessibility attribute when nothing is kept, and leaves the others', () => {
    const TD = createCell([
      ['class', 'htDimmed'], ['role', 'checkbox'], ['tabindex', '-1'], ['aria-checked', 'true'],
      ['data-role', 'custom'], ['title', 'note'],
    ]);

    clearStaleAriaAttributes(TD, NO_KEPT_ARIA_ATTRIBUTES);

    expect(attributesOf(TD)).toEqual([['class', 'htDimmed'], ['tabindex', '-1'], ['title', 'note']]);
  });

  it('keeps every kept attribute, whatever its value, for the caller to overwrite in place', () => {
    const TD = createCell([['role', 'gridcell'], ['aria-colindex', '4'], ['aria-describedby', 'old-header']]);

    clearStaleAriaAttributes(TD, { role: 'gridcell', 'aria-colindex': '4', 'aria-describedby': 'new-header' });

    expect(attributesOf(TD)).toEqual([
      ['role', 'gridcell'], ['aria-colindex', '4'], ['aria-describedby', 'old-header'],
    ]);
  });

  it('removes an attribute a renderer set that is not kept', () => {
    const TD = createCell([['role', 'gridcell'], ['aria-x', 'stray'], ['aria-readonly', 'true']]);

    clearStaleAriaAttributes(TD, { role: 'gridcell' });

    expect(attributesOf(TD)).toEqual([['role', 'gridcell']]);
  });

  it('writes nothing when every attribute is already kept', () => {
    const TD = createCell([['role', 'gridcell'], ['aria-colindex', '2']]);
    const removeSpy = jest.spyOn(TD, 'removeAttribute');
    const setSpy = jest.spyOn(TD, 'setAttribute');

    clearStaleAriaAttributes(TD, { role: 'gridcell', 'aria-colindex': '2' });

    expect(removeSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });
});

describe('syncAriaAttributes', () => {
  it('writes the attributes in the order given on a new element', () => {
    const TH = document.createElement('th');

    syncAriaAttributes(TH, { 'aria-colindex': '2', tabindex: '-1', role: 'columnheader', scope: 'col' });

    expect(attributesOf(TH)).toEqual([
      ['aria-colindex', '2'], ['tabindex', '-1'], ['role', 'columnheader'], ['scope', 'col'],
    ]);
  });

  it('updates a changed value and clears an attribute the set does not hold, without touching the rest', () => {
    const TH = createCell([
      ['aria-colindex', '2'], ['tabindex', '-1'], ['role', 'columnheader'], ['scope', 'col'], ['aria-expanded', 'true'],
    ]);
    const setSpy = jest.spyOn(TH, 'setAttribute');
    const removeSpy = jest.spyOn(TH, 'removeAttribute');

    syncAriaAttributes(TH, { 'aria-colindex': '3', tabindex: '-1', role: 'columnheader', scope: 'col' });

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('aria-expanded');

    // A changed value is overwritten in place: one write, no removal.
    expect(attributesOf(TH)).toEqual([
      ['aria-colindex', '3'], ['tabindex', '-1'], ['role', 'columnheader'], ['scope', 'col'],
    ]);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith('aria-colindex', '3');
  });

  it('with an empty set, clears every accessibility attribute and writes nothing', () => {
    const TH = createCell([['role', 'rowheader'], ['scope', 'row'], ['aria-colindex', '1'], ['tabindex', '-1']]);

    syncAriaAttributes(TH, NO_KEPT_ARIA_ATTRIBUTES);

    expect(attributesOf(TH)).toEqual([['scope', 'row'], ['tabindex', '-1']]);
  });
});

describe('setAttributeIfChanged', () => {
  it('writes a missing or different value and skips an equal one', () => {
    const TD = document.createElement('td');
    const setSpy = jest.spyOn(TD, 'setAttribute');

    setAttributeIfChanged(TD, 'tabindex', '-1');
    setAttributeIfChanged(TD, 'tabindex', '-1');
    setAttributeIfChanged(TD, 'tabindex', '0');

    expect(TD.getAttribute('tabindex')).toBe('0');
    expect(setSpy).toHaveBeenCalledTimes(2);
  });
});

describe('setAttributeIfMissing', () => {
  it('writes a missing attribute and leaves a present one, whatever its value', () => {
    const TD = createCell([['role', 'checkbox']]);

    setAttributeIfMissing(TD, 'role', 'gridcell');
    setAttributeIfMissing(TD, 'aria-describedby', 'header-1');

    expect(attributesOf(TD)).toEqual([['role', 'checkbox'], ['aria-describedby', 'header-1']]);
  });
});

describe('isKeptDescribedBy', () => {
  it('keeps the reference to the column header alone', () => {
    expect(isKeptDescribedBy('ht_1_header-2', 'ht_1_header-2')).toBe(true);
  });

  it('keeps the header reference followed by the references of a cell description', () => {
    expect(isKeptDescribedBy('ht_1_header-2 ht-description-ht_1-0', 'ht_1_header-2')).toBe(true);
    expect(isKeptDescribedBy('ht_1_header-2 ht-description-ht_1-0 ht-description-ht_1-3', 'ht_1_header-2')).toBe(true);
  });

  it('keeps a value of description references alone for a cell with no column header', () => {
    expect(isKeptDescribedBy('ht-description-ht_1-0', '')).toBe(true);
  });

  it('does not keep the header reference of another column, so a recycled cell is pointed at its own', () => {
    expect(isKeptDescribedBy('ht_1_header-1 ht-description-ht_1-0', 'ht_1_header-2')).toBe(false);
    expect(isKeptDescribedBy('ht_1_header-1', 'ht_1_header-2')).toBe(false);
  });

  it('does not keep a reference of anyone else, a renderer\'s own included', () => {
    expect(isKeptDescribedBy('ht_1_header-2 my-note', 'ht_1_header-2')).toBe(false);
    expect(isKeptDescribedBy('my-note', '')).toBe(false);
    expect(isKeptDescribedBy('ht_1_header-2 ht-description-ht_1-0 my-note', 'ht_1_header-2')).toBe(false);
  });

  it('does not keep a missing or empty value', () => {
    expect(isKeptDescribedBy(null, 'ht_1_header-2')).toBe(false);
    expect(isKeptDescribedBy('', '')).toBe(false);
  });
});

describe('isKeptLabelledBy', () => {
  it('keeps the cell\'s own id followed by references to hidden text elements', () => {
    expect(isKeptLabelledBy('ht_1-cell-4 ht-description-ht_1-2', 'ht_1-cell-4')).toBe(true);
    expect(isKeptLabelledBy('ht_1-cell-4 ht-description-ht_1-2 ht-description-ht_1-3', 'ht_1-cell-4')).toBe(true);
  });

  it('does not keep a label that starts with another element, a recycled cell\'s old id included', () => {
    expect(isKeptLabelledBy('ht_1-cell-3 ht-description-ht_1-2', 'ht_1-cell-4')).toBe(false);
  });

  it('does not keep a renderer\'s own label, a self reference alone, or a cell without an id', () => {
    expect(isKeptLabelledBy('ht_1-cell-4 my-label', 'ht_1-cell-4')).toBe(false);
    expect(isKeptLabelledBy('ht_1-cell-4', 'ht_1-cell-4')).toBe(false);
    expect(isKeptLabelledBy('ht-description-ht_1-2', '')).toBe(false);
    expect(isKeptLabelledBy(null, 'ht_1-cell-4')).toBe(false);
  });
});
