// Grid: 100000 rows x 100 cols -- measures JS heap (UpdateCounters) and scripting (load) time for an
// initial grid build. The data is generated once outside the traced action so only the grid
// construction is measured.
export default {
  name: 'initial-load',
  warmupRuns: 1,
  iterations: 3,
};
