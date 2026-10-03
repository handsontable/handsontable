// Grid: 100000 rows x 20 cols with `rowSelection: true`, every row selected before each iteration --
// `deselectAll()` lists the selected physical rows and clears all 100000 of them. The mirror of
// row-selection-select-all, on the same fixture.
export default {
  name: 'row-selection-deselect-all',
  warmupRuns: 1,
  // Five, not three: a short window on a large heap, the same reasoning as sorting and the undo
  // scenarios. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see
  // lib/environment.mjs).
  measurementVersion: 1,
};
