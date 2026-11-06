import { type Locator } from '@playwright/test';
import { PluginUiTeardownPage } from './PluginUiTeardownPage';

/**
 * Page object for the column header markup that DropdownMenu, ColumnSorting and MultiColumnSorting
 * draw, on the plugin-ui-teardown fixture. The header rows are read from the top clone, the copy of
 * the headers a user sees.
 */
export class HeaderPluginMarkupPage extends PluginUiTeardownPage {
  /**
   * The column headers of the top clone, the copy a user sees.
   */
  shownHeaders(): Locator {
    return this.grid().locator('.ht_clone_top thead');
  }

  /**
   * The top or the bottom header row of the top clone.
   */
  headerRow(position: 'top' | 'bottom'): Locator {
    return this.grid().locator(`.ht_clone_top thead tr:${position === 'top' ? 'first' : 'last'}-child`);
  }

  /**
   * The header label with the given text, in the top clone.
   */
  headerLabel(text: string): Locator {
    return this.grid().locator('.ht_clone_top thead span.colHeader').getByText(text, { exact: true });
  }

  /**
   * The DropdownMenu buttons inside the scope, the whole grid by default.
   */
  menuButtons(scope: Locator = this.grid()): Locator {
    return scope.locator('.changeType');
  }

  /**
   * The header labels styled as sortable inside the scope, the whole grid by default.
   */
  sortableLabels(scope: Locator = this.grid()): Locator {
    return scope.locator('span.colHeader.columnSorting');
  }

  /**
   * The header labels that show a sort order, in the whole grid.
   */
  sortedLabels(): Locator {
    return this.grid().locator('span.colHeader.ascending, span.colHeader.descending');
  }

  /**
   * The header labels that show a MultiColumnSorting order badge (`sort-1`, `sort-2`, ...), in the
   * whole grid.
   */
  orderBadges(): Locator {
    return this.grid().locator('span.colHeader[class*="sort-"]');
  }

  /**
   * The sort indicator icons inside the scope, the whole grid by default.
   */
  sortIndicators(scope: Locator = this.grid()): Locator {
    return scope.locator('.ht-sort-indicator');
  }

  /**
   * The header containers that reserve room for a sort indicator, in the whole grid.
   */
  indicatorContainers(): Locator {
    return this.grid().locator('.has-sort-indicator');
  }
}
