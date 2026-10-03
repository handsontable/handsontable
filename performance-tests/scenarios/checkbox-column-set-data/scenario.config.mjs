// Grid: 100000 rows x 10 cols, column 0 a checkbox column without `headerCheckbox` -- one
// `setDataAtCell()` writing `true` into all 100000 cells of the column. The baseline for
// checkbox-header-toggle: the same write without the CheckboxHeader plugin's scope and value scans.
export default {
  name: 'checkbox-column-set-data',
  warmupRuns: 1,
  // Five, not three: a short window on a large heap, the same reasoning as sorting and the undo
  // scenarios. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see
  // lib/environment.mjs).
  measurementVersion: 1,
};
