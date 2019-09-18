import BasePlugin from './../_base';
import { registerPlugin } from './../../plugins';
import { hasOwnProperty } from './../../helpers/object';
import { rangeEach } from './../../helpers/number';
import { arrayEach } from './../../helpers/array';
import { CellRange } from './../../3rdparty/walkontable/src';
import * as C from './../../i18n/constants';
import {
  bottom,
  left,
  noBorders,
  right,
  top
} from './contextMenuItem';
import {
  createId,
  createDefaultCustomBorder,
  createSingleEmptyBorder,
  createEmptyBorders,
  extendDefaultBorder
} from './utils';
import {
  detectSelectionType,
  normalizeSelectionFactory,
} from './../../selection';

/**
 * @class CustomBorders
 * @plugin CustomBorders
 *
 * @description
 * This plugin enables an option to apply custom borders through the context menu (configurable with context menu key
 * `borders`).
 *
 * To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in a form
 * of an array.
 *
 * See [Custom Borders](http://docs.handsontable.com/demo-custom-borders.html) demo for more examples.
 *
 * @example
 * ```js
 * customBorders: [
 *   {
 *    range: {
 *      from: {
 *        row: 1,
 *        col: 1
 *      },
 *      to: {
 *        row: 3,
 *        col: 4
 *      },
 *    },
 *    left: {},
 *    right: {},
 *    top: {},
 *    bottom: {},
 *   },
 * ],
 *
 * // or
 * customBorders: [
 *   { row: 2,
 *     col: 2,
 *     left: {
 *       width: 2,
 *       color: 'red',
 *     },
 *     right: {
 *       width: 1,
 *       color: 'green',
 *     },
 *     top: '',
 *     bottom: '',
 *   }
 * ],
 * ```
 */
class CustomBorders extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Saved borders.
     *
     * @private
     * @type {Array}
     */
    this.savedBorders = [];

    /**
     * Object containing border id as the key and the border object as the value
     *
     * @private
     * @type {Object}
     */
    this.savedBordersById = {};
  }

  /**
  * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
  * hook and if it returns `true` than the {@link CustomBorders#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().customBorders;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('init', () => this.onAfterInit());

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hideBorders();
    this.render();

    super.disablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.changeBorderSettings();

    super.updatePlugin();
  }

  /**
    * Set custom borders.
    *
    * @example
    * ```js
    * const customBordersPlugin = hot.getPlugin('customBorders');
    *
    * // Using an array of arrays (produced by `.getSelected()` method).
    * customBordersPlugin.setBorders([[1, 1, 2, 2], [6, 2, 0, 2]], {left: {width: 2, color: 'blue'}});
    * // Using an array of CellRange objects (produced by `.getSelectedRange()` method).
    * customBordersPlugin.setBorders(hot.getSelectedRange(), {left: {hide: false, width: 2, color: 'blue'}});
    * ```
    *
    * @param {Array[]|CellRange[]} selectionRanges Array of selection ranges.
    * @param {Object} borderObject Object with `top`, `right`, `bottom` and `left` properties.
    */
  setBorders(selectionRanges, borderObject) {
    const defaultBorderKeys = ['top', 'right', 'bottom', 'left'];
    const borderKeys = borderObject ? Object.keys(borderObject) : defaultBorderKeys;
    const selectionType = detectSelectionType(selectionRanges);
    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType);

    arrayEach(selectionRanges, (selection) => {
      const [rowStart, columnStart, rowEnd, columnEnd] = selectionSchemaNormalizer(selection);

      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = columnStart; col <= columnEnd; col += 1) {
          arrayEach(borderKeys, (borderKey) => {
            this.prepareBorderFromCustomAdded(row, col, borderObject, borderKey);
          });
        }
      }
    });

    this.render();
  }

  /**
   * Instruct Handsontable to re-render, because some of the configuration was changed and we are not expecting it to be
   * rendered automatically.
   */
  render() {
    /*
    The line below triggers a re-render of Handsontable. This will be a "fastDraw"
    render, because that is the default for the TableView class.

    The re-render is needed for borders on cells that did not have a border before.
    The way this call works is that it calls Table.refreshSelections, which calls
    Selection.getBorder, which creates a new instance of Border.

    Seems wise to keep this single-direction flow of creating new Borders
    */
    this.hot.view.render();
  }

  /**
    * Get custom borders.
    *
    * @example
    * ```js
    * const customBordersPlugin = hot.getPlugin('customBorders');
    *
    * // Using an array of arrays (produced by `.getSelected()` method).
    * customBordersPlugin.getBorders([[1, 1, 2, 2], [6, 2, 0, 2]]);
    * // Using an array of CellRange objects (produced by `.getSelectedRange()` method).
    * customBordersPlugin.getBorders(hot.getSelectedRange());
    * // Using without param - return all customBorders.
    * customBordersPlugin.getBorders();
    * ```
    *
    * @param {Array[]|CellRange[]} selectionRanges Array of selection ranges.
    * @return {Object[]} Returns array of border objects.
    */
  getBorders(selectionRanges) {
    if (!Array.isArray(selectionRanges)) {
      return this.savedBorders;
    }

    const selectionType = detectSelectionType(selectionRanges);
    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType);
    const selectedBorders = [];

    arrayEach(selectionRanges, (selection) => {
      const [rowStart, columnStart, rowEnd, columnEnd] = selectionSchemaNormalizer(selection);

      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = columnStart; col <= columnEnd; col += 1) {
          arrayEach(this.savedBorders, (border) => {
            if (border.row === row && border.col === col) {
              selectedBorders.push(border);
            }
          });
        }
      }
    });

    return selectedBorders;
  }

  /**
    * Clear custom borders.
    *
    * @example
    * ```js
    * const customBordersPlugin = hot.getPlugin('customBorders');
    *
    * // Using an array of arrays (produced by `.getSelected()` method).
    * customBordersPlugin.clearBorders([[1, 1, 2, 2], [6, 2, 0, 2]]);
    * // Using an array of CellRange objects (produced by `.getSelectedRange()` method).
    * customBordersPlugin.clearBorders(hot.getSelectedRange());
    * // Using without param - clear all customBorders.
    * customBordersPlugin.clearBorders();
    * ```
    *
    * @param {Array[]|CellRange[]} selectionRanges Array of selection ranges.
    */
  clearBorders(selectionRanges) {
    if (selectionRanges) {
      this.setBorders(selectionRanges);

    } else {
      arrayEach(this.savedBorders, (border) => {
        this.clearBordersFromSelectionSettings(border.id);
        this.clearNullCellRange();
        this.hot.removeCellMeta(border.row, border.col, 'borders');
      });

      this.savedBorders.length = 0;
      this.savedBordersById = {};
    }
    this.render();
  }

  /**
   * Insert WalkontableSelection instance into Walkontable settings.
   *
   * @private
   * @param {Object} border Object with `row` and `col`, `left`, `right`, `top` and `bottom`, `id` and `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
   */
  insertBorderIntoSettings(border) {
    if (this.savedBordersById[border.id]) {
      const index = this.savedBorders.indexOf(border);

      this.savedBorders[index] = border;
    } else {
      this.savedBorders.push(border);
    }
    this.savedBordersById[border.id] = border;

    const coordinates = {
      row: border.row,
      col: border.col
    };
    const cellRange = new CellRange(coordinates, coordinates, coordinates);
    const hasCustomSelections = this.checkCustomSelections(border, cellRange);

    if (!hasCustomSelections) {
      this.hot.selection.highlight.addCustomSelection(border.id, { border, cellRange });
    }
  }

  /**
   * Prepare borders from setting (single cell).
   *
   * @private
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Object} borderDescriptor Object with `row` and `col`, `left`, `right`, `top` and `bottom` properties.
   * @param {String} place Coordinate where add/remove border - `top`, `bottom`, `left`, `right`.
   */
  prepareBorderFromCustomAdded(row, column, borderDescriptor, place) {
    let border = createEmptyBorders(row, column);

    if (borderDescriptor) {
      border = extendDefaultBorder(border, borderDescriptor);

      const customSelection = this.hot.selection.highlight.customSelections.get(border.id);

      if (customSelection) {
        Object.assign(customSelection.settings, borderDescriptor);
        border = customSelection.settings;
      }
    }

    this.hot.setCellMeta(row, column, 'borders', border);

    this.insertBorderIntoSettings(border, place);
  }

  /**
   * Prepare borders from setting (object).
   *
   * @private
   * @param {Object} rowDecriptor Object with `range`, `left`, `right`, `top` and `bottom` properties.
   */
  prepareBorderFromCustomAddedRange(rowDecriptor) {
    const range = rowDecriptor.range;

    rangeEach(range.from.row, range.to.row, (rowIndex) => {
      rangeEach(range.from.col, range.to.col, (colIndex) => {
        const border = createEmptyBorders(rowIndex, colIndex);
        let add = 0;

        if (rowIndex === range.from.row) {
          if (hasOwnProperty(rowDecriptor, 'top')) {
            add += 1;
            border.top = rowDecriptor.top;
          }
        }

        if (rowIndex === range.to.row) {
          if (hasOwnProperty(rowDecriptor, 'bottom')) {
            add += 1;
            border.bottom = rowDecriptor.bottom;
          }
        }

        if (colIndex === range.from.col) {
          if (hasOwnProperty(rowDecriptor, 'left')) {
            add += 1;
            border.left = rowDecriptor.left;
          }
        }

        if (colIndex === range.to.col) {
          if (hasOwnProperty(rowDecriptor, 'right')) {
            add += 1;
            border.right = rowDecriptor.right;
          }
        }

        if (add > 0) {
          this.hot.setCellMeta(rowIndex, colIndex, 'borders', border);
          this.insertBorderIntoSettings(border);
        } else {
          // TODO sometimes it enters here. Why?
        }
      });
    });
  }

  /**
   * Remove border (triggered from context menu).
   *
   * @private
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   */
  removeAllBorders(row, column) {
    const borderId = createId(row, column);

    this.spliceBorder(borderId);

    this.clearBordersFromSelectionSettings(borderId);
    this.clearNullCellRange();

    this.hot.removeCellMeta(row, column, 'borders');
  }

  /**
   * Set borders for each cell re. to border position.
   *
   * @private
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} place Coordinate where add/remove border - `top`, `bottom`, `left`, `right` and `noBorders`.
   * @param {Boolean} remove True when remove borders, and false when add borders.
   */
  setBorder(row, column, place, remove) {
    let bordersMeta = this.hot.getCellMeta(row, column).borders;

    if (!bordersMeta || bordersMeta.border === void 0) {
      bordersMeta = createEmptyBorders(row, column);
    }

    if (remove) {
      bordersMeta[place] = createSingleEmptyBorder();

      const hidden = this.areAllEdgesHidden(bordersMeta);

      if (hidden) {
        this.removeAllBorders(row, column);

      } else {
        const customSelectionsChecker = this.checkCustomSelectionsFromContextMenu(bordersMeta, place, remove);

        if (!customSelectionsChecker) {
          this.insertBorderIntoSettings(bordersMeta);
        }

        this.hot.setCellMeta(row, column, 'borders', bordersMeta);
      }

    } else {
      bordersMeta[place] = createDefaultCustomBorder();

      const customSelectionsChecker = this.checkCustomSelectionsFromContextMenu(bordersMeta, place, remove);

      if (!customSelectionsChecker) {
        this.insertBorderIntoSettings(bordersMeta);
      }

      this.hot.setCellMeta(row, column, 'borders', bordersMeta);
    }
  }

  /**
   * Prepare borders based on cell and border position.
   *
   * @private
   * @param {Object} selected
   * @param {String} place Coordinate where add/remove border - `top`, `bottom`, `left`, `right` and `noBorders`.
   * @param {Boolean} remove True when remove borders, and false when add borders.
   */
  prepareBorder(selected, place, remove) {
    arrayEach(selected, ({ start, end }) => {
      if (start.row === end.row && start.col === end.col) {
        if (place === 'noBorders') {
          this.removeAllBorders(start.row, start.col);
        } else {
          this.setBorder(start.row, start.col, place, remove);
        }

      } else {
        switch (place) {
          case 'noBorders':
            rangeEach(start.col, end.col, (colIndex) => {
              rangeEach(start.row, end.row, (rowIndex) => {
                this.removeAllBorders(rowIndex, colIndex);
              });
            });
            break;

          case 'top':
            rangeEach(start.col, end.col, (topCol) => {
              this.setBorder(start.row, topCol, place, remove);
            });
            break;

          case 'right':
            rangeEach(start.row, end.row, (rowRight) => {
              this.setBorder(rowRight, end.col, place, remove);
            });
            break;

          case 'bottom':
            rangeEach(start.col, end.col, (bottomCol) => {
              this.setBorder(end.row, bottomCol, place, remove);
            });
            break;

          case 'left':
            rangeEach(start.row, end.row, (rowLeft) => {
              this.setBorder(rowLeft, start.col, place, remove);
            });
            break;
          default:
            break;
        }
      }
    });
  }

  /**
   * Create borders from settings.
   *
   * @private
   * @param {Array} customBorders Object with `row` and `col`, `left`, `right`, `top` and `bottom` properties.
   */
  createCustomBorders(customBorders) {
    arrayEach(customBorders, (customBorder) => {
      if (customBorder.range) {
        this.prepareBorderFromCustomAddedRange(customBorder);

      } else {
        this.prepareBorderFromCustomAdded(customBorder.row, customBorder.col, customBorder);
      }
    });
  }

  /**
  * Returns information if all of the border edges are hidden
  *
  * @private
  * @param {Object} border Object with `row` and `col`, `left`, `right`, `top` and `bottom`, `id` and `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
  */
  areAllEdgesHidden(border) {
    if (this.isEdgeVisible(border.left)) {
      return false;
    }
    if (this.isEdgeVisible(border.right)) {
      return false;
    }
    if (this.isEdgeVisible(border.top)) {
      return false;
    }
    if (this.isEdgeVisible(border.bottom)) {
      return false;
    }

    return true;
  }

  isEdgeVisible(edge) {
    if (edge !== undefined && edge.hide !== undefined) {
      return !edge.hide;
    }

    return true;
  }

  /**
  * Clear borders settings from custom selections.
  *
  * @private
  * @param {String} borderId Border id name as string.
  */
  clearBordersFromSelectionSettings(borderId) {
    const customSelection = this.hot.selection.highlight.customSelections.get(borderId);

    if (customSelection) {
      customSelection.clear();
    }
  }

  /**
  * Clear cellRange with null value.
  *
  * @private
  */
  clearNullCellRange() {
    arrayEach(this.hot.selection.highlight.customSelections.values(), (customSelection) => {
      if (customSelection.cellRange === null) {
        this.hot.selection.highlight.customSelections.delete(customSelection.settings.id);

        return false; // breaks forAll
      }
    });
  }

  /**
    * Hide custom borders.
    *
    * @private
    */
  hideBorders() {
    arrayEach(this.savedBorders, (border) => {
      this.clearBordersFromSelectionSettings(border.id);
      this.clearNullCellRange();
    });
  }

  /**
  * Splice border from savedBorders.
  *
  * @private
  * @param {String} borderId Border id name as string.
  */
  spliceBorder(borderId) {
    const border = this.savedBordersById[borderId];

    if (border) {
      const index = this.savedBorders.indexOf(border);

      this.savedBorders.splice(index, 1);
    }

    this.savedBordersById[borderId] = undefined;
  }

  /**
  * Check if an border already exists in the customSelections
  *
  * @private
  * @param {Object} border Object with `row` and `col`, `left`, `right`, `top` and `bottom`, `id` and `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
  *
  * @return {Boolean}
  */
  checkCustomSelectionsFromContextMenu(border) {
    return this.hot.selection.highlight.customSelections.has(border.id);
  }

  /**
  * Check if an border already exists in the customSelections, and if true reset cellRange.
  *
  * @private
  * @param {Object} border Object with `row` and `col`, `left`, `right`, `top` and `bottom`, `id` and `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
  * @param {CellRange} cellRange
  *
  * @return {Boolean}
  */
  checkCustomSelections(border, cellRange) {
    const hidden = this.areAllEdgesHidden(border);

    if (hidden) {
      this.removeAllBorders(border.row, border.col);

      return true;

    }

    const customSelection = this.hot.selection.highlight.customSelections.get(border.id);

    if (customSelection) {
      customSelection.cellRange = cellRange;

      return true;
    }

    return false;
  }

  /**
   * Change borders from settings.
   *
   * @private
   */
  changeBorderSettings() {
    const customBorders = this.hot.getSettings().customBorders;

    if (Array.isArray(customBorders)) {
      if (!customBorders.length) {
        this.savedBorders = customBorders;
      }

      this.createCustomBorders(customBorders);

    } else if (customBorders !== void 0) {
      this.createCustomBorders(this.savedBorders);
    }
  }

  /**
  * Add border options to context menu.
  *
  * @private
  * @param {Object} defaultOptions Context menu items.
  */
  onAfterContextMenuDefaultOptions(defaultOptions) {
    if (!this.hot.getSettings().customBorders) {
      return;
    }

    defaultOptions.items.push({
      name: '---------',
    }, {
      key: 'borders',
      name() {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS);
      },
      disabled() {
        return this.selection.isSelectedByCorner();
      },
      submenu: {
        items: [
          top(this),
          right(this),
          bottom(this),
          left(this),
          noBorders(this)
        ]
      }
    });
  }

  /**
   * `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit() {
    this.changeBorderSettings();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('customBorders', CustomBorders);

export default CustomBorders;
