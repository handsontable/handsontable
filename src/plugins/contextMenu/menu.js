import Core from './../../core';
import {
  addClass,
  empty,
  fastInnerHTML,
  getScrollbarWidth,
  isChildOf,
  isInput,
  removeClass,
  getParentWindow,
} from './../../helpers/dom/element';
import { arrayEach, arrayFilter, arrayReduce } from './../../helpers/array';
import Cursor from './cursor';
import EventManager from './../../eventManager';
import { mixin, hasOwnProperty } from './../../helpers/object';
import { isUndefined, isDefined } from './../../helpers/mixed';
import { debounce, isFunction } from './../../helpers/function';
import { filterSeparators, hasSubMenu, isDisabled, isItemHidden, isSeparator, isSelectionDisabled, normalizeSelection } from './utils';
import { KEY_CODES } from './../../helpers/unicode';
import localHooks from './../../mixins/localHooks';
import { SEPARATOR, NO_ITEMS, predefinedItems } from './predefinedItems';
import { stopImmediatePropagation, isRightClick } from './../../helpers/dom/event';
import { isWindowsOS } from './../../helpers/browser';

const MIN_WIDTH = 215;

/**
 * @class Menu
 * @plugin ContextMenu
 */
class Menu {
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
    this.hotMenu = null;
    this.hotSubMenus = {};
    this.parentMenu = this.options.parent || null;
    this.menuItems = null;
    this.origOutsideClickDeselects = null;
    this.keyEvent = false;

    this.offset = {
      above: 0,
      below: 0,
      left: 0,
      right: 0
    };
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
   * @returns {Object|null}
   */
  getSelectedItem() {
    return this.hasSelectedItem() ? this.hotMenu.getSourceDataAtRow(this.hotMenu.getSelectedLast()[0]) : null;
  }

  /**
   * Checks if the menu has selected (highlighted) any item from the menu list.
   *
   * @returns {Boolean}
   */
  hasSelectedItem() {
    return Array.isArray(this.hotMenu.getSelectedLast());
  }

  /**
   * Set offset menu position for specified area (`above`, `below`, `left` or `right`).
   *
   * @param {String} area Specified area name (`above`, `below`, `left` or `right`).
   * @param {Number} offset Offset value.
   */
  setOffset(area, offset = 0) {
    this.offset[area] = offset;
  }

  /**
   * Check if menu is using as sub-menu.
   *
   * @returns {Boolean}
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
      columns: [{
        data: 'name',
        renderer: (hot, TD, row, col, prop, value) => this.menuItemRenderer(hot, TD, row, col, prop, value)
      }],
      renderAllRows: true,
      fragmentSelection: false,
      outsideClickDeselects: false,
      disableVisualSelection: 'area',
      beforeKeyDown: event => this.onBeforeKeyDown(event),
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
          this.close(true);
        }
      },
      afterUnlisten: () => {
        // Restore menu focus, fix for `this.instance.unlisten();` call in the tableView.js@260 file.
        // This prevents losing table responsiveness for keyboard events when filter select menu is closed (#6497).
        if (!this.hasSelectedItem() && this.isOpened()) {
          this.hotMenu.listen(false);
        }
      },
    };
    this.origOutsideClickDeselects = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
    this.hotMenu = new Core(this.container, settings);
    this.hotMenu.addHook('afterInit', () => this.onAfterInit());
    this.hotMenu.addHook('afterSelection', (...args) => this.onAfterSelection(...args));
    this.hotMenu.init();
    this.hotMenu.listen();
    this.blockMainTableCallbacks();
    this.runLocalHooks('afterOpen');
  }

  /**
   * Close menu.
   *
   * @param {Boolean} [closeParent=false] if `true` try to close parent menu if exists.
   */
  close(closeParent = false) {
    if (!this.isOpened()) {
      return;
    }

    if (closeParent && this.parentMenu) {
      this.parentMenu.close();
    } else {
      this.closeAllSubMenus();
      this.container.style.display = 'none';
      this.releaseMainTableCallbacks();
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
   * @param {Number} row Row index.
   * @returns {Menu|Boolean} Returns created menu or `false` if no one menu was created.
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
   * @param {Number} row Row index.
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
   * @returns {Boolean}
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
   * @returns {Boolean} Returns `true` if menu was opened.
   */
  isOpened() {
    return this.hotMenu !== null;
  }

  /**
   * Execute menu command.
   *
   * @param {Event} [event]
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
   * @param {Object} commandDescriptor Selected menu item from the menu data source.
   * @returns {Boolean}
   */
  isCommandPassive(commandDescriptor) {
    const { isCommand, name: commandName, disabled, submenu } = commandDescriptor;

    const isItemDisabled = disabled === true || (typeof disabled === 'function' && disabled.call(this.hot) === true);

    return isCommand === false || commandName === SEPARATOR || isItemDisabled === true || submenu;
  }

  /**
   * Set menu position based on dom event or based on literal object.
   *
   * @param {Event|Object} coords Event or literal Object with coordinates.
   */
  setPosition(coords) {
    const cursor = new Cursor(coords, this.container.ownerDocument.defaultView);

    if (this.options.keepInViewport) {
      if (cursor.fitsBelow(this.container)) {
        this.setPositionBelowCursor(cursor);

      } else if (cursor.fitsAbove(this.container)) {
        this.setPositionAboveCursor(cursor);

      } else {
        this.setPositionBelowCursor(cursor);
      }
      if (cursor.fitsOnRight(this.container)) {
        this.setPositionOnRightOfCursor(cursor);
      } else {
        this.setPositionOnLeftOfCursor(cursor);
      }
    } else {
      this.setPositionBelowCursor(cursor);
      this.setPositionOnRightOfCursor(cursor);
    }
  }

  /**
   * Set menu position above cursor object.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setPositionAboveCursor(cursor) {
    let top = this.offset.above + cursor.top - this.container.offsetHeight;

    if (this.isSubMenu()) {
      top = cursor.top + cursor.cellHeight - this.container.offsetHeight + 3;
    }
    this.container.style.top = `${top}px`;
  }

  /**
   * Set menu position below cursor object.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setPositionBelowCursor(cursor) {
    let top = this.offset.below + cursor.top;

    if (this.isSubMenu()) {
      top = cursor.top - 1;
    }
    this.container.style.top = `${top}px`;
  }

  /**
   * Set menu position on the right of cursor object.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setPositionOnRightOfCursor(cursor) {
    let left;

    if (this.isSubMenu()) {
      left = 1 + cursor.left + cursor.cellWidth;
    } else {
      left = this.offset.right + 1 + cursor.left;
    }

    this.container.style.left = `${left}px`;
  }

  /**
   * Set menu position on the left of cursor object.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setPositionOnLeftOfCursor(cursor) {
    const left = this.offset.left + cursor.left - this.container.offsetWidth + getScrollbarWidth(this.hot.rootDocument) + 4;

    this.container.style.left = `${left}px`;
  }

  /**
   * Select first cell in opened menu.
   */
  selectFirstCell() {
    const cell = this.hotMenu.getCell(0, 0);

    if (isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
      this.selectNextCell(0, 0);
    } else {
      this.hotMenu.selectCell(0, 0);
    }
  }

  /**
   * Select last cell in opened menu.
   */
  selectLastCell() {
    const lastRow = this.hotMenu.countRows() - 1;
    const cell = this.hotMenu.getCell(lastRow, 0);

    if (isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
      this.selectPrevCell(lastRow, 0);
    } else {
      this.hotMenu.selectCell(lastRow, 0);
    }
  }

  /**
   * Select next cell in opened menu.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   */
  selectNextCell(row, col) {
    const nextRow = row + 1;
    const cell = nextRow < this.hotMenu.countRows() ? this.hotMenu.getCell(nextRow, col) : null;

    if (!cell) {
      return;
    }
    if (isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
      this.selectNextCell(nextRow, col);
    } else {
      this.hotMenu.selectCell(nextRow, col);
    }
  }

  /**
   * Select previous cell in opened menu.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   */
  selectPrevCell(row, col) {
    const prevRow = row - 1;
    const cell = prevRow >= 0 ? this.hotMenu.getCell(prevRow, col) : null;

    if (!cell) {
      return;
    }
    if (isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
      this.selectPrevCell(prevRow, col);
    } else {
      this.hotMenu.selectCell(prevRow, col);
    }
  }

  /**
   * Menu item renderer.
   *
   * @private
   */
  menuItemRenderer(hot, TD, row, col, prop, value) {
    const item = hot.getSourceDataAtRow(row);
    const wrapper = this.hot.rootDocument.createElement('div');

    const isSubMenu = itemToTest => hasOwnProperty(itemToTest, 'submenu');
    const itemIsSeparator = itemToTest => new RegExp(SEPARATOR, 'i').test(itemToTest.name);
    const itemIsDisabled = itemToTest => itemToTest.disabled === true || (typeof itemToTest.disabled === 'function' && itemToTest.disabled.call(this.hot) === true);
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
        this.eventManager.addEventListener(TD, 'mouseenter', () => hot.selectCell(row, col, void 0, void 0, false, false));
      }
    } else {
      removeClass(TD, ['htSubmenu', 'htDisabled']);

      if (itemIsSelectionDisabled(item)) {
        this.eventManager.addEventListener(TD, 'mouseenter', () => hot.deselectCell());
      } else {
        this.eventManager.addEventListener(TD, 'mouseenter', () => hot.selectCell(row, col, void 0, void 0, false, false));
      }
    }
  }

  /**
   * Create container/wrapper for handsontable.
   *
   * @private
   * @param {String} [name] Class name.
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
   * @private
   */
  blockMainTableCallbacks() {
    this._afterScrollCallback = function() {};
    this.hot.addHook('afterScrollVertically', this._afterScrollCallback);
    this.hot.addHook('afterScrollHorizontally', this._afterScrollCallback);
  }

  /**
   * @private
   */
  releaseMainTableCallbacks() {
    if (this._afterScrollCallback) {
      this.hot.removeHook('afterScrollVertically', this._afterScrollCallback);
      this.hot.removeHook('afterScrollHorizontally', this._afterScrollCallback);
      this._afterScrollCallback = null;
    }
  }

  /**
   * On before key down listener.
   *
   * @private
   * @param {Event} event
   */
  onBeforeKeyDown(event) {
    // For input elements, prevent event propagation. It allows entering text into an input
    // element freely - without steeling the key events from the menu module (#6506, #6549).
    if (isInput(event.target) && this.container.contains(event.target)) {
      stopImmediatePropagation(event);

      return;
    }

    const selection = this.hotMenu.getSelectedLast();
    let stopEvent = false;
    this.keyEvent = true;

    switch (event.keyCode) {
      case KEY_CODES.ESCAPE:
        this.close();
        stopEvent = true;
        break;

      case KEY_CODES.ENTER:
        if (selection) {
          if (this.hotMenu.getSourceDataAtRow(selection[0]).submenu) {
            stopEvent = true;
          } else {
            this.executeCommand(event);
            this.close(true);
          }
        }
        break;

      case KEY_CODES.ARROW_DOWN:
        if (selection) {
          this.selectNextCell(selection[0], selection[1]);
        } else {
          this.selectFirstCell();
        }
        stopEvent = true;
        break;

      case KEY_CODES.ARROW_UP:
        if (selection) {
          this.selectPrevCell(selection[0], selection[1]);
        } else {
          this.selectLastCell();
        }
        stopEvent = true;
        break;

      case KEY_CODES.ARROW_RIGHT:
        if (selection) {
          const menu = this.openSubMenu(selection[0]);

          if (menu) {
            menu.selectFirstCell();
          }
        }
        stopEvent = true;

        break;

      case KEY_CODES.ARROW_LEFT:
        if (selection && this.isSubMenu()) {
          this.close();

          if (this.parentMenu) {
            this.parentMenu.hotMenu.listen();
          }
          stopEvent = true;
        }
        break;
      default:
        break;
    }
    if (stopEvent) {
      event.preventDefault();
      stopImmediatePropagation(event);
    }

    this.keyEvent = false;
  }

  /**
   * On after init listener.
   *
   * @private
   */
  onAfterInit() {
    const { wtTable } = this.hotMenu.view.wt;
    const data = this.hotMenu.getSettings().data;
    const hiderStyle = wtTable.hider.style;
    const holderStyle = wtTable.holder.style;
    const currentHiderWidth = parseInt(hiderStyle.width, 10);

    const realHeight = arrayReduce(data, (accumulator, value) => accumulator + (value.name === SEPARATOR ? 1 : 26), 0);

    holderStyle.width = `${currentHiderWidth + 22}px`;
    holderStyle.height = `${realHeight + 4}px`;
    hiderStyle.height = holderStyle.height;
  }

  /**
   * On after selection listener.
   *
   * @param {Number} r Selection start row index.
   * @param {Number} c Selection start column index.
   * @param {Number} r2 Selection end row index.
   * @param {Number} c2 Selection end column index.
   * @param {Object} preventScrolling Object with `value` property where its value change will be observed.
   * @param {Number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   */
  onAfterSelection(r, c, r2, c2, preventScrolling) {
    if (this.keyEvent === false) {
      preventScrolling.value = true;
    }
  }

  /**
   * Document mouse down listener.
   *
   * @private
   * @param {Event} event
   */
  onDocumentMouseDown(event) {
    if (!this.isOpened()) {
      return;
    }

    // Close menu when clicked element is not belongs to menu itself
    if (this.options.standalone && this.hotMenu && !isChildOf(event.target, this.hotMenu.rootElement)) {
      this.close(true);

    // Automatically close menu when clicked element is not belongs to menu or submenu (not necessarily to itself)
    } else if ((this.isAllSubMenusClosed() || this.isSubMenu()) &&
        (!isChildOf(event.target, '.htMenu') && (isChildOf(event.target, this.container.ownerDocument) || isChildOf(event.target, this.hot.rootDocument)))) {
      this.close(true);
    }
  }
}

mixin(Menu, localHooks);

export default Menu;
