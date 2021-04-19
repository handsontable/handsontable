// TODO remove hot-formula-parser

import { BasePlugin } from '../base';
import staticRegister from '../../utils/staticRegister';
import { registerHF } from './hyperformulaSetup';
import { error } from '../../helpers/console';
import {
  isDefined,
  isUndefined
} from '../../helpers/mixed';
import hyperformulaDefaultSettings from './hfDefaultSettings';

export const PLUGIN_KEY = 'formulas';
export const PLUGIN_PRIORITY = 260;

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
   * Plugin settings.
   *
   * @private
   */
  #settings = this.hot.getSettings()[PLUGIN_KEY];

  /**
   * Flag used to bypass hooks in internal operations.
   *
   * @private
   * @type {boolean}
   */
  #internal = false;

  /**
   * Flag needed to mark if Handsontable was initialized with no data.
   * (Required to work around the fact, that Handsontable auto-generates sample data, when no data is provided).
   *
   * @type {boolean}
   */
  #emptyData = false;

  /**
   * Static register used to set up one global HyperFormula instance.
   * TODO: currently used in tests, might be removed later.
   *
   * @private
   * @type {object}
   */
  staticRegister = staticRegister('formulas');

  /**
   * The HyperFormula instance that will be used for this instance of Handsontable.
   *
   * @type {HyperFormula}
   */
  hyperformula = null;

  /**
   * HyperFormula's sheet name.
   *
   * @type {string}
   */
  sheetName = null;

  /**
   * HyperFormula's sheet id.
   *
   * @type {number}
   */
  sheetId = null;

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

    this.addHook('beforeLoadData', (...args) => this.onBeforeLoadData(...args));
    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args));

    // TODO test if the `before` hook will actually block operations
    this.addHook('beforeCreateRow', (...args) => this.onBeforeCreateRow(...args));
    this.addHook('beforeCreateCol', (...args) => this.onBeforeCreateCol(...args));

    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));

    this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    this.addHook('beforeRemoveCol', (...args) => this.onBeforeRemoveCol(...args));

    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));

    // Autofill hooks
    {
      // Scoped into this block instead of being on the whole class to prevent
      // other places from messing with it.
      const lastAutofillSource = { value: undefined };

      // Abuse the `modifyAutofillRange` hook to get the autofill start coordinates.
      this.addHook('modifyAutofillRange', (_, entireArea) => {
        const [startRow, startCol, endRow, endCol] = entireArea;

        lastAutofillSource.value = {
          start: {
            row: startRow,
            col: startCol
          },
          end: {
            row: endRow,
            col: endCol
          }
        };
      });

      // Abuse this hook to easily figure out the direction of the autofill
      this.addHook('beforeAutofillInsidePopulate', (index, direction, _input, _deltas, _, selected) => {
        const autofillTargetSize = {
          width: selected.col,
          height: selected.row
        };

        const autofillSourceSize = {
          width: Math.abs(lastAutofillSource.value.start.col - lastAutofillSource.value.end.col) + 1,
          height: Math.abs(lastAutofillSource.value.start.row - lastAutofillSource.value.end.row) + 1
        };

        const paste = (
          // The cell we're copy'ing to let HyperFormula adjust the references properly
          sourceCellCoordinates,

          // The cell we're pasting into
          targetCellCoordinates
        ) => {
          this.hyperformula.copy({
            sheet: this.hyperformula.getSheetId(this.sheetName),
            row: sourceCellCoordinates.row,
            col: sourceCellCoordinates.col
          }, 1, 1);

          const [{ address }] = this.hyperformula.paste({
            sheet: this.hyperformula.getSheetId(this.sheetName),
            row: targetCellCoordinates.row,
            col: targetCellCoordinates.col
          });

          const value = this.hyperformula.getCellSerialized(address);

          return { value };
        };

        // Pretty much reimplements the logic from `src/plugins/autofill/autofill.js#fillIn`
        switch (direction) {
          case 'right': {
            const targetCellCoordinates = {
              row: lastAutofillSource.value.start.row + index.row,
              col: lastAutofillSource.value.start.col + index.col + autofillSourceSize.width
            };

            const sourceCellCoordinates = {
              row: lastAutofillSource.value.start.row + index.row,
              col: (index.col % autofillSourceSize.width) + lastAutofillSource.value.start.col
            };

            return paste(sourceCellCoordinates, targetCellCoordinates);
          }

          case 'left': {
            const targetCellCoordinates = {
              row: lastAutofillSource.value.start.row + index.row,
              col: lastAutofillSource.value.start.col + index.col - autofillTargetSize.width
            };

            const fillOffset = autofillTargetSize.width % autofillSourceSize.width;

            const sourceCellCoordinates = {
              row: lastAutofillSource.value.start.row + index.row,
              col:
                ((autofillSourceSize.width - fillOffset + index.col) %
                  autofillSourceSize.width) +
                lastAutofillSource.value.start.col,
            };

            return paste(sourceCellCoordinates, targetCellCoordinates);
          }

          case 'down': {
            const targetCellCoordinates = {
              row: lastAutofillSource.value.start.row + index.row + autofillSourceSize.height,
              col: lastAutofillSource.value.start.col + index.col
            };

            const sourceCellCoordinates = {
              row: (index.row % autofillSourceSize.height) + lastAutofillSource.value.start.row,
              col: lastAutofillSource.value.start.col + index.col
            };

            return paste(sourceCellCoordinates, targetCellCoordinates);
          }

          case 'up': {
            const targetCellCoordinates = {
              row: lastAutofillSource.value.start.row + index.row - autofillTargetSize.height,
              col: lastAutofillSource.value.start.col + index.col
            };

            const fillOffset = autofillTargetSize.height % autofillSourceSize.height;

            const sourceCellCoordinates = {
              row:
                ((autofillSourceSize.height - fillOffset + index.row) %
                  autofillSourceSize.height) +
                lastAutofillSource.value.start.row,
              col: lastAutofillSource.value.start.col + index.col,
            };

            return paste(sourceCellCoordinates, targetCellCoordinates);
          }

          default: {
            throw new Error('Unexpected direction parameter');
          }
        }
      });
    }

    const hfSetUpProperly = this.setupHF();

    if (!hfSetUpProperly) {
      return;
    }

    // HyperFormula events:
    this.hyperformula.on('valuesUpdated', (...args) => this.onHFvaluesUpdated(...args));

    this.applyHFSettings();

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
    this.#settings = this.hot.getSettings()[PLUGIN_KEY];

    this.applyHFSettings();

    if (isDefined(this.#settings.sheetName) && this.#settings.sheetName !== this.sheetName) {
      this.switchSheet(this.#settings.sheetName);
    }

    super.updatePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    if (!this.hyperformula) {
      return;
    }

    const hfInstances = staticRegister('formulas').getItem('hyperformulaInstances');
    const sharedHFInstanceUsage = hfInstances ? hfInstances.get(this.hyperformula) : null;

    if (sharedHFInstanceUsage && sharedHFInstanceUsage.includes(this.hot.guid)) {
      sharedHFInstanceUsage.splice(
        sharedHFInstanceUsage.indexOf(this.hot.guid),
        1
      );

      if (sharedHFInstanceUsage.length === 0) {
        hfInstances.delete(this.hyperformula);
        this.hyperformula.destroy();
      }
    }

    super.destroy();
  }

  /**
   * Add a sheet to the shared HyperFormula instance.
   *
   * @param {Array} sheetData Data passed to the shared HyperFormula instance. Has to be declared as an array of
   * arrays - array of objects is not supported in this scenario.
   * @param {string} [sheetName] The new sheet name. If not provided, will be auto-generated by HyperFormula.
   * @param {boolean} [autoLoad] If `true`, the new sheet will be loaded into the Handsontable instance.
   * @returns {boolean} `false` if the data format is unusable, `true` otherwise.
   */
  addSheet(sheetData, sheetName, autoLoad) {
    if (
      !sheetData ||
      !Array.isArray(sheetData) ||
      (sheetData.length && !Array.isArray(sheetData[0]))
    ) {
      error('The provided data should be an array of arrays.');
      return false;
    }

    const actualSheetName = this.hyperformula.addSheet(sheetName ?? void 0);
    this.hyperformula.setSheetContent(actualSheetName, sheetData);

    if (autoLoad) {
      this.switchSheet(actualSheetName);
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
    this.sheetName = sheetName;
    this.sheetId = this.hyperformula.getSheetId(this.sheetName);

    this.#internal = true;
    this.hot.loadData(this.hyperformula.getSheetSerialized(this.sheetId));
    this.#internal = false;
  }

  /**
   * Setup the HyperFormula instance. It either creates a new (possibly shared) HyperFormula instance, or attaches
   * the plugin to an already-existing instance.
   *
   * @private
   * @returns {boolean} `true` if HyperFormula was set up properly, `false` otherwise.
   */
  setupHF() {
    const settingsHF = this.#settings.hyperformula;

    if (isUndefined(settingsHF)) {
      error('Missing the required `hyperformula` key in the Formulas settings. Please fill it with either a' +
        ' HyperFormula class or a HyperFormula instance.');

      this.disablePlugin();
      return false;
    }

    switch (typeof settingsHF) {
      // There was a HyperFormula class passed.
      case 'function': {
        this.hyperformula = registerHF(this.#settings, this.hot.guid);
        break;
      }
      // There was a HyperFormula instance passed.
      case 'object': {
        const hfInstances = staticRegister('formulas').getItem('hyperformulaInstances');
        const sharedHFInstanceUsage = hfInstances ? hfInstances.get(settingsHF) : null;

        this.hyperformula = settingsHF;

        if (sharedHFInstanceUsage) {
          sharedHFInstanceUsage.push(this.hot.guid);
        }

        break;
      }
      default:
    }

    return true;
  }

  /**
   * Applies the settings passed to the plugin to the HF instance.
   *
   * @private
   */
  applyHFSettings() {
    const hotSettings = this.hot.getSettings();
    const hfConfig = this.#settings.hyperformulaConfig;

    this.hyperformula.updateConfig({
      ...hyperformulaDefaultSettings,
      ...(hfConfig || {}),
      maxColumns: hotSettings.maxColumns,
      maxRows: hotSettings.maxRows,
      language: this.#settings.language?.code
    });
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * @private
   */
  onBeforeLoadData() {
    if (this.#internal) {
      return;
    }

    // This flag needs to be defined, because not passing data to HOT results in HOT auto-generating a `null`-filled
    // initial dataset.
    this.#emptyData = isUndefined(this.hot.getSettings().data);
  }

  /**
   * `afterLoadData` hook callback.
   *
   * @private
   */
  onAfterLoadData() {
    if (!this.enabled || this.#internal) {
      return;
    }

    const sheetName = this.#settings.sheetName;

    if (
      isUndefined(sheetName) ||
      (isDefined(sheetName) && !this.hyperformula.doesSheetExist(sheetName))
    ) {
      this.sheetName = this.hyperformula.addSheet(sheetName);

    } else if (isDefined(sheetName)) {
      this.sheetName = sheetName;
    }

    this.sheetId = this.hyperformula.getSheetId(this.sheetName);

    this.#internal = true;
    if (!this.#emptyData) {
      this.hyperformula.setSheetContent(this.sheetName, this.hot.getSourceDataArray());

    } else {
      this.switchSheet(this.sheetName);
    }
    this.#internal = false;
  }

  /**
   * `modifyData` hook callback.
   *
   * @private
   * @param {number} row Physical row height.
   * @param {number} column Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value` property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  onModifyData(row, column, valueHolder, ioMode) {
    if (!this.enabled || this.#internal) {
      // TODO check if this line is actually ever reached
      return;
    }

    const address = {
      row: this.hot.toVisualRow(row),
      col: column,
      sheet: this.hyperformula.getSheetId(this.sheetName)
    };

    if (ioMode === 'get') {
      const cellValue = this.hyperformula.getCellValue(address);

      // If `cellValue` is an object it is expected to be an error
      const value = (typeof cellValue === 'object' && cellValue !== null) ? cellValue.value : cellValue;

      // Omit the leading `'` from presentation, and all `getData` operations
      const prettyValue = (() => {
        if (typeof value === 'string') {
          return value.indexOf('\'') === 0 ? value.slice(1) : value;
        }

        return value;
      })();

      valueHolder.value = prettyValue;
    } else {
      this.hyperformula.setCellContents(address, valueHolder.value);
    }
  }

  /**
   * `modifySourceData` hook callback.
   *
   * @private
   * @param {number} row Physical row index.
   * @param {number} col Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value` property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  onModifySourceData(row, col, valueHolder, ioMode) {
    if (!this.enabled || this.#internal) {
      return;
    }

    const dimensions = this.hyperformula.getSheetDimensions(this.hyperformula.getSheetId(this.sheetName));

    // Don't actually change the source data if HyperFormula is not
    // initialized yet. This is done to allow the `afterLoadData` hook to
    // load the existing source data with `Handsontable#getSourceDataArray`
    // properly.
    if (dimensions.width === 0 && dimensions.height === 0) {
      return;
    }

    const address = {
      row: this.hot.toVisualRow(row),
      col,
      sheet: this.hyperformula.getSheetId(this.sheetName)
    };

    if (ioMode === 'get') {
      valueHolder.value = this.hyperformula.getCellSerialized(address);
    } else if (ioMode === 'set') {
      this.hyperformula.setCellContents(address, valueHolder.value);
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
    if (!this.hyperformula.isItPossibleToAddRows(this.sheetId, [row, amount])) {
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
    if (!this.hyperformula.isItPossibleToAddColumns(this.sheetId, [col, amount])) {
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
    if (!this.hyperformula.isItPossibleToRemoveRows(this.sheetId, [row, amount])) {
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
    if (!this.hyperformula.isItPossibleToRemoveRows(this.sheetId, [col, amount])) {
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
    this.hyperformula.addRows(this.sheetId, [row, amount]);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {number} col Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   */
  onAfterCreateCol(col, amount) {
    this.hyperformula.addColumns(this.sheetId, [col, amount]);
  }

  /**
   * `beforeRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  onAfterRemoveRow(row, amount) {
    this.hyperformula.removeRows(this.sheetId, [row, amount]);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   */
  onAfterRemoveCol(col, amount) {
    this.hyperformula.removeColumns(this.sheetId, [col, amount]);
  }

  /**
   * HyperFormula's `valuesUpdated` event callback.
   *
   * @param {Array} changes Array of objects containing information about HF changes.
   */
  onHFvaluesUpdated(changes) {
    let isAffectedByChange = false;

    changes.some((change) => {
      isAffectedByChange = change?.address?.sheet === this.sheetId;

      return isAffectedByChange;
    });

    if (isAffectedByChange) {
      this.hot.render();
    }
  }
}
