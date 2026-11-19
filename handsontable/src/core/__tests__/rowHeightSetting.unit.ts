import { isAutoRowSizeOn, isExactRowHeight, resolveRowHeightSetting } from '../rowHeightSetting';

describe('resolveRowHeightSetting', () => {
  it('should return a number for every row', () => {
    expect(resolveRowHeightSetting(10, 0)).toBe(10);
    expect(resolveRowHeightSetting(10, 7)).toBe(10);
  });

  it('should read a numeric string as pixels', () => {
    expect(resolveRowHeightSetting('100px', 3)).toBe(100);
    expect(resolveRowHeightSetting('42', 0)).toBe(42);
  });

  it('should read an array by the visual row index', () => {
    expect(resolveRowHeightSetting([10, 20, undefined], 1)).toBe(20);
    expect(resolveRowHeightSetting([10, 20, undefined], 2)).toBeUndefined();
    expect(resolveRowHeightSetting([10, 20], 5)).toBeUndefined();
  });

  it('should call a function with the visual row index', () => {
    const heights = jest.fn((row: number) => row * 10);

    expect(resolveRowHeightSetting(heights, 4)).toBe(40);
    expect(heights).toHaveBeenCalledWith(4);
  });

  it('should read the string a function returns as pixels', () => {
    expect(resolveRowHeightSetting(() => '15px', 0)).toBe(15);
  });

  it('should pass a missing setting through', () => {
    expect(resolveRowHeightSetting(undefined, 0)).toBeUndefined();
    expect(resolveRowHeightSetting(null, 0)).toBeNull();
  });
});

describe('isExactRowHeight', () => {
  it('should accept a positive number, a fraction included', () => {
    expect(isExactRowHeight(1)).toBe(true);
    expect(isExactRowHeight(10)).toBe(true);
    expect(isExactRowHeight(10.5)).toBe(true);
  });

  it('should treat 0, a negative number and NaN as "no height of its own"', () => {
    expect(isExactRowHeight(0)).toBe(false);
    expect(isExactRowHeight(-5)).toBe(false);
    expect(isExactRowHeight(NaN)).toBe(false);
  });

  it('should reject a missing or non-numeric value', () => {
    expect(isExactRowHeight(undefined)).toBe(false);
    expect(isExactRowHeight(null)).toBe(false);
    expect(isExactRowHeight('10')).toBe(false);
  });

  it('should reject what `rowHeights: "abc"` resolves to', () => {
    expect(isExactRowHeight(resolveRowHeightSetting('abc', 0))).toBe(false);
  });
});

describe('isAutoRowSizeOn', () => {
  it('should be on for `true` and for a settings object', () => {
    expect(isAutoRowSizeOn(true)).toBe(true);
    expect(isAutoRowSizeOn({ syncLimit: 10 })).toBe(true);
  });

  it('should be off for `false`, a missing value and any other value', () => {
    expect(isAutoRowSizeOn(false)).toBe(false);
    expect(isAutoRowSizeOn(undefined)).toBe(false);
    expect(isAutoRowSizeOn(null)).toBe(false);
    expect(isAutoRowSizeOn('true')).toBe(false);
  });
});
