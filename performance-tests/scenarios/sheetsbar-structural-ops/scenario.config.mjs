// Workbook: 10 sheets x 10000 rows x 10 cols (100000 cells each) in one SheetsBar grid on one shared
// HyperFormula engine. Every wrapped structural engine call lists the formulas of the other sheets that
// name the visible one, and a per-sheet cache skips a sheet with no such formula until the engine reports
// a change in it. Nine peer sheets hold values only, so after the warmup scan the window measures the
// cached path (a row insert and a row removal in the visible sheet). Without the cache, each of the two
// calls reads the formulas of all nine peers.
export default {
  name: 'sheetsbar-structural-ops',
  warmupRuns: 1,
  // Five, not three: the window is short on a large heap, where one GC pause moves a mean of three
  // by 10-20% (the same reason as the undo scenarios).
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
