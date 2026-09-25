import { type Locator, type Page, expect } from '@playwright/test';
import { FiltersValueListPage } from './FiltersValueListPage';

/**
 * Escapes a menu label for a `^…$` exact-match regexp.
 *
 * @param {string} label The visible label.
 * @returns {string} The label with regexp special characters escaped.
 */
function escapeRegExp(label: string): string {
  return label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Page Object for keyboard navigation inside the filters dropdown menu: the Tab and Shift+Tab order
 * through the filter components, the way in and out of the value list, the submenu exits, and the
 * menu highlight the loop restores.
 *
 * It extends the value-list page object, whose fixture and menu locators it shares. What it adds is
 * every element the plugin's focus controller (`handsontable/src/plugins/filters/menu/focusController.ts`)
 * can land on, so a spec asserts `toBeFocused()` per hop and never spells a selector. The class hooks are
 * the plugin's own stable names, and the roles come from the elements themselves.
 *
 * The menu is a Handsontable instance of its own, and the value list is another one nested inside one
 * of its cells, so every menu-row locator here is scoped to the menu's OWN table (`:scope > .ht_master`).
 * An unscoped `td.current` would also match the list's focused row.
 */
export class FiltersMenuKeyboardPage extends FiltersValueListPage {
  readonly menuRows: Locator;
  readonly highlightedItem: Locator;
  readonly conditionsMenu: Locator;
  readonly alignmentSubmenu: Locator;
  readonly selectAllLink: Locator;
  readonly clearLink: Locator;
  readonly okButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    super(page, theme, bundle);
    this.menuRows = this.menu.locator(':scope > .ht_master .htCore tbody td');
    this.highlightedItem = this.menu.locator(':scope > .ht_master .htCore tbody td.current');
    // Each condition select owns a `.htFiltersConditionsMenu`; only the opened one is rendered.
    this.conditionsMenu = page.locator('.htFiltersConditionsMenu:visible');
    // `Menu.createContainer()` names a submenu after its item: `<menu class>Sub_<item name>`.
    this.alignmentSubmenu = page.locator('.htDropdownMenuSub_Alignment');
    this.selectAllLink = this.menu.locator('.htUISelectAll a');
    this.clearLink = this.menu.locator('.htUIClearAll a');
    this.okButton = this.menu.locator('.htUIButtonOK input');
    this.cancelButton = this.menu.locator('.htUIButtonCancel input');
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
   * The text input of the condition chosen in the first select. It exists only once a condition
   * that takes an argument is chosen.
   *
   * @returns {Locator} The input element.
   */
  conditionInput(): Locator {
    return this.menu.locator('.htFiltersMenuCondition .htUIInput input').first();
  }

  /**
   * One of the "And" / "Or" radios between the two conditions. They are rendered only once the
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
}
