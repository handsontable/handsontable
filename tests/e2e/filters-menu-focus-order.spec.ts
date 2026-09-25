import { test, expect } from '../fixtures/test';
import { FiltersMenuKeyboardPage } from '../fixtures/pages/FiltersMenuKeyboardPage';

/**
 * Keyboard navigation inside the filters dropdown menu.
 *
 * Until this spec, the Tab and Shift+Tab order through the filter components, the way into and out
 * of the value list, the submenu exits, and the menu highlight restored after a full loop (#10603) had
 * no functional test: the 496 filters screenshots in `visual-tests/` were that behavior's only
 * coverage, and a screenshot cannot say which element holds the focus, only what it looks like with
 * it. Every hop here is a `toBeFocused()` assertion, so the golden-set consolidation can retire those
 * captures without losing the guard.
 *
 * The focus controller (`handsontable/src/plugins/filters/menu/focusController.ts`) walks a list of
 * elements: a stand-in for the menu itself, then every component's elements in menu order. Elements
 * that are not visible are skipped, which is why the "And" / "Or" radios and the second condition only
 * appear in the order once the first condition has been chosen, and the value list is entered with
 * ArrowDown from the search input rather than with Tab.
 */
test.describe('filters menu — keyboard focus order', () => {
  let grid: FiltersMenuKeyboardPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersMenuKeyboardPage(page, theme, bundle);

    await grid.goto();
  });

  test('Tab walks every component in order, and the loop restores the menu item it left', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);
    // A non-first item, so the restore at the end of the loop is told apart from "back to the top".
    await grid.highlightItem('Clear column');

    // Entering the components clears the menu highlight: the arrow keys now belong to the component.
    await page.keyboard.press('Tab');
    await expect(grid.conditionSelect(0)).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);

    // Choosing a condition moves the focus to its input on a timer, so the next hop is asserted, not
    // assumed.
    await grid.chooseConditionWithKeyboard('Contains');
    await expect(grid.conditionInput()).toBeFocused();

    const forward = [
      grid.operatorRadio('And'),
      grid.operatorRadio('Or'),
      grid.conditionSelect(1),
      grid.searchInput,
      grid.selectAllLink,
      grid.clearLink,
      grid.okButton,
      grid.cancelButton,
    ];

    for (const stop of forward) {
      await page.keyboard.press('Tab');
      await expect(stop).toBeFocused();
    }

    // Past "Cancel" the focus returns to the menu itself, with the item the loop started from
    // highlighted again (#10603), so the arrow keys work as they did before the first Tab.
    await page.keyboard.press('Tab');
    await expect(grid.highlightedItem).toHaveText('Clear column');
    await expect(grid.cancelButton).not.toBeFocused();

    // And the order starts over.
    await page.keyboard.press('Tab');
    await expect(grid.conditionSelect(0)).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);
  });

  test('Shift+Tab walks the same order backwards', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);

    const opened = (await grid.highlightedItem.innerText()).trim();

    expect(opened, 'a menu opened from the keyboard highlights its first item').not.toBe('');

    // With no condition chosen, the operators and the second condition are hidden, so the order runs
    // from the action bar straight back to the first select.
    const backwards = [
      grid.cancelButton,
      grid.okButton,
      grid.clearLink,
      grid.selectAllLink,
      grid.searchInput,
      grid.conditionSelect(0),
    ];

    for (const stop of backwards) {
      await page.keyboard.press('Shift+Tab');
      await expect(stop).toBeFocused();
    }

    await page.keyboard.press('Shift+Tab');
    await expect(grid.highlightedItem).toHaveText(opened);
    await expect(grid.conditionSelect(0)).not.toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(grid.cancelButton).toBeFocused();
  });

  test('while a component is focused, the arrow keys are its own and move no menu highlight', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);

    // The select, the search input, "Select all", "Clear", then "OK".
    await grid.pressTab(5);
    await expect(grid.okButton).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(grid.okButton).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);
  });

  test('Escape from any component closes the menu and leaves the grid selection where it was', async({ page }) => {
    // The six stops of a menu with no condition chosen: the select, the search input, the two links
    // and the two buttons.
    for (let stops = 1; stops <= 6; stops++) {
      await grid.openMenuWithKeyboard(0, 0);
      await grid.pressTab(stops);
      await expect(grid.highlightedItem).toHaveCount(0);

      await page.keyboard.press('Escape');
      await expect(grid.menu).toBeHidden();
      expect(await grid.selectedCell(), `after Escape from stop ${stops}`).toEqual([0, 0]);
    }
  });

  test('Enter on a component keeps the menu open; Enter on "OK" applies the filter', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);
    await page.keyboard.press('Tab');
    await grid.chooseConditionWithKeyboard('Contains');
    await expect(grid.conditionInput()).toBeFocused();

    await page.keyboard.type('li');
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();
    await expect(grid.conditionInput()).toHaveValue('li');

    await page.keyboard.press('Tab');
    await expect(grid.operatorRadio('And')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();

    // "Or", the second select, then the search input.
    await grid.pressTab(3);
    await expect(grid.searchInput).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();

    // "Select all", "Clear", then "OK".
    await grid.pressTab(3);
    await expect(grid.okButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeHidden();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie']);
  });

  test('ArrowDown from the search input enters the value list, and Tab or Shift+Tab leaves it', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await expect(grid.searchInput).toBeFocused();

    // The list is not a Tab stop of its own; ArrowDown from the search input is the way in.
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Checked Alice')).toBeFocused();
    await expect(grid.focusedListItems()).toHaveCount(1);

    // Space and Enter toggle the focused value and keep the focus on it.
    await page.keyboard.press('Space');
    await expect(grid.listItem('Unchecked Alice')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.listItem('Checked Alice')).toBeFocused();

    // Tab leaves the list forwards, to "OK", and the list drops its focus ring.
    await page.keyboard.press('Tab');
    await expect(grid.okButton).toBeFocused();
    await expect(grid.focusedListItems()).toHaveCount(0);

    // Back in through the search input ("Clear", "Select all", then the input); Shift+Tab leaves the
    // list backwards, to "Clear".
    await grid.pressTab(3, true);
    await expect(grid.searchInput).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Checked Alice')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(grid.clearLink).toBeFocused();
    await expect(grid.focusedListItems()).toHaveCount(0);
  });

  test('Tab from an opened submenu closes it and lands on the first component', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);
    await grid.highlightItem('Alignment');
    await page.keyboard.press('ArrowRight');
    await expect(grid.alignmentSubmenu).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(grid.alignmentSubmenu).toBeHidden();
    await expect(grid.conditionSelect(0)).toBeFocused();
  });

  test('Shift+Tab from an opened submenu closes it and lands on the last component', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);
    await grid.highlightItem('Alignment');
    await page.keyboard.press('ArrowRight');
    await expect(grid.alignmentSubmenu).toBeVisible();

    await page.keyboard.press('Shift+Tab');
    await expect(grid.alignmentSubmenu).toBeHidden();
    await expect(grid.cancelButton).toBeFocused();
  });

  test('a pointer resting on a menu item moves neither the highlight nor the focus order', async({ page }) => {
    // Hovering a menu row opens or closes a submenu on a delay and nothing else: the highlight follows
    // the keyboard only (a mouseover selects a cell only while the button is down), so the pointer can
    // rest anywhere without hijacking the order. The visual spec `hovering-clears-the-focus-state`
    // says the opposite, and its own goldens show this behavior: after the hover, Tab moved on to "Clear".
    await grid.openMenu('Name');
    await grid.pressTab(3);
    await expect(grid.selectAllLink).toBeFocused();

    await grid.menuItem('Clear column').hover();
    await expect(grid.selectAllLink).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);

    await page.keyboard.press('Tab');
    await expect(grid.clearLink).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);
  });
});
