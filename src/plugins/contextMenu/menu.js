
import {
  addClass,
  empty,
  fastInnerHTML,
  getComputedStyle,
  getScrollbarWidth,
  getWindowScrollLeft,
  getWindowScrollTop,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {stopPropagation, stopImmediatePropagation, pageX, pageY} from './../../helpers/dom/event';
import {EventManager} from './../../eventManager';
import {extend, isObject, objectEach} from './../../helpers/object';
import {arrayEach} from './../../helpers/array';
import {SEPARATOR, predefinedItems} from './predefinedItems';
import {Cursor} from './cursor';
import {KEY_CODES} from './../../helpers/unicode';
import {isSeparator, isDisabled, hasSubMenu, normalizeSelection} from './utils';


/**
 * @class Menu
 * @plugin ContextMenu
 */
class Menu {
  constructor(hotInstance, options = {parent: null, name: null, className: 'htMenu'}) {
    this.hot = hotInstance;
    this.options = options;
    this.eventManager = new EventManager(this);
    this.container = this.createContainer(this.options.name);
    this.hotMenu = null;
    this.hotSubMenus = {};
    this.parentMenu = this.options.parent || null;
    this.menuItems = null;
    this._afterScrollCallback = null;

    this.registerEvents();
  }

  /**
   * Register event listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document.documentElement, 'mousedown', (event) => this.close());
    this.eventManager.addEventListener(this.container, 'mousedown', (event) => this.executeCommand(event));
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
   * Check is menu is using as sub-menu.
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

    let settings = {
      data: this.menuItems,
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
      beforeKeyDown: (event) => this.onBeforeKeyDown(event),
      afterOnCellMouseOver: (event, coords, TD) => this.openSubMenu(coords.row)
    };
    this.hotMenu = new Handsontable.Core(this.container, settings);
    this.hotMenu.addHook('afterInit', () => this.onAfterInit());
    this.hotMenu.init();
    this.hotMenu.listen();
    this.blockMainTableCallbacks();
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
      this.hot.listen();
    }
  }

  /**
   * Open sub menu at row index.
   *
   * @param {Number} row Row index.
   * @returns {Menu|Boolean} Returns created menu or `false` if no one menu was created.
   */
  openSubMenu(row) {
    let cell = this.hotMenu.getCell(row, 0);

    this.closeAllSubMenus();

    if (!hasSubMenu(cell)) {
      return false;
    }
    let dataItem = this.hotMenu.getData()[row];
    let subMenu = new Menu(this.hot, {
      parent: this,
      name: dataItem.name,
      className: this.options.className
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
    let dataItem = this.hotMenu.getData()[row];
    let menus = this.hotSubMenus[dataItem.key];

    if (menus) {
      menus.destroy();
      this.hotSubMenus[dataItem.key] = null;
    }
  }

  /**
   * Close all opened sub menus.
   */
  closeAllSubMenus() {
    arrayEach(this.hotMenu.getData(), (value, row) => this.closeSubMenu(row));
    this.hotMenu.listen();
  }

  /**
   * Destroy instance.
   */
  destroy() {
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
   * @param {Event} event
   */
  executeCommand(event) {
    if (!this.isOpened() || !this.hotMenu.getSelected()) {
      return;
    }
    const selectedItem = this.hotMenu.getData()[this.hotMenu.getSelected()[0]];
    const selRange = this.hot.getSelectedRange();
    const normalizedSelection = selRange ? normalizeSelection(selRange) : {};

    this.hot.runHooks('menuExecuteCommand', this.parentMenu || this, selectedItem.key, normalizedSelection, event);
  }

  /**
   * Set menu position based on dom event or based on literal object.
   *
   * @param {Event|Object} coords Event or literal Object with coordinates.
   */
  setPosition(coords) {
    const cursor = new Cursor(coords);

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
  }

  /**
   * Set menu position above cursor object.
   *
   * @param {Cursor} cursor
   */
  setPositionAboveCursor(cursor) {
    let top = cursor.top - this.container.offsetHeight;

    /* jshint -W020 */
    if (this.isSubMenu()) {
      top = window.scrollY + cursor.top + cursor.cellHeight - this.container.offsetHeight + 3;
    }
    this.container.style.top = top + 'px';
  }

  /**
   * Set menu position below cursor object.
   *
   * @param {Cursor} cursor
   */
  setPositionBelowCursor(cursor) {
    let top = cursor.top - 1;

    /* jshint -W020 */
    if (this.isSubMenu()) {
      top = cursor.top + window.scrollY - 1;
    }
    this.container.style.top = top + 'px';
  }

  /**
   * Set menu position on the right of cursor object.
   *
   * @param {Cursor} cursor
   */
  setPositionOnRightOfCursor(cursor) {
    let left;

    if (this.isSubMenu()) {
      left = window.scrollX + 1 + cursor.left + cursor.cellWidth;
    } else {
      left = 1 + cursor.left;
    }
    this.container.style.left = left + 'px';
  }

  /**
   * Set menu position on the left of cursor object.
   *
   * @param {Cursor} cursor
   */
  setPositionOnLeftOfCursor(cursor) {
    this.container.style.left = (cursor.left - this.container.offsetWidth + getScrollbarWidth() + 4) + 'px';
  }

  /**
   * Select first cell in opened menu.
   */
  selectFirstCell() {
    let firstCell = this.hotMenu.getCell(0, 0);

    if (isSeparator(firstCell) || isDisabled(firstCell)) {
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
    let lastCell = this.hotMenu.getCell(lastRow, 0);

    if (isSeparator(lastCell) || isDisabled(lastCell)) {
      this.selectPrevCell(lastRow, 0);
    } else {
      this.hotMenu.selectCell(lastRow, 0);
    }
  }

  /**
   * Select next cell in opened menu.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column indx.
   */
  selectNextCell(row, col) {
    let nextRow = row + 1;
    let nextCell = nextRow < this.hotMenu.countRows() ? this.hotMenu.getCell(nextRow, col) : null;

    if (!nextCell) {
      return;
    }
    if (isSeparator(nextCell) || isDisabled(nextCell)) {
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
    let prevCell = prevRow >= 0 ? this.hotMenu.getCell(prevRow, col) : null;

    if (!prevCell) {
      return;
    }
    if (isSeparator(prevCell) || isDisabled(prevCell)) {
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
    let item = hot.getData()[row];
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

    if (typeof value === 'function') {
      value = value.call(this.hot);
    }
    empty(TD);
    TD.appendChild(wrapper);

    if (itemIsSeparator(item)) {
      addClass(TD, 'htSeparator');
    } else {
      fastInnerHTML(wrapper, value);
    }
    if (itemIsDisabled(item)) {
      addClass(TD, 'htDisabled');
      this.eventManager.addEventListener(wrapper, 'mouseenter', () => hot.deselectCell);

    } else if (isSubMenu(item)) {
      addClass(TD, 'htSubmenu');
      this.eventManager.addEventListener(wrapper, 'mouseenter', () => hot.selectCell(row, col));

    } else {
      removeClass(TD, 'htSubmenu');
      removeClass(TD, 'htDisabled');
      this.eventManager.addEventListener(wrapper, 'mouseenter', () => hot.selectCell(row, col));
    }
  }

  /**
   * Create container/wrapper for handsontable.
   *
   * @private
   * @param {String} [name] Class name
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
      addClass(container, this.options.className);

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
   * On before key down listener
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
          if (this.hotMenu.getData()[selection[0]].submenu) {
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
        if (selection && this.parentMenu) {
          this.parentMenu.closeAllSubMenus();
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
    let realHeight = 0;

    arrayEach(data, (value) => realHeight += value.name === SEPARATOR ? 1 : 26);
    holderStyle.width = currentHiderWidth + 22 + 'px';
    holderStyle.height = realHeight + 4 + 'px';
  }
}

export {Menu};
