import { withPluginEngineWrite } from '../indexSyncer/pluginEngineWrite';
import type { HyperFormulaEngine } from './types';

/**
 * One recalculation that ended a suspension of the engine while a hold was open: the change list the
 * engine reported, and the cells the held writes before it set themselves (the Core validates those).
 */
export interface HeldRecalculation {
  readonly dependents: unknown[];
  readonly changed: unknown[];
}

/**
 * A grid that holds an engine: it holds it while its execution is suspended.
 */
export interface EvaluationHolder {
  readonly isDestroyed?: boolean;
  isExecutionSuspended(): boolean;
}

/**
 * What the writes held since the last recalculation do: set cells, or move cells in a way that changes values
 * (a removal, which can break references into `#REF!`) or replace a sheet. One recalculation covers one kind.
 */
type HeldWriteKind = 'cells' | 'moves';

/**
 * The state of one engine while grids that opted in to `formulas.batchEvaluation` have their execution
 * suspended (`batch()`, `batchExecution()`, `suspendExecution()`).
 */
interface EvaluationHold {
  /**
   * The opted-in grids whose execution is suspended.
   */
  readonly holders: Set<EvaluationHolder>;
  /**
   * Whether the engine is suspended by the plugin's own `suspendEvaluation()` call. Trusted only together
   * with `engine.isEvaluationSuspended()`.
   */
  owned: boolean;
  /**
   * Set around the plugin's own `suspendEvaluation()` call, so the `evaluationSuspended` listener tells it
   * apart from a suspension the host starts.
   */
  suspending: boolean;
  /**
   * How many of the plugin's own `resumeEvaluation()` calls are on the stack. A release re-entered from the
   * engine's events does not end the hold then: the `evaluationResumed` event of the outer resume is still
   * to come.
   */
  resuming: number;
  /**
   * What the writes held since the last recalculation do, or `null` when none is held.
   */
  heldWriteKind: HeldWriteKind | null;
  /**
   * Whether the engine listeners are attached. They are attached at the first suspension the plugin makes,
   * so a hold with no engine write (every render's internal `batchExecution()`) costs no engine call.
   */
  listening: boolean;
  /**
   * The cells the held writes set since the last recalculation.
   */
  changed: unknown[];
  /**
   * The recalculations since the hold began, validated when it ends.
   */
  recalculations: HeldRecalculation[];
  /**
   * The engine reads a held write needs once the engine is resumed (see `runAfterEvaluationFlush()`).
   */
  afterFlush: (() => void)[];
  /**
   * Set when the last holder left while the host still held the engine suspended: the hold ends, and its
   * recalculations are validated, when the host resumes the engine.
   */
  onSettled: ((recalculations: HeldRecalculation[]) => void) | null;
  readonly onSuspended: () => void;
  readonly onResumed: (changes: unknown[]) => void;
}

const holdsByEngine = new WeakMap<object, EvaluationHold>();

/**
 * @param {object} engine The engine.
 * @returns {object} A hold with no holder.
 */
function createHold(engine: HyperFormulaEngine): EvaluationHold {
  const hold: EvaluationHold = {
    holders: new Set(),
    owned: false,
    suspending: false,
    resuming: 0,
    heldWriteKind: null,
    listening: false,
    changed: [],
    recalculations: [],
    afterFlush: [],
    onSettled: null,
    onSuspended: () => {
      hold.owned = hold.suspending;
    },
    onResumed: changes => onEvaluationResumed(engine, hold, changes),
  };

  return hold;
}

/**
 * Ends the hold: detaches it from the engine and hands its recalculations over.
 *
 * @param {object} engine The engine.
 * @param {object} hold The hold.
 * @param {Function} onSettled Validates the recalculations.
 */
function endHold(
  engine: HyperFormulaEngine, hold: EvaluationHold, onSettled: (recalculations: HeldRecalculation[]) => void,
) {
  holdsByEngine.delete(engine);

  if (hold.listening) {
    engine.off('evaluationSuspended', hold.onSuspended);
    engine.off('evaluationResumed', hold.onResumed);
    hold.listening = false;
  }

  onSettled(hold.recalculations);
}

/**
 * The bookkeeping of every resume while the hold is open, whoever makes it: the plugin's own flush, a
 * host's `engine.batch()` or `resumeEvaluation()`, the `SHEET()`/`SHEETS()` refresh. The engine emits
 * `valuesUpdated` before this event, and a listener of that one can suspend the engine again, so the
 * ownership is given up and the deferred reads run only when the engine is still resumed. The plugin's
 * own flush claims its resume once it returns (`claimOwnRecalculation()`): a listener of `valuesUpdated`
 * that writes again makes its resumes first, and those must not take the cells of the writes the flush
 * resumes.
 *
 * @param {object} engine The engine.
 * @param {object} hold The hold.
 * @param {Array} changes The change list of the resume.
 */
function onEvaluationResumed(engine: HyperFormulaEngine, hold: EvaluationHold, changes: unknown[]) {
  hold.recalculations.push({ dependents: changes, changed: hold.changed });
  hold.changed = [];
  hold.heldWriteKind = null;

  if (engine.isEvaluationSuspended()) {
    return;
  }

  hold.owned = false;

  const afterFlush = hold.afterFlush;

  hold.afterFlush = [];
  afterFlush.forEach(read => read());

  if (hold.holders.size === 0 && hold.onSettled !== null) {
    endHold(engine, hold, hold.onSettled);
  }
}

/**
 * Gives the plugin's own resume the cells of the writes it resumed. The `evaluationResumed` listener has
 * recorded that resume already, with the cells written while it ran (a listener of its `valuesUpdated`
 * that wrote and suspended the engine again): those are still held, for the next recalculation.
 *
 * @param {object} hold The hold.
 * @param {Array} changes The change list the resume returned, the one its event carried.
 * @param {Array} changed The cells of the writes it resumed.
 */
function claimOwnRecalculation(hold: EvaluationHold, changes: unknown[], changed: unknown[]) {
  for (let index = hold.recalculations.length - 1; index >= 0; index--) {
    const recalculation = hold.recalculations[index]!;

    if (recalculation.dependents === changes) {
      recalculation.changed.forEach(cell => hold.changed.push(cell));
      hold.recalculations[index] = { dependents: changes, changed };

      return;
    }
  }

  hold.recalculations.push({ dependents: changes, changed });
}

/**
 * @param {object} engine The engine.
 * @param {object} [hold] Its hold.
 * @returns {boolean} `true` when the engine is suspended by the plugin's own `suspendEvaluation()`.
 */
function isOwned(engine: HyperFormulaEngine, hold: EvaluationHold | undefined): hold is EvaluationHold {
  return hold !== undefined && hold.owned && engine.isEvaluationSuspended();
}

/**
 * @param {*} change An engine change or a written cell (`{ address }`).
 * @returns {string|null} The key of its cell address, or `null` for a change with no cell (a named expression).
 */
function addressKey(change: unknown): string | null {
  const address = typeof change === 'object' && change !== null
    ? (change as { address?: { sheet?: unknown; row?: unknown; col?: unknown } }).address
    : undefined;

  return typeof address?.sheet === 'number' ? `${address.sheet}:${address.row}:${address.col}` : null;
}

/**
 * Adds a grid whose execution is suspended to the hold of its engine. Nothing reaches the engine yet: it
 * is suspended at the first plugin write (`beginHeldEngineWrite()`). A hold left to end at the host's
 * resume is held again, so its end is left to the release of this grid.
 *
 * @param {object} engine The engine.
 * @param {object} holder The grid.
 */
export function joinEvaluationHold(engine: HyperFormulaEngine, holder: EvaluationHolder): void {
  let hold = holdsByEngine.get(engine);

  if (hold === undefined) {
    hold = createHold(engine);
    holdsByEngine.set(engine, hold);
  }

  hold.holders.add(holder);
  hold.onSettled = null;
}

/**
 * Removes a grid from the hold of its engine.
 *
 * @param {object} engine The engine.
 * @param {object} holder The grid.
 * @returns {boolean} `true` when the grid was the last holder, so the caller flushes and settles the hold.
 */
export function leaveEvaluationHold(engine: HyperFormulaEngine, holder: EvaluationHolder): boolean {
  const hold = holdsByEngine.get(engine);

  return hold !== undefined && hold.holders.delete(holder) && hold.holders.size === 0;
}

/**
 * Takes out of the hold of an engine the grids whose execution is no longer suspended. Such a grid's
 * release did not run: an `afterResumeExecution` listener that runs before the plugin's (a global one) threw.
 *
 * @param {object} engine The engine.
 * @returns {boolean} `true` when a grid was taken out and none holds the engine anymore, so the caller
 *   flushes and settles the hold.
 */
export function leaveResumedHolders(engine: HyperFormulaEngine): boolean {
  const hold = holdsByEngine.get(engine);

  if (hold === undefined || hold.holders.size === 0) {
    return false;
  }

  let left = false;

  hold.holders.forEach((holder) => {
    if (holder.isDestroyed === true || !holder.isExecutionSuspended()) {
      hold.holders.delete(holder);
      left = true;
    }
  });

  return left && hold.holders.size === 0;
}

/**
 * Ends the hold of an engine that no grid holds anymore, once the engine is resumed: at once, or, when the
 * host still holds it suspended, at the host's resume. A hold re-entered from the plugin's own resume is
 * left to the release that made it.
 *
 * @param {object} engine The engine.
 * @param {Function} onSettled Validates the recalculations of the hold.
 */
export function settleEvaluationHold(
  engine: HyperFormulaEngine, onSettled: (recalculations: HeldRecalculation[]) => void,
): void {
  const hold = holdsByEngine.get(engine);

  if (hold === undefined || hold.holders.size > 0 || hold.resuming > 0) {
    return;
  }

  if (engine.isEvaluationSuspended() && hold.listening) {
    hold.onSettled = onSettled;

    return;
  }

  endHold(engine, hold, onSettled);
}

/**
 * @param {object} engine The engine.
 * @param {object} holder The grid.
 * @returns {boolean} `true` when the grid holds the engine.
 */
export function isEvaluationHolder(engine: HyperFormulaEngine, holder: EvaluationHolder): boolean {
  return holdsByEngine.get(engine)?.holders.has(holder) === true;
}

/**
 * @param {object|null} engine The engine.
 * @returns {boolean} `true` when the engine is suspended by the plugin and holds writes not recalculated yet.
 */
export function isEvaluationHeld(engine: HyperFormulaEngine | null | undefined): boolean {
  return !!engine && engine.isEvaluationSuspended() && isOwned(engine, holdsByEngine.get(engine));
}

/**
 * Recalculates the writes held on an engine when they are of another kind than the write about to join
 * them. The engine reports the changes of a suspension that set cells and then moved them at the addresses
 * from before the move, and the dependents of a cell write must not include what a removal broke
 * (`#REF!`): without a hold, they do not.
 *
 * @param {object} engine The engine.
 * @param {object} hold Its hold.
 * @param {string} kind The kind of the write.
 */
function flushHeldWritesOfOtherKind(engine: HyperFormulaEngine, hold: EvaluationHold, kind: HeldWriteKind) {
  if (isOwned(engine, hold) && hold.heldWriteKind !== null && hold.heldWriteKind !== kind) {
    flushEvaluationHold(engine);
  }
}

/**
 * Prepares a plugin write to the engine. When grids hold the engine and it is not suspended, the plugin
 * suspends it now, so the write and the ones after it are recalculated together. A write of another kind
 * than the held ones recalculates those first (`flushHeldWritesOfOtherKind()`).
 *
 * @param {object} engine The engine.
 * @param {boolean} [movesCells=false] Whether the write removes cells (a row or column removal).
 * @returns {boolean} `true` when the write runs inside a suspension the plugin owns.
 */
export function beginHeldEngineWrite(engine: HyperFormulaEngine, movesCells = false): boolean {
  const hold = holdsByEngine.get(engine);

  if (hold === undefined) {
    return false;
  }

  const kind: HeldWriteKind = movesCells ? 'moves' : 'cells';

  flushHeldWritesOfOtherKind(engine, hold, kind);

  if (engine.isEvaluationSuspended()) {
    if (hold.owned) {
      hold.heldWriteKind = kind;
    }

    return hold.owned;
  }

  if (hold.holders.size === 0) {
    return false;
  }

  if (!hold.listening) {
    engine.on('evaluationSuspended', hold.onSuspended);
    engine.on('evaluationResumed', hold.onResumed);
    hold.listening = true;
  }

  hold.suspending = true;

  try {
    engine.suspendEvaluation();
  } finally {
    hold.suspending = false;
  }

  hold.owned = true;
  hold.heldWriteKind = kind;

  return true;
}

/**
 * Prepares a plugin write that replaces a sheet's content. It never suspends the engine, but it joins a
 * suspension that is open, as a write that moves cells: held cell writes are recalculated first.
 *
 * @param {object|null} engine The engine.
 */
export function beginHeldSheetWrite(engine: HyperFormulaEngine | null | undefined): void {
  const hold = engine ? holdsByEngine.get(engine) : undefined;

  if (!engine || hold === undefined) {
    return;
  }

  flushHeldWritesOfOtherKind(engine, hold, 'moves');

  if (isOwned(engine, hold)) {
    hold.heldWriteKind = 'moves';
  }
}

/**
 * The options of `runEngineBatch()`.
 */
interface EngineBatchOptions {
  /**
   * Whether to join a suspension the host owns.
   */
  joinsAnySuspension?: boolean;
  /**
   * Whether the write moves cells (see `beginHeldEngineWrite()`).
   */
  movesCells?: boolean;
}

/**
 * Runs a plugin write that is one `engine.batch()` today. Inside a suspension the plugin owns, or one it
 * starts now (`beginHeldEngineWrite()`), the write joins it and returns no change: the dependents come from
 * the recalculation that ends it. Otherwise it is `engine.batch(fn)`, as before, so a suspension the host
 * owns is ended by it, as before. With `joinsAnySuspension`, a host's suspension is joined too: that site
 * already joined one, because a nested `engine.batch()` ends it.
 *
 * @param {object} engine The engine.
 * @param {Function} fn The writes.
 * @param {object} [options] The options.
 * @param {boolean} [options.joinsAnySuspension=false] Whether to join a suspension the host owns.
 * @param {boolean} [options.movesCells=false] Whether the write moves cells.
 * @returns {Array} The engine's change list, empty when the write joined a suspension.
 */
export function runEngineBatch(
  engine: HyperFormulaEngine,
  fn: () => void,
  { joinsAnySuspension = false, movesCells = false }: EngineBatchOptions = {},
): unknown[] {
  if (beginHeldEngineWrite(engine, movesCells) || (joinsAnySuspension && engine.isEvaluationSuspended())) {
    fn();

    return [];
  }

  return engine.batch(fn);
}

/**
 * Resumes an engine the plugin suspended, inside a plugin write scope: every grid the recalculation names
 * paints once, when the scope ends. A suspension the plugin does not own is left alone.
 *
 * @param {object|null} engine The engine.
 */
export function flushEvaluationHold(engine: HyperFormulaEngine | null | undefined): void {
  if (!engine || !engine.isEvaluationSuspended()) {
    return;
  }

  const hold = holdsByEngine.get(engine);

  if (!isOwned(engine, hold)) {
    return;
  }

  withPluginEngineWrite(engine, () => {
    // The cells of the writes this resume recalculates. A listener of its `valuesUpdated` that writes again
    // starts the list afresh.
    const changed = hold.changed;
    let changes: unknown[] = [];

    hold.changed = [];
    hold.heldWriteKind = null;
    hold.resuming += 1;

    try {
      changes = engine.resumeEvaluation();
    } finally {
      hold.resuming -= 1;
    }

    claimOwnRecalculation(hold, changes, changed);
  });
}

/**
 * Flushes the engine for a write that needs its change list right away (an undo or a redo), and takes
 * the recalculations of that flush out of the hold, so the release does not validate them again.
 *
 * @param {object} engine The engine.
 * @returns {object|null} The dependents and the written cells of the flush, or `null` when nothing was held.
 */
export function flushEvaluationHoldNow(engine: HyperFormulaEngine): HeldRecalculation | null {
  const hold = holdsByEngine.get(engine);

  if (!isOwned(engine, hold)) {
    return null;
  }

  const from = hold.recalculations.length;

  flushEvaluationHold(engine);

  const dependents = new Map<string, unknown>();
  const changed: unknown[] = [];

  hold.recalculations.splice(from).forEach((recalculation) => {
    recalculation.dependents.forEach((change) => {
      const key = addressKey(change);

      if (key !== null) {
        dependents.set(key, change);
      }
    });
    recalculation.changed.forEach(cell => changed.push(cell));
  });

  return { dependents: Array.from(dependents.values()), changed };
}

/**
 * Takes every recalculation recorded so far out of the hold of an engine, for a caller that validates them
 * now: a structure change is about to move the cells their addresses name. A hold whose own resume is on
 * the stack keeps them for the release that made it.
 *
 * @param {object|null} engine The engine.
 * @returns {Array} The recalculations, empty when there is none.
 */
export function takeHeldRecalculations(engine: HyperFormulaEngine | null | undefined): HeldRecalculation[] {
  const hold = engine ? holdsByEngine.get(engine) : undefined;

  if (hold === undefined || hold.resuming > 0) {
    return [];
  }

  return hold.recalculations.splice(0);
}

/**
 * Records the cells a held write set. The Core validates them itself, so the recalculation that ends the
 * suspension leaves them out of its dependents.
 *
 * @param {object|null} engine The engine.
 * @param {Array} changedCells The cells the write set (`{ address }`).
 * @returns {boolean} `false` when the write was not held, and the caller validates its dependents now.
 */
export function recordHeldWrite(engine: HyperFormulaEngine | null | undefined, changedCells: unknown[]): boolean {
  const hold = engine ? holdsByEngine.get(engine) : undefined;

  if (!engine || !isOwned(engine, hold)) {
    return false;
  }

  changedCells.forEach(cell => hold.changed.push(cell));

  return true;
}

/**
 * Defers an engine read a held write makes (the engine refuses value reads while suspended) to the moment
 * the engine resumes.
 *
 * @param {object|null} engine The engine.
 * @param {Function} read The read.
 * @returns {boolean} `false` when nothing is held, and the caller reads now.
 */
export function runAfterEvaluationFlush(engine: HyperFormulaEngine | null | undefined, read: () => void): boolean {
  const hold = engine ? holdsByEngine.get(engine) : undefined;

  if (!engine || !isOwned(engine, hold)) {
    return false;
  }

  hold.afterFlush.push(read);

  return true;
}

/**
 * Lists the dependents a hold's recalculations owe a validation, each cell once: the cells of every
 * recalculation that ended held cell writes, except the cells those writes set (the Core validates them).
 * A recalculation with no held cell write (a load, a row insert, a host's own batch) validates nothing, as
 * those writes did not before.
 *
 * @param {Array} recalculations The recalculations.
 * @returns {Array} The engine changes to validate.
 */
export function collectHeldDependents(recalculations: HeldRecalculation[]): unknown[] {
  const dependents = new Map<string, unknown>();

  recalculations.forEach(({ dependents: changes, changed }) => {
    if (changed.length === 0) {
      return;
    }

    const written = new Set(changed.map(addressKey));

    changes.forEach((change) => {
      const key = addressKey(change);

      if (key !== null && !written.has(key)) {
        dependents.set(key, change);
      }
    });
  });

  return Array.from(dependents.values());
}
