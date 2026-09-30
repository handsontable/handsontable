import type { JournalOp } from '../dataMap/dataJournal';

/**
 * One user action, from the first mutating call to the moment it settles. Every operation that runs
 * while it is open - a nested `setDataAtCell`, an `alter` inside a `batch`, the rows `minSpareRows`
 * adds behind a paste - joins it instead of opening one of its own, so the action is recorded as a
 * single step.
 */
export interface OperationTransaction {
  /**
   * A number unique within the grid's lifetime, increasing in the order the transactions opened.
   */
  readonly id: number;
  /**
   * The name of the outermost operation. It describes the whole transaction.
   */
  readonly name: string;
  /**
   * The source of the outermost operation.
   */
  readonly source: string | undefined;
  /**
   * The name of every operation that ran inside the transaction, the outermost one first.
   */
  readonly operations: string[];
  /**
   * The source of every operation that ran inside the transaction, in the same order as `operations`.
   */
  readonly sources: Array<string | undefined>;
  /**
   * The ordered record of data and cell meta changes the transaction made. Filled only while
   * journaling is enabled (see `OperationScope#setJournaling`).
   */
  readonly journal: JournalOp[];
  /**
   * Public details the outermost operation attached to the transaction (see
   * `OperationScope#describe`) - for example the index an `alter()` call was given. UndoRedo hands
   * them to its hooks as fields of the undo step.
   */
  readonly details: Record<string, unknown>;
  /**
   * How many synchronous operations of this transaction are still running.
   */
  depth: number;
  /**
   * How many asynchronous continuations (a validator the change waits for) are still pending.
   */
  holds: number;
  /**
   * Set when an operation of this transaction threw.
   */
  aborted: boolean;
}

/**
 * A pending asynchronous continuation of a transaction. `resume()` runs the continuation inside the
 * transaction it was taken from, and `release()` tells the scope that nothing more will run for it.
 */
export interface OperationHold {
  /**
   * Runs the callback inside the transaction the hold was taken from.
   */
  resume<T>(callback: () => T): T;
  /**
   * Releases the hold. The transaction settles once no operation of it runs and no hold is left.
   */
  release(): void;
}

type OpenListener = (transaction: OperationTransaction) => void;
type SettleListener = (transaction: OperationTransaction) => void;

/**
 * The hold handed out when no transaction is open. Its continuation runs as a plain call.
 */
const DETACHED_HOLD: OperationHold = Object.freeze({
  resume: <T>(callback: () => T): T => callback(),
  release: () => {},
});

/**
 * Groups the grid's mutating operations into transactions - one per user action.
 *
 * Core opens an operation in each mutating entry point (`setDataAtCell`, `alter`, `setCellMeta`,
 * `batch`, ...) and plugins open one in each public mutator. The first operation opens a
 * transaction, the ones nested inside it only join it, and the transaction settles when the last of
 * them returns. A change that waits for an asynchronous validator takes a hold, so its transaction
 * settles only once the change has been applied.
 *
 * The scope never swallows an error: an operation that throws marks the transaction as aborted and
 * still closes it, so a failed operation cannot leave the scope stuck open.
 */
export class OperationScope {
  /**
   * The transactions running right now. The top one receives the journal entries. There is
   * normally at most one: a held transaction leaves the stack until its continuation resumes.
   */
  #stack: OperationTransaction[] = [];
  /**
   * The id the next transaction gets.
   */
  #nextId = 1;
  /**
   * How many suppression scopes are open. While it is above zero no transaction opens and nothing
   * is journaled.
   */
  #suppressDepth = 0;
  /**
   * Tells whether the write paths record journal entries. Off until a consumer (UndoRedo) asks for
   * them, so a grid without one pays nothing on its write paths.
   */
  #journaling = false;
  /**
   * Called when a new transaction opens.
   */
  #openListeners = new Set<OpenListener>();
  /**
   * Called when a transaction settles.
   */
  #settleListeners = new Set<SettleListener>();
  /**
   * The transactions that settled, so none settles twice.
   */
  #settled = new WeakSet<OperationTransaction>();
  /**
   * The hold handed out while the scope is suppressed. Its continuation runs suppressed too: an
   * asynchronous continuation keeps the recording context of the call that started it, so a validator
   * answering after an undo returned does not record what it writes.
   */
  #suppressedHold: OperationHold = Object.freeze({
    resume: <T>(callback: () => T): T => this.suppress(callback),
    release: () => {},
  });

  /**
   * Returns the transaction the next journal entry belongs to, or `null` when no transaction is
   * open or the scope is suppressed.
   *
   * @returns {OperationTransaction|null}
   */
  current(): OperationTransaction | null {
    if (this.#suppressDepth > 0) {
      return null;
    }

    return this.#stack[this.#stack.length - 1] ?? null;
  }

  /**
   * Tells whether a transaction is open (and the scope is not suppressed).
   *
   * @returns {boolean}
   */
  isActive(): boolean {
    return this.current() !== null;
  }

  /**
   * Tells whether the scope is suppressed.
   *
   * @returns {boolean}
   */
  isSuppressed(): boolean {
    return this.#suppressDepth > 0;
  }

  /**
   * Turns the journal on or off.
   *
   * @param {boolean} enabled `true` to record journal entries.
   */
  setJournaling(enabled: boolean) {
    this.#journaling = enabled;
  }

  /**
   * Returns the transaction a write path should record its journal entry in, or `null` when
   * nothing is to be recorded (journaling is off, no transaction is open, or the scope is
   * suppressed). Write paths call it once and skip the extra reads a journal entry needs when it
   * returns `null`.
   *
   * @returns {OperationTransaction|null}
   */
  getRecordingTransaction(): OperationTransaction | null {
    return this.#journaling ? this.current() : null;
  }

  /**
   * Appends a journal entry to the recording transaction. Does nothing when no transaction records.
   *
   * @param {object} journalOp The entry to append.
   */
  record(journalOp: JournalOp) {
    this.getRecordingTransaction()?.journal.push(journalOp);
  }

  /**
   * Attaches public details to the open transaction - but only when called from the outermost
   * operation itself. A nested operation describes nothing: the transaction is the outer action,
   * and the details of one of its parts (the index of an `alter()` inside a `batch()`) would
   * misdescribe it.
   *
   * @param {object} details The details to merge in.
   */
  describe(details: Record<string, unknown>) {
    const transaction = this.current();

    if (transaction !== null && transaction.depth === 1) {
      Object.assign(transaction.details, details);
    }
  }

  /**
   * Runs the callback as an operation. Nested inside an open transaction, it joins it; otherwise it
   * opens a new one, which settles when the callback returns (or throws).
   *
   * @param {string} name The operation name.
   * @param {string|undefined} source The operation source.
   * @param {Function} callback The operation.
   * @returns {*} The callback's return value.
   */
  run<T>(name: string, source: string | undefined, callback: () => T): T {
    this.enter(name, source);

    let threw = true;

    try {
      const result = callback();

      threw = false;

      return result;
    } finally {
      this.leave(threw);
    }
  }

  /**
   * Starts an operation. Each call must be matched by one `leave()` call - prefer `run()`.
   *
   * @param {string} name The operation name.
   * @param {string|undefined} source The operation source.
   */
  enter(name: string, source: string | undefined) {
    if (this.#suppressDepth > 0) {
      return;
    }

    const openTransaction = this.#stack[this.#stack.length - 1];

    if (openTransaction) {
      openTransaction.depth += 1;
      openTransaction.operations.push(name);
      openTransaction.sources.push(source);

      return;
    }

    const transaction: OperationTransaction = {
      id: this.#nextId,
      name,
      source,
      operations: [name],
      sources: [source],
      journal: [],
      details: {},
      depth: 1,
      holds: 0,
      aborted: false,
    };

    this.#nextId += 1;
    this.#stack.push(transaction);

    // `enter()` either opens the transaction or does not: a listener that throws takes it off the
    // stack again, or every later operation would join it and nothing would settle any more. The
    // caller's `leave()` never runs, since `run()` enters outside its `try`.
    try {
      this.#openListeners.forEach(listener => listener(transaction));
    } catch (error) {
      this.#stack.splice(this.#stack.lastIndexOf(transaction), 1);
      throw error;
    }
  }

  /**
   * Ends the operation started by the matching `enter()` call.
   *
   * @param {boolean} [threw=false] `true` when the operation threw.
   */
  leave(threw = false) {
    if (this.#suppressDepth > 0) {
      return;
    }

    const transaction = this.#stack[this.#stack.length - 1];

    if (!transaction) {
      return;
    }

    if (threw) {
      transaction.aborted = true;
    }

    transaction.depth -= 1;

    if (transaction.depth > 0) {
      return;
    }

    this.#stack.pop();

    if (transaction.holds === 0) {
      this.#settle(transaction);
    }
  }

  /**
   * Takes a hold on the open transaction, so it does not settle until the hold is released. Used by
   * a change that waits for an asynchronous validator: the transaction must record the values the
   * change writes once the validator answers.
   *
   * @returns {OperationHold}
   */
  hold(): OperationHold {
    if (this.#suppressDepth > 0) {
      return this.#suppressedHold;
    }

    const transaction = this.current();

    if (transaction === null) {
      return DETACHED_HOLD;
    }

    transaction.holds += 1;

    let released = false;

    return {
      resume: <T>(callback: () => T): T => {
        if (released || this.#suppressDepth > 0) {
          return callback();
        }

        return this.#runInside(transaction, callback);
      },
      release: () => {
        if (released) {
          return;
        }

        released = true;
        transaction.holds -= 1;

        if (transaction.holds === 0 && transaction.depth === 0) {
          this.#settle(transaction);
        }
      },
    };
  }

  /**
   * Runs the callback with nothing recorded and no transaction opened - used while a recorded state
   * is being restored, so the restore cannot record itself.
   *
   * @param {Function} callback The callback to run.
   * @returns {*} The callback's return value.
   */
  suppress<T>(callback: () => T): T {
    this.#suppressDepth += 1;

    try {
      return callback();
    } finally {
      this.#suppressDepth -= 1;
    }
  }

  /**
   * Registers a listener called when a new transaction opens.
   *
   * @param {Function} listener The listener.
   */
  addOpenListener(listener: OpenListener) {
    this.#openListeners.add(listener);
  }

  /**
   * Removes a listener registered by `addOpenListener()`.
   *
   * @param {Function} listener The listener.
   */
  removeOpenListener(listener: OpenListener) {
    this.#openListeners.delete(listener);
  }

  /**
   * Registers a listener called when a transaction settles.
   *
   * @param {Function} listener The listener.
   */
  addSettleListener(listener: SettleListener) {
    this.#settleListeners.add(listener);
  }

  /**
   * Removes a listener registered by `addSettleListener()`.
   *
   * @param {Function} listener The listener.
   */
  removeSettleListener(listener: SettleListener) {
    this.#settleListeners.delete(listener);
  }

  /**
   * Drops every open transaction and listener. Nothing settles after this call.
   */
  destroy() {
    this.#stack.length = 0;
    this.#openListeners.clear();
    this.#settleListeners.clear();
    this.#journaling = false;
  }

  /**
   * Runs a held transaction's continuation. The transaction goes back on top of the stack for the
   * duration of the callback, so the writes it makes are journaled into it rather than into
   * whatever transaction happens to be open when the validator answers.
   *
   * @param {OperationTransaction} transaction The held transaction.
   * @param {Function} callback The continuation.
   * @returns {*} The callback's return value.
   */
  #runInside<T>(transaction: OperationTransaction, callback: () => T): T {
    const isOpen = this.#stack.includes(transaction);

    if (!isOpen) {
      this.#stack.push(transaction);
    }

    transaction.depth += 1;

    let threw = true;

    try {
      const result = callback();

      threw = false;

      return result;
    } finally {
      if (threw) {
        transaction.aborted = true;
      }

      transaction.depth -= 1;

      if (!isOpen) {
        const position = this.#stack.lastIndexOf(transaction);

        if (position !== -1) {
          this.#stack.splice(position, 1);
        }
      }

      // The last hold can be released inside its own continuation, while `depth` still counted it.
      if (transaction.depth === 0 && transaction.holds === 0) {
        this.#settle(transaction);
      }
    }
  }

  /**
   * Hands a finished transaction to the settle listeners, once.
   *
   * @param {OperationTransaction} transaction The transaction.
   */
  #settle(transaction: OperationTransaction) {
    if (this.#settled.has(transaction)) {
      return;
    }

    this.#settled.add(transaction);
    this.#settleListeners.forEach(listener => listener(transaction));
  }
}
