import {
  isHeaderPlaceholder,
  lookupSelectionHeader,
  resolveHeaderLevel,
} from '../../../../src/selection/border/utils';

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
  it('should detect the nested-header hiddenHeader class', () => {
    const placeholder = document.createElement('th');

    placeholder.className = 'hiddenHeader';

    expect(isHeaderPlaceholder(placeholder)).toBe(true);
    expect(isHeaderPlaceholder(document.createElement('th'))).toBe(false);
    expect(isHeaderPlaceholder(undefined)).toBe(false);
    expect(isHeaderPlaceholder(null)).toBe(false);
  });
});

describe('lookupSelectionHeader', () => {
  const visible = (label: string) => {
    const th = document.createElement('th');

    th.textContent = label;

    return th;
  };
  const placeholder = () => {
    const th = document.createElement('th');

    th.className = 'hiddenHeader';

    return th;
  };

  it('should use the selected level when that header is laid out', () => {
    const nested = visible('I');
    const getHeader = jest.fn((index: number, level: number) => {
      if (index === 1 && level === 2) {
        return nested;
      }

      return visible('leaf');
    });

    expect(lookupSelectionHeader(getHeader, 1, 2, 3)).toBe(nested);
    expect(getHeader).toHaveBeenCalledTimes(1);
  });

  it('should fall back to the closest header when the selected level is a colspan placeholder', () => {
    // Selecting nested header "I" (colspan 2) looks up the last covered column at the
    // group level and hits `hiddenHeader`. The closest leaf maps 1:1 onto that column.
    const leaf = visible('P');
    const getHeader = jest.fn((index: number, level: number) => {
      if (index === 2 && level === 2) {
        return placeholder();
      }
      if (index === 2 && level === 3) {
        return leaf;
      }

      return undefined;
    });

    expect(lookupSelectionHeader(getHeader, 2, 2, 3)).toBe(leaf);
    expect(getHeader).toHaveBeenCalledWith(2, 2);
    expect(getHeader).toHaveBeenCalledWith(2, 3);
  });

  it('should not look up the closest level twice when the preferred level already is closest', () => {
    const getHeader = jest.fn(() => placeholder());

    expect(lookupSelectionHeader(getHeader, 0, 1, 1)).toBeUndefined();
    expect(getHeader).toHaveBeenCalledTimes(1);
    expect(getHeader).toHaveBeenCalledWith(0, 1);
  });

  it('should return undefined when both levels are placeholders', () => {
    const getHeader = jest.fn(() => placeholder());

    expect(lookupSelectionHeader(getHeader, 2, 2, 3)).toBeUndefined();
  });

  it('should fall back to the closest header when the selected level is missing', () => {
    const leaf = visible('O');
    const getHeader = jest.fn((_index: number, level: number) => {
      if (level === 3) {
        return leaf;
      }

      return undefined;
    });

    expect(lookupSelectionHeader(getHeader, 1, 2, 3)).toBe(leaf);
  });
});
