import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { arrayEach } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { CommandExecutor } from './commandExecutor';
import { ItemsFactory } from './itemsFactory';
import {
  Menu,
} from './menu';
import { getDocumentOffsetByElement } from './utils';
import { eventTargetEl, hasClass, isHTMLElement } from '../../helpers/dom/element';
import {
  ROW_ABOVE,
  ROW_BELOW,
  COLUMN_LEFT,
  COLUMN_RIGHT,
  REMOVE_ROW,
  REMOVE_COLUMN,
  UNDO,
  REDO,
  READ_ONLY,
  ALIGNMENT,
  SEPARATOR,
} from './predefinedItems';

export type PredefinedMenuItemKey =
  | 'row_above' | 'row_below' | 'col_left' | 'col_right'
  | '---------' | 'remove_row' | 'remove_col' | 'clear_column' | 'undo' | 'redo'
  | 'make_read_only' | 'alignment' | 'cut' | 'copy' | 'copy_column_headers_only'
  | 'copy_with_column_group_headers' | 'copy_with_column_headers' | 'freeze_column'
  | 'unfreeze_column' | 'borders' | 'commentsAddEdit' | 'commentsRemove' | 'commentsReadOnly'
  | 'mergeCells' | 'add_child' | 'detach_from_parent' | 'hidden_columns_hide' | 'hidden_columns_show'
  | 'hidden_rows_hide' | 'hidden_rows_show' | 'filter_by_condition' | 'filter_operators'
  | 'filter_by_condition2' | 'filter_by_value' | 'filter_action_bar';

export interface MenuItemConfig {
  key?: string;
  name: string | (() => string);
  hidden?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  callback?: (key: string, selection: unknown[], clickEvent: MouseEvent) => void;
  renderer?: (
    hot: unknown, wrapper: HTMLElement, row: number, col: number, prop: string | number, itemValue: string
  ) => HTMLElement;
  submenu?: { items: MenuItemConfig[] };
  [key: string]: unknown;
}

export const PLUGIN_KEY = 'contextMenu';
export const PLUGIN_PRIORITY = 70;
const SHORTCUTS_GROUP = PLUGIN_KEY;

Hooks.getSingleton().register('afterContextMenuDefaultOptions');
Hooks.getSingleton().register('beforeContextMenuShow');
Hooks.getSingleton().register('afterContextMenuShow');
Hooks.getSingleton().register('afterContextMenuHide');
Hooks.getSingleton().register('afterContextMenuExecute');

/**
 * @class ContextMenu
 * @description
 * This plugin creates the Handsontable Context Menu. It allows to create a new row or column at any place in the
 * grid among [other features](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options).
 * Possible values:
 * * `true` (to enable default options),
 * * `false` (to disable completely)
 * * `{ uiContainer: containerDomElement }` (to declare a container for all of the Context Menu's dom elements to be placed in).
 * * An array of [the available strings](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
 *
 * See [the context menu demo](@/guides/accessories-and-menus/context-menu/context-menu.md) for examples.
 *
 * @example
 * ```js
 * // as a boolean
 * contextMenu: true
 * // as a array
 * contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo']
 * ```
 *
 * @plugin ContextMenu
 */
export class ContextMenu extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the list of plugin dependencies required before this plugin can be initialized.
   */
  static get PLUGIN_DEPS() {
    return [
      'plugin:AutoColumnSize',
    ];
  }

  /**
   * Context menu default items order when `contextMenu` options is set as `true`.
   *
   * @returns {string[]}
   */
  static get DEFAULT_ITEMS() {
    return [
      ROW_ABOVE, ROW_BELOW,
      SEPARATOR,
      COLUMN_LEFT, COLUMN_RIGHT,
      SEPARATOR,
      REMOVE_ROW, REMOVE_COLUMN,
      SEPARATOR,
      UNDO, REDO,
      SEPARATOR,
      READ_ONLY,
      SEPARATOR,
      ALIGNMENT,
    ];
  }

  /**
   * Instance of {@link CommandExecutor}.
   *
   * @private
   * @type {CommandExecutor}
   */
  commandExecutor = new CommandExecutor(this.hot);
  /**
   * Instance of {@link ItemsFactory}.
   *
   * @private
   * @type {ItemsFactory}
   */
  itemsFactory: ItemsFactory | null = null;
  /**
   * Instance of {@link Menu}.
   *
   * @private
   * @type {Menu}
   */
  menu: Menu | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ContextMenu#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    const settings = this.hot.getSettings()[PLUGIN_KEY];
    const settingsObj = (typeof settings === 'object' && settings !== null && !Array.isArray(settings))
      ? settings as Record<string, unknown>
      : null;

    if (settingsObj && typeof settingsObj.callback === 'function') {
      this.commandExecutor.setCommonCallback(settingsObj.callback);
    }

    this.menu = new Menu(this.hot, {
      className: 'htContextMenu',
      keepInViewport: true,
      container: (settingsObj?.uiContainer as HTMLElement) || this.hot.rootPortalElement,
    });

    this.menu.addLocalHook('afterOpen', this.#onMenuAfterOpen);
    this.menu.addLocalHook('afterClose', this.#onMenuAfterClose);
    this.menu.addLocalHook('executeCommand', (...params: unknown[]) => {
      this.executeCommand.call(this, ...params as [string, ...unknown[]]);
    });

    this.addHook('afterOnCellContextMenu', this.#onAfterOnCellContextMenu);
    this.addHook('beforeDialogShow', () => this.close());

    this.registerShortcuts();
    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`contextMenu`](@/api/options.md#contextmenu)
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    this.close();

    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }

    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for toggling context menu.
   *
   * @private
   */
  registerShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.addShortcut({
        keys: [['Control/Meta', 'Shift', 'Backslash'], ['Shift', 'F10']],
        callback: () => {
          const activeRange = this.hot.getSelectedRangeActive();

          if (!activeRange) {
            return;
          }

          const { highlight } = activeRange;

          if (highlight.row === null || highlight.col === null) {
            return;
          }

          this.hot.scrollToFocusedCell();

          const cell = this.hot.getCell(highlight.row, highlight.col, true);

          if (!cell) {
            return;
          }

          const rect = cell.getBoundingClientRect();
          const offset = getDocumentOffsetByElement(this.menu!.container, this.hot.rootDocument);

          this.open({
            left: rect.left + offset.left,
            top: rect.top + offset.top - 1 + rect.height,
          }, {
            left: rect.width,
            above: -rect.height,
          });
          // Make sure the first item is selected (role=menuitem). Otherwise, screen readers
          // will block the Esc key for the whole menu.
          this.menu!.getNavigator()!.toFirstItem();
        },
        runOnlyIf: () => {
          const highlight = this.hot.getSelectedRangeActive()?.highlight;

          return !!highlight && this.hot.selection.isCellVisible(highlight) && !this.menu!.isOpened();
        },
        group: SHORTCUTS_GROUP,
      });
  }

  /**
   * Unregister shortcuts responsible for toggling context menu.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Opens the menu and positions it based on the passed coordinates.
   *
   * @param {{ top: number, left: number }|Event} position An object with `top` and `left` properties
   * (coordinates relative to the browser viewport, without scroll offsets), or a native browser
   * `Event` instance (e.g., a `MouseEvent`).
   * @param {{ above: number, below: number, left: number, right: number }} offset An object that applies
   * an offset to the menu position.
   * @fires Hooks#beforeContextMenuShow
   * @fires Hooks#afterContextMenuShow
   * @example
   * ```js
   * const menu = hot.getPlugin('contextMenu');
   *
   * hot.selectCell(0, 0);
   * menu.open({ top: 50, left: 50 });
   * ```
   */
  open(
    position: Record<string, number> | Event,
    offset: { above?: number; below?: number; left?: number; right?: number } = {
      above: 0, below: 0, left: 0, right: 0
    }
  ): void {
    if (this.menu?.isOpened()) {
      return;
    }

    // Fire the user-facing hook before any menu state is committed. If a listener calls
    // `updateSettings({ contextMenu })`, the plugin reinitializes synchronously, and the
    // open flow below proceeds on the fresh `this.menu` instance with the new items.
    this.hot.runHooks('beforeContextMenuShow', this);

    this.prepareMenuItems();
    this.menu!.open();

    objectEach(offset, (value: number, key: string) => {
      this.menu!.setOffset(key, value);
    });

    this.menu!.setPosition(position);
  }

  /**
   * Closes the menu.
   */
  close(): void {
    this.menu?.close();
    this.itemsFactory = null;
  }

  /**
   * Execute context menu command.
   *
   * The `executeCommand()` method works only for selected cells.
   *
   * When no cells are selected, `executeCommand()` doesn't do anything.
   *
   * You can execute all predefined commands:
   *  * `'row_above'` - Insert row above
   *  * `'row_below'` - Insert row below
   *  * `'col_left'` - Insert column left
   *  * `'col_right'` - Insert column right
   *  * `'clear_column'` - Clear selected column
   *  * `'remove_row'` - Remove row
   *  * `'remove_col'` - Remove column
   *  * `'undo'` - Undo last action
   *  * `'redo'` - Redo last action
   *  * `'make_read_only'` - Make cell read only
   *  * `'alignment:left'` - Alignment to the left
   *  * `'alignment:top'` - Alignment to the top
   *  * `'alignment:right'` - Alignment to the right
   *  * `'alignment:bottom'` - Alignment to the bottom
   *  * `'alignment:middle'` - Alignment to the middle
   *  * `'alignment:center'` - Alignment to the center (justify).
   *
   * Or you can execute command registered in settings where `key` is your command name.
   *
   * @param {string} commandName The command name to be executed.
   * @param {*} params Additional parameters passed to command executor module.
   */
  executeCommand(commandName: string, ...params: unknown[]): void {
    if (this.itemsFactory === null) {
      this.prepareMenuItems();
    }

    this.commandExecutor.execute(commandName, ...params);
  }

  /**
   * Prepares available contextMenu's items list and registers them in commandExecutor.
   *
   * @private
   * @fires Hooks#afterContextMenuDefaultOptions
   * @fires Hooks#beforeContextMenuSetItems
   */
  prepareMenuItems() {
    this.itemsFactory = new ItemsFactory(this.hot, ContextMenu.DEFAULT_ITEMS);

    const settings = this.hot.getSettings()[PLUGIN_KEY];
    const predefinedItems = {
      items: this.itemsFactory.getItems(settings)
    };

    this.hot.runHooks('afterContextMenuDefaultOptions', predefinedItems);

    this.itemsFactory.setPredefinedItems(predefinedItems.items);
    const menuItems = this.itemsFactory.getItems(settings);

    this.hot.runHooks('beforeContextMenuSetItems', menuItems);

    this.menu!.setMenuItems(menuItems);

    // Register all commands. Predefined and added by user or by plugins
    arrayEach(menuItems, (command) => {
      this.commandExecutor.registerCommand(
        String((command as Record<string, unknown>).key ?? ''), command as Record<string, unknown>
      );
    });
  }

  /**
   * On contextmenu listener.
   *
   * @param {Event} event The mouse event object.
   */
  #onAfterOnCellContextMenu = (event: Event) => {
    const settings = this.hot.getSettings();
    const showRowHeaders = settings.rowHeaders;
    const showColHeaders = settings.colHeaders;

    /**
     * @private
     * @param {HTMLElement} element The element to validate.
     * @returns {boolean}
     */
    function isValidElement(element: HTMLElement) {
      const parent = element.parentNode;

      return element.nodeName === 'TD' || (isHTMLElement(parent) && parent.nodeName === 'TD');
    }
    const element = eventTargetEl(event)!;

    this.close();

    if (hasClass(element, 'handsontableInput')) {
      return;
    }

    event.preventDefault();
    (event as MouseEvent).stopPropagation();

    if (!(showRowHeaders || showColHeaders)) {
      if (!isValidElement(element) && !(hasClass(element, 'current') && hasClass(element, 'wtBorder'))) {
        return;
      }
    }

    const offset = getDocumentOffsetByElement(this.menu!.container, this.hot.rootDocument);

    this.open({
      top: (event as MouseEvent).clientY + offset.top,
      left: (event as MouseEvent).clientX + offset.left,
    });
  };

  /**
   * On menu after open listener.
   */
  #onMenuAfterOpen = () => {
    this.hot.runHooks('afterContextMenuShow', this);
  };

  /**
   * On menu after close listener.
   */
  #onMenuAfterClose = () => {
    this.hot.listen();
    this.hot.runHooks('afterContextMenuHide', this);
  };

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.close();

    if (this.menu) {
      this.menu.destroy();
    }
    super.destroy();
  }
}

(ContextMenu as unknown as Record<string, unknown>).SEPARATOR = {
  name: SEPARATOR
};
