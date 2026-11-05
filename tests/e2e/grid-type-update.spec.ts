import { test, expect, THEMES_TAG } from '../fixtures/test';
import { GridTypeUpdatePage } from '../fixtures/pages/GridTypeUpdatePage';

/**
 * A grid-level `type` used to be expanded into its editor, renderer, and validator only when the grid
 * was created. A later `updateSettings({ type })` changed `getSettings().type` and left the cells with the
 * editor and renderer of the first type. The new type must now apply, with no `columns` and no `cells`.
 */
test.describe('Grid-level type changed through updateSettings()', { tag: THEMES_TAG }, () => {
  let grid: GridTypeUpdatePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridTypeUpdatePage(page, theme, bundle);
    await grid.goto();
  });

  test('starts as a dropdown grid, the control the other tests rely on', async() => {
    await expect(grid.dropdownArrow(0, 0)).toBeVisible();
    await expect(grid.checkbox(0, 0)).toHaveCount(0);

    await grid.selectCell(0, 0);
    await grid.page.keyboard.press('Enter');

    await expect(grid.dropdownList()).toBeVisible();
  });

  test('renders the new type and drops the dropdown renderer', async() => {
    await grid.updateSettings({ type: 'checkbox', checkedTemplate: 'Yes', uncheckedTemplate: 'No' });

    await expect(grid.checkbox(0, 0)).toBeVisible();
    await expect(grid.checkbox(0, 0)).toBeChecked();
    await expect(grid.checkbox(0, 1)).not.toBeChecked();
    await expect(grid.dropdownArrow(0, 0)).toHaveCount(0);
  });

  test('toggles the new checkbox cell with the keyboard and opens no dropdown list', async() => {
    await grid.updateSettings({ type: 'checkbox', checkedTemplate: 'Yes', uncheckedTemplate: 'No' });
    await expect(grid.checkbox(0, 0)).toBeVisible();

    await grid.selectCell(0, 0);
    await grid.page.keyboard.press('Space');

    await expect.poll(() => grid.dataAt(0, 0)).toBe('No');
    await expect(grid.checkbox(0, 0)).not.toBeChecked();
    await expect(grid.dropdownList()).toBeHidden();
  });

  test('drops what the numeric renderer stored on cells that were already drawn', async() => {
    await grid.updateSettings({ type: 'numeric' });

    await expect(grid.cell(0, 0)).toHaveClass(/htNumeric/);
    await expect(grid.cell(0, 0)).toHaveCSS('text-align', 'right');

    await grid.updateSettings({ type: 'text' });

    await expect(grid.cell(0, 0)).not.toHaveClass(/htNumeric|htRight/);
    await expect(grid.cell(1, 1)).not.toHaveClass(/htNumeric|htRight/);
    await expect(grid.cell(0, 0)).not.toHaveCSS('text-align', 'right');
  });

  test('keeps a renderer passed in the same call over the new type', async() => {
    await grid.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { updateSettings(settings: Record<string, unknown>): void },
      };

      hot.updateSettings({
        type: 'checkbox',
        renderer(_hot: unknown, td: HTMLElement) {
          td.textContent = 'custom';
        },
      });
    });

    await expect(grid.cell(0, 0)).toHaveText('custom');
    await expect(grid.checkbox(0, 0)).toHaveCount(0);
  });
});
