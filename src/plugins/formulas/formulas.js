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
  setupSheet,
  unregisterEngine,
  getRegisteredHotInstances,
} from './engine/register';
import { getEngineSettingsWithOverrides } from './engine/settings';
import { isArrayOfArrays } from '../../helpers/data';
import { toUpperCaseFirst } from '../../helpers/string';
import Hooks from '../../pluginHooks';

export const PLUGIN_KEY = 'formulas';
export const PLUGIN_PRIORITY = 260;

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

    this.engine = setupEngine(this.hot) ?? this.engine;

    if (!this.engine) {
      warn('Missing the required `engine` key in the Formulas settings. Please fill it with either an' +
        ' engine class or an engine instance.');

      return;
    }

    // Useful for disabling -> enabling the plugin using `updateSettings` or the API.
    if (this.sheetName !== null && !this.engine.doesSheetExist(this.sheetName)) {
      this.sheetName = this.addSheet(this.sheetName, this.hot.getSourceDataArray());
    }

    this.addHook('beforeLoadData', (...args) => this.onBeforeLoadData(...args));
    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args));
    this.addHook('afterSetSourceDataAtCell', (...args) => this.onAfterSetSourceDataAtCell(...args));
    this.addHook('beforeChange', (...args) => this.onBeforeChange(...args));
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
    unregisterEngine(this.engine, this.hot);

    super.destroy();
  }

  /**
   * Add a sheet to the shared HyperFormula instance.
   *
   * @param {string} [sheetName] The new sheet name. If not provided, will be auto-generated by HyperFormula.
   * @param {Array} sheetData Data passed to the shared HyperFormula instance. Has to be declared as an array of
   * arrays - array of objects is not supported in this scenario.
   * @returns {boolean|string} `false` if the data format is unusable or it is impossible to add a new sheet to the
   * engine, the created sheet name otherwise.
   */
  addSheet(sheetName, sheetData) {
    if (!isArrayOfArrays(sheetData)) {
      warn('The provided data should be an array of arrays.');

      return false;
    }

    if (isDefined(sheetName) && this.engine.doesSheetExist(sheetName)) {
      warn('Sheet with the provided name already exists.');

      return false;
    }

    try {
      const actualSheetName = this.engine.addSheet(sheetName ?? void 0);

      this.engine.setSheetContent(actualSheetName, sheetData);

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
   * Renders dependent sheets (handsontable instances) based on the changes - list of the
   * recalculated dependent cells.
   *
   * @private
   * @param {object[]} changedCells The values and location of applied changes within HF engine.
   */
  renderDependentSheets(changedCells) {
    const affectedSheetIds = new Set();

    changedCells.forEach((change) => {
      // For the Named expression the address is empty, hence the `sheetId` is undefined.
      const sheetId = change?.address?.sheet;

      if (sheetId !== void 0) {
        if (!affectedSheetIds.has(sheetId)) {
          affectedSheetIds.add(sheetId);
        }

        if (sheetId === this.sheetId) {
          const { row, col } = change.address;

          // It will just re-render certain cell when necessary.
          this.hot.validateCell(this.hot.getDataAtCell(row, col), this.hot.getCellMeta(row, col), () => {});
        }
      }
    });

    const hotInstances = new Map(
      getRegisteredHotInstances(this.engine)
        .map(hot => [hot.getPlugin('formulas').sheetId, hot])
    );

    affectedSheetIds.forEach((sheetId) => {
      if (sheetId !== this.sheetId) {
        const hot = hotInstances.get(sheetId);

        hot.render();
        hot.view?.adjustElementsSize();
      }
    });
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
    const address = {
      row: this.hot.toPhysicalRow(visualRow),
      col: this.hot.toPhysicalColumn(this.hot.propToCol(prop)),
      sheet: this.sheetId,
    };

    return this.engine.getCellValue(address);
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

      if (this.engine.isItPossibleToReplaceSheetContent(this.sheetName, sourceDataArray)) {
        this.#internalOperationPending = true;

        const dependentCells = this.engine.setSheetContent(this.sheetName, this.hot.getSourceDataArray());

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

    // `toPhysicalColumn` is here because of inconsistencies related to hook execution in `src/dataMap`.
    const address = {
      row,
      col: this.hot.toPhysicalColumn(column),
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
   * @param {number} column Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  onModifySourceData(row, column, valueHolder, ioMode) {
    if (
      ioMode !== 'get' ||
      this.#internalOperationPending ||
      this.sheetName === null ||
      !this.engine.doesSheetExist(this.sheetName)
    ) {
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
      row,
      // Workaround for inconsistencies in `src/dataSource.js`
      col: this.hot.toPhysicalColumn(this.hot.propToCol(column)),
      sheet: this.sheetId
    };

    valueHolder.value = this.engine.getCellSerialized(address);
  }

  /**
   * `onBeforeChange` hook callback.
   *
   * @private
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   */
  onBeforeChange(changes) {
    const dependentCells = [];

    changes.forEach(([row, prop,, newValue]) => {
      const address = {
        row: this.hot.toPhysicalRow(row),
        col: this.hot.toPhysicalColumn(this.hot.propToCol(prop)),
        sheet: this.sheetId
      };

      if (!this.engine.isItPossibleToSetCellContents(address)) {
        warn(`Not possible to set cell data at ${JSON.stringify(address)}`);

        return;
      }

      dependentCells.push(...this.engine.setCellContents(address, newValue));
    });

    this.renderDependentSheets(dependentCells);
  }

  /**
   * `onAfterSetSourceDataAtCell` hook callback.
   *
   * @private
   * @param {Array[]} changes An array of changes in format [[row, column, oldValue, value], ...].
   */
  onAfterSetSourceDataAtCell(changes) {
    const dependentCells = [];

    changes.forEach(([row, column,, newValue]) => {
      const address = {
        row,
        col: this.hot.toPhysicalColumn(column),
        sheet: this.sheetId
      };

      if (!this.engine.isItPossibleToSetCellContents(address)) {
        warn(`Not possible to set source cell data at ${JSON.stringify(address)}`);

        return;
      }

      dependentCells.push(...this.engine.setCellContents(address, newValue));
    });

    this.renderDependentSheets(dependentCells);
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
    const changes = this.engine.addRows(this.sheetId, [row, amount]);

    this.renderDependentSheets(changes);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {number} col Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   */
  onAfterCreateCol(col, amount) {
    const changes = this.engine.addColumns(this.sheetId, [col, amount]);

    this.renderDependentSheets(changes);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   */
  onAfterRemoveRow(row, amount) {
    const changes = this.engine.removeRows(this.sheetId, [row, amount]);

    this.renderDependentSheets(changes);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   */
  onAfterRemoveCol(col, amount) {
    const changes = this.engine.removeColumns(this.sheetId, [col, amount]);

    this.renderDependentSheets(changes);
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
