import { test, expect } from '../fixtures/test';
import { NestedRowsPage } from '../fixtures/pages/NestedRowsPage';

/**
 * The NestedRows plugin could collapse and expand parent rows, but none of it was public API
 * and none of it fired a hook, so an app could not react to a collapse, block it, or save it
 * (DEV-1023). The only working path was `plugin.collapsingUI`, marked `@private`.
 *
 * These tests drive the public API through a real browser, and assert against what the user
 * sees - which rows are on screen - rather than against plugin internals.
 *
 * The fixture tree is three levels deep on purpose. Physical layout:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 A-3 / 6 Root B / 7 B-1 / 8 B-2
 */

const ALL_ROWS = ['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B', 'B-1', 'B-2'];

test.describe('NestedRows public collapse/expand API', () => {
  test('collapseParent hides the children of one parent, expandParent brings them back', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();
    await expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);

    expect(await nestedRows.callPlugin('collapseParent', 0)).toBe(true);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);

    expect(await nestedRows.callPlugin('expandParent', 0)).toBe(true);
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);
  });

  test('collapseAll leaves only the top-level rows, expandAll restores every level', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseAll');
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B']);

    await nestedRows.callPlugin('expandAll');
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);
  });

  test('expandAll also expands a parent that was collapsed inside another collapsed parent', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // Collapse the inner parent (A-2, physical row 2) first, then the outer one (Root A).
    await nestedRows.callPlugin('collapseParent', 2);
    await nestedRows.callPlugin('collapseParent', 0);

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
    expect(await nestedRows.collapsedParents()).toEqual([0, 2]);

    await nestedRows.callPlugin('expandAll');

    expect(await nestedRows.collapsedParents()).toEqual([]);
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);
  });

  test('toggleParent matches what the row header button does', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // Collapse by pointer, expand by API - both act on the same parent.
    await nestedRows.collapseButton(0).click();
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);

    expect(await nestedRows.callPlugin('toggleParent', 0)).toBe(true);
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);
  });

  test('getCollapsedParents reports a trimmed parent that has no visual index', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 2);
    await nestedRows.callPlugin('collapseParent', 0);

    // A-2 is trimmed now, so it has no visual index - the physical index is the only way to
    // express this part of the state, which is why the read method returns physical indexes.
    const visualRowOfInnerParent = await page.evaluate(() => window.hot.toVisualRow(2));

    expect(visualRowOfInnerParent).toBe(null);
    expect(await nestedRows.collapsedParents()).toContain(2);
  });

  test('expandToRow reveals a row hidden inside a collapsed branch', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 0);
    expect(await nestedRows.visibleNames()).not.toContain('A-2-a');

    // Physical row 3 is A-2-a, two levels down and currently hidden.
    expect(await nestedRows.callPlugin('expandToRow', 3)).toBe(true);
    expect(await nestedRows.visibleNames()).toContain('A-2-a');
  });

  test('expandToLevel shows only rows down to the given nesting level', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('expandToLevel', 0);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B']);

    await nestedRows.callPlugin('expandToLevel', 1);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B', 'B-1', 'B-2']);
  });

  test('the structure reads describe the tree', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    expect(await nestedRows.callPlugin('isParent', 0)).toBe(true);
    expect(await nestedRows.callPlugin('isParent', 1)).toBe(false);
    expect(await nestedRows.callPlugin('getRowLevel', 0)).toBe(0);
    expect(await nestedRows.callPlugin('getRowLevel', 3)).toBe(2);
    expect(await nestedRows.callPlugin('getRowParent', 3)).toBe(2);
    expect(await nestedRows.callPlugin('getRowParent', 0)).toBe(null);
    expect(await nestedRows.callPlugin('countChildren', 0)).toBe(3);
    expect(await nestedRows.callPlugin('countChildren', 0, true)).toBe(5);
  });

  test('a row without children is never reported as collapsed', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // Row 1 is A-1, a leaf. "Are all children collapsed" is vacuously true for a row with no
    // children, so this needs its own guard.
    expect(await nestedRows.callPlugin('isParentCollapsed', 1)).toBe(false);
    expect(await nestedRows.callPlugin('isParentCollapsed', 0)).toBe(false);

    await nestedRows.callPlugin('collapseParent', 0);

    expect(await nestedRows.callPlugin('isParentCollapsed', 0)).toBe(true);
  });
});

test.describe('NestedRows collapse/expand hooks', () => {
  test('fires the collapse hooks with the documented arguments', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();
    await nestedRows.resetHookLog();

    await nestedRows.callPlugin('collapseParent', 0);

    expect(await nestedRows.hookLog()).toEqual([
      { name: 'beforeRowCollapse', args: [[], [0], true] },
      { name: 'afterRowCollapse', args: [[], [0], true, true] },
    ]);
  });

  test('fires the expand hooks with the documented arguments', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();
    await nestedRows.callPlugin('collapseParent', 0);
    await nestedRows.resetHookLog();

    await nestedRows.callPlugin('expandParent', 0);

    expect(await nestedRows.hookLog()).toEqual([
      { name: 'beforeRowExpand', args: [[0], [], true] },
      { name: 'afterRowExpand', args: [[0], [], true, true] },
    ]);
  });

  test('reports collapsePossible as false for a row that has no children', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();
    await nestedRows.resetHookLog();

    // Row 1 is A-1, a leaf.
    expect(await nestedRows.callPlugin('collapseParent', 1)).toBe(false);

    expect(await nestedRows.hookLog()).toEqual([
      { name: 'beforeRowCollapse', args: [[], [], false] },
      { name: 'afterRowCollapse', args: [[], [], false, false] },
    ]);
  });

  test('fires the same hooks when the user clicks the row header button', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();
    await nestedRows.resetHookLog();

    await nestedRows.collapseButton(0).click();

    expect(await nestedRows.hookLog()).toEqual([
      { name: 'beforeRowCollapse', args: [[], [0], true] },
      { name: 'afterRowCollapse', args: [[], [0], true, true] },
    ]);
  });

  test('fires the same hooks when the user presses Enter on a row header', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();
    await nestedRows.resetHookLog();

    // Move focus onto the first row header, then toggle it with the keyboard.
    await page.evaluate(() => window.hot.selectCell(0, -1));
    await page.keyboard.press('Enter');

    expect(await nestedRows.hookNames()).toEqual(['beforeRowCollapse', 'afterRowCollapse']);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
  });

  test('returning false from beforeRowCollapse blocks the collapse and fires no afterRowCollapse',
    async({ page, theme }) => {
      const nestedRows = new NestedRowsPage(page, theme);

      await nestedRows.goto({ block: 'rowCollapse' });
      await nestedRows.resetHookLog();

      expect(await nestedRows.callPlugin('collapseParent', 0)).toBe(false);

      expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);
      expect(await nestedRows.collapsedParents()).toEqual([]);
      expect(await nestedRows.hookNames()).toEqual(['beforeRowCollapse']);
    });

  test('returning false from beforeRowExpand blocks the expand and fires no afterRowExpand',
    async({ page, theme }) => {
      const nestedRows = new NestedRowsPage(page, theme);

      await nestedRows.goto({ block: 'rowExpand' });

      await nestedRows.callPlugin('collapseParent', 0);
      await nestedRows.resetHookLog();

      expect(await nestedRows.callPlugin('expandParent', 0)).toBe(false);

      expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
      expect(await nestedRows.collapsedParents()).toEqual([0]);
      expect(await nestedRows.hookNames()).toEqual(['beforeRowExpand']);
    });
});

test.describe('NestedRows collapsed state stability', () => {
  test('the methods are safe to call right after loadData, with no retry', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // DEV-1437: reading a row identity straight after a dataset swap used to throw, so the
    // customer had to retry inside requestAnimationFrame. Collapse on the very next line.
    const result = await page.evaluate(() => {
      const plugin = window.hot.getPlugin('nestedRows');

      window.hot.loadData([
        { name: 'New Root', __children: [{ name: 'New Child' }] },
      ]);

      return {
        collapsed: plugin.collapseParent(0),
        collapsedParents: plugin.getCollapsedParents(),
      };
    });

    expect(result.collapsed).toBe(true);
    expect(result.collapsedParents).toEqual([0]);
    expect(await nestedRows.visibleNames()).toEqual(['New Root']);
  });

  test('the collapsed rows survive an updateSettings call', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 0);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);

    // The React wrapper puts every prop into updateSettings on each re-render, so this is what
    // a re-render does to the grid. The collapsed rows used to be lost here.
    await page.evaluate(() => window.hot.updateSettings({ nestedRows: true }));

    expect(await nestedRows.collapsedParents()).toEqual([0]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
  });
});
