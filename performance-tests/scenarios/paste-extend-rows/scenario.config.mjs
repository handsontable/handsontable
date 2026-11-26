// Grid: 100 rows x 10 cols, then a 10000 x 10 paste on the last row -- the paste writes past the last
// row, so the grid creates the 9999 missing rows in one batch. Creating them one row at a time makes
// the cost quadratic in the gap: locally this window took about 100 ms batched and about 1.2 s with
// one row per call.
export default {
  name: 'paste-extend-rows',
  warmupRuns: 1,
  // Five, not three: the window is short (about 100 ms) and grows the heap from about 17 MB to 60 MB
  // inside it, so a GC pause can land in one iteration; a local run of three spread 99 to 121 ms.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
