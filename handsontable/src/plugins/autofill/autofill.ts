import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { CellProperties } from '../../settings';
import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { isObject, isObjectEqual } from '../../helpers/object';
import { arrayEach, arrayMap } from '../../helpers/array';
import { isEmpty } from '../../helpers/mixed';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import {
  countCellsPastEdge,
  getCopyDownEndRow,
  getDragDirectionAndRange,
  getDistanceOutsideRange,
  resolveDragDirection,
} from './utils';
import type { DragDirection } from './utils';
import { DIRECTIONS } from './constants';

Hooks.getSingleton().register('modifyAutofillRange');
Hooks.getSingleton().register('beforeAutofill');
Hooks.getSingleton().register('afterAutofill');

export const PLUGIN_KEY = 'autofill';
export const PLUGIN_PRIORITY = 20;
const SETTING_KEY = 'fillHandle';
const INSERT_ROW_ALTER_ACTION_NAME = 'insert_row_below';
const INTERVAL_FOR_ADDING_ROW = 200;

/**
 * Cell meta shape read by autofill. The `source` option is typed by `CellProperties` itself;
 * `_complexDataFormat` is a private plugin key with no public declaration, typed here so its
 * reads are `unknown` rather than the index-signature `any`.
 */
interface AutofillCellProperties extends CellProperties {
  _complexDataFormat?: unknown;
}

/**
 * `HotInstance` augmented with the internal `_getCopyableData` method. It exists on the Core runtime
 * object but is intentionally NOT part of the public `HotInstance` type, so it is not exposed to
 * third-party code. Autofill reads cell values through it because they are written back into the grid.
 */
type HotInstanceInternal = HotInstance & {
  _getCopyableData(row: number, column: number): unknown;
};

/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated using the small square in the right
 * bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring cells when you drag the small
 * square in the corner.
 *
 * "Copy-down" copies the value of the selection into the empty cells below when you double-click the small square.
 * It fills down as long as the column next to the selection has values. It stops at the first gap in that column,
 * and above the first cell that already has a value, so it never overwrites data.
 *
 * @class Autofill
 * @plugin Autofill
 */
export class Autofill extends BasePlugin {
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
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`.
   */
  static get SETTING_KEYS() {
    return [
      SETTING_KEY,
    ];
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS(): { direction: string | undefined; autoInsertRow: boolean } {
    return {
      direction: undefined,
      autoInsertRow: true,
    };
  }

  /**
   * Returns validator functions for each plugin setting to verify their values are valid before applying them.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      direction: (value: unknown) =>
        value === undefined || (typeof value === 'string' && (Object.values(DIRECTIONS) as string[]).includes(value)),
      autoInsertRow: (value: unknown) => typeof value === 'boolean',
    };
  }

  /**
   * Specifies if adding new row started.
   *
   * @private
   * @type {boolean}
   */
  addingStarted = false;
  /**
   * Specifies if there was mouse down on the cell corner.
   *
   * @private
   * @type {boolean}
   */
  mouseDownOnCellCorner = false;
  /**
   * Specifies if mouse was dragged outside Handsontable.
   *
   * @private
   * @type {boolean}
   */
  mouseDragOutside = false;
  /**
   * Specifies how many cell levels were dragged using the handle.
   *
   * @private
   * @type {number}
   */
  handleDraggedCells = 0;
  /**
   * Specifies allowed directions of drag (`'horizontal'` or '`vertical`').
   *
   * @private
   * @type {string[]}
   */
  directions: string[] = [];
  /**
   * Specifies if can insert new rows if needed.
   *
   * @private
   * @type {boolean}
   */
  autoInsertRow = false;
  /**
   * Specifies the current drag direction ('vertical', 'horizontal', or null).
   *
   * @type {string|null}
   */
  #currentDragDirection: DragDirection | null = null;
  /**
   * Whether the plugin is being torn down and rebuilt by `updatePlugin()` rather than genuinely
   * disabled. `updateSettings()` reaches `updatePlugin()` whenever `fillHandle` is merely *present*
   * in the payload, unchanged value included, so this must not end a live gesture.
   *
   * @type {boolean}
   */
  #isReconfiguring = false;
  /**
   * Whether `updateSettings()` is applying new settings to the plugin. The grid renders right after
   * that, so a toggle made from there must not render on its own.
   *
   * @type {boolean}
   */
  #isApplyingSettings = false;
  /**
   * Last mouse client position. Stays `null` until the first `mousemove` of a drag, so a scroll
   * that happens after pressing the fill handle but before any drag move is not replayed with a
   * stale or default position.
   *
   * @type {{ clientX: number, clientY: number } | null}
   */
  #lastMouseClientPosition: { clientX: number, clientY: number } | null = null;

  /**
   * Checks if the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[SETTING_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    // `destroy()` deletes `hot`, so a reference kept to a destroyed plugin must not run (DEV-775).
    if (!this.hot || this.enabled) {
      return;
    }

    const settings = this.hot.getSettings()[SETTING_KEY];
    const pluginSettings: { direction?: string; autoInsertRow?: boolean } = {};

    if (typeof settings === 'string') {
      pluginSettings.direction = settings;
    } else if (settings && typeof settings === 'object') {
      Object.assign(pluginSettings, settings);
    }

    this.updatePluginSettings(pluginSettings);

    if (this.getSetting('direction')) {
      this.directions = [this.getSetting<string>('direction')];
    } else {
      this.directions = Object.values(DIRECTIONS);
    }

    this.autoInsertRow = this.getSetting<boolean>('autoInsertRow');

    if (this.directions.length === 1 && this.directions.includes('horizontal')) {
      this.autoInsertRow = false;
    }

    this.registerEvents();

    this.addHook('afterOnCellCornerMouseDown', this.#onAfterCellCornerMouseDown);
    this.addHook('afterOnCellCornerDblClick', this.#onCellCornerDblClick);
    this.addHook('beforeOnCellMouseOver',
      (_: MouseEvent, coords: CellCoords) => this.#onBeforeCellMouseOver(coords));
    this.addHook('afterScroll', this.#onAfterScroll);

    super.enablePlugin();
    this.#renderAfterRuntimeToggle();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - `autofill`
   *  - [`fillHandle`](@/api/options.md#fillhandle)
   */
  updatePlugin(): void {
    if (!this.hot) {
      return;
    }

    const previousDirections = this.directions;
    const previousAutoInsertRow = this.autoInsertRow;

    this.#isReconfiguring = true;

    try {
      this.disablePlugin();
      this.enablePlugin();
    } finally {
      this.#isReconfiguring = false;
    }

    // A reconfiguration that changes what a fill is allowed to do must still end the gesture it
    // interrupted, or `#onMouseUp` commits it under the rules it was drawn with - a drag started
    // while both axes were allowed would fill vertically after the update narrowed it to
    // `horizontal`. The comparison is on the resolved configuration, so re-sending the same value
    // in another shape (`'vertical'` against `{ direction: 'vertical' }`) still counts as no change.
    if (
      this.autoInsertRow !== previousAutoInsertRow ||
      !isObjectEqual(previousDirections, this.directions)
    ) {
      this.#resetDragState();
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    if (!this.hot) {
      return;
    }

    // The base class drops the `documentElement` `mouseup` listener that owns the drag teardown,
    // so a gesture that is in progress when the plugin is disabled would otherwise stay armed
    // until the next `enablePlugin()` picks it up (DEV-2782, the lifecycle twin of GitHub #13370).
    // A reconfiguration re-registers that listener in the same tick, so the gesture it belongs to
    // is still live and must survive - see `updatePlugin()`.
    if (!this.#isReconfiguring) {
      this.#resetDragState();
    }

    super.disablePlugin();
    this.#renderAfterRuntimeToggle();
  }

  /**
   * Applies new settings, marking the call so the plugin toggles it causes leave the render to
   * `updateSettings()`.
   *
   * @param {object} newSettings New set of settings passed to the `updateSettings()` method.
   */
  onUpdateSettings(newSettings: Record<string, unknown>): void {
    this.#isApplyingSettings = true;

    try {
      super.onUpdateSettings(newSettings);
    } finally {
      this.#isApplyingSettings = false;
    }
  }

  /**
   * Re-renders the grid after the plugin was enabled, disabled, or destroyed at runtime, with
   * `getPlugin('autofill').disablePlugin()` and the like, so the fill handle shows or hides at once
   * instead of on the next unrelated render (DEV-775). Skipped while the grid initializes, while
   * `updateSettings()` applies settings, and while `updatePlugin()` rebuilds the plugin: each of
   * those renders on its own.
   */
  #renderAfterRuntimeToggle(): void {
    if (this.isPluginsReady && !this.#isApplyingSettings && !this.#isReconfiguring) {
      this.hot.render();
    }
  }

  /**
   * Gets selection data.
   *
   * @private
   * @param {boolean} [useSource=false] If `true`, returns copyable source data instead of copyable data.
   * @returns {object[]} Ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   */
  getSelectionData(useSource = false) {
    const selection = this.hot.getSelectedRangeLast();

    if (!selection) {
      return [];
    }

    const { row: startRow, col: startCol } = selection.getTopStartCorner();
    const { row: endRow, col: endCol } = selection.getBottomEndCorner();

    const copyableRanges = this.hot.runHooks<Record<string, number>[]>('modifyCopyableRange', [{
      startRow,
      startCol,
      endRow,
      endCol
    }]);
    const copyableRows: number[] = [];
    const copyableColumns: number[] = [];
    const seenRows = new Set<number>();
    const seenColumns = new Set<number>();
    const data: unknown[][] = [];

    arrayEach(copyableRanges, (range) => {
      for (let visualRow = range.startRow; visualRow <= range.endRow; visualRow += 1) {
        if (!seenRows.has(visualRow)) {
          seenRows.add(visualRow);
          copyableRows.push(visualRow);
        }
      }

      for (let visualColumn = range.startCol; visualColumn <= range.endCol; visualColumn += 1) {
        if (!seenColumns.has(visualColumn)) {
          seenColumns.add(visualColumn);
          copyableColumns.push(visualColumn);
        }
      }
    });

    arrayEach(copyableRows, (row) => {
      const rowSet: unknown[] = [];

      arrayEach(copyableColumns, (column) => {
        const r = row;
        const c = column;
        const sourceDataAtSource = useSource ? this.hot.getSourceDataAtCell(r, c) : null;

        if (useSource && (isObject(sourceDataAtSource) || Array.isArray(sourceDataAtSource))) {
          rowSet.push(this.hot.getCopyableSourceData(r, c));

        } else {
          // The raw value, not `getCopyableData()`'s string: this data is written back into the
          // grid by `populateFromArray()`, so a number has to stay a number.
          rowSet.push((this.hot as HotInstanceInternal)._getCopyableData(r, c));
        }

      });

      data.push(rowSet);
    });

    return data;
  }

  /**
   * Try to apply fill values to the area in fill border, omitting the selection border.
   *
   * @private
   * @returns {boolean} Reports if fill was applied.
   *
   * @fires Hooks#modifyAutofillRange
   * @fires Hooks#beforeAutofill
   * @fires Hooks#afterAutofill
   */
  fillIn() {
    if (this.hot.selection.highlight.getFill().isEmpty()) {
      return false;
    }

    // Fill area may starts or ends with invisible cell. There won't be any information about it as highlighted
    // selection store just renderable indexes (It's part of Walkontable). I extrapolate where the start or/and
    // the end is.
    const [fillStartRow, fillStartColumn, fillEndRow, fillEndColumn] =
      this.hot.selection.highlight.getFill().getVisualCorners();
    const selectionRangeLast = this.hot.getSelectedRangeLast();

    if (!selectionRangeLast) {
      return false;
    }

    const topStartCorner = selectionRangeLast.getTopStartCorner();
    const bottomEndCorner = selectionRangeLast.getBottomEndCorner();

    this.resetSelectionOfDraggedArea();

    const cornersOfSelectedCells = [
      topStartCorner.row ?? 0,
      topStartCorner.col ?? 0,
      bottomEndCorner.row ?? 0,
      bottomEndCorner.col ?? 0,
    ];

    const cornersOfSelectionAndDragAreas = this.hot
      .runHooks<number[]>(
        'modifyAutofillRange',
        [
          Math.min(topStartCorner.row ?? 0, fillStartRow ?? 0),
          Math.min(topStartCorner.col ?? 0, fillStartColumn ?? 0),
          Math.max(bottomEndCorner.row ?? 0, fillEndRow ?? 0),
          Math.max(bottomEndCorner.col ?? 0, fillEndColumn ?? 0),
        ],
        cornersOfSelectedCells
      );

    const {
      directionOfDrag,
      startOfDragCoords,
      endOfDragCoords
    } = getDragDirectionAndRange(
      cornersOfSelectedCells,
      cornersOfSelectionAndDragAreas,
      (row: number, column: number) => this.hot._createCellCoords(row, column),
    );

    if (startOfDragCoords && endOfDragCoords &&
        startOfDragCoords.row !== null && startOfDragCoords.col !== null &&
        endOfDragCoords.row !== null && endOfDragCoords.col !== null &&
        startOfDragCoords.row > -1 && startOfDragCoords.col > -1) {
      const startRow = startOfDragCoords.row;
      const startCol = startOfDragCoords.col;
      const endRow = endOfDragCoords.row;
      const endCol = endOfDragCoords.col;
      const startCoords = { row: startRow, col: startCol };
      const endCoords = { row: endRow, col: endCol };
      const selectionData = this.getSelectionData();
      const selectionSourceData = this.getSelectionData(true);
      const sourceRange = selectionRangeLast.clone();
      const targetRange = this.hot._createCellRange(
        startOfDragCoords, startOfDragCoords, endOfDragCoords);

      const beforeAutofillHookResult = this.hot.runHooks<unknown[][] | false>(
        'beforeAutofill',
        selectionData,
        sourceRange,
        targetRange,
        directionOfDrag
      );

      if (beforeAutofillHookResult === false) {
        this.hot.selection.highlight.getFill().clear();
        this.hot.render();

        return false;
      }

      let fillData: unknown[][] = beforeAutofillHookResult;
      const res = beforeAutofillHookResult;

      fillData = this.#adjustFillDataForDirection(res, fillData, directionOfDrag, startRow, endRow, startCol, endCol);
      fillData = this.#applySourceDataExtension(fillData, selectionSourceData, startCoords, endCoords, directionOfDrag);

      this.hot.populateFromArray(
        startRow,
        startCol,
        fillData,
        endRow,
        endCol,
        `${this.pluginName}.fill`,
        undefined
      );

      this.setSelection(cornersOfSelectionAndDragAreas, sourceRange);
      this.hot.runHooks('afterAutofill', fillData, sourceRange, targetRange, directionOfDrag);
      this.hot.render();

    } else {
      // reset to avoid some range bug
      this.hot.view.render();
    }

    return true;
  }

  /**
   * Adjusts fill data for reverse drag directions ('up' or 'left') by reordering rows or columns.
   *
   * @param {unknown[][]} res The original autofill hook result data.
   * @param {unknown[][]} fillData The current fill data to adjust.
   * @param {string} directionOfDrag The direction of the autofill drag.
   * @param {number} startRow The start row index of the drag area.
   * @param {number} endRow The end row index of the drag area.
   * @param {number} startCol The start column index of the drag area.
   * @param {number} endCol The end column index of the drag area.
   * @returns {unknown[][]} The adjusted fill data.
   */
  #adjustFillDataForDirection(
    res: unknown[][],
    fillData: unknown[][],
    directionOfDrag: string | undefined,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
  ): unknown[][] {
    if (
      (directionOfDrag !== 'up' && directionOfDrag !== 'left') ||
      (res.length === 1 && res[0].length === 0)
    ) {
      return fillData;
    }

    const result: unknown[][] = [];

    if (directionOfDrag === 'up') {
      const dragLength = endRow - startRow + 1;
      const fillOffset = dragLength % res.length;

      for (let i = 0; i < dragLength; i++) {
        result.push(res[(i + (res.length - fillOffset)) % res.length]);
      }
    } else {
      const dragLength = endCol - startCol + 1;
      const fillOffset = dragLength % res[0].length;

      for (let i = 0; i < res.length; i++) {
        result.push([]);

        for (let j = 0; j < dragLength; j++) {
          (result[i] as unknown[]).push(res[i][(j + (res[i].length - fillOffset)) % res[i].length]);
        }
      }
    }

    return result;
  }

  /**
   * Extends fill data with source data when source cells contain objects or arrays.
   *
   * @param {unknown[][]} fillData The current fill data.
   * @param {unknown[][]} selectionSourceData The original source selection data.
   * @param {{ row: number, col: number }} startCoords The start coordinates of the fill area.
   * @param {{ row: number, col: number }} endCoords The end coordinates of the fill area.
   * @param {string} directionOfDrag The direction of the autofill drag.
   * @returns {unknown[][]} The extended fill data, or the original if no extension was needed.
   */
  #applySourceDataExtension(
    fillData: unknown[][],
    selectionSourceData: unknown[][],
    startCoords: { row: number, col: number },
    endCoords: { row: number, col: number },
    directionOfDrag: string | undefined,
  ): unknown[][] {
    const hasComplexCells = selectionSourceData.some(
      row => row.some((cell: unknown) => isObject(cell) || Array.isArray(cell))
    );

    if (!hasComplexCells) {
      return fillData;
    }

    const fullFillData = this.#extendFillDataWithSourceData(
      fillData,
      selectionSourceData,
      startCoords,
      endCoords,
      directionOfDrag,
    );

    return fullFillData.length ? fullFillData : fillData;
  }

  /**
   * Add new row.
   *
   * @private
   */
  addRow() {
    this.hot._registerTimeout(() => {
      // A gesture released before the insertion was due no longer has a fill to extend into the
      // new row, which would stay empty (DEV-140).
      if (!this.mouseDownOnCellCorner) {
        this.addingStarted = false;

        return;
      }

      this.hot.alter(INSERT_ROW_ALTER_ACTION_NAME, undefined, 1, `${this.pluginName}.fill`);

      this.addingStarted = false;

      // A hook run by the insertion can end the gesture, or destroy the grid with it.
      if (!this.hot || !this.mouseDownOnCellCorner) {
        return;
      }

      // The row appears under a pointer that may not move again before the release, so follow it
      // here. Counted as a drag step, unlike a scroll replay: the drag itself grew the grid.
      if (this.#lastMouseClientPosition) {
        this.#followPointer(this.#lastMouseClientPosition, true);
      }
    }, INTERVAL_FOR_ADDING_ROW);
  }

  /**
   * Add new rows if they are needed to continue auto-filling values.
   *
   * @private
   */
  addNewRowIfNeeded() {
    if (!this.hot.selection.highlight.getFill().isEmpty() && this.addingStarted === false && this.autoInsertRow) {
      const bottomRow = this.hot.getSelectedRangeLast()?.getBottomEndCorner().row ?? null;
      const cornersOfSelectedDragArea = this.hot.selection.highlight.getFill().getVisualCorners();
      const nrOfTableRows = this.hot.countRows();

      if (bottomRow !== null && bottomRow < nrOfTableRows - 1 && cornersOfSelectedDragArea[2] === nrOfTableRows - 1) {
        this.addingStarted = true;

        this.addRow();
      }
    }
  }

  /**
   * Get index of last adjacent filled in row – the last row a double-click on the fill handle fills.
   * The walk itself is `getCopyDownEndRow()` in `utils.ts`: it follows one guide column (the left
   * neighbor, else the right one), stops above the first row that already holds a value in a selected
   * column, and at the first visible row where the guide column is empty.
   *
   * Cells are read one at a time, as stored values, so a formula counts as a value even when it
   * evaluates to an empty string. A guide cell covered by a merged area reads its area's value.
   *
   * @private
   * @param {Array} cornersOfSelectedCells Indexes of selection corners.
   * @returns {number} Gives number greater than or equal to zero when selection adjacent can be applied.
   *                   Or -1 when selection adjacent can't be applied.
   */
  getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells: number[]) {
    const [, startColumn, endRow, endColumn] = cornersOfSelectedCells;
    const columnCount = this.hot.countCols();
    const isStoredValueEmpty = (row: number, column: number) => column < 0 || column >= columnCount ||
      isEmpty(this.hot.getSourceDataAtCell(this.hot.toPhysicalRow(row), column));
    const mergeCells = this.hot.getPlugin('mergeCells');
    const lastRow = getCopyDownEndRow(
      {
        isFilledColumnEmpty: isStoredValueEmpty,
        isGuideColumnEmpty: (row, column) => {
          const mergedArea = mergeCells?.enabled ? mergeCells.mergedCellsCollection.get(row, column) : false;

          return mergedArea
            ? isStoredValueEmpty(mergedArea.row, mergedArea.col)
            : isStoredValueEmpty(row, column);
        },
        isRowHidden: row => this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(row)),
      },
      { endRow, startColumn, endColumn },
      this.hot.countRows(),
    );

    return lastRow ?? -1;
  }

  /**
   * Adds a selection from the start area to the specific row index.
   *
   * @private
   * @param {Array} selectStartArea Selection area from which we start to create more comprehensive selection.
   * @param {number} rowIndex The row index into the selection will be added.
   */
  addSelectionFromStartAreaToSpecificRowIndex(selectStartArea: number[], rowIndex: number) {
    this.hot.selection.highlight.getFill()
      .clear()
      .add(this.hot._createCellCoords(selectStartArea[0], selectStartArea[1]))
      .add(this.hot._createCellCoords(rowIndex, selectStartArea[3]))
      .commit();
  }

  /**
   * Sets selection based on passed corners.
   *
   * When `sourceRange` is provided, the active cell (`from`) is anchored to the corner
   * of the merged selection that wasn't extended by the autofill drag. This keeps the
   * highlight at its pre-fill position instead of flipping to the top-start corner,
   * matching Google Sheets and Excel behavior.
   *
   * @private
   * @param {Array} cornersOfArea An array witch defines selection.
   * @param {CellRange} [sourceRange] Pre-fill selection range used to preserve the
   *                                  original `from` corner orientation.
   */
  setSelection(cornersOfArea: number[], sourceRange?: CellRange) {
    const mappedCorners = arrayMap(cornersOfArea, (index: number) => Math.max(index, 0));
    const minRow = mappedCorners[0];
    const minCol = mappedCorners[1];
    const maxRow = mappedCorners[2];
    const maxCol = mappedCorners[3];
    let fromRow = minRow;
    let fromCol = minCol;
    let toRow = maxRow;
    let toCol = maxCol;

    if (sourceRange) {
      const { row: preMinRowOrNull, col: preMinColOrNull } = sourceRange.getTopStartCorner();
      const { row: preMaxRowOrNull, col: preMaxColOrNull } = sourceRange.getBottomEndCorner();
      const preMinRow = preMinRowOrNull ?? 0;
      const preMinCol = preMinColOrNull ?? 0;
      const preMaxRow = preMaxRowOrNull ?? 0;
      const preMaxCol = preMaxColOrNull ?? 0;

      if (minRow < preMinRow) {
        fromRow = maxRow; // dragged up - anchor stays at the (preserved) bottom
      } else if (maxRow > preMaxRow) {
        fromRow = minRow; // dragged down - anchor stays at the (preserved) top
      } else {
        fromRow = sourceRange.from.row === preMinRow ? minRow : maxRow;
      }

      if (minCol < preMinCol) {
        fromCol = maxCol; // dragged left - anchor stays at the (preserved) right
      } else if (maxCol > preMaxCol) {
        fromCol = minCol; // dragged right - anchor stays at the (preserved) left
      } else {
        fromCol = sourceRange.from.col === preMinCol ? minCol : maxCol;
      }

      toRow = fromRow === minRow ? maxRow : minRow;
      toCol = fromCol === minCol ? maxCol : minCol;
    }

    this.hot.selectCell(fromRow, fromCol, toRow, toCol, false, false);
  }

  /**
   * Try to select cells down to the last row in the left column and then returns if selection was applied.
   *
   * @private
   * @returns {boolean}
   */
  selectAdjacent() {
    const range = this.hot.getSelectedRangeLast();

    if (!range) {
      return false;
    }

    const topStart = range.getTopStartCorner();
    const bottomEnd = range.getBottomEndCorner();
    const cornersOfSelectedCells = [topStart.row ?? 0, topStart.col ?? 0, bottomEnd.row ?? 0, bottomEnd.col ?? 0];
    const lastFilledInRowIndex = this.getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells);

    if (lastFilledInRowIndex === -1 || lastFilledInRowIndex === undefined) {
      return false;
    }

    this.addSelectionFromStartAreaToSpecificRowIndex(cornersOfSelectedCells, lastFilledInRowIndex);

    return true;

  }

  /**
   * Resets selection of dragged area.
   *
   * @private
   */
  resetSelectionOfDraggedArea() {
    this.handleDraggedCells = 0;

    this.hot.selection.highlight.getFill().clear();
  }

  /**
   * Redraws borders.
   *
   * @private
   * @param {CellCoords} cellCoords `CellCoords` coord object.
   * @param {{rows: number, columns: number}} [cellsPastTable] How many cells the pointer reached past
   * the table's bottom and inline-end edges, counted on top of the cell under it.
   */
  redrawBorders(
    cellCoords: { row: number | null, col: number | null },
    cellsPastTable: { rows: number, columns: number } = { rows: 0, columns: 0 },
  ) {
    const allowedDirections = this.directions;
    const lastRange = this.hot.getSelectedRangeLast();

    if (!lastRange || !cellCoords || cellCoords.row === null || cellCoords.col === null) {
      return;
    }

    const coords = this.hot._createCellCoords(cellCoords.row, cellCoords.col);
    const highlight = lastRange.getBottomEndCorner();
    const topStartCorner = lastRange.getTopStartCorner();
    const bottomEndCorner = lastRange.getBottomEndCorner();

    // The fill handle sits on the selection's corner, so a diagonal pointer leaves the selection on
    // both axes at once. See this plugin's AGENTS.md ("Resolving the drag direction", DEV-140).
    this.#currentDragDirection = resolveDragDirection(
      this.#currentDragDirection,
      getDistanceOutsideRange(coords.row ?? 0, topStartCorner.row ?? 0, bottomEndCorner.row ?? 0) +
        cellsPastTable.rows,
      getDistanceOutsideRange(coords.col ?? 0, topStartCorner.col ?? 0, bottomEndCorner.col ?? 0) +
        cellsPastTable.columns,
      allowedDirections,
    );

    let toRow = highlight.row;
    let toCol = highlight.col;

    if (this.#currentDragDirection === 'vertical' && allowedDirections.includes('vertical')) {
      toRow = coords.row ?? 0;
      toCol = topStartCorner.col ?? 0;

    } else if (this.#currentDragDirection === 'horizontal' && allowedDirections.includes('horizontal')) {
      toRow = topStartCorner.row ?? 0;
      toCol = coords.col ?? 0;
    }

    const to = this.hot._createCellCoords(toRow ?? 0, toCol ?? 0);

    this.hot.selection.highlight.getFill()
      .clear()
      .add(lastRange.from)
      .add(lastRange.to)
      .add(to)
      .commit();

    this.hot.view.render();
  }

  /**
   * Get if mouse was dragged outside.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   * @returns {boolean}
   */
  getIfMouseWasDraggedOutside(event: Pick<MouseEvent, 'clientX' | 'clientY'>) {
    // Viewport coordinates straight from the box: unlike the offset chain, it follows the transform
    // that places the spreader (`walkontable/src/overlay/spreaderOffset.ts`).
    const { bottom: tableBottom } = this.hot.table.getBoundingClientRect();

    // The drag direction already weighs how far below and beside the table the pointer is (see
    // `#followPointer()`), so a new row is due exactly when a vertical drag reaches below the table –
    // the end of the data, which the table's edge is only while the last row is rendered.
    return event.clientY > tableBottom &&
      this.#currentDragDirection === DIRECTIONS.vertical &&
      this.#isLastRowRendered();
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    const { documentElement } = this.hot.rootDocument;

    this.eventManager.addEventListener(documentElement, 'mouseup', () => this.#onMouseUp());
    this.eventManager.addEventListener(documentElement, 'mousemove',
      (event: Event) => this.#onMouseMove(event as MouseEvent));
  }

  /**
   * Extends the fill data with the source data based on the content of the target cells.
   *
   * @param {Array} fillData The fill data to extend.
   * @param {Array} selectionSourceData The source data to extend the fill data with.
   * @param {CellCoords} startOfDragCoords The start of the drag area.
   * @param {CellCoords} endOfDragCoords The end of the drag area.
   * @returns {Array} The extended fill data.
   */
  #extendFillDataWithSourceData(
    fillData: unknown[][], selectionSourceData: unknown[][],
    startOfDragCoords: { row: number, col: number }, endOfDragCoords: { row: number, col: number },
    _directionOfDrag?: string
  ): unknown[][] {
    const fullFillData: unknown[][] = [];

    for (
      let rowIndex = Math.min(startOfDragCoords.row, endOfDragCoords.row);
      rowIndex <= Math.max(startOfDragCoords.row, endOfDragCoords.row);
      rowIndex += 1
    ) {
      fullFillData.push([]);

      for (
        let columnIndex = Math.min(startOfDragCoords.col, endOfDragCoords.col);
        columnIndex <= Math.max(startOfDragCoords.col, endOfDragCoords.col);
        columnIndex += 1
      ) {
        const targetCellSourceData = this.hot.getSourceDataAtCell(rowIndex, columnIndex);
        // The transient read keeps a large drag-fill or fill-down from permanently materializing
        // one meta object per filled cell - the loop only reads `source`/`_complexDataFormat`.
        const cellMeta = this.hot.getCellMetaTransient<AutofillCellProperties>(rowIndex, columnIndex);
        const cellSource = cellMeta.source;
        const cellSourceFirstItem: unknown = Array.isArray(cellSource) ? cellSource[0] : undefined;
        const isComplexDataFormatCell =
          cellMeta._complexDataFormat ||
          isObject(cellSourceFirstItem) ||
          Array.isArray(cellSourceFirstItem);
        const relativeRowIndex = rowIndex - Math.min(startOfDragCoords.row, endOfDragCoords.row);
        const relativeColumnIndex = columnIndex - Math.min(startOfDragCoords.col, endOfDragCoords.col);
        const modRelativeRowIndex = relativeRowIndex % selectionSourceData.length;
        const selectionFirstRow = selectionSourceData[0];
        const modRelativeColumnIndex = relativeColumnIndex % selectionFirstRow.length;

        if (
          isObject(targetCellSourceData) ||
          Array.isArray(targetCellSourceData) ||
          isComplexDataFormatCell // TODO: Replace with extending the data schema generator capabilities.
        ) {
          fullFillData[relativeRowIndex][relativeColumnIndex] =
            selectionSourceData[modRelativeRowIndex][modRelativeColumnIndex];

        } else {
          fullFillData[relativeRowIndex][relativeColumnIndex] = fillData[modRelativeRowIndex][modRelativeColumnIndex];
        }
      }
    }

    return fullFillData;
  }

  /**
   * On cell corner double click callback.
   *
   * @private
   */
  #onCellCornerDblClick = () => {
    const selectionApplied = this.selectAdjacent();

    if (selectionApplied) {
      this.fillIn();
    }
  };

  /**
   * On after cell corner mouse down listener.
   */
  #onAfterCellCornerMouseDown = () => {
    this.handleDraggedCells = 1;
    this.mouseDownOnCellCorner = true;
    this.#currentDragDirection = null;
    this.#lastMouseClientPosition = null;
  };

  /**
   * On before cell mouse over listener.
   *
   * @param {CellCoords} coords Cell coordinates.
   */
  #onBeforeCellMouseOver(coords: CellCoords) {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handleDraggedCells) {
      this.handleDraggedCells += 1;

      if (this.hot.selection.highlight.getFill().isEmpty()) {
        this.redrawBorders(coords);
      }

      this.addNewRowIfNeeded();
    }
  }

  /**
   * On mouse up listener.
   */
  #onMouseUp() {
    // Gate on the gesture flag, not on the drag-step counter. See this plugin's AGENTS.md
    // ("Two drag-state fields, one sentinel") for why the counter is already 0 here (GitHub #13370).
    if (this.mouseDownOnCellCorner) {
      if (this.handleDraggedCells > 1) {
        this.fillIn();
      }

      this.#resetDragState();
    }
  }

  /**
   * Ends the corner gesture: clears the drag flag, the step counter, the drag direction, and the
   * fill preview border. Shared by the `mouseup` teardown and `disablePlugin()`.
   */
  #resetDragState() {
    this.resetSelectionOfDraggedArea();
    this.mouseDownOnCellCorner = false;
    this.mouseDragOutside = false;
    this.#currentDragDirection = null;
    this.#lastMouseClientPosition = null;
  }

  /**
   * On mouse move listener.
   *
   * @param {MouseEvent} event `mousemove` event properties.
   * @param {boolean} [countDragStep=true] Whether a move onto a new cell should be counted as a
   * drag step. Only genuine pointer moves count; a scroll replay (see `#onAfterScroll`) redraws
   * the border without counting, otherwise a scroll that shifts the cell under a resting pointer
   * would register a drag that never happened.
   */
  #onMouseMove(event: Pick<MouseEvent, 'clientX' | 'clientY'>, countDragStep = true) {
    if (this.mouseDownOnCellCorner) {
      this.#followPointer(event, countDragStep);
    }

    // Short-circuited on purpose: the measurement reads `this.hot.table`, which is `undefined` on
    // an instance whose init aborted before the view existed. See this plugin's AGENTS.md
    // ("The `documentElement` listeners outlive a failed init").
    // A scroll replay (`countDragStep` off) may extend a drag into a new row, but it cannot start one:
    // until a real move has counted a drag step, the gesture has no fill to put into the row.
    const shouldMarkDragOutside = this.addingStarted === false &&
      this.handleDraggedCells > 0 &&
      (countDragStep || this.handleDraggedCells > 1) &&
      this.getIfMouseWasDraggedOutside(event);

    if (shouldMarkDragOutside) {
      this.mouseDragOutside = true;
      this.addingStarted = true;

    } else {
      this.mouseDragOutside = false;
    }

    if (this.mouseDragOutside && this.autoInsertRow) {
      this.addRow();
    }
  }

  /**
   * Redraws the fill border for the cell under the pointer of a live corner gesture, and counts the
   * move as a drag step when it lands outside the selection.
   *
   * @param {{clientX: number, clientY: number}} position The pointer's viewport position.
   * @param {boolean} countDragStep Whether a move onto a new cell counts as a drag step.
   */
  #followPointer(position: Pick<MouseEvent, 'clientX' | 'clientY'>, countDragStep: boolean) {
    const { clientX, clientY } = position;
    const cellsPastTable = this.#countCellsPastTable(clientX, clientY);
    let cellCoords = getCellCoordsFromMousePosition(this.hot, clientX, clientY);
    const selectedRange = this.hot.getSelectedRangeLast();

    // Below the whole table, the pointer points past its last row. That includes a row just inserted
    // below the visible part of a grid with a fixed height, which the clamp to the viewport above
    // cannot reach, so the fill would stop short of it.
    if (cellsPastTable.rows > 0 && cellsPastTable.lastRow !== null && cellCoords.col !== null) {
      cellCoords = this.hot._createCellCoords(cellsPastTable.lastRow, cellCoords.col);
    }

    this.#lastMouseClientPosition = { clientX, clientY };

    // The `beforeOnCellMouseOver`-based counting doesn't fire when the pointer leaves
    // the table element (e.g. dragging the last column's fill handle at a slight angle,
    // past the table's edge), so count the drag here as well. Otherwise the fill made
    // with such a drag would never be committed on mouseup.
    if (countDragStep && this.handleDraggedCells > 0 && selectedRange && !selectedRange.includes(cellCoords)) {
      this.handleDraggedCells += 1;
    }

    this.redrawBorders(cellCoords, cellsPastTable);
  }

  /**
   * Counts how many cells the pointer reached past the table's bottom and inline-end edges, sized by
   * the last row and column. The cell under such a pointer is clamped to the table's edge, so without
   * this a pointer far below the last row would weigh as much as one level with it.
   *
   * @param {number} clientX The pointer's horizontal viewport position.
   * @param {number} clientY The pointer's vertical viewport position.
   * @returns {{rows: number, columns: number, lastRow: number|null}} The counts, and the visual index
   * of the last row that is not hidden (`null` when there is none).
   */
  #countCellsPastTable(clientX: number, clientY: number) {
    const { bottom, left, right } = this.hot.table.getBoundingClientRect();
    const lastRow = this.#getLastNotHiddenRow();
    const lastColumn = this.hot.columnIndexMapper.getNearestNotHiddenIndex(this.hot.countCols() - 1, -1);
    const rowHeight = lastRow === null ?
      0 : this.hot.getRowHeight(lastRow) ?? this.hot.stylesHandler.getDefaultRowHeight(lastRow);
    const columnWidth = lastColumn === null ? 0 : this.hot.getColWidth(lastColumn);
    const pixelsPastInlineEnd = this.hot.isRtl() ? left - clientX : clientX - right;

    // The table element holds only the rendered rows and columns. A long grid with a fixed height
    // renders a few rows past its viewport and stops there, so the table's edge is the data's edge
    // only while the last row (or column) is rendered. Past any other edge, nothing is counted.
    const isLastColumnRendered = lastColumn !== null && lastColumn === this.hot.getLastRenderedVisibleColumn();

    return {
      rows: this.#isLastRowRendered() ? countCellsPastEdge(clientY - bottom, rowHeight) : 0,
      columns: isLastColumnRendered ? countCellsPastEdge(pixelsPastInlineEnd, columnWidth) : 0,
      lastRow,
    };
  }

  /**
   * The visual index of the last row that is not hidden, or `null` when there is none.
   *
   * @returns {number|null}
   */
  #getLastNotHiddenRow(): number | null {
    return this.hot.rowIndexMapper.getNearestNotHiddenIndex(this.hot.countRows() - 1, -1);
  }

  /**
   * Whether the last row that is not hidden is rendered, which makes the bottom edge of the table
   * element the end of the data.
   *
   * @returns {boolean}
   */
  #isLastRowRendered(): boolean {
    const lastRow = this.#getLastNotHiddenRow();

    return lastRow !== null && lastRow === this.hot.getLastRenderedVisibleRow();
  }

  /**
   * Refreshes the autofill borders using the last mouse client position after scroll.
   */
  #onAfterScroll = () => {
    if (this.mouseDownOnCellCorner && this.#lastMouseClientPosition) {
      this.#onMouseMove(this.#lastMouseClientPosition, false);
    }
  };

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    // A plugin destroyed on its own, ahead of the grid, takes its fill handle with it. The grid's
    // own `destroy()` suspends rendering first, so this render is a no-op there.
    const hot = this.hot;
    const shouldRender = !!hot && this.isPluginsReady;

    super.destroy();

    if (shouldRender) {
      hot.render();
    }
  }
}
