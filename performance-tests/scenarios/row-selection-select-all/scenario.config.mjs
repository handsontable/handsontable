// Grid: 100000 rows x 20 cols with `rowSelection: true` -- `selectAll()` resolves the 'all' scope over
// every physical row, writes the selection map, and repaints every rendered cell (the plugin marks
// all cells changed), so the cost scales with the row count. 20 columns keep the fixture load cheap;
// the column count only changes the repaint, not the row scans.
export default {
  name: 'row-selection-select-all',
  warmupRuns: 1,
  // Five, not three: a short window on a large heap, the same reasoning as sorting and the undo
  // scenarios. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see
  // lib/environment.mjs).
  measurementVersion: 1,
};
