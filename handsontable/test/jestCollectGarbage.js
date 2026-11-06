/**
 * Collects garbage once each test file is done, for Jest only.
 *
 * A Jest worker runs about seventy test files of a full run, and each builds grids in jsdom. The
 * garbage they leave is collected only when V8 decides to, so a worker's heap read 2.2 GB by the
 * end of a run while the live part, measured after a forced collection, stayed under 0.5 GB. A
 * worker caught in the collection of that heap when Jest asks it to exit misses jest-worker's
 * 500 ms grace, and the run ends with "A worker process has failed to exit gracefully and has been
 * force exited" although nothing leaked (`--detectOpenHandles` found nothing once the ASCII-bundle
 * spec left Jest). Collecting after every file keeps the heap near its live size: the full run
 * measured the same 95 s, and the message is gone.
 *
 * `gc` exists only when Node runs with `--expose-gc`, which the `test:unit.jest` task in
 * `scripts/tasks.json` passes through `NODE_OPTIONS` (a worker inherits it), and Jest copies it
 * into the test sandbox. A bare `jest` call without the flag runs every test as before and skips
 * the collection.
 *
 * Registered in `jest.config.js` only, for the reason `jsdomWindowScroll.js` gives.
 */
afterAll(() => {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
  }
});
