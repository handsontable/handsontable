// Grid: 100 rows x 10 cols, then a 10000 x 10 paste on the last row -- the paste writes past the last
// row, so the grid creates the 9999 missing rows. Creating them one at a time made this paste
// quadratic (about 15 s); the window guards the batched, linear path.
export default {
  name: 'paste-extend-rows',
  warmupRuns: 1,
  // Three: the window is about 110 ms on a 60 MB heap, not the 300 MB heaps of the five-iteration
  // scenarios, and four local runs of three gave means within 1% of each other.
  iterations: 3,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
