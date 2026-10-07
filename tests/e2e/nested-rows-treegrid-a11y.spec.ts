import { test, expect } from '../fixtures/test';
import { NestedRowsTreegridPage, type TreegridRowAttributes } from '../fixtures/pages/NestedRowsTreegridPage';

/**
 * NestedRows follows the WAI-ARIA treegrid pattern: every row carries `aria-level`, `aria-posinset`
 * and `aria-setsize`, a parent row's header carries `aria-expanded`, Ctrl/Cmd+arrows on a focused row
 * header expand, collapse and walk up the tree while the plain arrows keep moving the selection, and
 * a polite live region confirms each change made by a user gesture.
 *
 * Walkontable recycles the TR elements, so collapsing `Root A` hands the TR that held a leaf to a
 * parent and the other way round. Stale attributes show up in the assertions that follow a collapse.
 *
 * Physical layout of the fixture tree:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 A-3 / 6 Root B / 7 B-1 / 8 B-2
 */

const FULL_TREE = ['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B', 'B-1', 'B-2'];
const A2_COLLAPSED = ['Root A', 'A-1', 'A-2', 'A-3', 'Root B', 'B-1', 'B-2'];
const ROOT_A_COLLAPSED = ['Root A', 'Root B', 'B-1', 'B-2'];

/**
 * Builds the expected attributes of one row.
 *
 * @param level The 1-based depth.
 * @param posinset The 1-based position among the siblings.
 * @param setsize The number of siblings.
 * @param expanded The expanded state of a parent, `null` for a leaf.
 * @returns {TreegridRowAttributes}
 */
function row(level: number, posinset: number, setsize: number, expanded: boolean | null = null): TreegridRowAttributes {
  return {
    level: `${level}`,
    posinset: `${posinset}`,
    setsize: `${setsize}`,
    expanded: expanded === null ? null : `${expanded}`,
  };
}

test.describe('NestedRows treegrid accessibility', () => {
  test('every row carries its level, position and set size, and a parent header its expanded state',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();

      await expect.poll(() => nestedRows.rowAttributes()).toEqual([
        row(1, 1, 2, true),
        row(2, 1, 3),
        row(2, 2, 3, true),
        row(3, 1, 2),
        row(3, 2, 2),
        row(2, 3, 3),
        row(1, 2, 2, true),
        row(2, 1, 2),
        row(2, 2, 2),
      ]);
    });

  test('collapsing with the row header button updates the attributes and announces it politely',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.collapseButton(0).click();

      await expect.poll(() => nestedRows.rowAttributes()).toEqual([
        row(1, 1, 2, false),
        row(1, 2, 2, true),
        row(2, 1, 2),
        row(2, 2, 2),
      ]);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 1');

      await nestedRows.collapseButton(0).click();

      await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 1, expanded rows shown: 5');
      await expect.poll(() => nestedRows.rowAttributes()).toHaveLength(9);
    });

  test('the plain arrow keys on a row header only move the selection', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.callPlugin('collapseParent', 6);
    await nestedRows.focusRowHeader(2);

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([3, -1]);
    expect(await nestedRows.visibleNames()).toEqual(FULL_TREE.slice(0, 7));

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([6, -1]);

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([6, 0]);
    expect(await nestedRows.visibleNames()).toEqual(FULL_TREE.slice(0, 7));
  });

  test('Ctrl/Cmd+arrows on a row header expand, collapse and walk up the tree, and Enter toggles',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.focusRowHeader(2);

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      expect(await nestedRows.selectedCell()).toEqual([2, -1]);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 3');

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, -1]);

      await page.keyboard.press('ControlOrMeta+ArrowRight');
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, -1]);
      expect(await nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      await page.keyboard.press('ArrowUp');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, -1]);

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);

      await page.keyboard.press('ControlOrMeta+ArrowRight');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(A2_COLLAPSED);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 1, expanded rows shown: 3');
      expect(await nestedRows.selectedCell()).toEqual([0, -1]);

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, -1]);
      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, -1]);

      await page.keyboard.press('Enter');
      await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);
      await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 1');
    });

  test('Ctrl/Cmd+arrows on a row header never jump to the edge of the row, but still jump from a cell',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.callPlugin('collapseParent', 0);
      await nestedRows.focusRowHeader(1);

      await page.keyboard.press('ControlOrMeta+ArrowRight');
      await page.keyboard.press('ArrowUp');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([0, -1]);

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, -1]);
      expect(await nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);

      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ControlOrMeta+ArrowRight');
      await expect.poll(() => nestedRows.selectedCell()).toEqual([1, 1]);
    });

  test('the Ctrl/Cmd+arrow chords are mirrored in RTL', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ dir: 'rtl' });
    await nestedRows.focusRowHeader(7);

    await page.keyboard.press('ControlOrMeta+ArrowRight');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([6, -1]);

    await page.keyboard.press('ControlOrMeta+ArrowRight');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE.slice(0, 7));
    await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row 7');
    expect(await nestedRows.selectedCell()).toEqual([6, -1]);

    await page.keyboard.press('ControlOrMeta+ArrowLeft');
    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);
    await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 7, expanded rows shown: 2');
    expect(await nestedRows.selectedCell()).toEqual([6, -1]);

    await page.keyboard.press('ControlOrMeta+ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => nestedRows.selectedCell()).toEqual([7, -1]);
  });

  test('the walk to a parent hidden by HiddenRows does nothing',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.hideRows([6]);
      await nestedRows.focusRowHeader(7);

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      await page.keyboard.press('ArrowDown');

      await expect.poll(() => nestedRows.selectedCell()).toEqual([8, -1]);
    });

  test('an expand counts only the rows it renders', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.hideRows([7]);
    await nestedRows.callPlugin('collapseParent', 6);
    await nestedRows.focusRowHeader(6);

    await page.keyboard.press('ControlOrMeta+ArrowRight');

    await expect(nestedRows.politeAnnouncer()).toHaveText('Expanded row 7, expanded rows shown: 1');
  });

  test('a row is named after the text its row header shows, HTML markup excluded', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.updateSettings({
      rowHeaders: ['<b>Rock</b>', 'R1', 'R2', 'R3', 'R4', 'R5', 'Tom &amp; Jerry', 'M1', 'M2'],
    });

    await nestedRows.collapseButton(6).click();
    await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row Tom & Jerry');

    await nestedRows.collapseButton(0).click();
    await expect(nestedRows.politeAnnouncer()).toHaveText('Collapsed row Rock');
  });

  test('Enter on a row header toggles even when every column is hidden', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.updateSettings({ hiddenColumns: { columns: [0, 1] } });
    await nestedRows.selectRowHeader(0);

    await page.keyboard.press('Enter');

    await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);
  });

  test('the attributes follow a data replacement', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.loadData([
      { name: 'Only', __children: [{ name: 'Child' }] },
      { name: 'Leaf' },
      { name: 'Last' },
    ]);

    await expect.poll(() => nestedRows.rowAttributes()).toEqual([
      row(1, 1, 3, true),
      row(2, 1, 1),
      row(1, 2, 3),
      row(1, 3, 3),
    ]);
  });

  test('the attributes are removed when the plugin is switched off', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await expect.poll(() => nestedRows.countRowsWithTreegridAttributes()).toBe(9 * 2);

    await nestedRows.updateSettings({ nestedRows: false });
    await expect.poll(() => nestedRows.countRowsWithTreegridAttributes()).toBe(0);

    await nestedRows.updateSettings({ nestedRows: true });
    await expect.poll(() => nestedRows.countRowsWithTreegridAttributes()).toBe(9 * 2);
  });

  test('the attributes are removed when the row headers are switched off', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await expect.poll(() => nestedRows.countRowsWithTreegridAttributes()).toBe(9 * 2);

    await nestedRows.updateSettings({ rowHeaders: false });

    await expect.poll(() => nestedRows.countRowsWithTreegridAttributes()).toBe(0);
  });

  test('a grid built with ariaTags off carries no attributes and announces nothing', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ aria: 'off' });
    await nestedRows.recordAnnouncements();

    await nestedRows.collapseButton(0).click();
    await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);
    await nestedRows.collapseButton(0).click();
    await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);

    expect(await nestedRows.countRowsWithTreegridAttributes()).toBe(0);
    expect(await nestedRows.announcements()).toEqual([]);
  });

  test('the public API changes the attributes but does not announce', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.recordAnnouncements();
    await nestedRows.callPlugin('collapseParent', 0);

    await expect.poll(async() => (await nestedRows.rowAttributes())[0]).toEqual(row(1, 1, 2, false));

    await nestedRows.collapseButton(1).click();

    await expect.poll(() => nestedRows.announcements()).toEqual(['Collapsed row 2']);
  });

  test('Enter and the Ctrl/Cmd+arrow chords do nothing while an overlay covers the grid body',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.focusRowHeader(0);
      await nestedRows.setGridBodyCovered(true);

      await page.keyboard.press('Enter');
      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);

      await page.keyboard.press('ControlOrMeta+ArrowLeft');
      expect(await nestedRows.visibleNames()).toEqual(FULL_TREE);

      await nestedRows.callPlugin('collapseParent', 0);
      await page.keyboard.press('ControlOrMeta+ArrowRight');
      expect(await nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);

      await nestedRows.callPlugin('expandParent', 0);

      await nestedRows.setGridBodyCovered(false);
      await nestedRows.selectRowHeader(0);
      await page.keyboard.press('ControlOrMeta+ArrowLeft');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(ROOT_A_COLLAPSED);
    });

  test('the Ctrl/Cmd+arrow chords keep working after the plugin is rebuilt by updateSettings',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.callPlugin('collapseParent', 0);
      await nestedRows.updateSettings({ nestedRows: true });
      await nestedRows.updateSettings({ nestedRows: true });
      await nestedRows.focusRowHeader(0);

      await page.keyboard.press('ControlOrMeta+ArrowRight');

      await expect.poll(() => nestedRows.visibleNames()).toEqual(FULL_TREE);
      expect(await nestedRows.selectedCell()).toEqual([0, -1]);
    });

  test('the position and set size follow a child added to and detached from a parent', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.addChild(6, 'B-3');

    await expect.poll(() => nestedRows.setPositionsByName()).toMatchObject({
      'Root B': '1:2/2',
      'B-1': '2:1/3',
      'B-2': '2:2/3',
      'B-3': '2:3/3',
    });

    await nestedRows.detachFromParent(7);

    await expect.poll(() => nestedRows.setPositionsByName()).toMatchObject({
      'Root A': '1:1/3',
      'Root B': '1:2/3',
      'B-1': '1:3/3',
      'B-2': '2:1/2',
      'B-3': '2:2/2',
    });
  });
});
