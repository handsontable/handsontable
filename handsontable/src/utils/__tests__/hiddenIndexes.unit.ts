import { collectAdjacentHiddenPhysicalIndexes } from 'handsontable/utils/hiddenIndexes';

describe('collectAdjacentHiddenPhysicalIndexes', () => {
  const identityMap = (count: number): number[] => {
    const indexes = new Array(count);

    for (let i = 0; i < count; i += 1) {
      indexes[i] = i;
    }

    return indexes;
  };

  it('should return an empty array when no neighbor is hidden', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set())).toEqual([]);
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([4]))).toEqual([]);
  });

  it('should collect the contiguous hidden stretch immediately before the visual index, in visual order', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([0, 1]))).toEqual([0, 1]);
  });

  it('should collect the contiguous hidden stretch immediately after the visual index', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(0, 5, identityMap(5), new Set([1, 2]))).toEqual([1, 2]);
  });

  it('should collect hidden stretches on both sides of the visual index', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([1, 3]))).toEqual([1, 3]);
  });

  it('should collect physical indexes from the visual map, not the visual indexes themselves', () => {
    const notTrimmedIndexes = [10, 20, 30, 40, 50];

    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, notTrimmedIndexes, new Set([20, 40]))).toEqual([20, 40]);
  });

  it('should stop at the first visible neighbor, leaving a non-adjacent hidden index out', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(3, 5, identityMap(5), new Set([1]))).toEqual([]);
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([0, 4]))).toEqual([]);
  });

  it('should include physical index 0, which is a valid hidden index', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(1, 3, identityMap(3), new Set([0]))).toEqual([0]);
  });

  it('should stop when a visual slot has no physical index', () => {
    const notTrimmedIndexes = [0, undefined, 2] as number[];

    expect(collectAdjacentHiddenPhysicalIndexes(2, 3, notTrimmedIndexes, new Set([0]))).toEqual([]);
  });

  it('should not walk past visualCount even when the map is longer', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(1, 3, identityMap(5), new Set([2, 3, 4]))).toEqual([2]);
  });

  it('should append into the provided target array and return it', () => {
    const target = [99];
    const result = collectAdjacentHiddenPhysicalIndexes(1, 3, identityMap(3), new Set([2]), target);

    expect(result).toBe(target);
    expect(target).toEqual([99, 2]);
  });

  it('should collect a long contiguous stretch after the visual index without overflowing the stack', () => {
    const visualCount = 50001;
    const notTrimmedIndexes = identityMap(visualCount);
    const hiddenPhysicalIndexes = new Set<number>();

    for (let i = 1; i < visualCount; i += 1) {
      hiddenPhysicalIndexes.add(i);
    }

    const result = collectAdjacentHiddenPhysicalIndexes(
      0,
      visualCount,
      notTrimmedIndexes,
      hiddenPhysicalIndexes,
    );

    expect(result).toHaveLength(50000);
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(50000);
  });

  it('should collect a long contiguous stretch before the visual index in visual order', () => {
    const visualCount = 50001;
    const notTrimmedIndexes = identityMap(visualCount);
    const hiddenPhysicalIndexes = new Set<number>();

    for (let i = 0; i < visualCount - 1; i += 1) {
      hiddenPhysicalIndexes.add(i);
    }

    const result = collectAdjacentHiddenPhysicalIndexes(
      visualCount - 1,
      visualCount,
      notTrimmedIndexes,
      hiddenPhysicalIndexes,
    );

    expect(result).toHaveLength(50000);
    expect(result[0]).toBe(0);
    expect(result[result.length - 1]).toBe(49999);
  });
});
