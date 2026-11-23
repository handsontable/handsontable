import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NestedRowsTreegridPage } from '../fixtures/pages/NestedRowsTreegridPage';

/**
 * A keyboard user must be able to operate the tree without reaching a row header, which takes the
 * focus only with `navigableHeaders` on: Shift+Alt+arrows expand, collapse and walk up the tree from
 * any cell of a row. A screen reader does not read the level of a row from one of its cells, so the
 * name of every cell of the row ends with it (the cell is labelled by itself and a hidden element), the
 * row is named by the plain cell texts, and no live message repeats it.
 *
 * Physical layout of the fixture tree:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 A-3 / 6 Root B / 7 B-1 / 8 B-2
 */

const FULL_TREE = ['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B', 'B-1', 'B-2'];
const A2_COLLAPSED = ['Root A', 'A-1', 'A-2', 'A-3', 'Root B', 'B-1', 'B-2'];
const ROOT_A_COLLAPSED = ['Root A', 'Root B', 'B-1', 'B-2'];

test.describe('NestedRows tree keys from a cell', { tag: CROSS_BROWSER_TAG }, () => {
  test('Shift+Alt+arrows collapse and expand the row of the selected cell with navigableHeaders off',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.cell(0, 1).click();
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 1]);

      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);
      await expect.poll(async() => (await nestedRows.rowAttributes())[0].expanded).toBe('false');
      await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 1');
      expect(await nestedRows.selectedCell()).toEqual([0, 1]);

      await page.keyboard.press('Shift+Alt+ArrowRight');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);
      await expect.poll(async() => (await nestedRows.rowAttributes())[0].expanded).toBe('true');
      await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 1, expanded rows shown: 5');
      expect(await nestedRows.selectedCell()).toEqual([0, 1]);
      await expect(nestedRows.cell(0, 1)).toBeFocused();
    });

  test('Shift+Alt+arrows collapse and expand from a focused row header with navigableHeaders on',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'on' });
      await nestedRows.focusRowHeader(2);

      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 3');
      expect(await nestedRows.selectedCell()).toEqual([2, -1]);

      await page.keyboard.press('Shift+Alt+ArrowRight');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 3, expanded rows shown: 2');
      expect(await nestedRows.selectedCell()).toEqual([2, -1]);
    });

  test('the inline-start chord walks from a child to its parent in the same column, then collapses it',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.cell(3, 1).click();
      await expect.poll(() => nestedRows.selectedCell()).toEqual([3, 1]);

      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 1]);
      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);

      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      expect(await nestedRows.selectedCell()).toEqual([2, 1]);

      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 1]);
      expect(await nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
      expect(await nestedRows.selectedCell()).toEqual([0, 1]);
    });

  test('the walk to a parent from a row header lands on the parent row header',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'on' });
      await nestedRows.focusRowHeader(4);

      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await expect.poll(() => nestedRows.selectedCell()).toEqual([2, -1]);
      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);
    });

  test('a chord with nothing to do changes neither the tree nor the selection',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.callPlugin('collapseParent', 6);
      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE.slice(0, 7));

      await nestedRows.cell(1, 0).click();
      await page.keyboard.press('Shift+Alt+ArrowRight');
      await nestedRows.cell(0, 0).click();
      await page.keyboard.press('Shift+Alt+ArrowRight');
      await nestedRows.cell(6, 0).click();
      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await nestedRows.cell(2, 0).click();
      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B']);
      expect(await nestedRows.selectedCell()).toEqual([2, 0]);
    });

  test('the chords are mirrored in a right-to-left grid', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ dir: 'rtl', navigableHeaders: 'off' });
    await nestedRows.cell(3, 1).click();
    await expect.poll(() => nestedRows.selectedCell()).toEqual([3, 1]);

    await page.keyboard.press('Shift+Alt+ArrowRight');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 1]);

    await page.keyboard.press('Shift+Alt+ArrowRight');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
    await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 3');

    await page.keyboard.press('Shift+Alt+ArrowLeft');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);
    await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 3, expanded rows shown: 2');
    expect(await nestedRows.selectedCell()).toEqual([2, 1]);
  });

  test('a selection of several rows is left alone', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(0, 0).click();
    await nestedRows.selectRange(0, 0, 2, 0);

    await page.keyboard.press('Shift+Alt+ArrowLeft');

    await nestedRows.selectRange(2, 0, 2, 1);
    await page.keyboard.press('Shift+Alt+ArrowLeft');

    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
  });

  test('several selected ranges are left alone, and the key is left to the browser',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.recordKeyClaims();
      await nestedRows.cell(0, 0).click();
      await nestedRows.selectRanges([[2, 0, 2, 0], [6, 1, 6, 1]]);

      await page.keyboard.press('Shift+Alt+ArrowLeft');

      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);
      expect(await nestedRows.selectedRanges()).toEqual([[2, 0, 2, 0], [6, 1, 6, 1]]);

      await nestedRows.selectRange(6, 1, 6, 1);
      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE.slice(0, 7));
      expect(await nestedRows.keyClaims()).toEqual([false, true]);
    });

  test('the chords do nothing while an overlay covers the grid body', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(2, 0).click();
    await nestedRows.setGridBodyCovered(true);

    await page.keyboard.press('Shift+Alt+ArrowLeft');

    await nestedRows.setGridBodyCovered(false);
    await nestedRows.cell(6, 0).click();
    await page.keyboard.press('Shift+Alt+ArrowLeft');

    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE.slice(0, 7));
  });

  test('the Ctrl/Cmd chords and Enter on a row header keep working beside the new chords',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'on' });
      await nestedRows.focusRowHeader(2);

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

      await page.keyboard.press('Shift+Alt+ArrowRight');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);

      await page.keyboard.press('Enter');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      expect(await nestedRows.selectedCell()).toEqual([2, -1]);
    });

  test('a grid built with ariaTags off answers the chords and announces nothing',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ aria: 'off', navigableHeaders: 'off' });
      await nestedRows.recordAnnouncements();
      await nestedRows.cell(1, 0).click();
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 0]);

      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      await page.keyboard.press('Shift+Alt+ArrowRight');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);

      expect(await nestedRows.announcements()).toEqual([]);
    });
});

test.describe('NestedRows row level in the cell name', { tag: CROSS_BROWSER_TAG }, () => {
  test('every cell of a row is named by its value and then its own row level', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });

    expect(await nestedRows.cellName(0, 0)).toBe('Root A , Level 1, 1 of 2, expanded');
    expect(await nestedRows.cellName(0, 1)).toBe('Root A , Level 1, 1 of 2, expanded');
    expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
    expect(await nestedRows.cellName(1, 1)).toBe('A-1 , Level 2, 1 of 3');
    expect(await nestedRows.cellName(2, 1)).toBe('A-2 , Level 2, 2 of 3, expanded');
    expect(await nestedRows.cellName(4, 0)).toBe('A-2-b , Level 3, 2 of 2');
    expect(await nestedRows.cellName(8, 1)).toBe('B-2 , Level 2, 2 of 2');
    expect(await nestedRows.cellDescription(1, 0)).toBe('Name');
    expect(await nestedRows.cellDescription(1, 1)).toBe('Copy');
  });

  test('a row is named by the plain texts of its cells, without the level', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });

    expect(await nestedRows.rowName(0)).toBe('Root A Root A');
    expect(await nestedRows.rowName(3)).toBe('A-2-a A-2-a');
    expect(await nestedRows.rowName(8)).toBe('B-2 B-2');
  });

  test('the labels add no text to the cells', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.gotoWith({ nestedRows: 'off', navigableHeaders: 'off' });

    const plainTexts = await nestedRows.cellTexts();

    await nestedRows.updateSettings({ nestedRows: true });
    await expect.poll(() => nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');

    expect(await nestedRows.cellTexts()).toEqual([
      'Root A', 'Root A', 'A-1', 'A-1', 'A-2', 'A-2', 'A-2-a', 'A-2-a', 'A-2-b', 'A-2-b',
      'A-3', 'A-3', 'Root B', 'Root B', 'B-1', 'B-1', 'B-2', 'B-2',
    ]);
    expect(plainTexts).toEqual(['Root A', 'Root A', 'Root B', 'Root B']);
  });

  test('a collapse and an expand update the name of the parent cells', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.callPlugin('collapseParent', 2);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

    expect(await nestedRows.cellName(2, 0)).toBe('A-2 , Level 2, 2 of 3, collapsed');
    expect(await nestedRows.cellName(2, 1)).toBe('A-2 , Level 2, 2 of 3, collapsed');
    expect(await nestedRows.cellName(3, 0)).toBe('A-3 , Level 2, 3 of 3');
    expect(await nestedRows.rowName(2)).toBe('A-2 A-2');

    await nestedRows.callPlugin('expandParent', 2);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);

    expect(await nestedRows.cellName(2, 0)).toBe('A-2 , Level 2, 2 of 3, expanded');
  });

  test('a filter recounts the positions in the name', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.filterByNames(['A-1', 'A-3']);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-3']);

    expect(await nestedRows.cellNamesByText()).toEqual({
      'Root A': 'Root A , Level 1, 1 of 1, expanded',
      'A-1': 'A-1 , Level 2, 1 of 2',
      'A-3': 'A-3 , Level 2, 2 of 2',
    });
  });

  test('a row header is described by its plain row level with navigableHeaders on', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'on' });
    await nestedRows.focusRowHeader(2);

    expect(await nestedRows.rowHeaderDescription(2)).toBe('Level 2, 2 of 3, expanded');
    expect(await nestedRows.rowHeaderDescription(3)).toBe('Level 3, 1 of 2');

    await page.keyboard.press('Enter');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

    expect(await nestedRows.rowHeaderDescription(2)).toBe('Level 2, 2 of 3, collapsed');
  });

  test('a cell the focus passed through fast keeps its own row level, and the focused one has its own',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.cell(0, 0).click();
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 0]);

      await nestedRows.pressArrowDownInOneTask(3);
      await expect.poll(() => nestedRows.selectedCell()).toEqual([3, 0]);
      await expect(nestedRows.cell(3, 0)).toBeFocused();

      expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
      expect(await nestedRows.cellName(2, 0)).toBe('A-2 , Level 2, 2 of 3, expanded');
      expect(await nestedRows.cellName(3, 0)).toBe('A-2-a , Level 3, 1 of 2');
    });

  test('arrow navigation writes no level message to the live region', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'on' });
    await nestedRows.recordAnnouncements();
    await nestedRows.cell(0, 0).click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([2, -1]);

    await page.keyboard.press('Shift+Alt+ArrowLeft');
    await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 3');

    expect(await nestedRows.announcements()).toEqual(['Collapsed row 3']);
  });

  test('ids stay unique and resolve with a frozen column and a second grid on the page',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.gotoWith({ fixedColumnsStart: 1, secondGrid: 'on', navigableHeaders: 'off' });

      expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
      expect(await nestedRows.cellName(1, 1)).toBe('A-1 , Level 2, 1 of 3');
      expect(await nestedRows.rowName(1)).toBe('A-1 A-1');

      const health = await nestedRows.idHealth();

      expect(health.duplicateIds).toEqual([]);
      expect(health.danglingIds).toEqual([]);
      expect(health.levelElementIds).toBe(18);
    });

  test('a grid without nested rows gets no labels', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.gotoWith({ nestedRows: 'off', navigableHeaders: 'on' });

    expect(await nestedRows.levelTraces())
      .toEqual({ labelledCells: 0, labelledRows: 0, describedCells: 0, describedHeaders: 0 });
  });

  test('a grid built with ariaTags off gets no labels', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ aria: 'off', navigableHeaders: 'on' });

    expect(await nestedRows.cellDescribedBy(1, 0)).toBeNull();
    expect(await nestedRows.levelTraces())
      .toEqual({ labelledCells: 0, labelledRows: 0, describedCells: 0, describedHeaders: 0 });
  });

  test('disabling the plugin takes the labels off every cell and row', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.gotoWith({ fixedColumnsStart: 1, navigableHeaders: 'on' });

    const before = await nestedRows.levelTraces();

    expect(before.labelledCells).toBe(27);
    expect(before.labelledRows).toBe(18);
    expect(before.describedHeaders).toBeGreaterThan(0);

    await nestedRows.updateSettings({ nestedRows: false });

    expect(await nestedRows.levelTraces())
      .toEqual({ labelledCells: 0, labelledRows: 0, describedCells: 0, describedHeaders: 0 });
    expect(await nestedRows.cellDescribedBy(1, 0)).toBe(await nestedRows.columnHeaderId(0));
    expect(await nestedRows.cellName(1, 0)).toBe('Root B');
  });

  test('a row header that takes no focus is not described', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });

    expect((await nestedRows.levelTraces()).labelledCells).toBeGreaterThan(0);
    expect((await nestedRows.levelTraces()).describedHeaders).toBe(0);
  });

  test('a read-only nested cell keeps the level in its name and "read only" in its description',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.makeRowReadOnly(1);

      await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Name read only');
      expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
      expect(await nestedRows.cellDescription(2, 0)).toBe('Name');
    });

  test('a cell its renderer names itself is left alone', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.gotoWith({ namedCopy: 'on', navigableHeaders: 'off' });

    const copy = page.locator('[data-testid="grid"] .ht_master').getByTestId('cell-1-1');

    await expect(copy).toHaveAttribute('aria-label', 'Custom A-1');
    await expect(copy).not.toHaveAttribute('aria-labelledby');
    expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
    expect(await nestedRows.rowName(1)).toBe('A-1');
  });

  test('with renderMode onChange a collapse repaints the name of the collapsed parent',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.updateSettings({ renderMode: 'onChange' });
      expect(await nestedRows.cellName(2, 1)).toBe('A-2 , Level 2, 2 of 3, expanded');

      await nestedRows.cell(2, 1).click();
      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

      expect(await nestedRows.cellName(2, 0)).toBe('A-2 , Level 2, 2 of 3, collapsed');
      expect(await nestedRows.cellName(2, 1)).toBe('A-2 , Level 2, 2 of 3, collapsed');
      expect(await nestedRows.rowName(2)).toBe('A-2 A-2');
    });

  test('with renderMode onChange a detach repaints the level of rows whose values did not change',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.updateSettings({ renderMode: 'onChange' });
      expect(await nestedRows.cellName(7, 0)).toBe('B-1 , Level 2, 1 of 2');
      expect(await nestedRows.cellName(8, 0)).toBe('B-2 , Level 2, 2 of 2');

      await nestedRows.detachFromParent(8);
      await expect.poll(() => nestedRows.rowAttributes()).toHaveLength(9);
      await nestedRows.render();

      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);
      expect(await nestedRows.cellName(7, 0)).toBe('B-1 , Level 2, 1 of 1');
      expect(await nestedRows.cellName(8, 0)).toBe('B-2 , Level 1, 3 of 3');
    });

  test('with renderMode onChange enabling and disabling the plugin adds and removes the labels',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.gotoWith({ nestedRows: 'off', navigableHeaders: 'off' });
      await nestedRows.updateSettings({ renderMode: 'onChange' });
      await nestedRows.updateSettings({ nestedRows: true });

      await expect.poll(() => nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
      expect(await nestedRows.rowName(1)).toBe('A-1 A-1');

      await nestedRows.updateSettings({ nestedRows: false });

      expect(await nestedRows.levelTraces())
        .toEqual({ labelledCells: 0, labelledRows: 0, describedCells: 0, describedHeaders: 0 });
    });

  test('a rebuild through updateSettings keeps the names', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.updateSettings({ nestedRows: true });

    expect(await nestedRows.cellName(2, 0)).toBe('A-2 , Level 2, 2 of 3, expanded');
    expect(await nestedRows.rowName(2)).toBe('A-2 A-2');
    expect((await nestedRows.idHealth()).danglingIds).toEqual([]);
  });
});

test.describe('NestedRows row level in Chromium\'s accessibility tree', () => {
  test('a cell is named by its value and the level, and described by its column header',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });

      expect(await nestedRows.chromiumAccessibility({ row: 1, column: 0 }))
        .toEqual({ name: 'A-1 , Level 2, 1 of 3', description: 'Name', role: 'gridcell' });
      expect(await nestedRows.chromiumAccessibility({ row: 2, column: 1 }))
        .toEqual({ name: 'A-2 , Level 2, 2 of 3, expanded', description: 'Copy', role: 'gridcell' });
    });

  test('a row is named by its cell texts, without the level', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });

    expect((await nestedRows.chromiumAccessibility({ row: 1 })).name).toBe('A-1 A-1');
    expect((await nestedRows.chromiumAccessibility({ row: 0 })).name).toBe('Root A Root A');
  });

  test('a collapsed parent is named "collapsed", under both render modes', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.callPlugin('collapseParent', 2);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

    expect((await nestedRows.chromiumAccessibility({ row: 2, column: 0 })).name)
      .toBe('A-2 , Level 2, 2 of 3, collapsed');

    await nestedRows.callPlugin('expandParent', 2);
    await nestedRows.updateSettings({ renderMode: 'onChange' });
    await nestedRows.cell(2, 1).click();
    await page.keyboard.press('Shift+Alt+ArrowLeft');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

    expect((await nestedRows.chromiumAccessibility({ row: 2, column: 1 })).name)
      .toBe('A-2 , Level 2, 2 of 3, collapsed');
    expect((await nestedRows.chromiumAccessibility({ row: 2 })).name).toBe('A-2 A-2');
  });

  test('a filter recounts the level in the name', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.filterByNames(['A-1', 'A-3']);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-3']);

    expect((await nestedRows.chromiumAccessibility({ row: 2, column: 0 })).name).toBe('A-3 , Level 2, 2 of 2');
  });

  test('a read-only nested cell is named with the level and described as read only',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.makeRowReadOnly(1);
      await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Name read only');

      expect(await nestedRows.chromiumAccessibility({ row: 1, column: 0 }))
        .toEqual({ name: 'A-1 , Level 2, 1 of 3', description: 'Name read only', role: 'gridcell' });
    });

  test('the first child keeps "1 of N" after three fast ArrowDowns', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(0, 0).click();
    await nestedRows.pressArrowDownInOneTask(3);
    await expect.poll(() => nestedRows.selectedCell()).toEqual([3, 0]);

    expect((await nestedRows.chromiumAccessibility({ row: 1, column: 0 })).name).toBe('A-1 , Level 2, 1 of 3');
    expect((await nestedRows.chromiumAccessibility({ row: 3, column: 0 })).name).toBe('A-2-a , Level 3, 1 of 2');
  });
});
