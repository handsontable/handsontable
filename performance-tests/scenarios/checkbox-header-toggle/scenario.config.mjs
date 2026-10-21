// Grid: 100000 rows x 10 cols, column 0 a checkbox column with `headerCheckbox: true` --
// `toggleColumn(0)` resolves the scope over every row (a cell meta read per row), reads every value,
// and writes the whole column in one 100000-cell `setDataAtCell()`. checkbox-column-set-data is the
// same grid running that `setDataAtCell()` alone, so the difference is the plugin's own cost.
export default {
  name: 'checkbox-header-toggle',
  warmupRuns: 1,
  // Five, not three: a short window on a large heap, the same reasoning as sorting and the undo
  // scenarios. The iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see
  // lib/environment.mjs).
  measurementVersion: 1,
};
