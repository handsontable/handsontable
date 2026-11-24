import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SettingsUpdateOutsideFocusPage } from '../fixtures/pages/SettingsUpdateOutsideFocusPage';

/**
 * An option next to the grid changes the grid's settings, and a wrapper sends the data along with
 * them. The grid takes the browser focus back only when it held it at the time of the update, so a
 * keyboard user who operated a control outside the grid stays on that control.
 */
test.describe('settings update with the focus outside the grid', { tag: CROSS_BROWSER_TAG }, () => {
  const PAYLOADS = [
    { name: 'the same data', payload: { data: 'same' as const } },
    { name: 'new data', payload: { data: 'new' as const } },
    { name: 'data and a setting', payload: { data: 'same' as const, readOnly: true } },
    { name: 'a setting only (control: the selection is not laid again)', payload: { colHeaders: false } },
  ];

  for (const { name, payload } of PAYLOADS) {
    test(`${name} keeps the focus on a checkbox outside the grid`, async({ page, theme, bundle }) => {
      const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

      await grid.goto();
      await grid.selectCell(0, 0);
      await grid.option.focus();
      await expect(grid.option).toBeFocused();

      await grid.updateSettings(payload);

      await expect(grid.option).toBeFocused();
      await expect.poll(() => grid.focusState()).toMatchObject({ option: true, inGrid: false });
    });

    test(`${name} keeps the focus on a button outside the grid`, async({ page, theme, bundle }) => {
      const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

      await grid.goto();
      await grid.selectCell(0, 0);
      await grid.action.focus();
      await expect(grid.action).toBeFocused();

      await grid.updateSettings(payload);

      await expect(grid.action).toBeFocused();
      await expect.poll(() => grid.focusState()).toMatchObject({ action: true, inGrid: false });
    });
  }

  test('updateData() keeps the focus on a checkbox outside the grid', async({ page, theme, bundle }) => {
    const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(0, 0);
    await grid.option.focus();
    await expect(grid.option).toBeFocused();

    await grid.updateData();

    await expect(grid.option).toBeFocused();
    await expect.poll(() => grid.focusState()).toMatchObject({ option: true, inGrid: false });
  });

  test('loadData() keeps the focus on a checkbox outside the grid', async({ page, theme, bundle }) => {
    const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(0, 0);
    await grid.option.focus();
    await expect(grid.option).toBeFocused();

    await grid.loadData();

    await expect(grid.option).toBeFocused();
    await expect.poll(() => grid.focusState()).toMatchObject({ option: true, inGrid: false });
  });

  test('a column layout change with a filter condition set keeps the focus on a button outside the grid', async({ page, theme, bundle }) => {
    const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.enableFilterWithCondition();
    await grid.selectCell(1, 2);
    await grid.action.focus();
    await expect(grid.action).toBeFocused();

    await grid.dropMiddleColumn();

    await expect(grid.action).toBeFocused();
    await expect.poll(() => grid.focusState()).toMatchObject({ action: true, inGrid: false });
  });

  test('Space on the option checkbox updates the settings and leaves the focus on the checkbox', async({ page, theme, bundle }) => {
    const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(1, 2);
    await grid.option.focus();

    await page.keyboard.press('Space');

    await expect(grid.option).toBeChecked();
    await expect.poll(() => page.evaluate(() => window.hot.getSettings().readOnly)).toBe(true);
    await expect(grid.option).toBeFocused();
    await expect.poll(() => grid.highlight()).toEqual([1, 2]);
  });

  test('a data update keeps the focus on the highlighted cell when the grid held it', async({ page, theme, bundle }) => {
    const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(1, 2);
    await expect.poll(() => grid.focusState()).toMatchObject({ onHighlight: true });

    await grid.updateSettings({ data: 'same', readOnly: true });

    await expect.poll(() => grid.focusState()).toMatchObject({ onHighlight: true, option: false, action: false });
    await expect.poll(() => grid.highlight()).toEqual([1, 2]);
  });

  test('a data update gives the focus to the highlighted cell when nothing held it', async({ page, theme, bundle }) => {
    const grid = new SettingsUpdateOutsideFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(1, 2);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect.poll(() => grid.focusState()).toMatchObject({ body: true });

    await grid.updateSettings({ data: 'same' });

    await expect.poll(() => grid.focusState()).toMatchObject({ onHighlight: true });
  });
});
