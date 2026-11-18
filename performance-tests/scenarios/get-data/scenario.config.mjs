// Grid: 100000 rows x 100 cols -- a full-grid bulk read through `getData()`; `getDataAtCol()` and
// `getDataAtRow()` take the same path
export default {
  name: 'get-data',
  warmupRuns: 1,
  // Five, not three: the read runs in a few hundred ms on a 350 MB heap, where one GC pause moves a
  // mean of three by 10-20%. The iterations are cheap next to the fixture load.
  iterations: 5,
  measurementVersion: 1,
};
