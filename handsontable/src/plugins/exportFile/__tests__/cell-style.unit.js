import {
  clearStyleCaches, getAlignmentFromMeta, getCssStyleFromElement, getDropdownValidation,
} from '../types/xlsx/cell-style';

describe('getAlignmentFromMeta', () => {
  it('should return null when meta is falsy or has no className', () => {
    expect(getAlignmentFromMeta(null)).toBeNull();
    expect(getAlignmentFromMeta({})).toBeNull();
    expect(getAlignmentFromMeta({ className: '' })).toBeNull();
  });

  it('should parse alignment from a space-separated className string', () => {
    expect(getAlignmentFromMeta({ className: 'htCenter htTop' })).toEqual({
      horizontal: 'center',
      vertical: 'top',
    });
  });

  it('should parse alignment from a className array', () => {
    expect(getAlignmentFromMeta({ className: ['htRight', 'htBottom'] })).toEqual({
      horizontal: 'right',
      vertical: 'bottom',
    });
  });

  it('should return null when className array contains no recognised alignment classes', () => {
    expect(getAlignmentFromMeta({ className: ['foo', 'bar'] })).toBeNull();
  });

  it('should not throw when className array contains null or undefined elements', () => {
    expect(() => getAlignmentFromMeta({ className: [null, undefined, 'htCenter'] })).not.toThrow();
    expect(getAlignmentFromMeta({ className: [null, undefined, 'htCenter'] })).toEqual({
      horizontal: 'center',
    });
  });
});

describe('getDropdownValidation', () => {
  it('should return null when meta is falsy', () => {
    expect(getDropdownValidation(null, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
    expect(getDropdownValidation(undefined, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
  });

  it('should return null when rangeRef is not provided', () => {
    expect(getDropdownValidation({ type: 'dropdown', source: ['a', 'b'] }, null)).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown', source: ['a', 'b'] }, undefined)).toBeNull();
  });

  it('should return null when type is not dropdown or autocomplete', () => {
    expect(getDropdownValidation({ type: 'text', source: ['a', 'b'] }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
  });

  it('should return null when source is not an array', () => {
    expect(getDropdownValidation({ type: 'dropdown', source: null }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown', source: 'fn' }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown' }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
  });

  it('should return a list validation using the provided rangeRef for dropdown type', () => {
    const result = getDropdownValidation(
      { type: 'dropdown', source: ['A', 'B', 'C'] },
      '\'_HotValidation\'!$A$1:$A$3'
    );

    expect(result).toEqual({
      type: 'list',
      allowBlank: true,
      formulae: ['\'_HotValidation\'!$A$1:$A$3'],
    });
  });

  it('should return a list validation using the provided rangeRef for autocomplete type', () => {
    const result = getDropdownValidation(
      { type: 'autocomplete', source: ['X', 'Y'] },
      '\'_HotValidation\'!$B$1:$B$2'
    );

    expect(result).toEqual({
      type: 'list',
      allowBlank: true,
      formulae: ['\'_HotValidation\'!$B$1:$B$2'],
    });
  });
});

describe('getCssStyleFromElement', () => {
  function renderedCell(className, inlineColor) {
    const wrapper = document.createElement('div');

    wrapper.className = 'ht-root-wrapper';

    const td = document.createElement('td');

    td.className = className;

    if (inlineColor) {
      td.style.color = inlineColor;
    }

    wrapper.appendChild(document.createElement('table')).appendChild(document.createElement('tbody'))
      .appendChild(document.createElement('tr')).appendChild(td);
    document.body.appendChild(wrapper);

    return { td, wrapper };
  }

  afterEach(() => {
    document.querySelectorAll('.ht-root-wrapper').forEach(element => element.remove());
  });

  it('should export a color set on the rendered cell itself, the way a custom renderer writes it', () => {
    const { td } = renderedCell('htCenter myClass', 'rgb(255, 0, 0)');

    expect(getCssStyleFromElement(td, 'htCenter myClass').fontColor).toBe('#FF0000');
  });

  it('should export no color for a custom class that leaves the cell at its ambient color', () => {
    const { td } = renderedCell('htCenter boldOnly');

    expect(getCssStyleFromElement(td, 'htCenter boldOnly').fontColor).toBeNull();
  });

  it('should rebuild the baseline probe after clearStyleCaches, so a later export sees new CSS', () => {
    // The probe cache is keyed by the mount element under the document; clearing by document has
    // to reach it, or a second export keeps the first export's baseline.
    const { td } = renderedCell('htCenter myClass', 'rgb(255, 0, 0)');
    const probesBuilt = () => document.createElement.mock.calls.filter(([tag]) => tag === 'div').length;

    jest.spyOn(document, 'createElement');
    getCssStyleFromElement(td, 'htCenter myClass');
    getCssStyleFromElement(td, 'htCenter myClass');

    expect(probesBuilt()).toBe(1);

    clearStyleCaches(document);
    getCssStyleFromElement(td, 'htCenter myClass');

    // Both the font-color probe and the background probe are rebuilt once, then cached again.
    const afterClear = probesBuilt();

    expect(afterClear).toBeGreaterThan(1);
    getCssStyleFromElement(td, 'htCenter myClass');
    expect(probesBuilt()).toBe(afterClear);
    document.createElement.mockRestore();
  });

  it('should export no color for a cell with alignment classes only, whatever it renders', () => {
    const { td } = renderedCell('htRight', 'rgb(255, 0, 0)');

    expect(getCssStyleFromElement(td, 'htRight').fontColor).toBeNull();
  });
});
