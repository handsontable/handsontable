// Grid: 100000 rows x 100 cols -- real-world tall dataset to stress sort + re-render at scale
export default {
  name: 'sorting',
  warmupRuns: 1,
  // Five, not three: the sort runs in a 100-150 ms window on a 350 MB heap, where one GC pause moves
  // a mean of three by 10-20%. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
