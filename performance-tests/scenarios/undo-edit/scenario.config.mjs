// Grid: 100000 rows x 100 cols -- the undo of one edit must not scale with the grid: the journal holds one cell and every
// index map is shared with the previous state
export default {
  name: 'undo-edit',
  warmupRuns: 1,
  // Five, not three: the undo runs in a short window on a 300 MB heap, where one GC pause moves a
  // mean of three by 10-20% (the same reason as filtering and sorting).
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes.
  measurementVersion: 1,
};
