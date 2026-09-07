// Grid: 10 rows x 5000 cols -- wide grid to stress horizontal scroll rendering (leftward)
export default {
  name: 'scroll-left',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
