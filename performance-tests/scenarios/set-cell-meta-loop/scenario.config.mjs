// Grid: 10000 rows x 50 cols -- a loop of cheap recorded actions: 50000 `setCellMeta()` calls outside
// `batch()`, each its own undo step. The meta write costs microseconds and draws nothing, so the window
// is the undo bookkeeping around each call (the state capture on open and settle, the stack push). The
// stack is cleared between iterations, so each window records the same 50000 steps on an empty stack. A
// stack that is copied per step makes this loop quadratic, which a shorter loop barely shows.
export default {
  name: 'set-cell-meta-loop',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes.
  measurementVersion: 1,
};
