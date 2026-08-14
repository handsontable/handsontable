import { test, expect } from '../fixtures/test';
import { ShadowGridPage } from '../fixtures/pages/ShadowGridPage';

/**
 * Shadow DOM embedding (DEV-1619). When the grid lives inside a native shadow
 * root, document-level listeners see events retargeted to the shadow host and
 * `document.activeElement` reports the host instead of the focused element.
 * Before the fix, every in-grid click was misclassified as an outside click:
 * the open editor closed, the selection dropped, and the grid stopped
 * listening. These tests drive the real interactions across the boundary.
 */
test.describe('grid inside a native shadow root', () => {
  let grid: ShadowGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ShadowGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('isolates the internal z-index stack from the host page', async () => {
    const wrapper = grid.page.locator('.ht-root-wrapper');

    await expect(wrapper).toHaveClass(/ht-shadow-dom/);
    await expect(wrapper).toHaveCSS('isolation', 'isolate');
  });

  test('keeps the editor open when its textarea is clicked', async () => {
    await grid.openEditor(1, 0);

    await grid.editor().click();

    await expect(grid.editor()).toBeVisible();
    expect(await grid.isListening()).toBe(true);

    await grid.editor().fill('edited in shadow');
    await grid.editor().press('Enter');
    await grid.expectCell(1, 0, 'edited in shadow');
  });

  test('moves the selection between cells without dropping the keyboard listener', async () => {
    await grid.cell(0, 0).click();
    await grid.cell(2, 1).click();

    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);
    expect(await grid.isListening()).toBe(true);

    await grid.page.keyboard.type('typed');
    await grid.page.keyboard.press('Enter');
    await grid.expectCell(2, 1, 'typed');
  });

  test('copies and pastes between cells with keyboard shortcuts', async () => {
    await grid.cell(0, 0).click();
    await grid.page.keyboard.press('ControlOrMeta+c');

    await grid.cell(4, 2).click();
    await grid.page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(4, 2, 'A1');
  });

  test('does not steal focus back when typing into an input outside the shadow host', async () => {
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.outsideInput.click();
    await grid.page.keyboard.type('typed outside');

    await expect(grid.outsideInput).toHaveValue('typed outside');
    await expect(grid.outsideInput).toBeFocused();
    await grid.expectCell(0, 0, 'A1');
  });

  test('executes a context menu action on the selection that opened it', async () => {
    await grid.cell(1, 0).click({ button: 'right' });

    const menuItem = grid.page.locator('.htContextMenu').getByText('Insert row below', { exact: true });

    await menuItem.click();

    await expect(grid.page.locator('.ht_master .htCore tbody tr')).toHaveCount(6);
  });

  test('deselects when a light-DOM element outside the shadow host is clicked', async () => {
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.outsideTextarea.click();

    await expect.poll(() => grid.selected()).toBeNull();
  });
});
