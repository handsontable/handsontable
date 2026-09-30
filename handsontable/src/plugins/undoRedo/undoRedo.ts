import type { HotInstance } from '../../core/types';
import type { OperationTransaction } from '../../core/operationScope';
import type { JournalOp } from '../../dataMap/dataJournal';
import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { deepClone } from '../../helpers/object';
import { warnOnce } from '../../helpers/console';
import { GridStateTracker, type GridStateSnapshot } from './snapshot/gridState';
import { createStep, type SelectionSnapshot, type StepRecord, type StepSelectionTarget } from './entry';
import { isStructural, restoreStep, type RestoreDirection } from './restore';
import { collectRestoredCells, toCellChanges, toVisibleCells, type RestoredCell } from './restoredCells';
import { addressesChangedColumn, type ColumnChangeTest } from './stepColumns';
import { haveSameIndexMaps } from '../../translations/indexMapperSnapshot';

const SHORTCUTS_GROUP = 'undoRedo';

export interface UndoRedoAction {
  actionType: string;
  /**
   * The source of the outermost operation the step records. An action registered through `done()`
   * carries only what it declares itself.
   */
  source?: string;
  /**
   * The name of every operation the step ran, the outermost one first.
   */
  operations?: string[];
  /**
   * The source of every operation the step ran, in the order of `operations`.
   */
  sources?: Array<string | undefined>;
  [key: string]: unknown;
}

export interface UndoRedoActionResult {
  wasUndone?: boolean;
}

/**
 * The shape of an action registered through `done()`: it knows how to reverse and replay itself.
 */
interface CustomAction {
  actionType?: string;
  canUndo?: (hot: HotInstance) => boolean;
  canRedo?: (hot: HotInstance) => boolean;
  undo: (hot: HotInstance, callback: (result?: UndoRedoActionResult) => void) => void;
  redo: (hot: HotInstance, callback: (result?: { wasRedone?: boolean }) => void) => void;
}

export const PLUGIN_KEY = 'undoRedo';
export const PLUGIN_PRIORITY = 1000;

/**
 * The change sources that never record an undo step: the undo and redo replays themselves, and the
 * rows and columns the grid adds on its own (`minSpareRows` and the like).
 */
const BLOCKED_SOURCES: ReadonlySet<string | undefined> = new Set(['UndoRedo.undo', 'UndoRedo.redo', 'auto']);

Hooks.getSingleton().register('beforeUndo');
Hooks.getSingleton().register('afterUndo');
Hooks.getSingleton().register('beforeRedo');
Hooks.getSingleton().register('afterRedo');

/**
 * Tells whether a value is a non-null object.
 *
 * @param {*} value The value to test.
 * @returns {boolean}
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Tells whether a value is an action registered through `done()`.
 *
 * @param {*} value The value to test.
 * @returns {boolean}
 */
function isCustomAction(value: unknown): value is CustomAction {
  return isRecord(value) && typeof value.undo === 'function' && typeof value.redo === 'function';
}

/**
 * Tells whether a journal adds or removes rows and columns only at the end of each axis, the way the
 * grid's own `auto` rows do. Any other row or column change renumbers the rows and columns the
 * recorded steps address.
 *
 * @param {JournalOp[]} journal The journal.
 * @param {GridStateSnapshot} before The state the journal started from (only the axis lengths are read).
 * @returns {boolean}
 */
function changesOnlyAxisEnds(
  journal: JournalOp[], before: { rows: { length: number }, columns: { length: number } },
): boolean {
  const counts = { row: before.rows.length, column: before.columns.length };

  return journal.every((op) => {
    if (op.type === 'insertRows' || op.type === 'insertColumns') {
      const axis = op.type === 'insertRows' ? 'row' : 'column';
      const atTheEnd = op.physicalIndex === counts[axis];

      counts[axis] += op.amount;

      return atTheEnd;
    }

    if (op.type === 'removeRows' || op.type === 'removeColumns') {
      const axis = op.type === 'removeRows' ? 'row' : 'column';
      const { physicalIndexes } = op;
      const first = counts[axis] - physicalIndexes.length;

      counts[axis] = first;

      // The indexes are ascending, so the removed ones are the last when each sits at its offset.
      return physicalIndexes.every((physicalIndex, offset) => physicalIndex === first + offset);
    }

    return true;
  });
}

/**
 * Returns the axis lengths a journal started from, walked back from the lengths it ended at.
 *
 * @param {JournalOp[]} journal The journal.
 * @param {GridStateSnapshot} after The state the journal ended in.
 * @returns {object} The row and column counts, as `{ rows: { length }, columns: { length } }`.
 */
function readStartLengths(journal: JournalOp[], after: GridStateSnapshot) {
  const counts = { row: after.rows.length, column: after.columns.length };

  for (let index = journal.length - 1; index >= 0; index -= 1) {
    const op = journal[index];

    if (op.type === 'insertRows' || op.type === 'insertColumns') {
      counts[op.type === 'insertRows' ? 'row' : 'column'] -= op.amount;
    } else if (op.type === 'removeRows' || op.type === 'removeColumns') {
      counts[op.type === 'removeRows' ? 'row' : 'column'] += op.physicalIndexes.length;
    }
  }

  return { rows: { length: counts.row }, columns: { length: counts.column } };
}

/**
 * The object form of the `undo` option.
 */
export interface UndoRedoSettings {
  /**
   * The largest number of steps the undo stack keeps: a whole number from `0` up, or `Infinity` (the
   * default). Past it, the oldest step is dropped; `0` keeps none. Any other value is ignored with a
   * warning, and the previous limit stays.
   */
  maxHistory?: number;
}

/**
 * Tells whether a value is a valid `maxHistory`.
 *
 * @param {*} value The value to test.
 * @returns {boolean}
 */
function isValidMaxHistory(value: unknown): value is number {
  return value === Infinity || (Number.isInteger(value) && (value as number) >= 0);
}

/**
 * @description
 * Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.
 *
 * The plugin is enabled by default. Each user action – an edit, a paste, a row removal, a sort, a
 * [`batch()`](@/api/core.md#batch) of calls – is recorded as one step. For the list of tracked actions and
 * the known limitations, see [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md).
 * @example
 * ```js
 * undo: true
 * ```
 * @class UndoRedo
 * @plugin UndoRedo
 */
export class UndoRedo extends BasePlugin {
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
   * Returns whether the plugin handles its own settings keys without a dedicated key list.
   */
  static get SETTING_KEYS(): true {
    return true;
  }

  /**
   * The list of registered action do undo.
   *
   * @private
   * @type {Array}
   */
  doneActions: unknown[] = [];

  /**
   * The list of registered action do redo.
   *
   * @private
   * @type {Array}
   */
  undoneActions: unknown[] = [];

  /**
   * Set while new actions must not be recorded.
   */
  #ignoreNewActions = false;

  /**
   * Captures and restores the grid state. Exists while the plugin is enabled.
   */
  #tracker: GridStateTracker | null = null;

  /**
   * The grid state after the last recorded (or restored) change – the state the next step starts from.
   */
  #lastState: GridStateSnapshot | null = null;

  /**
   * What the plugin keeps for each recorded step, keyed by the step object the stacks hold.
   */
  #records = new WeakMap<object, StepRecord>();

  /**
   * The transactions that opened while new actions were ignored. Decided when a transaction opens, not
   * when it settles: a change waiting for a validator settles after the caller that asked to ignore it
   * has already returned.
   */
  #ignoredTransactions = new WeakSet<OperationTransaction>();
  /**
   * The structure epoch each transaction opened in. A transaction that outlives its epoch – a `batch()`
   * that calls `updateData()` – journaled changes to a dataset that is gone, so it is not recorded.
   */
  #openEpochs = new WeakMap<OperationTransaction, number>();

  /**
   * The selection each open transaction started with.
   */
  #selectionsBefore = new WeakMap<OperationTransaction, SelectionSnapshot>();

  /**
   * The structure epoch. A step is only ever restored in the epoch it was recorded in.
   */
  #epoch = 0;

  /**
   * The transactions that opened and have not settled yet – most often a change waiting for its
   * validator.
   */
  #pending = new Set<OperationTransaction>();

  /**
   * The transactions that settled while another one was held after it had already changed the grid,
   * listed under that one (the host). They are recorded in the host's step.
   */
  #joined = new Map<OperationTransaction, OperationTransaction[]>();

  /**
   * The largest number of steps the undo stack keeps (`undo: { maxHistory }`).
   */
  #maxHistory = Infinity;

  /**
   * The field each physical column showed when the recorded steps were made – what a `columns`
   * settings update is compared against. `null` while no recorded step is kept.
   */
  #columnProps: unknown[] | null = null;

  /**
   * Set when a `columns` settings update came while a transaction was pending, so its check could not
   * run. It runs once the last pending transaction settles.
   */
  #owesColumnsCheck = false;

  /**
   * The flag that determines if new actions should be ignored.
   *
   * @private
   * @type {boolean}
   */
  get ignoreNewActions(): boolean {
    return this.#ignoreNewActions;
  }

  /**
   * Sets the flag that determines if new actions should be ignored.
   *
   * @private
   */
  set ignoreNewActions(value: boolean) {
    this.#ignoreNewActions = value;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link UndoRedo#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings().undo;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const scope = this.hot._getOperationScope();

    this.#maxHistory = this.#readMaxHistory(Infinity);
    this.#tracker = new GridStateTracker(this.hot);
    this.#lastState = null;
    scope.setJournaling(true);
    scope.addOpenListener(this.#onTransactionOpen);
    scope.addSettleListener(this.#onTransactionSettle);

    this.addHook('afterChange', this.#onAfterChange);
    this.addHook('afterUpdateData', this.#onAfterUpdateData);
    this.registerShortcuts();

    super.enablePlugin();
  }

  /**
   * Applies a settings update. Runs for every `updateSettings()` call (`SETTING_KEYS` is `true`), so it
   * must not disable and enable the plugin: `disablePlugin()` clears the history.
   *
   * @param {object} [newSettings] The settings passed to `updateSettings()`.
   */
  updatePlugin(newSettings?: Record<string, unknown>): void {
    if (newSettings !== undefined && 'undo' in newSettings) {
      this.#maxHistory = this.#readMaxHistory(this.#maxHistory);
    }

    // A lowered limit drops the oldest steps now, not only when the next one is recorded.
    this.#dropSteps(Math.max(0, this.doneActions.length - this.#maxHistory), 0);
    this.#checkSettingsUpdate(newSettings !== undefined && 'columns' in newSettings);

    super.updatePlugin(newSettings);
  }

  /**
   * Checks the history against a settings update right away, so the stacks and their hooks never
   * report steps that can no longer be restored. Settings that change the row count or the set of
   * index maps drop the whole history. A `columns` update that changes which field a column shows
   * drops only the steps that address such a column, with every step older than them, and keeps
   * the rest: a cell write is recorded by field, so it survives any reshape.
   *
   * It runs only while no transaction is pending. While one is, the next transaction to open checks
   * the row count and the index maps, and the `columns` check is owed: it runs once the last pending
   * transaction settles (`#owesColumnsCheck`).
   *
   * @param {boolean} namesColumns `true` when the update names `columns`.
   */
  #checkSettingsUpdate(namesColumns: boolean) {
    const tracker = this.#tracker;
    const lastState = this.#lastState;

    if (this.#pending.size > 0) {
      this.#owesColumnsCheck ||= namesColumns;

      return;
    }

    // An empty history has nothing to protect, and the next transaction captures the state anyway.
    // `updateSettings()` runs on every render in the React wrapper, so this skips a capture there.
    if (
      tracker === null || lastState === null ||
      (this.doneActions.length === 0 && this.undoneActions.length === 0)
    ) {
      return;
    }

    const current = tracker.capture();

    if (
      current.rows.length !== lastState.rows.length ||
      !haveSameIndexMaps(current.rows, lastState.rows) ||
      !haveSameIndexMaps(current.columns, lastState.columns)
    ) {
      this.#resetHistory();

      return;
    }

    const columnCountChanged = current.columns.length !== lastState.columns.length;

    if (columnCountChanged || namesColumns) {
      const recordedProps = this.#columnProps;
      const props = this.#readColumnProps();

      if (recordedProps === null) {
        // No recorded step says which fields it was made on, so a new column count cannot be checked.
        if (columnCountChanged) {
          this.#resetHistory();

          return;
        }
      } else if (
        recordedProps.length !== props.length || recordedProps.some((prop, column) => prop !== props[column])
      ) {
        const isChanged: ColumnChangeTest = physicalColumn => physicalColumn >= props.length ||
          physicalColumn >= recordedProps.length || recordedProps[physicalColumn] !== props[physicalColumn];

        this.#dropStepsWhere(record => addressesChangedColumn(this.hot, record, isChanged));
      } else if (!this.hot.isColumnModificationAllowed()) {
        // Every column shows the field it showed, but with `columns` set a column insert or removal
        // cannot be replayed any more: `alter()` refuses it.
        this.#dropStepsWhere(record => record.journal.some(op => op.type === 'insertColumns' ||
          op.type === 'removeColumns'));
      }

      this.#columnProps = this.doneActions.length > 0 || this.undoneActions.length > 0 ? props : null;
    }

    // The update is a change made outside any step: the next step starts from it, and the check a
    // transaction runs when it opens compares against it.
    this.#lastState = current;
  }

  /**
   * Reads the field each physical column shows now. A column with no visual index gets a value of
   * its own, so it never compares equal.
   *
   * @returns {Array}
   */
  #readColumnProps(): unknown[] {
    const count = this.hot.columnIndexMapper.getNumberOfIndexes();
    const props = new Array<unknown>(count);

    for (let physicalColumn = 0; physicalColumn < count; physicalColumn += 1) {
      const visualColumn = this.hot.toVisualColumn(physicalColumn);

      props[physicalColumn] = visualColumn === null ? Symbol('trimmed column') : this.hot.colToProp(visualColumn);
    }

    return props;
  }

  /**
   * Drops every recorded step that fails the test, together with every step that can only be undone
   * or redone after it – so the stacks keep no hole. Legacy `done()` actions are kept unless such a
   * step sits above them.
   *
   * @param {Function} fails Tells whether a step cannot be restored any more.
   */
  #dropStepsWhere(fails: (record: StepRecord) => boolean) {
    const lastFailing = (stack: unknown[]) => {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        const step = stack[index];
        const record = isRecord(step) ? this.#records.get(step) : undefined;

        if (record !== undefined && fails(record)) {
          return index;
        }
      }

      return -1;
    };

    this.#dropSteps(lastFailing(this.doneActions) + 1, lastFailing(this.undoneActions) + 1);
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
    this.clear();
    this.unregisterShortcuts();
    this.#stopRecording();
  }

  /**
   * Registers shortcuts responsible for performing undo/redo.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const runOnlyIf = (event?: KeyboardEvent): boolean => {
      return !(event?.altKey); // right ALT in some systems triggers ALT+CTR
    };
    const config = {
      runOnlyIf,
      group: SHORTCUTS_GROUP,
    };

    gridContext?.addShortcuts([{
      keys: [['Control/Meta', 'z']],
      callback: () => {
        this.undo();
      },
    }, {
      keys: [['Control/Meta', 'y'], ['Control/Meta', 'Shift', 'z']],
      callback: () => {
        this.redo();
      },
    }], { ...config });
  }

  /**
   * Unregister shortcuts responsible for performing undo/redo.
   *
   * @private
   */
  unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Stash information about performed actions.
   *
   * Every change made through the grid's API is recorded automatically. Use this method for a change
   * the grid cannot see – for example, state your own code keeps outside the grid – by registering an
   * action that knows how to reverse and replay itself.
   *
   * @example
   * ```js
   * // Register a custom action for state kept outside the grid.
   * function setUnits(units) {
   *   const undoRedo = hot.getPlugin('undoRedo');
   *   const previousUnits = currentUnits;
   *
   *   undoRedo.done(() => ({
   *     actionType: 'units',
   *     undo(instance, callback) {
   *       currentUnits = previousUnits;
   *       instance.render();
   *       callback();
   *     },
   *     redo(instance, callback) {
   *       currentUnits = units;
   *       instance.render();
   *       callback();
   *     },
   *   }), 'units');
   *
   *   currentUnits = units;
   *   hot.render();
   * }
   * ```
   * @fires Hooks#beforeUndoStackChange
   * @fires Hooks#afterUndoStackChange
   * @fires Hooks#beforeRedoStackChange
   * @fires Hooks#afterRedoStackChange
   * @param {Function} wrappedAction The action descriptor wrapped in a closure.
   * @param {string} [source] Source of the action. It is defined just for more general actions (not related to plugins).
   */
  done(wrappedAction: Function, source?: string) {
    if (this.#ignoreNewActions || BLOCKED_SOURCES.has(source)) {
      return;
    }

    // A wrappedAction returns `null` when the operation changed nothing. A no-op must not stack an
    // action, clear the redo stack, or fire any stack-change hook.
    const newAction: unknown = wrappedAction();

    if (newAction === null) {
      return;
    }

    this.#pushStep(newAction, source);
  }

  /**
   * Undo the last action performed to the table.
   *
   * @fires Hooks#beforeUndoStackChange
   * @fires Hooks#afterUndoStackChange
   * @fires Hooks#beforeRedoStackChange
   * @fires Hooks#afterRedoStackChange
   * @fires Hooks#beforeUndo
   * @fires Hooks#afterUndo
   */
  undo(): void {
    if (!this.isUndoAvailable()) {
      return;
    }

    const step = this.doneActions[this.doneActions.length - 1];
    const record = isRecord(step) ? this.#records.get(step) : undefined;

    if (record === undefined) {
      this.#undoCustomAction();

      return;
    }

    if (this.#dropIfStale(record) || !this.#canRestore(record.before)) {
      return;
    }

    // As for a redo, the stack changes only once every `beforeUndo` listener accepts the step: a
    // vetoed undo stays available.
    if (this.hot.runHooks('beforeUndo', step) === false) {
      return;
    }

    this.#takeStep(this.doneActions, 'beforeUndoStackChange', 'afterUndoStackChange');

    const undoneActionsCopy = this.undoneActions.slice();

    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    // A listener that vetoes a row or column change of the replay leaves the grid as it was, and the
    // step goes back where it came from.
    const wasUndone = this.#restore(record, 'undo');

    if (wasUndone) {
      this.undoneActions.push(step);
    } else {
      this.#putBackStep(this.doneActions, step, 'beforeUndoStackChange', 'afterUndoStackChange');
    }

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    if (wasUndone) {
      this.hot.runHooks('afterUndo', step);
    }
  }

  /**
   * Redo the previous action performed to the table (used to reverse an undo).
   *
   * @fires Hooks#beforeUndoStackChange
   * @fires Hooks#afterUndoStackChange
   * @fires Hooks#beforeRedoStackChange
   * @fires Hooks#afterRedoStackChange
   * @fires Hooks#beforeRedo
   * @fires Hooks#afterRedo
   */
  redo(): void {
    if (!this.isRedoAvailable()) {
      return;
    }

    const step = this.undoneActions[this.undoneActions.length - 1];
    const record = isRecord(step) ? this.#records.get(step) : undefined;

    if (record === undefined) {
      this.#redoCustomAction();

      return;
    }

    if (this.#dropIfStale(record) || !this.#canRestore(record.after)) {
      return;
    }

    // The stack changes only once every `beforeRedo` listener accepts the step: a vetoed redo stays
    // available, to be retried once the condition that vetoed it no longer applies.
    if (this.hot.runHooks('beforeRedo', step) === false) {
      return;
    }

    this.#takeStep(this.undoneActions, 'beforeRedoStackChange', 'afterRedoStackChange');

    const doneActionsCopy = this.doneActions.slice();

    this.hot.runHooks('beforeUndoStackChange', doneActionsCopy);

    const wasRedone = this.#restore(record, 'redo');

    if (wasRedone) {
      this.doneActions.push(step);
      this.#trimUndoStack();
    } else {
      this.#putBackStep(this.undoneActions, step, 'beforeRedoStackChange', 'afterRedoStackChange');
    }

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());

    if (wasRedone) {
      this.hot.runHooks('afterRedo', step);
    }
  }

  /**
   * Checks if undo action is available. It is not while an action that inserted or removed rows or
   * columns waits for an asynchronous validator: the grid then has a shape no recorded step describes.
   *
   * @returns {boolean} Return `true` if undo can be performed, `false` otherwise.
   */
  isUndoAvailable(): boolean {
    return this.doneActions.length > 0 && !this.#hasPendingStructuralStep();
  }

  /**
   * Checks if redo action is available. It is not while an action that inserted or removed rows or
   * columns waits for an asynchronous validator: the grid then has a shape no recorded step describes.
   *
   * @returns {boolean} Return `true` if redo can be performed, `false` otherwise.
   */
  isRedoAvailable(): boolean {
    return this.undoneActions.length > 0 && !this.#hasPendingStructuralStep();
  }

  /**
   * Clears undo and redo history.
   */
  clear(): void {
    this.doneActions.length = 0;
    this.undoneActions.length = 0;
    this.#columnProps = null;
  }

  /**
   * Pops the step at the top of a stack, announcing the change through the stack's two hooks.
   *
   * @param {Array} stack The stack.
   * @param {string} beforeHook The hook fired before the change.
   * @param {string} afterHook The hook fired after the change.
   */
  #takeStep(
    stack: unknown[],
    beforeHook: 'beforeUndoStackChange' | 'beforeRedoStackChange',
    afterHook: 'afterUndoStackChange' | 'afterRedoStackChange',
  ) {
    const stackCopy = stack.slice();

    this.hot.runHooks(beforeHook, stackCopy);
    stack.pop();
    this.hot.runHooks(afterHook, stackCopy, stack.slice());
  }

  /**
   * Puts a step that could not be restored back on the stack `#takeStep()` took it from, announced
   * through the same two hooks, so a listener of the stack hooks is never told the step left for good.
   *
   * @param {Array} stack The stack.
   * @param {*} step The step.
   * @param {string} beforeHook The hook fired before the change.
   * @param {string} afterHook The hook fired after the change.
   */
  #putBackStep(
    stack: unknown[],
    step: unknown,
    beforeHook: 'beforeUndoStackChange' | 'beforeRedoStackChange',
    afterHook: 'afterUndoStackChange' | 'afterRedoStackChange',
  ) {
    const stackCopy = stack.slice();

    this.hot.runHooks(beforeHook, stackCopy);
    stack.push(step);
    this.hot.runHooks(afterHook, stackCopy, stack.slice());
  }

  /**
   * Puts a step on the undo stack and clears the redo stack, announcing both changes. A
   * `beforeUndoStackChange` listener returning `false` keeps the step off the stack.
   *
   * @param {*} step The step.
   * @param {string} [source] The source of the change the step records.
   * @returns {boolean} `true` when the step was stacked.
   */
  #pushStep(step: unknown, source: string | undefined): boolean {
    const doneActionsCopy = this.doneActions.slice();

    if (this.hot.runHooks('beforeUndoStackChange', doneActionsCopy, source) === false) {
      return false;
    }

    const undoneActionsCopy = this.undoneActions.slice();

    this.doneActions.push(step);
    this.#trimUndoStack();
    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    this.undoneActions.length = 0;

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    return true;
  }

  /**
   * Drops the oldest steps past `maxHistory`. Runs inside the stack-change hook pair of whoever pushed
   * onto the undo stack. The dropped steps' records go with them (they are weakly held).
   */
  #trimUndoStack() {
    if (this.doneActions.length > this.#maxHistory) {
      this.doneActions.splice(0, this.doneActions.length - this.#maxHistory);
    }
  }

  /**
   * Reads `maxHistory` from the `undo` option. A value that is not a whole number from `0` up (or
   * `Infinity`) is ignored with a warning, the way the plugins' own option validators do it.
   *
   * @param {number} fallback The limit to keep when the value is not valid.
   * @returns {number}
   */
  #readMaxHistory(fallback: number): number {
    const { undo } = this.hot.getSettings();

    if (!isRecord(undo) || !('maxHistory' in undo) || undo.maxHistory === undefined) {
      return Infinity;
    }

    if (isValidMaxHistory(undo.maxHistory)) {
      return undo.maxHistory;
    }

    warnOnce(this.hot, `undo.maxHistory.${String(undo.maxHistory)}`,
      `${this.pluginName} Plugin: "maxHistory" option is not valid and it will be ignored.`);

    return fallback;
  }

  /**
   * Drops the oldest `undoCount` steps of the undo stack and the bottom `redoCount` steps of the redo
   * stack – the ones that can only be redone after every other – announcing each stack that changes.
   * A drop is not a user action, so it cannot be vetoed.
   *
   * @param {number} undoCount How many steps to drop from the undo stack.
   * @param {number} redoCount How many steps to drop from the redo stack.
   */
  #dropSteps(undoCount: number, redoCount: number) {
    this.#dropFromStack(this.doneActions, undoCount, 'beforeUndoStackChange', 'afterUndoStackChange');
    this.#dropFromStack(this.undoneActions, redoCount, 'beforeRedoStackChange', 'afterRedoStackChange');

    if (this.doneActions.length === 0 && this.undoneActions.length === 0) {
      this.#columnProps = null;
    }
  }

  /**
   * Drops the first `count` steps of a stack, announcing the change through the stack's two hooks.
   *
   * @param {Array} stack The stack.
   * @param {number} count How many steps to drop.
   * @param {string} beforeHook The hook fired before the change.
   * @param {string} afterHook The hook fired after the change.
   */
  #dropFromStack(
    stack: unknown[],
    count: number,
    beforeHook: 'beforeUndoStackChange' | 'beforeRedoStackChange',
    afterHook: 'afterUndoStackChange' | 'afterRedoStackChange',
  ) {
    if (count <= 0 || stack.length === 0) {
      return;
    }

    const stackCopy = stack.slice();

    this.hot.runHooks(beforeHook, stackCopy);
    stack.splice(0, count);
    this.hot.runHooks(afterHook, stackCopy, stack.slice());
  }

  /**
   * Tells whether a pending transaction already inserted or removed rows or columns and still waits
   * for a validator. The grid then has a shape no recorded state describes: an undo would restore
   * around it, and the structure check would read it as a change made outside any step.
   *
   * @returns {boolean}
   */
  #hasPendingStructuralStep(): boolean {
    for (const transaction of this.#pending) {
      if (transaction.holds > 0 && transaction.journal.some(isStructural)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns the pending transaction that already changed the grid and still waits for a validator -
   * the host a transaction that settles meanwhile joins. Its changes were made before the other
   * transaction's and it makes more after them, so the two can only be undone together: undone
   * apart, one of them replays at addresses the other has renumbered.
   *
   * @returns {OperationTransaction|undefined}
   */
  #findHost(): OperationTransaction | undefined {
    for (const transaction of this.#pending) {
      if (transaction.holds > 0 && transaction.journal.length > 0) {
        return transaction;
      }
    }

    return undefined;
  }

  /**
   * Lists a transaction and the ones that joined it, with their journals merged in the order the
   * entries were recorded.
   *
   * @param {OperationTransaction} transaction The transaction that settled.
   * @param {OperationTransaction[]} joined The transactions that joined it.
   * @returns {OperationTransaction} The transaction itself, or a view of the whole group.
   */
  #mergeJoined(transaction: OperationTransaction, joined: OperationTransaction[]): OperationTransaction {
    if (joined.length === 0) {
      return transaction;
    }

    const scope = this.hot._getOperationScope();
    const group = [transaction, ...joined];

    return {
      ...transaction,
      journal: group.flatMap(member => member.journal)
        .sort((left, right) => scope.getEntryOrder(left) - scope.getEntryOrder(right)),
      operations: group.flatMap(member => member.operations),
      sources: group.flatMap(member => member.sources),
    };
  }

  /**
   * Drops the whole history when the grid changed shape outside any recorded step – `updateData`, or
   * settings that reshape the data – since the step was recorded. Its snapshots are sized for a
   * dataset that is gone, so restoring one could only corrupt the grid.
   *
   * @param {StepRecord} record The step about to be restored.
   * @returns {boolean} `true` when the history was dropped.
   */
  #dropIfStale(record: StepRecord): boolean {
    this.#detectStructureChange();

    return record.epoch !== this.#epoch;
  }

  /**
   * Tells whether the state a step goes back to can be restored now. A step whose source shape was
   * recorded by a plugin that is disabled since (NestedRows) cannot, and it stays on its stack with
   * no hook fired.
   *
   * @param {GridStateSnapshot} target The state the step goes back to.
   * @returns {boolean}
   */
  #canRestore(target: GridStateSnapshot): boolean {
    return this.#tracker !== null && this.#tracker.canRestoreSourceStructures(target);
  }

  /**
   * Starts a new structure epoch when, since the last recorded state and without any step recording
   * the change, the row or column count changed, or a plugin that owns an index map was turned on or
   * off (the set of map names changed). Every step recorded before is dropped. A plugin that a
   * settings update disables and enables again keeps its map names, so it drops nothing.
   *
   * @param {GridStateSnapshot} [current] The grid state now, when the caller captured it already.
   */
  #detectStructureChange(current = this.#tracker?.capture() ?? null) {
    const lastState = this.#lastState;

    if (current === null || lastState === null) {
      return;
    }

    if (
      current.rows.length !== lastState.rows.length ||
      current.columns.length !== lastState.columns.length ||
      !haveSameIndexMaps(current.rows, lastState.rows) ||
      !haveSameIndexMaps(current.columns, lastState.columns)
    ) {
      this.#resetHistory();
    }
  }

  /**
   * Drops the whole history and starts a new structure epoch. The stack hooks announce it, so a toolbar
   * that follows them disables its buttons (the public `clear()` stays silent, as it always was).
   */
  #resetHistory() {
    this.#dropSteps(this.doneActions.length, this.undoneActions.length);
    this.#epoch += 1;
    this.#lastState = null;
    this.#pending.clear();
    this.#joined.clear();
    this.#owesColumnsCheck = false;
  }

  /**
   * Restores a recorded step and brings the viewport back to where the step happened.
   *
   * @param {StepRecord} record The step.
   * @param {string} direction `undo` or `redo`.
   * @returns {boolean} `false` when a listener vetoed the replay and the grid was left as it was.
   */
  #restore(record: StepRecord, direction: RestoreDirection): boolean {
    const tracker = this.#tracker;

    if (tracker === null) {
      return false;
    }

    const source = direction === 'undo' ? 'UndoRedo.undo' : 'UndoRedo.redo';
    let restoredCells: RestoredCell[] = [];
    const wasRestored = this.hot._getOperationScope().suppress(() => {
      if (!restoreStep(this.hot, tracker, record, direction)) {
        return false;
      }

      restoredCells = collectRestoredCells(this.hot, record, direction);

      const changes = toCellChanges(this.hot, restoredCells);

      // The restore writes the source directly, which fires no `afterChange`. Listeners that follow
      // the data (column summaries, filters, formulas, the host) hear about the restored cells once.
      // Still inside the suppressed scope, so what a listener writes in reply is not recorded.
      if (changes.length > 0) {
        this.hot.runHooks('afterChange', changes, source);
      }

      return true;
    });

    this.#lastState = tracker.capture();

    if (!wasRestored) {
      return false;
    }

    // Suppressed, so what the validators and their `afterValidate` listeners write in reply is not
    // recorded – a recorded step would empty the redo stack. They answer in a microtask, and the hold
    // `validateCell()` takes keeps them suppressed then too.
    this.hot._getOperationScope().suppress(() => {
      this.#revalidateChangedCells(restoredCells, record.journal.some(isStructural));
    });
    this.#restoreSelection(record.selection[direction], direction);

    return true;
  }

  /**
   * Puts back the selection a step recorded for the direction, when it recorded one.
   *
   * @param {object|null} target The selection to put back.
   * @param {string} direction `undo` or `redo`.
   */
  #restoreSelection(target: StepSelectionTarget | null, direction: RestoreDirection) {
    if (target === null) {
      return;
    }

    if (target.kind === 'cells') {
      if (direction === 'undo') {
        // The viewport follows the focused cell first and the ranges are put back without
        // scrolling, so an undo made from another cell does not jump the view to the restored range.
        this.hot.scrollToFocusedCell();
      }

      this.hot.selectCells(target.ranges, false, false);

      return;
    }

    this.hot.deselectCell();

    if (target.kind === 'rows') {
      this.hot.selectRows(target.from, target.to);
    } else {
      this.hot.selectColumns(target.from, target.to);
    }
  }

  /**
   * Validates the visible cells a restore wrote, so their `valid` flag describes the restored values.
   * The restore writes the source directly, which the validation of a change never sees, and the
   * journal does not carry `valid` – a recorded flag would be the verdict on another value.
   *
   * @param {RestoredCell[]} restoredCells The cells the restore wrote.
   * @param {boolean} structural `true` when the restore inserted or removed rows or columns.
   */
  #revalidateChangedCells(restoredCells: RestoredCell[], structural: boolean) {
    const cells = toVisibleCells(this.hot, restoredCells);

    if (cells.length === 0) {
      return;
    }

    const validated = cells.filter(([row, column]) => (
      this.hot.getCellValidator(this.hot.getCellMetaTransient(row, column))
    ));

    // The restore rendered already. A validation changes what a cell shows (its `valid` class), and a
    // restored row or column changes which columns are on screen – AutoColumnSize measures only what the
    // previous draw showed, so it sizes a column the restore brought back on the next render. An undo
    // of an edit needs neither, and skips the second render.
    if (validated.length === 0) {
      if (structural) {
        this.hot.render();
      }

      return;
    }

    let pending = validated.length;
    const onValidated = () => {
      pending -= 1;

      if (pending === 0 && this.hot && !this.hot.isDestroyed) {
        this.hot.render();
      }
    };

    validated.forEach(([row, column]) => {
      this.hot.validateCell(
        this.hot.getDataAtCell(row, column), this.hot.getCellMeta(row, column), onValidated, 'UndoRedo.revalidate',
      );
    });
  }

  /**
   * Undoes an action registered through `done()`, the way such actions have always been undone: the
   * action reverses itself and reports back through a callback.
   */
  #undoCustomAction() {
    const pendingAction = this.doneActions[this.doneActions.length - 1];

    if (!isCustomAction(pendingAction) || pendingAction.canUndo?.(this.hot) === false) {
      return;
    }

    const actionClone = deepClone(pendingAction);

    // As for a recorded step, a vetoed undo leaves the stack alone.
    if (this.hot.runHooks('beforeUndo', actionClone) === false) {
      return;
    }

    this.#takeStep(this.doneActions, 'beforeUndoStackChange', 'afterUndoStackChange');

    this.#ignoreNewActions = true;

    const undoneActionsCopy = this.undoneActions.slice();

    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    let wasUndone = true;

    try {
      pendingAction.undo(this.hot, (result) => {
        this.#ignoreNewActions = false;
        wasUndone = result?.wasUndone !== false;

        if (wasUndone) {
          this.undoneActions.push(pendingAction);
        } else {
          this.#putBackStep(this.doneActions, pendingAction, 'beforeUndoStackChange', 'afterUndoStackChange');
        }
      });
    } catch (error) {
      // An action that throws never reaches its settle callback. The flag is reset so later actions
      // are still recorded, and the partially applied action is discarded.
      this.#ignoreNewActions = false;
      throw error;
    } finally {
      this.#lastState = this.#tracker?.capture() ?? null;
    }

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    if (wasUndone) {
      this.hot.runHooks('afterUndo', actionClone);
    }
  }

  /**
   * Redoes an action registered through `done()`.
   */
  #redoCustomAction() {
    const pendingAction = this.undoneActions[this.undoneActions.length - 1];

    if (!isCustomAction(pendingAction) || pendingAction.canRedo?.(this.hot) === false) {
      return;
    }

    const actionClone = deepClone(pendingAction);

    // As for a recorded step, a vetoed redo leaves the stack alone.
    if (this.hot.runHooks('beforeRedo', actionClone) === false) {
      return;
    }

    this.#takeStep(this.undoneActions, 'beforeRedoStackChange', 'afterRedoStackChange');

    this.#ignoreNewActions = true;

    const doneActionsCopy = this.doneActions.slice();

    this.hot.runHooks('beforeUndoStackChange', doneActionsCopy);

    let wasRedone = true;

    try {
      pendingAction.redo(this.hot, (result) => {
        this.#ignoreNewActions = false;
        wasRedone = result?.wasRedone !== false;

        if (wasRedone) {
          this.doneActions.push(pendingAction);
          this.#trimUndoStack();
        } else {
          this.#putBackStep(this.undoneActions, pendingAction, 'beforeRedoStackChange', 'afterRedoStackChange');
        }
      });
    } catch (error) {
      this.#ignoreNewActions = false;
      throw error;
    } finally {
      this.#lastState = this.#tracker?.capture() ?? null;
    }

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());

    // As for an undo, an action that reports it could not redo is not announced as redone.
    if (wasRedone) {
      this.hot.runHooks('afterRedo', actionClone);
    }
  }

  /**
   * Stops listening to the operation scope and drops the grid state tracker.
   */
  #stopRecording() {
    const scope = this.hot._getOperationScope();

    scope.removeOpenListener(this.#onTransactionOpen);
    scope.removeSettleListener(this.#onTransactionSettle);
    scope.setJournaling(false);
    this.#tracker?.destroy();
    this.#tracker = null;
    this.#lastState = null;
    this.#pending.clear();
    this.#joined.clear();
    this.#owesColumnsCheck = false;
  }

  /**
   * Starts a step: remembers the selection and whether the step is to be recorded at all, and brings
   * the base state up to date, so a change made outside any operation (a plugin reacting to a
   * setting) belongs to no step.
   *
   * While a held transaction that already changed the grid is pending, the base state stays where it
   * was: those changes are that transaction's, not changes made outside any step, and the step it
   * records – which this transaction joins – starts before them.
   *
   * @param {OperationTransaction} transaction The transaction that opened.
   */
  #onTransactionOpen = (transaction: OperationTransaction) => {
    if (this.#ignoreNewActions) {
      this.#ignoredTransactions.add(transaction);
    }

    if (this.#findHost() === undefined) {
      const current = this.#tracker?.capture() ?? null;

      this.#detectStructureChange(current);
      this.#lastState = current;
    }

    this.#openEpochs.set(transaction, this.#epoch);
    this.#selectionsBefore.set(transaction, this.hot.getSelected());
    // Added last, so a capture that throws leaves nothing pending.
    this.#pending.add(transaction);
  };

  /**
   * Records a finished step, then runs the `columns` check a settings update made while a transaction
   * was pending owes, once none is pending any more.
   *
   * @param {OperationTransaction} transaction The settled transaction.
   */
  #onTransactionSettle = (transaction: OperationTransaction) => {
    this.#recordSettled(transaction);

    if (this.#owesColumnsCheck && this.#pending.size === 0) {
      this.#owesColumnsCheck = false;
      this.#checkSettingsUpdate(true);
    }
  };

  /**
   * Records a finished step. The state before it is the state the previous step ended in – read now,
   * not when the transaction opened, so a step that committed while this one waited for a validator
   * is not undone together with it.
   *
   * The exception is a transaction that settles while another one is held after it already changed
   * the grid (`#findHost()`): it joins that one's step, and the two are undone together.
   *
   * @param {OperationTransaction} transaction The settled transaction.
   */
  #recordSettled(transaction: OperationTransaction) {
    const tracker = this.#tracker;
    const joined = this.#joined.get(transaction) ?? [];
    const isUnrecorded = this.#ignoredTransactions.has(transaction) || BLOCKED_SOURCES.has(transaction.source);

    this.#pending.delete(transaction);
    this.#joined.delete(transaction);

    if (tracker === null) {
      return;
    }

    const host = this.#findHost();

    if (host !== undefined) {
      const hostJoined = this.#joined.get(host) ?? [];

      // An unrecorded transaction stays unrecorded, and is judged the way it is below: `#lastState`
      // is where the host started, so the lengths it started from are read back from its own journal.
      if (isUnrecorded) {
        const startLengths = readStartLengths(transaction.journal, tracker.capture());

        if (!changesOnlyAxisEnds(transaction.journal, startLengths)) {
          this.#resetHistory();

          return;
        }
      }

      // The ones that joined an unrecorded transaction go on to the host.
      this.#joined.set(host, hostJoined.concat(isUnrecorded ? joined : [transaction, ...joined]));

      return;
    }

    const after = tracker.capture();
    const before = this.#lastState ?? after;
    const group = this.#mergeJoined(transaction, joined);

    this.#lastState = after;

    if (isUnrecorded) {
      // Rows or columns an unrecorded change added or removed anywhere but at the end renumber the ones
      // every recorded step addresses, so the history is dropped. At the end they are harmless: a
      // restore fits the axis to them.
      if (!changesOnlyAxisEnds(group.journal, before)) {
        this.#resetHistory();
      }

      return;
    }

    if (
      (group.journal.length === 0 && after === before) ||
      this.#openEpochs.get(transaction) !== this.#epoch
    ) {
      return;
    }

    const { step, selection } = createStep(this.hot, group, before, this.#selectionsBefore.get(transaction));

    this.#records.set(step, {
      epoch: this.#epoch,
      before,
      after,
      journal: group.journal,
      selection,
    });

    if (!this.#pushStep(step, transaction.source)) {
      return;
    }

    // The fields the kept steps were made on. A step that inserted or removed columns renumbers them,
    // and it drops with every older step on any `columns` change, so the latest numbering is the one
    // every kept step shares. An owed check still needs the fields from before the update.
    if (
      !this.#owesColumnsCheck &&
      (this.#columnProps === null || this.#columnProps.length !== this.hot.columnIndexMapper.getNumberOfIndexes())
    ) {
      this.#columnProps = this.#readColumnProps();
    }
  }

  /**
   * Listens to the data change and if the source is `loadData` then clears the undo and redo history.
   *
   * @param {Array} changes The data changes.
   * @param {string} source The source of the change.
   */
  #onAfterChange = (changes: unknown[][], source: string) => {
    if (source === 'loadData') {
      this.#resetHistory();
    }
  };

  /**
   * Drops the history after `updateData()`: the recorded steps describe the dataset it replaced.
   */
  #onAfterUpdateData = () => {
    this.#resetHistory();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.clear();
    this.#stopRecording();
    this.doneActions = [];
    this.undoneActions = [];
    super.destroy();
  }
}
