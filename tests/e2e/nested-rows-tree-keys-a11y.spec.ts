import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NestedRowsTreegridPage } from '../fixtures/pages/NestedRowsTreegridPage';

/**
 * A keyboard user must be able to operate the tree without reaching a row header, which takes the
 * focus only with `navigableHeaders` on: Shift+Alt+arrows expand, collapse and walk up the tree from
 * any cell of a row. A screen reader does not read the level of a row from one of its cells, so every
 * cell of the row is described by a hidden element that tells it, and no live message repeats it.
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

test.describe('NestedRows row level description', { tag: CROSS_BROWSER_TAG }, () => {
  test('every cell of a row is described by its column header and its own row level',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });

      expect(await nestedRows.cellDescription(0, 0)).toBe('Name Level 1, 1 of 2, expanded');
      expect(await nestedRows.cellDescription(0, 1)).toBe('Copy Level 1, 1 of 2, expanded');
      expect(await nestedRows.cellDescription(1, 0)).toBe('Name Level 2, 1 of 3');
      expect(await nestedRows.cellDescription(1, 1)).toBe('Copy Level 2, 1 of 3');
      expect(await nestedRows.cellDescription(2, 1)).toBe('Copy Level 2, 2 of 3, expanded');
      expect(await nestedRows.cellDescription(4, 0)).toBe('Name Level 3, 2 of 2');
      expect(await nestedRows.cellDescription(8, 1)).toBe('Copy Level 2, 2 of 2');
    });

  test('a collapse and an expand update the parent description', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.callPlugin('collapseParent', 2);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

    expect(await nestedRows.cellDescription(2, 0)).toBe('Name Level 2, 2 of 3, collapsed');
    expect(await nestedRows.cellDescription(3, 0)).toBe('Name Level 2, 3 of 3');

    await nestedRows.callPlugin('expandParent', 2);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);

    expect(await nestedRows.cellDescription(2, 0)).toBe('Name Level 2, 2 of 3, expanded');
  });

  test('a filter recounts the positions in the description', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.filterByNames(['A-1', 'A-3']);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-3']);

    expect(await nestedRows.descriptionsByName()).toEqual({
      'Root A': 'Name Level 1, 1 of 1, expanded',
      'A-1': 'Name Level 2, 1 of 2',
      'A-3': 'Name Level 2, 2 of 2',
    });
  });

  test('a row header is described by its row level with navigableHeaders on', async({ page, theme, bundle }) => {
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

      expect(await nestedRows.cellDescription(1, 0)).toBe('Name Level 2, 1 of 3');
      expect(await nestedRows.cellDescription(2, 0)).toBe('Name Level 2, 2 of 3, expanded');
      expect(await nestedRows.cellDescription(3, 0)).toBe('Name Level 3, 1 of 2');
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

      expect(await nestedRows.cellDescription(1, 0)).toBe('Name Level 2, 1 of 3');
      expect(await nestedRows.cellDescription(1, 1)).toBe('Copy Level 2, 1 of 3');

      const health = await nestedRows.idHealth();

      expect(health.duplicateIds).toEqual([]);
      expect(health.danglingIds).toEqual([]);
      expect(health.rowDescriptionIds).toBe(18);
    });

  test('a grid built with ariaTags off gets no row description', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ aria: 'off', navigableHeaders: 'on' });

    expect(await nestedRows.cellDescribedBy(1, 0)).toBeNull();
    expect(await nestedRows.rowDescriptionTraces()).toEqual({ describedCells: 0, describedHeaders: 0 });
  });

  test('disabling the plugin leaves the column header id alone on every cell', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'on' });
    expect((await nestedRows.rowDescriptionTraces()).describedCells).toBeGreaterThan(0);
    expect((await nestedRows.rowDescriptionTraces()).describedHeaders).toBeGreaterThan(0);

    await nestedRows.updateSettings({ nestedRows: false });

    expect(await nestedRows.rowDescriptionTraces()).toEqual({ describedCells: 0, describedHeaders: 0 });
    expect(await nestedRows.cellDescribedBy(1, 0)).toBe(await nestedRows.columnHeaderId(0));
    expect(await nestedRows.cellDescription(1, 0)).toBe('Name');
  });

  test('a row header that takes no focus is not described', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });

    expect((await nestedRows.rowDescriptionTraces()).describedCells).toBeGreaterThan(0);
    expect((await nestedRows.rowDescriptionTraces()).describedHeaders).toBe(0);
  });

  test('the row level is read before the read-only part of a nested cell', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.makeRowReadOnly(1);

    await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Name Level 2, 1 of 3, read only');
    expect(await nestedRows.cellDescription(2, 0)).toBe('Name Level 2, 2 of 3, expanded');
  });

  test('with renderMode onChange a collapse repaints the description of the collapsed parent',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.updateSettings({ renderMode: 'onChange' });
      expect(await nestedRows.cellDescription(2, 1)).toBe('Copy Level 2, 2 of 3, expanded');

      await nestedRows.cell(2, 1).click();
      await page.keyboard.press('Shift+Alt+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);

      expect(await nestedRows.cellDescription(2, 0)).toBe('Name Level 2, 2 of 3, collapsed');
      expect(await nestedRows.cellDescription(2, 1)).toBe('Copy Level 2, 2 of 3, collapsed');
    });

  test('with renderMode onChange a detach repaints the level of rows whose values did not change',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.updateSettings({ renderMode: 'onChange' });
      expect(await nestedRows.cellDescription(7, 0)).toBe('Name Level 2, 1 of 2');
      expect(await nestedRows.cellDescription(8, 0)).toBe('Name Level 2, 2 of 2');

      await nestedRows.detachFromParent(8);
      await expect.poll(() => nestedRows.rowAttributes()).toHaveLength(9);
      await nestedRows.render();

      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);
      expect(await nestedRows.cellDescription(7, 0)).toBe('Name Level 2, 1 of 1');
      expect(await nestedRows.cellDescription(8, 0)).toBe('Name Level 1, 3 of 3');
    });

  test('a rebuild through updateSettings keeps the descriptions', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.updateSettings({ nestedRows: true });

    expect(await nestedRows.cellDescription(2, 0)).toBe('Name Level 2, 2 of 3, expanded');
    expect((await nestedRows.idHealth()).danglingIds).toEqual([]);
  });
});
