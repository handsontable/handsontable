import { Positioner } from './positioner';
import { Navigator } from './navigator';
import { SEPARATOR, NO_ITEMS, predefinedItems } from './../predefinedItems';
import {
  filterSeparators,
  hasSubMenu,
  isItemHidden,
  normalizeSelection
} from './utils';
import EventManager from '../../../eventManager';
import { arrayEach, arrayFilter, arrayReduce } from '../../../helpers/array';
import { isWindowsOS, isMobileBrowser, isIpadOS } from '../../../helpers/browser';
import {
  addClass,
  empty,
  fastInnerHTML,
  isChildOf,
  isInput,
  removeClass,
  getParentWindow,
  hasClass,
} from '../../../helpers/dom/element';
import { isRightClick } from '../../../helpers/dom/event';
import { debounce, isFunction } from '../../../helpers/function';
import { isUndefined, isDefined } from '../../../helpers/mixed';
import { mixin, hasOwnProperty } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';

const MIN_WIDTH = 215;
const SHORTCUTS_CONTEXT = 'menu';
const SHORTCUTS_GROUP = SHORTCUTS_CONTEXT;

/**
 * @typedef MenuOptions
 * @property {Menu} [parent=null] Instance of {@link Menu}.
 * @property {string} [name=null] Name of the menu.
 * @property {string} [className=''] Custom class name.
 * @property {boolean} [keepInViewport=true] Determine if should be kept in viewport.
 * @property {boolean} [standalone] Enabling closing menu when clicked element is not belongs to menu itself.
 * @property {number} [minWidth=MIN_WIDTH] The minimum width.
 * @property {HTMLElement} [container] The container.
 */

/**
 * @private
 * @class Menu
 */
export class Menu {
  /**
   * @param {Core} hotInstance Handsontable instance.
   * @param {MenuOptions} [options] Menu options.
   */
  constructor(hotInstance, options) {
    this.hot = hotInstance;
    this.options = options || {
      parent: null,
      name: null,
      className: '',
      keepInViewport: true,
      standalone: false,
      minWidth: MIN_WIDTH,
      container: this.hot.rootDocument.documentElement,
    };
    this.eventManager = new EventManager(this);
    this.container = this.createContainer(this.options.name);
    this.positioner = new Positioner(this.options.keepInViewport);
    this.navigator = new Navigator();
    this.hotMenu = null;
    this.hotSubMenus = {};
    this.parentMenu = this.options.parent || null;
    this.menuItems = null;
    this.origOutsideClickDeselects = null;
    this._afterScrollCallback = null;

    this.registerEvents();
  }

  /**
   * Register event listeners.
   *
   * @private
   */
  registerEvents() {
    let frame = this.hot.rootWindow;

    while (frame) {
      this.eventManager.addEventListener(frame.document, 'mousedown', event => this.onDocumentMouseDown(event));
      this.eventManager.addEventListener(frame.document, 'contextmenu', event => this.onDocumentContextMenu(event));

      frame = getParentWindow(frame);
    }
  }

  /**
   * Set array of objects which defines menu items.
   *
   * @param {Array} menuItems Menu items to display.
   */
  setMenuItems(menuItems) {
    this.menuItems = menuItems;
  }

  /**
   * Returns currently selected menu item. Returns `null` if no item was selected.
   *
   * @returns {object|null}
   */
  getSelectedItem() {
    return this.hasSelectedItem() ? this.hotMenu.getSourceDataAtRow(this.hotMenu.getSelectedLast()[0]) : null;
  }

  /**
   * Checks if the menu has selected (highlighted) any item from the menu list.
   *
   * @returns {boolean}
   */
  hasSelectedItem() {
    return Array.isArray(this.hotMenu.getSelectedLast());
  }

  /**
   * Check if menu is using as sub-menu.
   *
   * @returns {boolean}
   */
  isSubMenu() {
    return this.parentMenu !== null;
  }

  /**
   * Open menu.
   *
   * @fires Hooks#beforeContextMenuShow
   * @fires Hooks#afterContextMenuShow
   */
  open() {
    this.runLocalHooks('beforeOpen');

    this.container.removeAttribute('style');
    this.container.style.display = 'block';

    const delayedOpenSubMenu = debounce(row => this.openSubMenu(row), 300);
    const minWidthOfMenu = this.options.minWidth || MIN_WIDTH;
    let noItemsDefined = false;

    let filteredItems = arrayFilter(this.menuItems, (item) => {
      if (item.key === NO_ITEMS) {
        noItemsDefined = true;
      }

      return isItemHidden(item, this.hot);
    });

    if (filteredItems.length < 1 && !noItemsDefined) {
      filteredItems.push(predefinedItems()[NO_ITEMS]);

    } else if (filteredItems.length === 0) {
      return;
    }

    filteredItems = filterSeparators(filteredItems, SEPARATOR);

    let shouldAutoCloseMenu = false;

    const settings = {
      data: filteredItems,
      colHeaders: false,
      autoColumnSize: true,
      autoWrapRow: false,
      modifyColWidth(width) {
        if (isDefined(width) && width < minWidthOfMenu) {
          return minWidthOfMenu;
        }

        return width;
      },
      autoRowSize: false,
      readOnly: true,
      editor: false,
      copyPaste: false,
      maxCols: 1,
      columns: [{
        data: 'name',
        renderer: (hot, TD, row, col, prop, value) => this.menuItemRenderer(hot, TD, row, col, prop, value)
      }],
      renderAllRows: true,
      fragmentSelection: false,
      outsideClickDeselects: false,
      disableVisualSelection: 'area',
      layoutDirection: this.hot.isRtl() ? 'rtl' : 'ltr',
      afterOnCellMouseOver: (event, coords) => {
        if (this.isAllSubMenusClosed()) {
          delayedOpenSubMenu(coords.row);
        } else {
          this.openSubMenu(coords.row);
        }
      },
      rowHeights: row => (filteredItems[row].name === SEPARATOR ? 1 : 23),
      afterOnCellContextMenu: (event) => {
        event.preventDefault();

        // On the Windows platform, the "contextmenu" is triggered after the "mouseup" so that's
        // why the closing menu is here. (#6507#issuecomment-582392301).
        if (isWindowsOS() && shouldAutoCloseMenu && this.hasSelectedItem()) {
          this.close(true);
        }
      },
      afterSelection: (row, column, row2, column2, preventScrolling) => {
        // do not scroll the viewport when mouse clicks on partially visible menu item
        if (this.hotMenu.view.isMouseDown()) {
          preventScrolling.value = true;
        }
      },
      beforeOnCellMouseUp: (event) => {
        if (this.hasSelectedItem()) {
          shouldAutoCloseMenu = !this.isCommandPassive(this.getSelectedItem());
          this.executeCommand(event);
        }
      },
      afterOnCellMouseUp: (event) => {
        // If the code runs on the other platform than Windows, the "mouseup" is triggered
        // after the "contextmenu". So then "mouseup" closes the menu. Otherwise, the closing
        // menu responsibility is forwarded to "afterOnCellContextMenu" callback (#6507#issuecomment-582392301).
        if ((!isWindowsOS() || !isRightClick(event)) && shouldAutoCloseMenu && this.hasSelectedItem()) {
          // The timeout is necessary only for mobile devices. For desktop, the click event that is fired
          // right after the mouseup event gets the event element target the same as the mouseup event.
          // For mobile devices, the click event is triggered with native delay (~300ms), so when the mouseup
          // event hides the tapped element, the click event grabs the element below. As a result, the filter
          // by condition menu is closed and immediately open on tapping the "None" item.
          if (isMobileBrowser() || isIpadOS()) {
            this.hot._registerTimeout(() => this.close(true), 325);
          } else {
            this.close(true);
          }
        }
      },
      afterUnlisten: () => {
        // Restore menu focus, fix for `this.instance.unlisten();` call in the tableView.js@260 file.
        // This prevents losing table responsiveness for keyboard events when filter select menu is closed (#6497).
        if (!this.hasSelectedItem() && this.isOpened()) {
          this.hotMenu.listen();
        }
      },
    };

    this.origOutsideClickDeselects = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
    this.hotMenu = new this.hot.constructor(this.container, settings);
    this.hotMenu.addHook('afterInit', () => this.onAfterInit());
    this.hotMenu.init();
    this.hotMenu.listen();

    this.navigator.setMenu(this.hotMenu);

    const shortcutManager = this.hotMenu.getShortcutManager();
    const menuContext = shortcutManager.addContext(SHORTCUTS_GROUP);
    const config = { group: SHORTCUTS_CONTEXT };
    const menuContextConfig = {
      ...config,
      runOnlyIf: event => !isInput(event.target) || !this.container.contains(event.target),
    };

    // Default shortcuts for Handsontable should not be handled. Changing context will help with that.
    shortcutManager.setActiveContextName('menu');

    menuContext.addShortcuts([{
      keys: [['Escape']],
      callback: () => this.close(true),
    }, {
      keys: [['ArrowDown']],
      callback: () => this.navigator.selectNext(),
    }, {
      keys: [['ArrowUp']],
      callback: () => this.navigator.selectPrev(),
    }, {
      keys: [['ArrowRight']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        if (selection) {
          const subMenu = this.openSubMenu(selection[0]);

          if (subMenu) {
            subMenu.navigator.selectFirst();
          }
        }
      }
    }, {
      keys: [['ArrowLeft']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        if (selection && this.isSubMenu()) {
          this.close();

          if (this.parentMenu) {
            this.parentMenu.hotMenu.listen();
          }
        }
      },
    }, {
      keys: [['Control/Meta', 'ArrowUp'], ['Home']],
      callback: () => this.navigator.selectFirst(),
    }, {
      keys: [['Control/Meta', 'ArrowDown'], ['End']],
      callback: () => this.navigator.selectLast(),
    }, {
      keys: [['Enter'], ['Space']],
      callback: (event) => {
        const selection = this.hotMenu.getSelectedLast();

        if (this.hotMenu.getSourceDataAtRow(selection[0]).submenu) {
          this.openSubMenu(selection[0]).navigator.selectFirst();
        } else {
          this.executeCommand(event);
          this.close(true);
        }
      }
    }, {
      keys: [['PageUp']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        if (selection) {
          this.hotMenu.selection.transformStart(-this.hotMenu.countVisibleRows(), 0);
        } else {
          this.navigator.selectFirst();
        }
      },
    }, {
      keys: [['PageDown']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        if (selection) {
          this.hotMenu.selection.transformStart(this.hotMenu.countVisibleRows(), 0);
        } else {
          this.navigator.selectLast();
        }
      },
    }, {
      keys: [['Tab'], ['Shift', 'Tab']],
      forwardToContext: this.hot.getShortcutManager().getContext('grid'),
      callback: () => {
        this.close(true);
      },
    }], menuContextConfig);

    this.runLocalHooks('afterOpen');
  }

  /**
   * Close menu.
   *
   * @param {boolean} [closeParent=false] If `true` try to close parent menu if exists.
   */
  close(closeParent = false) {
    if (!this.isOpened()) {
      return;
    }

    if (closeParent && this.parentMenu) {
      this.parentMenu.close();
    } else {
      this.navigator.clear();
      this.closeAllSubMenus();
      this.container.style.display = 'none';
      this.hotMenu.destroy();
      this.hotMenu = null;
      this.hot.getSettings().outsideClickDeselects = this.origOutsideClickDeselects;
      this.runLocalHooks('afterClose');

      if (this.parentMenu) {
        this.parentMenu.hotMenu.listen();
      }
    }
  }

  /**
   * Open sub menu at the provided row index.
   *
   * @param {number} row Row index.
   * @returns {Menu|boolean} Returns created menu or `false` if no one menu was created.
   */
  openSubMenu(row) {
    if (!this.hotMenu) {
      return false;
    }

    const cell = this.hotMenu.getCell(row, 0);

    this.closeAllSubMenus();

    if (!cell || !hasSubMenu(cell)) {
      return false;
    }

    const dataItem = this.hotMenu.getSourceDataAtRow(row);
    const subMenu = new Menu(this.hot, {
      parent: this,
      name: dataItem.name,
      className: this.options.className,
      keepInViewport: true,
      container: this.options.container,
    });

    subMenu.setMenuItems(dataItem.submenu.items);
    subMenu.open();
    subMenu.setPosition(cell.getBoundingClientRect());
    this.hotSubMenus[dataItem.key] = subMenu;

    return subMenu;
  }

  /**
   * Close sub menu at row index.
   *
   * @param {number} row Row index.
   */
  closeSubMenu(row) {
    const dataItem = this.hotMenu.getSourceDataAtRow(row);
    const menus = this.hotSubMenus[dataItem.key];

    if (menus) {
      menus.destroy();
      delete this.hotSubMenus[dataItem.key];
    }
  }

  /**
   * Close all opened sub menus.
   */
  closeAllSubMenus() {
    arrayEach(this.hotMenu.getData(), (value, row) => this.closeSubMenu(row));
  }

  /**
   * Checks if all created and opened sub menus are closed.
   *
   * @returns {boolean}
   */
  isAllSubMenusClosed() {
    return Object.keys(this.hotSubMenus).length === 0;
  }

  /**
   * Destroy instance.
   */
  destroy() {
    const menuContainerParentElement = this.container.parentNode;

    this.clearLocalHooks();
    this.close();
    this.parentMenu = null;
    this.eventManager.destroy();

    if (menuContainerParentElement) {
      menuContainerParentElement.removeChild(this.container);
    }
  }

  /**
   * Checks if menu was opened.
   *
   * @returns {boolean} Returns `true` if menu was opened.
   */
  isOpened() {
    return this.hotMenu !== null;
  }

  /**
   * Execute menu command.
   *
   * The `executeCommand()` method works only for selected cells.
   *
   * When no cells are selected, `executeCommand()` doesn't do anything.
   *
   * @param {Event} [event] The mouse event object.
   */
  executeCommand(event) {
    if (!this.isOpened() || !this.hasSelectedItem()) {
      return;
    }
    const selectedItem = this.getSelectedItem();

    this.runLocalHooks('select', selectedItem, event);

    if (this.isCommandPassive(selectedItem)) {
      return;
    }

    const selRanges = this.hot.getSelectedRange();
    const normalizedSelection = selRanges ? normalizeSelection(selRanges) : [];

    this.runLocalHooks('executeCommand', selectedItem.key, normalizedSelection, event);

    if (this.isSubMenu()) {
      this.parentMenu.runLocalHooks('executeCommand', selectedItem.key, normalizedSelection, event);
    }
  }

  /**
   * Checks if the passed command is passive or not. The command is passive when it's marked as
   * disabled, the descriptor object contains `isCommand` property set to `false`, command
   * is a separator, or the item is recognized as submenu. For passive items the menu is not
   * closed automatically after the user trigger the command through the UI.
   *
   * @param {object} commandDescriptor Selected menu item from the menu data source.
   * @returns {boolean}
   */
  isCommandPassive(commandDescriptor) {
    const { isCommand, name: commandName, disabled, submenu } = commandDescriptor;

    const isItemDisabled = disabled === true || (typeof disabled === 'function' && disabled.call(this.hot) === true);

    return isCommand === false || commandName === SEPARATOR || isItemDisabled === true || submenu;
  }

  /**
   * Set offset menu position for specified area (`above`, `below`, `left` or `right`).
   *
   * @param {string} area Specified area name (`above`, `below`, `left` or `right`).
   * @param {number} offset Offset value.
   */
  setOffset(area, offset = 0) {
    this.positioner.setOffset(area, offset);
  }

  /**
   * Set menu position based on dom event or based on literal object.
   *
   * @param {Event|object} coords Event or literal Object with coordinates.
   */
  setPosition(coords) {
    if (this.isSubMenu()) {
      this.positioner.setParentElement(this.parentMenu.container);
    }

    this.positioner
      .setElement(this.container)
      .updatePosition(coords);
  }

  /**
   * Menu item renderer.
   *
   * @private
   * @param {Core} hot The Handsontable instance.
   * @param {HTMLCellElement} TD The rendered cell element.
   * @param {number} row The visual index.
   * @param {number} col The visual index.
   * @param {string} prop The column property if used.
   * @param {string} value The cell value.
   */
  menuItemRenderer(hot, TD, row, col, prop, value) {
    const item = hot.getSourceDataAtRow(row);
    const wrapper = this.hot.rootDocument.createElement('div');

    const isSubMenu = itemToTest => hasOwnProperty(itemToTest, 'submenu');
    const itemIsSeparator = itemToTest => new RegExp(SEPARATOR, 'i').test(itemToTest.name);
    const itemIsDisabled = itemToTest => itemToTest.disabled === true ||
      (typeof itemToTest.disabled === 'function' && itemToTest.disabled.call(this.hot) === true);
    const itemIsSelectionDisabled = itemToTest => itemToTest.disableSelection;
    let itemValue = value;

    if (typeof itemValue === 'function') {
      itemValue = itemValue.call(this.hot);
    }
    empty(TD);
    addClass(wrapper, 'htItemWrapper');
    TD.appendChild(wrapper);

    if (itemIsSeparator(item)) {
      addClass(TD, 'htSeparator');

    } else if (typeof item.renderer === 'function') {
      addClass(TD, 'htCustomMenuRenderer');
      TD.appendChild(item.renderer(hot, wrapper, row, col, prop, itemValue));

    } else {
      fastInnerHTML(wrapper, itemValue);
    }
    if (itemIsDisabled(item)) {
      addClass(TD, 'htDisabled');
      this.eventManager.addEventListener(TD, 'mouseenter', () => hot.deselectCell());

    } else if (itemIsSelectionDisabled(item)) {
      addClass(TD, 'htSelectionDisabled');
      this.eventManager.addEventListener(TD, 'mouseenter', () => hot.deselectCell());

    } else if (isSubMenu(item)) {
      addClass(TD, 'htSubmenu');

      if (itemIsSelectionDisabled(item)) {
        this.eventManager.addEventListener(TD, 'mouseenter', () => hot.deselectCell());
      } else {
        this.eventManager
          .addEventListener(TD, 'mouseenter', () => hot.selectCell(row, col, void 0, void 0, false, false));
      }
    } else {
      removeClass(TD, ['htSubmenu', 'htDisabled']);

      if (itemIsSelectionDisabled(item)) {
        this.eventManager.addEventListener(TD, 'mouseenter', () => hot.deselectCell());
      } else {
        this.eventManager
          .addEventListener(TD, 'mouseenter', () => hot.selectCell(row, col, void 0, void 0, false, false));
      }
    }
  }

  /**
   * Create container/wrapper for handsontable.
   *
   * @private
   * @param {string} [name] Class name.
   * @returns {HTMLElement}
   */
  createContainer(name = null) {
    const doc = this.options.container.ownerDocument;
    let className = name;
    let container;

    if (className) {
      if (isFunction(className)) {
        className = className.call(this.hot);

        if (className === null || isUndefined(className)) {
          className = '';

        } else {
          className = className.toString();
        }
      }

      className = className.replace(/[^A-z0-9]/g, '_');
      className = `${this.options.className}Sub_${className}`;

      container = doc.querySelector(`.${this.options.className}.${className}`);
    }

    if (!container) {
      container = doc.createElement('div');

      addClass(container, `htMenu ${this.options.className}`);

      if (className) {
        addClass(container, className);
      }

      this.options.container.appendChild(container);
    }

    return container;
  }

  /**
   * On after init listener.
   *
   * @private
   */
  onAfterInit() {
    const { wtTable } = this.hotMenu.view._wt;
    const data = this.hotMenu.getSettings().data;
    const hiderStyle = wtTable.hider.style;
    const holderStyle = wtTable.holder.style;
    const currentHiderWidth = parseInt(hiderStyle.width, 10);

    const realHeight = arrayReduce(data, (accumulator, value) => accumulator + (value.name === SEPARATOR ? 1 : 26), 0);

    // Additional 3px to menu's size because of additional border around its `table.htCore`.
    holderStyle.width = `${currentHiderWidth + 3}px`;
    holderStyle.height = `${realHeight + 3}px`;
    hiderStyle.height = holderStyle.height;
  }

  /**
   * Document mouse down listener.
   *
   * @private
   * @param {Event} event The mouse event object.
   */
  onDocumentMouseDown(event) {
    if (!this.isOpened()) {
      return;
    }

    // Close menu when clicked element is not belongs to menu itself
    if (this.options.standalone && this.hotMenu && !isChildOf(event.target, this.hotMenu.rootElement)) {
      this.close(true);

      // Automatically close menu when clicked element is not belongs to menu or submenu (not necessarily to itself)
    } else if ((this.isAllSubMenusClosed() || this.isSubMenu()) && !isChildOf(event.target, '.htMenu')) {
      this.close(true);
    }
  }

  /**
   * Document's contextmenu listener.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onDocumentContextMenu(event) {
    if (!this.isOpened()) {
      return;
    }

    if (hasClass(event.target, 'htCore') && isChildOf(event.target, this.hotMenu.rootElement)) {
      event.preventDefault();
    }
  }
}

mixin(Menu, localHooks);
