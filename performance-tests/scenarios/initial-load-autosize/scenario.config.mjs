// Grid: 100000 rows x 50 cols, with the default AutoColumnSize -- measures the grid construction a
// tall grid pays when the application leaves column sizing on, which `initial-load` turns off. The
// synchronous part of the column sweep is bounded by a cell budget: past it, only the columns on screen
// are measured before the constructor returns, so this window must not grow with the column count.
// Fifty columns keep the default `syncLimit` (50) in play, which measured all 50 columns over every row
// (about 2.2 s) before the budget existed.
export default {
  name: 'initial-load-autosize',
  warmupRuns: 1,
  iterations: 3,
  measurementVersion: 1,
};
