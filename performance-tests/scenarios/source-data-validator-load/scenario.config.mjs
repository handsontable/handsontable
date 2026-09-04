// Grid: 100000 rows x 100 cols with a custom `sourceDataValidator` -- measures the load (scripting)
// time and JS heap of running source-data validation across the whole grid. Uses the public
// `sourceDataValidator` option (not a built-in cell type) so the test does not depend on cell-type
// internals.
export default {
  name: 'source-data-validator-load',
  warmupRuns: 1,
  // Five, not three: run-to-run spread of the validator pass over 10 million cells was 20% after
  // removing the runner factor. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
