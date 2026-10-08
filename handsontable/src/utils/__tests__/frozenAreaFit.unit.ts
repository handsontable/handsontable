import { getMaxFittingFrozenCount } from '../frozenAreaFit';

describe('getMaxFittingFrozenCount', () => {
  it('should count the tracks that fit before the reserved scrollable strip', () => {
    // 5 tracks of 50px in a 300px viewport, 50px reserved => 250px available => 5 tracks would be 250.
    expect(getMaxFittingFrozenCount({
      viewportSize: 300,
      trackSizes: [50, 50, 50, 50, 50, 50],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(5);
  });

  it('should never let the frozen tracks fill the whole viewport', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 200,
      trackSizes: [100, 100, 100],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(1);
  });

  it('should subtract the band frozen on the opposite edge', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 300,
      trackSizes: [50, 50, 50, 50, 50, 50],
      oppositeBandSize: 100,
      minScrollableSize: 50,
    })).toBe(3);
  });

  it('should measure variable track sizes cumulatively', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 400,
      trackSizes: [200, 100, 30, 30],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(3);
  });

  it('should return 0 when not even the first track fits', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 100,
      trackSizes: [90],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(0);
  });

  it('should return 0 for a viewport that is not measured yet', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 0,
      trackSizes: [50],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(0);
  });

  it('should be capped by the number of tracks', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 10000,
      trackSizes: [50, 50],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(2);
  });

  it('should not end the count on a hidden track that follows the last one that fits', () => {
    // 50 + 50 fit in 140 with a 40px strip, the hidden track after them is free, and must not be counted
    expect(getMaxFittingFrozenCount({
      viewportSize: 140,
      trackSizes: [50, 50, 0, 50],
      oppositeBandSize: 0,
      minScrollableSize: 40,
    })).toBe(2);
  });

  it('should return 0 when every track that fits is hidden', () => {
    expect(getMaxFittingFrozenCount({
      viewportSize: 100,
      trackSizes: [0, 0, 90],
      oppositeBandSize: 0,
      minScrollableSize: 50,
    })).toBe(0);
  });
});
