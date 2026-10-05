// Grid: 100000 rows x 50 cols with `rowSelection: true` and every other row selected -- the
// scroll-down action (500 wheel steps) with the plugin's per-cell `afterRenderer` and row header
// renderer on every painted cell. Compare against scroll-down (10000 x 50, same viewport and action):
// the row count does not change what a scroll frame paints, so the difference is the plugin's
// render-path cost.
export default {
  name: 'row-selection-scroll',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see
  // lib/environment.mjs).
  measurementVersion: 1,
};
