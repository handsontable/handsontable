import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NestedRowsTreegridPage } from '../fixtures/pages/NestedRowsTreegridPage';

/**
 * A keyboard user must be able to operate the tree without reaching a row header, which takes the
 * focus only with `navigableHeaders` on: Shift+Alt+arrows expand, collapse and walk up the tree from
 * any cell of a row. A screen reader does not read the level of a row from one of its cells, so the
 * grid adds it to the description of the cell the highlight reaches in another row. A live message
 * can replace the announcement of the cell on VoiceOver, so only a row header, which has no
 * description, still gets one.
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

test.describe('NestedRows level description', { tag: CROSS_BROWSER_TAG }, () => {
  test('a cell of another row is described by the level, the position and a parent state of its row',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.recordAnnouncements();
      await nestedRows.cell(0, 0).click();
      await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 2, 1 of 3');
      await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('');

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.cellDescription(2, 0)).toBe('Level 2, 2 of 3, expanded');

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.cellDescription(3, 0)).toBe('Level 3, 1 of 2');

      // A live message can replace the announcement of the cell, so the level never goes through it.
      expect(await nestedRows.announcements()).toEqual([]);
    });

  test('the description is on the cell when the browser focus lands on it', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(0, 0).click();
    await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');
    await nestedRows.recordFocusDescriptions();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => nestedRows.focusDescriptions()).toEqual([
      'cell-1-0: Level 2, 1 of 3',
      'cell-2-0: Level 2, 2 of 3, expanded',
      'cell-2-1: ',
    ]);
  });

  test('moving the selection to another row forces no render', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(0, 0).click();
    await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');
    await nestedRows.recordForcedRenders();

    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 2, 1 of 3');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 1]);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.cellDescription(2, 1)).toBe('Level 2, 2 of 3, expanded');

    expect(await nestedRows.forcedRenders()).toBe(0);
  });

  test('a cell in a frozen corner loses the description on every copy it is drawn in',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await page.evaluate(() => window.hot.updateSettings({ fixedRowsTop: 1, fixedColumnsStart: 1 }));
      await page.evaluate(() => {
        window.hot.selectCell(1, 0);
        window.hot.listen();
      });
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 0]);
      await page.keyboard.press('ArrowUp');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 0]);
      // A full render paints the description onto every copy of the cell, as a data change or a scroll does.
      await page.evaluate(() => window.hot.render());
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 0]);

      await expect.poll(() => nestedRows.levelDescribedCells()).toEqual(['cell-2-0']);
    });

  test('a toggle key that changes nothing leaves the description as it was', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(0, 0).click();
    await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');

    // Root A is expanded already, so the chord has nothing to expand.
    await page.keyboard.press('Shift+Alt+ArrowRight');

    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);
    expect(await nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');
  });

  test('a collapsed parent says so', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.callPlugin('collapseParent', 2);
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
    await nestedRows.cell(1, 0).click();
    await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 2, 1 of 3');

    await page.keyboard.press('ArrowDown');

    await expect.poll(() => nestedRows.cellDescription(2, 0)).toBe('Level 2, 2 of 3, collapsed');
  });

  test('a move between the cells of one row describes none of them', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(1, 0).click();
    await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 2, 1 of 3');

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 1]);
    await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('');
    expect(await nestedRows.cellDescription(1, 1)).toBe('');

    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 0]);
    expect(await nestedRows.cellDescription(1, 0)).toBe('');

    await page.keyboard.press('ArrowDown');

    await expect.poll(() => nestedRows.cellDescription(2, 0)).toBe('Level 2, 2 of 3, expanded');
  });

  test('stepping from a row header into a cell of the same row describes the cell',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'on' });
      await nestedRows.focusRowHeader(0);
      await nestedRows.recordAnnouncements();

      await page.keyboard.press('ArrowRight');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 0]);
      await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');

      await page.keyboard.press('ArrowLeft');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, -1]);
      await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('');
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, -1]);

      // A row header has no description, so it is the one place the live message stays.
      await expect.poll(() => nestedRows.announcements()).toEqual(['Level 2, 1 of 3']);
    });

  test('a key that toggles a row announces the toggle alone', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(2, 0).click();
    await expect.poll(() => nestedRows.cellDescription(2, 0)).toBe('Level 2, 2 of 3, expanded');
    await nestedRows.recordAnnouncements();

    await page.keyboard.press('Shift+Alt+ArrowLeft');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
    await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 3');

    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.cellDescription(3, 0)).toBe('Level 2, 3 of 3');

    expect(await nestedRows.announcements()).toEqual(['Collapsed row 3']);
  });

  test('a collapse that moves the selection onto the collapsed parent announces the collapse alone',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.cell(3, 0).click();
      await expect.poll(() => nestedRows.cellDescription(3, 0)).toBe('Level 3, 1 of 2');
      await nestedRows.recordAnnouncements();

      await nestedRows.collapseButton(0).click();
      await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 0]);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 1');
      expect(await nestedRows.cellDescription(0, 0)).toBe('');

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 1, 2 of 2, expanded');

      expect(await nestedRows.announcements()).toEqual(['Collapsed row 1']);
    });

  test('a collapse through the API that moves the selection onto the parent describes nothing',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.cell(3, 0).click();
      await expect.poll(() => nestedRows.cellDescription(3, 0)).toBe('Level 3, 1 of 2');
      await nestedRows.recordAnnouncements();

      await nestedRows.callPlugin('collapseParent', 2);
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 0]);
      expect(await nestedRows.cellDescription(2, 0)).toBe('');

      await nestedRows.callPlugin('collapseAll');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'Root B']);
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, 0]);
      expect(await nestedRows.cellDescription(0, 0)).toBe('');

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 1, 2 of 2, collapsed');

      expect(await nestedRows.announcements()).toEqual([]);
    });

  test('the walk to a parent describes the parent row', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await nestedRows.cell(4, 1).click();
    await expect.poll(() => nestedRows.cellDescription(4, 1)).toBe('Level 3, 2 of 2');

    await page.keyboard.press('Shift+Alt+ArrowLeft');

    await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 1]);
    await expect.poll(() => nestedRows.cellDescription(2, 1)).toBe('Level 2, 2 of 3, expanded');
    expect(await nestedRows.cellDescription(4, 1)).toBe('');
  });

  test('a selection made while the grid does not listen to the keyboard describes nothing',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.recordAnnouncements();
      await nestedRows.selectCellWithoutListening(1, 0);
      await nestedRows.selectCellWithoutListening(3, 0);

      expect(await nestedRows.cellDescription(1, 0)).toBe('');
      expect(await nestedRows.cellDescription(3, 0)).toBe('');

      await nestedRows.cell(6, 0).click();

      await expect.poll(() => nestedRows.cellDescription(6, 0)).toBe('Level 1, 2 of 2, expanded');
      expect(await nestedRows.announcements()).toEqual([]);
    });

  test('a grid built with ariaTags off describes no level', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ aria: 'off', navigableHeaders: 'off' });
    await nestedRows.recordAnnouncements();
    await nestedRows.cell(0, 0).click();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 0]);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([2, 0]);

    expect(await nestedRows.cellDescription(1, 0)).toBe('');
    expect(await nestedRows.cellDescription(2, 0)).toBe('');
    expect(await nestedRows.announcements()).toEqual([]);
  });

  test('the description follows the highlight under renderMode onChange', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await page.evaluate(() => window.hot.updateSettings({ renderMode: 'onChange' }));
    await nestedRows.cell(0, 0).click();
    await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('Level 1, 1 of 2, expanded');

    await page.keyboard.press('ArrowDown');

    await expect.poll(() => nestedRows.cellDescription(1, 0)).toBe('Level 2, 1 of 3');
    await expect.poll(() => nestedRows.cellDescription(0, 0)).toBe('');
  });
});

test.describe('NestedRows level description in the accessibility tree', () => {
  test('Chromium gives the level as the description of the cell and keeps its name',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });
      await nestedRows.cell(0, 0).click();
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 0]);

      await expect.poll(async() => (await nestedRows.chromiumAccessibility(1, 0)).description)
        .toContain('Level 2, 1 of 3');
      expect((await nestedRows.chromiumAccessibility(1, 0)).name).toBe('A-1');
    });
});
