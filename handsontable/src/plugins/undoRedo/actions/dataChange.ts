import type { HookCallback } from "../../../core/hooks/bucket";
import type { HotInstance } from '../../../common';
import { BaseAction } from './_base';
import { deepClone } from '../../../helpers/object';

/**
 * Minimal interface for the UndoRedo plugin used by action classes.
 */
interface UndoRedoPluginLike {
  done(wrappedAction: () => DataChangeAction, source: string): void;
}

/**
 * Action that tracks data changes.
 *
 * @class DataChangeAction
 * @private
 */
export class DataChangeAction extends BaseAction {
  /**
   * @param {Array} changes 2D array containing information about each of the edited cells.
   */
  declare changes: unknown[][];
  /**
   * @param {number[]} selected The cell selection.
   */
  declare selected: unknown[];
  /**
   * @param {number} countCols The number of columns before data change.
   */
  declare countCols: number;
  /**
   * @param {number} countRows The number of rows before data change.
   */
  declare countRows: number;

  constructor({ changes, selected, countCols, countRows }: { changes: unknown[][], selected: unknown[], countCols: number, countRows: number }) {
    super('change');
    this.changes = changes;
    this.selected = selected;
    this.countCols = countCols;
    this.countRows = countRows;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    const plugin = undoRedoPlugin as UndoRedoPluginLike;

    hot.addHook('beforeChange', function(this: HotInstance, changes: unknown[] | null, source: string) {
      const isBlockedByDefault = source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';
      const isValidatorSource = typeof source === 'string' && source.endsWith('Validator');

      if (isBlockedByDefault || isValidatorSource) {
        return;
      }

      const normalizedChanges = Array.isArray(changes)
        ? changes.filter((change: unknown): change is unknown[] => Array.isArray(change))
        : [];
      const populateFromArrayDebug = source === 'populateFromArray' ? normalizedChanges.slice(0, 3).map((change: unknown[]) => {
        const [row, prop, oldValue, newValue] = change;
        const visualColumn = hot.propToCol(prop as string | number);
        const isReadOnly = Number.isInteger(visualColumn) && hot.getCellMeta(row as number, visualColumn).readOnly === true;

        return {
          row,
          prop,
          visualColumn,
          isReadOnly,
          oldValue,
          newValue,
        };
      }) : null;
      const actionableChanges = normalizedChanges.filter((change: unknown[]) => {
        const [row, prop, oldValue, newValue] = change;
        const visualColumn = hot.propToCol(prop as string | number);
        const isReadOnly = Number.isInteger(visualColumn) && hot.getCellMeta(row as number, visualColumn).readOnly === true;

        if (isReadOnly) {
          return false;
        }

        // `populateFromArray` may emit no-op changes when edits are rejected (e.g., readOnly cells).
        // Skip those entries to avoid pushing phantom undo actions.
        if (source === 'populateFromArray' && oldValue === newValue) {
          return false;
        }

        return true;
      });
      const changesLen = actionableChanges.length;
      const debugLogger = (hot.rootWindow as {
        agentDebugLog?: (payload: Record<string, unknown>) => void;
      })?.agentDebugLog;

      // #region agent log
      debugLogger?.({
        hypothesisId: 'B',
        location: 'src/plugins/undoRedo/actions/dataChange.ts:beforeChange',
        message: 'UndoRedo beforeChange filtering summary',
        data: {
          source,
          inputChangesLen: Array.isArray(changes) ? changes.length : -1,
          normalizedChangesLen: normalizedChanges.length,
          actionableChangesLen: changesLen,
          populateFromArrayDebug,
        },
        timestamp: Date.now(),
      });
      // #endregion

      if (changesLen === 0) {
        return;
      }

      const wrappedAction = () => {
        const clonedChanges = actionableChanges.map(change => [...change]);

        clonedChanges.forEach((change: unknown[]) => {
          change[1] = hot.propToCol(change[1] as string | number);
        });

        const selected = changesLen > 1
          ? (this.getSelected() as unknown[])
          : [[clonedChanges[0][0], clonedChanges[0][1]]];

        return new DataChangeAction({
          changes: clonedChanges,
          selected,
          countCols: hot.countCols(),
          countRows: hot.countRows(),
        });
      };

      plugin.done(wrappedAction, source);
    }, 1000);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const data = deepClone(this.changes) as unknown[][];

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    hot.addHookOnce('afterChange', () => {
      const rowsToRemove = hot.countRows() - this.countRows;

      if (rowsToRemove > 0) {
        hot.alter('remove_row', null, rowsToRemove, 'UndoRedo.undo');
      }

      const columnsToRemove = hot.countCols() - this.countCols;

      if (columnsToRemove > 0 && hot.isColumnModificationAllowed()) {
        hot.alter('remove_col', null, columnsToRemove, 'UndoRedo.undo');
      }

      hot.scrollToFocusedCell();
      hot.selectCells(this.selected, false, false);

      undoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.undo');
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const data = deepClone(this.changes) as unknown[][];

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(2, 1);
    }

    hot.addHookOnce('afterChange', () => {
      hot.selectCells(this.selected, false, false);

      redoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.redo');
  }
}
