// Grid: 10000 rows x 50 cols, every column `type: 'date'` -- a date cell type injects a
// `sourceDataValidator` into every cell, so this measures the load (scripting) time and JS heap of
// source-data validation across the whole grid. Guards the eager-cell-meta materialization path.
export default {
  name: 'source-data-validator-load',
  warmupRuns: 1,
  iterations: 3,
};
