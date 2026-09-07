import { parsePixelSize } from 'handsontable/utils/pixelSize';

describe('parsePixelSize', () => {
  it('should return a number unchanged', () => {
    expect(parsePixelSize(100)).toBe(100);
    expect(parsePixelSize(0)).toBe(0);
    expect(parsePixelSize(12.5)).toBe(12.5);
  });

  it('should return a negative number unchanged, so the numeric path keeps its previous behavior', () => {
    expect(parsePixelSize(-5)).toBe(-5);
  });

  it('should resolve a bare numeric string', () => {
    expect(parsePixelSize('100')).toBe(100);
    expect(parsePixelSize('0')).toBe(0);
    expect(parsePixelSize('12.5')).toBe(12.5);
  });

  it('should resolve a pixel string regardless of the unit letter case', () => {
    expect(parsePixelSize('100px')).toBe(100);
    expect(parsePixelSize('100PX')).toBe(100);
    expect(parsePixelSize('12.5px')).toBe(12.5);
  });

  it('should ignore whitespace around the value and before the unit', () => {
    expect(parsePixelSize('  100  ')).toBe(100);
    expect(parsePixelSize('100 px')).toBe(100);
  });

  it('should return null for relative units, which cannot be resolved to a pixel count here', () => {
    expect(parsePixelSize('50%')).toBe(null);
    expect(parsePixelSize('20em')).toBe(null);
    expect(parsePixelSize('10rem')).toBe(null);
    expect(parsePixelSize('5vh')).toBe(null);
  });

  it('should return null for strings that are not a size', () => {
    expect(parsePixelSize('')).toBe(null);
    expect(parsePixelSize('auto')).toBe(null);
    expect(parsePixelSize('abc')).toBe(null);
    expect(parsePixelSize('100px100')).toBe(null);
    expect(parsePixelSize('px')).toBe(null);
  });

  it('should return null for a negative string, so a typo cannot collapse the header', () => {
    expect(parsePixelSize('-100')).toBe(null);
    expect(parsePixelSize('-100px')).toBe(null);
  });

  it('should return null for non-number, non-string values', () => {
    expect(parsePixelSize(null)).toBe(null);
    expect(parsePixelSize(undefined)).toBe(null);
    expect(parsePixelSize(true)).toBe(null);
    expect(parsePixelSize({})).toBe(null);
    expect(parsePixelSize([100])).toBe(null);
  });
});
