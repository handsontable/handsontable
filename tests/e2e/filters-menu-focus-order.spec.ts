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
 * elements: a stand-in for the menu itself, then every component's elements in menu order. The
 * controller skips elements that are not visible, so the "And" / "Or" radios and the second condition
 * join the order only after you choose the first condition, and ArrowDown from the search input, not
 * Tab, enters the value list.
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

    // Choosing a condition moves the focus to its input on a timer, so the test asserts the next hop
    // instead of assuming it.
    await grid.chooseConditionWithKeyboard('Contains');
    await expect(grid.conditionInput(0)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(grid.operatorRadio('And')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(grid.operatorRadio('Or')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(grid.conditionSelect(1)).toBeFocused();

    // The second condition's input joins the order the same way, right after its select.
    await grid.chooseConditionWithKeyboard('Contains');
    await expect(grid.conditionInput(1)).toBeFocused();

    const rest = [grid.searchInput, grid.selectAllLink, grid.clearLink, grid.okButton, grid.cancelButton];

    for (const stop of rest) {
      await page.keyboard.press('Tab');
      await expect(stop).toBeFocused();
    }

    // Past "Cancel" the focus returns to the menu itself, with the item the loop started from
    // highlighted again (#10603)...
    await page.keyboard.press('Tab');
    await expect(grid.highlightedItem).toHaveText('Clear column');
    await expect(grid.cancelButton).not.toBeFocused();

    // ...and the arrow keys are the menu's again. The highlight is one half of the restore and the
    // shortcut context the other, and only a key press tells the two apart.
    await page.keyboard.press('ArrowDown');
    await expect(grid.highlightedItem).toHaveText('Read only');
    await page.keyboard.press('ArrowUp');
    await expect(grid.highlightedItem).toHaveText('Clear column');

    // And the order starts over.
    await page.keyboard.press('Tab');
    await expect(grid.conditionSelect(0)).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);
  });

  test('a condition with two inputs makes both of them Tab stops', async({ page, theme, bundle }) => {
    // A text column has no two-argument condition, so this one opens the numeric "Amount" column of
    // the value-order fixture, where "Is between" takes a lower and an upper bound.
    const numeric = new FiltersMenuKeyboardPage(page, theme, bundle, 'filters-value-order.html');

    await numeric.goto();
    await numeric.openMenuWithKeyboard(0, 2);
    await page.keyboard.press('Tab');
    await expect(numeric.conditionSelect(0)).toBeFocused();

    await numeric.chooseConditionWithKeyboard('Is between');
    await expect(numeric.conditionInput(0, 0)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(numeric.conditionInput(0, 1)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(numeric.operatorRadio('And')).toBeFocused();
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

  test('Escape from any component closes the menu and keeps the column selection the open made', async({ page }) => {
    // Opening the menu from the keyboard selects the whole column (`selectColumns()` in the
    // DropdownMenu plugin), with the focus cell clamped to row 0. Escape closes the menu and touches
    // no selection, so the grid keeps exactly that; it does not go back to the single cell the open
    // started from.
    const columnSelection = [[-1, 0, 4, 0]];

    // The six stops of a menu with no condition chosen: the select, the search input, the two links,
    // and the two buttons.
    for (let stops = 1; stops <= 6; stops++) {
      await grid.openMenuWithKeyboard(0, 0);
      await grid.pressTab(stops);
      await expect(grid.highlightedItem).toHaveCount(0);

      await page.keyboard.press('Escape');
      await expect(grid.menu).toBeHidden();
      expect(await grid.selectedRanges(), `after Escape from stop ${stops}`).toEqual(columnSelection);
      expect(await grid.selectedCell(), `after Escape from stop ${stops}`).toEqual([0, 0]);
    }

    // Inside the value list Escape is the list's own shortcut, which cancels the menu the way the
    // "Cancel" button does.
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Checked Alice')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(grid.menu).toBeHidden();
    expect(await grid.selectedRanges(), 'after Escape from the value list').toEqual(columnSelection);

    // And once the loop has handed the focus back to the menu, Escape is the menu's own shortcut.
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(7);
    await expect(grid.highlightedItem).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(grid.menu).toBeHidden();
    expect(await grid.selectedRanges(), 'after Escape from the menu itself').toEqual(columnSelection);
  });

  test('Enter on a component keeps the menu open; Enter on "OK" applies the filter', async({ page }) => {
    await grid.openMenuWithKeyboard(0, 0);
    await page.keyboard.press('Tab');
    await grid.chooseConditionWithKeyboard('Contains');
    await expect(grid.conditionInput(0)).toBeFocused();

    await page.keyboard.type('li');
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();
    await expect(grid.conditionInput(0)).toHaveValue('li');

    await page.keyboard.press('Tab');
    await expect(grid.operatorRadio('And')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();

    // Enter is left to the radio itself, and a radio ignores it: "And" stays checked.
    await page.keyboard.press('Tab');
    await expect(grid.operatorRadio('Or')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();
    await expect(grid.operatorRadio('And')).toBeChecked();

    // The second select, then the search input.
    await grid.pressTab(2);
    await expect(grid.searchInput).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeVisible();

    // "Select all", "Clear", then "OK".
    await grid.pressTab(3);
    await expect(grid.okButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeHidden();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie']);
    // The filtered column's header is marked, and the focus is back on the grid's focus cell.
    await expect(grid.activeFilterHeaders).toHaveCount(1);
    await expect(grid.cell(0, 0)).toBeFocused();
  });

  test('with navigable headers, Enter on "OK" returns the focus to the filtered column\'s header', async({ page }) => {
    // With `navigableHeaders` on, the keyboard open keeps the highlight on the column header instead of
    // clamping it to row 0, so closing the menu focuses the header cell. The visual demo runs this way,
    // and its retired capture asserted exactly this before it photographed the filtered header.
    await grid.updateSettings('{ navigableHeaders: true }');
    await grid.openMenuWithKeyboard(0, 0);
    await page.keyboard.press('Tab');
    await grid.chooseConditionWithKeyboard('Contains');
    await expect(grid.conditionInput(0)).toBeFocused();
    await page.keyboard.type('li');

    // "And", "Or", the second select, the search input, "Select all", "Clear", then "OK".
    await grid.pressTab(7);
    await expect(grid.okButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.menu).toBeHidden();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie']);
    await expect(grid.activeFilterHeaders).toBeFocused();
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

  test('a value the list shows only in part scrolls fully into view when the focus reaches it', async({ page }) => {
    // Twenty values, so the list, a few rows tall on every theme, cannot show them all at once.
    await grid.replaceData(Array.from({ length: 20 },
      (_, index) => [`Name ${String(index + 1).padStart(2, '0')}`, 'Blue']));
    await expect(grid.cell(0, 0)).toHaveText('Name 01');
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await expect(grid.searchInput).toBeFocused();

    expect(await grid.listItemFullyInView('Name 11'), 'the target starts outside the list\'s view').toBe(false);

    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Checked Name 01')).toBeFocused();

    for (let step = 0; step < 10; step++) {
      await page.keyboard.press('ArrowDown');
    }

    await expect(grid.listItem('Checked Name 11')).toBeFocused();
    await expect.poll(() => grid.listItemFullyInView('Name 11')).toBe(true);
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

  test('hovering a plain menu row moves neither the focus nor the next Tab stop', async({ page }) => {
    // Hovering a menu row arms the submenu timers and re-bases the menu's page cursor
    // (`beforeOnCellMouseOver` in `handsontable/src/plugins/contextMenu/menu/menu.ts`); it never moves
    // the highlight, which follows the keyboard only (a mouseover selects a cell only while the button
    // is down). So the focused component and the next Tab stop stay where they were. The cursor shows
    // once: the next Tab records it as the item the loop restores (#10603), so the loop ends on the
    // hovered row instead of the first item, and the control below pins that difference.
    //
    // A hover used to select the row, which reset the Tab order to the first component: #11669 (June
    // 2025) stopped that for the themes and #11950 (February 2026) for the classic delivery path. The
    // visual spec `hovering-clears-the-focus-state` was written against the old product, kept its
    // name after its goldens were re-approved on the new behavior, and was retired by #13647.
    await grid.openMenu('Name');

    // A menu opened with the pointer highlights nothing, so without a hover the loop ends on the
    // first item.
    await grid.pressTab(7);
    await expect(grid.highlightedItem).toHaveText('Insert column left');
    await grid.escapeMenu();

    await grid.openMenu('Name');
    await grid.pressTab(3);
    await expect(grid.selectAllLink).toBeFocused();

    await grid.menuItem('Clear column').hover();
    await expect(grid.selectAllLink).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);

    await page.keyboard.press('Tab');
    await expect(grid.clearLink).toBeFocused();
    await expect(grid.highlightedItem).toHaveCount(0);

    // "OK", "Cancel", then the menu: the loop returns to the hovered row.
    await grid.pressTab(3);
    await expect(grid.highlightedItem).toHaveText('Clear column');
  });

  test('hovering a submenu row opens the submenu, which takes the focus', async() => {
    // The submenu opens on the hover timer and, like any menu, focuses itself when it opens, so a
    // pointer resting on "Alignment" does move the focus. `toBeVisible()` waits the timer out.
    await grid.openMenu('Name');
    await grid.pressTab(3);
    await expect(grid.selectAllLink).toBeFocused();

    await grid.menuItem('Alignment').hover();
    await expect(grid.alignmentSubmenu).toBeVisible();
    await expect(grid.alignmentSubmenu).toBeFocused();
    await expect(grid.selectAllLink).not.toBeFocused();
  });
});
