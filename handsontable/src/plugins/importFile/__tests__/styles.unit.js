import {
  argbToCssHex, alignmentClassNames, fontFillRule, borderEntry, styleHash,
} from '../styles';

// A workbook stores the raw `rgb` XML attribute, so a hostile file can put anything there. This is
// the payload used throughout: it closes the generated declaration block and opens a rule of its own.
const BREAKOUT_ARGB = '0000ff}*{background-image:url(https://attacker.example/x)}';

describe('argbToCssHex', () => {
  it('should drop the alpha byte and lower-case the hex', () => {
    expect(argbToCssHex('FFFF0000')).toBe('#ff0000');
    expect(argbToCssHex('00ABCDEF')).toBe('#abcdef');
    expect(argbToCssHex('ABCDEF')).toBe('#abcdef');
  });

  it('should return null for anything that is not six or eight hex digits', () => {
    expect(argbToCssHex(BREAKOUT_ARGB)).toBeNull();
    expect(argbToCssHex('')).toBeNull();
    expect(argbToCssHex('red')).toBeNull();
    expect(argbToCssHex('FFF')).toBeNull();
    expect(argbToCssHex('FFFF00 ')).toBeNull();
    expect(argbToCssHex('FFFFFF00FF')).toBeNull();
  });
});

describe('prototype-key safety of the lookup tables', () => {
  // `HORIZONTAL_CLASS`, `VERTICAL_CLASS` and `BORDER_WIDTH` are plain objects, and the workbook
  // decides the key. Without an own-property guard, `constructor` resolves to `Object`, `toString`
  // and `valueOf` to functions — a function in a class list, or as a border width.
  it('should ignore an alignment naming an Object.prototype member', () => {
    expect(alignmentClassNames({ horizontal: 'constructor' })).toEqual([]);
    expect(alignmentClassNames({ vertical: 'toString' })).toEqual([]);
    expect(alignmentClassNames({ horizontal: 'hasOwnProperty', vertical: '__proto__' })).toEqual([]);
  });

  it('should fall back to a numeric width for a border style naming an Object.prototype member', () => {
    const entry = borderEntry({ top: { style: 'valueOf' }, left: { style: 'constructor' } }, 0, 0);

    expect(entry.top.width).toBe(1);
    expect(entry.start.width).toBe(1);
    expect(typeof entry.top.width).toBe('number');
    expect(typeof entry.start.width).toBe('number');
  });
});

describe('alignmentClassNames', () => {
  it('should map Excel alignment to the Handsontable class names the export reads', () => {
    expect(alignmentClassNames({ horizontal: 'center', vertical: 'middle' })).toEqual(['htCenter', 'htMiddle']);
    expect(alignmentClassNames({ horizontal: 'left' })).toEqual(['htLeft']);
    expect(alignmentClassNames({ horizontal: 'right', vertical: 'top' })).toEqual(['htRight', 'htTop']);
    expect(alignmentClassNames({ horizontal: 'justify', vertical: 'bottom' })).toEqual(['htJustify', 'htBottom']);
    expect(alignmentClassNames({ horizontal: 'general' })).toEqual([]);
    expect(alignmentClassNames(null)).toEqual([]);
  });
});

describe('fontFillRule', () => {
  const base = { alignment: null, font: null, fill: null, border: null };

  it('should build one rule with a stable class name from font and fill', () => {
    const style = {
      ...base,
      font: { bold: true, italic: true, underline: true, color: { argb: 'FFFF0000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } },
    };
    const rule = fontFillRule(style, { readOnly: false });

    expect(rule.declarations).toBe(
      'font-weight:bold;font-style:italic;text-decoration:underline;color:#ff0000;background-color:#00ff00'
    );
    expect(rule.className).toBe(`htImported-${styleHash(rule.declarations)}`);
    expect(fontFillRule(style, { readOnly: false }).className).toBe(rule.className);
  });

  it('should return null when the style carries nothing to paint', () => {
    expect(fontFillRule({ ...base, alignment: { horizontal: 'center' } }, { readOnly: false })).toBeNull();
    expect(fontFillRule({ ...base, font: {} }, { readOnly: false })).toBeNull();
  });

  it('should skip an injected font or fill color instead of letting it reach a declaration', () => {
    const style = {
      ...base,
      font: { bold: true, color: { argb: BREAKOUT_ARGB } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BREAKOUT_ARGB } },
    };
    const rule = fontFillRule(style, { readOnly: false });

    expect(rule.declarations).toBe('font-weight:bold');
    expect(rule.declarations).not.toMatch(/[{}]/);
  });

  it('should return null when an injected color is the only thing the cell would paint', () => {
    const style = {
      ...base,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BREAKOUT_ARGB } },
    };

    expect(fontFillRule(style, { readOnly: false })).toBeNull();
  });

  it('should ignore the read-only sentinel colors on a read-only cell but keep them on an editable one', () => {
    const sentinel = {
      ...base,
      font: { color: { argb: 'FF808080' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } },
    };

    expect(fontFillRule(sentinel, { readOnly: true })).toBeNull();
    expect(fontFillRule(sentinel, { readOnly: false }).declarations).toBe('color:#808080;background-color:#f0f0f0');
    const boldSentinel = { ...sentinel, font: { bold: true, color: { argb: 'FF808080' } } };

    expect(fontFillRule(boldSentinel, { readOnly: true }).declarations).toBe('font-weight:bold');
  });
});

describe('borderEntry', () => {
  it('should map Excel border styles to customBorders widths and sides', () => {
    const entry = borderEntry({
      top: { style: 'thin', color: { argb: 'FF0000FF' } },
      bottom: { style: 'medium' },
      left: { style: 'thick', color: { argb: 'FFFF0000' } },
      right: { style: 'dashed', color: { argb: 'FF00FF00' } },
    }, 2, 3);

    expect(entry).toEqual({
      row: 2,
      col: 3,
      top: { width: 1, color: '#0000ff' },
      bottom: { width: 2, color: '#000000' },
      start: { width: 3, color: '#ff0000' },
      end: { width: 1, color: '#00ff00' },
    });
  });

  it('should fall back to black for a border color that is not plain hex', () => {
    const entry = borderEntry({
      top: { style: 'thin', color: { argb: BREAKOUT_ARGB } },
      left: { style: 'medium', color: { argb: 'not-a-color' } },
    }, 0, 0);

    expect(entry).toEqual({
      row: 0,
      col: 0,
      top: { width: 1, color: '#000000' },
      start: { width: 2, color: '#000000' },
    });
    expect(JSON.stringify(entry)).not.toContain('attacker.example');
  });

  it('should return null for an empty border', () => {
    expect(borderEntry(null, 0, 0)).toBeNull();
    expect(borderEntry({}, 0, 0)).toBeNull();
  });
});

describe('styleHash', () => {
  it('should be stable and differ for different declarations', () => {
    expect(styleHash('a')).toBe(styleHash('a'));
    expect(styleHash('a')).not.toBe(styleHash('b'));
    expect(styleHash('font-weight:bold')).toMatch(/^[0-9a-z]+$/);
  });
});
