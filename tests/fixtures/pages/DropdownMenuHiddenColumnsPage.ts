import { type Page, type Locator, expect } from '@playwright/test';
import { type ConsoleWarnings } from '../consoleWarnings';
import * as menuItems from './menuItems';
import { awaitBundle, type Bundle } from '../bundle';

type HotHandle = {
  getColHeader: () => string[];
  getDataAtCol: (column: number) => string[];
  getPlugin: (name: string) => {
    getHiddenColumns: () => number[];
    executeCommand: (command: string) => void;
  };
  selectCell: (row: number, column: number) => void;
  selectColumns: (start: number) => void;
};

type HotsWindow = { hots: Record<string, HotHandle> };

/**
 * Page Object for the "hidden_columns_hide / hidden_columns_show as dropdown menu keys" fixture.
 *
 * The fixture holds seven grids, addressed by the ids below. The page object exposes what the
 * dropdown menu renders for the two HiddenColumns keys, which columns the grid hides, and the
 * console warning an unresolved menu key raises.
 */
export class DropdownMenuHiddenColumnsPage {
  /**
   * Both keys listed explicitly in `dropdownMenu`, after `col_left`.
   */
  static readonly CUSTOM_KEYS = 'custom-keys';
  /**
   * `dropdownMenu: true` with `hiddenColumns` on.
   */
  static readonly DEFAULT_MENU = 'default-menu';
  /**
   * `contextMenu: true` with `hiddenColumns` on, the regression control.
   */
  static readonly CONTEXT_CONTROL = 'context-control';
  /**
   * `dropdownMenu: ['hidden_columns_hide']` with `hiddenColumns` off.
   */
  static readonly PLUGIN_OFF = 'plugin-off';
  /**
   * The keys of `custom-keys`, with Delta hidden from the start.
   */
  static readonly STARTS_HIDDEN = 'starts-hidden';
  /**
   * `hidden_columns_hide` in the object form of `dropdownMenu`, with a custom label.
   */
  static readonly OBJECT_FORM = 'object-form';
  /**
   * `dropdownMenu: true`, with an `afterDropdownMenuDefaultOptions` listener added after the grid was
   * built that replaces the items with copies.
   */
  static readonly COPY_LISTENER = 'copy-listener';

  /**
   * Every grid the fixture builds.
   */
  static readonly ALL_GRIDS = [
    DropdownMenuHiddenColumnsPage.CUSTOM_KEYS,
    DropdownMenuHiddenColumnsPage.DEFAULT_MENU,
    DropdownMenuHiddenColumnsPage.CONTEXT_CONTROL,
    DropdownMenuHiddenColumnsPage.PLUGIN_OFF,
    DropdownMenuHiddenColumnsPage.STARTS_HIDDEN,
    DropdownMenuHiddenColumnsPage.OBJECT_FORM,
    DropdownMenuHiddenColumnsPage.COPY_LISTENER,
  ];

  /**
   * The translated labels of the two entries for a single column.
   */
  static readonly HIDE_LABEL = 'Hide column';
  static readonly SHOW_LABEL = 'Show column';

  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigates, rethrows a grid constructor error, and waits for every grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/dropdown-menu-hidden-columns.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    for (const gridId of DropdownMenuHiddenColumnsPage.ALL_GRIDS) {
      const initError = await this.grid(gridId).getAttribute('data-init-error');

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of DropdownMenuHiddenColumnsPage.ALL_GRIDS) {
      await expect(this.grid(gridId).locator('.ht_master')).toBeVisible();
    }
  }

  /**
   * One of the grid containers.
   */
  grid(gridId: string): Locator {
    return this.page.getByTestId(gridId);
  }

  /**
   * The rendered header cell of a named column in the top overlay.
   */
  renderedHeader(gridId: string, headerName: string): Locator {
    return this.grid(gridId).locator(`.ht_clone_top [data-testid="header-${headerName}"]`);
  }

  /**
   * Opens the column header menu on the column carrying this header name.
   */
  async openColumnMenu(gridId: string, headerName: string): Promise<void> {
    await this.renderedHeader(gridId, headerName).locator('.changeType').click();
    await expect(this.openMenu('.htDropdownMenu')).toBeVisible();
  }

  /**
   * Opens the context menu on a column header, which also selects that column. The hide and show
   * entries offer themselves only for a column selected by its header.
   */
  async openContextMenuOnHeader(gridId: string, headerName: string): Promise<void> {
    await this.renderedHeader(gridId, headerName).locator('.colHeader').click({ button: 'right' });
    await expect(this.openMenu('.htContextMenu')).toBeVisible();
  }

  /**
   * Selects a cell through the API, so the keyboard reaches the grid without a pointer press.
   */
  async selectCell(gridId: string, row: number, visualColumn: number): Promise<void> {
    await this.page.evaluate(
      ([id, r, c]) => (window as unknown as HotsWindow).hots[id as string].selectCell(r as number, c as number),
      [gridId, row, visualColumn] as [string, number, number]
    );
  }

  /**
   * The menu that is currently on screen. Each grid keeps its own menu in a body-level portal, so
   * the `:visible` filter resolves to the single open one.
   */
  openMenu(menuSelector: '.htDropdownMenu' | '.htContextMenu'): Locator {
    return menuItems.openMenu(this.page, menuSelector);
  }

  /**
   * A menu row of the open dropdown menu by its role and accessible name.
   */
  dropdownMenuItem(name: string): Locator {
    return this.openMenu('.htDropdownMenu').getByRole('menuitem', { name, exact: true });
  }

  /**
   * The labels of the open dropdown menu's rows that have a box. A hidden item stays in the DOM
   * with zero height, and a separator has no text, so neither is reported.
   */
  async visibleDropdownMenuItems(): Promise<string[]> {
    return this.visibleItemsOf('.htDropdownMenu');
  }

  /**
   * The labels of the open context menu's rows that have a box.
   */
  async visibleContextMenuItems(): Promise<string[]> {
    return this.visibleItemsOf('.htContextMenu');
  }

  private async visibleItemsOf(menuSelector: string): Promise<string[]> {
    return menuItems.visibleItemsOf(this.page, menuSelector);
  }

  /**
   * Starts collecting the unresolved-key console warnings and returns the collector.
   */
  collectUnresolvedKeyWarnings(): ConsoleWarnings {
    return menuItems.collectUnresolvedKeyWarnings(this.page);
  }

  /**
   * Picks one entry from the open dropdown menu by its whole label and waits for the menu to close.
   */
  async clickDropdownMenuItem(label: string): Promise<void> {
    await menuItems.clickMenuItem(this.page, '.htDropdownMenu', label);
  }

  /**
   * Picks one entry from the open context menu by its whole label and waits for the menu to close.
   */
  async clickContextMenuItem(label: string): Promise<void> {
    await menuItems.clickMenuItem(this.page, '.htContextMenu', label);
  }

  /**
   * The visual indexes the HiddenColumns plugin reports as hidden.
   */
  async hiddenColumns(gridId: string): Promise<number[]> {
    return this.page.evaluate(
      id => (window as unknown as HotsWindow).hots[id].getPlugin('hiddenColumns').getHiddenColumns(),
      gridId
    );
  }

  /**
   * One column's data, read through the API.
   */
  async columnData(gridId: string, visualColumn: number): Promise<string[]> {
    return this.page.evaluate(
      ([id, c]) => (window as unknown as HotsWindow).hots[id as string].getDataAtCol(c as number),
      [gridId, visualColumn] as [string, number]
    );
  }

  /**
   * Selects a column by its header and runs a dropdown menu command through the plugin API.
   *
   * @param gridId The grid to drive.
   * @param command The command name.
   * @param visualColumn The column to select first.
   * @returns The message of the error the command threw, or `null` when it ran.
   */
  async executeDropdownCommand(gridId: string, command: string, visualColumn: number): Promise<string | null> {
    return this.page.evaluate(({ id, name, column }) => {
      const hot = (window as unknown as HotsWindow).hots[id];

      hot.selectColumns(column);

      try {
        hot.getPlugin('dropdownMenu').executeCommand(name);

        return null;
      } catch (error) {
        return String((error as Error).message);
      }
    }, { id: gridId, name: command, column: visualColumn });
  }

}
