import Handsontable from 'handsontable';
import type { AsyncValueResult, AsyncValueState } from 'handsontable/plugins/asyncValues';

const hot = new Handsontable(document.createElement('div'), {
  asyncValues: true,
});
const asyncValues = hot.getPlugin('asyncValues');

const single: Promise<AsyncValueResult> = asyncValues.setAsyncValue(0, 1, async(context) => {
  const { signal, row, column, physicalRow, prop } = context;
  const _signal: AbortSignal = signal;
  const _coords: number = row + column + physicalRow;
  const _prop: string | number = prop;

  return 'value';
}, { dependsOn: ['sku', 0] });
const fromPromise: Promise<AsyncValueResult> = asyncValues.setAsyncValue(0, 1, Promise.resolve(1));
const range: Promise<AsyncValueResult[]> = asyncValues
  .setAsyncValues(0, 1, 9, 1, ({ signal }) => fetch('/', { signal }));
const state: AsyncValueState | null = asyncValues.getAsyncState(0, 1);
const pending: boolean = asyncValues.isPending(0, 1);

asyncValues.cancel(0, 1);
asyncValues.cancelAll();

single.then((result) => {
  if (result.status === 'resolved') {
    const _value: unknown = result.value;
  } else if (result.status === 'rejected') {
    const _message: string = result.message;
  } else {
    const _reason: string = result.reason;
  }
});

const meta = hot.getCellMeta(0, 1);
const asyncState: 'pending' | 'error' | null | undefined = meta.asyncState;
const asyncError: string | null | undefined = meta.asyncError;
