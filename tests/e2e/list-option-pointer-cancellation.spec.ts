import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { DropdownObjectValuesPage } from '../fixtures/pages/DropdownObjectValuesPage';

/**
 * WCAG 2.5.2 Pointer Cancellation for the option list of the dropdown and autocomplete editors.
 *
 * The list used to pick, save and close on the mouse press, so a user who pressed the wrong option
 * could not back out. Now the press only highlights the option, and the pick happens when the pointer
 * is released on the same option. A release anywhere else cancels it and puts the highlight back, so
 * a later Enter cannot commit the option that was pressed.
 *
 * Row 1 is the empty row of the fixture, so a stored `null` proves nothing was committed. Column 0
 * is a dropdown, column 1 a strict autocomplete; both list the same three countries. The autocomplete
 * opens with its first option highlighted, the dropdown with none, so they differ in what a cancelled
 * press restores and in how many arrow presses reach `pressed`.
 */
const LISTS = [
  { name: 'dropdown', col: 0, pressed: 'Poland', other: 'Japan', restored: null, arrows: 2 },
  { name: 'autocomplete', col: 1, pressed: 'Poland (PLN)', other: 'Japan (JPY)', restored: 'United States (USD)', arrows: 1 },
];
const EMPTY_ROW = 1;

test.describe('option list pointer cancellation', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  for (const { name, col, pressed, other, restored, arrows } of LISTS) {
    test.describe(name, () => {
      let grid: DropdownObjectValuesPage;

      test.beforeEach(async({ page, theme, bundle }) => {
        grid = new DropdownObjectValuesPage(page, theme, bundle);
        await grid.goto();
        await grid.openEditor(EMPTY_ROW, col);
      });

      test('a press alone highlights the option and commits nothing', async() => {
        await grid.pressOption(pressed);

        await expect(grid.highlightedOption()).toHaveText(pressed);
        await expect(grid.option(pressed)).toBeVisible();
        expect(await grid.storedEntryAt(EMPTY_ROW, col)).toBe('null');
      });

      test('a release on the pressed option picks it and closes the list', async() => {
        await grid.pressOption(pressed);
        await grid.releaseOnOption(pressed);

        await expect.poll(() => grid.storedEntryAt(EMPTY_ROW, col)).toBe('entry:PL');
        await expect(grid.option(pressed)).toBeHidden();
      });

      test('a release on another option cancels the pick and leaves the list open', async() => {
        await grid.pressOption(pressed);
        await grid.releaseOnOption(other);

        await expect(grid.option(pressed)).toBeVisible();
        // The highlight went back to where it was before the press, not to either option.
        if (restored === null) {
          await expect(grid.highlightedOption()).toHaveCount(0);
        } else {
          await expect(grid.highlightedOption()).toHaveText(restored);
        }
        expect(await grid.storedEntryAt(EMPTY_ROW, col)).toBe('null');
      });

      test('a release outside the grid cancels the pick, and a later Enter does not commit the pressed option', async({ page }) => {
        await grid.pressOption(pressed);
        await grid.releaseOutsideGrid();

        await expect(grid.option(pressed)).toBeVisible();
        expect(await grid.storedEntryAt(EMPTY_ROW, col)).toBe('null');

        await page.keyboard.press('Enter');

        await expect(grid.option(pressed)).toBeHidden();
        expect(await grid.storedEntryAt(EMPTY_ROW, col)).not.toBe('entry:PL');
      });

      test('a press by the right button picks nothing and leaves no highlight on the option', async() => {
        await grid.pressOption(pressed, 'right');

        await expect(grid.option(pressed)).toBeVisible();
        if (restored === null) {
          await expect(grid.highlightedOption()).toHaveCount(0);
        } else {
          await expect(grid.highlightedOption()).toHaveText(restored);
        }

        await grid.releaseOnOption(pressed, 'right');

        await expect(grid.option(pressed)).toBeVisible();
        expect(await grid.storedEntryAt(EMPTY_ROW, col)).toBe('null');
      });

      test('a plain click picks the option', async() => {
        await grid.pickOption(pressed);

        await expect.poll(() => grid.storedEntryAt(EMPTY_ROW, col)).toBe('entry:PL');
      });

      test('the arrow keys and Enter pick the option', async({ page }) => {
        for (let i = 0; i < arrows; i++) {
          await page.keyboard.press('ArrowDown');
        }

        await expect(grid.highlightedOption()).toHaveText(pressed);

        await page.keyboard.press('Enter');

        await expect.poll(() => grid.storedEntryAt(EMPTY_ROW, col)).toBe('entry:PL');
      });

      test.describe('on a touch screen', () => {
        test.use({ hasTouch: true });

        test('a tap picks the option', async() => {
          await grid.option(pressed).tap();

          await expect.poll(() => grid.storedEntryAt(EMPTY_ROW, col)).toBe('entry:PL');
          await expect(grid.option(pressed)).toBeHidden();
        });
      });
    });
  }
});
