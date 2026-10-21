import { type Locator, type Page, expect } from '@playwright/test';
import { FiltersValueListPage, escapeRegExp } from './FiltersValueListPage';

/**
 * Page Object for keyboard navigation inside the filters dropdown menu: the Tab and Shift+Tab order
 * through the filter components, the way in and out of the value list, the submenu exits, and the
 * menu highlight the loop restores.
 *
 * It extends the value-list page object, whose fixture, menu root, conditions menu and action-bar
 * buttons it shares. What it adds is every other element the plugin's focus controller
 * (`handsontable/src/plugins/filters/menu/focusController.ts`) can land on, so a spec asserts
 * `toBeFocused()` per hop and never spells a selector. The class hooks are the plugin's own stable
 * names, and the roles come from the elements themselves.
 *
 * The menu is a Handsontable instance of its own, and the value list is another one nested inside one
 * of its cells, so every menu-row locator here is scoped to the menu's OWN table (`:scope > .ht_master`).
 * An unscoped `td.current` would also match the list's focused row. A submenu is a third instance,
 * whose container carries the menu's class as well; the base class's `menu` root leaves those
 * containers out, so `highlightedItem` never reads a submenu's row while one exists.
 */
export class FiltersMenuKeyboardPage extends FiltersValueListPage {
  readonly menuRows: Locator;
  readonly highlightedItem: Locator;
  readonly alignmentSubmenu: Locator;
  readonly selectAllLink: Locator;
  readonly clearLink: Locator;
  readonly activeFilterHeaders: Locator;

  /**
   * Builds the page object for one fixture, theme and bundle.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The active theme.
   * @param {string} bundle The active bundle.
   * @param {string} fixture The fixture file to open. The default has text columns only; the
   *   value-order fixture adds a numeric "Amount" column, whose conditions include the two-input
   *   "Is between".
   */
  constructor(page: Page, theme = 'main', bundle = 'umd', fixture = 'filters-value-list.html') {
    super(page, theme, bundle, fixture);
    this.menuRows = this.menu.locator(':scope > .ht_master .htCore tbody td');
    this.highlightedItem = this.menu.locator(':scope > .ht_master .htCore tbody td.current');
    // `Menu.createContainer()` names a submenu after its item: `<menu class>Sub_<item name>`.
    this.alignmentSubmenu = page.locator('.htDropdownMenuSub_Alignment');
    this.selectAllLink = this.menu.locator('.htUISelectAll a');
    this.clearLink = this.menu.locator('.htUIClearAll a');
    // The class the plugin puts on the header cell of a filtered column.
    this.activeFilterHeaders = page.locator('.ht_clone_top th.htFiltersActive');
  }

  /**
   * One of the two "Filter by condition" selects, in menu order.
   *
   * @param {number} index 0 for the first condition, 1 for the second.
   * @returns {Locator} The select's root, which is what the plugin focuses.
   */
  conditionSelect(index: number): Locator {
    return this.menu.locator('.htFiltersMenuCondition .htUISelect').nth(index);
  }

  /**
   * A text input of one of the two condition components. A one-argument condition shows one input, at
   * position 0; the two-argument "Is between" shows a second one, at position 1. The component keeps
   * every input it can show in the DOM and hides the ones the chosen condition does not take, so the
   * position counts rendered inputs, not visible ones. A hidden input is never a Tab stop.
   *
   * @param {number} condition 0 for the first condition component, 1 for the second.
   * @param {number} [position] The input's position inside that component.
   * @returns {Locator} The input element.
   */
  conditionInput(condition: number, position = 0): Locator {
    return this.menu.locator('.htFiltersMenuCondition').nth(condition).locator('.htUIInput input').nth(position);
  }

  /**
   * One of the "And" / "Or" radios between the two conditions. The menu renders them only while the
   * first condition is not "None".
   *
   * @param {'And' | 'Or'} name The radio's label.
   * @returns {Locator} The radio input.
   */
  operatorRadio(name: 'And' | 'Or'): Locator {
    return this.menu.getByRole('radio', { name, exact: true });
  }

  /**
   * A row of the value list, named by its checkbox state and its value, the way the list's
   * accessible names read: `Checked Alice`, `Unchecked Alice`.
   *
   * @param {string} name The accessible name.
   * @returns {Locator} The list cell.
   */
  listItem(name: string): Locator {
    return this.menu.getByRole('gridcell', { name, exact: true });
  }

  /**
   * A row of the menu itself, by its visible label.
   *
   * @param {string} label The item's label, e.g. `Clear column`.
   * @returns {Locator} The menu cell.
   */
  menuItem(label: string): Locator {
    return this.menuRows.filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) });
  }

  /**
   * Presses Tab (or Shift+Tab) the given number of times.
   *
   * @param {number} count How many presses.
   * @param {boolean} [backwards] Shift+Tab instead of Tab.
   */
  async pressTab(count: number, backwards = false): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
    }
  }

  /**
   * Walks the menu highlight down to the item with the given label, and fails loudly if ArrowDown
   * never reaches it, so a later assertion cannot blame the submenu or the focus order for a
   * navigation that stopped short.
   *
   * @param {string} label The item's visible label.
   */
  async highlightItem(label: string): Promise<void> {
    const wanted = new RegExp(`^${escapeRegExp(label)}$`);

    for (let i = 0; i < 20; i++) {
      if (wanted.test((await this.highlightedItem.innerText()).trim())) {
        return;
      }

      await this.page.keyboard.press('ArrowDown');
    }

    throw new Error(`ArrowDown never reached the ${JSON.stringify(label)} menu item`);
  }

  /**
   * Chooses a condition in the focused select from the keyboard: Enter opens its options, ArrowDown
   * walks to the wanted one, Enter accepts it. The caller asserts where the focus lands next.
   *
   * @param {string} label The condition's visible label, e.g. `Contains`.
   */
  async chooseConditionWithKeyboard(label: string): Promise<void> {
    const wanted = new RegExp(`^${escapeRegExp(label)}$`);
    const highlighted = this.conditionsMenu.locator('td.current');

    await this.page.keyboard.press('Enter');
    await expect(this.conditionsMenu).toBeVisible();

    for (let i = 0; i < 20; i++) {
      if ((await highlighted.count()) === 1 && wanted.test((await highlighted.innerText()).trim())) {
        await this.page.keyboard.press('Enter');
        await expect(this.conditionsMenu).toBeHidden();

        return;
      }

      await this.page.keyboard.press('ArrowDown');
    }

    throw new Error(`ArrowDown never reached the ${JSON.stringify(label)} condition`);
  }

  /**
   * The grid cell the keyboard would act on, as `[row, column]`, or `null` with nothing selected.
   *
   * @returns {Promise<number[] | null>} The selection's highlight.
   */
  async selectedCell(): Promise<number[] | null> {
    return this.page.evaluate(() => {
      const range = (window as unknown as {
        hot: { getSelectedRangeLast(): { highlight: { row: number; col: number } } | undefined };
      }).hot.getSelectedRangeLast();

      return range ? [range.highlight.row, range.highlight.col] : null;
    });
  }

  /**
   * Whether the value-list row holding the given value sits inside the list's viewport from top to
   * bottom. It reads in one evaluation on the list's holder, which the grid never recycles, and finds
   * the row inside that same evaluation, so a re-render between two round trips cannot swap the row out
   * from under the measurement. A row the list has not rendered is not in view.
   *
   * @param {string} value The row's value, e.g. `Name 11`.
   * @returns {Promise<boolean>} True when the whole row is in view.
   */
  async listItemFullyInView(value: string): Promise<boolean> {
    return this.menu.locator('.htUIMultipleSelect .ht_master .wtHolder').evaluate((holder, text) => {
      const view = holder.getBoundingClientRect();
      const viewBottom = view.top + holder.clientHeight;
      const row = Array.from(holder.querySelectorAll('tbody td'))
        .find(cell => cell.textContent?.trim() === text);

      if (!row) {
        return false;
      }

      const box = row.getBoundingClientRect();

      return box.top >= view.top - 0.5 && box.bottom <= viewBottom + 0.5;
    }, value);
  }

  /**
   * Every selected range, as the grid reports it: `[rowStart, columnStart, rowEnd, columnEnd]`, with
   * `-1` standing for a header. Empty with nothing selected.
   *
   * @returns {Promise<number[][]>} The ranges.
   */
  async selectedRanges(): Promise<number[][]> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getSelected(): number[][] | undefined };
    }).hot.getSelected() ?? []);
  }
}
