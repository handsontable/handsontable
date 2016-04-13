import Handsontable from './../../browser';
import {registerPlugin} from './../../plugins';
import {WalkontableCellRange} from './../../3rdparty/walkontable/src/cell/range';
import {WalkontableSelection} from './../../3rdparty/walkontable/src/selection';

function CustomBorders() {}
/***
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

/***
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

/***
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

/***
 * Get index of border from the settings.
 *
 * @param {String} className
 * @returns {Number}
 */
var getSettingIndex = function(className) {
  for (var i = 0; i < instance.view.wt.selections.length; i++) {
    if (instance.view.wt.selections[i].settings.className == className) {
      return i;
    }
  }

  return -1;
};

/***
 * Insert WalkontableSelection instance into Walkontable settings.
 *
 * @param border
 */
var insertBorderIntoSettings = function(border) {
  var coordinates = {
    row: border.row,
    col: border.col
  };
  var selection = new WalkontableSelection(border, new WalkontableCellRange(coordinates, coordinates, coordinates));
  var index = getSettingIndex(border.className);

  if (index >= 0) {
    instance.view.wt.selections[index] = selection;
  } else {
    instance.view.wt.selections.push(selection);
  }
};

/***
 * Prepare borders from setting (single cell).
 *
 * @param {Number} row Row index.
 * @param {Number} col Column index.
 * @param borderObj
 */
var prepareBorderFromCustomAdded = function(row, col, borderObj) {
  var border = createEmptyBorders(row, col);
  border = extendDefaultBorder(border, borderObj);
  this.setCellMeta(row, col, 'borders', border);

  insertBorderIntoSettings(border);
};

/***
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

        if (rowObj.hasOwnProperty('top')) {
          border.top = rowObj.top;
        }
      }

      if (row == range.to.row) {
        add++;

        if (rowObj.hasOwnProperty('bottom')) {
          border.bottom = rowObj.bottom;
        }
      }

      if (col == range.from.col) {
        add++;

        if (rowObj.hasOwnProperty('left')) {
          border.left = rowObj.left;
        }
      }

      if (col == range.to.col) {
        add++;

        if (rowObj.hasOwnProperty('right')) {
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

/***
 * Create separated class name for borders for each cell.
 *
 * @param {Number} row Row index.
 * @param {Number} col Column index.
 * @returns {String}
 */
var createClassName = function(row, col) {
  return 'border_row' + row + 'col' + col;
};

/***
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

/***
 * Create default object for empty border.
 *
 * @returns {Object} `{{hide: boolean}}`
 */
var createSingleEmptyBorder = function() {
  return {
    hide: true
  };
};

/***
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

/***
 * Prepare empty border for each cell with all custom borders hidden.
 *
 * @param {Number} row Row index.
 * @param {Number} col Column index.
 * @returns {Object} `{{className: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}`
 */
var createEmptyBorders = function(row, col) {
  return {
    className: createClassName(row, col),
    border: createDefaultHtBorder(),
    row: row,
    col: col,
    top: createSingleEmptyBorder(),
    right: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    left: createSingleEmptyBorder(),
  };
};

var extendDefaultBorder = function(defaultBorder, customBorder) {
  if (customBorder.hasOwnProperty('border')) {
    defaultBorder.border = customBorder.border;
  }

  if (customBorder.hasOwnProperty('top')) {
    defaultBorder.top = customBorder.top;
  }

  if (customBorder.hasOwnProperty('right')) {
    defaultBorder.right = customBorder.right;
  }

  if (customBorder.hasOwnProperty('bottom')) {
    defaultBorder.bottom = customBorder.bottom;
  }

  if (customBorder.hasOwnProperty('left')) {
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
  var borders = document.querySelectorAll('.' + borderClassName);

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

/***
 * Remove border (triggered from context menu).
 *
 * @param {Number} row Row index.
 * @param {Number} col Column index.
 */
var removeAllBorders = function(row, col) {
  var borderClassName = createClassName(row, col);
  removeBordersFromDom(borderClassName);
  this.removeCellMeta(row, col, 'borders');
};

/***
 * Set borders for each cell re. to border position
 *
 * @param row
 * @param col
 * @param place
 * @param remove
 */
var setBorder = function(row, col,place, remove) {

  var bordersMeta = this.getCellMeta(row, col).borders;
  /* jshint ignore:start */
  if (!bordersMeta || bordersMeta.border == undefined) {
    bordersMeta = createEmptyBorders(row, col);
  }
  /* jshint ignore:end */

  if (remove) {
    bordersMeta[place] = createSingleEmptyBorder();
  } else {
    bordersMeta[place] = createDefaultCustomBorder();
  }

  this.setCellMeta(row, col, 'borders', bordersMeta);

  var borderClassName = createClassName(row, col);
  removeBordersFromDom(borderClassName);
  insertBorderIntoSettings(bordersMeta);

  this.render();
};

/***
 * Prepare borders based on cell and border position
 *
 * @param range
 * @param place
 * @param remove
 */
var prepareBorder = function(range, place, remove) {

  if (range.from.row == range.to.row && range.from.col == range.to.col) {
    if (place == 'noBorders') {
      removeAllBorders.call(this, range.from.row, range.from.col);
    } else {
      setBorder.call(this, range.from.row, range.from.col, place, remove);
    }
  } else {
    switch (place) {
      case 'noBorders':
        for (var column = range.from.col; column <= range.to.col; column++) {
          for (var row = range.from.row; row <= range.to.row; row++) {
            removeAllBorders.call(this, row, column);
          }
        }
        break;
      case 'top':
        for (var topCol = range.from.col; topCol <= range.to.col; topCol++) {
          setBorder.call(this, range.from.row, topCol, place, remove);
        }
        break;
      case 'right':
        for (var rowRight = range.from.row; rowRight <= range.to.row; rowRight++) {
          setBorder.call(this, rowRight, range.to.col, place);
        }
        break;
      case 'bottom':
        for (var bottomCol = range.from.col; bottomCol <= range.to.col; bottomCol++) {
          setBorder.call(this, range.to.row, bottomCol, place);
        }
        break;
      case 'left':
        for (var rowLeft = range.from.row; rowLeft <= range.to.row; rowLeft++) {
          setBorder.call(this, rowLeft, range.from.col, place);
        }
        break;
    }
  }
};

/***
 * Check if selection has border by className
 *
 * @param hot
 * @param direction
 */
var checkSelectionBorders = function(hot, direction) {
  var atLeastOneHasBorder = false;

  hot.getSelectedRange().forAll(function(r, c) {
    var metaBorders = hot.getCellMeta(r, c).borders;

    if (metaBorders) {
      if (direction) {
        if (!metaBorders[direction].hasOwnProperty('hide')) {
          atLeastOneHasBorder = true;
          return false; //breaks forAll
        }
      } else {
        atLeastOneHasBorder = true;
        return false; //breaks forAll
      }
    }
  });
  return atLeastOneHasBorder;
};

/***
 * Mark label in contextMenu as selected
 *
 * @param label
 * @returns {string}
 */
var markSelected = function(label) {
  return '<span class="selected">' + String.fromCharCode(10003) + '</span>' + label; // workaround for https://github.com/handsontable/handsontable/issues/1946
};

/***
 * Add border options to context menu
 *
 * @param defaultOptions
 */
var addBordersOptionsToContextMenu = function(defaultOptions) {
  if (!this.getSettings().customBorders) {
    return;
  }

  defaultOptions.items.push(Handsontable.plugins.ContextMenu.SEPARATOR);

  defaultOptions.items.push({
    key: 'borders',
    name: 'Borders',
    submenu: {
      items: [
        {
          key: 'borders:top',
          name: function() {
            var label = 'Top';
            var hasBorder = checkSelectionBorders(this, 'top');
            if (hasBorder) {
              label = markSelected(label);
            }

            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'top');
            prepareBorder.call(this, this.getSelectedRange(), 'top', hasBorder);
          },
          disabled: false
        },
        {
          key: 'borders:right',
          name: function() {
            var label = 'Right';
            var hasBorder = checkSelectionBorders(this, 'right');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'right');
            prepareBorder.call(this, this.getSelectedRange(), 'right', hasBorder);
          },
          disabled: false
        },
        {
          key: 'borders:bottom',
          name: function() {
            var label = 'Bottom';
            var hasBorder = checkSelectionBorders(this, 'bottom');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'bottom');
            prepareBorder.call(this, this.getSelectedRange(), 'bottom', hasBorder);
          },
          disabled: false
        },
        {
          key: 'borders:left',
          name: function() {
            var label = 'Left';
            var hasBorder = checkSelectionBorders(this, 'left');
            if (hasBorder) {
              label = markSelected(label);
            }

            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'left');
            prepareBorder.call(this, this.getSelectedRange(), 'left', hasBorder);
          },
          disabled: false
        },
        {
          key: 'borders:no_borders',
          name: 'Remove border(s)',
          callback: function() {
            prepareBorder.call(this, this.getSelectedRange(), 'noBorders');
          },
          disabled: function() {
            return !checkSelectionBorders(this);
          }
        }
      ]
    }
  });
};

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addBordersOptionsToContextMenu);
Handsontable.hooks.add('afterInit', function() {
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

Handsontable.CustomBorders = CustomBorders;
