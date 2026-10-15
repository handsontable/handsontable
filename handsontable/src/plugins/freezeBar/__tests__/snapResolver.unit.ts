import { resolveFreezeCount } from '../snapResolver';

describe('resolveFreezeCount', () => {
  const sizes = [50, 50, 50, 50];

  it('should snap to the nearest boundary', () => {
    expect(resolveFreezeCount({ distance: 0, trackSizes: sizes, maxCount: 4 })).toBe(0);
    expect(resolveFreezeCount({ distance: 20, trackSizes: sizes, maxCount: 4 })).toBe(0);
    expect(resolveFreezeCount({ distance: 30, trackSizes: sizes, maxCount: 4 })).toBe(1);
    expect(resolveFreezeCount({ distance: 110, trackSizes: sizes, maxCount: 4 })).toBe(2);
  });

  it('should snap to the lower boundary on an exact tie', () => {
    expect(resolveFreezeCount({ distance: 25, trackSizes: sizes, maxCount: 4 })).toBe(0);
  });

  it('should return 0 for a pointer dragged past the edge', () => {
    expect(resolveFreezeCount({ distance: -80, trackSizes: sizes, maxCount: 4 })).toBe(0);
  });

  it('should clamp to the maximum count', () => {
    expect(resolveFreezeCount({ distance: 1000, trackSizes: sizes, maxCount: 2 })).toBe(2);
  });

  it('should clamp to the number of tracks', () => {
    expect(resolveFreezeCount({ distance: 1000, trackSizes: sizes, maxCount: 99 })).toBe(4);
  });

  it('should count hidden tracks (size 0) inside the band but not after it', () => {
    // visual tracks: hidden, 50, 50
    expect(resolveFreezeCount({ distance: 48, trackSizes: [0, 50, 50], maxCount: 3 })).toBe(2);
    // pointer near the edge: the hidden track alone is not frozen
    expect(resolveFreezeCount({ distance: 3, trackSizes: [0, 50, 50], maxCount: 3 })).toBe(0);
    // a hidden track right after the last frozen one stays unfrozen
    expect(resolveFreezeCount({ distance: 52, trackSizes: [50, 0, 50], maxCount: 3 })).toBe(1);
  });

  it('should return 0 when there are no tracks', () => {
    expect(resolveFreezeCount({ distance: 40, trackSizes: [], maxCount: 0 })).toBe(0);
  });
});
