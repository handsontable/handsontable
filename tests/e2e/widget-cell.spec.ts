import { test, expect } from '../fixtures/test';
import { WidgetCellGridPage } from '../fixtures/pages/WidgetCellGridPage';

/**
 * In-cell widgets (DEV-1619 follow-up). Custom renderers embed self-managed
 * widgets — buttons that keep the browser focus where it is, web components
 * that render selectable text behind their own shadow boundary. Interacting
 * with such a widget is an in-grid interaction: it must not be misread as an
 * outside click that drops the selection, and copying text selected inside
 * the widget's shadow root must reach the browser instead of being replaced
 * by the grid's cell-range copy.
 */
test.describe('grid with self-managed widgets inside cells', () => {
  let grid: WidgetCellGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new WidgetCellGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the selection when a focus-preserving widget inside a cell is clicked', async () => {
    await grid.selectAndParkFocusOutside();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
    await expect(grid.outsideInput).toBeFocused();

    await grid.keepFocusWidget.click();

    await expect(grid.outsideInput).toBeFocused();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
  });

  test('lets the browser copy text selected inside a widget shadow root', async () => {
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.armCopyProbe();
    await grid.textWidget.dblclick();
    await grid.page.keyboard.press('ControlOrMeta+c');

    await expect.poll(() => grid.lastCopyDefaultPrevented()).toBe(false);
  });
});
