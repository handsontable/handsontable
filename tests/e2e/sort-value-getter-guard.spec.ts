import { test, expect } from '../fixtures/test';
import { SortValueGetterGuardPage } from '../fixtures/pages/SortValueGetterGuardPage';

/**
 * The sort gather loop reads its input through a bulk accessor that resolves the column coordinates
 * once and then reads the source rows directly. That fast loop runs no user code, so a `valueGetter`
 * - which `autocomplete`, `dropdown` and `multiSelect` all ship - has to be found by a probe before
 * the loop starts, or the comparator silently receives a different value than the grid shows.
 *
 * Only a real browser can show the hard half of that. Stored cell meta is created by rendering, so
 * on a 300px grid over 500 rows the rendered band carries stored meta and the rest does not. The
 * per-row "is meta stored" probe covers the band; every other row depends on the column-layer probe.
 * In jsdom every row renders, so the per-row probe alone would make any value come out right and the
 * column-layer probe would go untested.
 *
 * Each case asserts the two reads against each other on ONE grid state, so a case cannot pass by
 * both paths being equally wrong - the per-cell path is the unchanged public API.
 */
test.describe('the sort read path keeps every `valueGetter` on it', () => {
  let grid: SortValueGetterGuardPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SortValueGetterGuardPage(page, theme, bundle);
  });

  test('reads a plain column the same way in bulk as cell by cell', async () => {
    await grid.goto('plain');

    const { perCell, bulk, renderedRows } = await grid.readColumnBothWays();

    // The premise of the whole spec: most rows are NOT rendered, so most rows carry no stored meta.
    expect(renderedRows).toBeLessThan(100);
    expect(bulk).toEqual(perCell);
  });

  test('keeps the `valueGetter` of a column-typed dropdown for the unrendered rows', async () => {
    await grid.goto('column');

    const { perCell, bulk, renderedRows } = await grid.readColumnBothWays();

    expect(renderedRows).toBeLessThan(100);
    // Unwrapped by the dropdown getter. Without it the read yields the stored `{ value }` object.
    expect(perCell[0]).toBe('"v0500"');
    expect(bulk).toEqual(perCell);
  });

  test('keeps a `valueGetter` a `cells()` function puts on the rendered rows', async () => {
    await grid.goto('cells');

    const { perCell, bulk } = await grid.readColumnBothWays();

    // `cells()` runs on stored meta only, so the rendered band reads unwrapped and the rest reads
    // the raw object. The grid already reads one column two ways inside one operation; the bulk
    // accessor has to reproduce that split rather than pick one answer for the whole column.
    expect(bulk).toEqual(perCell);
    expect(perCell[0]).toBe('"v0500"');
    expect(perCell[perCell.length - 1]).toBe('{"value":"v0001"}');
  });

  test('keeps a `valueGetter` a declarative `cell` entry puts on one unrendered row', async () => {
    await grid.goto('cell-option');

    const { perCell, bulk } = await grid.readColumnBothWays();

    expect(perCell[400]).toBe('"v0100"');
    expect(bulk).toEqual(perCell);
  });

  test('sorts a dropdown column by the value its `valueGetter` returns', async () => {
    await grid.goto('column');

    await grid.sortFirstColumnAscending();

    // Without the getter the comparator would see 500 objects, compare them as equal and leave the
    // descending order untouched - so this is what proves the guard sent the read down the slow path.
    expect(await grid.valueAt(0)).toBe('v0001');
    expect(await grid.valueAt(1)).toBe('v0002');
  });
});
