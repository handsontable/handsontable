import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { TabMovesVerticalPage } from '../fixtures/pages/TabMovesVerticalPage';

const LAST_ROW = 7;
const LAST_COLUMN = 4;

type AXNode = {
  nodeId: string;
  ignored: boolean;
  role?: { value: string };
  name?: { value: string };
  properties?: { name: string; value: { value: unknown } }[];
  childIds?: string[];
  parentId?: string;
};

/**
 * The accessibility tree in document order, without the nodes the browser ignores.
 *
 * @param {AXNode[]} nodes The nodes `Accessibility.getFullAXTree` returns.
 * @returns {AXNode[]}
 */
function inDocumentOrder(nodes: AXNode[]): AXNode[] {
  const byId = new Map(nodes.map(node => [node.nodeId, node]));
  const root = nodes.find(node => node.parentId === undefined);
  const ordered: AXNode[] = [];
  const visit = (node: AXNode | undefined) => {
    if (!node) {
      return;
    }

    if (!node.ignored) {
      ordered.push(node);
    }

    (node.childIds ?? []).forEach(id => visit(byId.get(id)));
  };

  visit(root);

  return ordered;
}

/**
 * Whether the browser exposes the node as focusable.
 *
 * @param {AXNode} node The node.
 * @returns {boolean}
 */
function isFocusable(node: AXNode): boolean {
  return (node.properties ?? []).some(property => property.name === 'focusable' && property.value.value === true);
}

/**
 * The Tab entry into the grid from the control before it is the grid's `treegrid` root, not the hidden
 * focus catcher in front of it. Chromium exposes every focusable element to assistive technology, so the
 * armed catcher was an empty item where the table should be, and NVDA's browse mode read it as "blank".
 * The catcher stays in the DOM, but it is never focusable; the root is a Tab stop only while the focus is
 * outside the grid, and it hands the focus on to a cell right away.
 */
test.describe('Tab entry into the grid from above', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: TabMovesVerticalPage;

  const topCatcher = () => grid.grid.locator('.ht-grid-content > .htFocusCatcher').first();
  const root = () => grid.grid.locator('.ht-wrapper.handsontable[role="treegrid"]');

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new TabMovesVerticalPage(page, theme, bundle);
  });

  test('Tab from the control before the grid selects and focuses the first cell', async() => {
    await grid.goto({});
    await grid.beforeInput.focus();
    await grid.press('Tab');

    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
    await expect(grid.cell(0, 0)).toBeFocused();
    await expect(root()).not.toBeFocused();
  });

  test('Tab from the control before the grid returns to the cell the grid remembers', async() => {
    await grid.goto({});
    await grid.cell(2, 1).click();
    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);

    await grid.beforeInput.focus();
    await grid.press('Tab');

    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);
    await expect(grid.cell(2, 1)).toBeFocused();
  });

  test('Shift+Tab from the control after the grid enters at the last cell', async() => {
    await grid.goto({});
    await grid.afterInput.focus();
    await grid.press('Shift+Tab');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, LAST_COLUMN, LAST_ROW, LAST_COLUMN]]);
  });

  test('Shift+Tab from the first cell leaves the grid for the control before it, not for the root', async() => {
    await grid.goto({});
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await expect(grid.cell(0, 0)).toBeFocused();

    await grid.press('Shift+Tab');

    await expect(grid.beforeInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('the root is a Tab stop only while the focus is outside the grid', async() => {
    await grid.goto({});
    await grid.beforeInput.focus();

    await expect(root()).toHaveAttribute('tabindex', '0');
    await expect(root()).toHaveAttribute('data-ht-focus-source', 'tab_from_above');

    await grid.press('Tab');
    await expect(grid.cell(0, 0)).toBeFocused();
    await grid.press('ArrowRight');
    await expect.poll(() => grid.selected()).toEqual([[0, 1, 0, 1]]);
    await grid.press('Tab');

    await expect(root()).not.toHaveAttribute('tabindex');
    await expect(root()).not.toHaveAttribute('data-ht-focus-source');
  });

  test('the top focus catcher stays in the DOM and is never focusable', async() => {
    await grid.goto({});

    await expect(topCatcher()).toHaveAttribute('data-ht-focus-source', 'tab_from_above');
    await expect(topCatcher()).not.toHaveAttribute('tabindex');

    await grid.beforeInput.focus();

    await expect(topCatcher()).not.toHaveAttribute('tabindex');

    const focusedAfterFocusCall = await topCatcher().evaluate((catcher: HTMLElement) => {
      catcher.focus();

      return { tabIndex: catcher.tabIndex, focused: catcher.matches(':focus') };
    });

    expect(focusedAfterFocusCall).toEqual({ tabIndex: -1, focused: false });
  });

  test('a click on a cell with the focus outside the grid selects that cell', async() => {
    await grid.goto({ fragmentSelection: true });
    await grid.cell(5, 3).click();
    await expect.poll(() => grid.selected()).toEqual([[5, 3, 5, 3]]);

    await grid.beforeInput.focus();
    await grid.cell(2, 1).click();

    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);
    await grid.press('ArrowDown');
    await expect.poll(() => grid.selected()).toEqual([[3, 1, 3, 1]]);
  });
});

/**
 * The accessibility tree is read through the Chromium DevTools protocol, so this block carries no engine
 * tag and runs on the Chromium legs only.
 */
test.describe('Tab entry into the grid from above, in the accessibility tree', () => {
  let grid: TabMovesVerticalPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new TabMovesVerticalPage(page, theme, bundle);
  });

  test('the accessibility tree has no empty focusable node between the control before the grid and the treegrid',
    async({ page }) => {
      await grid.goto({});
      await grid.beforeInput.focus();
      await expect(grid.beforeInput).toBeFocused();

      const cdp = await page.context().newCDPSession(page);
      const { nodes } = await cdp.send('Accessibility.getFullAXTree') as { nodes: AXNode[] };
      const ordered = inDocumentOrder(nodes);
      const beforeIndex = ordered.findIndex(node => node.role?.value === 'textbox' && node.name?.value === 'Before grid');
      const treegridIndex = ordered.findIndex(node => node.role?.value === 'treegrid');

      expect(beforeIndex).toBeGreaterThan(-1);
      expect(treegridIndex).toBeGreaterThan(beforeIndex);

      const focusableBetween = ordered.slice(beforeIndex + 1, treegridIndex).filter(isFocusable);

      expect(focusableBetween.map(node => ({ role: node.role?.value, name: node.name?.value }))).toEqual([]);
      expect(isFocusable(ordered[treegridIndex])).toBe(true);
    });
});
