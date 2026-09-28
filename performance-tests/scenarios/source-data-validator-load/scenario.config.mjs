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
  // Bump when this spec changes what the marked window contains, or when `iterations` changes. Not
  // bumped for the 3 -> 5 change above: HARNESS_VERSION 2 landed in the same change and already
  // restarts the whole golden pool (see lib/environment.mjs).
  measurementVersion: 1,
};
