// Grid: 100000 rows x 100 cols -- real-world tall dataset to stress sort + re-render at scale
export default {
  name: 'sorting',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
