import { isArrayLike } from '../utils';

describe('AsyncValues utils', () => {
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
