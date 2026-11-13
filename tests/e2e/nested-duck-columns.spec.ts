import { test, expect } from '../fixtures/test';
import { NestedDuckColumnsPage } from '../fixtures/pages/NestedDuckColumnsPage';

/**
 * DEV-3497. With object data and no `columns`, a property nested two or more levels deep was named
 * by its last parent only (`b.c` for `a.b.c`), so the column rendered blank and an edit wrote a new
 * top-level key.
 */
test.describe('nested object data without `columns`', () => {
  let grid: NestedDuckColumnsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NestedDuckColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  test('names every nested column by its full path', async () => {
    expect(await grid.columnProps()).toEqual(['id', 'a.b.c', 'a.x', 'p.q.r.s']);
  });

  test('renders the values of columns nested two and four levels deep', async () => {
    await expect(grid.cell(0, 1)).toHaveText('deep0');
    await expect(grid.cell(1, 1)).toHaveText('deep1');
    await expect(grid.cell(0, 3)).toHaveText('leaf0');
  });

  test('writes an edit back to the nested path and adds no top-level key', async () => {
    await grid.edit(0, 1, 'EDITED');

    await expect(grid.cell(0, 1)).toHaveText('EDITED');
    expect(await grid.sourceRow(0)).toEqual({
      id: 1,
      a: { b: { c: 'EDITED' }, x: 'ax0' },
      p: { q: { r: { s: 'leaf0' } } },
    });
  });
});
