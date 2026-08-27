import { BasePlugin } from '../base';
import { staticRegister } from '../../utils/staticRegister';
import { error, warn, warnOnce } from '../../helpers/console';
import { isNumeric } from '../../helpers/number';
import { isObject } from '../../helpers/object';
import { isDefined, isUndefined } from '../../helpers/mixed';
import { getRegisteredHotInstances, setupEngine, setupSheet, unregisterEngine, } from './engine/register';
import {
  coalesceIndexesToSpans,
  escapeTextValue,
  getDateFromExcelDate,
  getDateInHfFormat,
  getDateInHotFormat,
  getTimeFromHfTimeFraction,
  isDate,
  isDateValid,
  isEngineEscapedValue,
  isFormula,
  isPreservedText,
  normalizeValueForFormulaEngine,
  unescapeEngineBoundValue,
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
   * Guard flag set for the whole span of a Nested Rows detach – from `beforeDetachChild` until
   * `#onAfterDetachChild` has finished rewriting the moved rows in the engine.
   * Keeps `#syncFormulasToSourceData` out of that span: the detach MOVES rows inside the source data
   * and expresses the move as a row removal followed by a row creation, so between the two legs the
   * engine holds references the source data's own reference frame never had.
   *
   * @private
   * @type {boolean}
   */
  #nestedRowsDetachPending = false;

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

    // Both guard flags are cleared here, not only initialized at declaration. A throw inside the
    // span either of them opens leaves it set, and neither has a second closing path – see
    // `#onBeforeDetachChild` for the one `#onAfterDetachChild`'s `finally` cannot cover. Clearing
    // them on enable bounds that to the current enable rather than to the whole session, and it
    // also covers a `disablePlugin()` that lands mid-span.
    // Both guard flags are cleared here, not only initialized at declaration. A throw inside the
    // span either of them opens leaves it set, and neither has a second closing path – see
    // `#onBeforeDetachChild` for the one `#onAfterDetachChild`'s `finally` cannot cover. Clearing
    // them on enable bounds that to the current enable rather than to the whole session, and it
    // also covers a `disablePlugin()` that lands mid-span.
    this.#internalOperationPending = false;
    this.#nestedRowsDetachPending = false;

    this.engine = setupEngine(this.hot) ?? this.engine;

    if (!this.engine) {
      warn('Missing the required `engine` key in the Formulas settings. Please fill it with either an' +
        ' engine class or an engine instance.');

      return;
    }

    // Useful for disabling -> enabling the plugin using `updateSettings` or the API.
    if (this.sheetName !== null && !this.engine.doesSheetExist(this.sheetName)) {
      const sourceDataArray = this.#getProcessedSourceDataArray();

      this.#escapeSourceDataArray(sourceDataArray);

      const newSheetName = this.addSheet(this.sheetName, sourceDataArray);

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

    // Date and preserved-text escaping runs both here (for `updateSettings`-driven
    // initialization, where `afterLoadData` returns early) and in `afterLoadData` /
    // `afterUpdateData`, where the transient meta read provides composed cell properties.
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

    this.addHook('beforeDetachChild', this.#onBeforeDetachChild);
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
        const sourceDataArray = this.#getProcessedSourceDataArray();

        this.#escapeSourceDataArray(sourceDataArray);

        const newSheetName = this.addSheet(sheetName ?? undefined, sourceDataArray);

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
   * The engine's serialized content keeps the escape apostrophe that dates and preserved text values
   * were written with, so it is unescaped before the load – otherwise the apostrophe becomes part of
   * the grid's data.
   *
   * The unescaping has to run BEFORE `loadData`, because afterwards the apostrophe is already part
   * of the grid's data, past every reader that could tell it apart from a user's own leading
   * apostrophe.
   *
   * The two cases are unescaped differently. A RELOAD of the sheet this grid is already synced to
   * (what `#onAfterCellMetaReset` performs on the empty-data branch) is confirmed against the
   * grid's own source data – see `#unescapeAgainstSourceData` – so it survives the escaping
   * configuration being turned off between the write and the reload.
   *
   * A switch to a genuinely DIFFERENT sheet has no such reference: the grid's data belongs to the
   * sheet being left. It is confirmed against the cell meta instead, with an accepted limitation –
   * that sheet's layout has no relation to this grid's index maps, so a physically-keyed meta layer
   * (the `cell` array, or a column-level one under a non-identity column map) can be matched
   * against the wrong cell. Only the global settings layer is layout-independent and always matches.
   *
   * @param {string} sheetName Sheet name used in the shared HyperFormula instance.
   */
  switchSheet(sheetName: string): void {
    if (!this.engine?.doesSheetExist(sheetName)) {
      error(`The sheet named \`${sheetName}\` does not exist, switch aborted.`);

      return;
    }

    // Captured BEFORE the id is updated. A reload of the sheet this grid is already synced to - what
    // `#onAfterCellMetaReset` performs on the empty-data branch - can confirm the unescaping against
    // the grid's own source data, which a switch to a genuinely different sheet cannot.
    const isSameSheetReload = this.engine.getSheetId(sheetName) === this.sheetId;

    this.#updateSheetNameAndSheetId(sheetName);

    const serialized = this.#unescapeEngineSheetArray(
      this.engine.getSheetSerialized(this.sheetId), isSameSheetReload
    );

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

    // Values the escaping can never change skip the meta read: both `isDate()` and
    // `isPreservedText()` require a string. That read runs the user-provided `cells` function,
    // which is the expensive part of a bulk write.
    if (typeof newValue === 'string') {
      newValue = this.#escapeEngineBoundValue(newValue, this.hot.getCellMetaTransient(row, column));
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
   * Tells whether the source data is a plain array-of-arrays dataset. The shape is read from the
   * first source row, because `getSourceData()` shallow-clones the whole dataset on every call.
   *
   * This is the only implementation of that check. Together with `#areSourceColumnsSkipped()` it
   * answers both column-space questions the plugin asks – whether `#getProcessedSourceDataArray`
   * has to project a row down to the visible columns, and, through
   * `#doesEngineHoldPhysicalColumns()`, which column space the resulting array is in. Never inline
   * either check, or hardening one copy would make those two answers disagree.
   *
   * @returns {boolean}
   */
  #isSourceDataArrayOfArrays(): boolean {
    return Array.isArray(this.hot.getSourceDataAtRow(0));
  }

  /**
   * Tells whether the visible columns are a strict subset of the source columns – a `columns` list
   * that skips physical indexes rather than merely reordering them.
   *
   * @returns {boolean}
   */
  #areSourceColumnsSkipped(): boolean {
    return this.hot.countCols() < this.hot.countSourceCols();
  }

  /**
   * Get the source data array to be passed to the formula engine.
   * If the value is an object, utilize the valueGetter for that cell, otherwise return the value as is.
   *
   * @param {number} [row] The starting physical row index.
   * @param {number} [column] The starting physical column index (or visual, for array-of-objects data).
   * @param {number} [row2] The ending physical row index.
   * @param {number} [column2] The ending physical column index (or visual, for array-of-objects data).
   * @returns {Array} The source data array to be passed to the formula engine.
   */
  #getProcessedSourceDataArray(row?: number, column?: number, row2?: number, column2?: number) {
    // Every caller feeds the result to the engine, so this read has to report what Handsontable
    // actually stores – not what it reports. Left unguarded, `#onModifySourceData` answers every
    // formula cell with the formula the engine already holds, so a `loadData()`/`updateData()` call
    // that changes a formula's text reads the engine's PREVIOUS formula back and writes it straight
    // into the engine again, silently discarding the newly loaded one. The previous value is saved
    // and restored rather than cleared, so callers that already hold the flag keep it.
    const wasInternalOperationPending = this.#internalOperationPending;

    this.#internalOperationPending = true;

    let dataArray;

    try {
      dataArray = this.hot.getSourceDataArray(row, column, row2, column2);
    } finally {
      this.#internalOperationPending = wasInternalOperationPending;
    }

    const visibleColumnCount = this.hot.countCols();
    const isAoAWithSkippedColumns = this.#areSourceColumnsSkipped() && this.#isSourceDataArrayOfArrays();
    // `dataArray` is indexed from the requested start row, while `#getValueGetterValue` reads the
    // meta by a PHYSICAL row index. A partial read - the Nested Rows detach is the one caller that
    // makes one - would otherwise resolve every row's `valueGetter` from `rowOffset` rows too high
    // up the table.
    const rowOffset = row ?? 0;

    if (!isAoAWithSkippedColumns) {
      return dataArray.map((rowObject, rowIndex) => {
        const rowArray = Array.isArray(rowObject) ? rowObject : [];

        return rowArray.map((value: unknown, columnIndex: number) => {
          return this.#getValueGetterValue(rowOffset + rowIndex, columnIndex, value);
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

        projected.push(this.#getValueGetterValue(rowOffset + rowIndex, visualCol, rowArray[arrayIndex]));
      }

      return projected;
    });
  }

  /**
   * Escapes a single engine-bound value according to the cell meta: dates in Handsontable
   * format are rewritten to the engine format, while invalid dates and preserved text values
   * are escaped with the "'" sign (the engine's string-escape mechanism).
   *
   * This is the one escape rule, shared by every path that writes into the engine –
   * `syncChangeWithEngine`, `#onAfterSetSourceDataAtCell` and `#escapeSourceDataArray`. Keeping it
   * in one place is what stops those three from disagreeing about a value, which is how the
   * `setSourceDataAtCell` path came to send an invalid date to the engine unescaped while the other
   * two escaped it.
   *
   * The `date` branch RETURNS rather than falling through to the preserved text check, so a cell
   * declaring both `type: 'date'` and `preserveTextValue: true` is treated as a date. The
   * combination is contradictory - `isPreservedText()` requires `type: 'text'` - and the only way
   * the fall-through could ever fire was on a value the date branch had already rewritten.
   *
   * Callers gate this on `typeof value === 'string'`: both `isDate()` and `isPreservedText()`
   * require a string, so a non-string skips the cell meta read entirely, and that read is the
   * expensive part - it runs the user-provided `cells` function.
   *
   * @param {*} value Value to process.
   * @param {object} cellMeta The cell meta object of the value's cell.
   * @returns {*} The escaped value, or the original value when no escaping applies.
   */
  #escapeEngineBoundValue(value: unknown, cellMeta: { type?: string; preserveTextValue?: boolean }): unknown {
    if (isDate(value, cellMeta.type)) {
      if (isDateValid(value)) {
        // Rewriting the date from the Handsontable format to the engine format.
        return getDateInHfFormat(value);
      }

      if (!isFormula(value)) {
        // Escaping the value from date parsing using the "'" sign (the engine's string-escape mechanism).
        return escapeTextValue(value);
      }

      return value;
    }

    if (isPreservedText(value, cellMeta)) {
      // Escaping the value from the engine's value parsing using the "'" sign (the engine's
      // string-escape mechanism).
      return escapeTextValue(value);
    }

    return value;
  }

  /**
   * Unescapes a single value read back out of the engine, reading the cell meta the unescaping needs
   * from the given VISUAL coordinates.
   *
   * Values the unescaping can never change – non-strings, and strings without the leading escape
   * apostrophe – skip the meta read altogether, the same way `#escapeSourceDataArray` skips it on the
   * write side. That read is the expensive part of a per-cell scan, because it runs the user-provided
   * `cells` function.
   *
   * @param {*} value Value read from the engine.
   * @param {number} visualRow Visual row index of the cell whose meta the escape was applied from.
   * @param {number} visualColumn Visual column index of the cell whose meta the escape was applied from.
   * @returns {*} The unescaped value, or the original value when no unescaping applies.
   */
  #unescapeEngineBoundValueAt(value: unknown, visualRow: number, visualColumn: number): unknown {
    if (!isEngineEscapedValue(value)) {
      return value;
    }

    return unescapeEngineBoundValue(value, this.hot.getCellMetaTransient(visualRow, visualColumn));
  }

  /**
   * Reverses the engine-bound escaping on a whole sheet read out of the engine.
   *
   * The array is indexed the way the ENGINE is on both axes – by position in the index sequence –
   * which is not the visual coordinate. HyperFormula is fed trimmed rows as well, so a `trimRows` or
   * Filters map alone makes the engine's row index and the visual row index disagree. The escaping
   * was applied per PHYSICAL cell (`#escapeSourceDataArray`), so its inverse has to resolve the same
   * physical cell, and the engine index translates to it through the axis syncers.
   *
   * The whole scan is skipped – just like the escape scan – when `#needsEngineBoundEscaping()`
   * reports that no configuration layer can mark a cell for escaping, so a sheet switch in the
   * default configuration pays no per-cell meta read. Within the scan, values the unescaping can
   * never change skip the meta read for the same reason.
   *
   * Accepted residual: both the gate and the per-value confirmation read THIS grid's meta, while
   * the sheet may have been escaped by a DIFFERENT grid sharing the same engine instance – which is
   * the case `switchSheet` exists for. If grid A declares `preserveTextValue` and writes `0123456`,
   * the engine holds `'0123456`; grid B, declaring neither `date` nor `preserveTextValue`, loads
   * the apostrophe as data. Dropping the gate would not close this: `unescapeEngineBoundValue()`
   * still confirms the strip against grid B's meta and finds nothing to confirm it with. Closing it
   * needs the escape to be self-describing, or a per-sheet record of what was escaped – neither of
   * which the engine's serialized content carries. The apostrophe is the engine's own documented
   * string-escape, so the value is not corrupted, only un-stripped.
   *
   * @param {Array<Array<*>>} sheetArray Sheet content read out of the engine, in engine index order.
   * @returns {Array<Array<*>>} The unescaped content, or `sheetArray` itself when nothing can apply.
   */
  #unescapeEngineSheetArray(sheetArray: unknown[][], isSameSheetReload = false): unknown[][] {
    if (isSameSheetReload) {
      return this.#unescapeAgainstSourceData(sheetArray);
    }

    if (!this.#needsEngineBoundEscaping()) {
      return sheetArray;
    }

    const metaManager = this.hot._getMetaManager();
    // An engine index outside the dataset has no physical counterpart – the engine extends its own
    // sheet dimensions to calculate values – so it falls back to being read as a physical index.
    const toPhysical = (syncer: AxisSyncer | null, hfIndex: number) => {
      const physicalIndex = syncer?.getPhysicalIndexFromHfIndex(hfIndex) ?? -1;

      return physicalIndex === -1 ? hfIndex : physicalIndex;
    };

    return sheetArray.map((rowData: unknown[], hfRow: number) => {
      const physicalRow = toPhysical(this.rowAxisSyncer, hfRow);
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;

      return rowData.map((value: unknown, hfColumn: number) => {
        if (!isEngineEscapedValue(value)) {
          return value;
        }

        const physicalColumn = toPhysical(this.columnAxisSyncer, hfColumn);
        const visualColumn = this.hot.toVisualColumn(physicalColumn) ?? physicalColumn;
        // The transient read applies the `cells` function and the meta hooks without permanently
        // materializing one meta object per scanned cell.
        const cellMeta = metaManager.getCellMetaTransient(
          physicalRow, physicalColumn,
          { visualRow, visualColumn },
        );

        return unescapeEngineBoundValue(value, cellMeta);
      });
    });
  }

  /**
   * Reverses the engine-bound escaping on a RELOAD of the sheet this grid is already synced to,
   * by confirming every strip against the grid's own source data rather than against the cell meta.
   *
   * The meta-confirmed path cannot serve this case. It asks whether the CURRENT configuration would
   * escape the value, so the moment that configuration changes - `preserveTextValue` turned off, or
   * a column moved off `type: 'text'` - it stops recognizing an escape it applied itself, and the
   * apostrophe is loaded into the grid as data. That is reachable without a second sheet: a grid
   * built without `data` records `#hotWasInitializedWithEmptyData`, so every later
   * `#onAfterCellMetaReset` reloads through `switchSheet()`.
   *
   * Stripping unconditionally instead would corrupt the opposite case. A leading apostrophe in the
   * engine is not proof this plugin put it there - the engine uses the same character as its own
   * string escape, so a user's literal `'0777` typed into a cell this plugin does not escape is
   * stored with exactly one apostrophe and round-trips through it.
   *
   * The source data separates the two without needing either the old configuration or a record of
   * what was escaped: the grid's copy is never escaped, so the engine's value is this plugin's
   * escape of it precisely when it equals that copy with one apostrophe prepended.
   *
   * | grid holds     | engine holds    | verdict            |
   * |----------------|-----------------|--------------------|
   * | `0123456`      | `'0123456`      | escaped here, strip |
   * | `'0777`        | `''0777`        | escaped here, strip |
   * | `'0777`        | `'0777`         | the user's own, keep |
   * | `'=SUM(1,2)`   | `'=SUM(1,2)`    | the user's own, keep |
   *
   * @param {Array<Array<*>>} sheetArray Sheet content read out of the engine, in engine index order.
   * @returns {Array<Array<*>>} The unescaped content.
   */
  #unescapeAgainstSourceData(sheetArray: unknown[][]): unknown[][] {
    // An engine index outside the dataset has no physical counterpart – the engine extends its own
    // sheet dimensions to calculate values – so it falls back to being read as a physical index.
    const toPhysical = (syncer: AxisSyncer | null, hfIndex: number) => {
      const physicalIndex = syncer?.getPhysicalIndexFromHfIndex(hfIndex) ?? -1;

      return physicalIndex === -1 ? hfIndex : physicalIndex;
    };
    // The read has to report what Handsontable STORES: left unguarded, `#onModifySourceData`
    // answers every formula cell with the engine's own content, which is the very thing being
    // compared against.
    const wasInternalOperationPending = this.#internalOperationPending;

    this.#internalOperationPending = true;

    try {
      return sheetArray.map((rowData: unknown[], hfRow: number) => {
        // Values without the leading escape apostrophe can never change, so a row holding none of
        // them skips the source-data reads entirely.
        if (!rowData.some(isEngineEscapedValue)) {
          return rowData;
        }

        const physicalRow = toPhysical(this.rowAxisSyncer, hfRow);

        return rowData.map((value: unknown, hfColumn: number) => {
          if (!isEngineEscapedValue(value)) {
            return value;
          }

          const physicalColumn = toPhysical(this.columnAxisSyncer, hfColumn);
          const visualColumn = this.hot.toVisualColumn(physicalColumn) ?? physicalColumn;
          const storedValue = this.hot.getSourceDataAtCell(physicalRow, visualColumn);

          return (typeof storedValue === 'string' && `'${storedValue}` === value) ? storedValue : value;
        });
      });
    } finally {
      this.#internalOperationPending = wasInternalOperationPending;
    }
  }

  /**
   * Tells whether any configuration layer can mark a cell as a `date`-typed cell or as a preserved
   * text cell. Only those two markings make the escape scan change a value, so when no layer can
   * carry them the whole full-dataset scan is skipped – in the default configuration it would
   * translate indexes and read meta for every cell only to change nothing.
   *
   * The layers checked here are exactly the ones a cell meta can be composed from: the global
   * settings layer, the `columns` setting, the `cell` array, the already stored cell metas (which is
   * where `setCellMeta` and the applied `cell` array land), and the `beforeGetCellMeta` hook.
   *
   * Two things are opaque and therefore always count as "can mark a cell": a `columns` **function**
   * (its per-column result only exists at meta-build time) and a `cells` **function**. The latter is
   * part of the per-layer predicate, not a table-layer-only check, because `#runMetaExtension`
   * (`dataMap/metaManager/mods/dynamicCellMeta.ts`) reads `cellMeta.cells` off the cell meta object
   * and so resolves it through the prototype chain – a `cells` function declared on a `columns`
   * entry (`columns: [{ cells: () => ({ type: 'date' }) }]`) is honored just like a global one.
   *
   * The `columns` setting is probed by index rather than through `Array.isArray`, because
   * `core.ts` reads it as `columnSetting[j]`, which accepts an array-LIKE object too.
   *
   * Accepted residual: `afterGetCellMeta` is deliberately NOT part of the gate, because
   * `mergeCells`, `hiddenRows`, and `hiddenColumns` register it unconditionally – including it
   * would make the gate always true for any grid using merged cells or hidden rows/columns. As a
   * consequence, an `afterGetCellMeta` listener that injects `type: 'date'` or
   * `preserveTextValue` into a grid whose settings declare neither is not honored on the bulk load
   * path. Setting a cell type from a meta hook is not a documented pattern.
   *
   * @returns {boolean}
   */
  #needsEngineBoundEscaping(): boolean {
    const layerDeclaresEscaping = (layer: unknown): boolean => {
      const meta = layer as {
        type?: unknown, preserveTextValue?: unknown, cells?: unknown
      } | null | undefined;

      return !!meta && (
        meta.type === 'date' ||
        meta.preserveTextValue === true ||
        typeof meta.cells === 'function'
      );
    };
    const tableMeta = this.hot.getSettings();
    const columnsSetting = tableMeta.columns as
      { length?: number, [index: number]: unknown } | ((column: number) => unknown) | undefined;
    const columnsDeclareEscaping = (): boolean => {
      if (typeof columnsSetting === 'function') {
        return true;
      }

      if (typeof columnsSetting !== 'object' || columnsSetting === null) {
        return false;
      }

      const columnCount = Math.max(this.hot.countCols(), columnsSetting.length ?? 0);

      for (let column = 0; column < columnCount; column++) {
        if (layerDeclaresEscaping(columnsSetting[column])) {
          return true;
        }
      }

      return false;
    };

    if (
      layerDeclaresEscaping(tableMeta) ||
      columnsDeclareEscaping() ||
      (Array.isArray(tableMeta.cell) && tableMeta.cell.some(layerDeclaresEscaping)) ||
      this.hot.hasHook('beforeGetCellMeta')
    ) {
      return true;
    }

    // Checked last: unlike the settings layers above, this one allocates an array of every cell
    // meta materialized so far.
    return this.hot._getMetaManager().getCellsMeta().some(layerDeclaresEscaping);
  }

  /**
   * Escapes, in place, the source-data-array values that must reach the engine in a protected
   * form. The array rows always come in physical order (`getSourceDataArray` iterates the
   * underlying dataset). The column order depends on the data shape: plain array-of-arrays data
   * keeps the physical order, while array-of-objects data and the skipped-columns projection are
   * built in visual order. That distinction is read from `#doesEngineHoldPhysicalColumns()`, the one
   * place that answers it – see its note.
   *
   * The scan is skipped entirely when `#needsEngineBoundEscaping()` reports that no configuration
   * layer can mark a cell for escaping.
   *
   * @param {Array<Array<*>>} sourceDataArray Source data array to process.
   * @param {number} [rowOffset=0] Physical row index of the array's first row (non-zero for partial arrays).
   * @param {number} [columnOffset=0] Index of the array's first column, in the array's own column space.
   */
  #escapeSourceDataArray(sourceDataArray: unknown[][], rowOffset = 0, columnOffset = 0) {
    if (!this.#needsEngineBoundEscaping()) {
      return;
    }

    const columnsInVisualOrder = !this.#doesEngineHoldPhysicalColumns();
    const metaManager = this.hot._getMetaManager();

    sourceDataArray.forEach((rowData: unknown[], arrayRowIndex: number) => {
      const physicalRow = rowOffset + arrayRowIndex;
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;

      rowData.forEach((cellValue: unknown, arrayColumnIndex: number) => {
        // Values that the escaping can never change – non-strings, and formulas, which the engine
        // parses on its own – skip the meta read altogether. That read is the expensive part of
        // this full-dataset scan, and it runs the user-provided `cells` function.
        if (typeof cellValue !== 'string' || isFormula(cellValue)) {
          return;
        }

        const columnIndex = columnOffset + arrayColumnIndex;
        const visualColumn = columnsInVisualOrder
          ? columnIndex
          : (this.hot.toVisualColumn(columnIndex) ?? columnIndex);
        const physicalColumn = columnsInVisualOrder
          ? (this.hot.toPhysicalColumn(columnIndex) ?? columnIndex)
          : columnIndex;

        // The transient read applies the `cells` function and the meta hooks without permanently
        // materializing one meta object per scanned cell.
        const cellMeta = metaManager.getCellMetaTransient(
          physicalRow, physicalColumn,
          { visualRow, visualColumn },
        );

        sourceDataArray[arrayRowIndex][arrayColumnIndex] = this.#escapeEngineBoundValue(cellValue, cellMeta);
      });
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
    const metaManager = this.hot._getMetaManager();
    // An engine index outside the dataset has no physical counterpart – the engine extends its own
    // sheet dimensions to calculate values – so it falls back to being read as a physical index.
    const toPhysical = (syncer: AxisSyncer | null, hfIndex: number) => {
      const physicalIndex = syncer?.getPhysicalIndexFromHfIndex(hfIndex) ?? -1;

      return physicalIndex === -1 ? hfIndex : physicalIndex;
    };

    for (let populatedRowIndex = 0; populatedRowIndex < fillRangeData.length; populatedRowIndex += 1) {
      for (let populatedColumnIndex = 0; populatedColumnIndex < fillRangeData[populatedRowIndex].length;
        populatedColumnIndex += 1) {
        const populatedValue = fillRangeData[populatedRowIndex][populatedColumnIndex];
        // HyperFormula indexes – trimmed rows/columns (`trimRows`, Filters) still occupy an HF
        // index but no visual one, so these can diverge from the visual coordinates below. Plain
        // moves do not diverge them: a move resyncs HF's own row/column order to match visual order.
        const sourceRow = sourceStartRow + (populatedRowIndex % populationRowLength);
        const sourceColumn = sourceStartColumn + (populatedColumnIndex % populationColumnLength);
        // The meta is read by PHYSICAL coordinates, the way `#escapeSourceDataArray` and
        // `#onAfterSetSourceDataAtCell` read it, with the visual pair passed only as the hook
        // context. The two endpoints of the range are always selected cells and so always visible,
        // but the loop walks every HF index BETWEEN them – and a trimmed row keeps its HF index
        // while having no visual one. Reading such a source through the visual axis yields -1,
        // which `getCellMeta()` rejects outright ("Expecting an unsigned number"), aborting the
        // whole autofill.
        const physicalSourceRow = toPhysical(this.rowAxisSyncer, sourceRow);
        const physicalSourceColumn = toPhysical(this.columnAxisSyncer, sourceColumn);
        const visualSourceRow = this.hot.toVisualRow(physicalSourceRow) ?? physicalSourceRow;
        const visualSourceColumn = this.hot.toVisualColumn(physicalSourceColumn) ?? physicalSourceColumn;
        const sourceCellMeta = metaManager.getCellMetaTransient(
          physicalSourceRow, physicalSourceColumn,
          { visualRow: visualSourceRow, visualColumn: visualSourceColumn },
        );

        if (isDate(populatedValue, sourceCellMeta.type)) {
          if (populatedValue.startsWith('\'')) {
            // Populating values on HOT side without apostrophe.
            fillRangeData[populatedRowIndex][populatedColumnIndex] = populatedValue.slice(1);

            // Asked of the engine directly with the HF pair already in hand. `isFormulaCellType()`
            // would translate a visual pair back into this same one, which a trimmed source cannot
            // round-trip through.
          } else if (this.engine!.doesCellHaveFormula({
            sheet: this.sheetId, row: sourceRow, col: sourceColumn
          }) === false) {
            // Populating date in proper format, coming from the source cell.
            fillRangeData[populatedRowIndex][populatedColumnIndex] =
              getDateInHotFormat(populatedValue);
          }
        } else if (isPreservedText(populatedValue, sourceCellMeta) && populatedValue.startsWith('\'')) {
          // Populating values on the Handsontable side without the escape apostrophe.
          fillRangeData[populatedRowIndex][populatedColumnIndex] = populatedValue.slice(1);
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
    this.#closeLeakedDetachGuard();

    if (this.#hotWasInitializedWithEmptyData) {
      if (this.sheetName !== null) {
        this.switchSheet(this.sheetName);
      }

      return;
    }

    const sourceDataArray = this.#getProcessedSourceDataArray();

    this.#escapeSourceDataArray(sourceDataArray);

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

    this.#closeLeakedDetachGuard();

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

      // The guard only range-checks the sheet against the array dimensions, so escaping can run
      // after it – and then it is skipped altogether when the content is not replaced. Observable
      // side effect of that ordering: on the rejected branch the user's `cells` function and the
      // `beforeGetCellMeta`/`afterGetCellMeta` listeners are no longer invoked once per cell, where
      // the pre-guard scan used to invoke them before discarding the result.
      if (this.engine!.isItPossibleToReplaceSheetContent(this.sheetId, sourceDataArray)) {
        this.#escapeSourceDataArray(sourceDataArray);

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
   * Unlike `afterSetDataAtCell`, this hook reports **physical** row indexes.
   *
   * @param {Array[]} changes An array of changes in format [[physicalRow, prop, oldValue, value], ...].
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
    const metaManager = this.hot._getMetaManager();

    changes.forEach(([physicalRow, prop, , newValue]) => {
      if (typeof prop !== 'string' && typeof prop !== 'number') {
        return;
      }

      // This hook reports physical rows, and the engine holds trimmed rows as well – so the engine
      // row index is resolved straight out of the physical one. Going through the visual index
      // instead would have no answer for a trimmed row, and the fallback of reading its physical
      // index as a visual one lands on a different row of the engine.
      // The visual row is still resolved, because the cell meta read below needs it as its hook
      // context; a trimmed row keeps its own index there, which is what a meta hook that has no
      // visual cell to talk about gets.
      const visualRow = this.hot.toVisualRow(physicalRow) ?? physicalRow;
      // `propToCol` already returns a visual column index – it resolves the prop, or a physical
      // column index for array-based data, through `toVisualColumn`.
      const visualColumn = this.hot.propToCol(prop);

      if (!isNumeric(visualColumn)) {
        return;
      }

      const address = {
        row: this.rowAxisSyncer!.getHfIndexFromPhysicalIndex(physicalRow),
        col: this.columnAxisSyncer!.getHfIndexFromVisualIndex(visualColumn),
        sheet: this.sheetId
      };

      if (!this.engine?.isItPossibleToSetCellContents(address)) {
        warn(`Not possible to set source cell data at ${JSON.stringify(address)}`);

        return;
      }

      newValue = normalizeValueForFormulaEngine(newValue);

      // Values the escaping can never change skip the meta read: both `isDate()` and
      // `isPreservedText()` require a string. That read runs the user-provided `cells` function,
      // which is the expensive part of a bulk `setSourceDataAtCell`.
      if (typeof newValue === 'string') {
        // The meta is read by PHYSICAL coordinates, with the visual pair passed only as the hook
        // context the way `#escapeSourceDataArray` does it. Reading it through the visual row would
        // resolve a trimmed row's index fallback back into a DIFFERENT physical row, so the escaping
        // would consult a visible neighbor's meta instead of the written cell's own.
        const physicalColumn = this.hot.toPhysicalColumn(visualColumn) ?? visualColumn;
        const cellMeta = metaManager.getCellMetaTransient(
          physicalRow, physicalColumn,
          { visualRow, visualColumn },
        );

        newValue = this.#escapeEngineBoundValue(newValue, cellMeta);
      }

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
   * This is the single source of truth for that question. `#syncFormulasToSourceData` asks it
   * directly, and `#escapeSourceDataArray` asks for its negation – the column space of the array fed
   * to the engine is visual exactly when the engine is not on physical columns. Neither may
   * re-derive the answer from `#areSourceColumnsSkipped()` and `#isSourceDataArrayOfArrays()` on its
   * own, or hardening either of those checks would make the escape scan and the formula write-back
   * classify the same dataset differently.
   *
   * @private
   * @returns {boolean}
   */
  #doesEngineHoldPhysicalColumns(): boolean {
    return !this.#areSourceColumnsSkipped() && this.#isSourceDataArrayOfArrays();
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
   * A Nested Rows detach is excluded for the same reason, and needs its own flag to be recognized:
   * that plugin moves the rows inside the source data itself and reports the move as a row removal
   * followed by a row creation, so the axis order stays physical throughout and the exclusion above
   * cannot see it. Between the two legs the engine holds a reference to the detached row as broken,
   * and the removal leg is one of the operations allowed to persist a broken reference – so without
   * the flag the developer's array ends up with a `#REF!` in place of a formula whose target still
   * exists, one row further down.
   *
   * @private
   */
  #syncFormulasToSourceData(allowBrokenReferences = false) {
    if (
      this.#internalOperationPending ||
      this.#nestedRowsDetachPending ||
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

        // The serialized content keeps the escape apostrophe that dates and preserved text values
        // were written with, so it is unescaped before it goes back into the grid. The meta comes
        // from the SOURCE cell, which is what the escape was applied from – `preserveTextValue` and
        // `type` do not travel with a moved cell, so reading the destination's meta would leave the
        // apostrophe in the grid whenever the value lands on a cell that declares neither. This is
        // the same source-meta rule the autofill path (`#onBeforeAutofill`) already follows.
        row.push(serialized === null || serialized === undefined
          ? null
          : this.#unescapeEngineBoundValueAt(serialized, srcFromRow + r, srcFromCol + c));
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
   * `beforeDetachChild` hook callback.
   * Opens the guarded span in which `#syncFormulasToSourceData` must not run – see
   * `#nestedRowsDetachPending`. `#onAfterDetachChild`'s `try`/`finally` guarantees the span closes
   * whenever that listener runs, even if its own body throws. It does NOT guarantee the listener
   * runs at all: `afterDetachChild` also has an earlier listener, registered by the Nested Rows
   * plugin itself (`#onAfterDetachChild` in `nestedRows.ts`), and a throw there aborts the hook
   * emitter before this plugin's listener is reached, leaving the flag set. `enablePlugin()` clears
   * it, so that leak is bounded by the next enable rather than lasting the whole session.
   */
  #onBeforeDetachChild = () => {
    this.#nestedRowsDetachPending = true;
  };

  /**
   * Closes a `#nestedRowsDetachPending` span that `#onAfterDetachChild` never got to close – see
   * that flag and `#onBeforeDetachChild` for how the span is left open.
   *
   * Called at the head of the structural operations that re-establish the engine's relationship to
   * the source data (`afterLoadData`, `afterUpdateData`, `afterCellMetaReset`). By then the detach
   * the flag was guarding is over either way, so the span cannot still be legitimately open: the
   * detach runs to completion inside a single `afterDetachChild` emission, well before any of these
   * fire. Bounding it here matters because the flag's whole purpose is to suppress
   * `#syncFormulasToSourceData`, and a leaked one suppresses it silently – the developer's array
   * keeps stale formula text with nothing surfaced. `enablePlugin()` clears it too, but a grid that
   * is never re-enabled would otherwise stay broken for the rest of the session.
   */
  #closeLeakedDetachGuard() {
    this.#nestedRowsDetachPending = false;
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
    try {
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

      // `rowsData` is a partial array starting at the detached element's row, so the escaping needs
      // that row as its offset. The reported row index is a physical one – the Nested Rows data
      // manager derives it from the flattened source data (`dataManager.getRowIndex()`), not from the
      // visual order. That distinction matters, because collapsing rows in that plugin installs a
      // trimming map, under which the visual and physical row spaces genuinely differ.
      this.#escapeSourceDataArray(rowsData, finalElementRowIndex, 0);

      rowsData.forEach((row: unknown[], relativeRowIndex: number) => {
        row.forEach((value: unknown, colIndex: number) => {
          this.engine?.setCellContents({
            col: colIndex,
            row: finalElementRowIndex + relativeRowIndex,
            sheet: this.sheetId
          }, [[value]]);
        });
      });
    } finally {
      // Both flags are opened by this span – `#nestedRowsDetachPending` in `#onBeforeDetachChild`
      // and `#internalOperationPending` on the first line of the `try` – so both have to close
      // here. The mid-body reset above still matters (the flag must be down before
      // `setCellContents` runs); this is the net that catches a throw from a `cells()` function, a
      // `beforeGetCellMeta` listener, or the engine itself.
      this.#internalOperationPending = false;
      this.#nestedRowsDetachPending = false;
    }
  };

}
