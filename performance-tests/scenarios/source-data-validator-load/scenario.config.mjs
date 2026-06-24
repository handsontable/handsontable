// Grid: 10000 rows x 50 cols with a custom `sourceDataValidator` -- measures the load (scripting)
// time and JS heap of running source-data validation across the whole grid. Uses the public
// `sourceDataValidator` option (not a built-in cell type) so the test does not depend on cell-type
// internals.
export default {
  name: 'source-data-validator-load',
  warmupRuns: 1,
  iterations: 3,
};
