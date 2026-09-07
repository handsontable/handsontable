// Grid: 5000 rows x 10 cols -- standard grid to measure editor open/type/confirm cycle
export default {
  name: 'cell-editing',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
