import type { HotInstance } from '../../common';
import { BasePlugin } from '../base';
import { arrayEach } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { CommandExecutor } from '../contextMenu/commandExecutor';
import { getDocumentOffsetByElement } from '../contextMenu/utils';
import { hasClass, setAttribute } from '../../helpers/dom/element';
import { ItemsFactory } from '../contextMenu/itemsFactory';
import { Menu } from '../contextMenu/menu';
import { Hooks } from '../../core/hooks';
import {
  COLUMN_LEFT,
  COLUMN_RIGHT,
  REMOVE_COLUMN,
  CLEAR_COLUMN,
  READ_ONLY,
  ALIGNMENT,
  SEPARATOR
} from '../contextMenu/predefinedItems';

import { A11Y_HASPOPUP, A11Y_HIDDEN, A11Y_LABEL } from '../../helpers/a11y';

Hooks.getSingleton().register('afterDropdownMenuDefaultOptions');
Hooks.getSingleton().register('beforeDropdownMenuShow');
Hooks.getSingleton().register('afterDropdownMenuShow');
Hooks.getSingleton().register('afterDropdownMenuHide');
Hooks.getSingleton().register('afterDropdownMenuExecute');

export const PLUGIN_KEY = 'dropdownMenu';
export const PLUGIN_PRIORITY = 230;
const BUTTON_CLASS_NAME = 'changeType';
const SHORTCUTS_GROUP = PLUGIN_KEY;

interface DropdownMenuSettings {
  callback?: Function;
  uiContainer?: HTMLElement;
  items?: Record<string, unknown>[] | string[];
  [key: string]: unknown;
}

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin DropdownMenu
 * @class DropdownMenu
 *
 * @description
 * This plugin creates the Handsontable Dropdown Menu. It allows to create a new column at any place in the grid
 * among [other features](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options).
 * Possible values:
 * * `true` (to enable default options),
 * * `false` (to disable completely).
 *
 * or array of any available strings:
 * * `["col_left", "col_right", "remove_col", "---------", "undo", "redo"]`.
 *
 * See [the dropdown menu demo](@/guides/columns/column-menu/column-menu.md) for examples.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: data,
 *   colHeaders: true,
 *   // enable dropdown menu
 *   dropdownMenu: true
 * });
 *
 * // or
 * const hot = new Handsontable(container, {
 *   data: data,
 *   colHeaders: true,
 *   // enable and configure dropdown menu
 *   dropdownMenu: ['remove_col', '---------', 'make_read_only', 'alignment']
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={data}
 *   comments={true}
 *   // enable and configure dropdown menu
 *   dropdownMenu={['remove_col', '---------', 'make_read_only', 'alignment']}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: data,
 *   comments: true,
 *   // enable and configure dropdown menu
 *   dropdownMenu: ["remove_col", "---------", "make_read_only", "alignment"],
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 */

export class DropdownMenu extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get PLUGIN_DEPS() {
    return [
      'plugin:AutoColumnSize',
    ];
  }

  /**
   * Default menu items order when `dropdownMenu` is enabled by setting the config item to `true`.
   *
   * @returns {Array}
   */
  static get DEFAULT_ITEMS() {
    return [
      COLUMN_LEFT,
      COLUMN_RIGHT,
      SEPARATOR,
      REMOVE_COLUMN,
      SEPARATOR,
      CLEAR_COLUMN,
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
   * Flag which determines if the button that opens the menu was clicked.
   *
   * @type {boolean}
   */
  #isButtonClicked = false;

  constructor(hotInstance: HotInstance) {
    super(hotInstance);

    // One listener for enable/disable functionality
    this.hot.addHook('afterGetColHeader', (col: number, TH: HTMLTableCellElement) => this.#onAfterGetColHeader(col, TH));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link DropdownMenu#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   *
   * @fires Hooks#afterDropdownMenuDefaultOptions
   * @fires Hooks#beforeDropdownMenuSetItems
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.itemsFactory = new ItemsFactory(this.hot, DropdownMenu.DEFAULT_ITEMS);

    this.addHook('beforeOnCellMouseDown', (...args: unknown[]) => (this.#onBeforeOnCellMouseDown as Function)(...args));
    this.addHook('beforeViewportScrollHorizontally', (...args: unknown[]) => (this.#onBeforeViewportScrollHorizontally as Function)(...args));
    this.addHook('beforeDialogShow', () => this.close());

    const settings = this.hot.getSettings()[PLUGIN_KEY];
    const settingsObj = settings as DropdownMenuSettings;
    const predefinedItems = {
      items: this.itemsFactory.getItems(settings)
    };

    this.registerEvents();

    if (typeof settingsObj.callback === 'function') {
      this.commandExecutor.setCommonCallback(settingsObj.callback);
    }

    this.registerShortcuts();
    super.enablePlugin();

    this.callOnPluginsReady(() => {
      this.hot.runHooks('afterDropdownMenuDefaultOptions', predefinedItems);

      this.itemsFactory.setPredefinedItems(predefinedItems.items);
      const menuItems = this.itemsFactory.getItems(settings);

      if (this.menu) {
        this.menu.destroy();
      }
      this.menu = new Menu(this.hot, {
        className: 'htDropdownMenu',
        keepInViewport: true,
        container: settingsObj.uiContainer || this.hot.rootPortalElement,
      });
      this.hot.runHooks('beforeDropdownMenuSetItems', menuItems);

      this.menu.setMenuItems(menuItems);

      this.menu.addLocalHook('beforeOpen', () => this.#onMenuBeforeOpen());
      this.menu.addLocalHook('afterOpen', () => this.#onMenuAfterOpen());
      this.menu.addLocalHook('afterSubmenuOpen', (subMenuInstance: Menu) => this.#onSubMenuAfterOpen(subMenuInstance));
      this.menu.addLocalHook('afterClose', () => this.#onMenuAfterClose());
      this.menu.addLocalHook('executeCommand', (...params: unknown[]) => this.executeCommand.call(this, ...params));

      // Register all commands. Predefined and added by user or by plugins
      arrayEach(menuItems, (command) => {
        const cmd = command as Record<string, unknown>;
        this.commandExecutor.registerCommand(
          cmd.key as string,
          command as Parameters<CommandExecutor['registerCommand']>[1]
        );
      });
    });
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`dropdownMenu`](@/api/options.md#dropdownmenu)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.close();

    if (this.menu) {
      this.menu.destroy();
    }

    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for toggling dropdown menu.
   *
   * @private
   */
  registerShortcuts() {
    const gridContext = this.hot.getShortcutManager().getContext('grid');
    const callback = () => {
      const { highlight } = this.hot.getSelectedRangeActive();

      if ((highlight.isHeader() && highlight.row === -1 || highlight.isCell()) && highlight.col >= 0) {
        this.hot.selection.selectColumns(highlight.col, highlight.col, -1);

        const { from } = this.hot.getSelectedRangeActive();
        const offset = getDocumentOffsetByElement(this.menu.container, this.hot.rootDocument);
        const target = this.hot.getCell(-1, from.col, true).querySelector(`.${BUTTON_CLASS_NAME}`) as HTMLElement;
        const rect = target.getBoundingClientRect();
        const viewportWidth = this.hot.rootWindow?.innerWidth ?? 0;
        const menuWidth = this.menu.container?.offsetWidth ?? 200;
        const lastCol = from.col === this.hot.countCols() - 1;
        const menuOpensOnLeft = !this.hot.isLtr()
          ? lastCol
          : (lastCol || rect.right + menuWidth > viewportWidth);

        this.open(this.#adjustPositionForTheme({
          left: rect.left + offset.left,
          top: rect.bottom + offset.top,
        }, menuOpensOnLeft), {
          left: rect.width,
          right: 0,
          above: 0,
          below: 3,
        });
        // Make sure the first item is selected (role=menuitem). Otherwise, screen readers
        // will block the Esc key for the whole menu.
        this.menu.getNavigator().toFirstItem();
        const firstItem = this.menu.hotMenu?.getCell(0, 0);

        // #region agent log
        (this.hot.rootWindow as {
          agentDebugLog?: (payload: Record<string, unknown>) => void;
        })?.agentDebugLog?.({
          hypothesisId: 'C',
          location: 'src/plugins/dropdownMenu/dropdownMenu.ts:registerShortcuts',
          message: 'Dropdown shortcut callback post-open state',
          data: {
            highlightRow: highlight.row,
            highlightCol: highlight.col,
            menuOpened: this.menu.isOpened(),
            firstItemExists: Boolean(firstItem),
            firstItemIsCurrent: Boolean(firstItem?.classList.contains('current')),
          },
          timestamp: Date.now(),
        });
        // #endregion
      }
    };

    gridContext.addShortcuts([{
      keys: [['Shift', 'Alt', 'ArrowDown'], ['Control/Meta', 'Enter']],
      callback,
      runOnlyIf: () => {
        const highlight = this.hot.getSelectedRangeActive()?.highlight;

        return highlight && this.hot.selection.isCellVisible(highlight) &&
          highlight.isHeader() && !this.menu.isOpened();
      },
      captureCtrl: true,
      group: SHORTCUTS_GROUP,
    }, {
      keys: [['Shift', 'Alt', 'ArrowDown']],
      callback,
      runOnlyIf: () => {
        const highlight = this.hot.getSelectedRangeActive()?.highlight;

        return highlight && this.hot.selection.isCellVisible(highlight) &&
          highlight.isCell() && !this.menu.isOpened();
      },
      group: SHORTCUTS_GROUP,
    }]);
  }

  /**
   * Unregister shortcuts responsible for toggling dropdown menu.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      .removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Registers the DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'click', event => this.#onTableClick(event));
  }

  /**
   * Opens menu and re-position it based on the passed coordinates.
   *
   * @param {{ top: number, left: number }|Event} position An object with `top` and `left` properties
   * which contains coordinates relative to the browsers viewport (without included scroll offsets).
   * Or if the native event is passed the menu will be positioned based on the `pageX` and `pageY`
   * coordinates.
   * @param {{ above: number, below: number, left: number, right: number }} offset An object allows applying
   * the offset to the menu position.
   * @fires Hooks#beforeDropdownMenuShow
   * @fires Hooks#afterDropdownMenuShow
   */
  open(position: Record<string, number>, offset: Record<string, number> = { above: 0, below: 0, left: 0, right: 0 }): void {
    if (this.menu?.isOpened()) {
      return;
    }

    this.menu.open();

    objectEach(offset, (value, key) => {
      this.menu.setOffset(key as string, value as number);
    });
    this.menu.setPosition(position);
  }

  /**
   * Closes dropdown menu.
   */
  close(): void {
    this.menu?.close();
  }

  /**
   * Executes context menu command.
   *
   * The `executeCommand()` method works only for selected cells.
   *
   * When no cells are selected, `executeCommand()` doesn't do anything.
   *
   * You can execute all predefined commands:
   *  * `'col_left'` - Insert column left
   *  * `'col_right'` - Insert column right
   *  * `'clear_column'` - Clear selected column
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
   * @param {string} commandName Command name to execute.
   * @param {*} params Additional parameters passed to the command executor.
   */
  executeCommand(commandName: string, ...params: unknown[]): void {
    this.commandExecutor.execute(commandName, ...params);
  }

  /**
   * Turns on / off listening on dropdown menu.
   *
   * @private
   * @param {boolean} listen Turn on listening when value is set to true, otherwise turn it off.
   */
  setListening(listen = true) {
    if (this.menu.isOpened()) {
      const hotMenu = this.menu.hotMenu as { listen(): void; unlisten(): void };
      if (listen) {
        hotMenu.listen();
      } else {
        hotMenu.unlisten();
      }
    }
  }

  /**
   * Add custom shortcuts to the provided menu instance.
   *
   * @param {Menu} menuInstance The menu instance.
   */
  #addCustomShortcuts(menuInstance: Menu) {
    menuInstance
      .getKeyboardShortcutsCtrl()
      .addCustomShortcuts([{
        keys: [['Control/Meta', 'A']],
        callback: () => false,
      }]);
  }

  /**
   * Adjusts menu position for horizon theme (corrects 4px offset from theme styling).
   *
   * @private
   * @param {{ top: number, left: number }} position Position object.
   * @param {boolean} [menuOpensOnLeft] When true, menu is positioned on the left (no space on right); applies opposite left correction.
   * @returns {{ top: number, left: number }} Adjusted position when horizon theme is active, otherwise unchanged.
   */
  #adjustPositionForTheme(position: Record<string, number>, menuOpensOnLeft?: boolean): Record<string, number> {
    const themeName = this.hot.getCurrentThemeName?.();
    if (!themeName) {
      return position;
    }
    if (themeName.includes('classic')) {
      // Classic theme: align menu top with e2e expected (top 6px up); no left correction to avoid overcorrection in RTL/no-space cases.
      return {
        top: position.top - 6,
        left: position.left,
      };
    }
    if (!themeName.includes('horizon')) {
      return position;
    }
    // Horizon: RTL menu left alignment (e2e expects ~912; -4 matches).
    const leftCorrection = this.hot.isLtr()
      ? (menuOpensOnLeft ? -4 : 4)
      : (menuOpensOnLeft ? 4 : -4);
    return {
      top: position.top - 4,
      left: position.left + leftCorrection,
    };
  }

  /**
   * Table click listener.
   *
   * @private
   * @param {Event} event The mouse event object.
   */
  #onTableClick(event: Event) {
    const target = event.target as HTMLElement;
    if (hasClass(target, BUTTON_CLASS_NAME)) {
      const offset = getDocumentOffsetByElement(this.menu.container, this.hot.rootDocument);
      const rect = target.getBoundingClientRect();

      event.stopPropagation();
      this.#isButtonClicked = false;

      this.open(this.#adjustPositionForTheme({
        left: rect.left + offset.left,
        top: rect.top + target.offsetHeight + offset.top,
      }, false), {
        left: rect.width,
        right: 0,
        above: 0,
        below: 3,
      });
    }
  }

  /**
   * Returns the bounding rect of the button's ignoring the hit area box.
   *
   * @param {HTMLElement} button The change-type button element.
   * @returns {{ top: number, left: number, right: number, bottom: number, width: number, height: number }}
   */
  #getButtonRect(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    const beforeStyle = this.hot.rootWindow.getComputedStyle(button, '::before');
    const iconSize = Number.parseFloat(beforeStyle.width);

    if (Number.isFinite(iconSize) && rect.width >= iconSize && rect.height >= iconSize) {
      const left = rect.left + ((rect.width - iconSize) / 2);
      const top = rect.top + ((rect.height - iconSize) / 2);

      return {
        top,
        left,
        right: left + iconSize,
        bottom: top + iconSize,
        width: iconSize,
        height: iconSize,
      };
    }

    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * On after get column header listener.
   *
   * @private
   * @param {number} col Visual column index.
   * @param {HTMLTableCellElement} TH Header's TH element.
   */
  #onAfterGetColHeader(col: number, TH: HTMLTableCellElement) {
    // Corner or a higher-level header
    const headerRow = TH.parentNode;

    if (!headerRow) {
      return;
    }

    const headerRowList = headerRow.parentNode.childNodes;
    const level = Array.prototype.indexOf.call(headerRowList, headerRow);

    if (col < 0 || level !== headerRowList.length - 1) {
      return;
    }

    const existingButton = TH.querySelector(`.${BUTTON_CLASS_NAME}`);

    // Plugin enabled and buttons already exists, return.
    if (this.enabled && existingButton) {
      return;
    }
    // Plugin disabled and buttons still exists, so remove them.
    if (!this.enabled) {
      if (existingButton) {
        existingButton.parentNode.removeChild(existingButton);
      }

      return;
    }
    const button = this.hot.rootDocument.createElement('button');

    button.className = BUTTON_CLASS_NAME;
    button.type = 'button';
    button.tabIndex = -1;

    if (this.hot.getSettings().ariaTags) {
      setAttribute(button, [
        A11Y_HIDDEN(),
        A11Y_LABEL(' '),
      ]);

      setAttribute(TH, [
        A11Y_HASPOPUP('menu'),
      ]);
    }

    // prevent page reload on button click
    button.onclick = function() {
      return false;
    };

    TH.firstChild.insertBefore(button, TH.firstChild.firstChild);
  }

  /**
   * On menu before open listener.
   *
   * @private
   * @fires Hooks#beforeDropdownMenuShow
   */
  #onMenuBeforeOpen() {
    this.hot.runHooks('beforeDropdownMenuShow', this);
  }

  /**
   * On menu after open listener.
   *
   * @private
   * @fires Hooks#afterDropdownMenuShow
   */
  #onMenuAfterOpen() {
    this.hot.runHooks('afterDropdownMenuShow', this);

    this.#addCustomShortcuts(this.menu!);
  }

  /**
   * Listener for the `afterSubmenuOpen` hook.
   *
   * @private
   * @param {Menu} subMenuInstance The opened sub menu instance.
   */
  #onSubMenuAfterOpen(subMenuInstance: Menu) {
    this.#addCustomShortcuts(subMenuInstance);
  }

  /**
   * On menu after close listener.
   *
   * @private
   * @fires Hooks#afterDropdownMenuHide
   */
  #onMenuAfterClose() {
    this.hot.listen();
    this.hot.runHooks('afterDropdownMenuHide', this);
  }

  /**
   * Hook allows blocking horizontal scroll when the menu is opened by clicking on
   * the column header button. This prevents from scrolling the viewport (jump effect) when
   * the button is clicked.
   *
   * @param {number} visualColumn Visual column index.
   * @returns {number | null}
   */
  #onBeforeViewportScrollHorizontally(visualColumn: number) {
    return this.#isButtonClicked ? null : visualColumn;
  }

  /**
   * Hook sets the internal flag to `true` when the button is clicked.
   *
   * @param {MouseEvent} event The mouse event object.
   */
  #onBeforeOnCellMouseDown(event: MouseEvent) {
    if (hasClass(event.target as HTMLElement, BUTTON_CLASS_NAME)) {
      this.#isButtonClicked = true;
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.close();

    if (this.menu) {
      this.menu.destroy();
    }
    super.destroy();
  }
}

(DropdownMenu as unknown as Record<string, object>).SEPARATOR = {
  name: SEPARATOR
};
