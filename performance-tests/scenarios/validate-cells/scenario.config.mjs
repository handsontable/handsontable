// Grid: 5000 rows x 20 cols, columns alternating `text` and `numeric` -- measures a bulk
// `validateCells()` pass over 100,000 cells. Every validated cell queues one core microtask, so this
// size shows per-entry bookkeeping that grows with the queue: dropping each entry from an array made
// the pass quadratic (about 5 s here, about 20 s at 10000 x 20, against well under a second with the
// entries in a Set). Not larger: each microtask is one trace event, and five iterations at 200,000
// cells wrote about 700 MB of raw traces into the uploaded output.
export default {
  name: 'validate-cells',
  warmupRuns: 1,
  // Five, as for the other short windows: one GC pause inside a sub-second window moves a mean of
  // three by 10 to 20%, and the iterations are cheap next to the grid rebuild in `resetFn`.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
