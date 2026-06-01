import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { arrayEach } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { CommandExecutor } from '../contextMenu/commandExecutor';
import { getDocumentOffsetByElement } from '../contextMenu/utils';
import {
  eventTargetEl, hasClass, isBottomMostColumnHeader, isHTMLElement, setAttribute
} from '../../helpers/dom/element';
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
    this.hot.addHook('afterGetColHeader', this.#onAfterGetColHeader);
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

    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    this.addHook('beforeViewportScrollHorizontally', this.#onBeforeViewportScrollHorizontally);
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

      this.itemsFactory!.setPredefinedItems(predefinedItems.items);
      const menuItems = this.itemsFactory!.getItems(settings);

      if (this.menu) {
        this.menu.destroy();
      }
      this.menu = new Menu(this.hot, {
        className: 'htDropdownMenu',
        keepInViewport: true,
        container: (typeof settings === 'object' ? settingsObj.uiContainer : null) ||
          this.hot.rootPortalElement,
      });
      this.hot.runHooks('beforeDropdownMenuSetItems', menuItems);

      this.menu.setMenuItems(menuItems);

      this.menu.addLocalHook('afterOpen', () => this.#onMenuAfterOpen());
      this.menu.addLocalHook('afterSubmenuOpen', (subMenuInstance: Menu) => this.#onSubMenuAfterOpen(subMenuInstance));
      this.menu.addLocalHook('afterClose', () => this.#onMenuAfterClose());
      this.menu.addLocalHook('executeCommand',
        (commandName: string, ...params: unknown[]) => this.executeCommand(commandName, ...params));

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
      const activeRange = this.hot.getSelectedRangeActive();

      if (!activeRange) {
        return;
      }

      const { highlight } = activeRange;
      const highlightedHeaderElement = highlight.isHeader() ?
        this.hot.getCell(highlight.row ?? 0, highlight.col ?? 0, true) :
        null;
      const isBottomMostHeaderSelected = highlight.isHeader() &&
        (highlight.col ?? -1) >= 0 &&
        !!highlightedHeaderElement &&
        isBottomMostColumnHeader(highlightedHeaderElement);
      const isHiddenNestedPlaceholderSelected = highlight.isHeader() &&
        (highlight.col ?? -1) >= 0 &&
        highlightedHeaderElement &&
        hasClass(highlightedHeaderElement, 'hiddenHeader');

      const isValidSelection = isBottomMostHeaderSelected ||
        isHiddenNestedPlaceholderSelected ||
        highlight.isCell();

      if (isValidSelection && (highlight.col ?? -1) >= 0) {
        let headerRow: number =
          isBottomMostHeaderSelected || isHiddenNestedPlaceholderSelected ? (highlight.row ?? -1) : -1;

        this.hot.selectColumns(highlight.col ?? 0, highlight.col ?? 0, headerRow);

        const refreshedRange = this.hot.getSelectedRangeActive();

        if (!refreshedRange) {
          return;
        }

        const { from } = refreshedRange;
        const offset = getDocumentOffsetByElement(this.menu?.container ?? this.hot.rootElement, this.hot.rootDocument);
        let target = this.hot.getCell(headerRow, from.col ?? 0, true)?.querySelector(`.${BUTTON_CLASS_NAME}`);

        if (!target) {
          for (let row = -this.hot.view.getColumnHeadersCount(); row <= -1; row++) {
            const candidate = this.hot.getCell(row, from.col ?? 0, true)?.querySelector(`.${BUTTON_CLASS_NAME}`);

            if (candidate) {
              target = candidate;
              headerRow = row;

              this.hot.selectColumns(highlight.col ?? 0, highlight.col ?? 0, headerRow);
              break;
            }
          }
        }

        if (!target && isHiddenNestedPlaceholderSelected) {
          for (let column = (from.col ?? 0) - 1; column >= 0; column--) {
            const candidateHeader = this.hot.getCell(headerRow, column, true);

            if (!candidateHeader || hasClass(candidateHeader, 'hiddenHeader')) {
              continue; // eslint-disable-line no-continue
            }

            const candidateButton = candidateHeader?.querySelector(`.${BUTTON_CLASS_NAME}`);

            if (candidateButton) {
              target = candidateButton;
              this.hot.selectColumns(column, column, headerRow);
            }
            break;
          }
        }

        if (!target) {
          return;
        }

        if (!isHTMLElement(target)) {
          return;
        }

        const buttonRect = this.#getButtonRect(target);
        const th = target.closest('th');
        // For rowspanned headers the button may be mispositioned when the htRowspanHeader
        // CSS class is not yet applied. Anchor to the TH's inner bottom (clientHeight, no
        // borders) and use below:-1 so the positioner's +1 cancels out, placing the menu
        // flush with the TH content bottom.
        const isRowspanned = th && Number.parseInt(th.getAttribute('rowspan') ?? '1', 10) > 1;
        const menuTop = isRowspanned
          ? (th.getBoundingClientRect().top + th.clientHeight)
          : buttonRect.bottom;

        this.open({
          left: buttonRect.left + offset.left,
          top: menuTop + offset.top,
        }, {
          left: buttonRect.width,
          right: 0,
          above: 0,
          below: isRowspanned ? -1 : 3,
        });
        // Make sure the first item is selected (role=menuitem). Otherwise, screen readers
        // will block the Esc key for the whole menu.
        this.menu?.getNavigator()?.toFirstItem();
      }
    };

    gridContext?.addShortcuts([{
      keys: [['Shift', 'Alt', 'ArrowDown'], ['Control/Meta', 'Enter']],
      callback,
      runOnlyIf: (): boolean => {
        const highlight = this.hot.getSelectedRangeActive()?.highlight;
        const highlightedHeaderElement = highlight?.isHeader() ?
          this.hot.getCell(highlight.row ?? 0, highlight.col ?? 0, true) :
          null;
        const isHiddenNestedPlaceholderSelected = highlight?.isHeader() &&
          (highlight.col ?? -1) >= 0 &&
          highlightedHeaderElement &&
          hasClass(highlightedHeaderElement, 'hiddenHeader');

        return !!(highlight && !this.menu?.isOpened() &&
          highlight.isHeader() &&
          (this.hot.selection.isCellVisible(highlight) || isHiddenNestedPlaceholderSelected));
      },
      captureCtrl: true,
      group: SHORTCUTS_GROUP,
    }, {
      keys: [['Shift', 'Alt', 'ArrowDown']],
      callback,
      runOnlyIf: (): boolean => {
        const highlight = this.hot.getSelectedRangeActive()?.highlight;

        return !!(highlight && this.hot.selection.isCellVisible(highlight) &&
          highlight.isCell() && !this.menu?.isOpened());
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
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
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
   * Opens the menu and positions it based on the passed coordinates.
   *
   * @param {{ top: number, left: number }|Event} position An object with `top` and `left` properties
   * (coordinates relative to the browser viewport, without scroll offsets), or a native browser
   * `Event` instance (e.g., a `MouseEvent`).
   * @param {{ above: number, below: number, left: number, right: number }} offset An object that applies
   * an offset to the menu position.
   * @fires Hooks#beforeDropdownMenuShow
   * @fires Hooks#afterDropdownMenuShow
   * @example
   * ```js
   * const menu = hot.getPlugin('dropdownMenu');
   *
   * hot.selectCell(0, 0);
   * menu.open({ top: 50, left: 50 });
   * ```
   */
  open(
    position: Record<string, number> | Event,
    offset: Record<string, number> = { above: 0, below: 0, left: 0, right: 0 }
  ): void {
    if (this.menu?.isOpened()) {
      return;
    }

    // Fire the user-facing hook before any menu state is committed. If a listener calls
    // `updateSettings({ dropdownMenu })`, the plugin reinitializes synchronously, and the
    // open flow below proceeds on the fresh `this.menu` instance with the new items.
    this.hot.runHooks('beforeDropdownMenuShow', this);

    this.menu?.open();

    objectEach(offset, (value, key) => {
      this.menu?.setOffset(key as string, value as number);
    });
    this.menu?.setPosition(position);
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
    if (this.menu?.isOpened()) {
      const hotMenu = this.menu!.hotMenu as { listen(): void; unlisten(): void };

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
      ?.addCustomShortcuts([{
        keys: [['Control/Meta', 'A']],
        callback: () => false,
      }]);
  }

  /**
   * Table click listener.
   *
   * @private
   * @param {Event} event The mouse event object.
   */
  #onTableClick(event: Event) {
    const target = eventTargetEl(event)!;

    if (hasClass(target, BUTTON_CLASS_NAME)) {
      const offset = getDocumentOffsetByElement(this.menu?.container ?? this.hot.rootElement, this.hot.rootDocument);
      const buttonRect = this.#getButtonRect(target);

      event.stopPropagation();
      this.#isButtonClicked = false;

      this.open({
        left: buttonRect.left + offset.left,
        top: buttonRect.bottom + offset.top,
      }, {
        left: buttonRect.width,
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
  #onAfterGetColHeader = (col: number, TH: HTMLTableCellElement) => {
    if (col < 0 || !isBottomMostColumnHeader(TH)) {
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
        existingButton.parentNode?.removeChild(existingButton);
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

    const relativeContainer = TH.firstChild as Element | null;

    if (!relativeContainer) {
      return;
    }

    const colHeaderSpan = relativeContainer.querySelector('.colHeader');

    if (colHeaderSpan) {
      relativeContainer.insertBefore(button, colHeaderSpan.nextSibling);
    } else {
      relativeContainer.appendChild(button);
    }
  };

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
  #onBeforeViewportScrollHorizontally = (visualColumn: number) => {
    return this.#isButtonClicked ? null : visualColumn;
  };

  /**
   * Hook sets the internal flag to `true` when the button is clicked.
   *
   * @param {MouseEvent} event The mouse event object.
   */
  #onBeforeOnCellMouseDown = (event: MouseEvent) => {
    if (hasClass(eventTargetEl(event)!, BUTTON_CLASS_NAME)) {
      this.#isButtonClicked = true;
    }
  };

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
