// Grid: 2000 rows x 200 cols, 25px columns in an 1800px viewport (~72 rendered columns). Column C
// starts narrow with wrapped text in rows 1-40, so those rows render tall and most of them sit below
// the first band with stale tall records; widening it makes them shrink on the next draw and the
// row band has to be refilled within that draw, in several passes (DEV-406). The
// measured action is that resize + draw, which is where the refill passes spend their renderer calls
// (DEV-2908 repaints only the appended rows per pass).
export default {
  name: 'column-autosize-refill',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains, or when `iterations` changes: the
  // median baseline only draws on develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
