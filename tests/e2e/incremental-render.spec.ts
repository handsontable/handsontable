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
    // Two rows across the rendered band. How many columns that is depends on the theme's column
    // widths, so it is read from the grid rather than hardcoded.
    expect(await count('.ht_master tbody td.area'))
      .toBe(2 * await grid.read<number>('hot.countRenderedCols()'));
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

    // A same-size updateData() replaces the data without a structural change. The hyperlink
    // registry is emptied on it, so every cell must repaint for the anchors to register again.
    await grid.run(`hot.updateData([
      ['=B1*2', 7, '=HYPERLINK(D1, "label")', 'http://b/'], [1, 2, 3, 4], ['=SUM(B1:B2)', 0, 0, 0],
    ]);`);
    await grid.run('hot.setDataAtCell(0, 3, "http://c/");');
    await expect(grid.cell(0, 2).locator('a')).toHaveAttribute('href', 'http://c/');
    await grid.expectEqualToFullRepaint();

    // A cell that becomes a HYPERLINK with the label it already showed: its formatted value does not
    // change, so the engine update is the only signal that it needs an anchor now.
    await grid.run('hot.setDataAtCell(1, 1, "label");');
    await expect(grid.cell(1, 1)).toHaveText('label');
    await grid.run('hot.setSourceDataAtCell(1, 1, \'=HYPERLINK(D1, "label")\'); hot.render();');
    await expect(grid.cell(1, 1).locator('a')).toHaveAttribute('href', 'http://c/');
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

    // Disabling the plugin directly strips the class through a one-shot hook on the next render,
    // so that render must reach the marked cells.
    await grid.run('hot.getPlugin("search").query("r3c3"); hot.render();');
    await expect(grid.cell(3, 3)).toHaveClass(/htSearchResult/);
    await grid.run('hot.getPlugin("search").disablePlugin(); hot.render();');
    await expect(grid.cell(3, 3)).not.toHaveClass(/htSearchResult/);
    await grid.expectEqualToFullRepaint();

    // A match painted while highlighted, then scrolled out of the rendered rows, is not painted by
    // the disabling render. It must lose the class in its stored meta all the same, or scrolling it
    // back into view shows a highlight for a disabled plugin.
    await grid.run('hot.getPlugin("search").enablePlugin(); hot.getPlugin("search").query("r18c1"); hot.scrollViewportTo({ row: 19 });');
    await expect(grid.cell(18, 1)).toHaveClass(/htSearchResult/);
    await grid.run('hot.scrollViewportTo({ row: 0 });');
    await expect(grid.cell(0, 0)).toBeVisible();
    await grid.run('hot.getPlugin("search").disablePlugin(); hot.render(); hot.scrollViewportTo({ row: 19 });');
    await expect(grid.cell(18, 1)).toBeVisible();
    await expect(grid.cell(18, 1)).not.toHaveClass(/htSearchResult/);
  });
});

test.describe('renderMode: onChange, changes the render must see', () => {
  test('repaints the cells whose `cells` function result changed', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'cells-fn');
    const count = (selector: string) => grid.read<number>(`document.querySelectorAll('${selector}').length`);

    await grid.goto();
    expect(await count('.ht_master tbody td.htDimmed')).toBe(0);

    const renderedCells = await grid.read<number>('hot.countRenderedRows() * hot.countRenderedCols()');

    await grid.run('window.htLocked = true; hot.render();');
    expect(await count('.ht_master tbody td.htDimmed')).toBe(renderedCells);
    expect((await grid.paintedCells()).length).toBe(renderedCells);
    await grid.expectEqualToFullRepaint();

    // The same result again paints nothing: the merged values are compared, not the object.
    await grid.resetPaints();
    await grid.run('hot.render();');
    expect(await grid.paintedCells()).toEqual([]);

    await grid.run('window.htLocked = false; hot.render();');
    expect(await count('.ht_master tbody td.htDimmed')).toBe(0);
    await grid.expectEqualToFullRepaint();
  });

  test('keeps the selection on live cells after the rendered band shrank and grew back', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'resize');
    const count = (selector: string) => grid.read<number>(`document.querySelectorAll('${selector}').length`);

    const shrink = `
      const resize = hot.getPlugin('manualRowResize');
      for (let row = 0; row < 6; row++) { resize.setManualSize(row, 80); }
      hot.render();
    `;
    // Restores the exact default height, so the band comes back with the same rows as before.
    const grow = `
      const resize = hot.getPlugin('manualRowResize');
      for (let row = 0; row < 6; row++) { resize.setManualSize(row, hot.stylesHandler.getDefaultRowHeight()); }
      hot.render();
    `;

    await grid.goto();

    // Select a cell that is fully visible without scrolling, then empty the selection
    // in place. The focus layer keeps its cached cell scan for that band.
    await grid.run('hot.selectCell(5, 2); hot.deselectCell();');

    const renderedRows = await grid.read<number>('hot.countRenderedRows()');

    // Shrink the band through manual row sizes (no index-mapper change, so no render epoch change),
    // then grow it back: the engine creates new cell elements for the rows that come back.
    await grid.run(shrink);
    expect(await grid.read<number>('hot.countRenderedRows()')).toBeLessThan(renderedRows);
    await grid.run(grow);
    expect(await grid.read<number>('hot.countRenderedRows()')).toBe(renderedRows);

    await grid.run('hot.selectCell(5, 2);');
    await expect(grid.cell(5, 2)).toHaveClass(/current/);
    expect(await count('.ht_master tbody td.current')).toBe(1);
    await grid.expectEqualToFullRepaint();
  });

  test('keeps the cell right of a merged block sized when only that cell repaints', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'merge-height');
    const neighborHeight = () => grid.read<string>('hot.getCell(2, 1).style.height');

    await grid.goto();

    const height = await neighborHeight();

    expect(height).toMatch(/^\d+px$/);

    // The neighbor changes, the merged origin does not: only the neighbor is painted.
    await grid.run('hot.setDataAtCell(2, 1, "x");');
    expect(await grid.paintedCells()).toEqual(['2,1']);
    expect(await neighborHeight()).toBe(height);
    await grid.expectEqualToFullRepaint();

    await grid.run('hot.getPlugin("mergeCells").unmerge(2, 0, 3, 0);');
    expect(await neighborHeight()).toBe('');
    await grid.expectEqualToFullRepaint();
  });

  test('keeps a class named by beforeRemoveCellClassNames applied on a draw that skips the cell', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'text');
    const count = (selector: string) => grid.read<number>(`document.querySelectorAll('${selector}').length`);

    await grid.goto();
    await grid.run(`
      hot.addHook('beforeRemoveCellClassNames', () => ['area']);
      hot.selectCells([[1, 1, 2, 2]]);
    `);
    expect(await count('.ht_master tbody td.area')).toBe(4);

    // A full draw in which the selected cells are skipped: the hook strips the class, the pass
    // has to put it back.
    await grid.run('hot.setDataAtCell(19, 9, "z");');
    expect(await count('.ht_master tbody td.area')).toBe(4);
    await grid.expectEqualToFullRepaint();
  });

  test('drops the comment marker when the Comments plugin is disabled directly', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'comments');

    await grid.goto();
    await expect(grid.cell(1, 1)).toHaveClass(/htCommentCell/);

    await grid.run('hot.getPlugin("comments").disablePlugin(); hot.render();');
    await expect(grid.cell(1, 1)).not.toHaveClass(/htCommentCell/);
    await grid.expectEqualToFullRepaint();
  });
});

test.describe('renderMode: onChange, scrolling', () => {
  const rowOf = (key: string) => Number(key.split(',')[0]);

  test('paints only the rows that enter the band, and keeps the elements of the rows that stay', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'scroll');

    await grid.goto();

    // Down: the rows below the old band enter, every other rendered row is left as it is. The
    // last row of the old band stays in the new one; it keeps its element and its content.
    let [, lastBefore] = await grid.renderedBand();

    await grid.run(`window.htProbe = hot.getCell(${lastBefore}, 1);`);
    await grid.scrollToRow(25);

    let painted = await grid.paintedCells();

    expect(painted.length).toBeGreaterThan(0);
    expect(painted.every(key => rowOf(key) > lastBefore)).toBe(true);
    expect(await grid.read<boolean>(`hot.getCell(${lastBefore}, 1) === window.htProbe`)).toBe(true);
    await expect(grid.cell(lastBefore, 1)).toHaveText(`r${lastBefore}c1`);
    await grid.expectEqualToFullRepaint();

    // Further down, from a band that no longer starts at the first row.
    await grid.resetPaints();
    [, lastBefore] = await grid.renderedBand();
    await grid.run(`window.htProbe = hot.getCell(${lastBefore}, 1);`);
    await grid.scrollToRow(40);

    painted = await grid.paintedCells();

    expect(painted.length).toBeGreaterThan(0);
    expect(painted.every(key => rowOf(key) > lastBefore)).toBe(true);
    expect(await grid.read<boolean>(`hot.getCell(${lastBefore}, 1) === window.htProbe`)).toBe(true);

    // Up: the mirror image, the rows above the old band enter.
    await grid.resetPaints();

    const [firstBefore] = await grid.renderedBand();

    await grid.run(`window.htProbe = hot.getCell(${firstBefore}, 1);`);
    await grid.scrollToRow(15);

    painted = await grid.paintedCells();

    expect(painted.length).toBeGreaterThan(0);
    expect(painted.every(key => rowOf(key) < firstBefore)).toBe(true);
    expect(await grid.read<boolean>(`hot.getCell(${firstBefore}, 1) === window.htProbe`)).toBe(true);
    await expect(grid.cell(firstBefore, 1)).toHaveText(`r${firstBefore}c1`);
    await grid.expectEqualToFullRepaint();
  });

  test('keeps the frozen overlays in step with a full repaint through scrolling', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'frozen');

    await grid.goto();

    const [, lastBefore] = await grid.renderedBand();

    // One element from the master and one from the frozen-columns clone, both on a row that stays.
    await grid.run(`window.htProbe = [hot.getCell(${lastBefore}, 3), hot.getCell(${lastBefore}, 0, true)];`);
    await grid.scrollToRow(25);

    const painted = await grid.paintedCells();

    expect(painted.length).toBeGreaterThan(0);
    expect(painted.every(key => rowOf(key) > lastBefore)).toBe(true);
    expect(await grid.read<boolean>(`hot.getCell(${lastBefore}, 3) === window.htProbe[0]`)).toBe(true);
    expect(await grid.read<boolean>(`hot.getCell(${lastBefore}, 0, true) === window.htProbe[1]`)).toBe(true);
    await grid.expectEqualToFullRepaint();

    await grid.resetPaints();
    await grid.scrollToRow(12);
    await grid.expectEqualToFullRepaint();
  });

  test('keeps the focus in the grid when the selected row leaves the band', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'scroll');

    await grid.goto();
    await grid.run('hot.selectCell(5, 1);');
    await grid.scrollToRow(40);

    // Row 5 is no longer rendered. The element that held it now shows another row and keeps the
    // focus, as a stationary element would, so the keyboard still reaches the grid.
    expect(await grid.read<boolean>('hot.getCell(5, 1) === null')).toBe(true);
    expect(await grid.read<boolean>(
      'document.activeElement.tagName === "TD" && hot.rootElement.contains(document.activeElement)'
    )).toBe(true);

    await page.keyboard.press('ArrowDown');

    expect(await grid.read<number[]>('hot.getSelectedLast()')).toEqual([6, 1, 6, 1]);
  });

  test('keeps an open editor on its cell across a scroll that keeps the row rendered', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'scroll');

    await grid.goto();
    await grid.run('hot.selectCell(5, 1);');
    await page.keyboard.press('Enter');
    await page.keyboard.type('!');
    await grid.scrollToRow(12);
    await page.keyboard.press('Enter');

    expect(await grid.read<string>('hot.getDataAtCell(5, 1)')).toBe('r5c1!');
    await expect(grid.cell(5, 1)).toHaveText('r5c1!');
  });
});

test.describe('renderMode: always (default)', () => {
  test('paints every rendered cell on a scroll', async({ page, theme, bundle }) => {
    const grid = new IncrementalRenderPage(page, theme, bundle, 'always');

    await grid.goto();
    await grid.scrollToRow(25);

    const rendered = await grid.read<number>('hot.countRenderedRows() * hot.countRenderedCols()');

    expect((await grid.paintedCells()).length).toBe(rendered);
  });

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
