import { BasePlugin } from '../base';
import { createAutofillHooks } from './autofill';
import staticRegister from '../../utils/staticRegister';
import { error, warn } from '../../helpers/console';
import {
  isDefined,
  isUndefined
} from '../../helpers/mixed';
import {
  setupEngine,
  unregisterEngine
} from './engine/register';
import { getEngineSettingsWithOverrides } from './engine/settings';
import { isArrayOfArrays } from '../../helpers/data';
import { toUpperCaseFirst } from '../../helpers/string';
import Hooks from '../../pluginHooks';

export const PLUGIN_KEY = 'formulas';
export const PLUGIN_PRIORITY = 260;

/**
 * Check if provided expression is valid formula expression.
 *
 * @param {*} expression Expression to check.
 * @returns {boolean}
 */
function isFormulaExpression(expression) {
  return typeof expression === 'string' && expression.length >= 2 && expression.charAt(0) === '=';
}

Hooks.getSingleton().register('afterNamedExpressionAdded');
Hooks.getSingleton().register('afterNamedExpressionRemoved');
Hooks.getSingleton().register('afterSheetAdded');
Hooks.getSingleton().register('afterSheetRemoved');
Hooks.getSingleton().register('afterSheetRenamed');
Hooks.getSingleton().register('afterFormulasValuesUpdate');

/**
 * The formulas plugin.
 *
 * @plugin Formulas
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
   * Flag used to prevent unnecessary renders during updates within the same Handsontable
   * instance, which the listener to the `valuesUpdated` hook would otherwise cause.
   *
   * @private
   * @type {boolean}
   */
  #shouldSuspendRenders = false;

  /**
   * Flag needed to mark if Handsontable was initialized with no data.
   * (Required to work around the fact, that Handsontable auto-generates sample data, when no data is provided).
   *
   * @type {boolean}
   */
  #hotWasInitializedWithEmptyData = false;

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
   * @type {HyperFormula|object}
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

    this.engine = setupEngine(this.hot.getSettings(), this.hot.guid);

    if (!this.engine) {
      return;
    }

    this.addHook('beforeLoadData', (...args) => this.onBeforeLoadData(...args));
    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args));
    this.addHook('beforeValidate', (...args) => this.onBeforeValidate(...args));

    this.addHook('beforeCreateRow', (...args) => this.onBeforeCreateRow(...args));
    this.addHook('beforeCreateCol', (...args) => this.onBeforeCreateCol(...args));

    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));

    this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    this.addHook('beforeRemoveCol', (...args) => this.onBeforeRemoveCol(...args));

    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));

    const autofillHooks = createAutofillHooks(this);

    this.addHook('beforeAutofill', autofillHooks.beforeAutofill);
    this.addHook('afterAutofill', autofillHooks.afterAutofill);

    // HyperFormula events:
    this.engine.on('valuesUpdated', (...args) => this.onEngineValuesUpdated(...args));
    this.engine.on('namedExpressionAdded', (...args) => this.onEngineNamedExpressionsAdded(...args));
    this.engine.on('namedExpressionRemoved', (...args) => this.onEngineNamedExpressionsRemoved(...args));
    this.engine.on('sheetAdded', (...args) => this.onEngineSheetAdded(...args));
    this.engine.on('sheetRenamed', (...args) => this.onEngineSheetRenamed(...args));
    this.engine.on('sheetRemoved', (...args) => this.onEngineSheetRemoved(...args));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Triggered on `updateSettings`.
   */
  updatePlugin() {
    this.engine.updateConfig(getEngineSettingsWithOverrides(this.hot.getSettings()));

    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (
      isDefined(pluginSettings) &&
      isDefined(pluginSettings.sheetName) &&
      pluginSettings.sheetName !== this.sheetName
    ) {
      this.switchSheet(pluginSettings.sheetName);
    }

    super.updatePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    unregisterEngine(this.engine, this.hot.guid);

    super.destroy();
  }

  /**
   * Add a sheet to the shared HyperFormula instance.
   *
   * @param {string} [sheetName] The new sheet name. If not provided, will be auto-generated by HyperFormula.
   * @param {Array} sheetData Data passed to the shared HyperFormula instance. Has to be declared as an array of
   * arrays - array of objects is not supported in this scenario.
   * @returns {boolean} `false` if the data format is unusable or it is impossible to add a new sheet to the engine,
   * `true` otherwise.
   */
  addSheet(sheetName, sheetData) {
    if (!isArrayOfArrays(sheetData)) {
      warn('The provided data should be an array of arrays.');

      return false;
    }

    if (this.engine.doesSheetExist(sheetName)) {
      warn('Sheet with the provided name already exists.');

      return false;
    }

    try {
      const actualSheetName = this.engine.addSheet(sheetName ?? void 0);

      this.engine.setSheetContent(actualSheetName, sheetData);

    } catch (e) {
      warn(e.message);

      return false;
    }

    return true;
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

    this.hot.loadData(this.engine.getSheetSerialized(this.sheetId), `${toUpperCaseFirst(PLUGIN_KEY)}.switchSheet`);
  }

  /**
   * Get the cell type under specified coordinates.
   *
   * @param {number} row Target row.
   * @param {number} col Target column.
   * @param {number} [sheet] The target sheet id, defaults to the current sheet.
   *
   * @returns {string} Possible values: 'FORMULA' | 'VALUE' | 'MATRIX' | 'EMPTY'.
   */
  getCellType(row, col, sheet = this.sheetId) {
    return this.engine.getCellType({
      sheet,
      row,
      col
    });
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} source Source of the call.
   * @private
   */
  onBeforeLoadData(sourceData, initialLoad, source) {
    if ((source || '').includes(toUpperCaseFirst(PLUGIN_KEY))) {
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
   * @param {string} source Source of the call.
   * @private
   */
  onAfterLoadData(sourceData, initialLoad, source) {
    if ((source || '').includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    const sheetName = this.hot.getSettings()[PLUGIN_KEY].sheetName;

    if (isDefined(sheetName) && this.engine.doesSheetExist(sheetName)) {
      this.sheetName = sheetName;

    } else {
      this.sheetName = this.engine.addSheet(sheetName);
    }

    if (!this.#hotWasInitializedWithEmptyData) {
      const sourceDataArray = this.hot.getSourceDataArray();

      if (this.engine.isItPossibleToReplaceSheetContent(this.sheetName, sourceDataArray)) {
        this.#internalOperationPending = true;

        this.engine.setSheetContent(this.sheetName, this.hot.getSourceDataArray());

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
    if (!this.enabled || this.#internalOperationPending) {
      // TODO check if this line is actually ever reached
      return;
    }

    const address = {
      row: this.hot.toVisualRow(row),
      col: column,
      sheet: this.sheetId
    };

    if (ioMode === 'get') {
      const cellValue = this.engine.getCellValue(address);

      // If `cellValue` is an object it is expected to be an error
      const value = (typeof cellValue === 'object' && cellValue !== null) ? cellValue.value : cellValue;

      valueHolder.value = value;
    } else {
      if (
        !this.engine.isItPossibleToSetCellContents(address)
      ) {
        warn(`Not possible to set cell data at ${JSON.stringify(address)}`);

        return;
      }

      this.#shouldSuspendRenders = true;
      this.engine.setCellContents(address, valueHolder.value);
      this.validateCell(address);
      this.#shouldSuspendRenders = false;
    }
  }

  /**
   * `modifySourceData` hook callback.
   *
   * @private
   * @param {number} row Physical row index.
   * @param {number} col Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  onModifySourceData(row, col, valueHolder, ioMode) {
    if (!this.enabled || this.#internalOperationPending) {
      return;
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
      row: this.hot.toVisualRow(row),
      col: this.hot.propToCol(col),
      sheet: this.sheetId
    };

    if (ioMode === 'get') {
      valueHolder.value = this.engine.getCellSerialized(address);
    } else if (ioMode === 'set') {
      if (
        !this.engine.isItPossibleToSetCellContents(address)
      ) {
        warn(`Not possible to set source cell data at ${JSON.stringify(address)}`);

        return;
      }

      this.engine.setCellContents(address, valueHolder.value);
    }
  }

  /**
   * On before validate listener.
   *
   * @private
   * @param {*} value Value to validate.
   * @returns {*}
   */
  onBeforeValidate(value) {
    // We check whether there is "formula-like" value.
    if (isFormulaExpression(value)) {
      try {
        return this.engine.calculateFormula(value, this.sheetName);

      } catch (notAFormulaError) {
        return '#ERROR!'; // TODO: Workaround. It's not translated.
      }
    }
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
    if (!this.engine.isItPossibleToAddRows(this.sheetId, [row, amount])) {
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
    if (!this.engine.isItPossibleToAddColumns(this.sheetId, [col, amount])) {
      return false;
    }
  }

  /**
   * `beforeRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onBeforeRemoveRow(row, amount) {
    if (!this.engine.isItPossibleToRemoveRows(this.sheetId, [row, amount])) {
      return false;
    }
  }

  /**
   * `beforeRemoveCol` hook callback.
   *
   * @private
   * @param {number} col Visual index of starter column.
   * @param {number} amount Amount of columns to be removed.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onBeforeRemoveCol(col, amount) {
    if (!this.engine.isItPossibleToRemoveColumns(this.sheetId, [col, amount])) {
      return false;
    }
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {number} row Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   */
  onAfterCreateRow(row, amount) {
    this.engine.addRows(this.sheetId, [row, amount]);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {number} col Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   */
  onAfterCreateCol(col, amount) {
    this.engine.addColumns(this.sheetId, [col, amount]);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   */
  onAfterRemoveRow(row, amount) {
    this.engine.removeRows(this.sheetId, [row, amount]);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   */
  onAfterRemoveCol(col, amount) {
    this.engine.removeColumns(this.sheetId, [col, amount]);
  }

  /**
   * Called when a value is updated in the engine.
   *
   * @private
   * @fires Hooks#afterFormulasValuesUpdate
   * @param {Array} changes The values and location of applied changes.
   */
  onEngineValuesUpdated(changes) {
    changes.forEach((change) => {
      // It will just re-render certain cell when necessary.
      this.validateCell(change.address);
    });

    if (!this.#shouldSuspendRenders) {
      const isAffectedByChange = changes.some(change => change?.address?.sheet === this.sheetId);

      if (isAffectedByChange) {
        this.hot.render();
      }
    }

    this.hot.runHooks('afterFormulasValuesUpdate', changes);
  }

  /**
   * Validate cell with certain address.
   *
   * @private
   * @param {undefined|SimpleCellAddress} cellAddress Cell coordinates.
   */
  validateCell(cellAddress) {
    // Named expression won't have address.
    if (isUndefined(cellAddress)) {
      return;
    }

    if (cellAddress.sheet !== this.sheetId) {
      return;
    }

    const { row, col } = cellAddress;

    this.hot.validateCell(this.hot.getDataAtCell(row, col), this.hot.getCellMeta(row, col), () => {});
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
