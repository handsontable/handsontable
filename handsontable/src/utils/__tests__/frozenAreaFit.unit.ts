import { fitsFrozenBand, getMaxFittingFrozenCount, resolveFittingFrozenCounts } from '../frozenAreaFit';

describe('fitsFrozenBand', () => {
  const fits = (trackSizes: number[], oppositeBandSize = 0, viewportSize = 450) => fitsFrozenBand({
    viewportSize,
    trackSizes,
    oppositeBandSize,
    minScrollableSize: 40,
  });

  it('should accept a band that leaves the scrollable strip', () => {
    expect(fits([100, 100, 100, 100])).toBe(true);
  });

  it('should refuse a band that takes the room of the strip', () => {
    expect(fits([100, 100, 100, 100, 100])).toBe(false);
    expect(fits([100, 100], 300)).toBe(false);
  });

  it('should count a hidden track as a track that takes no room', () => {
    expect(fits([100, 100, 0])).toBe(true);
  });

  it('should accept an empty band', () => {
    expect(fits([], 0, 100)).toBe(true);
  });
});

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

describe('resolveFittingFrozenCounts', () => {
  const uniform = (size: number) => () => size;

  it('should cut a leading band that does not fit and keep a scrollable strip', () => {
    expect(resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 20,
      requestedTrailing: 0,
      total: 30,
      getTrackSize: uniform(100),
      minScrollableSize: 40,
    })).toEqual({ leading: 4, trailing: 0 });
  });

  it('should not touch a band that fits', () => {
    expect(resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 2,
      requestedTrailing: 1,
      total: 30,
      getTrackSize: uniform(100),
      minScrollableSize: 40,
    })).toEqual({ leading: 2, trailing: 1 });
  });

  it('should give the leading band priority and cut the trailing band by what it leaves', () => {
    expect(resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 3,
      requestedTrailing: 20,
      total: 30,
      getTrackSize: uniform(100),
      minScrollableSize: 40,
    })).toEqual({ leading: 3, trailing: 1 });
  });

  it('should measure the trailing band from the last track', () => {
    const sizes = [100, 100, 100, 100, 30, 30, 30, 30];

    expect(resolveFittingFrozenCounts({
      viewportSize: 150,
      requestedLeading: 0,
      requestedTrailing: 8,
      total: 8,
      getTrackSize: index => sizes[index],
      minScrollableSize: 30,
    })).toEqual({ leading: 0, trailing: 4 });
  });

  it('should count a hidden track (size 0) as taking no room', () => {
    const sizes = [100, 0, 100, 100];

    expect(resolveFittingFrozenCounts({
      viewportSize: 300,
      requestedLeading: 4,
      requestedTrailing: 0,
      total: 4,
      getTrackSize: index => sizes[index],
      minScrollableSize: 40,
    })).toEqual({ leading: 3, trailing: 0 });
  });

  it('should return 0 when the first track alone is wider than the viewport', () => {
    expect(resolveFittingFrozenCounts({
      viewportSize: 200,
      requestedLeading: 3,
      requestedTrailing: 0,
      total: 10,
      getTrackSize: uniform(300),
      minScrollableSize: 40,
    })).toEqual({ leading: 0, trailing: 0 });
  });

  it('should never exceed the number of tracks', () => {
    expect(resolveFittingFrozenCounts({
      viewportSize: 10000,
      requestedLeading: 20,
      requestedTrailing: 20,
      total: 5,
      getTrackSize: uniform(10),
      minScrollableSize: 40,
    })).toEqual({ leading: 5, trailing: 0 });
  });

  it('should not hand the tracks a cut leading band gives up to the trailing band', () => {
    // 10 columns, start 8 and end 5: without the option the end band is 10 - 8 = 2 columns
    expect(resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 8,
      requestedTrailing: 5,
      total: 10,
      getTrackSize: uniform(100),
      minScrollableSize: 40,
    })).toEqual({ leading: 4, trailing: 0 });

    expect(resolveFittingFrozenCounts({
      viewportSize: 10000,
      requestedLeading: 8,
      requestedTrailing: 5,
      total: 10,
      getTrackSize: uniform(10),
      minScrollableSize: 40,
    })).toEqual({ leading: 8, trailing: 2 });
  });

  it('should keep a hidden track at the inner edge of a band that fits as a whole', () => {
    // three start columns, the last one hidden: the whole band takes 200 px of the 450 px, so nothing needs cutting
    const getTrackSize = (index: number) => (index === 2 ? 0 : 100);

    expect(resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 3,
      requestedTrailing: 0,
      total: 10,
      getTrackSize,
      minScrollableSize: 40,
    })).toEqual({ leading: 3, trailing: 0 });

    // the same for the trailing band, whose inner edge is the lowest of its tracks
    expect(resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 0,
      requestedTrailing: 3,
      total: 10,
      getTrackSize: (index: number) => (index === 7 ? 0 : 100),
      minScrollableSize: 40,
    })).toEqual({ leading: 0, trailing: 3 });
  });

  it('should still cut a band that does not fit, and drop the hidden track it ends on', () => {
    // 5 columns of 100 px with the third hidden: 400 px of tracks do not fit 250 px, so the band is cut to two
    expect(resolveFittingFrozenCounts({
      viewportSize: 250,
      requestedLeading: 5,
      requestedTrailing: 0,
      total: 10,
      getTrackSize: (index: number) => (index === 2 ? 0 : 100),
      minScrollableSize: 40,
    })).toEqual({ leading: 2, trailing: 0 });
  });

  it('should walk only as many tracks as it needs on a large axis', () => {
    const getTrackSize = jest.fn(() => 100);

    resolveFittingFrozenCounts({
      viewportSize: 450,
      requestedLeading: 100000,
      requestedTrailing: 100000,
      total: 100000,
      getTrackSize,
      minScrollableSize: 40,
    });

    expect(getTrackSize.mock.calls.length).toBeLessThan(30);
  });
});
