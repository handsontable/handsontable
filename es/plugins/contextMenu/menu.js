var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import Core from './../../core';
import { addClass, empty, fastInnerHTML, getScrollbarWidth, isChildOf, removeClass } from './../../helpers/dom/element';
import { arrayEach, arrayFilter, arrayReduce } from './../../helpers/array';
import Cursor from './cursor';
import EventManager from './../../eventManager';
import { mixin, hasOwnProperty } from './../../helpers/object';
import { isUndefined, isDefined } from './../../helpers/mixed';
import { debounce, isFunction } from './../../helpers/function';
import { filterSeparators, hasSubMenu, isDisabled, isItemHidden, isSeparator, isSelectionDisabled, normalizeSelection } from './utils';
import { KEY_CODES } from './../../helpers/unicode';
import localHooks from './../../mixins/localHooks';
import { SEPARATOR } from './predefinedItems';
import { stopImmediatePropagation } from './../../helpers/dom/event';

var MIN_WIDTH = 215;

/**
 * @class Menu
 * @plugin ContextMenu
 */

var Menu = function () {
  function Menu(hotInstance, options) {
    _classCallCheck(this, Menu);

    this.hot = hotInstance;
    this.options = options || {
      parent: null,
      name: null,
      className: '',
      keepInViewport: true,
      standalone: false,
      minWidth: MIN_WIDTH
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


  _createClass(Menu, [{
    key: 'registerEvents',
    value: function registerEvents() {
      var _this = this;

      this.eventManager.addEventListener(document.documentElement, 'mousedown', function (event) {
        return _this.onDocumentMouseDown(event);
      });
    }

    /**
     * Set array of objects which defines menu items.
     *
     * @param {Array} menuItems Menu items to display.
     */

  }, {
    key: 'setMenuItems',
    value: function setMenuItems(menuItems) {
      this.menuItems = menuItems;
    }

    /**
     * Set offset menu position for specified area (`above`, `below`, `left` or `right`).
     *
     * @param {String} area Specified area name (`above`, `below`, `left` or `right`).
     * @param {Number} offset Offset value.
     */

  }, {
    key: 'setOffset',
    value: function setOffset(area) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      this.offset[area] = offset;
    }

    /**
     * Check if menu is using as sub-menu.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isSubMenu',
    value: function isSubMenu() {
      return this.parentMenu !== null;
    }

    /**
     * Open menu.
     *
     * @fires Hooks#beforeContextMenuShow
     * @fires Hooks#afterContextMenuShow
     */

  }, {
    key: 'open',
    value: function open() {
      var _this2 = this;

      this.runLocalHooks('beforeOpen');

      this.container.removeAttribute('style');
      this.container.style.display = 'block';

      var delayedOpenSubMenu = debounce(function (row) {
        return _this2.openSubMenu(row);
      }, 300);
      var minWidthOfMenu = this.options.minWidth || MIN_WIDTH;

      var filteredItems = arrayFilter(this.menuItems, function (item) {
        return isItemHidden(item, _this2.hot);
      });

      filteredItems = filterSeparators(filteredItems, SEPARATOR);

      var settings = {
        data: filteredItems,
        colHeaders: false,
        autoColumnSize: true,
        modifyColWidth: function modifyColWidth(width) {
          if (isDefined(width) && width < minWidthOfMenu) {
            return minWidthOfMenu;
          }

          return width;
        },

        autoRowSize: false,
        readOnly: true,
        copyPaste: false,
        columns: [{
          data: 'name',
          renderer: function renderer(hot, TD, row, col, prop, value) {
            return _this2.menuItemRenderer(hot, TD, row, col, prop, value);
          }
        }],
        renderAllRows: true,
        fragmentSelection: 'cell',
        disableVisualSelection: 'area',
        beforeKeyDown: function beforeKeyDown(event) {
          return _this2.onBeforeKeyDown(event);
        },
        afterOnCellMouseOver: function afterOnCellMouseOver(event, coords) {
          if (_this2.isAllSubMenusClosed()) {
            delayedOpenSubMenu(coords.row);
          } else {
            _this2.openSubMenu(coords.row);
          }
        },
        rowHeights: function rowHeights(row) {
          return filteredItems[row].name === SEPARATOR ? 1 : 23;
        }
      };
      this.origOutsideClickDeselects = this.hot.getSettings().outsideClickDeselects;
      this.hot.getSettings().outsideClickDeselects = false;
      this.hotMenu = new Core(this.container, settings);
      this.hotMenu.addHook('afterInit', function () {
        return _this2.onAfterInit();
      });
      this.hotMenu.addHook('afterSelection', function () {
        return _this2.onAfterSelection.apply(_this2, arguments);
      });
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

  }, {
    key: 'close',
    value: function close() {
      var closeParent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

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

  }, {
    key: 'openSubMenu',
    value: function openSubMenu(row) {
      if (!this.hotMenu) {
        return false;
      }
      var cell = this.hotMenu.getCell(row, 0);

      this.closeAllSubMenus();

      if (!cell || !hasSubMenu(cell)) {
        return false;
      }
      var dataItem = this.hotMenu.getSourceDataAtRow(row);
      var subMenu = new Menu(this.hot, {
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

  }, {
    key: 'closeSubMenu',
    value: function closeSubMenu(row) {
      var dataItem = this.hotMenu.getSourceDataAtRow(row);
      var menus = this.hotSubMenus[dataItem.key];

      if (menus) {
        menus.destroy();
        delete this.hotSubMenus[dataItem.key];
      }
    }

    /**
     * Close all opened sub menus.
     */

  }, {
    key: 'closeAllSubMenus',
    value: function closeAllSubMenus() {
      var _this3 = this;

      arrayEach(this.hotMenu.getData(), function (value, row) {
        return _this3.closeSubMenu(row);
      });
    }

    /**
     * Checks if all created and opened sub menus are closed.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isAllSubMenusClosed',
    value: function isAllSubMenusClosed() {
      return Object.keys(this.hotSubMenus).length === 0;
    }

    /**
     * Destroy instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
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

  }, {
    key: 'isOpened',
    value: function isOpened() {
      return this.hotMenu !== null;
    }

    /**
     * Execute menu command.
     *
     * @param {Event} [event]
     */

  }, {
    key: 'executeCommand',
    value: function executeCommand(event) {
      if (!this.isOpened() || !this.hotMenu.getSelectedLast()) {
        return;
      }
      var selectedItem = this.hotMenu.getSourceDataAtRow(this.hotMenu.getSelectedLast()[0]);

      this.runLocalHooks('select', selectedItem, event);

      if (selectedItem.isCommand === false || selectedItem.name === SEPARATOR) {
        return;
      }
      var selRanges = this.hot.getSelectedRange();
      var normalizedSelection = selRanges ? normalizeSelection(selRanges) : [];
      var autoClose = true;

      // Don't close context menu if item is disabled or it has submenu
      if (selectedItem.disabled === true || typeof selectedItem.disabled === 'function' && selectedItem.disabled.call(this.hot) === true || selectedItem.submenu) {
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

  }, {
    key: 'setPosition',
    value: function setPosition(coords) {
      var cursor = new Cursor(coords);

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

  }, {
    key: 'setPositionAboveCursor',
    value: function setPositionAboveCursor(cursor) {
      var top = this.offset.above + cursor.top - this.container.offsetHeight;

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

  }, {
    key: 'setPositionBelowCursor',
    value: function setPositionBelowCursor(cursor) {
      var top = this.offset.below + cursor.top;

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

  }, {
    key: 'setPositionOnRightOfCursor',
    value: function setPositionOnRightOfCursor(cursor) {
      var left = void 0;

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

  }, {
    key: 'setPositionOnLeftOfCursor',
    value: function setPositionOnLeftOfCursor(cursor) {
      var left = this.offset.left + cursor.left - this.container.offsetWidth + getScrollbarWidth() + 4;

      this.container.style.left = left + 'px';
    }

    /**
     * Select first cell in opened menu.
     */

  }, {
    key: 'selectFirstCell',
    value: function selectFirstCell() {
      var cell = this.hotMenu.getCell(0, 0);

      if (isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
        this.selectNextCell(0, 0);
      } else {
        this.hotMenu.selectCell(0, 0);
      }
    }

    /**
     * Select last cell in opened menu.
     */

  }, {
    key: 'selectLastCell',
    value: function selectLastCell() {
      var lastRow = this.hotMenu.countRows() - 1;
      var cell = this.hotMenu.getCell(lastRow, 0);

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

  }, {
    key: 'selectNextCell',
    value: function selectNextCell(row, col) {
      var nextRow = row + 1;
      var cell = nextRow < this.hotMenu.countRows() ? this.hotMenu.getCell(nextRow, col) : null;

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

  }, {
    key: 'selectPrevCell',
    value: function selectPrevCell(row, col) {
      var prevRow = row - 1;
      var cell = prevRow >= 0 ? this.hotMenu.getCell(prevRow, col) : null;

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

  }, {
    key: 'menuItemRenderer',
    value: function menuItemRenderer(hot, TD, row, col, prop, value) {
      var _this4 = this;

      var item = hot.getSourceDataAtRow(row);
      var wrapper = document.createElement('div');

      var isSubMenu = function isSubMenu(itemToTest) {
        return hasOwnProperty(itemToTest, 'submenu');
      };
      var itemIsSeparator = function itemIsSeparator(itemToTest) {
        return new RegExp(SEPARATOR, 'i').test(itemToTest.name);
      };
      var itemIsDisabled = function itemIsDisabled(itemToTest) {
        return itemToTest.disabled === true || typeof itemToTest.disabled === 'function' && itemToTest.disabled.call(_this4.hot) === true;
      };
      var itemIsSelectionDisabled = function itemIsSelectionDisabled(itemToTest) {
        return itemToTest.disableSelection;
      };
      var itemValue = value;

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
        this.eventManager.addEventListener(TD, 'mouseenter', function () {
          return hot.deselectCell();
        });
      } else if (itemIsSelectionDisabled(item)) {
        addClass(TD, 'htSelectionDisabled');
        this.eventManager.addEventListener(TD, 'mouseenter', function () {
          return hot.deselectCell();
        });
      } else if (isSubMenu(item)) {
        addClass(TD, 'htSubmenu');

        if (itemIsSelectionDisabled(item)) {
          this.eventManager.addEventListener(TD, 'mouseenter', function () {
            return hot.deselectCell();
          });
        } else {
          this.eventManager.addEventListener(TD, 'mouseenter', function () {
            return hot.selectCell(row, col, void 0, void 0, false, false);
          });
        }
      } else {
        removeClass(TD, 'htSubmenu');
        removeClass(TD, 'htDisabled');

        if (itemIsSelectionDisabled(item)) {
          this.eventManager.addEventListener(TD, 'mouseenter', function () {
            return hot.deselectCell();
          });
        } else {
          this.eventManager.addEventListener(TD, 'mouseenter', function () {
            return hot.selectCell(row, col, void 0, void 0, false, false);
          });
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

  }, {
    key: 'createContainer',
    value: function createContainer() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var className = name;
      var container = void 0;

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
        className = this.options.className + 'Sub_' + className;

        container = document.querySelector('.' + this.options.className + '.' + className);
      } else {
        container = document.querySelector('.' + this.options.className);
      }

      if (!container) {
        container = document.createElement('div');

        addClass(container, 'htMenu ' + this.options.className);

        if (className) {
          addClass(container, className);
        }
        document.getElementsByTagName('body')[0].appendChild(container);
      }

      return container;
    }

    /**
     * @private
     */

  }, {
    key: 'blockMainTableCallbacks',
    value: function blockMainTableCallbacks() {
      this._afterScrollCallback = function () {};
      this.hot.addHook('afterScrollVertically', this._afterScrollCallback);
      this.hot.addHook('afterScrollHorizontally', this._afterScrollCallback);
    }

    /**
     * @private
     */

  }, {
    key: 'releaseMainTableCallbacks',
    value: function releaseMainTableCallbacks() {
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

  }, {
    key: 'onBeforeKeyDown',
    value: function onBeforeKeyDown(event) {
      var selection = this.hotMenu.getSelectedLast();
      var stopEvent = false;
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
            var menu = this.openSubMenu(selection[0]);

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

  }, {
    key: 'onAfterInit',
    value: function onAfterInit() {
      var data = this.hotMenu.getSettings().data;
      var hiderStyle = this.hotMenu.view.wt.wtTable.hider.style;
      var holderStyle = this.hotMenu.view.wt.wtTable.holder.style;
      var currentHiderWidth = parseInt(hiderStyle.width, 10);

      var realHeight = arrayReduce(data, function (accumulator, value) {
        return accumulator + (value.name === SEPARATOR ? 1 : 26);
      }, 0);

      holderStyle.width = currentHiderWidth + 22 + 'px';
      holderStyle.height = realHeight + 4 + 'px';
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

  }, {
    key: 'onAfterSelection',
    value: function onAfterSelection(r, c, r2, c2, preventScrolling) {
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

  }, {
    key: 'onDocumentMouseDown',
    value: function onDocumentMouseDown(event) {
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
      } else if ((this.isAllSubMenusClosed() || this.isSubMenu()) && !isChildOf(event.target, '.htMenu') && isChildOf(event.target, document)) {
        this.close(true);
      }
    }
  }]);

  return Menu;
}();

mixin(Menu, localHooks);

export default Menu;