import { getTextTruncation } from '../textTruncation';

describe('getTextTruncation', () => {
  it('should not truncate by default', () => {
    expect(getTextTruncation({})).toEqual({ mode: 'none' });
    expect(getTextTruncation({ textEllipsis: false })).toEqual({ mode: 'none' });
  });

  it('should truncate to a single line for `true`', () => {
    expect(getTextTruncation({ textEllipsis: true })).toEqual({ mode: 'ellipsis' });
  });

  it('should keep acting as `true` for any other truthy non-number value', () => {
    expect(getTextTruncation({ textEllipsis: 'yes' } as never)).toEqual({ mode: 'ellipsis' });
  });

  it('should truncate to a single line for `1`', () => {
    expect(getTextTruncation({ textEllipsis: 1 })).toEqual({ mode: 'ellipsis' });
  });

  it('should clamp to the given number of lines for an integer of 2 or more', () => {
    expect(getTextTruncation({ textEllipsis: 2 })).toEqual({ mode: 'clamp', lines: 2 });
    expect(getTextTruncation({ textEllipsis: 10 })).toEqual({ mode: 'clamp', lines: 10 });
  });

  it('should return the same frozen result for the same number of lines', () => {
    const first = getTextTruncation({ textEllipsis: 3 });

    expect(getTextTruncation({ textEllipsis: 3 })).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(getTextTruncation({ textEllipsis: 4 })).not.toBe(first);
  });

  it('should fall back to no truncation for a number that is not a positive integer', () => {
    [0, -1, 2.5, NaN, Infinity, -Infinity].forEach((textEllipsis) => {
      expect(getTextTruncation({ textEllipsis })).toEqual({ mode: 'none' });
    });
  });

  it('should truncate to a single line when `wordWrap` is `false`, whatever the number of lines', () => {
    expect(getTextTruncation({ textEllipsis: 3, wordWrap: false })).toEqual({ mode: 'ellipsis' });
  });

  it('should not let `wordWrap: false` enable truncation on its own', () => {
    expect(getTextTruncation({ wordWrap: false })).toEqual({ mode: 'none' });
  });

  it('should keep an invalid number at `none` even when `wordWrap` is `false`', () => {
    expect(getTextTruncation({ textEllipsis: 0, wordWrap: false })).toEqual({ mode: 'none' });
  });
});
