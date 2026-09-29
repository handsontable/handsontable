import type { HotInstance } from '../../core/types';
import type { OperationTransaction } from '../../core/operationScope';
import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { deepClone } from '../../helpers/object';
import { GridStateTracker, type GridStateSnapshot } from './snapshot/gridState';
import { createStep, type SelectionSnapshot, type StepRecord, type StepSelectionTarget } from './entry';
import { isStructural, restoreStep, type RestoreDirection } from './restore';
import { collectRestoredCells, toCellChanges, toVisibleCells, type RestoredCell } from './restoredCells';
import { haveSameIndexMaps } from '../../translations/indexMapperSnapshot';

const SHORTCUTS_GROUP = 'undoRedo';

export interface UndoRedoAction {
  actionType: string;
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
 * The object form of the `undo` option.
 */
export interface UndoRedoSettings {
  /**
   * The largest number of steps the undo stack keeps. Past it, the oldest step is dropped.
   */
  maxHistory?: number;
}

/**
 * @description
 * Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.
 *
 * The plugin is enabled by default. Each user action - an edit, a paste, a row removal, a sort, a
 * [`batch()`](@/api/core.md#batch) of calls - is recorded as one step. For the list of tracked actions and
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
   * The grid state after the last recorded (or restored) change - the state the next step starts from.
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
   * The selection each open transaction started with.
   */
  #selectionsBefore = new WeakMap<OperationTransaction, SelectionSnapshot>();

  /**
   * The structure epoch. A step is only ever restored in the epoch it was recorded in.
   */
  #epoch = 0;

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
   * the grid cannot see - for example, state your own code keeps outside the grid - by registering an
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

    this.#takeStep(this.doneActions, 'beforeUndoStackChange', 'afterUndoStackChange');

    if (this.hot.runHooks('beforeUndo', step) === false) {
      return;
    }

    const undoneActionsCopy = this.undoneActions.slice();

    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    // A listener that vetoes a row or column change of the replay leaves the grid as it was, and the
    // step goes back where it came from.
    const wasUndone = this.#restore(record, 'undo');

    (wasUndone ? this.undoneActions : this.doneActions).push(step);
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

    (wasRedone ? this.doneActions : this.undoneActions).push(step);
    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());

    if (wasRedone) {
      this.hot.runHooks('afterRedo', step);
    }
  }

  /**
   * Checks if undo action is available.
   *
   * @returns {boolean} Return `true` if undo can be performed, `false` otherwise.
   */
  isUndoAvailable(): boolean {
    return this.doneActions.length > 0;
  }

  /**
   * Checks if redo action is available.
   *
   * @returns {boolean} Return `true` if redo can be performed, `false` otherwise.
   */
  isRedoAvailable(): boolean {
    return this.undoneActions.length > 0;
  }

  /**
   * Clears undo and redo history.
   */
  clear(): void {
    this.doneActions.length = 0;
    this.undoneActions.length = 0;
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
    const maxHistory = this.#getMaxHistory();

    this.doneActions.push(step);

    // The oldest steps go first. Their records are released with them (they are weakly held).
    if (this.doneActions.length > maxHistory) {
      this.doneActions.splice(0, this.doneActions.length - maxHistory);
    }

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    this.undoneActions.length = 0;

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    return true;
  }

  /**
   * Returns the largest number of steps the undo stack keeps (`undo: { maxHistory }`), or `Infinity`.
   *
   * @returns {number}
   */
  #getMaxHistory(): number {
    const { undo } = this.hot.getSettings();

    if (typeof undo === 'object' && undo !== null) {
      const { maxHistory } = undo;

      if (typeof maxHistory === 'number' && Number.isInteger(maxHistory) && maxHistory > 0) {
        return maxHistory;
      }
    }

    return Infinity;
  }

  /**
   * Drops the whole history when the grid changed shape outside any recorded step - `updateData`, or
   * settings that reshape the data - since the step was recorded. Its snapshots are sized for a
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
   */
  #detectStructureChange() {
    const lastState = this.#lastState;

    if (this.#tracker === null || lastState === null) {
      return;
    }

    const current = this.#tracker.capture();

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
   * Drops the whole history and starts a new structure epoch.
   */
  #resetHistory() {
    this.clear();
    this.#epoch += 1;
    this.#lastState = null;
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

    this.#revalidateChangedCells(restoredCells, record.journal.some(isStructural));
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
   * journal does not carry `valid` - a recorded flag would be the verdict on another value.
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
    // restored row or column changes which columns are on screen - AutoColumnSize measures only what the
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

    this.#takeStep(this.doneActions, 'beforeUndoStackChange', 'afterUndoStackChange');

    const actionClone = deepClone(pendingAction);

    if (this.hot.runHooks('beforeUndo', actionClone) === false) {
      return;
    }

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
          this.doneActions.push(pendingAction);
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

    try {
      pendingAction.redo(this.hot, (result) => {
        this.#ignoreNewActions = false;

        if (result?.wasRedone === false) {
          this.undoneActions.push(pendingAction);
        } else {
          this.doneActions.push(pendingAction);
        }
      });
    } catch (error) {
      this.#ignoreNewActions = false;
      throw error;
    } finally {
      this.#lastState = this.#tracker?.capture() ?? null;
    }

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.hot.runHooks('afterRedo', actionClone);
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
  }

  /**
   * Starts a step: remembers the selection and whether the step is to be recorded at all, and brings
   * the base state up to date, so a change made outside any operation (a plugin reacting to a
   * setting) belongs to no step.
   *
   * @param {OperationTransaction} transaction The transaction that opened.
   */
  #onTransactionOpen = (transaction: OperationTransaction) => {
    if (this.#ignoreNewActions) {
      this.#ignoredTransactions.add(transaction);
    }

    this.#detectStructureChange();
    this.#selectionsBefore.set(transaction, this.hot.getSelected());
    this.#lastState = this.#tracker?.capture() ?? null;
  };

  /**
   * Records a finished step. The state before it is the state the previous step ended in - read now,
   * not when the transaction opened, so a step that committed while this one waited for a validator
   * is not undone together with it.
   *
   * @param {OperationTransaction} transaction The settled transaction.
   */
  #onTransactionSettle = (transaction: OperationTransaction) => {
    const tracker = this.#tracker;

    if (tracker === null) {
      return;
    }

    const after = tracker.capture();
    const before = this.#lastState ?? after;

    this.#lastState = after;

    if (
      this.#ignoredTransactions.has(transaction) ||
      BLOCKED_SOURCES.has(transaction.source) ||
      (transaction.journal.length === 0 && after === before)
    ) {
      return;
    }

    const { step, selection } = createStep(this.hot, transaction, before, this.#selectionsBefore.get(transaction));

    this.#records.set(step, {
      epoch: this.#epoch,
      before,
      after,
      journal: transaction.journal,
      selection,
    });

    this.#pushStep(step, transaction.source);
  };

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
