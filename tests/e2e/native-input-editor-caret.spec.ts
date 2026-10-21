import { test, expect } from '../fixtures/test';
import { NativeInputEditorCaretPage } from '../fixtures/pages/NativeInputEditorCaretPage';

/**
 * DEV-3049: the date, time, and datetime editors extend `TextEditor` and inherit its Home/End
 * shortcuts, which move the caret through `setCaretPosition()`. Their element is a native
 * `<input type="date|time|datetime-local">`, which does not support the selection API, so
 * `setSelectionRange()` threw `InvalidStateError` ("The input element's type ('date') does not
 * support selection") from the keydown handler. Pressing Home or End in these editors must be a
 * no-op for the caret: no uncaught error, the editor stays open, and its value is untouched.
 */
const cases = [
  { name: 'date (Intl dateFormat)', col: 0, inputType: 'date', value: '2024-06-10' },
  { name: 'time', col: 1, inputType: 'time', value: '14:30' },
  { name: 'intl-datetime', col: 2, inputType: 'datetime-local', value: '2024-06-10T14:30:45' },
];

test.describe('Home/End in native date and time input editors', () => {
  for (const { name, col, inputType, value } of cases) {
    test(`does not throw and keeps the ${name} editor open`, async({ page, theme, bundle }) => {
      const grid = new NativeInputEditorCaretPage(page, theme, bundle);

      await grid.goto();
      await grid.stubNativePicker();
      await grid.openEditor(0, col, inputType);

      await page.keyboard.press('Home');
      await page.keyboard.press('End');

      expect(grid.pageErrors).toEqual([]);
      await expect(grid.editorInput).toBeVisible();
      await expect(grid.editorInput).toHaveValue(value);
    });
  }
});
