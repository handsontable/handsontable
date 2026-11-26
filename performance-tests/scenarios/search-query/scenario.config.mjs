// Grid: 100000 rows x 20 cols -- one `search.query()` over all 2,000,000 cells, starting from the
// stored cell meta of a freshly loaded grid. The query must not store a meta object for every cell it
// scans: it did, which made the first query about twice as slow and kept about 170 MB of meta.
export default {
  name: 'search-query',
  warmupRuns: 1,
  // Five, as for the other short windows: one GC pause inside a sub-second window moves a mean of
  // three by 10 to 20%, and the iterations are cheap next to the data reload in `resetFn`.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
