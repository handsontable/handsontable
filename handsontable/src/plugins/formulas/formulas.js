import { BasePlugin } from '../base';
import staticRegister from '../../utils/staticRegister';
import { error, warn } from '../../helpers/console';
import { isNumeric } from '../../helpers/number';
import {
  isDefined,
  isUndefined
} from '../../helpers/mixed';
import {
  setupEngine,
  setupSheet,
  unregisterEngine,
  getRegisteredHotInstances,
} from './engine/register';
import {
  isEscapedFormulaExpression,
  unescapeFormulaExpression,
} from './utils';
import { getEngineSettingsWithOverrides } from './engine/settings';
import { isArrayOfArrays } from '../../helpers/data';
import { toUpperCaseFirst } from '../../helpers/string';
import Hooks from '../../pluginHooks';

export const PLUGIN_KEY = 'formulas';
export const PLUGIN_PRIORITY = 260;
const ROW_MOVE_UNDO_REDO_NAME = 'row_move';

Hooks.getSingleton().register('afterNamedExpressionAdded');
Hooks.getSingleton().register('afterNamedExpressionRemoved');
Hooks.getSingleton().register('afterSheetAdded');
Hooks.getSingleton().register('afterSheetRemoved');
Hooks.getSingleton().register('afterSheetRenamed');
Hooks.getSingleton().register('afterFormulasValuesUpdate');

// This function will be used for detecting changes coming from the `UndoRedo` plugin. This kind of change won't be
// handled by whole body of listeners and therefore won't change undo/redo stack inside engine provided by HyperFormula.
// HyperFormula's `undo` and `redo` methods will do it instead. Please keep in mind that undo/redo stacks inside
// instances of Handsontable and HyperFormula should be synced (number of actions should be the same).
const isBlockedSource = source => source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';

/**
 * This plugin allows you to perform Excel-like calculations in your business applications. It does it by an
 * integration with our other product, [HyperFormula](https://github.com/handsontable/hyperformula/), which is a
 * powerful calculation engine with an extensive number of features.
 *
 * To test out HyperFormula, see [this guide](@/guides/formulas/formula-calculation.md#available-functions).
 *
 * @plugin Formulas
 * @class Formulas
 */
export class Formulas extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Flag used to bypass hooks in internal operations.
   *
   * @private
   * @type {boolean}
   */
  #internalOperationPending = false;

  /**
   * Flag needed to mark if Handsontable was initialized with no data.
   * (Required to work around the fact, that Handsontable auto-generates sample data, when no data is provided).
   *
   * @type {boolean}
   */
  #hotWasInitializedWithEmptyData = false;

  /**
   * The list of the HyperFormula listeners.
   *
   * @type {Array}
   */
  #engineListeners = [
    ['valuesUpdated', (...args) => this.onEngineValuesUpdated(...args)],
    ['namedExpressionAdded', (...args) => this.onEngineNamedExpressionsAdded(...args)],
    ['namedExpressionRemoved', (...args) => this.onEngineNamedExpressionsRemoved(...args)],
    ['sheetAdded', (...args) => this.onEngineSheetAdded(...args)],
    ['sheetRenamed', (...args) => this.onEngineSheetRenamed(...args)],
    ['sheetRemoved', (...args) => this.onEngineSheetRemoved(...args)],
  ];

  /**
   * Static register used to set up one global HyperFormula instance.
   * TODO: currently used in tests, might be removed later.
   *
   * @private
   * @type {object}
   */
  staticRegister = staticRegister('formulas');

  /**
   * The engine instance that will be used for this instance of Handsontable.
   *
   * @type {HyperFormula|null}
   */
  engine = null;

  /**
   * HyperFormula's sheet name.
   *
   * @type {string|null}
   */
  sheetName = null;

  /**
   * HyperFormula's sheet id.
   *
   * @type {number|null}
   */
  get sheetId() {
    return this.sheetName === null ? null : this.engine.getSheetId(this.sheetName);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings()[PLUGIN_KEY] ? true : false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.engine = setupEngine(this.hot) ?? this.engine;

    if (!this.engine) {
      warn('Missing the required `engine` key in the Formulas settings. Please fill it with either an' +
        ' engine class or an engine instance.');

      return;
    }

    // Useful for disabling -> enabling the plugin using `updateSettings` or the API.
    if (this.sheetName !== null && !this.engine.doesSheetExist(this.sheetName)) {
      const newSheetName = this.addSheet(this.sheetName, this.hot.getSourceDataArray());

      if (newSheetName !== false) {
        this.sheetName = newSheetName;
      }
    }

    this.addHook('beforeLoadData', (...args) => this.onBeforeLoadData(...args));
    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args));
    this.addHook('beforeValidate', (...args) => this.onBeforeValidate(...args));

    this.addHook('afterSetSourceDataAtCell', (...args) => this.onAfterSetSourceDataAtCell(...args));
    this.addHook('afterSetDataAtCell', (...args) => this.onAfterSetDataAtCell(...args));
    this.addHook('afterSetDataAtRowProp', (...args) => this.onAfterSetDataAtCell(...args));

    this.addHook('beforeCreateRow', (...args) => this.onBeforeCreateRow(...args));
    this.addHook('beforeCreateCol', (...args) => this.onBeforeCreateCol(...args));

    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));

    this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    this.addHook('beforeRemoveCol', (...args) => this.onBeforeRemoveCol(...args));

    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));

    // Handling undo actions on data just using HyperFormula's UndoRedo mechanism
    this.addHook('beforeUndo', (action) => {
      // TODO: Move action isn't handled by HyperFormula.
      if (action?.actionType === ROW_MOVE_UNDO_REDO_NAME) {
        return;
      }

      this.engine.undo();
    });

    // Handling redo actions on data just using HyperFormula's UndoRedo mechanism
    this.addHook('beforeRedo', (action) => {
      // TODO: Move action isn't handled by HyperFormula.
      if (action?.actionType === ROW_MOVE_UNDO_REDO_NAME) {
        return;
      }

      this.engine.redo();
    });

    this.addHook('afterDetachChild', (...args) => this.onAfterDetachChild(...args));

    this.addHook('beforeAutofill', (...args) => this.onBeforeAutofill(...args));

    this.#engineListeners.forEach(([eventName, listener]) => this.engine.on(eventName, listener));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#engineListeners.forEach(([eventName, listener]) => this.engine.off(eventName, listener));

    unregisterEngine(this.engine, this.hot);

    this.engine = null;

    super.disablePlugin();
  }

  /**
   * Triggered on `updateSettings`.
   *
   * @private
   * @param {object} newSettings New set of settings passed to the `updateSettings` method.
   */
  updatePlugin(newSettings) {
    this.engine.updateConfig(getEngineSettingsWithOverrides(this.hot.getSettings()));

    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (
      isDefined(pluginSettings) &&
      isDefined(pluginSettings.sheetName) &&
      pluginSettings.sheetName !== this.sheetName
    ) {
      this.switchSheet(pluginSettings.sheetName);
    }

    // If no data was passed to the `updateSettings` method and no sheet is connected to the instance -> create a
    // new sheet using the currently used data. Otherwise, it will be handled by the `afterLoadData` call.
    if (!newSettings.data && this.sheetName === null) {
      const sheetName = this.hot.getSettings()[PLUGIN_KEY].sheetName;

      if (sheetName && this.engine.doesSheetExist(sheetName)) {
        this.switchSheet(this.sheetName);

      } else {
        this.sheetName = this.addSheet(sheetName ?? void 0, this.hot.getSourceDataArray());
      }
    }

    super.updatePlugin(newSettings);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#engineListeners.forEach(([eventName, listener]) => this.engine?.off(eventName, listener));
    this.#engineListeners = null;

    unregisterEngine(this.engine, this.hot);

    this.engine = null;

    super.destroy();
  }

  /**
   * Helper function for `toPhysicalRowPosition` and `toPhysicalColumnPosition`.
   *
   * @private
   * @param {number} visualIndex Visual entry index.
   * @param {number} physicalIndex Physical entry index.
   * @param {number} entriesCount Visual entries count.
   * @param {number} sourceEntriesCount Source entries count.
   * @param {boolean} contained `true` if it should return only indexes within boundaries of the table (basically
   * `toPhysical` alias.
   * @returns {*}
   */
  getPhysicalIndexPosition(visualIndex, physicalIndex, entriesCount, sourceEntriesCount, contained) {
    if (!contained) {
      if (visualIndex >= entriesCount) {
        return sourceEntriesCount + (visualIndex - entriesCount);
      }
    }

    return physicalIndex;
  }

  /**
   * Returns the physical row index. The difference between this and Core's `toPhysical` is that it doesn't return
   * `null` on rows with indexes higher than the number of rows.
   *
   * @private
   * @param {number} row Visual row index.
   * @param {boolean} [contained] `true` if it should return only indexes within boundaries of the table (basically
   * `toPhysical` alias.
   * @returns {number} The physical row index.
   */
  toPhysicalRowPosition(row, contained = false) {
    return this.getPhysicalIndexPosition(
      row,
      this.hot.toPhysicalRow(row),
      this.hot.countRows(),
      this.hot.countSourceRows(),
      contained
    );
  }

  /**
   * Returns the physical column index. The difference between this and Core's `toPhysical` is that it doesn't return
   * `null` on columns with indexes higher than the number of columns.
   *
   * @private
   * @param {number} column Visual column index.
   * @param {boolean} [contained] `true` if it should return only indexes within boundaries of the table (basically
   * `toPhysical` alias.
   * @returns {number} The physical column index.
   */
  toPhysicalColumnPosition(column, contained = false) {
    return this.getPhysicalIndexPosition(
      column,
      this.hot.toPhysicalColumn(column),
      this.hot.countCols(),
      this.hot.countSourceCols(),
      contained
    );
  }

  /**
   * Add a sheet to the shared HyperFormula instance.
   *
   * @param {string|null} [sheetName] The new sheet name. If not provided (or a null is passed), will be
   * auto-generated by HyperFormula.
   * @param {Array} [sheetData] Data passed to the shared HyperFormula instance. Has to be declared as an array of
   * arrays - array of objects is not supported in this scenario.
   * @returns {boolean|string} `false` if the data format is unusable or it is impossible to add a new sheet to the
   * engine, the created sheet name otherwise.
   */
  addSheet(sheetName, sheetData) {
    if (isDefined(sheetData) && !isArrayOfArrays(sheetData)) {
      warn('The provided data should be an array of arrays.');

      return false;
    }

    if (sheetName !== void 0 && sheetName !== null && this.engine.doesSheetExist(sheetName)) {
      warn('Sheet with the provided name already exists.');

      return false;
    }

    try {
      const actualSheetName = this.engine.addSheet(sheetName ?? void 0);

      if (sheetData) {
        this.engine.setSheetContent(this.engine.getSheetId(actualSheetName), sheetData);
      }

      return actualSheetName;

    } catch (e) {
      warn(e.message);

      return false;
    }
  }

  /**
   * Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
   * instance).
   *
   * @param {string} sheetName Sheet name used in the shared HyperFormula instance.
   */
  switchSheet(sheetName) {
    if (!this.engine.doesSheetExist(sheetName)) {
      error(`The sheet named \`${sheetName}\` does not exist, switch aborted.`);

      return;
    }

    this.sheetName = sheetName;

    const serialized = this.engine.getSheetSerialized(this.sheetId);

    if (serialized.length > 0) {
      this.hot.loadData(serialized, `${toUpperCaseFirst(PLUGIN_KEY)}.switchSheet`);
    }
  }

  /**
   * Get the cell type under specified visual coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {number} [sheet] The target sheet id, defaults to the current sheet.
   * @returns {string} Possible values: 'FORMULA' | 'VALUE' | 'ARRAYFORMULA' | 'EMPTY'.
   */
  getCellType(row, column, sheet = this.sheetId) {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (physicalRow !== null && physicalColumn !== null) {
      return this.engine.getCellType({
        sheet,
        row: physicalRow,
        col: physicalColumn
      });

    } else {
      // Should return `EMPTY` when out of bounds (according to the test cases).
      return 'EMPTY';
    }
  }

  /**
   * Returns `true` if under specified visual coordinates is formula.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {number} [sheet] The target sheet id, defaults to the current sheet.
   * @returns {boolean}
   */
  isFormulaCellType(row, column, sheet = this.sheetId) {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (physicalRow === null || physicalColumn === null) {
      return false;
    }

    return this.engine.doesCellHaveFormula({
      sheet,
      row: physicalRow,
      col: physicalColumn
    });
  }

  /**
   * Renders dependent sheets (handsontable instances) based on the changes - list of the
   * recalculated dependent cells.
   *
   * @private
   * @param {object[]} dependentCells The values and location of applied changes within HF engine.
   * @param {boolean} [renderSelf] `true` if it's supposed to render itself, `false` otherwise.
   */
  renderDependentSheets(dependentCells, renderSelf = false) {
    const affectedSheetIds = new Set();

    dependentCells.forEach((change) => {
      // For the Named expression the address is empty, hence the `sheetId` is undefined.
      const sheetId = change?.address?.sheet;

      if (sheetId !== void 0) {
        if (!affectedSheetIds.has(sheetId)) {
          affectedSheetIds.add(sheetId);
        }
      }
    });

    getRegisteredHotInstances(this.engine).forEach((relatedHot, sheetId) => {
      if (
        (renderSelf || (sheetId !== this.sheetId)) &&
        affectedSheetIds.has(sheetId)
      ) {
        relatedHot.render();
        relatedHot.view?.adjustElementsSize();
      }
    });
  }

  /**
   * Validates dependent cells based on the cells that are modified by the change.
   *
   * @private
   * @param {object[]} dependentCells The values and location of applied changes within HF engine.
   * @param {object[]} [changedCells] The values and location of applied changes by developer (through API or UI).
   */
  validateDependentCells(dependentCells, changedCells = []) {
    const stringifyAddress = (change) => {
      const {
        row,
        col,
        sheet
      } = change?.address ?? {};

      return isDefined(sheet) ? `${sheet}:${row}x${col}` : '';
    };
    const changedCellsSet = new Set(changedCells.map(change => stringifyAddress(change)));

    dependentCells.forEach((change) => {
      const { row, col } = change.address ?? {};
      const visualRow = isDefined(row) ? this.hot.toVisualRow(row) : null;
      const visualColumn = isDefined(col) ? this.hot.toVisualColumn(col) : null;

      // Don't try to validate cells outside of the visual part of the table.
      if (visualRow === null || visualColumn === null) {
        return;
      }

      // For the Named expression the address is empty, hence the `sheetId` is undefined.
      const sheetId = change?.address?.sheet;
      const addressId = stringifyAddress(change);

      // Validate the cells that depend on the calculated formulas. Skip that cells
      // where the user directly changes the values - the Core triggers those validators.
      if (sheetId !== void 0 && !changedCellsSet.has(addressId)) {
        const hot = getRegisteredHotInstances(this.engine).get(sheetId);

        // It will just re-render certain cell when necessary.
        hot.validateCell(
          hot.getDataAtCell(visualRow, visualColumn),
          hot.getCellMeta(visualRow, visualColumn),
          () => {}
        );
      }
    });
  }

  /**
   * Sync a change from the change-related hooks with the engine.
   *
   * @private
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {Handsontable.CellValue} newValue New value.
   * @returns {Array} Array of changes exported from the engine.
   */
  syncChangeWithEngine(row, column, newValue) {
    const address = {
      row: this.toPhysicalRowPosition(row),
      col: this.toPhysicalColumnPosition(column),
      sheet: this.sheetId
    };

    if (!this.engine.isItPossibleToSetCellContents(address)) {
      warn(`Not possible to set cell data at ${JSON.stringify(address)}`);

      return;
    }

    return this.engine.setCellContents(address, newValue);
  }

  /**
   * The hook allows to translate the formula value to calculated value before it goes to the
   * validator function.
   *
   * @private
   * @param {*} value The cell value to validate.
   * @param {number} visualRow The visual row index.
   * @param {number|string} prop The visual column index or property name of the column.
   * @returns {*} Returns value to validate.
   */
  onBeforeValidate(value, visualRow, prop) {
    const visualColumn = this.hot.propToCol(prop);

    if (this.isFormulaCellType(visualRow, visualColumn)) {
      const address = {
        row: this.hot.toPhysicalRow(visualRow),
        col: this.hot.toPhysicalColumn(visualColumn),
        sheet: this.sheetId,
      };

      const cellValue = this.engine.getCellValue(address);

      // If `cellValue` is an object it is expected to be an error
      return (typeof cellValue === 'object' && cellValue !== null) ? cellValue.value : cellValue;
    }

    return value;
  }

  /**
   * `onBeforeAutofill` hook callback.
   *
   * @private
   * @param {Array[]} fillData The data that was used to fill the `targetRange`. If `beforeAutofill` was used
   * and returned `[[]]`, this will be the same object that was returned from `beforeAutofill`.
   * @param {CellRange} sourceRange The range values will be filled from.
   * @param {CellRange} targetRange The range new values will be filled into.
   * @returns {boolean|*}
   */
  onBeforeAutofill(fillData, sourceRange, targetRange) {
    const withSheetId = range => ({ ...range, sheet: this.sheetId });

    const engineSourceRange = {
      start: withSheetId(sourceRange.getTopLeftCorner()),
      end: withSheetId(sourceRange.getBottomRightCorner())
    };

    const engineTargetRange = {
      start: withSheetId(targetRange.getTopLeftCorner()),
      end: withSheetId(targetRange.getBottomRightCorner())
    };

    // Blocks the autofill operation if HyperFormula says that at least one of
    // the underlying cell's contents cannot be set.
    if (this.engine.isItPossibleToSetCellContents(engineTargetRange) === false) {
      return false;
    }

    return this.engine.getFillRangeData(engineSourceRange, engineTargetRange);
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} [source] Source of the call.
   * @private
   */
  onBeforeLoadData(sourceData, initialLoad, source = '') {
    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    // This flag needs to be defined, because not passing data to HOT results in HOT auto-generating a `null`-filled
    // initial dataset.
    this.#hotWasInitializedWithEmptyData = isUndefined(this.hot.getSettings().data);
  }

  /**
   * `afterLoadData` hook callback.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} [source] Source of the call.
   * @private
   */
  onAfterLoadData(sourceData, initialLoad, source = '') {
    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    this.sheetName = setupSheet(this.engine, this.hot.getSettings()[PLUGIN_KEY].sheetName);

    if (!this.#hotWasInitializedWithEmptyData) {
      const sourceDataArray = this.hot.getSourceDataArray();

      if (this.engine.isItPossibleToReplaceSheetContent(this.sheetId, sourceDataArray)) {
        this.#internalOperationPending = true;

        const dependentCells = this.engine.setSheetContent(this.sheetId, this.hot.getSourceDataArray());

        this.renderDependentSheets(dependentCells);

        this.#internalOperationPending = false;
      }

    } else {
      this.switchSheet(this.sheetName);
    }
  }

  /**
   * `modifyData` hook callback.
   *
   * @private
   * @param {number} row Physical row height.
   * @param {number} column Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  onModifyData(row, column, valueHolder, ioMode) {
    if (
      ioMode !== 'get' ||
      this.#internalOperationPending ||
      this.sheetName === null ||
      !this.engine.doesSheetExist(this.sheetName)
    ) {
      return;
    }

    const visualRow = this.hot.toVisualRow(row);

    // `column` is here as visual index because of inconsistencies related to hook execution in `src/dataMap`.
    const isFormulaCellType = this.isFormulaCellType(visualRow, column);

    if (!isFormulaCellType) {
      const cellType = this.getCellType(visualRow, column);

      if (cellType !== 'ARRAY') {
        if (isEscapedFormulaExpression(valueHolder.value)) {
          valueHolder.value = unescapeFormulaExpression(valueHolder.value);
        }

        return;
      }
    }

    // `toPhysicalColumn` is here because of inconsistencies related to hook execution in `DataMap`.
    const address = {
      row,
      col: this.toPhysicalColumnPosition(column),
      sheet: this.sheetId
    };
    const cellValue = this.engine.getCellValue(address);

    // If `cellValue` is an object it is expected to be an error
    const value = (typeof cellValue === 'object' && cellValue !== null) ? cellValue.value : cellValue;

    valueHolder.value = value;
  }

  /**
   * `modifySourceData` hook callback.
   *
   * @private
   * @param {number} row Physical row index.
   * @param {number|string} columnOrProp Physical column index or prop.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  onModifySourceData(row, columnOrProp, valueHolder, ioMode) {
    if (
      ioMode !== 'get' ||
      this.#internalOperationPending ||
      this.sheetName === null ||
      !this.engine.doesSheetExist(this.sheetName)
    ) {
      return;
    }

    const visualRow = this.hot.toVisualRow(row);
    const visualColumn = this.hot.propToCol(columnOrProp);

    // `column` is here as visual index because of inconsistencies related to hook execution in `src/dataMap`.
    const isFormulaCellType = this.isFormulaCellType(visualRow, visualColumn);

    if (!isFormulaCellType) {
      const cellType = this.getCellType(visualRow, visualColumn);

      if (cellType !== 'ARRAY') {
        return;
      }
    }

    const dimensions = this.engine.getSheetDimensions(this.engine.getSheetId(this.sheetName));

    // Don't actually change the source data if HyperFormula is not
    // initialized yet. This is done to allow the `afterLoadData` hook to
    // load the existing source data with `Handsontable#getSourceDataArray`
    // properly.
    if (dimensions.width === 0 && dimensions.height === 0) {
      return;
    }

    const address = {
      row,
      // Workaround for inconsistencies in `src/dataSource.js`
      col: this.toPhysicalColumnPosition(visualColumn),
      sheet: this.sheetId
    };

    valueHolder.value = this.engine.getCellSerialized(address);
  }

  /**
   * `onAfterSetDataAtCell` hook callback.
   *
   * @private
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  onAfterSetDataAtCell(changes, source) {
    if (isBlockedSource(source)) {
      return;
    }

    const outOfBoundsChanges = [];
    const changedCells = [];

    const dependentCells = this.engine.batch(() => {
      changes.forEach(([row, prop, , newValue]) => {
        const column = this.hot.propToCol(prop);
        const physicalRow = this.hot.toPhysicalRow(row);
        const physicalColumn = this.hot.toPhysicalColumn(column);
        const address = {
          row: physicalRow,
          col: physicalColumn,
          sheet: this.sheetId,
        };

        if (physicalRow !== null && physicalColumn !== null) {
          this.syncChangeWithEngine(row, column, newValue);

        } else {
          outOfBoundsChanges.push([row, column, newValue]);
        }

        changedCells.push({ address });
      });
    });

    if (outOfBoundsChanges.length) {
      // Workaround for rows/columns being created two times (by HOT and the engine).
      // (unfortunately, this requires an extra re-render)
      this.hot.addHookOnce('afterChange', () => {
        const outOfBoundsDependentCells = this.engine.batch(() => {
          outOfBoundsChanges.forEach(([row, column, newValue]) => {
            this.syncChangeWithEngine(row, column, newValue);
          });
        });

        this.renderDependentSheets(outOfBoundsDependentCells, true);
      });
    }

    this.renderDependentSheets(dependentCells);
    this.validateDependentCells(dependentCells, changedCells);
  }

  /**
   * `onAfterSetSourceDataAtCell` hook callback.
   *
   * @private
   * @param {Array[]} changes An array of changes in format [[row, column, oldValue, value], ...].
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  onAfterSetSourceDataAtCell(changes, source) {
    if (isBlockedSource(source)) {
      return;
    }

    const dependentCells = [];
    const changedCells = [];

    changes.forEach(([row, prop, , newValue]) => {
      const column = this.hot.propToCol(prop);

      if (!isNumeric(column)) {
        return;
      }

      const address = {
        row,
        col: this.toPhysicalColumnPosition(column),
        sheet: this.sheetId
      };

      if (!this.engine.isItPossibleToSetCellContents(address)) {
        warn(`Not possible to set source cell data at ${JSON.stringify(address)}`);

        return;
      }

      changedCells.push({ address });
      dependentCells.push(...this.engine.setCellContents(address, newValue));
    });

    this.renderDependentSheets(dependentCells);
    this.validateDependentCells(dependentCells, changedCells);
  }

  /**
   * `beforeCreateRow` hook callback.
   *
   * @private
   * @param {number} row Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onBeforeCreateRow(row, amount) {
    if (
      this.sheetId === null ||
      !this.engine.doesSheetExist(this.sheetName) ||
      !this.engine.isItPossibleToAddRows(this.sheetId, [this.toPhysicalRowPosition(row), amount])
    ) {
      return false;
    }
  }

  /**
   * `beforeCreateCol` hook callback.
   *
   * @private
   * @param {number} col Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onBeforeCreateCol(col, amount) {
    if (
      this.sheetId === null ||
      !this.engine.doesSheetExist(this.sheetName) ||
      !this.engine.isItPossibleToAddColumns(this.sheetId, [this.toPhysicalColumnPosition(col), amount])
    ) {
      return false;
    }
  }

  /**
   * `beforeRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onBeforeRemoveRow(row, amount, physicalRows) {
    const possible = physicalRows.every((physicalRow) => {
      return this.engine.isItPossibleToRemoveRows(this.sheetId, [physicalRow, 1]);
    });

    return possible === false ? false : void 0;
  }

  /**
   * `beforeRemoveCol` hook callback.
   *
   * @private
   * @param {number} col Visual index of starter column.
   * @param {number} amount Amount of columns to be removed.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onBeforeRemoveCol(col, amount, physicalColumns) {
    const possible = physicalColumns.every((physicalColumn) => {
      return this.engine.isItPossibleToRemoveColumns(this.sheetId, [physicalColumn, 1]);
    });

    return possible === false ? false : void 0;
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {number} row Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  onAfterCreateRow(row, amount, source) {
    if (isBlockedSource(source)) {
      return;
    }

    const changes = this.engine.addRows(this.sheetId, [this.toPhysicalRowPosition(row), amount]);

    this.renderDependentSheets(changes);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {number} col Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  onAfterCreateCol(col, amount, source) {
    if (isBlockedSource(source)) {
      return;
    }

    const changes = this.engine.addColumns(this.sheetId, [this.toPhysicalColumnPosition(col), amount]);

    this.renderDependentSheets(changes);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  onAfterRemoveRow(row, amount, physicalRows, source) {
    if (isBlockedSource(source)) {
      return;
    }

    const descendingPhysicalRows = physicalRows.sort().reverse();

    const changes = this.engine.batch(() => {
      descendingPhysicalRows.forEach((physicalRow) => {
        this.engine.removeRows(this.sheetId, [physicalRow, 1]);
      });
    });

    this.renderDependentSheets(changes);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  onAfterRemoveCol(col, amount, physicalColumns, source) {
    if (isBlockedSource(source)) {
      return;
    }

    const descendingPhysicalColumns = physicalColumns.sort().reverse();

    const changes = this.engine.batch(() => {
      descendingPhysicalColumns.forEach((physicalColumn) => {
        this.engine.removeColumns(this.sheetId, [physicalColumn, 1]);
      });
    });

    this.renderDependentSheets(changes);
  }

  /**
   * `afterDetachChild` hook callback.
   * Used to sync the data of the rows detached in the Nested Rows plugin with the engine's dataset.
   *
   * @private
   * @param {object} parent An object representing the parent from which the element was detached.
   * @param {object} element The detached element.
   * @param {number} finalElementRowIndex The final row index of the detached element.
   */
  onAfterDetachChild(parent, element, finalElementRowIndex) {
    this.#internalOperationPending = true;

    const rowsData = this.hot.getSourceDataArray(
      finalElementRowIndex,
      0,
      finalElementRowIndex + (element.__children?.length || 0),
      this.hot.countSourceCols()
    );

    this.#internalOperationPending = false;

    rowsData.forEach((row, relativeRowIndex) => {
      row.forEach((value, colIndex) => {
        this.engine.setCellContents({
          col: colIndex,
          row: finalElementRowIndex + relativeRowIndex,
          sheet: this.sheetId
        }, [[value]]);
      });
    });
  }

  /**
   * Called when a value is updated in the engine.
   *
   * @private
   * @fires Hooks#afterFormulasValuesUpdate
   * @param {Array} changes The values and location of applied changes.
   */
  onEngineValuesUpdated(changes) {
    this.hot.runHooks('afterFormulasValuesUpdate', changes);
  }

  /**
   * Called when a named expression is added to the engine instance.
   *
   * @private
   * @fires Hooks#afterNamedExpressionAdded
   * @param {string} namedExpressionName The name of the added expression.
   * @param {Array} changes The values and location of applied changes.
   */
  onEngineNamedExpressionsAdded(namedExpressionName, changes) {
    this.hot.runHooks('afterNamedExpressionAdded', namedExpressionName, changes);
  }

  /**
   * Called when a named expression is removed from the engine instance.
   *
   * @private
   * @fires Hooks#afterNamedExpressionRemoved
   * @param {string} namedExpressionName The name of the removed expression.
   * @param {Array} changes The values and location of applied changes.
   */
  onEngineNamedExpressionsRemoved(namedExpressionName, changes) {
    this.hot.runHooks('afterNamedExpressionRemoved', namedExpressionName, changes);
  }

  /**
   * Called when a new sheet is added to the engine instance.
   *
   * @private
   * @fires Hooks#afterSheetAdded
   * @param {string} addedSheetDisplayName The name of the added sheet.
   */
  onEngineSheetAdded(addedSheetDisplayName) {
    this.hot.runHooks('afterSheetAdded', addedSheetDisplayName);
  }

  /**
   * Called when a sheet in the engine instance is renamed.
   *
   * @private
   * @fires Hooks#afterSheetRenamed
   * @param {string} oldDisplayName The old name of the sheet.
   * @param {string} newDisplayName The new name of the sheet.
   */
  onEngineSheetRenamed(oldDisplayName, newDisplayName) {
    this.hot.runHooks('afterSheetRenamed', oldDisplayName, newDisplayName);
  }

  /**
   * Called when a sheet is removed from the engine instance.
   *
   * @private
   * @fires Hooks#afterSheetRemoved
   * @param {string} removedSheetDisplayName The removed sheet name.
   * @param {Array} changes The values and location of applied changes.
   */
  onEngineSheetRemoved(removedSheetDisplayName, changes) {
    this.hot.runHooks('afterSheetRemoved', removedSheetDisplayName, changes);
  }
}
