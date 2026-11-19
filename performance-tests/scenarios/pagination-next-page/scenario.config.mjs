// Grid: 100000 rows x 20 cols, `pagination: { pageSize: 50 }` -- a page change must write the page's
// hiding map once, not fire a `change` hook per hidden row. The per-row writes cost about 22 ms per page
// change at this size against about 11 ms for one write (wall-clock, twenty `nextPage()` calls). A page
// change stays linear in the row count: the window also holds the index mapper's cache rebuild, the
// undo step each page change records, and the render of one page.
export default {
  name: 'pagination-next-page',
  warmupRuns: 1,
  // Five, as for the other short windows: twenty page changes take a few hundred ms, where one GC
  // pause moves a mean of three by 10 to 20%, and the iterations are cheap next to the fixture load.
  iterations: 5,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
