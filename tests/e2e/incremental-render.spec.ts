import { test, expect } from '../fixtures/test';
import { IncrementalRenderPage } from '../fixtures/pages/IncrementalRenderPage';

/**
 * `renderMode: 'onChange'` paints a cell only when the element it lands in showed something else
 * after its last paint. Every case below checks two things: which cells were painted (through the
 * fixture's paint counter), and that the rendered tables are byte-identical to what a render that
 * paints every cell produces (`IncrementalRenderPage#expectEqualToFullRepaint`). The second check
 * is what catches a skipped cell that should have been painted, whatever the reason.
 */
test.describe('renderMode: onChange', () => {
  test('paints only the changed cell on a data change', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.resetPaints();
    await grid.run('hot.setDataAtCell(2, 3, "changed");');

    expect(await grid.paintedCells()).toEqual(['2,3']);
    await expect(grid.cell(2, 3)).toHaveText('changed');
    await grid.expectEqualToFullRepaint();
  });

  test('paints nothing on a render with nothing changed', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.resetPaints();
    await grid.run('hot.render();');

    expect(await grid.paintedCells()).toEqual([]);
    await grid.expectEqualToFullRepaint();
  });

  test('paints the cells whose meta changed, including a class that is removed again', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.run('hot.setCellMeta(1, 1, "className", "marker"); hot.render();');

    await expect(grid.cell(1, 1)).toHaveClass(/marker/);

    await grid.resetPaints();
    await grid.run('hot.removeCellMeta(1, 1, "className"); hot.render();');

    expect(await grid.paintedCells()).toEqual(['1,1']);
    await expect(grid.cell(1, 1)).not.toHaveClass(/marker/);

    await grid.run('hot.setCellMeta(0, 0, "readOnly", true); hot.render();');
    await expect(grid.cell(0, 0)).toHaveClass(/htDimmed/);
    await grid.run('hot.setCellMeta(0, 0, "readOnly", false); hot.render();');
    await expect(grid.cell(0, 0)).not.toHaveClass(/htDimmed/);
    await grid.expectEqualToFullRepaint();
  });

  test('paints every rendered cell after a structural change', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.resetPaints();
    await grid.run('hot.alter("insert_row_above", 0, 1);');

    const rendered = await grid.read<number>('hot.countRenderedRows() * hot.countRenderedCols()');

    expect((await grid.paintedCells()).length).toBe(rendered);
    await grid.expectEqualToFullRepaint();
  });

  test('keeps the DOM equal to a full repaint through scrolling', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.run('hot.scrollViewportTo({ row: 150, col: 5 }); hot.render();');
    await grid.expectEqualToFullRepaint();
    await grid.run('hot.scrollViewportTo({ row: 0, col: 0 }); hot.render();');
    await grid.expectEqualToFullRepaint();
  });

  test('repaints a cell marked with markCellChanged(), and every cell after markAllCellsChanged()', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'mixed');

    await grid.goto();
    await expect(grid.cell(0, 1)).toHaveText('r0c1:one');

    // Column 1 reads external state under `'onChange'` with no override: a render alone must not
    // repaint it (the documented limit), `markCellChanged()` must.
    await grid.run('window.htExternal = "two"; hot.render();');
    await expect(grid.cell(0, 1)).toHaveText('r0c1:one');

    await grid.run('hot.markCellChanged(0, 1); hot.render();');
    await expect(grid.cell(0, 1)).toHaveText('r0c1:two');
    await expect(grid.cell(1, 1)).toHaveText('r1c1:one');

    await grid.resetPaints();
    await grid.run('hot.markAllCellsChanged(); hot.render();');

    const rendered = await grid.read<number>('hot.countRenderedRows() * hot.countRenderedCols()');

    expect((await grid.paintedCells()).length).toBe(rendered);
    await expect(grid.cell(1, 1)).toHaveText('r1c1:two');
  });

  test('honors a column-level renderMode: always inside an onChange grid', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'mixed');

    await grid.goto();
    await grid.resetPaints();
    await grid.run('window.htExternal = "three"; hot.render();');

    const painted = await grid.paintedCells();

    // Every column-0 cell painted (its column is `'always'`), no other column did.
    expect(painted.every(key => key.endsWith(',0'))).toBe(true);
    expect(painted.length).toBe(await grid.read<number>('hot.countRenderedRows()'));
    await expect(grid.cell(0, 0)).toHaveText('r0c0:three');
    await expect(grid.cell(0, 1)).toHaveText('r0c1:one');
  });

  test('applies and removes selection classes in every shape', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');
    const count = (selector: string) => grid.read<number>(`document.querySelectorAll('${selector}').length`);
    const dataChange = 'hot.setDataAtCell(19, 9, "z" + Math.random());';

    await grid.goto();

    await grid.run(`hot.selectCell(1, 1); hot.selectCell(1, 1); hot.selectCell(0, 0); ${dataChange}`);
    expect(await count('.ht_master tbody td.current')).toBe(1);
    await grid.expectEqualToFullRepaint();

    await grid.run(`hot.selectRows(2, 3); ${dataChange}`);
    expect(await count('.ht_master tbody td.area')).toBe(20);
    await grid.expectEqualToFullRepaint();

    await grid.run(`hot.selectColumns(1); ${dataChange}`);
    expect(await count('.ht_master tbody td.area')).toBe(await grid.read<number>('hot.countRenderedRows()'));
    expect(await count('.ht_master thead th.ht__highlight')).toBeGreaterThan(0);
    await grid.expectEqualToFullRepaint();

    await grid.run(`hot.selectCells([[0, 0, 2, 2], [1, 1, 3, 3], [2, 2, 4, 4]]); ${dataChange}`);
    expect(await count('.ht_master tbody td[class*="area-"]')).toBeGreaterThan(0);
    await grid.expectEqualToFullRepaint();

    await grid.run(`hot.selectAll(); ${dataChange}`);
    await grid.expectEqualToFullRepaint();

    await grid.run(`hot.deselectCell(); ${dataChange}`);
    expect(await count('.ht_master tbody td.area, .ht_master tbody td.current, .ht_master tbody td[aria-selected]')).toBe(0);
    expect(await count('.ht_master th.ht__highlight')).toBe(0);
    await grid.expectEqualToFullRepaint();
  });

  test('keeps frozen overlays and merged cells in step with a full repaint', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'frozen-merge');
    const count = (selector: string) => grid.read<number>(`document.querySelectorAll('${selector}').length`);

    await grid.goto();

    await grid.run('hot.selectCell(0, 0); hot.setDataAtCell(10, 5, "a");');
    expect(await count('.ht_clone_top_inline_start_corner td.current')).toBe(1);

    await grid.run('hot.selectCell(5, 5); hot.setDataAtCell(10, 5, "b");');
    expect(await count('.ht_clone_top_inline_start_corner td.current')).toBe(0);
    expect(await count('.ht_clone_inline_start td.current')).toBe(0);
    expect(await count('.ht_clone_top td.current')).toBe(0);
    await grid.expectEqualToFullRepaint();

    await grid.run('hot.getPlugin("mergeCells").merge(3, 3, 5, 4);');
    await expect(grid.cell(3, 3)).toHaveAttribute('rowspan', '3');
    await grid.run('hot.selectCell(3, 3); hot.setDataAtCell(10, 5, "c");');
    await grid.expectEqualToFullRepaint();
    await grid.run('hot.selectCells([[2, 2, 6, 6]]); hot.setDataAtCell(10, 5, "d");');
    await grid.expectEqualToFullRepaint();
    await grid.run('hot.deselectCell(); hot.getPlugin("mergeCells").unmerge(3, 3, 5, 4);');
    await expect(grid.cell(3, 3)).not.toHaveAttribute('rowspan');
    await grid.expectEqualToFullRepaint();

    await grid.run('hot.scrollViewportTo({ row: 50, col: 6 }); hot.render();');
    await grid.expectEqualToFullRepaint();
  });

  test('repaints formula dependents and a HYPERLINK whose URL lives in another cell', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'formulas');

    await grid.goto();
    await expect(grid.cell(0, 0)).toHaveText('10');

    await grid.run('hot.setDataAtCell(0, 1, 7);');
    await expect(grid.cell(0, 0)).toHaveText('14');
    await expect(grid.cell(2, 0)).toHaveText('9');
    await grid.expectEqualToFullRepaint();

    await grid.run('hot.setDataAtCell(0, 3, "http://b/");');
    await expect(grid.cell(0, 2).locator('a')).toHaveAttribute('href', 'http://b/');
    await grid.expectEqualToFullRepaint();
  });

  test('shows and clears Search results', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'search');

    await grid.goto();
    await grid.run('hot.getPlugin("search").query("r3c3"); hot.render();');
    await expect(grid.cell(3, 3)).toHaveClass(/htSearchResult/);
    await grid.expectEqualToFullRepaint();

    await grid.run('hot.getPlugin("search").query("nothing"); hot.render();');
    await expect(grid.cell(3, 3)).not.toHaveClass(/htSearchResult/);
    await grid.expectEqualToFullRepaint();
  });
});

test.describe('renderMode: always (default)', () => {
  test('paints every rendered cell on every render', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'always');

    await grid.goto();
    await grid.resetPaints();
    await grid.run('hot.render();');

    const rendered = await grid.read<number>('hot.countRenderedRows() * hot.countRenderedCols()');

    expect((await grid.paintedCells()).length).toBe(rendered);
  });

  test('leaves no selection class behind when the selection moves', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'always');
    const count = (selector: string) => grid.read<number>(`document.querySelectorAll('${selector}').length`);

    await grid.goto();
    await grid.run('hot.selectAll(); hot.selectCell(4, 4);');

    expect(await count('.ht_master tbody td.area')).toBe(0);
    expect(await count('.ht_master tbody td.current')).toBe(1);
    expect(await count('.ht_master tbody td[aria-selected]')).toBe(1);

    await grid.run('hot.deselectCell();');
    expect(await count('.ht_master tbody td.current, .ht_master tbody td[aria-selected]')).toBe(0);
  });
});
