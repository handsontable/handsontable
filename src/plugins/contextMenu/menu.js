import Handsontable from './../../browser';
import {
  addClass,
  empty,
  fastInnerHTML,
  getScrollbarWidth,
  isChildOf,
  removeClass,
} from './../../helpers/dom/element';
import {arrayEach, arrayFilter, arrayReduce} from './../../helpers/array';
import {Cursor} from './cursor';
import {EventManager} from './../../eventManager';
import {mixin} from './../../helpers/object';
import {debounce} from './../../helpers/function';
import {filterSeparators, hasSubMenu, isDisabled, isItemHidden, isSeparator, isSelectionDisabled, normalizeSelection} from './utils';
import {KEY_CODES} from './../../helpers/unicode';
import {localHooks} from './../../mixins/localHooks';
import {SEPARATOR} from './predefinedItems';
import {stopImmediatePropagation} from './../../helpers/dom/event';

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
      standalone: false
    };
    this.eventManager = new EventManager(this);
    this.container = this.createContainer(this.options.name);
    this.hotMenu = null;
    this.hotSubMenus = {};
    this.parentMenu = this.options.parent || null;
    this.menuItems = null;
    this.origOutsideClickDeselects = null;
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
    this.eventManager.addEventListener(document.documentElement, 'mousedown', (event) => this.onDocumentMouseDown(event));
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
   */
  open() {
    this.container.removeAttribute('style');
    this.container.style.display = 'block';

    const delayedOpenSubMenu = debounce((row) => this.openSubMenu(row), 300);

    let filteredItems = arrayFilter(this.menuItems, (item) => isItemHidden(item, this.hot));

    filteredItems = filterSeparators(filteredItems, SEPARATOR);

    let settings = {
      data: filteredItems,
      colHeaders: false,
      colWidths: [200],
      autoRowSize: false,
      readOnly: true,
      copyPaste: false,
      columns: [{
        data: 'name',
        renderer: (hot, TD, row, col, prop, value) => this.menuItemRenderer(hot, TD, row, col, prop, value)
      }],
      renderAllRows: true,
      fragmentSelection: 'cell',
      disableVisualSelection: 'area',
      beforeKeyDown: (event) => this.onBeforeKeyDown(event),
      afterOnCellMouseOver: (event, coords, TD) => {
        if (this.isAllSubMenusClosed()) {
          delayedOpenSubMenu(coords.row);
        } else {
          this.openSubMenu(coords.row);
        }
      }
    };
    this.origOutsideClickDeselects = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
    this.hotMenu = new Handsontable.Core(this.container, settings);
    this.hotMenu.addHook('afterInit', () => this.onAfterInit());
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
    let cell = this.hotMenu.getCell(row, 0);

    this.closeAllSubMenus();

    if (!cell || !hasSubMenu(cell)) {
      return false;
    }
    let dataItem = this.hotMenu.getSourceDataAtRow(row);
    let subMenu = new Menu(this.hot, {
      parent: this,
      name: dataItem.name,
      className: this.options.className,
      keepInViewport: true
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
    let dataItem = this.hotMenu.getSourceDataAtRow(row);
    let menus = this.hotSubMenus[dataItem.key];

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
    this.clearLocalHooks();
    this.close();
    this.parentMenu = null;
    this.eventManager.destroy();
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
    if (!this.isOpened() || !this.hotMenu.getSelected()) {
      return;
    }
    const selectedItem = this.hotMenu.getSourceDataAtRow(this.hotMenu.getSelected()[0]);

    this.runLocalHooks('select', selectedItem, event);

    if (selectedItem.isCommand === false || selectedItem.name === SEPARATOR) {
      return;
    }
    const selRange = this.hot.getSelectedRange();
    const normalizedSelection = selRange ? normalizeSelection(selRange) : {};
    let autoClose = true;

    // Don't close context menu if item is disabled or it has submenu
    if (selectedItem.disabled === true ||
        (typeof selectedItem.disabled === 'function' && selectedItem.disabled.call(this.hot) === true) ||
        selectedItem.submenu) {
      autoClose = false;
    }

    this.runLocalHooks('executeCommand', selectedItem.key, normalizedSelection, event);

    if (this.isSubMenu()) {
      this.parentMenu.runLocalHooks('executeCommand', selectedItem.key, normalizedSelection, event);
    }

    if (autoClose) {
      this.close(true);
    }
  }

  /**
   * Set menu position based on dom event or based on literal object.
   *
   * @param {Event|Object} coords Event or literal Object with coordinates.
   */
  setPosition(coords) {
    const cursor = new Cursor(coords);

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
    this.container.style.top = top + 'px';
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
    this.container.style.top = top + 'px';
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

    this.container.style.left = left + 'px';
  }

  /**
   * Set menu position on the left of cursor object.
   *
   * @param {Cursor} cursor `Cursor` object.
   */
  setPositionOnLeftOfCursor(cursor) {
    let left = this.offset.left + cursor.left - this.container.offsetWidth + getScrollbarWidth() + 4;

    this.container.style.left = left + 'px';
  }

  /**
   * Select first cell in opened menu.
   */
  selectFirstCell() {
    let cell = this.hotMenu.getCell(0, 0);

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
    let lastRow = this.hotMenu.countRows() - 1;
    let cell = this.hotMenu.getCell(lastRow, 0);

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
    let nextRow = row + 1;
    let cell = nextRow < this.hotMenu.countRows() ? this.hotMenu.getCell(nextRow, col) : null;

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
    let prevRow = row - 1;
    let cell = prevRow >= 0 ? this.hotMenu.getCell(prevRow, col) : null;

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
    let item = hot.getSourceDataAtRow(row);
    let wrapper = document.createElement('div');

    let isSubMenu = (item) => {
      return item.hasOwnProperty('submenu');
    };
    let itemIsSeparator = (item) => {
      return new RegExp(SEPARATOR, 'i').test(item.name);
    };
    let itemIsDisabled = (item) => {
      return item.disabled === true || (typeof item.disabled == 'function' && item.disabled.call(this.hot) === true);
    };
    let itemIsSelectionDisabled = (item) => {
      return item.disableSelection;
    };

    if (typeof value === 'function') {
      value = value.call(this.hot);
    }
    empty(TD);
    addClass(wrapper, 'htItemWrapper');
    TD.appendChild(wrapper);

    if (itemIsSeparator(item)) {
      addClass(TD, 'htSeparator');

    } else if (typeof item.renderer === 'function') {
      addClass(TD, 'htCustomMenuRenderer');
      TD.appendChild(item.renderer(hot, wrapper, row, col, prop, value));

    } else {
      fastInnerHTML(wrapper, value);
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
      removeClass(TD, 'htSubmenu');
      removeClass(TD, 'htDisabled');

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
    if (name) {
      name = name.replace(/ /g, '_');
      name = this.options.className + 'Sub_' + name;
    }
    let container;

    if (name) {
      container = document.querySelector('.' + this.options.className + '.' + name);
    } else {
      container = document.querySelector('.' + this.options.className);
    }
    if (!container) {
      container = document.createElement('div');
      addClass(container, 'htMenu ' + this.options.className);

      if (name) {
        addClass(container, name);
      }
      document.getElementsByTagName('body')[0].appendChild(container);
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
    let selection = this.hotMenu.getSelected();
    let stopEvent = false;

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
          let menu = this.openSubMenu(selection[0]);

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
    }
    if (stopEvent) {
      event.preventDefault();
      stopImmediatePropagation(event);
    }
  }

  /**
   * On after init listener.
   *
   * @private
   */
  onAfterInit() {
    const data = this.hotMenu.getSettings().data;
    const hiderStyle = this.hotMenu.view.wt.wtTable.hider.style;
    const holderStyle = this.hotMenu.view.wt.wtTable.holder.style;
    let currentHiderWidth = parseInt(hiderStyle.width, 10);

    let realHeight = arrayReduce(data, (accumulator, value) => {
      return accumulator + (value.name === SEPARATOR ? 1 : 26);
    }, 0);

    holderStyle.width = currentHiderWidth + 22 + 'px';
    holderStyle.height = realHeight + 4 + 'px';
    hiderStyle.height = holderStyle.height;
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
    if (this.container && isChildOf(event.target, this.container)) {
      this.executeCommand(event);
    }
    // Close menu when clicked element is not belongs to menu itself
    if (this.options.standalone && this.hotMenu && !isChildOf(event.target, this.hotMenu.rootElement)) {
      this.close(true);

    // Automatically close menu when clicked element is not belongs to menu or submenu (not necessarily to itself)
    } else if ((this.isAllSubMenusClosed() || this.isSubMenu()) &&
        (!isChildOf(event.target, '.htMenu') && isChildOf(event.target, document))) {
      this.close(true);
    }
  }
}

mixin(Menu, localHooks);

export {Menu};
