import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { hasOwnProperty, deepClone } from '../../helpers/object';
import { warn } from '../../helpers/console';
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
import { isDefined } from '../../helpers/mixed';
import type Selection from '../../3rdparty/walkontable/src/selection/selection';

export const PLUGIN_KEY = 'customBorders';
export const PLUGIN_PRIORITY = 90;

/**
 * Describes style properties for a single border side or corner.
 */
export interface BorderSettings {
  width?: number;
  color?: string;
  cornerVisible?: boolean | ((...args: unknown[]) => boolean);
  hide?: boolean;
  className?: string;
  [key: string]: unknown;
}

/**
 * Internal shape of a stored border object, used by the plugin's bookkeeping.
 */
interface BorderObject {
  id: string;
  row: number;
  col: number;
  top?: BorderSettings;
  bottom?: BorderSettings;
  start?: BorderSettings;
  end?: BorderSettings;
  border?: Record<string, unknown>;
  range?: { from: { row: number; col: number }; to: { row: number; col: number } };
  [key: string]: unknown;
}

/**
 * Type guard returning true when the given value is a non-null object.
 *
 * @param {unknown} value The value to test.
 * @returns {boolean}
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const SUPPORTED_STYLES = ['dashed', 'dotted', 'solid'];

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
 * When a border property is set to an empty object `{}` or an empty string `''`, the default style is applied:
 * **1px solid black**.
 *
 * The plugin also integrates with the [[ContextMenu]] plugin. Adding `'borders'` to the
 * [`contextMenu`](@/api/options.md#contextmenu) items enables users to apply or remove borders on selected cells
 * directly from the right-click menu.
 *
 * See [`customBorders` configuration option](@/api/options.md#customBorders) or go to
 * [Custom cell borders demo](@/guides/cell-features/formatting-cells/formatting-cells.md#custom-cell-borders) for more examples.
 *
 * @example
 * ```js
 * // Enable custom borders with context menu integration.
 * // When a border property is an empty object, the default style (1px solid black) is applied.
 * new Handsontable(container, {
 *   customBorders: [
 *     {
 *       range: {
 *         from: { row: 1, col: 1 },
 *         to: { row: 3, col: 4 },
 *       },
 *       top: {},    // default: 1px solid black
 *       bottom: {}, // default: 1px solid black
 *       start: {},  // default: 1px solid black
 *       end: {},    // default: 1px solid black
 *     },
 *     {
 *       row: 2,
 *       col: 2,
 *       start: { width: 2, color: 'red', style: 'dotted' },
 *       end: { width: 1, color: 'green', style: 'dashed' },
 *       top: '',    // default: 1px solid black
 *       bottom: '', // default: 1px solid black
 *     },
 *   ],
 *   // Enable the 'borders' item in the context menu so users can
 *   // apply or remove borders from the right-click menu.
 *   contextMenu: ['borders'],
 * });
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
  savedBorders: BorderObject[] = [];

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link CustomBorders#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions',
      (options: Record<string, unknown>) => this.#onAfterContextMenuDefaultOptions(options));
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
  setBorders(selectionRanges: unknown[], borderObject?: Record<string, unknown>): void {
    let borderKeys = ['top', 'bottom', 'start', 'end'];
    let normBorder: Record<string, unknown> | null = null;

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

    arrayEach(selectionRanges, (selection: unknown) => {
      selectionSchemaNormalizer(selection).forAll((row: number, col: number) => {
        arrayEach(borderKeys, (borderKey: string) => {
          this.prepareBorderFromCustomAdded(row, col, normBorder, toInlinePropName(borderKey));
        });

        return true;
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
  getBorders(selectionRanges?: unknown[]): Record<string, unknown>[] {
    if (!Array.isArray(selectionRanges)) {
      return this.savedBorders;
    }

    const selectionType = detectSelectionType(selectionRanges);
    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
      createCellCoords: this.hot._createCellCoords.bind(this.hot),
      createCellRange: this.hot._createCellRange.bind(this.hot),
    });
    const selectedBorders: Record<string, unknown>[] = [];

    arrayEach(selectionRanges, (selection: unknown) => {
      selectionSchemaNormalizer(selection).forAll((row: number, col: number) => {
        arrayEach(this.savedBorders, (border) => {
          if (border.row === row && border.col === col) {
            selectedBorders.push(denormalizeBorder(border));
          }
        });

        return true;
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
  clearBorders(selectionRanges?: unknown[]): void {
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
  insertBorderIntoSettings(border: BorderObject, place: string | undefined) {
    const hasSavedBorders = this.checkSavedBorders(border);

    if (!hasSavedBorders) {
      this.savedBorders.push(border);
    }

    const borderCoords = this.hot._createCellCoords(border.row, border.col);
    const visualCellRange = this.hot._createCellRange(borderCoords, borderCoords, borderCoords);
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
  prepareBorderFromCustomAdded(
    row: number, column: number, borderDescriptor: Record<string, unknown> | null, place: string | undefined
  ) {
    const nrOfRows = this.hot.countRows();
    const nrOfColumns = this.hot.countCols();

    if (row >= nrOfRows || column >= nrOfColumns) {
      return;
    }

    let border: Record<string, unknown> = createEmptyBorders(row, column);

    if (borderDescriptor) {
      border = extendDefaultBorder(border, borderDescriptor);

      arrayEach(this.hot.selection.highlight.customSelections, (customSelection) => {
        const { settings } = customSelection;

        if (border.id === settings.id) {
          Object.assign(settings, borderDescriptor);

          border.id = settings.id;
          border.top = settings.top;
          border.bottom = settings.bottom;
          border.start = settings.start;
          border.end = settings.end;

          return false; // breaks forAll
        }
      });
    }

    this.hot.setCellMeta(row, column, 'borders', denormalizeBorder(border));
    this.insertBorderIntoSettings(border as BorderObject, place);
  }

  /**
   * Prepare borders from setting (object).
   *
   * @private
   * @param {object} range {CellRange} The CellRange object.
   * @param {object} customBorder Object with `start`, `end`, `top` and `bottom` properties.
   */
  prepareBorderFromCustomAddedRange(
    range: { from: { row: number; col: number }; to: { row: number; col: number } },
    customBorder: Record<string, unknown>
  ) {
    const lastRowIndex = Math.min(range.to.row, this.hot.countRows() - 1);
    const lastColumnIndex = Math.min(range.to.col, this.hot.countCols() - 1);

    rangeEach(range.from.row, lastRowIndex, (rowIndex: number) => {
      rangeEach(range.from.col, lastColumnIndex, (colIndex: number) => {
        const border = createEmptyBorders(rowIndex, colIndex) as BorderObject;
        let add = 0;

        if (rowIndex === range.from.row) {
          if (hasOwnProperty(customBorder, 'top')) {
            add += 1;
            border.top = customBorder.top as BorderSettings;
          }
        }

        // Please keep in mind that `range.to.row` may be beyond the table boundaries. The border won't be rendered.
        if (rowIndex === range.to.row) {
          if (hasOwnProperty(customBorder, 'bottom')) {
            add += 1;
            border.bottom = customBorder.bottom as BorderSettings;
          }
        }

        if (colIndex === range.from.col) {
          if (hasOwnProperty(customBorder, 'start')) {
            add += 1;
            border.start = customBorder.start as BorderSettings;
          }
        }

        // Please keep in mind that `range.to.col` may be beyond the table boundaries. The border won't be rendered.
        if (colIndex === range.to.col) {
          if (hasOwnProperty(customBorder, 'end')) {
            add += 1;
            border.end = customBorder.end as BorderSettings;
          }
        }

        if (add > 0) {
          this.hot.setCellMeta(rowIndex, colIndex, 'borders', denormalizeBorder(border));
          this.insertBorderIntoSettings(border, undefined);
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
  removeAllBorders(row: number, column: number) {
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
  setBorder(row: number, column: number, place: string, remove: boolean) {
    const meta = this.hot.getCellMeta(row, column).borders;
    let bordersMeta: BorderObject;

    if (!isRecord(meta) || !('border' in meta) || meta.border === undefined) {
      bordersMeta = createEmptyBorders(row, column) as BorderObject;
    } else {
      bordersMeta = normalizeBorder(meta) as BorderObject;
    }

    if (remove) {
      bordersMeta[place] = createSingleEmptyBorder();

      const hideCount = this.countHide(bordersMeta);

      if (hideCount === 4) {
        this.removeAllBorders(row, column);

      } else {
        const customSelectionsChecker = this.checkCustomSelectionsFromContextMenu(bordersMeta, place, remove);

        if (!customSelectionsChecker) {
          this.insertBorderIntoSettings(bordersMeta, undefined);
        }

        this.hot.setCellMeta(row, column, 'borders', denormalizeBorder(bordersMeta));
      }

    } else {
      bordersMeta[place] = createDefaultCustomBorder();

      const customSelectionsChecker = this.checkCustomSelectionsFromContextMenu(bordersMeta, place, remove);

      if (!customSelectionsChecker) {
        this.insertBorderIntoSettings(bordersMeta, undefined);
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
  prepareBorder(
    selected: { start: { row: number; col: number }; end: { row: number; col: number } }[],
    place: string, remove: boolean
  ) {
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
  createCustomBorders(customBorders: Record<string, unknown>[]) {
    arrayEach(customBorders, (customBorder: Record<string, unknown>) => {
      const normCustomBorder = normalizeBorder(customBorder);

      if (customBorder.range) {
        this.prepareBorderFromCustomAddedRange(
          customBorder.range as { from: { row: number; col: number }; to: { row: number; col: number } },
          normCustomBorder
        );

      } else {
        this.prepareBorderFromCustomAdded(
          customBorder.row as number, customBorder.col as number, normCustomBorder, undefined);
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
  countHide(border: BorderObject) {
    const { top, bottom, start, end } = border;
    const values: (BorderSettings | undefined)[] = [top, bottom, start, end];

    return arrayReduce(values, (accumulator: number, value) => {
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
  clearBordersFromSelectionSettings(borderId: string) {
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
        customSelection.destroy();
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
  spliceBorder(borderId: string) {
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
  checkSavedBorders(border: BorderObject) {
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
  checkCustomSelectionsFromContextMenu(border: Record<string, unknown>, place: string, remove: boolean) {
    let check = false;

    arrayEach(this.hot.selection.highlight.customSelections, (customSelection) => {
      if (border.id === customSelection.settings.id) {
        const borders = this.hot.view._wt.selectionManager
          .getBorderInstances(customSelection);

        arrayEach(borders, (borderObject: Record<string, unknown>) => {
          (borderObject.toggleHiddenClass as (place: string, remove: boolean) => void)(place, remove);
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
  checkCustomSelections(border: BorderObject, cellRange: object, place: string | undefined) {
    const hideCount = this.countHide(border);
    let check = false;

    if (hideCount === 4) {
      this.removeAllBorders(border.row, border.col);
      check = true;

    } else {
      arrayEach(this.hot.selection.highlight.customSelections, (customSelection) => {
        if (border.id === customSelection.settings.id) {
          customSelection.visualCellRange = cellRange as typeof customSelection.visualCellRange;
          customSelection.commit();

          if (place) {
            const borders = this.hot.view._wt.selectionManager
              .getBorderInstances(customSelection);

            arrayEach(borders, (borderObject: Record<string, unknown>) => {
              (borderObject.changeBorderStyle as (place: string, b: Record<string, unknown>) => void)(place, border);
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
      const bordersClone = deepClone(customBorders as Record<string, unknown>[]);

      this.checkSettingsCohesion(bordersClone);

      if (!bordersClone.length) {
        this.savedBorders = [];
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
  checkSettingsCohesion(customBorders: Record<string, unknown>[]) {
    const hasLeftOrRight = hasLeftRightTypeOptions(customBorders);
    const hasStartOrEnd = hasStartEndTypeOptions(customBorders);

    if (hasLeftOrRight && hasStartOrEnd) {
      throwWithCause('The "left"/"right" and "start"/"end" options should not be used together. ' +
                      'Please use only the option "start"/"end".');
    }

    if (this.hot.isRtl() && hasLeftOrRight) {
      throwWithCause('The "left"/"right" properties are not supported for RTL. Please use option "start"/"end".');
    }

    this.#validateStyleSettings(customBorders);
  }

  /**
   * Validate the style settings. If the style value is not supported, the property is removed from the configuration.
   *
   * @private
   * @param {object[]} customBorders The user defined custom border objects array.
   */
  #validateStyleSettings(customBorders: Record<string, unknown>[]) {
    customBorders.forEach((customBorder) => {
      Object.keys(customBorder).forEach((key) => {
        const side = customBorder[key];

        if (!isRecord(side)) {
          return;
        }

        const { style } = side;

        if (isDefined(style) && typeof style === 'string' && !SUPPORTED_STYLES.includes(style)) {
          // eslint-disable-next-line max-len
          warn(`The "${style}" border style is not supported. Please use one of the following styles: ${SUPPORTED_STYLES.join(', ')}.
The border style will be ignored.`);

          delete side.style;

        } else if (isDefined(style) && style === 'solid') {
          // 'solid' is the default style
          delete side.style;
        }
      });
    });
  }
  /**
   * Add border options to context menu.
   *
   * @param {object} defaultOptions Context menu items.
   */
  #onAfterContextMenuDefaultOptions(defaultOptions: Record<string, unknown>) {
    if (!this.hot.getSettings()[PLUGIN_KEY]) {
      return;
    }

    const items = defaultOptions.items as unknown[];

    items.push({
      name: '---------',
    }, {
      key: 'borders',
      name() {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS);
      },
      disabled() {
        const range = this.getSelectedRangeActive();

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
          menuItemTop(this as unknown as Record<string, Function>),
          menuItemRight(this as unknown as Record<string, unknown>),
          menuItemBottom(this as unknown as Record<string, Function>),
          menuItemLeft(this as unknown as Record<string, unknown>),
          menuItemNoBorders(this as unknown as Record<string, Function>)
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
