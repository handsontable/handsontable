import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DateEditorPage } from '../fixtures/pages/DateEditorPage';

/**
 * The date, time, and datetime editors ask the browser for their native picker when they open. While
 * Chromium shows a picker it takes the keys, so Tab never reached the grid after Enter. Only a pointer
 * open shows the picker now; a keyboard open leaves the keys to the grid.
 *
 * Row 0 of the fixture: column 1 is a `date`, column 4 a `time`, column 5 an `intl-datetime`.
 */
const EDITORS = [
  { name: 'date', col: 1, key: 'Tab', expectedCol: 2 },
  { name: 'time', col: 4, key: 'Tab', expectedCol: 5 },
  { name: 'intl-datetime', col: 5, key: 'Shift+Tab', expectedCol: 4 },
];

test.describe('the native picker editors', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: DateEditorPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DateEditorPage(page, theme, bundle);
    await grid.goto();
  });

  for (const { name, col, key, expectedCol } of EDITORS) {
    test(`${name}: Escape after a double-click closes the editor and its picker`, async({ page, browserName }) => {
      await grid.cell(0, col).dblclick();
      await expect(grid.openInput).toBeFocused();

      // Chromium's first Escape closes only the picker, so press until the editor is gone.
      await expect(async() => {
        await page.keyboard.press('Escape');
        expect(await grid.isEditorOpened()).toBe(false);
      }).toPass();

      if (browserName !== 'webkit') {
        // WebKit does not match `:open` for a native picker.
        await expect(page.locator('input.handsontableInput:open')).toHaveCount(0);
      }
    });

    test(`${name}: ${key} after Enter commits and moves the selection`, async({ page }) => {
      await grid.openEditorWithEnter(0, col);
      await expect(grid.openInput).toBeFocused();

      await page.keyboard.press(key);

      await expect.poll(() => grid.isEditorOpened()).toBe(false);
      expect(await grid.selectedCell()).toEqual([0, expectedCol]);
    });
  }
});

/**
 * Chromium only: the `:open` state of a native picker is read there. WebKit does not match it, and Alt+ArrowDown
 * is Chromium's own key for the picker.
 */
test.describe('the native picker of the picker editors', () => {
  let grid: DateEditorPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DateEditorPage(page, theme, bundle);
    await grid.goto();
  });

  for (const { name, col } of EDITORS) {
    // The date editor's Enter case is in date-editor-native-input.spec.ts.
    if (name !== 'date') {
      test(`${name}: Enter does not show the picker`, async() => {
        await grid.openEditorWithEnter(0, col);
        await expect(grid.openInput).toBeFocused();

        expect(await grid.openInput.evaluate(input => input.matches(':open'))).toBe(false);
      });
    }

    // The three editors share the picker-opening rule, so the date editor runs these keys; the other two keep the
    // Enter case above and the double-click case below.
    if (name === 'date') {
      test(`${name}: F2 does not show the picker`, async({ page }) => {
        await grid.selectCell(0, col);
        await page.keyboard.press('F2');
        await expect.poll(() => grid.isEditorOpened()).toBe(true);
        await expect(grid.openInput).toBeFocused();

        expect(await grid.openInput.evaluate(input => input.matches(':open'))).toBe(false);
      });

      test(`${name}: typing does not show the picker`, async({ page }) => {
        await grid.selectCell(0, col);
        await page.keyboard.press('1');
        await expect.poll(() => grid.isEditorOpened()).toBe(true);
        await expect(grid.openInput).toBeFocused();

        expect(await grid.openInput.evaluate(input => input.matches(':open'))).toBe(false);
      });

      test(`${name}: Alt+ArrowDown shows the picker`, async({ page }) => {
        await grid.openEditorWithEnter(0, col);
        await expect(grid.openInput).toBeFocused();

        await page.keyboard.press('Alt+ArrowDown');

        await expect.poll(() => grid.openInput.evaluate(input => input.matches(':open'))).toBe(true);
      });
    }

    // The date editor's double-click case is in date-editor-native-input.spec.ts.
    if (name !== 'date') {
      test(`${name}: a double-click shows the picker`, async() => {
        await grid.cell(0, col).dblclick();
        await expect(grid.openInput).toBeFocused();

        await expect.poll(() => grid.openInput.evaluate(input => input.matches(':open'))).toBe(true);
      });
    }

  }
});
