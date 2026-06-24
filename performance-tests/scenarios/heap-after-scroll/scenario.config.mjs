// Grid: 10000 rows x 50 cols -- scrolls the full height so every row is rendered, then the JS heap
// (UpdateCounters max) reflects what rendering ~10k rows retains. Guards scroll-time memory growth.
export default {
  name: 'heap-after-scroll',
  warmupRuns: 1,
  iterations: 3,
};
