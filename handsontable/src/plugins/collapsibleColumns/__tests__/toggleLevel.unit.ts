import { findClosestToggleLevel } from '../toggleLevel';

describe('findClosestToggleLevel', () => {
  it('should return the starting level when its header can be toggled', () => {
    expect(findClosestToggleLevel(2, level => level === 2 || level === 0)).toBe(2);
  });

  it('should walk up to the closest level above the start whose header can be toggled', () => {
    expect(findClosestToggleLevel(2, level => level === 1 || level === 0)).toBe(1);
    expect(findClosestToggleLevel(2, level => level === 0)).toBe(0);
  });

  it('should never look below the starting level', () => {
    const asked: number[] = [];

    expect(findClosestToggleLevel(1, (level) => {
      asked.push(level);

      return level === 2;
    })).toBeNull();
    expect(asked).toEqual([1, 0]);
  });

  it('should return null when no header over the column can be toggled', () => {
    expect(findClosestToggleLevel(3, () => false)).toBeNull();
  });

  it('should return null for a grid without header levels', () => {
    expect(findClosestToggleLevel(-1, () => true)).toBeNull();
  });
});
