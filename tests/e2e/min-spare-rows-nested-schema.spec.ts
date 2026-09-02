import { test, expect } from '../fixtures/test';
import { MinSpareRowsNestedSchemaPage } from '../fixtures/pages/MinSpareRowsNestedSchemaPage';

/**
 * GH #5069 – `minSpareRows` alongside a NESTED `dataSchema` default reached through a dotted
 * `columns[].data` path (`{ data: 'meta.active' }`).
 *
 * A spare row is a deep clone of the schema, so it carries `meta.active === false` and
 * `meta.tier === 'basic'`. Those are non-null, so the row only counts as empty if the schema
 * default is looked up along the same dotted path the cell value is read through. It was not:
 * the lookup was flat, `schema['meta.active']` resolved to `undefined`, no spare row ever
 * counted as empty, and `adjustRowsAndCols` appended a fresh batch of spares on every change —
 * two rows per keystroke-commit, without bound.
 *
 * The flat-`dataSchema` half of the same issue was fixed earlier (DEV-345); these cases cover
 * the nested half. Row counts are read with `expect.poll` because `adjustRowsAndCols` runs
 * deferred — a one-shot read cannot tell a stable count from one that has not grown yet.
 */
test.describe('minSpareRows with a nested dataSchema default', () => {
  let grid: MinSpareRowsNestedSchemaPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MinSpareRowsNestedSchemaPage(page, theme, bundle);
    await grid.goto();
  });

  test('recognises a spare row holding nested schema defaults as empty', async () => {
    // 3 data rows + minSpareRows: 2. Before the fix this was already inflated at init.
    await expect.poll(() => grid.rowCount()).toBe(5);
    await expect.poll(() => grid.trailingEmptyRowCount()).toBe(2);
    await expect.poll(() => grid.isEmptyRow(4)).toBe(true);
    await expect.poll(() => grid.isEmptyRow(3)).toBe(true);
    // The real data rows must NOT be swept up as empty by the same comparison.
    await expect.poll(() => grid.isEmptyRow(0)).toBe(false);
  });

  test('does not append rows when a real row is edited', async () => {
    await expect.poll(() => grid.rowCount()).toBe(5);

    await grid.typeIntoCell(0, 2, 'platinum');

    await expect.poll(() => grid.rowCount()).toBe(5);

    // Growth compounded per edit, so a second and third edit are what a single one cannot prove.
    await grid.typeIntoCell(1, 2, 'bronze');
    await expect.poll(() => grid.rowCount()).toBe(5);

    await grid.typeIntoCell(2, 2, 'gold');
    await expect.poll(() => grid.rowCount()).toBe(5);

    expect(grid.pageErrors).toEqual([]);
  });

  test('still appends a fresh spare row once a spare row is filled in', async () => {
    await expect.poll(() => grid.rowCount()).toBe(5);

    // Row 3 is the first spare. Filling it leaves only one trailing empty row, so
    // `minSpareRows: 2` must top the grid back up — this is the complement that would fail if
    // the fix simply reported every row as empty.
    await grid.typeIntoCell(3, 2, 'platinum');

    await expect.poll(() => grid.rowCount()).toBe(6);
    await expect.poll(() => grid.trailingEmptyRowCount()).toBe(2);
    await expect.poll(() => grid.isEmptyRow(3)).toBe(false);
    expect(grid.pageErrors).toEqual([]);
  });

  test('reports a column of nested schema defaults as empty', async () => {
    // Every row's `meta.tier` differs from the default, so the column is not empty...
    await expect.poll(() => grid.isEmptyCol(2)).toBe(false);

    // ...but once every value equals the nested default, it is. `isEmptyCol` shares the lookup
    // `isEmptyRow` uses, and is reachable through the public API even where `minSpareCols`
    // is not.
    await grid.rebuild({
      data: [
        { id: 1, meta: { active: true, tier: 'basic' } },
        { id: 2, meta: { active: true, tier: 'basic' } },
      ],
      minSpareRows: 0,
    });

    await expect.poll(() => grid.isEmptyCol(2)).toBe(true);
    await expect.poll(() => grid.isEmptyCol(0)).toBe(false);
  });

  test('resolves a literal dotted schema key rather than walking the path', async () => {
    // `DataMap#get` prefers an own key over the path walk, even while `dataDotNotation` is on,
    // so a schema declaring the dotted key literally must resolve too. Reading it as a path
    // reintroduces the growth above for this config.
    await grid.rebuild({
      data: [{ 'meta.tier': 'gold' }, { 'meta.tier': 'silver' }],
      dataSchema: { 'meta.tier': 'basic' },
      columns: [{ data: 'meta.tier' }],
      colHeaders: ['meta.tier'],
      minSpareRows: 2,
    });

    await expect.poll(() => grid.rowCount()).toBe(4);
    await expect.poll(() => grid.isEmptyRow(3)).toBe(true);

    await grid.typeIntoCell(0, 0, 'platinum');

    await expect.poll(() => grid.rowCount()).toBe(4);
    expect(grid.pageErrors).toEqual([]);
  });
});
