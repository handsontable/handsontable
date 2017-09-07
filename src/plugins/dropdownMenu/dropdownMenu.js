import BasePlugin from 'handsontable/plugins/_base';
import {arrayEach} from 'handsontable/helpers/array';
import {objectEach} from 'handsontable/helpers/object';
import CommandExecutor from 'handsontable/plugins/contextMenu/commandExecutor';
import EventManager from 'handsontable/eventManager';
import {getWindowScrollTop, getWindowScrollLeft, hasClass, closest} from 'handsontable/helpers/dom/element';
import ItemsFactory from 'handsontable/plugins/contextMenu/itemsFactory';
import Menu from 'handsontable/plugins/contextMenu/menu';
import {registerPlugin} from 'handsontable/plugins';
import Hooks from 'handsontable/pluginHooks';
import {stopPropagation} from 'handsontable/helpers/dom/event';
import {
  COLUMN_LEFT,
  COLUMN_RIGHT,
  REMOVE_COLUMN,
  CLEAR_COLUMN,
  READ_ONLY,
  ALIGNMENT,
  SEPARATOR
} from 'handsontable/plugins/contextMenu/predefinedItems';

import './dropdownMenu.css';

Hooks.getSingleton().register('afterDropdownMenuDefaultOptions');
Hooks.getSingleton().register('afterDropdownMenuShow');
Hooks.getSingleton().register('afterDropdownMenuHide');
Hooks.getSingleton().register('afterDropdownMenuExecute');

const BUTTON_CLASS_NAME = 'changeType';

/**
 * @plugin DropdownMenu
 * @pro
 * @dependencies ContextMenu
 */
class DropdownMenu extends BasePlugin {
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

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Instance of {@link CommandExecutor}.
     *
     * @type {CommandExecutor}
     */
    this.commandExecutor = new CommandExecutor(this.hot);
    /**
     * Instance of {@link ItemsFactory}.
     *
     * @type {ItemsFactory}
     */
    this.itemsFactory = null;
    /**
     * Instance of {@link Menu}.
     *
     * @type {Menu}
     */
    this.menu = null;

    // One listener for enable/disable functionality
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().dropdownMenu;
  }

  /**
   * Enable the plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.itemsFactory = new ItemsFactory(this.hot, DropdownMenu.DEFAULT_ITEMS);

    const settings = this.hot.getSettings().dropdownMenu;
    let predefinedItems = {
      items: this.itemsFactory.getItems(settings)
    };
    this.registerEvents();

    if (typeof settings.callback === 'function') {
      this.commandExecutor.setCommonCallback(settings.callback);
    }
    super.enablePlugin();

    this.callOnPluginsReady(() => {
      this.hot.runHooks('afterDropdownMenuDefaultOptions', predefinedItems);

      this.itemsFactory.setPredefinedItems(predefinedItems.items);
      let menuItems = this.itemsFactory.getItems(settings);

      if (this.menu) {
        this.menu.destroy();
      }
      this.menu = new Menu(this.hot, {
        className: 'htDropdownMenu',
        keepInViewport: true
      });
      this.hot.runHooks('beforeDropdownMenuSetItems', menuItems);

      this.menu.setMenuItems(menuItems);

      this.menu.addLocalHook('afterOpen', () => this.onMenuAfterOpen());
      this.menu.addLocalHook('afterClose', () => this.onMenuAfterClose());
      this.menu.addLocalHook('executeCommand', (...params) => this.executeCommand.apply(this, params));

      // Register all commands. Predefined and added by user or by plugins
      arrayEach(menuItems, (command) => this.commandExecutor.registerCommand(command.key, command));
    });
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();
  }

  /**
   * Disable the plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.close();

    if (this.menu) {
      this.menu.destroy();
    }
    super.disablePlugin();
  }

  /**
   * Register the DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'click', (event) => this.onTableClick(event));
  }

  /**
   * Open menu and re-position it based on the DOM event object.
   *
   * @param {Event|Object} event Event object.
   */
  open(event) {
    if (!this.menu) {
      return;
    }
    this.menu.open();

    if (event.width) {
      this.menu.setOffset('left', event.width);
    }
    this.menu.setPosition(event);

    // ContextMenu is not detected HotTableEnv correctly because is injected outside hot-table
    this.menu.hotMenu.isHotTableEnv = this.hot.isHotTableEnv;
    // Handsontable.eventManager.isHotTableEnv = this.hot.isHotTableEnv;
  }

  /**
   * Close menu.
   */
  close() {
    if (!this.menu) {
      return;
    }
    this.menu.close();
  }

  /**
   * Execute context menu command.
   *
   * You can execute all predefined commands:
   *  * `'row_above'` - Insert row above
   *  * `'row_below'` - Insert row below
   *  * `'col_left'` - Insert column on the left
   *  * `'col_right'` - Insert column on the right
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
   *  * `'alignment:center'` - Alignment to the center (justify)
   *
   * Or you can execute command registered in settings where `key` is your command name.
   *
   * @param {String} commandName
   * @param {*} params
   */
  executeCommand(...params) {
    this.commandExecutor.execute.apply(this.commandExecutor, params);
  }

  /**
   * Turn on / turn off listening on dropdown menu
   *
   * @param {Boolean} listen Turn on listening when value is set to true, otherwise turn it off.
   */
  setListening(listen = true) {
    if (this.menu.isOpened()) {
      if (listen) {
        this.menu.hotMenu.listen();
      } else {
        this.menu.hotMenu.unlisten();
      }
    }
  }

  /**
   * Table click listener.
   *
   * @private
   * @param {Event} event
   */
  onTableClick(event) {
    stopPropagation(event);

    if (hasClass(event.target, BUTTON_CLASS_NAME) && !this.menu.isOpened()) {
      let rect = event.target.getBoundingClientRect();

      this.open({
        left: rect.left,
        top: rect.top + event.target.offsetHeight + 3,
        width: rect.width,
        height: rect.height,
      });
    }
  }

  /**
   * On after get column header listener.
   *
   * @private
   * @param {Number} col
   * @param {HTMLTableCellElement} TH
   */
  onAfterGetColHeader(col, TH) {
    // Corner or a higher-level header
    let headerRow = TH.parentNode;
    if (!headerRow) {
      return;
    }

    let headerRowList = headerRow.parentNode.childNodes;
    let level = Array.prototype.indexOf.call(headerRowList, headerRow);

    if (col < 0 || level !== headerRowList.length - 1) {
      return;
    }

    const existingButton = TH.querySelector('.' + BUTTON_CLASS_NAME);

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
    let button = document.createElement('button');

    button.className = BUTTON_CLASS_NAME;

    // prevent page reload on button click
    button.onclick = function() {
      return false;
    };

    TH.firstChild.insertBefore(button, TH.firstChild.firstChild);
  }

  /**
   * On menu after open listener.
   *
   * @private
   */
  onMenuAfterOpen() {
    this.hot.runHooks('afterDropdownMenuShow', this);
  }

  /**
   * On menu after close listener.
   *
   * @private
   */
  onMenuAfterClose() {
    this.hot.listen();
    this.hot.runHooks('afterDropdownMenuHide', this);
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.close();

    if (this.menu) {
      this.menu.destroy();
    }
    super.destroy();
  }
}

DropdownMenu.SEPARATOR = {
  name: SEPARATOR
};

registerPlugin('dropdownMenu', DropdownMenu);

export default DropdownMenu;
