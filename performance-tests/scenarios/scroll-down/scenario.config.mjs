// Grid: 10000 rows x 50 cols -- tall grid to stress vertical scroll rendering
export default {
  name: 'scroll-down',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
