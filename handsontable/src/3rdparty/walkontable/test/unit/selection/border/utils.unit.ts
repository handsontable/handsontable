import { resolveHeaderLevel } from '../../../../src/selection/border/utils';

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
