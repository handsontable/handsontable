import type { CellChange } from '../settings';

/**
 * The cell meta of a validated cell, as far as the ledger reads it.
 */
export interface LedgerCellMeta {
  valid?: boolean;
}

/**
 * One `validateChanges()` call's place in the order of the writes to the validated cells.
 */
export interface WriteLedgerCall {
  /**
   * Registers a change whose cell is being validated.
   */
  register: (change: CellChange, key: string, cellMeta: LedgerCellMeta, structureVersion: number) => void;
  /**
   * Takes out the changes a newer write to the same cell has overtaken. `onOvertaken` receives the
   * validity the newer write left on the cell, because the overtaken validator wrote its own.
   */
  claim: (
    changes: CellChange[],
    onOvertaken: (cellMeta: LedgerCellMeta, valid: boolean, structureVersion: number) => void,
  ) => void;
  /**
   * Marks the cells of the changes that were applied as written by this call.
   */
  settle: (changes: CellChange[]) => void;
  /**
   * Lets go of the cells this call held.
   */
  release: () => void;
}

interface CellEntry {
  applied: number;
  inflight: number;
  valid?: boolean;
}

/**
 * Builds the key a write to a cell is ordered by. It names the cell the write lands on: the visual
 * row, which `applyChanges()` writes through, and the property, or the visual column for a column that
 * has no property of its own (an unbound column, or a data accessor function).
 *
 * @param row The visual row of the change.
 * @param prop The property of the change.
 * @param visualColumn The visual column of the change.
 * @returns {string}
 */
export function getCellWriteKey(row: number, prop: CellChange[1] | null, visualColumn: CellChange[1] | null): string {
  if (typeof prop === 'string' || typeof prop === 'number') {
    return `${row}:p${prop}`;
  }

  return `${row}:c${typeof visualColumn === 'function' ? '' : visualColumn}`;
}

/**
 * Orders the writes to one cell that wait on a validator, so the last write made to a cell wins
 * whatever order the validators answer in. A write is dropped only when a NEWER write to the cell has
 * already been applied. A newer write that is still queued does not overtake it, because that write may
 * yet be rejected under `allowInvalid: false`, and the older value would be lost with it.
 *
 * An entry lives only while a call holds a write to the cell.
 *
 * @returns {Function} Opens the ledger of one `validateChanges()` call.
 */
export function createWriteLedger() {
  const cells = new Map<string, CellEntry>();
  let sequence = 0;

  return function open(): WriteLedgerCall {
    sequence += 1;

    const callSequence = sequence;
    const keys = new Set<string>();
    const changeKeys = new Map<CellChange, { key: string, cellMeta: LedgerCellMeta, structureVersion: number }>();

    return {
      register(change, key, cellMeta, structureVersion) {
        changeKeys.set(change, { key, cellMeta, structureVersion });

        if (keys.has(key)) {
          return;
        }

        keys.add(key);

        const entry = cells.get(key);

        if (entry) {
          entry.inflight += 1;
        } else {
          cells.set(key, { applied: 0, inflight: 1 });
        }
      },
      claim(changes, onOvertaken) {
        for (let i = changes.length - 1; i >= 0; i--) {
          const registered = changeKeys.get(changes[i]);
          const entry = registered === undefined ? undefined : cells.get(registered.key);

          if (registered && entry && entry.applied > callSequence) {
            changes.splice(i, 1);

            if (typeof entry.valid === 'boolean') {
              onOvertaken(registered.cellMeta, entry.valid, registered.structureVersion);
            }
          }
        }
      },
      settle(changes) {
        changes.forEach((change) => {
          const registered = changeKeys.get(change);
          const entry = registered === undefined ? undefined : cells.get(registered.key);

          if (registered && entry && entry.applied < callSequence) {
            entry.applied = callSequence;
            entry.valid = registered.cellMeta.valid;
          }
        });
      },
      release() {
        keys.forEach((key) => {
          const entry = cells.get(key);

          if (!entry) {
            return;
          }

          entry.inflight -= 1;

          if (entry.inflight <= 0) {
            cells.delete(key);
          }
        });
        keys.clear();
      },
    };
  };
}
