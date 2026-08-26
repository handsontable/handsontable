import { BasePlugin } from '../base';
import { staticRegister } from '../../utils/staticRegister';
import { error, warn, warnOnce } from '../../helpers/console';
import { isNumeric } from '../../helpers/number';
import { isObject } from '../../helpers/object';
import { isDefined, isUndefined } from '../../helpers/mixed';
import { getRegisteredHotInstances, setupEngine, setupSheet, unregisterEngine, } from './engine/register';
import {
  coalesceIndexesToSpans,
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
import { resolveHyperlinkUrl } from './hyperlinkUrl';
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
import { isCellRangeLike } from '../../3rdparty/walkontable/src/cell/range';
import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';

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
 * The visual-coordinate rectangle of a `moveCells` operation, captured in `beforeMoveCells`.
 *
 * The `afterMoveCells` listener works off this instead of its hook arguments: `Hooks.run` threads a
 * listener's non-`undefined` return value into the next listener's first argument, so a global
 * listener returning a truthy non-range would otherwise replace `sourceRange` for the plugin.
 */
interface MoveCellsRect {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  targetRow: number;
  targetCol: number;
  isCopy: boolean;
}

/**
 * The expected shape of the `formulas` plugin settings object (the non-boolean form).
 */
interface FormulasPluginSettings {
  sheetName?: string;
  engine: unknown;
  hyperlinks?: boolean;
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
// `maxRows` and `maxColumns` no longer reach the engine at all (GH #10672), but they stay here:
// `updatePlugin` also creates or switches the sheet, and dropping them would skip that.
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

// Undo/redo actions that add or remove rows or columns. They are the only ones that make
// HyperFormula rewrite formula references, so they are the only ones whose source data has to be
// caught up in `afterUndo`/`afterRedo`. Reordering actions (a row move, for instance) must not
// trigger the write-back - they leave the source data's own reference frame untouched.
const STRUCTURAL_ACTION_TYPES = new Set(['insert_row', 'insert_col', 'remove_row', 'remove_col']);

const getActionType = (action: unknown) => {
  if (typeof action !== 'object' || action === null || !('actionType' in action)) {
    return null;
  }

  return (action as { actionType: string }).actionType;
};

const isStructuralAction = (action: unknown) => STRUCTURAL_ACTION_TYPES.has(getActionType(action) as string);

// `MoveCellsAction.undo` restores both regions with `restoreRegion` instead of replaying the move, so
// `afterMoveCells` - where the forward direction syncs - never fires. Undo has to cover it here.
// Redo does replay the move, so it must NOT be listed, or the sheet would be scanned twice.
const isUndoneMoveCells = (action: unknown) => getActionType(action) === 'move_cells';

// Only these can leave a formula pointing at cells that no longer exist.
const REFERENCE_BREAKING_ACTION_TYPES = new Set(['remove_row', 'remove_col', 'move_cells']);

const canBreakReferences = (action: unknown) =>
  REFERENCE_BREAKING_ACTION_TYPES.has(getActionType(action) as string);

// Maximum number of `[startIndex, amount]` spans passed to a single variadic engine
// `removeRows`/`removeColumns` call. An unbounded argument spread could overflow the call stack.
const REMOVAL_SPANS_CHUNK_SIZE = 1000;

// A formula whose reference the engine could not keep. Only operations that remove or relocate
// cells may put one into the source data - see `#syncFormulasToSourceData`.
const REF_ERROR_PATTERN = /#REF!/;

// Group under which the plugin's grid shortcuts are registered, so `disablePlugin` can drop them all.
const SHORTCUTS_GROUP = PLUGIN_KEY;

// Class name of the anchor that wraps the content of a `HYPERLINK` cell. It is also the marker that
// keeps the wrapping idempotent when a renderer leaves the previous DOM in place.
const HYPERLINK_CLASS_NAME = 'ht-hyperlink';

// `warnOnce` key for a `HYPERLINK` URL refused by the protocol allowlist. Warning per cell would
// flood the console on every render pass.
const HYPERLINK_WARN_KEY = 'formulas-hyperlink-refused';

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
   * Returns the list of settings keys observed by the plugin for configuration changes.
   */
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
   * Whether `HYPERLINK` cells are rendered as links. Mirrors the `hyperlinks` plugin setting, cached
   * because it is read once per rendered cell.
   */
  #hyperlinksEnabled = false;

  /**
   * Flag needed to mark if Handsontable was initialized with no data.
   * (Required to work around the fact, that Handsontable auto-generates sample data, when no data is provided).
   *
   * @type {boolean}
   */
  #hotWasInitializedWithEmptyData = false;

  /**
   * Stores the HyperFormula source range and destination address prepared in `beforeMoveCells` so that
   * `commitPendingMoveCells` can execute the corresponding HF operation without recomputing
   * visual-to-HF coordinates. `rect` carries the same operation in visual coordinates for the
   * post-commit data sync.
   *
   * Set to `null` when no move is in flight.
   *
   * @private
   * @type {{ source: object, dest: object, isCopy: boolean, rect: object }|null}
   */
  #pendingMoveCells: { source: object; dest: object; isCopy: boolean; rect: MoveCellsRect } | null = null;

  /**
   * The visual rectangle of the operation `commitPendingMoveCells` committed to the engine (or
   * intentionally skipped during undo/redo replay). Consumed by the `afterMoveCells` listener,
   * which runs the HOT-data sync only for committed operations and only off this value — never
   * off its own hook arguments, which a preceding listener's return value can replace.
   *
   * Set to `null` when no committed move is awaiting its sync.
   *
   * @private
   * @type {object|null}
   */
  #committedMoveCells: MoveCellsRect | null = null;

  /**
   * `true` while a move-cells redo is replaying through the MoveCells plugin.
   *
   * Unlike other redo actions, it must validate the Handsontable move before advancing
   * HyperFormula, so `commitPendingMoveCells` performs the engine operation itself.
   */
  #isRedoingMoveCells = false;

  /**
   * The dependent-cell changes returned by the engine operation in `commitPendingMoveCells`,
   * consumed by the `afterMoveCells` listener to re-render dependent sheets. `null` when the
   * engine step was skipped (undo/redo replay re-renders everything anyway).
   *
   * @private
   * @type {unknown[]|null}
   */
  #moveCellsChanges: unknown[] | null = null;

  /**
   * Guard flag set while writing synced values back to HOT after a `moveCells` operation.
   * Prevents the `afterSetDataAtCell` / `afterSetSourceDataAtCell` hooks from re-writing
   * the same values into HyperFormula a second time.
   *
   * @private
   * @type {boolean}
   */
  #moveCellsSyncPending = false;

  /**
   * Guard flag set while `#syncFormulasToSourceData` writes engine-rewritten formulas back to
   * Handsontable.
   * Prevents the `afterSetSourceDataAtCell` hook from pushing the very same formulas into
   * HyperFormula again.
   *
   * @private
   * @type {boolean}
   */
  #sourceDataSyncPending = false;

  /**
   * The changes that the engine reported while undoing or redoing an action. They are collected in
   * `beforeUndo`/`beforeRedo` and consumed in `afterUndo`/`afterRedo`, where the dependent cells get
   * validated.
   *
   * @type {Array}
   */
  #undoRedoDependentCells: unknown[] = [];

  /**
   * The addresses of the cells that the `UndoRedo` plugin writes through `setDataAtCell`. The Core
   * validates those on its own, so they are excluded from the dependent-cell validation.
   *
   * Cells restored through `setSourceDataAtCell` are deliberately absent: that path runs
   * `sourceDataValidator`, which never touches the `valid` flag, so excluding them would leave them
   * unvalidated by anyone.
   *
   * @type {Array}
   */
  #undoRedoChangedCells: unknown[] = [];

  /**
   * Whether the action being undone or redone wrote any cell data. Only then are the dependent cells
   * worth validating.
   *
   * @type {boolean}
   */
  #undoRedoWroteData = false;

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

    // The uncached read keeps the same no-extension semantics as the previous
    // `skipMetaExtension` read, without permanently materializing the cell meta.
    const cellMeta = this.hot._getMetaManager().getCellMetaUncached(
      this.hot.toPhysicalRow(visualRow) ?? visualRow, this.hot.toPhysicalColumn(visualColumn) ?? visualColumn,
      { visualRow, visualColumn },
    );
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
    // The event is engine-wide, so it also reaches instances that do not own the renamed sheet.
    // Repointing those would make them operate on a sheet belonging to another instance.
    // Sheet ids are compared rather than names: the engine matches names without looking at the
    // case but keeps the casing it was given, so `sheetName` may differ in case from the event's
    // display names. The rename is already applied here, so the new name resolves to the same id.
    if (this.engine?.getSheetId(newDisplayName) === this.sheetId) {
      this.#updateSheetNameAndSheetId(newDisplayName);
    }

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

      this.#undoRedoChangedCells = [];
      this.#undoRedoWroteData = false;
      this.#undoRedoDependentCells = this.engine!.undo() ?? [];
    });

    // Handling redo actions on data just using HyperFormula's UndoRedo mechanism.
    this.addHook('beforeRedo', (action: unknown) => {
      // Defensive: `Hooks.run` threads a preceding listener's non-`undefined` return value into
      // this argument, and the global bucket runs before this one. Without a trustworthy
      // `actionType` the engine step cannot be dispatched safely (`engine.redo()` vs the
      // `move_cells` replay path — the wrong branch runs the engine operation twice), so cancel
      // the redo instead of desyncing HyperFormula. The guard runs BEFORE `setPerformRedo(true)`
      // — a cancelled redo never fires `afterRedo`, so a flag set here would leak.
      if (typeof action !== 'object' || action === null || !('actionType' in action)) {
        return false;
      }

      this.indexSyncer!.setPerformRedo(true);
      this.#isRedoingMoveCells = action.actionType === 'move_cells';

      this.#undoRedoChangedCells = [];
      this.#undoRedoWroteData = false;
      // For a `move_cells` redo the engine operation runs in `commitPendingMoveCells` (the
      // Handsontable move must be validated first), so `engine.redo()` is not called here and
      // there are no engine-reported dependent cells to collect.
      this.#undoRedoDependentCells = this.#isRedoingMoveCells ? [] : (this.engine!.redo() ?? []);
    });

    this.addHook('afterUndo', (action: unknown) => {
      this.indexSyncer!.setPerformUndo(false);
      // Also clears the redo flags: a redo cancelled by a `beforeRedo` listener never fires
      // `afterRedo`, so without these resets the flags set in `beforeRedo` would leak until the
      // next successful redo.
      this.indexSyncer!.setPerformRedo(false);
      this.#isRedoingMoveCells = false;
      this.#validateUndoRedoDependentCells();

      // The structural hooks skip blocked sources, so undoing a row/column change reverts the
      // formulas inside the engine only - the source data has to be caught up separately.
      if (isStructuralAction(action) || isUndoneMoveCells(action)) {
        this.#syncFormulasToSourceData(canBreakReferences(action));
      }
    });

    this.addHook('afterRedo', (action: unknown) => {
      this.indexSyncer!.setPerformRedo(false);
      this.#validateUndoRedoDependentCells();

      if (isStructuralAction(action)) {
        this.#syncFormulasToSourceData(canBreakReferences(action));
      }
    });

    this.addHook('afterRedo', () => {
      this.#isRedoingMoveCells = false;
    });

    this.addHook('afterDetachChild', this.#onAfterDetachChild);
    this.addHook('beforeAutofill', this.#onBeforeAutofill);

    this.addHook('beforeMoveCells', this.#onBeforeMoveCells);
    this.addHook('afterMoveCells', this.#onAfterMoveCells);

    this.addHook('afterRenderer', this.#onAfterRenderer);

    this.#engineListeners?.forEach(([eventName, listener]) => this.engine!.on(eventName, listener));

    this.#refreshHyperlinksSetting();
    this.registerShortcuts();

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#unwrapRenderedHyperlinks();
    this.unregisterShortcuts();
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
      // Sheet ids are compared rather than names, because `sheetName` holds the engine's casing
      // while the setting keeps the one it was written with. An unknown name has no id, which
      // still differs from the current one and lets `switchSheet` report it.
      this.engine?.getSheetId(pluginSettings.sheetName) !== this.sheetId
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

    this.#refreshHyperlinksSetting();

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
    const sheetId = this.engine?.getSheetId(sheetName) ?? null;

    // Store the name the engine itself reports. The engine matches names without regard to case
    // but keeps the casing it was given, so the name passed here may differ from the engine's own.
    // Keeping them in step makes every exact-string reader of `sheetName` safe by construction.
    this.sheetName = (sheetId === null ? null : this.engine?.getSheetName(sheetId)) ?? sheetName;
    this.sheetId = sheetId;
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
   * Registers the shortcut that opens the link of the selected `HYPERLINK` cell. The anchor is kept
   * out of the tab order, so this is the only keyboard path to the link.
   *
   * @private
   */
  registerShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.addShortcut({
        keys: [['Alt', 'Enter']],
        callback: () => {
          const highlight = this.hot.getSelectedRangeActive()?.highlight;

          if (!highlight || highlight.row === null || highlight.col === null) {
            return;
          }

          const href = this.#getHyperlinkHref(highlight.row, highlight.col);

          if (href !== null) {
            this.hot.rootWindow.open(href, '_blank', 'noopener,noreferrer');
          }
        },
        stopPropagation: true,
        // The shortcut prevents the default action and stops propagation whenever `runOnlyIf`
        // passes, so it must claim the chord only for a cell that actually resolves to a link.
        // Testing just `isCell()` would swallow `Alt`+`Enter` grid-wide and break a host
        // application's own handler for it.
        runOnlyIf: (): boolean => {
          const highlight = this.hot.getSelectedRangeActive()?.highlight;

          return this.#hyperlinksEnabled &&
            !!highlight?.isCell() &&
            highlight.row !== null &&
            highlight.col !== null &&
            this.#getHyperlinkHref(highlight.row, highlight.col) !== null;
        },
        group: SHORTCUTS_GROUP,
      });
  }

  /**
   * Removes the shortcuts registered by the plugin.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Reads the `hyperlinks` plugin setting into the cached flag.
   */
  #refreshHyperlinksSetting() {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];
    const wasEnabled = this.#hyperlinksEnabled;

    this.#hyperlinksEnabled = isFormulasSettingsObject(pluginSettings) && pluginSettings.hyperlinks === true;

    // Turning the option off is the moment to clean up, not every subsequent draw: a renderer that
    // leaves its previous DOM in place would keep an anchor that no later render pass rewrites.
    // Doing it here keeps the per-cell path free for the default, disabled case.
    if (wasEnabled && !this.#hyperlinksEnabled) {
      this.#unwrapRenderedHyperlinks();
    }
  }

  /**
   * Unwraps every `HYPERLINK` anchor currently in the grid, including the overlay clones.
   *
   * Disabling the plugin removes the `afterRenderer` hook, so a renderer that leaves its previous
   * DOM in place would keep its cells clickable with nothing left to clean them up. The anchors are
   * matched by the plugin's own class, so no knowledge of the rendering internals is needed.
   */
  #unwrapRenderedHyperlinks() {
    this.hot.rootElement
      ?.querySelectorAll<HTMLElement>(`a.${HYPERLINK_CLASS_NAME}`)
      .forEach(link => this.#unwrapLink(link));
  }

  /**
   * Moves an anchor's content up into the anchor's own parent and drops the anchor.
   *
   * The insertion goes through `link.parentNode` rather than the cell: a renderer that leaves the
   * previous DOM in place can wrap an existing anchor, leaving it as `TD > div > a` instead of a
   * direct child. Inserting relative to the cell would then throw `NotFoundError` and, because this
   * runs inside `afterRenderer`, take the whole draw down with it.
   *
   * @param {Element} link The anchor to unwrap.
   */
  #unwrapLink(link: Element) {
    const { parentNode } = link;

    while (link.firstChild) {
      parentNode?.insertBefore(link.firstChild, link);
    }

    link.remove();
  }

  /**
   * Moves the content of a cell's `HYPERLINK` anchor back into the cell and drops the anchor. Loops
   * so that anchors nested by an older render pass are unwrapped as well.
   *
   * @param {HTMLTableCellElement} TD The rendered cell element.
   */
  #unwrapHyperlink(TD: HTMLTableCellElement) {
    // A cell rendered as plain text has no element children at all, which is the overwhelmingly
    // common case and the one that must not pay for a selector query on every render pass.
    if (TD.firstElementChild === null) {
      return;
    }

    let link = TD.querySelector(`a.${HYPERLINK_CLASS_NAME}`);

    while (link !== null) {
      this.#unwrapLink(link);
      link = TD.querySelector(`a.${HYPERLINK_CLASS_NAME}`);
    }
  }

  /**
   * Returns the URL that a cell should link to, or `null` when the cell must not become a link.
   *
   * The engine reports a hyperlink only for a cell whose root expression is `HYPERLINK()`, so a
   * nested call such as `=CONCATENATE("see ", HYPERLINK(...))` resolves to `null` here.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string|null} The resolved absolute URL, or `null`.
   */
  #getHyperlinkHref(row: number, column: number): string | null {
    if (
      this.sheetName === null ||
      !this.engine?.doesSheetExist(this.sheetName) ||
      !this.rowAxisSyncer ||
      !this.columnAxisSyncer ||
      !this.isFormulaCellType(row, column)
    ) {
      return null;
    }

    const url = this.engine.getCellHyperlink({
      sheet: this.sheetId,
      row: this.rowAxisSyncer.getHfIndexFromVisualIndex(row),
      col: this.columnAxisSyncer.getHfIndexFromVisualIndex(column),
    });

    if (url === undefined) {
      return null;
    }

    const href = resolveHyperlinkUrl(url, this.hot.rootDocument.baseURI);

    if (href === null) {
      warnOnce(this, HYPERLINK_WARN_KEY,
        `A "HYPERLINK" formula points at a URL that Handsontable refuses to link to ("${url}"). ` +
        'Only the "http", "https", "mailto" and "tel" schemes can be linked.');
    }

    return href;
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
   * Records that the action being undone or redone wrote cell data, and - when the Core validates
   * that write itself - which cells it wrote, so that `#validateUndoRedoDependentCells` can skip
   * them.
   *
   * `coreValidatesWrite` separates the two write paths. `setDataAtCell` ends in the Core's own
   * `validateCell`, so those cells must be excluded to avoid validating them twice.
   * `setSourceDataAtCell` does not - it runs `sourceDataValidator`, which never touches the `valid`
   * flag - so its cells must stay in the validation pass. Skipping them is also why their row index
   * is never translated here: that hook reports physical rows, unlike `afterSetDataAtCell`.
   *
   * @param {Array[]} changes An array of changes in format [[row, prop, oldValue, value], ...].
   * @param {string} source String that identifies the source of the hook call.
   * @param {boolean} coreValidatesWrite `true` when the Core validates the written cells itself.
   */
  #registerUndoRedoWrite(changes: CellChange[], source: string, coreValidatesWrite: boolean) {
    if (source !== 'UndoRedo.undo' && source !== 'UndoRedo.redo') {
      return;
    }

    if (!changes?.length) {
      return;
    }

    this.#undoRedoWroteData = true;

    if (!coreValidatesWrite) {
      return;
    }

    changes.forEach(([visualRow, prop]) => {
      if (typeof prop !== 'string' && typeof prop !== 'number') {
        return;
      }

      const visualColumn = this.hot.propToCol(prop);

      if (!isNumeric(visualRow) || !isNumeric(visualColumn)) {
        return;
      }

      const hfRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow);
      const hfColumn = this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn);

      // `-1` marks an index that is out of range or trimmed. Such an address matches no real engine
      // address, so keeping it would only risk colliding with a genuine dependent cell.
      if (hfRow === -1 || hfColumn === -1) {
        return;
      }

      this.#undoRedoChangedCells.push({
        address: { row: hfRow, col: hfColumn, sheet: this.sheetId },
      });
    });
  }

  /**
   * Validates the cells that the engine recalculated while an action was undone or redone.
   *
   * The `afterSetDataAtCell` and `afterSetSourceDataAtCell` listeners ignore changes coming from the
   * `UndoRedo` plugin, because the engine reverts them through its own undo stack. Without this step
   * the dependent formula cells would keep the `valid` flag they were given before the action was
   * reverted - a formula cell that turned into an error, and is a correct value again after the undo,
   * would stay marked as invalid.
   *
   * Runs only when the action wrote cell data. That covers undoing an edit (`setDataAtCell`) and
   * undoing a row or column removal, which restores the data with `setSourceDataAtCell`. Actions
   * that only reorder or hide - moving, sorting, filtering, merging - write no data, do not validate
   * dependent cells outside of undo either, and are skipped.
   */
  #validateUndoRedoDependentCells() {
    const dependentCells = this.#undoRedoDependentCells;
    const changedCells = this.#undoRedoChangedCells;
    const wroteData = this.#undoRedoWroteData;

    this.#undoRedoDependentCells = [];
    this.#undoRedoChangedCells = [];
    this.#undoRedoWroteData = false;

    if (wroteData && dependentCells.length) {
      this.validateDependentCells(dependentCells, changedCells);
    }
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

    const cellMeta = this.hot.getCellMetaTransient(row, column);

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
      const cellMeta = this.hot.getCellMetaTransient(visualRow, visualColumn);

      value = getValueGetterValue(value, cellMeta);

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

      const cellMeta = this.hot.getCellMetaTransient(visualRow, visualColumn);
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
        // The uncached read keeps this full source-data scan from permanently materializing
        // one meta object per cell (same no-extension semantics as `skipMetaExtension`).
        const cellMeta = this.hot._getMetaManager().getCellMetaUncached(
          this.hot.toPhysicalRow(rowIndex) ?? rowIndex, this.hot.toPhysicalColumn(columnIndex) ?? columnIndex,
          { visualRow: rowIndex, visualColumn: columnIndex },
        );

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
    // Fall back to the sheet this instance already owns. Without it every `loadData`/`updateData`
    // call adds a sheet and abandons the previous one - with its whole dependency graph - inside
    // the engine, which the engine then recalculates on every subsequent call.
    const sheetName = setupSheet(this.engine, settingsSheetName ?? this.sheetName);

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

      } else {
        // The sheet is reused, so leaving it untouched would keep the previous data in the engine
        // while the grid already shows the new one. Empty it instead of serving stale values.
        this.#internalOperationPending = true;

        const dependentCells = this.engine!.setSheetContent(this.sheetId, [[]]);

        // Emptying the sheet changes what the grids reading it compute, so they need a redraw.
        this.renderDependentSheets(dependentCells);

        this.#internalOperationPending = false;

        warn('The loaded data could not be passed to the formula engine, so the formulas were ' +
          'cleared. It most likely exceeds the engine\'s `maxRows` or `maxColumns` limit.');
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

    // The uncached read matters here: this hook fires inside bulk data reads (for example, the
    // filters column scan), so an eager read would materialize one meta per scanned cell.
    const cellMeta = this.hot._getMetaManager().getCellMetaUncached(
      this.hot.toPhysicalRow(visualRow) ?? visualRow, this.hot.toPhysicalColumn(visualColumn) ?? visualColumn,
      { visualRow, visualColumn },
    );

    if (cellMeta.type === 'date' && isNumeric(cellValue)) {
      cellValue = getDateFromExcelDate(cellValue);
    } else if (cellMeta.type === 'time' && isNumeric(cellValue)) {
      cellValue = getTimeFromHfTimeFraction(cellValue as number);
    }

    // If `cellValue` is an object it is expected to be an error
    valueHolder.value = hasValueProperty(cellValue) ? cellValue.value : cellValue;
  };

  /**
   * `afterRenderer` hook callback. Wraps the already rendered content of a `HYPERLINK` cell in an
   * anchor. The cell keeps its own renderer and its cell meta is left untouched, so disabling the
   * plugin or clearing the formula needs no cleanup.
   *
   * @param {HTMLTableCellElement} TD The rendered cell element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   */
  #onAfterRenderer = (TD: HTMLTableCellElement, row: number, column: number) => {
    if (!this.#hyperlinksEnabled || this.#internalOperationPending) {
      return;
    }

    // Walkontable recycles TD elements, and a renderer is free to leave its previous DOM in place.
    // Unwrapping first keeps this idempotent by construction: no anchor nests inside another one
    // across render passes, and the `href` is always rebuilt from the current formula instead of
    // inherited from whatever the previous pass resolved. Cleanup for the option being turned off
    // happens once, in `#refreshHyperlinksSetting`, so this path never runs for a disabled grid.
    this.#unwrapHyperlink(TD);

    const href = this.#getHyperlinkHref(row, column);

    if (href === null) {
      return;
    }

    const link = this.hot.rootDocument.createElement('a');

    link.className = HYPERLINK_CLASS_NAME;
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    // Cell content stays out of the grid's tab order; `Alt`+`Enter` is the keyboard path instead.
    link.tabIndex = -1;

    // The nodes are moved, never re-serialized, so a label containing markup stays text.
    while (TD.firstChild) {
      link.appendChild(TD.firstChild);
    }

    TD.appendChild(link);
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
      // While the write-back runs, reads must report what is really stored. Core reads the previous
      // value to build the `afterSetSourceDataAtCell` payload, and projecting the engine's formula
      // onto it would hand listeners an old value equal to the new one.
      this.#sourceDataSyncPending ||
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterSetDataAtCell = (changes: CellChange[], source: string) => {
    if (isBlockedSource(source)) {
      this.#registerUndoRedoWrite(changes, source, true);

      return;
    }

    // Skip HF re-sync when we are writing back to HOT after a moveCells HF operation.
    if (this.#moveCellsSyncPending) {
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterSetSourceDataAtCell = (changes: CellChange[], source: string) => {
    // Checked before the blocked-source branch so the write-back never reaches undo/redo tracking.
    if (this.#sourceDataSyncPending) {
      return;
    }

    if (isBlockedSource(source)) {
      this.#registerUndoRedoWrite(changes, source, false);

      return;
    }

    // Skip HF re-sync when we are writing back to HOT after a moveCells HF operation.
    if (this.#moveCellsSyncPending) {
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
   * Checks whether the engine's column indexes are Handsontable's *physical* ones.
   *
   * `#getProcessedSourceDataArray` feeds the engine rows projected to the visible columns only when
   * an array-of-arrays source actually skips physical indexes; array-of-objects rows arrive already
   * projected. In every other case the engine receives the raw physical row, so a `columns` list
   * that merely *reorders* the same number of columns leaves the engine on physical indexes while
   * the grid reads them through `colToProp`.
   *
   * @private
   * @returns {boolean}
   */
  #doesEngineHoldPhysicalColumns() {
    if (this.hot.countCols() < this.hot.countSourceCols()) {
      return false;
    }

    // Only the shape of the data matters, and it is the same for every row, so one row answers it.
    // `getSourceData()` would rebuild the whole dataset just to run `isArrayOfArrays` over it.
    return Array.isArray(this.hot.getSourceDataAtRow(0));
  }

  /**
   * Resolves an engine column index to the visual column to read from and the prop to write to.
   *
   * The two differ: `getSourceDataAtCell` resolves its column argument as a visual index, while
   * `setSourceDataAtCell` takes a prop. Returns `null` when the cell has no visual counterpart and
   * must be left alone.
   *
   * @private
   * @param {number} hfColumn The engine's column index.
   * @param {boolean} engineHoldsPhysicalColumns Result of `#doesEngineHoldPhysicalColumns`, passed in
   *   because it reads the whole source data and must not be recomputed per cell.
   * @returns {{ visualColumn: number, prop: string | number } | null}
   */
  #resolveEngineColumn(hfColumn: number, engineHoldsPhysicalColumns: boolean) {
    if (engineHoldsPhysicalColumns) {
      // The engine index is the physical one, which doubles as the prop for array-of-arrays data.
      const visualColumn = this.hot.propToCol(hfColumn);

      return isNumeric(visualColumn) && (visualColumn as number) >= 0
        ? { visualColumn: visualColumn as number, prop: hfColumn }
        : null;
    }

    const visualColumn = this.columnAxisSyncer!.getVisualIndexFromHfIndex(hfColumn);

    // A trimmed column has no visual index, and without one there is no prop to write to either.
    return visualColumn === -1 ? null : { visualColumn, prop: this.hot.colToProp(visualColumn) as string | number };
  }

  /**
   * Checks whether a stored cell value is the same formula as the one the engine holds, ignoring
   * how it was spelled.
   *
   * HyperFormula hands back a canonical form - `=sum( a1 : a2 )` comes out as `=SUM( A1:A2 )`. A
   * plain string comparison would read that as a change and rewrite formulas the operation never
   * touched, including ones with no cell references at all.
   *
   * @private
   * @param {*} stored The value held in the source data.
   * @param {string} engineFormula The formula reported by the engine.
   * @returns {boolean}
   */
  #isSameFormula(stored: unknown, engineFormula: string) {
    if (!isFormula(stored)) {
      return false;
    }

    try {
      return this.engine!.normalizeFormula(stored as string) === engineFormula;
    } catch {
      // Not something the engine can parse - treat it as different and let the write happen.
      return false;
    }
  }

  /**
   * Writes the formulas that HyperFormula rewrote during a structural change back into
   * Handsontable's source data.
   *
   * Inserting or removing rows and columns makes HyperFormula shift the references inside every
   * affected formula (`=SUM(A1:A3)` becomes `=SUM(A1:A4)` after a row is inserted into that
   * range). Until this sync runs, that rewrite lives only inside the engine and is projected onto
   * reads by the `modifySourceData` hook, which leaves the array the developer passed to
   * Handsontable holding the *old* formula. Any consumer that owns the data outside the grid — a
   * Redux store, a React `data` prop, a snapshot saved to a server — then keeps the stale text and
   * reverts the formula the moment that array is loaded back in.
   *
   * The engine changes reported by `addRows`/`removeRows`/... cannot drive this: they list cells
   * whose *value* changed, and a reference shift usually leaves the value intact. So the sheet's
   * formulas are read in bulk and only the cells that actually differ are written.
   *
   * The write is fenced with `#sourceDataSyncPending` so `afterSetSourceDataAtCell` does not push
   * the formulas straight back into the engine. External listeners still receive that hook, which
   * is what lets an outside store learn the new formula text - with a real previous value, because
   * the same flag switches the read projection off while Core builds that payload.
   *
   * Row and column *moves* (and sorting) are deliberately excluded: they reorder the engine's
   * indexes without touching the source data, so the two stop sharing a reference frame. While that
   * is the case nothing is written back at all - the read-time projection keeps handling it, exactly
   * as it did before.
   *
   * @private
   */
  #syncFormulasToSourceData(allowBrokenReferences = false) {
    if (
      this.#internalOperationPending ||
      this.sheetName === null ||
      !this.engine?.doesSheetExist(this.sheetName)
    ) {
      return;
    }

    // Once rows or columns have been moved or sorted, the engine and the source data no longer
    // share a reference frame, and the engine's formulas would be wrong in the source data's terms.
    if (!this.rowAxisSyncer!.isHfOrderPhysical() || !this.columnAxisSyncer!.isHfOrderPhysical()) {
      return;
    }

    const sheetId = this.engine.getSheetId(this.sheetName)!;
    const dimensions = this.engine.getSheetDimensions(sheetId);

    if (dimensions.width === 0 && dimensions.height === 0) {
      return;
    }

    const formulas = this.engine.getSheetFormulas(sheetId);
    const changes: Array<[number, string | number, unknown]> = [];
    // Resolved once for the run, and only if a formula cell is actually found - it reads the data.
    let engineHoldsPhysicalColumns: boolean | null = null;

    // Compare against what Handsontable stores, not against what it reports - `#onModifySourceData`
    // would otherwise answer with the engine's formula and hide every diff.
    this.#internalOperationPending = true;

    try {
      for (let hfRow = 0; hfRow < formulas.length; hfRow++) {
        const formulasRow = formulas[hfRow];

        if (!formulasRow) {
          continue;
        }

        // The order guard above means the engine's index IS the physical index, so trimmed rows
        // (Filters, `trimRows`) are reached too - they hold formulas that need the same catch-up.
        const physicalRow = hfRow;

        for (let hfColumn = 0; hfColumn < formulasRow.length; hfColumn++) {
          const formula = formulasRow[hfColumn];

          if (formula === undefined) {
            continue;
          }

          if (engineHoldsPhysicalColumns === null) {
            engineHoldsPhysicalColumns = this.#doesEngineHoldPhysicalColumns();
          }

          const column = this.#resolveEngineColumn(hfColumn, engineHoldsPhysicalColumns);

          if (column === null) {
            continue;
          }

          // `getSourceDataAtCell` takes a physical row and a visual column, `setSourceDataAtCell`
          // a physical row and a prop.
          const stored = this.hot.getSourceDataAtCell(physicalRow, column.visualColumn);

          if (stored === formula || this.#isSameFormula(stored, formula)) {
            continue;
          }

          // An engine formula can hold `#REF!` for reasons this change did not cause. Persisting it
          // would overwrite a still-good formula in the developer's array with an unrecoverable one,
          // so it is only written for the operations that can legitimately break a reference.
          if (!allowBrokenReferences && REF_ERROR_PATTERN.test(formula) && !REF_ERROR_PATTERN.test(String(stored))) {
            continue;
          }

          changes.push([physicalRow, column.prop, formula]);
        }
      }
    } finally {
      this.#internalOperationPending = false;
    }

    if (changes.length === 0) {
      return;
    }

    this.#sourceDataSyncPending = true;

    try {
      this.hot.setSourceDataAtCell(
        changes, undefined, undefined, `${toUpperCaseFirst(PLUGIN_KEY)}.syncSourceData`
      );
    } finally {
      this.#sourceDataSyncPending = false;
    }
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @param {number} visualRow Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterCreateRow = (visualRow: number, amount: number, source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const changes = this.engine!.addRows(this.sheetId,
      [this.rowAxisSyncer!.getHfIndexFromVisualIndex(visualRow), amount]);

    this.#syncFormulasToSourceData();
    this.renderDependentSheets(changes);
  };

  /**
   * `afterCreateCol` hook callback.
   *
   * @param {number} visualColumn Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterCreateCol = (visualColumn: number, amount: number, source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const changes = this.engine!.addColumns(this.sheetId,
      [this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn), amount]);

    this.#syncFormulasToSourceData();
    this.renderDependentSheets(changes);
  };

  /**
   * `afterRemoveRow` hook callback.
   *
   * @param {number} row Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterRemoveRow = (row: number, amount: number, physicalRows: number[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const removedSpans = coalesceIndexesToSpans(this.rowAxisSyncer!.getRemovedHfIndexes());

    const changes = this.engine!.batch(() => {
      this.#removeSpansFromEngine(removedSpans, 'removeRows');
    });

    this.#syncFormulasToSourceData(true);
    this.renderDependentSheets(changes);
  };

  /**
   * `afterRemoveCol` hook callback.
   *
   * @param {number} col Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  #onAfterRemoveCol = (col: number, amount: number, physicalColumns: number[], source: string) => {
    if (isBlockedSource(source)) {
      return;
    }

    const removedSpans = coalesceIndexesToSpans(this.columnAxisSyncer!.getRemovedHfIndexes());

    const changes = this.engine!.batch(() => {
      this.#removeSpansFromEngine(removedSpans, 'removeColumns');
    });

    this.#syncFormulasToSourceData(true);
    this.renderDependentSheets(changes);
  };

  /**
   * Checks whether every visual index in the `[visualFrom, visualTo]` span maps to consecutive
   * HyperFormula indexes on the given axis. Only then is a visual rectangle equivalent to the
   * single HF rectangle the `moveCells` engine operation works on.
   *
   * @param {AxisSyncer} syncer The row or column axis syncer.
   * @param {number} visualFrom The first visual index of the span.
   * @param {number} visualTo The last visual index of the span.
   * @returns {boolean}
   */
  #mapsToContiguousHfBlock(syncer: AxisSyncer, visualFrom: number, visualTo: number): boolean {
    const hfBase = syncer.getHfIndexFromVisualIndex(visualFrom);

    if (hfBase < 0) {
      return false;
    }

    for (let offset = 1; offset <= visualTo - visualFrom; offset++) {
      if (syncer.getHfIndexFromVisualIndex(visualFrom + offset) !== hfBase + offset) {
        return false;
      }
    }

    return true;
  }

  /**
   * `beforeMoveCells` hook callback.
   *
   * Converts the visual source range and target top-left corner to HyperFormula
   * (physical) coordinates, validates feasibility for a MOVE operation, and stores
   * the converted addresses for use in the `afterMoveCells` handler.
   *
   * Returns `false` to veto the whole operation when the source range is not a valid range
   * (the documented `false` veto value, or garbage folded into the argument by a preceding
   * listener's truthy return value), when HyperFormula reports the move is not possible
   * (e.g. the source or target contains an array formula), or when the visual ranges do not map
   * to contiguous HF blocks (trimmed/filtered/reordered indexes), because the engine rectangle
   * would then cover cells outside the visual operation.
   *
   * @param {CellRange|boolean} sourceRange The visual source range, or `false` after an earlier veto.
   * @param {CellCoords} targetTopLeft The visual top-left of the destination.
   * @param {boolean} isCopy `true` when copying (not moving) cells.
   * @returns {boolean|undefined} `false` to cancel the operation; `undefined` otherwise.
   */
  #onBeforeMoveCells = (sourceRange: unknown, targetTopLeft: CellCoords, isCopy: boolean) => {
    if (!isCellRangeLike(sourceRange)) {
      this.#pendingMoveCells = null;

      return false;
    }

    if (!this.engine || this.sheetId === null) {
      return;
    }

    const topStart = sourceRange.getTopStartCorner();
    const bottomEnd = sourceRange.getBottomEndCorner();
    const fromRow = topStart.row!;
    const fromCol = topStart.col!;
    const toRow = bottomEnd.row!;
    const toCol = bottomEnd.col!;
    const targetRow = targetTopLeft.row!;
    const targetCol = targetTopLeft.col!;

    // The engine operates on a single HF rectangle built from the mapped corners below. That is
    // only equivalent to the visual operation when every visual index in all four spans maps to
    // consecutive HF indexes. With Filters/TrimRows the HF sheet still contains the trimmed rows,
    // and sorting or manual move permutes the order — a rectangle would then move cells the grid
    // never touches, desyncing the engine from the data source. Veto instead.
    if (
      !this.#mapsToContiguousHfBlock(this.rowAxisSyncer!, fromRow, toRow) ||
      !this.#mapsToContiguousHfBlock(this.columnAxisSyncer!, fromCol, toCol) ||
      !this.#mapsToContiguousHfBlock(this.rowAxisSyncer!, targetRow, targetRow + (toRow - fromRow)) ||
      !this.#mapsToContiguousHfBlock(this.columnAxisSyncer!, targetCol, targetCol + (toCol - fromCol))
    ) {
      this.#pendingMoveCells = null;

      return false;
    }

    const hfFromRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(fromRow);
    const hfFromCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(fromCol);
    const hfToRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(toRow);
    const hfToCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(toCol);
    const hfTargetRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(targetRow);
    const hfTargetCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(targetCol);

    const source = {
      start: { sheet: this.sheetId, row: hfFromRow, col: hfFromCol },
      end: { sheet: this.sheetId, row: hfToRow, col: hfToCol },
    };
    const dest = { sheet: this.sheetId, row: hfTargetRow, col: hfTargetCol };

    if (!isCopy && !this.engine.isItPossibleToMoveCells(source, dest)) {
      this.#pendingMoveCells = null;

      return false;
    }

    if (isCopy) {
      // Pre-check the paste target for a COPY the same way isItPossibleToMoveCells guards a
      // MOVE (e.g. pasting over part of an array formula throws in `engine.paste`), so the
      // operation vetoes cleanly before the grid mutates instead of failing halfway through.
      const targetRegion = {
        start: dest,
        end: {
          sheet: this.sheetId,
          row: hfTargetRow + (hfToRow - hfFromRow),
          col: hfTargetCol + (hfToCol - hfFromCol),
        },
      };

      if (!this.engine.isItPossibleToSetCellContents(targetRegion)) {
        this.#pendingMoveCells = null;

        return false;
      }
    }

    this.#pendingMoveCells = {
      source,
      dest,
      isCopy,
      rect: { fromRow, fromCol, toRow, toCol, targetRow, targetCol, isCopy },
    };
  };

  /**
   * Executes the HyperFormula move or copy operation prepared in `beforeMoveCells`. Called by
   * the MoveCells plugin BEFORE any grid mutation (cell meta, selection, undo history),
   * so a failed engine operation aborts the whole `moveCells` operation atomically instead of
   * leaving the grid state recording a move whose data write never happened.
   *
   * For a MOVE, calls `engine.moveCells`, which physically relocates cell content and adjusts
   * all dependent formula references (Excel-style). For a COPY, calls `engine.copy` followed
   * by `engine.paste`, which duplicates the content with adjusted relative references. Note:
   * `engine.copy` reads cell values and must NOT be wrapped in `engine.batch` because batch
   * suspends evaluation, causing `copy` to throw `EvaluationSuspendedError`.
   *
   * During undo and non-move redo operations, the engine has already been advanced in the
   * `beforeUndo`/`beforeRedo` hook, so this method only enables the HOT-data sync in the
   * `afterMoveCells` listener. A move redo is validated first, then executed here to keep a
   * rejected move from advancing HyperFormula.
   *
   * This is the second half of a two-phase protocol with the MoveCells plugin: `beforeMoveCells`
   * prepares `#pendingMoveCells`, and this method commits it. It is internal despite being reachable
   * through `getPlugin('formulas')` — not part of the public API.
   *
   * @private
   * @returns {boolean} `true` when the engine operation succeeded (or was intentionally
   *   skipped); `false` when there is no prepared operation or the engine rejected it.
   */
  commitPendingMoveCells(): boolean {
    if (!this.engine || !this.#pendingMoveCells) {
      return false;
    }

    const { source, dest, isCopy, rect } = this.#pendingMoveCells;

    this.#pendingMoveCells = null;
    this.#moveCellsChanges = null;

    if (this.indexSyncer?.isPerformingUndoRedo() && !this.#isRedoingMoveCells) {
      this.#committedMoveCells = rect;

      return true;
    }

    // HyperFormula can still throw for cases the isItPossibleTo* pre-checks in
    // `beforeMoveCells` do not cover. Failing here is safe: the core has not mutated
    // anything yet and aborts the whole operation when `false` is returned.
    try {
      if (isCopy) {
        // copy() reads cell values and cannot run inside batch() (evaluation must not be suspended).
        this.engine.copy(source);
        this.#moveCellsChanges = this.engine.paste(dest);
      } else {
        this.#moveCellsChanges = this.engine.batch(() => {
          this.engine!.moveCells(source, dest);
        });
      }
    } catch (e) {
      const operation = isCopy ? 'copy/paste' : 'moveCells';
      const reason = e instanceof Error ? e.message : String(e);

      warn(`Formulas: HyperFormula operation failed during ${operation}: ${reason}`);

      return false;
    }

    this.#committedMoveCells = rect;

    return true;
  }

  /**
   * `afterMoveCells` hook callback.
   *
   * Runs after the engine operation already executed in `commitPendingMoveCells` (the core
   * calls it before mutating the grid, so a failed engine operation never reaches this hook).
   * Synchronises HOT's source data array with HF's state so that `getDataAtCell` returns
   * correct values for plain VALUE / EMPTY cells (formula cells are already served from HF
   * via the `modifyData` hook), then re-renders the dependent sheets. The sync is guarded by
   * `#moveCellsSyncPending` so that `afterSetDataAtCell` does not re-write the same values
   * back into HyperFormula.
   *
   * Takes no arguments on purpose. The engine has already moved the cells by the time this runs, so
   * there is nothing left to veto and bailing out would strand the data source out of sync with the
   * engine — which is what reading the replaceable `sourceRange` argument used to cause. The
   * operation is read from `#committedMoveCells` instead, captured before any listener could run.
   */
  #onAfterMoveCells = () => {
    const committed = this.#committedMoveCells;
    const dependentCells = this.#moveCellsChanges;

    // Consume the state on every run, including the ones that return early below, so a run without
    // a committed move behind it cannot pick up the previous operation's leftovers.
    this.#committedMoveCells = null;
    this.#moveCellsChanges = null;

    if (!this.engine || committed === null) {
      return;
    }

    // Sync HOT's source data with HF's updated state so that getDataAtCell returns
    // correct values for VALUE/EMPTY cells (formula cells are already served via modifyData).
    this.#syncHotDataAfterMoveCells(committed);

    // `#syncHotDataAfterMoveCells` covers the cells that were moved. Formulas elsewhere that
    // pointed at the moved range were rewritten by the engine too, and need the same catch-up.
    this.#syncFormulasToSourceData(true);

    // During undo/redo replay the engine step was skipped (dependentCells is null) and the
    // HOT re-render after undo/redo refreshes all dependent cells anyway.
    if (dependentCells !== null) {
      this.renderDependentSheets(dependentCells, true);
    }
  };

  /**
   * Synchronises HOT's raw data source array with HyperFormula's state after a
   * `moveCells` or copy operation.
   *
   * Formula cells are already served correctly through `modifyData` via `getCellValue`.
   * Plain VALUE / EMPTY cells, however, fall back to the raw HOT data, so after HF
   * moves the data the old raw values must be cleared from the source cells and the
   * serialised HF content must be written to the target cells.
   *
   * The write is fenced with `#moveCellsSyncPending` to prevent the `afterSetDataAtCell`
   * hook from re-syncing the same data back into HyperFormula.
   *
   * @private
   * @param {object} rect The committed operation in visual coordinates.
   */
  #syncHotDataAfterMoveCells(rect: MoveCellsRect) {
    const {
      fromRow: srcFromRow,
      fromCol: srcFromCol,
      toRow: srcToRow,
      toCol: srcToCol,
      targetRow: tgtFromRow,
      targetCol: tgtFromCol,
      isCopy,
    } = rect;

    const height = srcToRow - srcFromRow + 1;
    const width = srcToCol - srcFromCol + 1;

    // Build target values from HF serialized content (formula strings or raw values).
    const targetData: unknown[][] = [];

    for (let r = 0; r < height; r++) {
      const row: unknown[] = [];

      for (let c = 0; c < width; c++) {
        const hfRow = this.rowAxisSyncer!.getHfIndexFromVisualIndex(tgtFromRow + r);
        const hfCol = this.columnAxisSyncer!.getHfIndexFromVisualIndex(tgtFromCol + c);
        const serialized = this.engine!.getCellSerialized({
          sheet: this.sheetId,
          row: hfRow,
          col: hfCol,
        });

        row.push(serialized ?? null);
      }

      targetData.push(row);
    }

    this.#moveCellsSyncPending = true;

    try {
      if (!isCopy) {
        // Clear source cells in HOT's data first (HF already moved them out), so that an
        // overlapping source/target range does not null out cells the target write is about
        // to fill — the target data was already snapshotted from HF above.
        const nullRow: null[] = Array.from<null>({ length: width }).fill(null);
        const nullGrid: null[][] = Array.from({ length: height }, () => nullRow.slice());

        this.hot.populateFromArray(
          srcFromRow, srcFromCol, nullGrid,
          srcToRow, srcToCol,
          'auto'
        );
      }

      // Write target cells with HF-serialised content (formula strings preserved).
      // Use 'auto' source so UndoRedo does not record these writes as separate DataChangeActions
      // — they are part of the move and are covered by the MoveCellsAction in the undo stack.
      this.hot.populateFromArray(
        tgtFromRow, tgtFromCol, targetData,
        tgtFromRow + height - 1, tgtFromCol + width - 1,
        'auto'
      );
    } finally {
      this.#moveCellsSyncPending = false;
    }
  }

  /**
   * Removes the provided `[startIndex, amount]` spans from the engine in as few calls as possible.
   * One call handles many spans, so the engine pays its dependency-graph remap once per call instead
   * of once per removed row or column. The engine methods are variadic, so the spans are chunked to
   * keep the argument spread within call-stack limits; chunks run from the highest spans down, which
   * keeps the original coordinates of the not-yet-removed lower spans valid.
   *
   * @param {Array<Array<number>>} spans Ascending list of `[startIndex, amount]` spans to remove.
   * @param {'removeRows'|'removeColumns'} engineMethodName The engine removal method to call.
   */
  #removeSpansFromEngine(spans: [number, number][], engineMethodName: 'removeRows' | 'removeColumns') {
    for (let end = spans.length; end > 0; end -= REMOVAL_SPANS_CHUNK_SIZE) {
      const chunk = spans.slice(Math.max(0, end - REMOVAL_SPANS_CHUNK_SIZE), end);

      if (engineMethodName === 'removeRows') {
        this.engine!.removeRows(this.sheetId, ...chunk);

      } else {
        this.engine!.removeColumns(this.sheetId, ...chunk);
      }
    }
  }

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
