import Handsontable from 'handsontable';
import {
  ASYNC_VALUE_CANCEL_REASONS,
  type AsyncCellInfo,
  type AsyncValueCancelReason,
  type AsyncValueResult,
  type AsyncValueState,
} from 'handsontable/plugins/asyncValues';

const hot = new Handsontable(document.createElement('div'), {
  asyncValues: { flush: 'frame', concurrency: 4, copyPendingAs: 'empty', saveToDataProvider: true },
  rowId: 'id',
});
const asyncValues = hot.getPlugin('asyncValues');

const single: Promise<AsyncValueResult> = asyncValues.setAsyncValue(0, 1, async(context) => {
  const { signal, row, column, physicalRow, prop, rowId } = context;
  const _signal: AbortSignal = signal;
  const _row: number | null = row;
  const _column: number | null = column;
  const _physicalRow: number = physicalRow;
  const _prop: string | number = prop;
  const _rowId: unknown = rowId;

  return 'value';
}, { dependsOn: ['sku', 0], source: 'AI.fill', meta: { aiGenerated: true }, undo: 'record', keepSource: false });
const fromPromise: Promise<AsyncValueResult> = asyncValues.setAsyncValue(0, 1, Promise.resolve(1));
const range: Promise<AsyncValueResult[]> = asyncValues
  .setAsyncValues(0, 1, 9, 1, ({ signal }) => fetch('/', { signal }));
const byId: Promise<AsyncValueResult> = asyncValues.setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.resolve(1));
const byPhysical: Promise<AsyncValueResult> = asyncValues
  .setAsyncValueAt({ physicalRow: 3, prop: 'name' }, () => Promise.resolve(1));
const byVisual: Promise<AsyncValueResult> = asyncValues.setAsyncValueAt({ row: 0, column: 1 }, Promise.resolve(1));
const forRows: Promise<AsyncValueResult[]> = asyncValues
  .setAsyncValuesForRows([{ rowId: 'a' }, { physicalRow: 2 }], 'name', () => Promise.resolve(1));
const forAll: Promise<AsyncValueResult[]> = asyncValues.setAsyncValuesForRows('all', 'name', () => Promise.resolve(1));
const batched: Promise<AsyncValueResult[]> = asyncValues
  .setAsyncValuesInBatches('all', 'name', async(cells, signal) => {
    const _signal: AbortSignal = signal;

    return cells.map(cell => (cell.rowId === 'x' ? new Error('No value') : String(cell.physicalRow)));
  }, { batchSize: 10, undo: 'record' });
const state: AsyncValueState | null = asyncValues.getAsyncState(0, 1);
const stateById: AsyncValueState | null = asyncValues.getAsyncStateAt({ rowId: 'a', prop: 'name' });
const pending: boolean = asyncValues.isPending(0, 1);
const pendingCells: AsyncCellInfo[] = asyncValues.getPendingCells();
const errorCells: AsyncCellInfo[] = asyncValues.getErrorCells();
const counts: number = asyncValues.countPending() + asyncValues.countErrors();
const retried: Promise<AsyncValueResult> | null = asyncValues.retry(0, 1);
const retriedAt: Promise<AsyncValueResult> | null = asyncValues.retryAt({ physicalRow: 0, prop: 'name' });
const retriedAll: Promise<AsyncValueResult[]> = asyncValues.retryErrors();

asyncValues.cancel(0, 1);
asyncValues.cancelAt({ rowId: 'a', prop: 'name' });
asyncValues.cancelAll();

single.then((result) => {
  if (result.status === 'resolved') {
    const _value: unknown = result.value;
  } else if (result.status === 'rejected') {
    const _message: string = result.message;
  } else {
    const _reason: AsyncValueCancelReason = result.reason;
  }
});

// Every reason is handled, and the list holds exactly the type's members.
const handled: Record<AsyncValueCancelReason, true> = {
  edit: true,
  dependency: true,
  restart: true,
  rowRemoved: true,
  columnsChanged: true,
  dataReplaced: true,
  manual: true,
  disabled: true,
  vetoed: true,
};
const listed: readonly AsyncValueCancelReason[] = ASYNC_VALUE_CANCEL_REASONS;

const meta = hot.getCellMeta(0, 1);
const asyncState: 'pending' | 'error' | null | undefined = meta.asyncState;
const asyncError: string | null | undefined = meta.asyncError;
