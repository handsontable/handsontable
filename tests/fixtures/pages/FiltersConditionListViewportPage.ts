import { type Locator, expect } from '@playwright/test';
import { MenuViewportClampPage, MENU_SELECTOR } from './MenuViewportClampPage';

/**
 * The condition list's box, the viewport it must stay inside, and the select it opens under, read in one
 * evaluation so a scroll or a re-render cannot land between two reads.
 */
export interface ConditionListGeometry {
  left: number;
  top: number;
  bottom: number;
  height: number;
  selectLeft: number;
  selectTop: number;
  viewportHeight: number;
}

const LIST_SELECTOR = MENU_SELECTOR.conditions;

/**
 * Page Object for the Filters condition list on the menu-viewport-clamp fixture. The list is the standalone menu
 * the "Add filter" condition select opens under itself, and a page that cannot scroll (`?page=locked`) is where
 * its end can lie out of reach.
 *
 * The list is opened through the select's own `openOptions()`, because the dropdown menu around it is not capped on
 * a desktop browser, so on a short locked viewport its select can lie below the edge and a click on it would fail
 * for a reason that is not the one under test.
 */
export class FiltersConditionListViewportPage extends MenuViewportClampPage {
  /**
   * The open condition list, without the ghost table the grid measures it with.
   *
   * @returns {Locator} The list container.
   */
  list(): Locator {
    return this.page.locator(LIST_SELECTOR);
  }

  /**
   * The items of the open condition list.
   *
   * @returns {Locator} The list items.
   */
  items(): Locator {
    return this.list().locator('.ht_master tbody td[role="menuitem"]');
  }

  /**
   * The caption of the first condition select in the open dropdown menu, which names the chosen condition.
   *
   * @returns {Locator} The caption label.
   */
  caption(): Locator {
    return this.page.locator('.htDropdownMenu .htFiltersMenuCondition .htUISelectCaptionLabel').first();
  }

  /**
   * Selects the first column, opens its dropdown menu and then the condition list of its first select.
   */
  async openConditionList(): Promise<void> {
    await this.page.evaluate(() => {
      // The component and its select are the plugin's own, not part of its public typings.
      const filters = window.hot.getPlugin('filters') as unknown as {
        components: Map<string, { getSelectElement(): { openOptions(): void } }>;
      };

      window.hot.selectColumns(0);
      window.hot.getPlugin('dropdownMenu').open({ left: 100, top: 20 } as unknown as MouseEvent);
      filters.components.get('filter_by_condition')!.getSelectElement().openOptions();
    });
    await expect(this.list()).toBeVisible();
  }

  /**
   * Closes the condition list and the dropdown menu around it.
   */
  async closeConditionList(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('dropdownMenu').close());
    await expect(this.list()).toBeHidden();
  }

  /**
   * Reads where the open condition list is, in viewport coordinates, with the viewport and the select it
   * opened under.
   *
   * @returns {Promise<ConditionListGeometry>} The list's left and vertical edges, the select's left and top, and the
   * viewport height.
   */
  async listGeometry(): Promise<ConditionListGeometry> {
    return this.page.evaluate((selector) => {
      const list = document.querySelector(selector);
      const select = document.querySelector('.htDropdownMenu .htFiltersMenuCondition .htUISelect');

      if (!list || !select) {
        throw new Error('The condition list or its select is not in the page');
      }

      const { left, top, bottom, height } = list.getBoundingClientRect();

      return {
        left,
        top,
        bottom,
        height,
        selectLeft: select.getBoundingClientRect().left,
        selectTop: select.getBoundingClientRect().top,
        viewportHeight: document.documentElement.clientHeight,
      };
    }, LIST_SELECTOR);
  }
}
