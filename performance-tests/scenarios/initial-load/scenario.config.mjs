// Grid: 100000 rows x 100 cols -- measures JS heap (UpdateCounters) and scripting (load) time for an
// initial grid build. The data is generated once outside the traced action so only the grid
// construction is measured.
export default {
  name: 'initial-load',
  warmupRuns: 1,
  // Five, not three: the build runs in a 50-100 ms window on a 300 MB heap, where one GC pause moves
  // a mean of three by 10-20%. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
