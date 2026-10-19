import { normalizeRanges } from '../../copyPaste/copyableRanges';
import { isArrayLike, readCopiedAxes } from '../utils';

describe('AsyncValues utils', () => {
  it('should lay out copied axes the way the CopyPaste plugin lays out the copied data', () => {
    const ranges = [
      { startRow: -1, startCol: 2, endRow: 3, endCol: 0 },
      { startRow: 5, startCol: 1, endRow: 2, endCol: 4 },
      { startRow: 0, startCol: -1, endRow: 0, endCol: -1 },
    ];

    expect(readCopiedAxes(ranges)).toEqual(normalizeRanges(ranges));
  });

  it('should tell an array-like answer from anything else', () => {
    expect(isArrayLike([])).toBe(true);
    expect(isArrayLike({ length: 2, 0: 'a', 1: 'b' })).toBe(true);
    expect(isArrayLike(new Float32Array(2))).toBe(true);
    expect(isArrayLike({ value: 'a' })).toBe(false);
    expect(isArrayLike({ length: -1 })).toBe(false);
    expect(isArrayLike({ length: 1.5 })).toBe(false);
    expect(isArrayLike('ab')).toBe(false);
    expect(isArrayLike(null)).toBe(false);
  });
});
