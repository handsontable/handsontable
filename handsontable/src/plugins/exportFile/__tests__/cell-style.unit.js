import {
  clearStyleCaches,
  cssColorToArgb,
  getAlignmentFromMeta,
  getBorderFromMeta,
  getCssStyleFromElement,
  getDropdownValidation,
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

describe('getBorderFromMeta', () => {
  it('should export a border added from the context menu (a theme variable color) as black', () => {
    const border = getBorderFromMeta({
      borders: { bottom: { width: 1, color: 'var(--ht-custom-borders-default-color, #000)' } },
    });

    expect(border).toEqual({ bottom: { style: 'thin', color: { argb: 'FF000000' } } });
  });

  it('should export named and functional border colors as the matching ARGB value', () => {
    const border = getBorderFromMeta({
      borders: {
        top: { width: 1, color: 'red' },
        right: { width: 2, color: 'tomato' },
        bottom: { width: 3, color: 'rgb(0, 128, 0)' },
        left: { width: 1, color: 'hsl(240, 100%, 50%)' },
      },
    });

    expect(border).toEqual({
      top: { style: 'thin', color: { argb: 'FFFF0000' } },
      right: { style: 'medium', color: { argb: 'FFFF6347' } },
      bottom: { style: 'thick', color: { argb: 'FF008000' } },
      left: { style: 'thin', color: { argb: 'FF0000FF' } },
    });
  });
});

describe('cssColorToArgb', () => {
  it.each([
    ['#f00', 'FFFF0000'],
    ['#4472c4', 'FF4472C4'],
    ['#FF3366CC', 'FF3366CC'],
    ['F2F2F2', 'FFF2F2F2'],
    ['fff', 'FFFFFFFF'],
    [' #fff ', 'FFFFFFFF'],
    ['FFF2F2F2', 'FFF2F2F2'],
  ])('should keep the hex form %s as before', (color, argb) => {
    expect(cssColorToArgb(color)).toBe(argb);
  });

  it.each([
    ['red', 'FFFF0000'],
    ['tan', 'FFD2B48C'],
    ['tomato', 'FFFF6347'],
    ['yellow', 'FFFFFF00'],
    ['orange', 'FFFFA500'],
    ['Green', 'FF008000'],
    [' BLUE ', 'FF0000FF'],
    ['gray', 'FF808080'],
    ['grey', 'FF808080'],
    ['rebeccapurple', 'FF663399'],
    ['lightgoldenrodyellow', 'FFFAFAD2'],
    ['darkblue', 'FF00008B'],
  ])('should convert the named color %p', (color, argb) => {
    expect(cssColorToArgb(color)).toBe(argb);
  });

  it.each([
    ['rgb(255,0,0)', 'FFFF0000'],
    ['rgb(68, 114, 196)', 'FF4472C4'],
    ['rgba(68, 114, 196, 0.5)', 'FF4472C4'],
    ['rgb(68 114 196)', 'FF4472C4'],
    ['rgb(68 114 196 / 50%)', 'FF4472C4'],
    ['RGB(100%, 0%, 50%)', 'FFFF0080'],
    ['rgb(300, -20, 127.6)', 'FFFF0080'],
    ['rgb(255 50% 0)', 'FFFF8000'],
  ])('should convert the rgb() color %p', (color, argb) => {
    expect(cssColorToArgb(color)).toBe(argb);
  });

  it.each([
    ['hsl(0, 100%, 50%)', 'FFFF0000'],
    ['hsl(120, 100%, 25%)', 'FF008000'],
    ['hsla(240, 100%, 50%, 0.3)', 'FF0000FF'],
    ['hsl(240deg 100% 50% / 30%)', 'FF0000FF'],
    ['hsl(0.5turn 100% 50%)', 'FF00FFFF'],
    ['hsl(-120, 100%, 50%)', 'FF0000FF'],
    ['hsl(0, 0%, 100%)', 'FFFFFFFF'],
    ['hsl(180, 50%, 50%)', 'FF40BFBF'],
    ['hsl(200grad 100% 50%)', 'FF00FFFF'],
    ['hsl(3.14159265rad 100% 50%)', 'FF00FFFF'],
    ['hsl(0 100 50)', 'FFFF0000'],
    ['hsl(0 100% 50)', 'FFFF0000'],
  ])('should convert the hsl() color %p', (color, argb) => {
    expect(cssColorToArgb(color)).toBe(argb);
  });

  it.each([
    'var(--ht-custom-borders-default-color, #000)',
    'transparent',
    'notacolor',
    'zzzzzz',
    'constructor',
    'toString',
    '#12',
    'rgb(1, 2)',
    'hsl(red, 1%, 1%)',
    'rgb(1deg, 2, 3)',
    'hsl(50%, 100%, 50%)',
    'hsl(0, 100deg, 50%)',
    'hsl(0, 100, 50)',
    'hsl(0, 100%, 50)',
    'rgb(255, 50%, 0)',
    'hsl(1e999, 100%, 50%)',
    'hsl(1e308turn 100% 50%)',
    '',
    null,
    undefined,
    42,
  ])('should fall back to black for %p', (color) => {
    expect(cssColorToArgb(color)).toBe('FF000000');
  });

  it('should fall back to black for a long malformed function color without backtracking', () => {
    const digits = '1'.repeat(300);
    const startedAt = Date.now();

    expect(cssColorToArgb(`rgb(${digits} ${digits} ${digits}x`)).toBe('FF000000');
    expect(cssColorToArgb(`hsl(${digits}, ${digits}, ${digits}x`)).toBe('FF000000');
    // A backtracking pattern takes tens of seconds on these two strings; a linear one, well under 1 ms.
    expect(Date.now() - startedAt).toBeLessThan(1000);
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
