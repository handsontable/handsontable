import { BasePlugin } from '../base';
import { staticRegister } from '../../utils/staticRegister';
import { error, warn } from '../../helpers/console';
import { isNumeric } from '../../helpers/number';
import { isObject } from '../../helpers/object';
import { isDefined, isUndefined } from '../../helpers/mixed';
import { getRegisteredHotInstances, setupEngine, setupSheet, unregisterEngine, } from './engine/register';
import {
  getDateFromExcelDate,
  getDateInHfFormat,
  getDateInHotFormat,
  getTimeFromHfTimeFraction,
  isDate,
  isDateValid,
  isFormula,
  normalizeValueForFormulaEngine,
  unescapeFormulaExpression,
} from './utils';
import { getEngineSettingsWithOverrides, haveEngineSettingsChanged } from './engine/settings';
import { isArrayOfArrays } from '../../helpers/data';
import { toUpperCaseFirst } from '../../helpers/string';
import { getValueGetterValue } from '../../utils/valueAccessors';
import { Hooks } from '../../core/hooks';
import IndexSyncer from './indexSyncer';
import type AxisSyncer from './indexSyncer/axisSyncer';
import type { HyperFormulaEngine } from './engine/types';
import type { CellChange } from '../../settings';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';

/**
 * Represents a cell change from the HyperFormula engine.
 */
interface HFCellChange {
  address?: {
    sheet?: number;
    row?: number;
    col?: number;
  };
  newValue?: unknown;
}

/**
 * Narrow an arbitrary value to a HyperFormula cell change shape.
 *
 * @param {unknown} value Value to check.
 * @returns {boolean} `true` if the value matches the cell change shape.
 */
function isHFCellChange(value: unknown): value is HFCellChange {
  return typeof value === 'object' && value !== null;
}

/**
 * The expected shape of the `formulas` plugin settings object (the non-boolean form).
 */
interface FormulasPluginSettings {
  sheetName?: string;
  engine: unknown;
}

/**
 * Narrow the raw `formulas` setting value to the object form.
 *
 * @param {unknown} value Raw setting value.
 * @returns {boolean} `true` when the value is a settings object.
 */
function isFormulasSettingsObject(value: unknown): value is FormulasPluginSettings {
  return typeof value === 'object' && value !== null;
}

/**
 * Narrow a value to an object with a `value` property.
 *
 * @param {unknown} candidate Value to check.
 * @returns {boolean} `true` when the value is an object exposing a `value` property.
 */
function hasValueProperty(candidate: unknown): candidate is { value: unknown } {
  return typeof candidate === 'object' && candidate !== null && 'value' in candidate;
}

export const PLUGIN_KEY = 'formulas';
export const SETTING_KEYS = ['maxRows', 'maxColumns', 'language'];
export const PLUGIN_PRIORITY = 260;

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
const isBlockedSource = (source: unknown) =>
  source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';

/**
 * This plugin allows you to perform Excel-like calculations in your business applications. It does it by an
 * integration with our other product, [HyperFormula](https://github.com/handsontable/hyperformula/), which is a
 * powerful calculation engine with an extensive number of features.
 *
 * To test out HyperFormula, see [this guide](@/guides/formulas/formula-calculation/formula-calculation.md#available-functions).
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

  static get SETTING_KEYS() {
    return [
      PLUGIN_KEY,
      ...SETTING_KEYS
    ];
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
   * Maps a HyperFormula `ExportedCellChange` to the same change with `newValue` translated to a
   * Handsontable-formatted string when the target cell is of type `date` or `time`. For other cells
   * (or non-numeric values, or named expressions, or trimmed cells, or cells on other sheets), the
   * original change is returned unchanged.
   *
   * @param {object} change The HyperFormula exported change.
   * @returns {object}
   */
  #exportChangeValue(
    change: { address?: { sheet: number; row: number; col: number }; newValue: unknown }
  ): { address?: { sheet: number; row: number; col: number }; newValue: unknown } {
    if (!change.address || change.address.sheet !== this.sheetId || typeof change.newValue !== 'number') {
      return change;
    }

    const visualRow = this.rowAxisSyncer!.getVisualIndexFromHfIndex(change.address.row);
    const visualColumn = this.columnAxisSyncer!.getVisualIndexFromHfIndex(change.address.col);

    if (visualRow < 0 || visualColumn < 0) {
      return change;
    }

    const cellMeta = this.hot.getCellMeta(visualRow, visualColumn, { skipMetaExtension: true });
    let newValue: unknown;

    if (cellMeta.type === 'date') {
      newValue = getDateFromExcelDate(change.newValue);
    } else if (cellMeta.type === 'time') {
      newValue = getTimeFromHfTimeFraction(change.newValue);
    } else {
      return change;
    }

    type ExportedChange = { address?: { sheet: number; row: number; col: number }; newValue: unknown };
    const clone = Object.assign(Object.create(Object.getPrototypeOf(change)), change) as ExportedChange;

    clone.newValue = newValue;

    return clone;
  }

  /**
   * Called when a value is updated in the engine.
   *
   * @fires Hooks#afterFormulasValuesUpdate
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineValuesUpdated = (changes: unknown[]) => {
    const exportedChanges = changes.map(change => this.#exportChangeValue(
      change as { address?: { sheet: number; row: number; col: number }; newValue: unknown }
    ));

    this.hot.runHooks('afterFormulasValuesUpdate', exportedChanges);
  };

  /**
   * Called when a named expression is added to the engine instance.
   *
   * @fires Hooks#afterNamedExpressionAdded
   * @param {string} namedExpressionName The name of the added expression.
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineNamedExpressionsAdded = (namedExpressionName: string, changes: unknown[][]) => {
    this.hot.runHooks('afterNamedExpressionAdded', namedExpressionName, changes);
  };

  /**
   * Called when a named expression is removed from the engine instance.
   *
   * @fires Hooks#afterNamedExpressionRemoved
   * @param {string} namedExpressionName The name of the removed expression.
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineNamedExpressionsRemoved = (namedExpressionName: string, changes: unknown[][]) => {
    this.hot.runHooks('afterNamedExpressionRemoved', namedExpressionName, changes);
  };

  /**
   * Called when a new sheet is added to the engine instance.
   *
   * @fires Hooks#afterSheetAdded
   * @param {string} addedSheetDisplayName The name of the added sheet.
   */
  #onEngineSheetAdded = (addedSheetDisplayName: string) => {
    this.hot.runHooks('afterSheetAdded', addedSheetDisplayName);
  };

  /**
   * Called when a sheet in the engine instance is renamed.
   *
   * @fires Hooks#afterSheetRenamed
   * @param {string} oldDisplayName The old name of the sheet.
   * @param {string} newDisplayName The new name of the sheet.
   */
  #onEngineSheetRenamed = (oldDisplayName: string, newDisplayName: string) => {
    this.#updateSheetNameAndSheetId(newDisplayName);
    this.hot.runHooks('afterSheetRenamed', oldDisplayName, newDisplayName);
  };

  /**
   * Called when a sheet is removed from the engine instance.
   *
   * @fires Hooks#afterSheetRemoved
   * @param {string} removedSheetDisplayName The removed sheet name.
   * @param {Array} changes The values and location of applied changes.
   */
  #onEngineSheetRemoved = (removedSheetDisplayName: string, changes: unknown[][]) => {
    this.hot.runHooks('afterSheetRemoved', removedSheetDisplayName, changes);
  };

  /**
   * The list of the HyperFormula listeners.
   *
   * @type {Array}
   */
  #engineListeners: [string, Function][] | null = [
    ['valuesUpdated', this.#onEngineValuesUpdated],
    ['namedExpressionAdded', this.#onEngineNamedExpressionsAdded],
    ['namedExpressionRemoved', this.#onEngineNamedExpressionsRemoved],
    ['sheetAdded', this.#onEngineSheetAdded],
    ['sheetRenamed', this.#onEngineSheetRenamed],
    ['sheetRemoved', this.#onEngineSheetRemoved],
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
  engine: HyperFormulaEngine | null = null;

  /**
   * HyperFormula's sheet id.
   *
   * @type {number|null}
   */
  sheetId: number | null = null;
  /**
   * HyperFormula's sheet name.
   *
   * @type {string|null}
   */
  sheetName: string | null = null;
  /**
   * Index synchronizer responsible for manipulating with some general options related to indexes synchronization.
   *
   * @type {IndexSyncer|null}
   */
  indexSyncer: IndexSyncer | null = null;
  /**
   * Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the rows.
   *
   * @type {AxisSyncer|null}
   */
  rowAxisSyncer: AxisSyncer | null = null;
  /**
   * Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the columns.
   *
   * @type {AxisSyncer|null}
   */
  columnAxisSyncer: AxisSyncer | null = null;
  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
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
      const newSheetName = this.addSheet(this.sheetName, this.#getProcessedSourceDataArray());

      if (typeof newSheetName === 'string') {
        this.#updateSheetNameAndSheetId(newSheetName);
      }
    }

    this.addHook('beforeLoadData', this.#onBeforeLoadData);
    this.addHook('afterLoadData', this.#onAfterLoadData);

    // The `updateData` hooks utilize the same logic as the `loadData` hooks.
    this.addHook('beforeUpdateData', this.#onBeforeLoadData);
    this.addHook('afterUpdateData', this.#onAfterLoadData);

    this.addHook('modifyData', this.#onModifyData);
    this.addHook('modifySourceData', this.#onModifySourceData);
    this.addHook('beforeValidate', this.#onBeforeValidate);

    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    this.addHook('afterSetDataAtCell', this.#onAfterSetDataAtCell);
    this.addHook('afterSetDataAtRowProp', this.#onAfterSetDataAtCell);

    this.addHook('beforeCreateRow', this.#onBeforeCreateRow);
    this.addHook('beforeCreateCol', this.#onBeforeCreateCol);

    this.addHook('afterCreateRow', this.#onAfterCreateRow);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);

    this.addHook('beforeRemoveRow', this.#onBeforeRemoveRow);
    this.addHook('beforeRemoveCol', this.#onBeforeRemoveCol);

    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);

    this.indexSyncer = new IndexSyncer(
      this.hot.rowIndexMapper, this.hot.columnIndexMapper, (postponedAction: Function) => {
        this.hot.addHookOnce('init', () => {
          // Engine is initialized after executing callback to `afterLoadData` hook. Thus, some actions on indexes should
          // be postponed.
          postponedAction();
        });
      });

    this.rowAxisSyncer = this.indexSyncer.getForAxis('row');
    this.columnAxisSyncer = this.indexSyncer.getForAxis('column');

    this.hot.addHook('afterRowSequenceChange', this.rowAxisSyncer!.getIndexesChangeSyncMethod());
    this.hot.addHook('afterColumnSequenceChange', this.columnAxisSyncer!.getIndexesChangeSyncMethod());

    this.hot.addHook('beforeRowMove',
      (movedRows: number[], finalIndex: number, _dropIndex: number | undefined, movePossible: boolean) => {
        this.rowAxisSyncer!.storeMovesInformation(movedRows, finalIndex, movePossible);
      });

    this.hot.addHook('beforeColumnMove',
      (movedColumns: number[], finalIndex: number, _dropIndex: number | undefined, movePossible: boolean) => {
        this.columnAxisSyncer!.storeMovesInformation(movedColumns, finalIndex, movePossible);
      });

    this.hot.addHook('afterRowMove',
      (_movedRows: number[], _finalIndex: number, _dropIndex: number | undefined,
       movePossible: boolean, orderChanged: boolean) => {
        this.rowAxisSyncer!.calculateAndSyncMoves(movePossible, orderChanged);
      });

    this.hot.addHook('afterColumnMove',
      (_movedColumns: number[], _finalIndex: number, _dropIndex: number | undefined,
       movePossible: boolean, orderChanged: boolean) => {
        this.columnAxisSyncer!.calculateAndSyncMoves(movePossible, orderChanged);
      });

    this.hot.addHook('beforeColumnFreeze', (column: number, freezePerformed: boolean) => {
      const fixedColumnsStart = this.hot.getSettings().fixedColumnsStart;

      this.columnAxisSyncer!.storeMovesInformation(
        [column], fixedColumnsStart!, freezePerformed);
    });

    this.hot.addHook('afterColumnFreeze', (_column: number, freezePerformed: boolean) => {
      this.columnAxisSyncer!.calculateAndSyncMoves(freezePerformed, freezePerformed);
    });

    this.hot.addHook('beforeColumnUnfreeze', (column: number, unfreezePerformed: boolean) => {
      const fixedColumnsStart = this.hot.getSettings().fixedColumnsStart;

      this.columnAxisSyncer!.storeMovesInformation(
        [column], fixedColumnsStart! - 1, unfreezePerformed);
    });

    this.hot.addHook('afterColumnUnfreeze', (_column: number, unfreezePerformed: boolean) => {
      this.columnAxisSyncer!.calculateAndSyncMoves(unfreezePerformed, unfreezePerformed);
    });

    // TODO: Actions related to overwriting dates from HOT format to HF default format are done as callback to this
    // hook, because some hooks, such as `afterLoadData` doesn't have information about composed cell properties.
    // Another hooks are triggered to late for setting HF's engine data needed for some actions.
    this.addHook('afterCellMetaReset', this.#onAfterCellMetaReset);

    // Handling undo actions on data just using HyperFormula's UndoRedo mechanism
    this.addHook('beforeUndo', () => {
      this.indexSyncer!.setPerformUndo(true);

      this.engine!.undo();
    });

    // Handling redo actions on data just using HyperFormula's UndoRedo mechanism
    this.addHook('beforeRedo', () => {
      this.indexSyncer!.setPerformRedo(true);

      this.engine!.redo();
    });

    this.addHook('afterUndo', () => {
      this.indexSyncer!.setPerformUndo(false);
    });

    this.addHook('afterUndo', () => {
      this.indexSyncer!.setPerformRedo(false);
    });

    this.addHook('afterDetachChild', this.#onAfterDetachChild);
    this.addHook('beforeAutofill', this.#onBeforeAutofill);

    this.#engineListeners?.forEach(([eventName, listener]) => this.engine!.on(eventName, listener));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#engineListeners?.forEach(([eventName, listener]) => this.engine?.off(eventName, listener));

    if (this.engine) {
      unregisterEngine(this.engine, this.hot);
    }

    this.engine = null;

    super.disablePlugin();
  }

  /**
   * Triggered on `updateSettings`.
   *
   * @private
   * @param {object} newSettings New set of settings passed to the `updateSettings` method.
   */
  updatePlugin(newSettings: Record<string, unknown>) {
    const newEngineSettings = getEngineSettingsWithOverrides(this.hot.getSettings());

    if (this.engine && haveEngineSettingsChanged(this.engine.getConfig(), newEngineSettings)) {
      this.engine.updateConfig(newEngineSettings);
    }

    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (
      pluginSettings !== undefined &&
      typeof pluginSettings !== 'boolean' &&
      pluginSettings.sheetName !== undefined &&
      pluginSettings.sheetName !== this.sheetName
    ) {
      this.switchSheet(pluginSettings.sheetName);
    }

    // If no data was passed to the `updateSettings` method and no sheet is connected to the instance -> create a
    // new sheet using the currently used data. Otherwise, it will be handled by the `afterLoadData` call.
    if (!newSettings.data && this.sheetName === null) {
      const formulasSettings = this.hot.getSettings()[PLUGIN_KEY];
      const sheetName = isFormulasSettingsObject(formulasSettings) ? formulasSettings.sheetName : undefined;

      if (sheetName && this.engine?.doesSheetExist(sheetName)) {
        this.switchSheet(sheetName);

      } else {
        const newSheetName = this.addSheet(sheetName ?? undefined, this.#getProcessedSourceDataArray());

        if (typeof newSheetName === 'string') {
          this.#updateSheetNameAndSheetId(newSheetName);
        }
      }
    }

    super.updatePlugin(newSettings);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#engineListeners?.forEach(([eventName, listener]) => this.engine?.off(eventName, listener));
    this.#engineListeners = null;

    if (this.engine) {
      unregisterEngine(this.engine, this.hot);
    }

    this.engine = null;

    super.destroy();
  }

  /**
   * Update sheetName and sheetId properties.
   *
   * @param {string} [sheetName] The new sheet name.
   */
  #updateSheetNameAndSheetId(sheetName: string) {
    this.sheetName = sheetName;
    this.sheetId = this.engine?.getSheetId(this.sheetName) ?? null;
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
  addSheet(sheetName?: string | null, sheetData?: unknown[][]): string | boolean {
    if (isDefined(sheetData) && !isArrayOfArrays(sheetData)) {
      warn('The provided data should be an array of arrays.');

      return false;
    }

    if (sheetName !== undefined && sheetName !== null && this.engine?.doesSheetExist(sheetName)) {
      warn('Sheet with the provided name already exists.');

      return false;
    }

    try {
      const actualSheetName = this.engine!.addSheet(sheetName ?? undefined);

      if (sheetData) {
        this.engine!.setSheetContent(this.engine!.getSheetId(actualSheetName), sheetData);
      }

      return actualSheetName;

    } catch (e) {
      warn(e instanceof Error ? e.message : String(e));

      return false;
    }
  }

  /**
   * Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
   * instance).
   *
   * @param {string} sheetName Sheet name used in the shared HyperFormula instance.
   */
  switchSheet(sheetName: string): void {
    if (!this.engine?.doesSheetExist(sheetName)) {
      error(`The sheet named \`${sheetName}\` does not exist, switch aborted.`);

      return;
    }

    this.#updateSheetNameAndSheetId(sheetName);

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
  getCellType(row: number, column: number, sheet: number | null = this.sheetId): unknown {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (physicalRow !== null && physicalColumn !== null) {
      return this.engine!.getCellType({
        sheet,
        row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
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
  isFormulaCellType(row: number, column: number, sheet: number | null = this.sheetId): boolean {
    return this.engine!.doesCellHaveFormula({
      sheet,
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
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
  renderDependentSheets(dependentCells: unknown[], renderSelf = false) {
    const affectedSheetIds = new Set();

    dependentCells.forEach((change: unknown) => {
      // For the Named expression the address is empty, hence the `sheetId` is undefined.
      const sheetId = isHFCellChange(change) ? change.address?.sheet : undefined;

      if (sheetId !== undefined && !affectedSheetIds.has(sheetId)) {
        affectedSheetIds.add(sheetId);
      }
    });

    if (!this.engine) {
      return;
    }

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
  validateDependentCells(dependentCells: unknown[], changedCells: unknown[] = []) {
    const stringifyAddress = (change: unknown) => {
      const address = isHFCellChange(change) ? change.address : undefined;
      const { row, col, sheet } = address ?? {};

      return isDefined(sheet) ? `${sheet}:${row}x${col}` : '';
    };
    const changedCellsSet = new Set(changedCells.map((change: unknown) => stringifyAddress(change)));

    dependentCells.forEach((change: unknown) => {
      const address = isHFCellChange(change) ? change.address : undefined;
      const { row, col, sheet: sheetId } = address ?? {};

      // Don't try to validate cells outside of the visual part of the table.
      if (row === undefined || col === undefined ||
        row >= this.hot.countRows() || col >= this.hot.countCols()) {
        return;
      }

      const addressId = stringifyAddress(change);

      // Validate the cells that depend on the calculated formulas. Skip that cells
      // where the user directly changes the values - the Core triggers those validators.
      if (sheetId !== undefined && !changedCellsSet.has(addressId) && this.engine) {
        const boundHot = getRegisteredHotInstances(this.engine).get(sheetId);

        // if `sheetId` is not bound to any Handsontable instance, skip the validation process
        if (!boundHot) {
          return;
        }

        // It will just re-render certain cell when necessary.
        boundHot.validateCell(
          boundHot.getDataAtCell(row, col),
          boundHot.getCellMeta(row, col),
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
  syncChangeWithEngine(row: number, column: number, newValue: unknown) {
    const address = {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(column),
      sheet: this.sheetId
    };

    if (!this.engine?.isItPossibleToSetCellContents(address)) {
      warn(`Not possible to set cell data at ${JSON.stringify(address)}`);

      return;
    }

    const cellMeta = this.hot.getCellMeta(row, column);

    if (isDate(newValue, cellMeta.type)) {
      if (isDateValid(newValue)) {
        // Rewriting date in HOT format to HF format.
        newValue = getDateInHfFormat(newValue);

      } else if (isFormula(newValue) === false) {
        // Escaping value from date parsing using "'" sign (HF feature).
        newValue = `'${newValue}`;
      }
    }

    return this.engine?.setCellContents(address, newValue);
  }

  /**
   * Get the value to be passed to the formula engine.
   * If the value is an object, utilize the valueGetter for that cell, otherwise return the value as is.
   *
   * @param {number} row The physical row index.
   * @param {number} column The physical column index.
   * @param {*} value The value to be passed to the formula engine.
   * @returns {*} The value to be displayed in the cell.
   */
  #getValueGetterValue(row: number, column: number, value: unknown) {
    if (isObject(value) && value !== null) {
      const visualRow = this.hot.toVisualRow(row);
      const visualColumn = this.hot.toVisualColumn(column);
      const cellMeta = this.hot.getCellMeta(visualRow, visualColumn);
      const valueGetter = cellMeta.valueGetter;

      value = getValueGetterValue(value, this.hot.getCellMeta(visualRow, visualColumn));

      if (value !== null && value !== undefined) {
        value = Object(value).toString();
      }
    }

    return normalizeValueForFormulaEngine(value);
  }

  /**
   * Get the source data array to be passed to the formula engine.
   * If the value is an object, utilize the valueGetter for that cell, otherwise return the value as is.
   *
   * @param {number} [row] The starting visual row index.
   * @param {number} [column] The starting visual column index.
   * @param {number} [row2] The ending visual row index.
   * @param {number} [column2] The ending visual column index.
   * @returns {Array} The source data array to be passed to the formula engine.
   */
  #getProcessedSourceDataArray(row?: number, column?: number, row2?: number, column2?: number) {
    const dataArray = this.hot.getSourceDataArray(row, column, row2, column2);
    const visibleColumnCount = this.hot.countCols();
    const physicalColumnCount = this.hot.countSourceCols();
    const isAoAWithSkippedColumns = visibleColumnCount < physicalColumnCount
      && isArrayOfArrays(this.hot.getSourceData());

    if (!isAoAWithSkippedColumns) {
      return dataArray.map((rowObject, rowIndex) => {
        const rowArray = Array.isArray(rowObject) ? rowObject : [];

        return rowArray.map((value: unknown, columnIndex: number) => {
          return this.#getValueGetterValue(rowIndex, columnIndex, value);
        });
      });
    }

    // Array-of-objects data is already projected to visible columns by
    // `dataSource.getAtRow`. Array-of-arrays data returns the full source row,
    // so when `columns` skips physical indexes the data fed to HF misaligns
    // with the axis-syncer's visual->HF mapping (issue #10021). Build a row
    // containing only visible columns so HF cell coordinates stay in sync.
    const columnOffset = column ?? 0;

    return dataArray.map((rowArray, rowIndex) => {
      const projected = [];

      for (let visualCol = 0; visualCol < visibleColumnCount; visualCol++) {
        const physicalCol = this.hot.colToProp(visualCol);

        if (typeof physicalCol !== 'number') {
          continue;
        }

        const arrayIndex = physicalCol - columnOffset;

        if (arrayIndex < 0 || arrayIndex >= rowArray.length) {
          continue;
        }

        projected.push(this.#getValueGetterValue(rowIndex, visualCol, rowArray[arrayIndex]));
      }

      return projected;
    });
  }

  /**
   * The hook allows to translate the formula value to calculated value before it goes to the
   * validator function.
   *
   * @param {*} value The cell value to validate.
   * @param {number} visualRow The visual row index.
   * @param {number|string} prop The visual column index or property name of the column.
   * @returns {*} Returns value to validate.
   */
  #onBeforeValidate = (value: unknown, visualRow: number, prop: number | string) => {
    const visualColumn = this.hot.propToCol(prop);

    if (this.isFormulaCellType(visualRow, visualColumn)) {
      const address = {
        row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
        sheet: this.sheetId,
      };

      const cellMeta = this.hot.getCellMeta(visualRow, visualColumn);
      let cellValue = this.engine!.getCellValue(address); // Date as an integer (Excel-like date).

      if (cellMeta.type === 'date' && isNumeric(cellValue)) {
        cellValue = getDateFromExcelDate(cellValue);
      } else if (cellMeta.type === 'time' && isNumeric(cellValue)) {
        cellValue = getTimeFromHfTimeFraction(cellValue as number);
      }

      // If `cellValue` is an object it is expected to be an error
      return hasValueProperty(cellValue) ? cellValue.value : cellValue;
    }

    return value;
  };

  /**
   * `onBeforeAutofill` hook callback.
   *
   * @param {Array[]} fillData The data that was used to fill the `targetRange`. If `beforeAutofill` was used
   * and returned `[[]]`, this will be the same object that was returned from `beforeAutofill`.
   * @param {CellRange} sourceRange The range values will be filled from.
   * @param {CellRange} targetRange The range new values will be filled into.
   * @returns {boolean|*}
   */
  #onBeforeAutofill = (
    fillData: unknown[][][][], sourceRange: CellRange, targetRange: CellRange
  ) => {
    const { row: sourceTopStartRow, col: sourceTopStartColumn } = sourceRange.getTopStartCorner();
    const { row: sourceBottomEndRow, col: sourceBottomEndColumn } = sourceRange.getBottomEndCorner();
    const { row: targetTopStartRow, col: targetTopStartColumn } = targetRange.getTopStartCorner();
    const { row: targetBottomEndRow, col: targetBottomEndColumn } = targetRange.getBottomEndCorner();

    if (
      sourceTopStartRow === null || sourceTopStartColumn === null ||
      sourceBottomEndRow === null || sourceBottomEndColumn === null ||
      targetTopStartRow === null || targetTopStartColumn === null ||
      targetBottomEndRow === null || targetBottomEndColumn === null
    ) {
      return;
    }

    const hfSourceStartRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(sourceTopStartRow);
    const hfSourceStartCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(sourceTopStartColumn);
    const hfSourceEndRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(sourceBottomEndRow);
    const hfSourceEndCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(sourceBottomEndColumn);
    const hfTargetStartRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(targetTopStartRow);
    const hfTargetStartCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(targetTopStartColumn);
    const hfTargetEndRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(targetBottomEndRow);
    const hfTargetEndCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(targetBottomEndColumn);

    if (
      hfSourceStartRow === null || hfSourceStartCol === null ||
      hfSourceEndRow === null || hfSourceEndCol === null ||
      hfTargetStartRow === null || hfTargetStartCol === null ||
      hfTargetEndRow === null || hfTargetEndCol === null
    ) {
      return;
    }

    const engineSourceRange = {
      start: {
        row: hfSourceStartRow,
        col: hfSourceStartCol,
        sheet: this.sheetId,
      },
      end: {
        row: hfSourceEndRow,
        col: hfSourceEndCol,
        sheet: this.sheetId,
      },
    };

    const engineTargetRange = {
      start: {
        row: hfTargetStartRow,
        col: hfTargetStartCol,
        sheet: this.sheetId,
      },
      end: {
        row: hfTargetEndRow,
        col: hfTargetEndCol,
        sheet: this.sheetId,
      },
    };

    // Blocks the autofill operation if HyperFormula says that at least one of
    // the underlying cell's contents cannot be set.
    if (this.engine!.isItPossibleToSetCellContents(engineTargetRange) === false) {
      return false;
    }

    const fillRangeData = this.engine!.getFillRangeData(engineSourceRange, engineTargetRange);
    const {
      row: sourceStartRow,
      col: sourceStartColumn,
    } = engineSourceRange.start;
    const {
      row: sourceEndRow,
      col: sourceEndColumn,
    } = engineSourceRange.end;
    const populationRowLength = sourceEndRow - sourceStartRow + 1;
    const populationColumnLength = sourceEndColumn - sourceStartColumn + 1;

    for (let populatedRowIndex = 0; populatedRowIndex < fillRangeData.length; populatedRowIndex += 1) {
      for (let populatedColumnIndex = 0; populatedColumnIndex < fillRangeData[populatedRowIndex].length;
        populatedColumnIndex += 1) {
        const populatedValue = fillRangeData[populatedRowIndex][populatedColumnIndex];
        const sourceRow = sourceStartRow + (populatedRowIndex % populationRowLength);
        const sourceColumn = sourceStartColumn + (populatedColumnIndex % populationColumnLength);
        const sourceCellMeta = this.hot.getCellMeta(sourceRow, sourceColumn);

        if (isDate(populatedValue, sourceCellMeta.type)) {
          if (populatedValue.startsWith('\'')) {
            // Populating values on HOT side without apostrophe.
            fillRangeData[populatedRowIndex][populatedColumnIndex] = populatedValue.slice(1);

          } else if (this.isFormulaCellType(sourceRow, sourceColumn, this.sheetId) === false) {
            // Populating date in proper format, coming from the source cell.
            fillRangeData[populatedRowIndex][populatedColumnIndex] =
              getDateInHotFormat(populatedValue);
          }
        }
      }
    }

    return fillRangeData;
  };

  /**
   * `beforeLoadData` hook callback.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} [source] Source of the call.
   */
  #onBeforeLoadData = (sourceData: unknown[], initialLoad: boolean, source = '') => {
    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    // This flag needs to be defined, because not passing data to HOT results in HOT auto-generating a `null`-filled
    // initial dataset.
    this.#hotWasInitializedWithEmptyData = isUndefined(this.hot.getSettings().data);
  };

  /**
   * Callback to `afterCellMetaReset` hook which is triggered after setting cell meta.
   */
  #onAfterCellMetaReset = () => {
    if (this.#hotWasInitializedWithEmptyData) {
      if (this.sheetName !== null) {
        this.switchSheet(this.sheetName);
      }

      return;
    }

    const sourceDataArray = this.#getProcessedSourceDataArray();

    sourceDataArray.forEach((rowData: unknown[], rowIndex: number) => {
      rowData.forEach((cellValue: unknown, columnIndex: number) => {
        const cellMeta = this.hot.getCellMeta(rowIndex, columnIndex, { skipMetaExtension: true });

        if (isDate(cellValue, cellMeta.type)) {
          if (isDateValid(cellValue)) {
            // Rewriting date in HOT format to HF format.
            sourceDataArray[rowIndex][columnIndex] = getDateInHfFormat(cellValue);
          } else if (!cellValue.startsWith('=')) {
            // Escaping value from date parsing using "'" sign (HF feature).
            sourceDataArray[rowIndex][columnIndex] = `'${cellValue}`;
          }
        }
      });
    });

    this.#internalOperationPending = true;
    const dependentCells = this.engine!.setSheetContent(this.sheetId, sourceDataArray);

    this.indexSyncer!.setupSyncEndpoint(this.engine!, this.sheetId);
    this.renderDependentSheets(dependentCells);
    this.#internalOperationPending = false;
  };

  /**
   * `afterLoadData` hook callback.
   *
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} [source] Source of the call.
   */
  #onAfterLoadData = (sourceData: unknown[], initialLoad: boolean, source = '') => {
    if (source.includes(toUpperCaseFirst(PLUGIN_KEY))) {
      return;
    }

    if (!this.engine) {
      return;
    }

    const formulasSettings = this.hot.getSettings()[PLUGIN_KEY];
    const settingsSheetName = isFormulasSettingsObject(formulasSettings) ? formulasSettings.sheetName : undefined;
    const sheetName = setupSheet(this.engine, settingsSheetName!);

    this.#updateSheetNameAndSheetId(sheetName);

    if (source === 'updateSettings') {
      // For performance reasons, the initialization will be done in afterCellMetaReset hook
      return;
    }

    if (!this.#hotWasInitializedWithEmptyData) {
      const sourceDataArray = this.#getProcessedSourceDataArray();

      if (this.engine!.isItPossibleToReplaceSheetContent(this.sheetId, sourceDataArray)) {
        this.#internalOperationPending = true;

        const dependentCells = this.engine!.setSheetContent(this.sheetId, sourceDataArray);

        this.indexSyncer!.setupSyncEndpoint(this.engine!, this.sheetId);
        this.renderDependentSheets(dependentCells);

        this.#internalOperationPending = false;
      }

    } else if (this.sheetName !== null) {
      this.switchSheet(this.sheetName);
    }
  };

  /**
   * `modifyData` hook callback.
   *
   * @param {number} visualRow Visual row index.
   * @param {number} visualColumn Visual column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  #onModifyData = (visualRow: number, visualColumn: number, valueHolder: Record<string, unknown>, ioMode: string) => {
    if (
      ioMode !== 'get' ||
      this.#internalOperationPending ||
      this.sheetName === null ||
      !this.engine?.doesSheetExist(this.sheetName)
    ) {
      return;
    }

    if (visualRow === null || visualColumn === null) {
      return;
    }

    const cellType = this.getCellType(visualRow, visualColumn);

    if (cellType === 'VALUE' || cellType === 'EMPTY') {
      valueHolder.value = unescapeFormulaExpression(valueHolder.value);

      return;
    }

    const address = {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
      sheet: this.sheetId
    };
    let cellValue = this.engine!.getCellValue(address); // Date as an integer (Excel like date).

    const cellMeta = this.hot.getCellMeta(visualRow, visualColumn, { skipMetaExtension: true });

    if (cellMeta.type === 'date' && isNumeric(cellValue)) {
      cellValue = getDateFromExcelDate(cellValue);
    } else if (cellMeta.type === 'time' && isNumeric(cellValue)) {
      cellValue = getTimeFromHfTimeFraction(cellValue as number);
    }

    // If `cellValue` is an object it is expected to be an error
    valueHolder.value = hasValueProperty(cellValue) ? cellValue.value : cellValue;
  };

  /**
   * `modifySourceData` hook callback.
   *
   * @param {number} row Physical row index.
   * @param {number|string} columnOrProp Physical column index or prop.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value`
   *   property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  #onModifySourceData = (
    row: number, columnOrProp: number | string, valueHolder: Record<string, unknown>, ioMode: string
  ) => {
    if (
      ioMode !== 'get' ||
      this.#internalOperationPending ||
      this.sheetName === null ||
      !this.engine?.doesSheetExist(this.sheetName)
    ) {
      return;
    }

    const visualRow = this.hot.toVisualRow(row);
    const visualColumn = this.hot.propToCol(columnOrProp);

    if (visualRow === null || visualColumn === null) {
      return;
    }

    const cellType = this.getCellType(visualRow, visualColumn);

    if (cellType === 'VALUE' || cellType === 'EMPTY') {
      return;
    }

    const dimensions = this.engine!.getSheetDimensions(this.engine!.getSheetId(this.sheetName));

    // Don't actually change the source data if HyperFormula is not
    // initialized yet. This is done to allow the `afterLoadData` hook to
    // load the existing source data with `Handsontable#getSourceDataArray`
    // properly.
    if (dimensions.width === 0 && dimensions.height === 0) {
      return;
    }

    const address = {
      row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
      col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
      sheet: this.sheetId
    };

    valueHolder.value = this.engine!.getCellSerialized(address);
  };

  /**
   * `onAfterSetDataAtCell` hook callback.
   *
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link https://handsontable.com/docs/javascript-data-grid/events-and-hooks/#handsontable-hooks}).
   */
  #onAfterSetDataAtCell = (changes: CellChange[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    // Skip engine sync when there are no changes (e.g. populateFromArray on readOnly cells).
    // Otherwise engine.batch() would push an empty undo step and undo would revert the wrong action (#dev-2136).
    if (!changes?.length) {
      return;
    }

    const outOfBoundsChanges: [number, number, unknown][] = [];
    const changedCells: unknown[] = [];

    const dependentCells = this.engine!.batch(() => {
      changes.forEach(([visualRow, prop, , newValue]) => {
        if (typeof prop !== 'string' && typeof prop !== 'number') {
          return;
        }
        const visualColumn = this.hot.propToCol(prop);
        const physicalRow = this.hot.toPhysicalRow(visualRow);
        const physicalColumn = this.hot.toPhysicalColumn(visualColumn);
        const address = {
          row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
          col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
          sheet: this.sheetId,
        };

        newValue = this.#getValueGetterValue(physicalRow, physicalColumn, newValue);

        if (physicalRow !== null && physicalColumn !== null) {
          this.syncChangeWithEngine(visualRow, visualColumn, newValue);

        } else {
          outOfBoundsChanges.push([visualRow, visualColumn, newValue]);
        }

        changedCells.push({ address });
      });
    });

    if (outOfBoundsChanges.length) {
      // Workaround for rows/columns being created two times (by HOT and the engine).
      // (unfortunately, this requires an extra re-render)
      this.hot.addHookOnce('afterChange', () => {
        const outOfBoundsDependentCells = this.engine!.batch(() => {
          outOfBoundsChanges.forEach(([row, column, newValue]) => {
            this.syncChangeWithEngine(row, column, newValue);
          });
        });

        this.renderDependentSheets(outOfBoundsDependentCells, true);
      });
    }

    this.renderDependentSheets(dependentCells);
    this.validateDependentCells(dependentCells, changedCells);
  };

  /**
   * `onAfterSetSourceDataAtCell` hook callback.
   *
   * @param {Array[]} changes An array of changes in format [[row, column, oldValue, value], ...].
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link https://handsontable.com/docs/javascript-data-grid/events-and-hooks/#handsontable-hooks}).
   */
  #onAfterSetSourceDataAtCell = (changes: CellChange[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const dependentCells: unknown[] = [];
    const changedCells: unknown[] = [];

    changes.forEach(([visualRow, prop, , newValue]) => {
      if (typeof prop !== 'string' && typeof prop !== 'number') {
        return;
      }
      const visualColumn = this.hot.propToCol(prop);

      if (!isNumeric(visualColumn)) {
        return;
      }

      const address = {
        row: this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
        sheet: this.sheetId
      };

      if (!this.engine?.isItPossibleToSetCellContents(address)) {
        warn(`Not possible to set source cell data at ${JSON.stringify(address)}`);

        return;
      }

      newValue = normalizeValueForFormulaEngine(newValue);

      changedCells.push({ address });
      dependentCells.push(...this.engine!.setCellContents(address, newValue));
    });

    this.renderDependentSheets(dependentCells);
    this.validateDependentCells(dependentCells, changedCells);
  };

  /**
   * `beforeCreateRow` hook callback.
   *
   * @param {number} visualRow Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeCreateRow = (visualRow: number, amount: number) => {
    let hfRowIndex = this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow);

    if (visualRow >= this.hot.countRows()) {
      hfRowIndex = visualRow; // Row beyond the table boundaries.
    }

    if (
      this.sheetId === null ||
      !this.engine?.doesSheetExist(this.sheetName!) ||
      !this.engine?.isItPossibleToAddRows(this.sheetId, [hfRowIndex, amount])
    ) {
      return false;
    }
  };

  /**
   * `beforeCreateCol` hook callback.
   *
   * @param {number} visualColumn Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeCreateCol = (visualColumn: number, amount: number) => {
    let hfColumnIndex = this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn);

    if (visualColumn >= this.hot.countCols()) {
      hfColumnIndex = visualColumn; // Column beyond the table boundaries.
    }

    if (
      this.sheetId === null ||
      !this.engine?.doesSheetExist(this.sheetName!) ||
      !this.engine?.isItPossibleToAddColumns(this.sheetId, [hfColumnIndex, amount])
    ) {
      return false;
    }
  };

  /**
   * `beforeRemoveRow` hook callback.
   *
   * @param {number} row Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeRemoveRow = (row: number, amount: number, physicalRows: number[]) => {
    const hfRows = this.rowAxisSyncer!.setRemovedHfIndexes(physicalRows);

    const possible = hfRows.every((hfRow: number) => {
      return this.engine?.isItPossibleToRemoveRows(this.sheetId, [hfRow, 1]);
    });

    return possible === false ? false : undefined;
  };

  /**
   * `beforeRemoveCol` hook callback.
   *
   * @param {number} col Visual index of starter column.
   * @param {number} amount Amount of columns to be removed.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  #onBeforeRemoveCol = (col: number, amount: number, physicalColumns: number[]) => {
    const hfColumns = this.columnAxisSyncer!.setRemovedHfIndexes(physicalColumns);

    const possible = hfColumns.every((hfColumn: number) => {
      return this.engine?.isItPossibleToRemoveColumns(this.sheetId, [hfColumn, 1]);
    });

    return possible === false ? false : undefined;
  };

  /**
   * `afterCreateRow` hook callback.
   *
   * @param {number} visualRow Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link https://handsontable.com/docs/javascript-data-grid/events-and-hooks/#handsontable-hooks}).
   */
  #onAfterCreateRow = (visualRow: number, amount: number, source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const changes = this.engine!.addRows(this.sheetId,
      [this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow), amount]);

    this.renderDependentSheets(changes);
  };

  /**
   * `afterCreateCol` hook callback.
   *
   * @param {number} visualColumn Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link https://handsontable.com/docs/javascript-data-grid/events-and-hooks/#handsontable-hooks}).
   */
  #onAfterCreateCol = (visualColumn: number, amount: number, source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const changes = this.engine!.addColumns(this.sheetId,
      [this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn), amount]);

    this.renderDependentSheets(changes);
  };

  /**
   * `afterRemoveRow` hook callback.
   *
   * @param {number} row Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link https://handsontable.com/docs/javascript-data-grid/events-and-hooks/#handsontable-hooks}).
   */
  #onAfterRemoveRow = (row: number, amount: number, physicalRows: number[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const descendingHfRows = this.rowAxisSyncer!
      .getRemovedHfIndexes()
      .sort((a: number, b: number) => b - a); // sort numeric values descending

    const changes = this.engine!.batch(() => {
      descendingHfRows.forEach((hfRow: number) => {
        this.engine!.removeRows(this.sheetId, [hfRow, 1]);
      });
    });

    this.renderDependentSheets(changes);
  };

  /**
   * `afterRemoveCol` hook callback.
   *
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link https://handsontable.com/docs/javascript-data-grid/events-and-hooks/#handsontable-hooks}).
   */
  #onAfterRemoveCol = (col: number, amount: number, physicalColumns: number[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const descendingHfColumns = this.columnAxisSyncer!
      .getRemovedHfIndexes()
      .sort((a: number, b: number) => b - a); // sort numeric values descending

    const changes = this.engine!.batch(() => {
      descendingHfColumns.forEach((hfColumn: number) => {
        this.engine!.removeColumns(this.sheetId, [hfColumn, 1]);
      });
    });

    this.renderDependentSheets(changes);
  };

  /**
   * `afterDetachChild` hook callback.
   * Used to sync the data of the rows detached in the Nested Rows plugin with the engine's dataset.
   *
   * @param {object} parent An object representing the parent from which the element was detached.
   * @param {object} element The detached element.
   * @param {number} finalElementRowIndex The final row index of the detached element.
   */
  #onAfterDetachChild = (parent: Record<string, unknown>, element: Record<string, unknown>,
                         finalElementRowIndex: number) => {
    this.#internalOperationPending = true;

    const children = element.__children;
    const childrenCount = Array.isArray(children) ? children.length : 0;
    const rowsData = this.#getProcessedSourceDataArray(
      finalElementRowIndex,
      0,
      finalElementRowIndex + childrenCount,
      this.hot.countSourceCols()
    );

    this.#internalOperationPending = false;

    rowsData.forEach((row: unknown[], relativeRowIndex: number) => {
      row.forEach((value: unknown, colIndex: number) => {
        this.engine?.setCellContents({
          col: colIndex,
          row: finalElementRowIndex + relativeRowIndex,
          sheet: this.sheetId
        }, [[value]]);
      });
    });
  };

}
