// Grid: 100000 rows x 100 cols -- the undo puts back 100 removed rows, the structural path: physical order for the replay,
// the rows re-created with their values, then the maps restored
export default {
  name: 'undo-remove-rows',
  warmupRuns: 1,
  // Five, not three: the undo runs in a short window on a 300 MB heap, where one GC pause moves a
  // mean of three by 10-20% (the same reason as filtering and sorting).
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes.
  measurementVersion: 1,
};
