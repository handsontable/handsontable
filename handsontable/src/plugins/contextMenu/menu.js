import Cursor from './cursor';
import { SEPARATOR, NO_ITEMS, predefinedItems } from './predefinedItems';
import {
  filterSeparators,
  hasSubMenu,
  isDisabled,
  isItemHidden,
  isSeparator,
  isSelectionDisabled,
  normalizeSelection
} from './utils';
import Core from '../../core';
import EventManager from '../../eventManager';
import { arrayEach, arrayFilter, arrayReduce } from '../../helpers/array';
import { isWindowsOS, isMobileBrowser, isIpadOS } from '../../helpers/browser';
import {
  addClass,
  empty,
  fastInnerHTML,
  isChildOf,
  isInput,
  removeClass,
  getParentWindow,
  hasClass,
} from '../../helpers/dom/element';
import { isRightClick } from '../../helpers/dom/event';
import { debounce, isFunction } from '../../helpers/function';
import { isUndefined, isDefined } from '../../helpers/mixed';
import { mixin, hasOwnProperty } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

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
class Menu {
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
   * Set offset menu position for specified area (`above`, `below`, `left` or `right`).
   *
   * @param {string} area Specified area name (`above`, `below`, `left` or `right`).
   * @param {number} offset Offset value.
   */
  setOffset(area, offset = 0) {
    this.offset[area] = offset;
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
            setTimeout(() => this.close(true), 325);
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
    this.hotMenu = new Core(this.container, settings);
    this.hotMenu.addHook('afterInit', () => this.onAfterInit());
    this.hotMenu.addHook('afterSelection', (...args) => this.onAfterSelection(...args));
    this.hotMenu.init();
    this.hotMenu.listen();

    const shortcutManager = this.hotMenu.getShortcutManager();
    const menuContext = shortcutManager.addContext(SHORTCUTS_GROUP);
    const config = { group: SHORTCUTS_CONTEXT };
    const menuContextConfig = {
      ...config,
      runOnlyIf: event => isInput(event.target) === false || this.container.contains(event.target) === false,
    };

    // Default shortcuts for Handsontable should not be handled. Changing context will help with that.
    shortcutManager.setActiveContextName('menu');

    menuContext.addShortcuts([{
      keys: [['Escape']],
      callback: () => {
        this.keyEvent = true;
        this.close();
        this.keyEvent = false;
      },
    }, {
      keys: [['ArrowDown']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (selection) {
          this.selectNextCell(selection[0], selection[1]);

        } else {
          this.selectFirstCell();
        }

        this.keyEvent = false;
      },
    }, {
      keys: [['ArrowUp']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (selection) {
          this.selectPrevCell(selection[0], selection[1]);

        } else {
          this.selectLastCell();
        }

        this.keyEvent = false;
      }
    }, {
      keys: [['ArrowRight']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (selection) {
          const menu = this.openSubMenu(selection[0]);

          if (menu) {
            menu.selectFirstCell();
          }
        }

        this.keyEvent = false;
      }
    }, {
      keys: [['ArrowLeft']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (selection && this.isSubMenu()) {
          this.close();

          if (this.parentMenu) {
            this.parentMenu.hotMenu.listen();
          }
        }

        this.keyEvent = false;
      },
    }, {
      keys: [['Enter']],
      callback: (event) => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (!this.hotMenu.getSourceDataAtRow(selection[0]).submenu) {
          this.executeCommand(event);
          this.close(true);
        }

        this.keyEvent = false;
      }
    }, {
      keys: [['PageUp']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (selection) {
          this.hotMenu.selection.transformStart(-this.hotMenu.countVisibleRows(), 0);

        } else {
          this.selectFirstCell();
        }

        this.keyEvent = false;
      },
    }, {
      keys: [['PageDown']],
      callback: () => {
        const selection = this.hotMenu.getSelectedLast();

        this.keyEvent = true;

        if (selection) {
          this.hotMenu.selection.transformStart(this.hotMenu.countVisibleRows(), 0);

        } else {
          this.selectLastCell();
        }

        this.keyEvent = false;
      },
    }], menuContextConfig);

    this.blockMainTableCallbacks();
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
   * @private
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
   * Set menu position based on dom event or based on literal object.
   *
   * @param {Event|object} coords Event or literal Object with coordinates.
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

      if (this.hot.isLtr()) {
        this.setHorizontalPositionForLtr(cursor);
      } else {
        this.setHorizontalPositionForRtl(cursor);
      }
    } else {
      this.setPositionBelowCursor(cursor);
      this.setPositionOnRightOfCursor(cursor);
    }
  }

  /**
   * Set menu horizontal position for RTL mode.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setHorizontalPositionForRtl(cursor) {
    if (cursor.fitsOnLeft(this.container)) {
      this.setPositionOnLeftOfCursor(cursor);
    } else {
      this.setPositionOnRightOfCursor(cursor);
    }
  }

  /**
   * Set menu horizontal position for LTR mode.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setHorizontalPositionForLtr(cursor) {
    if (cursor.fitsOnRight(this.container)) {
      this.setPositionOnRightOfCursor(cursor);
    } else {
      this.setPositionOnLeftOfCursor(cursor);
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
    let top = this.offset.below + cursor.top + 1;

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
    let left = cursor.left;

    if (this.isSubMenu()) {
      const { right: parentMenuRight } = this.parentMenu.container.getBoundingClientRect();

      // move the sub menu by the width of the parent's border (usually by 1-2 pixels)
      left += cursor.cellWidth + parentMenuRight - (cursor.left + cursor.cellWidth);
    } else {
      left += this.offset.right;
    }

    this.container.style.left = `${left}px`;
  }

  /**
   * Set menu position on the left of cursor object.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setPositionOnLeftOfCursor(cursor) {
    let left = this.offset.left + cursor.left - this.container.offsetWidth;

    if (this.isSubMenu()) {
      const { left: parentMenuLeft } = this.parentMenu.container.getBoundingClientRect();

      // move the sub menu by the width of the parent's border (usually by 1-2 pixels)
      left -= cursor.left - parentMenuLeft;
    }

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
      // disable default "scroll-to-cell" option and instead of that...
      this.hotMenu.selectCell(lastRow, 0, undefined, undefined, false);
      // ...scroll to the cell with "snap to the bottom" option
      this.hotMenu.scrollViewportTo(lastRow, 0, true, false);
    }
  }

  /**
   * Select next cell in opened menu.
   *
   * @param {number} row Row index.
   * @param {number} col Column index.
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
   * @param {number} row Row index.
   * @param {number} col Column index.
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
   * On after selection listener.
   *
   * @param {number} r Selection start row index.
   * @param {number} c Selection start column index.
   * @param {number} r2 Selection end row index.
   * @param {number} c2 Selection end column index.
   * @param {object} preventScrolling Object with `value` property where its value change will be observed.
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

export default Menu;
