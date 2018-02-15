import Hooks from './../../pluginHooks';
import {hasOwnProperty} from './../../helpers/object';
import {arrayEach} from './../../helpers/array';
import {CellRange, Selection} from './../../3rdparty/walkontable/src';
import * as C from './../../i18n/constants';

function CustomBorders() {}
/** *
 * Current instance (table where borders should be placed)
 */
var instance;

/**
 * This plugin enables an option to apply custom borders through the context menu (configurable with context menu key `borders`).
 *
 * To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in a form of an array.
 *
 * See [Custom Borders](http://docs.handsontable.com/demo-custom-borders.html) demo for more examples.
 *
 * @example
 * ```js
 * ...
 * customBorders: [
 *   {range: {
   *     from: {row: 1, col: 1},
   *     to: {row: 3, col: 4}},
   *     left: {},
   *     right: {},
   *     top: {},
   *     bottom: {}
   *   }
 * ],
 * ...
 *
 * // or
 * ...
 * customBorders: [
 *   {row: 2, col: 2, left: {width: 2, color: 'red'},
 *     right: {width: 1, color: 'green'}, top: '', bottom: ''}
 * ],
 * ...
 * ```
 * @private
 * @class CustomBorders
 * @plugin CustomBorders
 */

/** *
 * Check if plugin should be enabled.
 */
var checkEnable = function(customBorders) {
  if (typeof customBorders === 'boolean') {
    if (customBorders === true) {
      return true;
    }
  }
  if (typeof customBorders === 'object') {
    if (customBorders.length > 0) {
      return true;
    }
  }

  return false;
};

/** *
 * Initialize plugin.
 */
var init = function() {
  if (checkEnable(this.getSettings().customBorders)) {
    if (!this.customBorders) {
      instance = this;
      this.customBorders = new CustomBorders();
    }
  }
};

/** *
 * Get index of border from the settings.
 *
 * @param {String} className
 * @returns {Number}
 */
var getSettingIndex = function(className) {
  let index = -1;

  arrayEach(instance.selection.highlight.borders, (selection, i) => {
    if (selection.settings.className == className) {
      index = i;

      return false;
    }
  });

  return index;
};

/** *
 * Insert WalkontableSelection instance into Walkontable settings.
 *
 * @param border
 */
var insertBorderIntoSettings = function(border) {
  var coordinates = {
    row: border.row,
    col: border.col
  };
  var selection = new Selection(border, new CellRange(coordinates, coordinates, coordinates));
  var index = getSettingIndex(border.className);

  if (index >= 0) {
    instance.selection.highlight.borders[index] = selection;
  } else {
    instance.selection.highlight.borders.push(selection);
  }
};

/** *
 * Prepare borders from setting (single cell).
 *
 * @param {Number} row Visual row index.
 * @param {Number} col Visual column index.
 * @param borderObj
 */
var prepareBorderFromCustomAdded = function(row, col, borderObj) {
  var border = createEmptyBorders(row, col);
  border = extendDefaultBorder(border, borderObj);
  this.setCellMeta(row, col, 'borders', border);

  insertBorderIntoSettings(border);
};

/** *
 * Prepare borders from setting (object).
 *
 * @param {Object} rowObj
 */
var prepareBorderFromCustomAddedRange = function(rowObj) {
  var range = rowObj.range;

  for (var row = range.from.row; row <= range.to.row; row++) {
    for (var col = range.from.col; col <= range.to.col; col++) {
      var border = createEmptyBorders(row, col);
      var add = 0;

      if (row == range.from.row) {
        add++;

        if (hasOwnProperty(rowObj, 'top')) {
          border.top = rowObj.top;
        }
      }

      if (row == range.to.row) {
        add++;

        if (hasOwnProperty(rowObj, 'bottom')) {
          border.bottom = rowObj.bottom;
        }
      }

      if (col == range.from.col) {
        add++;

        if (hasOwnProperty(rowObj, 'left')) {
          border.left = rowObj.left;
        }
      }

      if (col == range.to.col) {
        add++;

        if (hasOwnProperty(rowObj, 'right')) {
          border.right = rowObj.right;
        }
      }

      if (add > 0) {
        this.setCellMeta(row, col, 'borders', border);
        insertBorderIntoSettings(border);
      }
    }
  }
};

/** *
 * Create separated class name for borders for each cell.
 *
 * @param {Number} row Visual row index.
 * @param {Number} col Visual column index.
 * @returns {String}
 */
var createClassName = function(row, col) {
  return `border_row${row}col${col}`;
};

/** *
 * Create default single border for each position (top/right/bottom/left).
 *
 * @returns {Object} `{{width: number, color: string}}`
 */
var createDefaultCustomBorder = function() {
  return {
    width: 1,
    color: '#000'
  };
};

/** *
 * Create default object for empty border.
 *
 * @returns {Object} `{{hide: boolean}}`
 */
var createSingleEmptyBorder = function() {
  return {
    hide: true
  };
};

/** *
 * Create default Handsontable border object.
 *
 * @returns {Object} `{{width: number, color: string, cornerVisible: boolean}}`
 */
var createDefaultHtBorder = function() {
  return {
    width: 1,
    color: '#000',
    cornerVisible: false,
  };
};

/** *
 * Prepare empty border for each cell with all custom borders hidden.
 *
 * @param {Number} row Visual row index.
 * @param {Number} col Visual column index.
 * @returns {Object} `{{className: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}`
 */
var createEmptyBorders = function(row, col) {
  return {
    className: createClassName(row, col),
    border: createDefaultHtBorder(),
    row,
    col,
    top: createSingleEmptyBorder(),
    right: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    left: createSingleEmptyBorder(),
  };
};

var extendDefaultBorder = function(defaultBorder, customBorder) {
  if (hasOwnProperty(customBorder, 'border')) {
    defaultBorder.border = customBorder.border;
  }

  if (hasOwnProperty(customBorder, 'top')) {
    defaultBorder.top = customBorder.top;
  }

  if (hasOwnProperty(customBorder, 'right')) {
    defaultBorder.right = customBorder.right;
  }

  if (hasOwnProperty(customBorder, 'bottom')) {
    defaultBorder.bottom = customBorder.bottom;
  }

  if (hasOwnProperty(customBorder, 'left')) {
    defaultBorder.left = customBorder.left;
  }

  return defaultBorder;
};

/**
 * Remove borders divs from DOM.
 *
 * @param borderClassName
 */
var removeBordersFromDom = function(borderClassName) {
  var borders = document.querySelectorAll(`.${borderClassName}`);

  for (var i = 0; i < borders.length; i++) {
    if (borders[i]) {
      if (borders[i].nodeName != 'TD') {
        var parent = borders[i].parentNode;

        if (parent.parentNode) {
          parent.parentNode.removeChild(parent);
        }
      }
    }
  }
};

/** *
 * Remove border (triggered from context menu).
 *
 * @param {Number} row Visual row index.
 * @param {Number} col Visual column index.
 */
var removeAllBorders = function(row, col) {
  var borderClassName = createClassName(row, col);
  removeBordersFromDom(borderClassName);
  this.removeCellMeta(row, col, 'borders');
};

/** *
 * Set borders for each cell re. to border position
 *
 * @param row Visual row index.
 * @param col Visual column index.
 * @param place
 * @param remove
 */
var setBorder = function(row, col, place, remove) {

  var bordersMeta = this.getCellMeta(row, col).borders;

  if (!bordersMeta || bordersMeta.border == undefined) {
    bordersMeta = createEmptyBorders(row, col);
  }

  if (remove) {
    bordersMeta[place] = createSingleEmptyBorder();
  } else {
    bordersMeta[place] = createDefaultCustomBorder();
  }

  this.setCellMeta(row, col, 'borders', bordersMeta);

  var borderClassName = createClassName(row, col);
  removeBordersFromDom(borderClassName);
  insertBorderIntoSettings(bordersMeta);
};

/** *
 * Prepare borders based on cell and border position
 *
 * @param range
 * @param place
 * @param remove
 */
var prepareBorder = function(selected, place, remove) {
  arrayEach(selected, ({start, end}) => {
    if (start.row == end.row && start.col == end.col) {
      if (place == 'noBorders') {
        removeAllBorders.call(this, start.row, start.col);
      } else {
        setBorder.call(this, start.row, start.col, place, remove);
      }
    } else {
      switch (place) {
        case 'noBorders':
          for (var column = start.col; column <= end.col; column++) {
            for (var row = start.row; row <= end.row; row++) {
              removeAllBorders.call(this, row, column);
            }
          }
          break;
        case 'top':
          for (var topCol = start.col; topCol <= end.col; topCol++) {
            setBorder.call(this, start.row, topCol, place, remove);
          }
          break;
        case 'right':
          for (var rowRight = start.row; rowRight <= end.row; rowRight++) {
            setBorder.call(this, rowRight, end.col, place);
          }
          break;
        case 'bottom':
          for (var bottomCol = start.col; bottomCol <= end.col; bottomCol++) {
            setBorder.call(this, end.row, bottomCol, place);
          }
          break;
        case 'left':
          for (var rowLeft = start.row; rowLeft <= end.row; rowLeft++) {
            setBorder.call(this, rowLeft, start.col, place);
          }
          break;
        default:
          break;
      }
    }
  });

  this.render();
};

/** *
 * Check if selection has border by className
 *
 * @param hot
 * @param direction
 */
var checkSelectionBorders = function(hot, direction) {
  var atLeastOneHasBorder = false;

  arrayEach(hot.getSelectedRange(), (range) => {
    range.forAll((r, c) => {
      var metaBorders = hot.getCellMeta(r, c).borders;

      if (metaBorders) {
        if (direction) {
          if (!hasOwnProperty(metaBorders[direction], 'hide')) {
            atLeastOneHasBorder = true;
            return false; // breaks forAll
          }
        } else {
          atLeastOneHasBorder = true;
          return false; // breaks forAll
        }
      }
    });
  });

  return atLeastOneHasBorder;
};

/** *
 * Mark label in contextMenu as selected
 *
 * @param label
 * @returns {string}
 */
var markSelected = function(label) {
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`; // workaround for https://github.com/handsontable/handsontable/issues/1946
};

/** *
 * Add border options to context menu
 *
 * @param defaultOptions
 */
var addBordersOptionsToContextMenu = function(defaultOptions) {
  if (!this.getSettings().customBorders) {
    return;
  }

  defaultOptions.items.push({
    name: '---------',
  });
  defaultOptions.items.push({
    key: 'borders',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS);
    },
    disabled() {
      return this.selection.selectedHeader.corner;
    },
    submenu: {
      items: [
        {
          key: 'borders:top',
          name() {
            var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_TOP);

            var hasBorder = checkSelectionBorders(this, 'top');
            if (hasBorder) {
              label = markSelected(label);
            }

            return label;
          },
          callback(key, selected) {
            var hasBorder = checkSelectionBorders(this, 'top');
            prepareBorder.call(this, selected, 'top', hasBorder);
          },
        },
        {
          key: 'borders:right',
          name() {
            var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_RIGHT);
            var hasBorder = checkSelectionBorders(this, 'right');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback(key, selected) {
            var hasBorder = checkSelectionBorders(this, 'right');
            prepareBorder.call(this, selected, 'right', hasBorder);
          },
        },
        {
          key: 'borders:bottom',
          name() {
            var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM);
            var hasBorder = checkSelectionBorders(this, 'bottom');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback(key, selected) {
            var hasBorder = checkSelectionBorders(this, 'bottom');
            prepareBorder.call(this, selected, 'bottom', hasBorder);
          },
        },
        {
          key: 'borders:left',
          name() {
            var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_LEFT);
            var hasBorder = checkSelectionBorders(this, 'left');
            if (hasBorder) {
              label = markSelected(label);
            }

            return label;
          },
          callback(key, selected) {
            var hasBorder = checkSelectionBorders(this, 'left');
            prepareBorder.call(this, selected, 'left', hasBorder);
          },
        },
        {
          key: 'borders:no_borders',
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_BORDERS);
          },
          callback(key, selected) {
            prepareBorder.call(this, selected, 'noBorders');
          },
          disabled() {
            return !checkSelectionBorders(this);
          }
        }
      ]
    }
  });
};

Hooks.getSingleton().add('beforeInit', init);
Hooks.getSingleton().add('afterContextMenuDefaultOptions', addBordersOptionsToContextMenu);
Hooks.getSingleton().add('afterInit', function() {
  var customBorders = this.getSettings().customBorders;

  if (customBorders) {
    for (var i = 0; i < customBorders.length; i++) {
      if (customBorders[i].range) {
        prepareBorderFromCustomAddedRange.call(this, customBorders[i]);

      } else {
        prepareBorderFromCustomAdded.call(this, customBorders[i].row, customBorders[i].col, customBorders[i]);
      }
    }

    this.render();
    this.view.wt.draw(true);
  }
});

export default CustomBorders;
