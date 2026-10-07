import type { Locator } from '@playwright/test';

/**
 * Atomic geometry reads for the Walkontable page objects.
 *
 * A locator's `boundingBox()` resolves the node in one round trip and reads its box in another, and
 * Walkontable recycles the same `<tr>` nodes across a re-render. A node resolved as row 4 before a
 * scroll-driven draw is row 0 after it, so a read that straddles the draw reports another row's
 * height — `Expected: 69, Received: 30` in `frozen-column-row-heights.spec.ts`, 3 of 150 runs under
 * load, while the DOM was consistent at every task boundary. Every helper here therefore resolves a
 * node that is never recycled (a table's root, the grid) and queries and measures the row inside ONE
 * evaluation; the paired helpers read every value a comparison needs in that same evaluation, so no
 * draw can land between the two sides. A row a table does not render reads as `NaN`, which compares
 * unequal to every real height or offset, so a row that left the rendered band fails a pinned check
 * instead of passing as 0. (`toBe`/`toEqual` use `Object.is`, under which `NaN` does equal `NaN` — so
 * never pin an expectation to `NaN`; the guarantee is only that it matches no real value.)
 * Rules: `tests/AGENTS.md`, Determinism.
 */

/**
 * The rendered height of one row in one table, or `NaN` when that table does not render it.
 *
 * @param table The table's root locator (`.ht_master`, `.ht_clone_inline_start`), never recycled.
 * @param row The row's fixture index (`data-testid="row-<row>"` on the `<tr>`).
 */
export async function rowHeight(table: Locator, row: number): Promise<number> {
  return table.evaluate((root, target) => {
    const tr = root.querySelector(`tbody [data-testid="row-${target}"]`);

    return tr ? tr.getBoundingClientRect().height : NaN;
  }, row);
}

/**
 * The height of one row in the master AND in the inline-start overlay, read in one evaluation.
 *
 * @param grid The grid's root locator.
 * @param row The row's fixture index.
 */
export async function rowHeights(grid: Locator, row: number): Promise<{ master: number, overlay: number }> {
  return grid.evaluate((root, target) => {
    const read = (table: string) => root
      .querySelector(`${table} tbody [data-testid="row-${target}"]`)?.getBoundingClientRect().height ?? NaN;

    return { master: read('.ht_master'), overlay: read('.ht_clone_inline_start') };
  }, row);
}

/**
 * The vertical offset of a row relative to its own table's body, so the master and a clone are
 * comparable even though they sit at different page positions. `NaN` when the row is not rendered.
 *
 * @param table The table's root locator.
 * @param row The row's fixture index.
 */
export async function rowOffsetWithinTable(table: Locator, row: number): Promise<number> {
  return table.evaluate((root, target) => {
    const tr = root.querySelector(`tbody [data-testid="row-${target}"]`);
    const body = root.querySelector('tbody');

    return tr && body ? tr.getBoundingClientRect().top - body.getBoundingClientRect().top : NaN;
  }, row);
}

/**
 * How far each given row's offset in the master differs from its offset in the inline-start
 * overlay, all read in one evaluation. Zeroes mean the panes are aligned.
 *
 * @param grid The grid's root locator.
 * @param rows The rows' fixture indexes.
 */
export async function rowOffsetDrift(grid: Locator, rows: number[]): Promise<number[]> {
  return grid.evaluate((root, targets) => {
    const offset = (table: string, row: number) => {
      const tr = root.querySelector(`${table} tbody [data-testid="row-${row}"]`);
      const body = root.querySelector(`${table} tbody`);

      return tr && body ? tr.getBoundingClientRect().top - body.getBoundingClientRect().top : NaN;
    };

    return targets.map(row => offset('.ht_master', row) - offset('.ht_clone_inline_start', row));
  }, rows);
}
