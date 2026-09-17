import {
  getBorderSettingsProperty,
  isHeaderPlaceholder,
  lookupSelectionHeader,
  measureHeaderSelectionBox,
  resolveHeaderLevel,
} from 'walkontable/selection/border/utils';

describe('getBorderSettingsProperty', () => {
  const fallbackBorder = { width: 1, color: '#000' };

  it('should keep an explicit side width of 0 instead of falling back to the default 1', () => {
    // DEV-1137: a truthy check treats 0 as missing and paints a 1px edge.
    expect(getBorderSettingsProperty({ width: 0, color: 'red' }, 'width', fallbackBorder)).toBe(0);
  });

  it('should keep other falsy-but-defined side values', () => {
    expect(getBorderSettingsProperty({ color: '' }, 'color', fallbackBorder)).toBe('');
  });

  it('should use the per-side value when it is a positive number', () => {
    expect(getBorderSettingsProperty({ width: 2, color: 'blue' }, 'width', fallbackBorder)).toBe(2);
    expect(getBorderSettingsProperty({ width: 2, color: 'blue' }, 'color', fallbackBorder)).toBe('blue');
  });

  it('should fall back when the side omits the property', () => {
    expect(getBorderSettingsProperty({ color: 'red' }, 'width', fallbackBorder)).toBe(1);
    expect(getBorderSettingsProperty({}, 'width', fallbackBorder)).toBe(1);
    expect(getBorderSettingsProperty(undefined, 'width', fallbackBorder)).toBe(1);
  });

  it('should fall back when the side value is undefined', () => {
    expect(getBorderSettingsProperty({ width: undefined }, 'width', fallbackBorder)).toBe(1);
  });

  it('should fall back when the side value is null', () => {
    expect(getBorderSettingsProperty({ extra: null }, 'extra', { extra: 'fallback' })).toBe('fallback');
  });

  it('should return undefined when neither the side nor the fallback provides the property', () => {
    expect(getBorderSettingsProperty(undefined, 'style', undefined)).toBeUndefined();
    expect(getBorderSettingsProperty({}, 'style', {})).toBeUndefined();
  });

  it('should keep an explicit empty style instead of inheriting the shared style', () => {
    // Empty style is falsy, so Border#createBorders takes the solid-fill else branch.
    expect(getBorderSettingsProperty(
      { style: '' },
      'style',
      { style: 'dashed' },
    )).toBe('');
  });

  it('should keep an explicit dashed style', () => {
    expect(getBorderSettingsProperty(
      { style: 'dashed' },
      'style',
      { style: 'dotted' },
    )).toBe('dashed');
  });

  it('should fall back to the shared style when the side omits it', () => {
    expect(getBorderSettingsProperty({}, 'style', { style: 'dashed' })).toBe('dashed');
    expect(getBorderSettingsProperty({ width: 1 }, 'style', { style: 'dashed' })).toBe('dashed');
    expect(getBorderSettingsProperty(undefined, 'style', { style: 'dashed' })).toBe('dashed');
  });

  it('should fall back to the shared style when the side style is null or undefined', () => {
    expect(getBorderSettingsProperty({ style: undefined }, 'style', { style: 'dashed' })).toBe('dashed');
    expect(getBorderSettingsProperty({ style: null }, 'style', { style: 'dashed' })).toBe('dashed');
  });
});

describe('resolveHeaderLevel', () => {
  it('should map the closest header coordinate to the last level', () => {
    // The old `columnHeaders.length - headerIndex` formula turns `-1` into `count + 1`
    // (out of range), so `getDimensionsFromHeader` never finds a header (DEV-1176).
    expect(resolveHeaderLevel(1, -1)).toBe(0);
    expect(resolveHeaderLevel(2, -1)).toBe(1);
    expect(resolveHeaderLevel(3, -1)).toBe(2);
  });

  it('should map a farther header coordinate to an earlier level', () => {
    expect(resolveHeaderLevel(2, -2)).toBe(0);
    expect(resolveHeaderLevel(3, -2)).toBe(1);
    expect(resolveHeaderLevel(3, -3)).toBe(0);
  });

  it('should map a body index to the closest header', () => {
    // `appear()` used to pass the clamped body corner (`0`) as the header index.
    // `count - 0` is `count`, which is also out of range.
    expect(resolveHeaderLevel(1, 0)).toBe(0);
    expect(resolveHeaderLevel(2, 0)).toBe(1);
    expect(resolveHeaderLevel(3, 4)).toBe(2);
  });

  it('should return an out-of-range level when the coordinate is past the farthest header', () => {
    expect(resolveHeaderLevel(1, -2)).toBe(-1);
    expect(resolveHeaderLevel(2, -3)).toBe(-1);
  });
});

describe('isHeaderPlaceholder', () => {
  const sizeOf = (el: HTMLElement) => Number(el.dataset.size ?? '0');
  const header = (size: number, className = '') => {
    const th = document.createElement('th');

    th.dataset.size = String(size);
    th.className = className;

    return th;
  };

  it('should treat a zero-size header as a collapsed placeholder', () => {
    expect(isHeaderPlaceholder(header(0), sizeOf)).toBe(true);
    expect(isHeaderPlaceholder(header(40), sizeOf)).toBe(false);
    expect(isHeaderPlaceholder(undefined, sizeOf)).toBe(false);
    expect(isHeaderPlaceholder(null, sizeOf)).toBe(false);
  });

  it('should keep a laid-out hiddenHeader (first-of-type colspan continuation)', () => {
    // NestedHeaders CSS hides `thead th.hiddenHeader:not(:first-of-type)` only.
    // A first-of-type continuation is still a real box and must be measured.
    expect(isHeaderPlaceholder(header(80, 'hiddenHeader'), sizeOf)).toBe(false);
    expect(isHeaderPlaceholder(header(0, 'hiddenHeader'), sizeOf)).toBe(true);
  });
});

describe('lookupSelectionHeader', () => {
  const sizeOf = (el: HTMLElement) => Number(el.dataset.size ?? '0');
  const header = (label: string, size: number, className = '') => {
    const th = document.createElement('th');

    th.textContent = label;
    th.dataset.size = String(size);
    th.className = className;

    return th;
  };

  it('should use the selected level when that header is laid out', () => {
    const nested = header('I', 40);
    const getHeader = jest.fn((index: number, level: number) => {
      if (index === 1 && level === 2) {
        return nested;
      }

      return header('leaf', 40);
    });

    expect(lookupSelectionHeader(getHeader, 1, 2, 3, sizeOf)).toBe(nested);
    expect(getHeader).toHaveBeenCalledTimes(1);
  });

  it('should use a laid-out hiddenHeader at the selected level', () => {
    const firstOfType = header('I', 80, 'hiddenHeader');
    const getHeader = jest.fn((index: number, level: number) => {
      if (index === 0 && level === 2) {
        return firstOfType;
      }

      return header('leaf', 40);
    });

    expect(lookupSelectionHeader(getHeader, 0, 2, 3, sizeOf)).toBe(firstOfType);
    expect(getHeader).toHaveBeenCalledTimes(1);
  });

  it('should fall back to the closest header when the selected level is collapsed', () => {
    // Selecting nested header "I" (colspan 2) looks up the last covered column at the
    // group level and hits a display:none continuation. The closest leaf maps 1:1
    // onto that column.
    const leaf = header('P', 40);
    const getHeader = jest.fn((index: number, level: number) => {
      if (index === 2 && level === 2) {
        return header('', 0, 'hiddenHeader');
      }
      if (index === 2 && level === 3) {
        return leaf;
      }

      return undefined;
    });

    expect(lookupSelectionHeader(getHeader, 2, 2, 3, sizeOf)).toBe(leaf);
    expect(getHeader).toHaveBeenCalledWith(2, 2);
    expect(getHeader).toHaveBeenCalledWith(2, 3);
  });

  it('should not look up the closest level twice when the preferred level already is closest', () => {
    const getHeader = jest.fn(() => header('', 0));

    expect(lookupSelectionHeader(getHeader, 0, 1, 1, sizeOf)).toBeUndefined();
    expect(getHeader).toHaveBeenCalledTimes(1);
    expect(getHeader).toHaveBeenCalledWith(0, 1);
  });

  it('should return undefined when both levels are collapsed', () => {
    const getHeader = jest.fn(() => header('', 0));

    expect(lookupSelectionHeader(getHeader, 2, 2, 3, sizeOf)).toBeUndefined();
  });

  it('should fall back to the closest header when the selected level is missing', () => {
    const leaf = header('O', 40);
    const getHeader = jest.fn((_index: number, level: number) => {
      if (level === 3) {
        return leaf;
      }

      return undefined;
    });

    expect(lookupSelectionHeader(getHeader, 1, 2, 3, sizeOf)).toBe(leaf);
  });
});

describe('measureHeaderSelectionBox', () => {
  it('should measure a row from the start header top to the end header bottom', () => {
    expect(measureHeaderSelectionBox('rows', 40, 80, 20, 24, 10, false, 0)).toEqual([29, 64]);
    expect(measureHeaderSelectionBox('rows', 40, 80, 20, 24, 10, true, 400)).toEqual([29, 64]);
  });

  it('should measure an LTR column from the start header left to the end header right', () => {
    expect(measureHeaderSelectionBox('columns', 30, 90, 50, 40, 10, false, 400)).toEqual([19, 100]);
  });

  it('should measure an RTL column from the table inline-end, matching appear() body math', () => {
    // Start header (fromIndex) sits on the visual right; end header on the visual left.
    // appear() writes this start to `style.right`:
    //   container.left + container.width - (start.left + start.width) - 1
    //   width = start.left + start.width - end.left
    expect(measureHeaderSelectionBox('columns', 200, 80, 50, 40, 10, true, 400)).toEqual([159, 170]);
  });

  it('should keep a single RTL column width equal to that header width', () => {
    expect(measureHeaderSelectionBox('columns', 200, 200, 50, 50, 10, true, 400)).toEqual([159, 50]);
  });
});
