import { BasePlugin } from '../base';
import { hasOwnProperty, deepClone } from '../../helpers/object';
import { rangeEach } from '../../helpers/number';
import { arrayEach, arrayReduce, arrayMap } from '../../helpers/array';
import * as C from '../../i18n/constants';
import {
  top as menuItemTop,
  bottom as menuItemBottom,
  left as menuItemLeft,
  right as menuItemRight,
  noBorders as menuItemNoBorders,
} from './contextMenuItem';
import {
  createId,
  createDefaultCustomBorder,
  createSingleEmptyBorder,
  createEmptyBorders,
  extendDefaultBorder,
  hasLeftRightTypeOptions,
  hasStartEndTypeOptions,
  toInlinePropName,
  normalizeBorder,
  denormalizeBorder,
} from './utils';
import { detectSelectionType, normalizeSelectionFactory } from '../../selection';

export const PLUGIN_KEY = 'customBorders';
export const PLUGIN_PRIORITY = 90;

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin CustomBorders
 * @class CustomBorders
 *
 * @description
 * This plugin enables an option to apply custom borders through the context menu (configurable with context menu key
 * `borders`).
 *
 * To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in a form
 * of an array.
 *
 * See [`customBorders` configuration option](@/api/options.md#customBorders) or go to
 * [Custom cell borders demo](@/guides/cell-features/formatting-cells/formatting-cells.md#custom-cell-borders) for more examples.
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
 *    start: {},
 *    end: {},
 *    top: {},
 *    bottom: {},
 *   },
 * ],
 *
 * // or
 * customBorders: [
 *   { row: 2,
 *     col: 2,
 *     start: {
 *       width: 2,
 *       color: 'red',
 *     },
 *     end: {
 *       width: 1,
 *       color: 'green',
 *     },
 *     top: '',
 *     bottom: '',
 *   }
 * ],
 * ```
 */
export class CustomBorders extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Saved borders.
   *
   * @private
   * @type {Array}
   */
  savedBorders = [];

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link CustomBorders#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.#onAfterContextMenuDefaultOptions(options));
    this.addHook('init', () => this.#onAfterInit());

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hideBorders();

    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`customBorders`](@/api/options.md#customborders)
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
   * customBordersPlugin.setBorders([[1, 1, 2, 2], [6, 2, 0, 2]], {start: {width: 2, color: 'blue'}});
   *
   * // Using an array of CellRange objects (produced by `.getSelectedRange()` method).
   * //  Selecting a cell range.
   * hot.selectCell(0, 0, 2, 2);
   * // Returning selected cells' range with the getSelectedRange method.
   * customBordersPlugin.setBorders(hot.getSelectedRange(), {start: {hide: false, width: 2, color: 'blue'}});
   * ```
   *
   * @param {Array[]|CellRange[]} selectionRanges Array of selection ranges.
   * @param {object} borderObject Object with `top`, `right`, `bottom` and `start` properties.
   */
  setBorders(selectionRanges, borderObject) {
    let borderKeys = ['top', 'bottom', 'start', 'end'];
    let normBorder = null;

    if (borderObject) {
      this.checkSettingsCohesion([borderObject]);

      borderKeys = Object.keys(borderObject);
      normBorder = normalizeBorder(borderObject);
    }

    const selectionType = detectSelectionType(selectionRanges);
    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
      createCellCoords: this.hot._createCellCoords.bind(this.hot),
      createCellRange: this.hot._createCellRange.bind(this.hot),
    });

    arrayEach(selectionRanges, (selection) => {
      selectionSchemaNormalizer(selection).forAll((row, col) => {
        arrayEach(borderKeys, (borderKey) => {
          this.prepareBorderFromCustomAdded(row, col, normBorder, toInlinePropName(borderKey));
        });
      });
    });

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
   * @returns {object[]} Returns array of border objects.
   */
  getBorders(selectionRanges) {
    if (!Array.isArray(selectionRanges)) {
      return this.savedBorders;
    }

    const selectionType = detectSelectionType(selectionRanges);
    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
      createCellCoords: this.hot._createCellCoords.bind(this.hot),
      createCellRange: this.hot._createCellRange.bind(this.hot),
    });
    const selectedBorders = [];

    arrayEach(selectionRanges, (selection) => {
      selectionSchemaNormalizer(selection).forAll((row, col) => {
        arrayEach(this.savedBorders, (border) => {
          if (border.row === row && border.col === col) {
            selectedBorders.push(denormalizeBorder(border));
          }
        });
      });
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
    }
  }

  /**
   * Insert WalkontableSelection instance into Walkontable settings.
   *
   * @private
   * @param {object} border Object with `row` and `col`, `start`, `end`, `top` and `bottom`, `id` and `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
   * @param {string} [place] Coordinate where add/remove border - `top`, `bottom`, `start`, `end`.
   */
  insertBorderIntoSettings(border, place) {
    const hasSavedBorders = this.checkSavedBorders(border);

    if (!hasSavedBorders) {
      this.savedBorders.push(border);
    }

    const visualCellRange = this.hot._createCellRange(this.hot._createCellCoords(border.row, border.col));
    const hasCustomSelections = this.checkCustomSelections(border, visualCellRange, place);

    if (!hasCustomSelections) {
      this.hot.selection.highlight.addCustomSelection({ border, visualCellRange });
    }
  }

  /**
   * Prepare borders from setting (single cell).
   *
   * @private
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} borderDescriptor Object with `row` and `col`, `start`, `end`, `top` and `bottom` properties.
   * @param {string} [place] Coordinate where add/remove border - `top`, `bottom`, `start`, `end`.
   */
  prepareBorderFromCustomAdded(row, column, borderDescriptor, place) {
    const nrOfRows = this.hot.countRows();
    const nrOfColumns = this.hot.countCols();

    if (row >= nrOfRows || column >= nrOfColumns) {
      return;
    }

    let border = createEmptyBorders(row, column);

    if (borderDescriptor) {
      border = extendDefaultBorder(border, borderDescriptor);

      arrayEach(this.hot.selection.highlight.customSelections, (customSelection) => {
        if (border.id === customSelection.settings.id) {
          Object.assign(customSelection.settings, borderDescriptor);

          border.id = customSelection.settings.id;
          border.top = customSelection.settings.top;
          border.bottom = customSelection.settings.bottom;
          border.start = customSelection.settings.start;
          border.end = customSelection.settings.end;

          return false; // breaks forAll
        }
      });
    }

    this.hot.setCellMeta(row, column, 'borders', denormalizeBorder(border));
    this.insertBorderIntoSettings(border, place);
  }

  /**
   * Prepare borders from setting (object).
   *
   * @private
   * @param {object} range {CellRange} The CellRange object.
   * @param {object} customBorder Object with `start`, `end`, `top` and `bottom` properties.
   */
  prepareBorderFromCustomAddedRange(range, customBorder) {
    const lastRowIndex = Math.min(range.to.row, this.hot.countRows() - 1);
    const lastColumnIndex = Math.min(range.to.col, this.hot.countCols() - 1);

    rangeEach(range.from.row, lastRowIndex, (rowIndex) => {
      rangeEach(range.from.col, lastColumnIndex, (colIndex) => {
        const border = createEmptyBorders(rowIndex, colIndex);
        let add = 0;

        if (rowIndex === range.from.row) {
          if (hasOwnProperty(customBorder, 'top')) {
            add += 1;
            border.top = customBorder.top;
          }
        }

        // Please keep in mind that `range.to.row` may be beyond the table boundaries. The border won't be rendered.
        if (rowIndex === range.to.row) {
          if (hasOwnProperty(customBorder, 'bottom')) {
            add += 1;
            border.bottom = customBorder.bottom;
          }
        }

        if (colIndex === range.from.col) {
          if (hasOwnProperty(customBorder, 'start')) {
            add += 1;
            border.start = customBorder.start;
          }
        }

        // Please keep in mind that `range.to.col` may be beyond the table boundaries. The border won't be rendered.
        if (colIndex === range.to.col) {
          if (hasOwnProperty(customBorder, 'end')) {
            add += 1;
            border.end = customBorder.end;
          }
        }

        if (add > 0) {
          this.hot.setCellMeta(rowIndex, colIndex, 'borders', denormalizeBorder(border));
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
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   */
  removeAllBorders(row, column) {
    const borderId = createId(row, column);

    this.spliceBorder(borderId);

    this.clearBordersFromSelectionSettings(borderId);
    this.clearNullCellRange();

    this.hot.removeCellMeta(row, column, 'borders');
  }

  /**
   * Set borders for each cell re. To border position.
   *
   * @private
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} place Coordinate where add/remove border - `top`, `bottom`, `start`, `end` and `noBorders`.
   * @param {boolean} remove True when remove borders, and false when add borders.
   */
  setBorder(row, column, place, remove) {
    let bordersMeta = this.hot.getCellMeta(row, column).borders;

    if (!bordersMeta || bordersMeta.border === undefined) {
      bordersMeta = createEmptyBorders(row, column);
    } else {
      bordersMeta = normalizeBorder(bordersMeta);
    }

    if (remove) {
      bordersMeta[place] = createSingleEmptyBorder();

      const hideCount = this.countHide(bordersMeta);

      if (hideCount === 4) {
        this.removeAllBorders(row, column);

      } else {
        const customSelectionsChecker = this.checkCustomSelectionsFromContextMenu(bordersMeta, place, remove);

        if (!customSelectionsChecker) {
          this.insertBorderIntoSettings(bordersMeta);
        }

        this.hot.setCellMeta(row, column, 'borders', denormalizeBorder(bordersMeta));
      }

    } else {
      bordersMeta[place] = createDefaultCustomBorder();

      const customSelectionsChecker = this.checkCustomSelectionsFromContextMenu(bordersMeta, place, remove);

      if (!customSelectionsChecker) {
        this.insertBorderIntoSettings(bordersMeta);
      }

      this.hot.setCellMeta(row, column, 'borders', denormalizeBorder(bordersMeta));
    }
  }

  /**
   * Prepare borders based on cell and border position.
   *
   * @private
   * @param {CellRange[]} selected An array of CellRange objects.
   * @param {string} place Coordinate where add/remove border - `top`, `bottom`, `left`, `right` and `noBorders`.
   * @param {boolean} remove True when remove borders, and false when add borders.
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

          case 'bottom':
            rangeEach(start.col, end.col, (bottomCol) => {
              this.setBorder(end.row, bottomCol, place, remove);
            });
            break;

          case 'start':
            rangeEach(start.row, end.row, (rowStart) => {
              this.setBorder(rowStart, start.col, place, remove);
            });
            break;

          case 'end':
            rangeEach(start.row, end.row, (rowEnd) => {
              this.setBorder(rowEnd, end.col, place, remove);
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
   * @param {Array} customBorders Object with `row` and `col`, `start`, `end`, `top` and `bottom` properties.
   */
  createCustomBorders(customBorders) {
    arrayEach(customBorders, (customBorder) => {
      const normCustomBorder = normalizeBorder(customBorder);

      if (customBorder.range) {
        this.prepareBorderFromCustomAddedRange(customBorder.range, normCustomBorder);

      } else {
        this.prepareBorderFromCustomAdded(customBorder.row, customBorder.col, normCustomBorder);
      }
    });
  }

  /**
   * Count hide property in border object.
   *
   * @private
   * @param {object} border Object with `row` and `col`, `start`, `end`, `top` and `bottom`, `id` and
   *                        `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
   * @returns {number}
   */
  countHide(border) {
    const { top, bottom, start, end } = border;
    const values = [top, bottom, start, end];

    return arrayReduce(values, (accumulator, value) => {
      let result = accumulator;

      if (value && value.hide) {
        result += 1;
      }

      return result;
    }, 0);
  }

  /**
   * Clear borders settings from custom selections.
   *
   * @private
   * @param {string} borderId Border id name as string.
   */
  clearBordersFromSelectionSettings(borderId) {
    const index = arrayMap(
      this.hot.selection.highlight.customSelections,
      customSelection => customSelection.settings.id
    ).indexOf(borderId);

    if (index > -1) {
      this.hot.selection.highlight.customSelections[index].clear();
    }
  }

  /**
   * Clear cellRange with null value.
   *
   * @private
   */
  clearNullCellRange() {
    arrayEach(this.hot.selection.highlight.customSelections, (customSelection, index) => {
      if (customSelection.cellRange === null) {
        this.hot.selection.highlight.customSelections[index].destroy();
        this.hot.selection.highlight.customSelections.splice(index, 1);

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
   * @param {string} borderId Border id name as string.
   */
  spliceBorder(borderId) {
    const index = arrayMap(this.savedBorders, border => border.id).indexOf(borderId);

    if (index > -1) {
      this.savedBorders.splice(index, 1);
    }
  }

  /**
   * Check if an border already exists in the savedBorders array, and if true update border in savedBorders.
   *
   * @private
   * @param {object} border Object with `row` and `col`, `start`, `end`, `top` and `bottom`, `id` and
   *                        `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
   *
   * @returns {boolean}
   */
  checkSavedBorders(border) {
    let check = false;

    const hideCount = this.countHide(border);

    if (hideCount === 4) {
      this.spliceBorder(border.id);
      check = true;

    } else {
      arrayEach(this.savedBorders, (savedBorder, index) => {
        if (border.id === savedBorder.id) {
          this.savedBorders[index] = border;
          check = true;

          return false; // breaks forAll
        }
      });
    }

    return check;
  }

  /**
   * Check if an border already exists in the customSelections, and if true call toggleHiddenClass method.
   *
   * @private
   * @param {object} border Object with `row` and `col`, `start`, `end`, `top` and `bottom`, `id` and
   *                        `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
   * @param {string} place Coordinate where add/remove border - `top`, `bottom`, `start`, `end` and `noBorders`.
   * @param {boolean} remove True when remove borders, and false when add borders.
   *
   * @returns {boolean}
   */
  checkCustomSelectionsFromContextMenu(border, place, remove) {
    let check = false;

    arrayEach(this.hot.selection.highlight.customSelections, (customSelection) => {
      if (border.id === customSelection.settings.id) {
        const borders = this.hot.view._wt.selectionManager.getBorderInstances(customSelection);

        arrayEach(borders, (borderObject) => {
          borderObject.toggleHiddenClass(place, remove); // TODO this also bad?
        });

        check = true;

        return false; // breaks forAll
      }
    });

    return check;
  }

  /**
   * Check if an border already exists in the customSelections, and if true reset cellRange.
   *
   * @private
   * @param {object} border Object with `row` and `col`, `start`, `end`, `top` and `bottom`, `id` and
   *                        `border` ({Object} with `color`, `width` and `cornerVisible` property) properties.
   * @param {CellRange} cellRange The selection range to check.
   * @param {string} [place] Coordinate where add/remove border - `top`, `bottom`, `start`, `end`.
   * @returns {boolean}
   */
  checkCustomSelections(border, cellRange, place) {
    const hideCount = this.countHide(border);
    let check = false;

    if (hideCount === 4) {
      this.removeAllBorders(border.row, border.col);
      check = true;

    } else {
      arrayEach(this.hot.selection.highlight.customSelections, (customSelection) => {
        if (border.id === customSelection.settings.id) {
          customSelection.visualCellRange = cellRange;
          customSelection.commit();

          if (place) {
            const borders = this.hot.view._wt.selectionManager.getBorderInstances(customSelection);

            arrayEach(borders, (borderObject) => {
              borderObject.changeBorderStyle(place, border);
            });
          }

          check = true;

          return false; // breaks forAll
        }
      });
    }

    return check;
  }

  /**
   * Change borders from settings.
   *
   * @private
   */
  changeBorderSettings() {
    const customBorders = this.hot.getSettings()[PLUGIN_KEY];

    if (Array.isArray(customBorders)) {
      const bordersClone = deepClone(customBorders);

      this.checkSettingsCohesion(bordersClone);

      if (!bordersClone.length) {
        this.savedBorders = bordersClone;
      }

      this.createCustomBorders(bordersClone);

    } else if (customBorders !== undefined) {
      this.createCustomBorders(this.savedBorders);
    }
  }

  /**
   * Checks the settings cohesion. The properties such like "left"/"right" are supported only
   * in the LTR mode and the "left"/"right" options can not be used together with "start"/"end" properties.
   *
   * @private
   * @param {object[]} customBorders The user defined custom border objects array.
   */
  checkSettingsCohesion(customBorders) {
    const hasLeftOrRight = hasLeftRightTypeOptions(customBorders);
    const hasStartOrEnd = hasStartEndTypeOptions(customBorders);

    if (hasLeftOrRight && hasStartOrEnd) {
      throw new Error('The "left"/"right" and "start"/"end" options should not be used together. ' +
                      'Please use only the option "start"/"end".');
    }

    if (this.hot.isRtl() && hasLeftOrRight) {
      throw new Error('The "left"/"right" properties are not supported for RTL. Please use option "start"/"end".');
    }
  }

  /**
   * Add border options to context menu.
   *
   * @param {object} defaultOptions Context menu items.
   */
  #onAfterContextMenuDefaultOptions(defaultOptions) {
    if (!this.hot.getSettings()[PLUGIN_KEY]) {
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
        const range = this.getSelectedRangeLast();

        if (!range) {
          return true;
        }

        if (range.isSingleHeader()) {
          return true;
        }

        return this.selection.isSelectedByCorner();
      },
      submenu: {
        items: [
          menuItemTop(this),
          menuItemRight(this),
          menuItemBottom(this),
          menuItemLeft(this),
          menuItemNoBorders(this)
        ]
      }
    });
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit() {
    this.changeBorderSettings();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
