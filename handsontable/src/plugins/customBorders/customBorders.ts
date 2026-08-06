import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { hasOwnProperty, deepClone } from '../../helpers/object';
import { warn } from '../../helpers/console';
import { rangeEach } from '../../helpers/number';
import { arrayEach, arrayReduce } from '../../helpers/array';
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
  getShiftedIndexAfterInsert,
  getShiftedIndexAfterRemove,
  resolveRangeBorderSide,
} from './utils';
import type { BorderSettings, BorderObject, CustomBorderConfig, BordersCellProperties } from './utils';
import { detectSelectionType, normalizeSelectionFactory } from '../../selection';
import { isDefined } from '../../helpers/mixed';
import type { HotInstance } from '../../core/types';
import type VisualSelection from '../../selection/highlight/visualSelection';

export const PLUGIN_KEY = 'customBorders';
export const PLUGIN_PRIORITY = 90;

export type { BorderSettings, BorderObject };

/**
 * The four sides a border can be applied to.
 */
type BorderSide = 'top' | 'bottom' | 'start' | 'end';

/**
 * Type guard returning true when the given value is a non-null object.
 *
 * @param {unknown} value The value to test.
 * @returns {boolean}
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard returning true when the value is a BorderObject (has `id`, `row`, `col` string/number fields).
 *
 * @param {unknown} value The value to test.
 * @returns {boolean}
 */
function isBorderObject(value: unknown): value is BorderObject {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.row === 'number'
    && typeof value.col === 'number';
}

/**
 * Type guard for cell coordinate objects with `row` and `col` number properties.
 *
 * @param {unknown} value The value to test.
 * @returns {boolean}
 */
function isCellCoord(value: unknown): value is { row: number; col: number } {
  return isRecord(value) && typeof value.row === 'number' && typeof value.col === 'number';
}

const SUPPORTED_STYLES = ['dashed', 'dotted', 'solid'];

/**
 * Default number of border configuration entries applied per background batch when
 * `customBordersProgressive` is enabled. Sized so a batch stays within a frame budget.
 */
const DEFAULT_PROGRESSIVE_CHUNK_SIZE = 5000;

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
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
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
   * Positions of the saved borders in the `savedBorders` array, keyed by the border id.
   * Lets bulk border operations locate an existing border in O(1) instead of scanning the array.
   */
  #savedBordersIndex: Map<string, number> = new Map();

  /**
   * Cache of the plugin-created custom selections keyed by the border id. Under viewport
   * virtualization this holds only the selections currently in the rendered range.
   */
  #customSelectionsCache: Map<string, VisualSelection> = new Map();

  /**
   * Visual-row index of the saved borders: maps a visual row to the borders on that row. Lets the
   * viewport sync collect only the borders inside the rendered range in O(viewport) instead of
   * scanning every saved border each render. Rebuilt lazily from `savedBorders` when marked stale.
   */
  #bordersByRow: Map<number, BorderObject[]> = new Map();

  /**
   * When `true`, `#bordersByRow` is stale and rebuilt on the next viewport sync. Set whenever the
   * `savedBorders` model changes; keeps the per-frame sync cost bounded by the viewport, not the
   * total border count.
   */
  #bordersByRowDirty: boolean = true;

  /**
   * During a `createCustomBorders` pass, holds the `row,col` keys already written in this pass, so a
   * cell touched for the first time can skip the existing-meta merge read (there is nothing to merge
   * on a fresh cell - the pass starts after the previous borders' meta is cleared). Only cells hit by
   * an overlapping range are re-read. Outside a config pass this is `null`, so every other code path
   * (e.g. `setBorders`) keeps reading existing meta and merges as before. Cuts a full O(N)
   * `getCellMeta` pass out of applying a large, non-overlapping `customBorders` config.
   */
  #configPassTouched: Set<string> | null = null;

  /**
   * Pending border configuration entries for a progressive (background-batched) application, or
   * `null` when no progressive load is in flight. Set when `customBordersProgressive` is enabled.
   */
  #progressiveQueue: CustomBorderConfig[] | null = null;

  /**
   * Index of the next entry in `#progressiveQueue` to apply.
   */
  #progressiveIndex: number = 0;

  /**
   * Number of entries applied per progressive batch.
   */
  #progressiveChunkSize: number = DEFAULT_PROGRESSIVE_CHUNK_SIZE;

  /**
   * Monotonic generation token for the active progressive load. Bumped on start, finish, flush, and
   * cancel; a scheduled batch aborts if its captured token no longer matches, so stale timers become
   * no-ops without needing to track and clear individual timeout handles.
   */
  #progressiveToken: number = 0;

  /**
   * Physical row index of each saved border captured before a row move, parallel to `savedBorders`.
   * Used to re-derive each border's visual row after the move reorders the visual index mapping.
   * `null` when no move is in progress.
   */
  #rowMoveSnapshot: (number | null)[] | null = null;

  /**
   * Physical column index of each saved border captured before a column move, parallel to
   * `savedBorders`. Used to re-derive each border's visual column after the move reorders the
   * visual index mapping. `null` when no move is in progress.
   */
  #columnMoveSnapshot: (number | null)[] | null = null;

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
      (options: unknown) => this.#onAfterContextMenuDefaultOptions(options));
    this.addHook('init', () => this.#onAfterInit());
    this.addHook('afterCreateRow', this.#onAfterCreateRow);
    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);
    this.addHook('beforeRowMove', this.#onBeforeRowMove);
    this.addHook('afterRowMove', this.#onAfterRowMove);
    this.addHook('beforeColumnMove', this.#onBeforeColumnMove);
    this.addHook('afterColumnMove', this.#onAfterColumnMove);
    this.addHook('afterViewRender', this.#onAfterViewRender);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#cancelProgressiveApply();
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
   * @param {object} borderObject Object with `top`, `bottom`, `start`, and `end` properties.
   * Each side object can include:
   * - `width` (`number`) Border width in pixels (default: `1`).
   * - `color` (`string`) CSS border color value (default: `'#000'`).
   * - `hide` (`boolean`) Hides a border side when set to `true`.
   * Legacy aliases `left` and `right` are also supported and are normalized to `start` and `end`.
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
    A forced render is used (not a fast `view.render()`) so the `afterViewRender` hook fires and
    `#syncViewportSelections` materializes the custom selections for the just-changed, in-viewport
    borders before the selection borders are drawn. A fast draw can be skipped when Walkontable
    detects no cell/viewport change, which would leave the new border model unrendered.
    */
    this.hot.render();
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
      this.#resetBorderModel();
      this.hot.render();
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
      this.#savedBordersIndex.set(border.id, this.savedBorders.length - 1);
    }

    // Only the model is updated here; the rendered custom selection is created (or refreshed) by
    // `#syncViewportSelections` on the next view render, and only if the border is inside the
    // rendered range. This is what makes the plugin scale: selections and their border DOM are
    // materialized for the viewport, not for every bordered cell. `place` is accepted for backward
    // compatibility but no longer drives an incremental per-side toggle - the sync rebuilds the
    // visible selection from the (already updated) border model, which carries the final side styles.
    this.#bordersByRowDirty = true;

    // Drop any selection currently rendering this cell so the sync recreates it from the updated
    // border object. The border id is coordinate-based and unchanged by a style edit, so without this
    // the sync would keep the stale selection (it only adds/removes by id). No-op during bulk config
    // load, when nothing is rendered yet.
    this.#destroyBorderSelection(border.id);
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
    row: number, column: number, borderDescriptor: CustomBorderConfig | null, place: string | undefined
  ) {
    const nrOfRows = this.hot.countRows();
    const nrOfColumns = this.hot.countCols();

    if (row >= nrOfRows || column >= nrOfColumns) {
      return;
    }

    let border: BorderObject = createEmptyBorders(row, column);

    if (borderDescriptor) {
      // A descriptor means "update these sides": start from the cell's existing borders so the
      // sides it does not mention are kept, then layer the descriptor on top. With no descriptor
      // the border stays all-hidden, which is the "clear this cell" intent handled below.
      const existing = this.#readExistingBordersForMerge(row, column);

      if (isBorderObject(existing)) {
        border = normalizeBorder(deepClone(existing));
      }

      border = extendDefaultBorder(border, borderDescriptor);
    }

    // When every side is hidden (e.g. `setBorders(range)` with no style object, used to clear a
    // cell) the border is removed entirely - dropped from the model and its cell meta - rather than
    // stored as an all-hidden object. The rendered selection is reconciled by the viewport sync.
    if (this.countHide(border) === 4) {
      this.removeAllBorders(row, column);

      return;
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
  prepareBorderFromCustomAddedRange(
    range: { from: { row: number; col: number }; to: { row: number; col: number } },
    customBorder: CustomBorderConfig
  ) {
    const lastRowIndex = Math.min(range.to.row, this.hot.countRows() - 1);
    const lastColumnIndex = Math.min(range.to.col, this.hot.countCols() - 1);

    rangeEach(range.from.row, lastRowIndex, (rowIndex: number) => {
      rangeEach(range.from.col, lastColumnIndex, (colIndex: number) => {
        const { border, add } = this.#buildRangeCellBorder(rowIndex, colIndex, customBorder, range);

        if (add > 0) {
          // `#buildRangeCellBorder` already merged this cell's existing borders, so overlapping
          // ranges accumulate their sides in the model. The rendered selection is (re)built from the
          // merged model by `#syncViewportSelections` on the next view render.
          this.hot.setCellMeta(rowIndex, colIndex, 'borders', denormalizeBorder(border));
          this.insertBorderIntoSettings(border, undefined);
        }
      });
    });
  }

  /**
   * Reads the cell's existing borders for a merge, unless this is the first time the cell is touched
   * within a `createCustomBorders` pass - in which case the cell is known to be border-free (the pass
   * runs after the previous borders' meta is cleared), so the read is skipped and `undefined` is
   * returned. Outside a config pass (`#configPassTouched` is `null`) it always reads, preserving the
   * merge behavior of `setBorders` and other callers. Skipping the first-touch read removes a full
   * O(N) `getCellMeta` pass from applying a large, non-overlapping config.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {unknown} The existing `borders` meta value, or `undefined` when the read is skipped.
   */
  #readExistingBordersForMerge(row: number, column: number): unknown {
    const seen = this.#configPassTouched;

    if (seen === null) {
      return this.hot.getCellMeta<BordersCellProperties>(row, column).borders;
    }

    const key = `${row},${column}`;
    const shouldRead = seen.has(key);

    seen.add(key);

    return shouldRead ? this.hot.getCellMeta<BordersCellProperties>(row, column).borders : undefined;
  }

  /**
   * Builds the border object for a single cell of a range configuration. The cell's existing
   * borders are merged first, so a cell touched by several overlapping ranges keeps every side.
   * Each side that lies on a range edge is resolved through {@link resolveRangeBorderSide}, so an
   * empty side inherits the range-level `border` style instead of the default.
   *
   * @param {number} rowIndex Visual row index of the cell.
   * @param {number} colIndex Visual column index of the cell.
   * @param {object} customBorder The range configuration object.
   * @param {object} range The `{ from, to }` range the configuration applies to.
   * @returns {object} The merged border and the number of sides applied to this cell.
   */
  #buildRangeCellBorder(
    rowIndex: number,
    colIndex: number,
    customBorder: CustomBorderConfig,
    range: { from: { row: number; col: number }; to: { row: number; col: number } }
  ): { border: BorderObject; add: number } {
    const existing = this.#readExistingBordersForMerge(rowIndex, colIndex);
    const border = isBorderObject(existing)
      ? normalizeBorder(deepClone(existing))
      : createEmptyBorders(rowIndex, colIndex);
    let add = 0;

    const applyEdge = (isEdge: boolean, sideKey: BorderSide) => {
      // `range.to.row`/`range.to.col` may lie beyond the table; those cells are never iterated.
      if (isEdge && hasOwnProperty(customBorder, sideKey)) {
        border[sideKey] = resolveRangeBorderSide(customBorder[sideKey], customBorder.border);
        add += 1;
      }
    };

    applyEdge(rowIndex === range.from.row, 'top');
    applyEdge(rowIndex === range.to.row, 'bottom');
    applyEdge(colIndex === range.from.col, 'start');
    applyEdge(colIndex === range.to.col, 'end');

    if (isRecord(customBorder.border)) {
      border.border = customBorder.border;
    }

    return { border, add };
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
    this.#bordersByRowDirty = true;
    // Destroy the rendered selection if this border is currently in the viewport working set; if it
    // is off-screen there is nothing rendered to remove.
    this.#destroyBorderSelection(borderId);

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
  setBorder(row: number, column: number, place: string, remove: boolean | undefined) {
    const meta = this.hot.getCellMeta<BordersCellProperties>(row, column).borders;
    let bordersMeta: BorderObject;

    if (isBorderObject(meta)) {
      bordersMeta = normalizeBorder(meta);
    } else {
      bordersMeta = createEmptyBorders(row, column);
    }

    if (remove) {
      bordersMeta[place] = createSingleEmptyBorder();

      const hideCount = this.countHide(bordersMeta);

      if (hideCount === 4) {
        this.removeAllBorders(row, column);

      } else {
        this.insertBorderIntoSettings(bordersMeta, undefined);
        this.hot.setCellMeta(row, column, 'borders', denormalizeBorder(bordersMeta));
      }

    } else {
      bordersMeta[place] = createDefaultCustomBorder();

      this.insertBorderIntoSettings(bordersMeta, undefined);
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
    selected: Record<string, unknown>[],
    place: string, remove: boolean | undefined
  ) {
    arrayEach(selected, (item) => {
      if (!isCellCoord(item.start) || !isCellCoord(item.end)) {
        return;
      }

      const { start, end } = { start: item.start, end: item.end };

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

    // Border changes above only updated the model; render so `#syncViewportSelections` materializes
    // the visible selections for the changed cells.
    this.hot.render();
  }

  /**
   * Create borders from settings.
   *
   * @private
   * @param {Array} customBorders Object with `row` and `col`, `start`, `end`, `top` and `bottom` properties.
   */
  createCustomBorders(customBorders: CustomBorderConfig[]) {
    // Own the first-touch tracking Set only when one is not already active. A progressive load keeps
    // a single Set across all its batches (so overlapping ranges split across batches still merge
    // correctly); a plain synchronous call owns and clears it here.
    const ownsPass = this.#configPassTouched === null;

    if (ownsPass) {
      this.#configPassTouched = new Set();
    }

    try {
      arrayEach(customBorders, (customBorder: CustomBorderConfig) => {
        const normCustomBorder = normalizeBorder(customBorder);

        if (normCustomBorder.range) {
          this.prepareBorderFromCustomAddedRange(normCustomBorder.range, normCustomBorder);

        } else {
          this.prepareBorderFromCustomAdded(
            normCustomBorder.row ?? 0, normCustomBorder.col ?? 0, normCustomBorder, undefined);
        }
      });
    } finally {
      if (ownsPass) {
        this.#configPassTouched = null;
      }
    }
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
   * Hide custom borders. Destroys the rendered working-set selections; the `savedBorders` model is
   * kept so the borders can be re-materialized if the plugin is re-enabled.
   *
   * @private
   */
  hideBorders() {
    this.#destroyAllSelections();
  }

  /**
   * Destroys every plugin-owned custom selection and clears the rendered working set. Used when all
   * borders are cleared or the plugin is disabled. Does not touch the `savedBorders` model.
   */
  #destroyAllSelections() {
    const { customSelections } = this.hot.selection.highlight;

    arrayEach(customSelections, customSelection => customSelection.destroy());
    customSelections.length = 0;
    this.#customSelectionsCache.clear();
  }

  /**
   * Clears the entire border model and its rendered working set: cancels any in-flight progressive
   * load, removes the `borders` meta from every previously bordered cell, empties `savedBorders` and
   * its indexes, and destroys the rendered selections. Shared by `clearBorders()` (clear all) and
   * `changeBorderSettings()` (a fresh array config / `updateSettings` replace). Does not render.
   */
  #resetBorderModel() {
    this.#cancelProgressiveApply();

    arrayEach(this.savedBorders, (border) => {
      this.hot.removeCellMeta(border.row, border.col, 'borders');
    });

    this.savedBorders = [];
    this.#savedBordersIndex.clear();
    this.#bordersByRow.clear();
    this.#bordersByRowDirty = true;
    this.#destroyAllSelections();
  }

  /**
   * Rebuilds the visual-row index (`#bordersByRow`) from `savedBorders`. Runs at most once per model
   * change (guarded by `#bordersByRowDirty`), never per render, so the per-frame viewport sync stays
   * bounded by the viewport rather than the total border count.
   */
  #rebuildBordersByRow() {
    this.#bordersByRow.clear();

    arrayEach(this.savedBorders, (border) => {
      const rowBorders = this.#bordersByRow.get(border.row);

      if (rowBorders) {
        rowBorders.push(border);
      } else {
        this.#bordersByRow.set(border.row, [border]);
      }
    });

    this.#bordersByRowDirty = false;
  }

  /**
   * Synchronizes the rendered custom selections with the current viewport. Creates selections for
   * bordered cells that entered the rendered range and destroys those that left it, so the selection
   * manager only ever iterates and draws O(viewport) borders regardless of how many are configured.
   * Called on every view render (`afterViewRender`), before the selection borders are drawn.
   */
  #syncViewportSelections() {
    if (this.#bordersByRowDirty) {
      this.#rebuildBordersByRow();
    }

    const view = this.hot.view;
    const firstRow = view.getFirstRenderedVisibleRow();
    const lastRow = view.getLastRenderedVisibleRow();
    const firstColumn = view.getFirstRenderedVisibleColumn();
    const lastColumn = view.getLastRenderedVisibleColumn();

    // Nothing rendered (e.g. detached table or headers only) - drop the whole working set.
    if (firstRow === null || lastRow === null || firstColumn === null || lastColumn === null) {
      if (this.#customSelectionsCache.size > 0) {
        this.#destroyAllSelections();
      }

      return;
    }

    const shouldBeVisible = new Set<string>();

    for (let row = firstRow; row <= lastRow; row++) {
      const rowBorders = this.#bordersByRow.get(row);

      if (!rowBorders) {
        continue; // eslint-disable-line no-continue
      }

      arrayEach(rowBorders, (border) => {
        if (border.col >= firstColumn && border.col <= lastColumn) {
          shouldBeVisible.add(border.id);

          if (!this.#customSelectionsCache.has(border.id)) {
            this.#addSelectionForBorder(border);
          }
        }
      });
    }

    // Remove selections that scrolled out of the rendered range.
    arrayEach(Array.from(this.#customSelectionsCache.keys()), (borderId) => {
      if (!shouldBeVisible.has(borderId)) {
        this.#destroyBorderSelection(borderId);
      }
    });
  }

  /**
   * Creates and registers a rendered custom selection for a single border, keyed by its id in the
   * working-set cache. The `Border` DOM itself is created lazily by the selection manager when the
   * cell is inside the overlay's rendered range.
   *
   * @param {object} border The border model to render.
   */
  #addSelectionForBorder(border: BorderObject) {
    const borderCoords = this.hot._createCellCoords(border.row, border.col);
    const visualCellRange = this.hot._createCellRange(borderCoords, borderCoords, borderCoords);
    const { customSelections } = this.hot.selection.highlight;

    this.hot.selection.highlight.addCustomSelection({ border, visualCellRange });
    this.#customSelectionsCache.set(border.id, customSelections[customSelections.length - 1]);
  }

  /**
   * Splice border from savedBorders.
   *
   * @private
   * @param {string} borderId Border id name as string.
   */
  spliceBorder(borderId: string) {
    const index = this.#savedBordersIndex.get(borderId) ?? -1;

    if (index > -1) {
      this.savedBorders.splice(index, 1);
      this.#rebuildSavedBordersIndex();
    }
  }

  /**
   * Rebuilds the id-to-position index of the saved borders after positions have shifted.
   */
  #rebuildSavedBordersIndex() {
    this.#savedBordersIndex.clear();

    arrayEach(this.savedBorders, (border, index) => {
      this.#savedBordersIndex.set(border.id, index);
    });
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
      const index = this.#savedBordersIndex.get(border.id);

      if (index !== undefined) {
        this.savedBorders[index] = border;
        check = true;
      }
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
      const bordersClone = deepClone(customBorders.filter(isRecord));

      this.checkSettingsCohesion(bordersClone);

      // A fresh array config replaces the previous borders (this is also the `updateSettings` path).
      // Reset the model and clear the previous cells' meta first so `prepareBorderFromCustomAdded`
      // starts from a clean slate instead of merging the new config onto stale meta.
      this.#resetBorderModel();

      const progressive = this.#resolveProgressiveSetting();

      if (progressive.enabled && bordersClone.length > 0) {
        // Apply borders in background batches: render the (border-less) grid now so it is
        // interactive immediately; batches fill in and `afterCustomBordersUpdate` fires on drain.
        this.#startProgressiveApply(bordersClone, progressive.chunkSize);
        this.hot.render();

        return;
      }

      this.createCustomBorders(bordersClone);

    } else if (customBorders !== undefined) {
      this.createCustomBorders(this.savedBorders);
    }

    // The model was (re)built above; render so `#syncViewportSelections` materializes the visible
    // selections. `afterInit` fires after the first render, so without this the initially-configured
    // borders would have no render to sync against.
    this.hot.render();
    this.hot.runHooks('afterCustomBordersUpdate');
  }

  /**
   * Reads and normalizes the `customBordersProgressive` setting.
   *
   * @returns {{ enabled: boolean, chunkSize: number }}
   */
  #resolveProgressiveSetting(): { enabled: boolean, chunkSize: number } {
    const setting = this.hot.getSettings().customBordersProgressive;

    if (setting === true) {
      return { enabled: true, chunkSize: DEFAULT_PROGRESSIVE_CHUNK_SIZE };
    }

    if (isRecord(setting)) {
      const size = typeof setting.chunkSize === 'number' && setting.chunkSize > 0
        ? Math.floor(setting.chunkSize)
        : DEFAULT_PROGRESSIVE_CHUNK_SIZE;

      return { enabled: true, chunkSize: size };
    }

    return { enabled: false, chunkSize: DEFAULT_PROGRESSIVE_CHUNK_SIZE };
  }

  /**
   * Starts a progressive (background-batched) application of a border configuration. The first batch
   * is scheduled asynchronously so the initial grid render is not blocked.
   *
   * @param {Array} borders The border configuration entries to apply.
   * @param {number} chunkSize The number of entries to apply per batch.
   */
  #startProgressiveApply(borders: CustomBorderConfig[], chunkSize: number) {
    this.#progressiveToken += 1;
    this.#progressiveQueue = borders;
    this.#progressiveIndex = 0;
    this.#progressiveChunkSize = chunkSize;
    // One first-touch tracking Set shared across every batch (overlap-merge correctness).
    this.#configPassTouched = new Set();

    this.#scheduleProgressiveChunk(this.#progressiveToken);
  }

  /**
   * Schedules the next progressive batch on a timeout so the browser can paint between batches.
   * `_registerTimeout` auto-clears on `destroy`; the generation token guards against stale runs.
   *
   * @param {number} token The generation token captured when the load started.
   */
  #scheduleProgressiveChunk(token: number) {
    this.hot._registerTimeout(() => this.#processProgressiveChunk(token), 0);
  }

  /**
   * Applies one progressive batch, renders so the newly in-viewport borders appear, then schedules
   * the next batch or finishes. Aborts if the load was cancelled/superseded (token mismatch).
   *
   * @param {number} token The generation token captured when the load started.
   */
  #processProgressiveChunk(token: number) {
    if (token !== this.#progressiveToken || this.#progressiveQueue === null) {
      return;
    }

    const queue = this.#progressiveQueue;
    const end = Math.min(this.#progressiveIndex + this.#progressiveChunkSize, queue.length);

    this.createCustomBorders(queue.slice(this.#progressiveIndex, end));
    this.#progressiveIndex = end;
    this.hot.render();

    if (this.#progressiveIndex >= queue.length) {
      this.#finishProgressiveApply();
    } else {
      this.#scheduleProgressiveChunk(token);
    }
  }

  /**
   * Applies all remaining progressive batches synchronously and finishes. Used when the border model
   * must be complete immediately - e.g. before a structural change remaps coordinates.
   */
  #flushProgressiveApply() {
    if (this.#progressiveQueue === null) {
      return;
    }

    const queue = this.#progressiveQueue;

    while (this.#progressiveIndex < queue.length) {
      const end = Math.min(this.#progressiveIndex + this.#progressiveChunkSize, queue.length);

      this.createCustomBorders(queue.slice(this.#progressiveIndex, end));
      this.#progressiveIndex = end;
    }

    this.#finishProgressiveApply();
  }

  /**
   * Finalizes a progressive load: clears the queue and pass state, invalidates any pending batch
   * (token bump), and fires `afterCustomBordersUpdate` to signal the borders are complete.
   */
  #finishProgressiveApply() {
    this.#progressiveToken += 1;
    this.#progressiveQueue = null;
    this.#progressiveIndex = 0;
    this.#configPassTouched = null;
    this.hot.runHooks('afterCustomBordersUpdate');
  }

  /**
   * Cancels an in-flight progressive load without firing the completion hook (the borders are being
   * discarded/replaced). Invalidates pending batches via the token bump.
   */
  #cancelProgressiveApply() {
    if (this.#progressiveQueue === null) {
      return;
    }

    this.#progressiveToken += 1;
    this.#progressiveQueue = null;
    this.#progressiveIndex = 0;
    this.#configPassTouched = null;
  }

  /**
   * Checks the settings cohesion. The properties such like "left"/"right" are supported only
   * in the LTR mode and the "left"/"right" options can not be used together with "start"/"end" properties.
   *
   * @private
   * @param {object[]} customBorders The user defined custom border objects array.
   */
  checkSettingsCohesion(customBorders: CustomBorderConfig[]) {
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
  #validateStyleSettings(customBorders: CustomBorderConfig[]) {
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
   * Re-synchronizes the saved borders and their rendered custom selections after rows or columns
   * are inserted or removed. Each saved border's coordinate on the given axis is passed through
   * `mapIndex`; a result of `-1` means the border's cell no longer exists and the border is dropped,
   * otherwise the border moves to the new coordinate. The cell meta is left untouched - Handsontable
   * already shifts it, and this method only realigns the plugin's own bookkeeping to that meta.
   *
   * @param {string} axis The coordinate axis to shift - `'row'` or `'col'`.
   * @param {Function} mapIndex Maps an old visual index to its new index, or `-1` when removed.
   */
  #shiftBorders(axis: 'row' | 'col', mapIndex: (index: number) => number) {
    // A structural change remaps coordinates; the model must be complete first, so finish any
    // in-flight progressive load synchronously before shifting.
    this.#flushProgressiveApply();

    const survivors: BorderObject[] = [];

    arrayEach(this.savedBorders, (border) => {
      const nextIndex = mapIndex(border[axis]);

      if (nextIndex === -1) {
        return;
      }

      border[axis] = nextIndex;
      border.id = createId(border.row, border.col);
      survivors.push(border);
    });

    this.savedBorders.length = 0;
    arrayEach(survivors, border => this.savedBorders.push(border));

    this.#rebuildWorkingSetFromModel();
  }

  /**
   * Re-synchronizes the saved borders and their rendered custom selections after a row or column
   * move. Each border's new visual index on the given axis is derived from the physical index
   * captured before the move, so the border follows the cell it was applied to.
   *
   * @param {string} axis The coordinate axis to remap - `'row'` or `'col'`.
   * @param {Array} snapshot Physical indexes captured before the move, parallel to `savedBorders`.
   * @param {Function} toVisualIndex Translates a physical index to its current visual index.
   */
  #applyMoveSnapshot(
    axis: 'row' | 'col',
    snapshot: (number | null)[],
    toVisualIndex: (physicalIndex: number) => number | null
  ) {
    arrayEach(this.savedBorders, (border, index) => {
      const physicalIndex = snapshot[index];

      if (typeof physicalIndex !== 'number') {
        return;
      }

      const visualIndex = toVisualIndex(physicalIndex);

      if (typeof visualIndex !== 'number') {
        return;
      }

      border[axis] = visualIndex;
      border.id = createId(border.row, border.col);
    });

    this.#rebuildWorkingSetFromModel();
  }

  /**
   * Reindexes the model after a structural change has rewritten border coordinates and ids, then
   * drops and re-renders the working set so the viewport sync rebuilds it from the updated model.
   * Tearing the selections down first also avoids transient id collisions (a shifted border's new id
   * can equal another border's not-yet-shifted old id). Shared by `#shiftBorders` and
   * `#applyMoveSnapshot`.
   */
  #rebuildWorkingSetFromModel() {
    this.#rebuildSavedBordersIndex();
    this.#bordersByRowDirty = true;
    this.#destroyAllSelections();
    this.hot.render();
  }

  /**
   * Destroys the custom selection for the given border id and removes it from the highlight
   * collection and the id cache. Used when a border's cell is removed from the table.
   *
   * @param {string} borderId The id of the border whose selection should be destroyed.
   */
  #destroyBorderSelection(borderId: string) {
    const customSelection = this.#customSelectionsCache.get(borderId);

    if (!customSelection) {
      return;
    }

    const { customSelections } = this.hot.selection.highlight;
    const index = customSelections.indexOf(customSelection);

    if (index > -1) {
      customSelections.splice(index, 1);
    }

    customSelection.destroy();
    this.#customSelectionsCache.delete(borderId);
  }

  /**
   * Add border options to context menu.
   *
   * @param {object} defaultOptions Context menu items.
   */
  #onAfterContextMenuDefaultOptions(rawOptions: unknown) {
    if (!this.hot.getSettings()[PLUGIN_KEY]) {
      return;
    }

    if (typeof rawOptions !== 'object' || rawOptions === null) {
      return;
    }

    const defaultOptions = rawOptions as Record<string, unknown>;
    const { items } = defaultOptions;

    if (!Array.isArray(items)) {
      return;
    }

    items.push({
      name: '---------',
    }, {
      key: 'borders',
      name(this: HotInstance): string {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS);
      },
      disabled(this: HotInstance): boolean {
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
   * `afterViewRender` hook callback. Synchronizes the rendered custom-border selections with the
   * current viewport so only visible borders are materialized and drawn.
   */
  #onAfterViewRender = () => {
    this.#syncViewportSelections();
  };

  /**
   * `afterCreateRow` hook callback. Shifts every border at or below the insertion point down.
   *
   * @param {number} index Visual index of the first newly created row.
   * @param {number} amount Number of created rows.
   * @param {string} [source] Source that triggered the row creation.
   */
  #onAfterCreateRow = (index: number, amount: number, source?: string) => {
    if (source === 'auto') {
      return;
    }

    this.#shiftBorders('row', currentIndex => getShiftedIndexAfterInsert(currentIndex, index, amount));
  };

  /**
   * `afterRemoveRow` hook callback. Drops borders on removed rows and shifts the rest up.
   *
   * @param {number} index Visual index of the first removed row.
   * @param {number} amount Number of removed rows.
   */
  #onAfterRemoveRow = (index: number, amount: number) => {
    this.#shiftBorders('row', currentIndex => getShiftedIndexAfterRemove(currentIndex, index, amount));
  };

  /**
   * `afterCreateCol` hook callback. Shifts every border at or after the insertion point right.
   *
   * @param {number} index Visual index of the first newly created column.
   * @param {number} amount Number of created columns.
   * @param {string} [source] Source that triggered the column creation.
   */
  #onAfterCreateCol = (index: number, amount: number, source?: string) => {
    // Auto-inserted columns (e.g. `minSpareCols`) append at the end and, like auto rows, do NOT
    // shift cell meta in the core (`DataMap#createCol` skips `metaManager.createColumn` for
    // `source === 'auto'`). Shifting the border model here would then diverge from the meta, so skip
    // it - mirrors `#onAfterCreateRow`.
    if (source === 'auto') {
      return;
    }

    this.#shiftBorders('col', currentIndex => getShiftedIndexAfterInsert(currentIndex, index, amount));
  };

  /**
   * `afterRemoveCol` hook callback. Drops borders on removed columns and shifts the rest left.
   *
   * @param {number} index Visual index of the first removed column.
   * @param {number} amount Number of removed columns.
   */
  #onAfterRemoveCol = (index: number, amount: number) => {
    this.#shiftBorders('col', currentIndex => getShiftedIndexAfterRemove(currentIndex, index, amount));
  };

  /**
   * `beforeRowMove` hook callback. Snapshots each saved border's physical row so it can be
   * re-derived after the move reorders the visual index mapping.
   *
   * @param {Array} movedRows Visual row indexes being moved.
   * @param {number} finalIndex Target start index for the moved rows.
   * @param {number|undefined} dropIndex Drop index of the move.
   * @param {boolean} movePossible Whether the move is possible.
   */
  #onBeforeRowMove = (
    movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean
  ) => {
    // Snapshot needs the complete model; finish any in-flight progressive load first.
    this.#flushProgressiveApply();
    this.#rowMoveSnapshot = movePossible
      ? this.savedBorders.map(border => this.hot.toPhysicalRow(border.row))
      : null;
  };

  /**
   * `afterRowMove` hook callback. Re-derives each border's visual row from the pre-move snapshot.
   *
   * @param {Array} movedRows Visual row indexes that were moved.
   * @param {number} finalIndex Target start index for the moved rows.
   * @param {number|undefined} dropIndex Drop index of the move.
   * @param {boolean} movePossible Whether the move was possible.
   * @param {boolean} orderChanged Whether the move changed the row order.
   */
  #onAfterRowMove = (
    movedRows: number[], finalIndex: number, dropIndex: number | undefined,
    movePossible: boolean, orderChanged: boolean
  ) => {
    const snapshot = this.#rowMoveSnapshot;

    this.#rowMoveSnapshot = null;

    if (!snapshot || !orderChanged) {
      return;
    }

    this.#applyMoveSnapshot('row', snapshot, physicalIndex => this.hot.toVisualRow(physicalIndex));
  };

  /**
   * `beforeColumnMove` hook callback. Snapshots each saved border's physical column so it can be
   * re-derived after the move reorders the visual index mapping.
   *
   * @param {Array} movedColumns Visual column indexes being moved.
   * @param {number} finalIndex Target start index for the moved columns.
   * @param {number|undefined} dropIndex Drop index of the move.
   * @param {boolean} movePossible Whether the move is possible.
   */
  #onBeforeColumnMove = (
    movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean
  ) => {
    // Snapshot needs the complete model; finish any in-flight progressive load first.
    this.#flushProgressiveApply();
    this.#columnMoveSnapshot = movePossible
      ? this.savedBorders.map(border => this.hot.toPhysicalColumn(border.col))
      : null;
  };

  /**
   * `afterColumnMove` hook callback. Re-derives each border's visual column from the pre-move
   * snapshot.
   *
   * @param {Array} movedColumns Visual column indexes that were moved.
   * @param {number} finalIndex Target start index for the moved columns.
   * @param {number|undefined} dropIndex Drop index of the move.
   * @param {boolean} movePossible Whether the move was possible.
   * @param {boolean} orderChanged Whether the move changed the column order.
   */
  #onAfterColumnMove = (
    movedColumns: number[], finalIndex: number, dropIndex: number | undefined,
    movePossible: boolean, orderChanged: boolean
  ) => {
    const snapshot = this.#columnMoveSnapshot;

    this.#columnMoveSnapshot = null;

    if (!snapshot || !orderChanged) {
      return;
    }

    this.#applyMoveSnapshot('col', snapshot, physicalIndex => this.hot.toVisualColumn(physicalIndex));
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    // Cancel any in-flight progressive load and release the border model / working-set graphs so a
    // destroyed instance does not retain them for the page lifetime.
    this.#cancelProgressiveApply();
    this.savedBorders = [];
    this.#savedBordersIndex.clear();
    this.#bordersByRow.clear();
    this.#customSelectionsCache.clear();
    this.#rowMoveSnapshot = null;
    this.#columnMoveSnapshot = null;

    super.destroy();
  }
}
