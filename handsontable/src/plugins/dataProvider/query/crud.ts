import { isFunction } from '../../../helpers/function';
import { getProperty } from '../../../helpers/object';
import { error as logError } from '../../../helpers/console';
import { throwWithCause } from '../../../helpers/errors';
import type { HotInstance } from '../../../core/types';
import {
  DATA_PROVIDER_BATCH_UPDATE_SOURCES,
  DATA_PROVIDER_ERROR_UPDATE_MISSING_ROW_ID,
  dataProviderErrorRemoveMissingRowId,
} from '../constants';

/**
 * Row id option — a property name string, a resolver function, or absent.
 */
type RowIdOption = string | ((rowData: object | unknown[]) => unknown) | undefined | null;

/**
 * A single afterChange tuple: `[visualRow, prop, oldValue, newValue]`.
 */
type ChangeTuple = [number, string | number, unknown, unknown];

/**
 * Internal per-row update payload used inside CRUD helpers.
 */
type InternalRowUpdatePayload = {
  id?: unknown;
  changes?: Record<string | number, unknown>;
  rowData?: Record<string, unknown> | unknown[];
};

/**
 * Runs `beforeRowsMutation`. Return `false` from a listener to cancel.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string} operation Mutation kind (`create`, `update`, or `remove`).
 * @param {object} payload Hook payload (`RowMutationPayload` in `types/plugins/dataProvider/dataProvider.d.ts`).
 * @returns {boolean|undefined} `false` when cancelled.
 */
export function runBeforeRowsMutation(hot: HotInstance, operation: string, payload: object): false | undefined {
  if (hot.runHooks('beforeRowsMutation', operation, payload) === false) {
    return false;
  }

  return undefined;
}

/**
 * Runs `afterRowsMutation`.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string} operation Mutation kind (`create`, `update`, or `remove`).
 * @param {object} payload Hook payload (`RowMutationPayload` in `types/plugins/dataProvider/dataProvider.d.ts`).
 * @returns {void}
 */
export function runAfterRowsMutation(hot: HotInstance, operation: string, payload: object): void {
  hot.runHooks('afterRowsMutation', operation, payload);
}

/**
 * Runs `afterRowsMutationError`.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string} operation Mutation kind (`create`, `update`, or `remove`).
 * @param {Error} err Failure from the server callback.
 * @param {object} payload Hook payload (`RowMutationPayload` in `types/plugins/dataProvider/dataProvider.d.ts`).
 * @returns {void}
 */
export function runAfterRowsMutationError(hot: HotInstance, operation: string, err: unknown, payload: object): void {
  hot.runHooks('afterRowsMutationError', operation, err, payload);
}

/**
 * Appends a mutation onto the queue so concurrent CRUD runs sequentially.
 *
 * @param {{ tail: Promise<void> }} state Mutable queue tail (mutated).
 * @param {function(): Promise<void>|void} fn Async work for one mutation.
 * @returns {Promise<void>}
 */
export function enqueueMutation(state: { tail: Promise<void> }, fn: () => Promise<void> | void): Promise<void> {
  const mutationPromise = state.tail.then(fn);

  state.tail = mutationPromise.catch(() => {});

  return mutationPromise;
}

/**
 * Resolves stable row id from a row object using `rowId` option.
 *
 * @param {object|Array} rowData Source row.
 * @param {string|Function|undefined|null} rowIdOption `rowId` from config.
 * @returns {*|undefined}
 */
export function getRowIdFromRowData(
  rowData: object | unknown[], rowIdOption: RowIdOption
): unknown {
  if (rowIdOption === undefined || rowIdOption === null) {
    return undefined;
  }
  if (isFunction(rowIdOption)) {
    return (rowIdOption as (rowData: object | unknown[]) => unknown)(rowData);
  }
  if (typeof rowIdOption === 'string') {
    return getProperty(rowData as Record<string, unknown>, rowIdOption);
  }

  return undefined;
}

/**
 * Row id for a visual row index.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string|Function|undefined|null} rowIdOption `rowId` from config.
 * @param {number} visualRow Visual row index.
 * @returns {*|undefined}
 */
export function getRowIdByVisualRow(
  hot: HotInstance, rowIdOption: RowIdOption, visualRow: number
): unknown {
  return getRowIdFromRowData(
    hot.getSourceDataAtRow(hot.toPhysicalRow(visualRow)) as object | unknown[],
    rowIdOption
  );
}

/**
 * True when a value cannot be used as a server row id (`null` and `undefined` only).
 *
 * @param {*} id Resolved row id.
 * @returns {boolean}
 */
export function isMissingRowId(id: unknown): boolean {
  return id === undefined || id === null;
}

/**
 * Finds a visual row index for a row id.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string|Function|undefined|null} rowIdOption `rowId` from config.
 * @param {*} rowId Row id.
 * @returns {number} Visual row index or -1 when not found.
 */
export function findVisualRowById(
  hot: HotInstance, rowIdOption: RowIdOption, rowId: unknown
): number {
  for (let row = 0; row < hot.countRows(); row += 1) {
    if (getRowIdByVisualRow(hot, rowIdOption, row) === rowId) {
      return row;
    }
  }

  return -1;
}

/**
 * Collects row ids (or row snapshots) for `remove_row` alter ranges, including grouped indices.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string|Function|undefined|null} rowIdOption `rowId` from config.
 * @param {number|Array|undefined|null} index Visual start index or `[[index, amount], ...]`.
 * @param {number} amount Row count when `index` is scalar.
 * @returns {Array<*>}
 * @throws {Error} When `rowId` resolves to null or undefined for a row in range.
 */
export function rowIdsFromAlterRemove(
  hot: HotInstance, rowIdOption: RowIdOption,
  index: number | [number, number][] | undefined | null, amount: number
): unknown[] {
  const ids: unknown[] = [];
  const n = () => hot.countRows();
  const pushRange = (start: number, amt: number) => {
    for (let r = 0; r < amt; r += 1) {
      const v = start + r;

      if (v >= 0 && v < n()) {
        const id = getRowIdByVisualRow(hot, rowIdOption, v);

        if (isMissingRowId(id)) {
          throwWithCause(dataProviderErrorRemoveMissingRowId(v));
        }
        ids.push(id);
      }
    }
  };

  if (Array.isArray(index)) {
    index.forEach(([gi, ga]) => {
      const start = (gi === undefined || gi === null)
        ? Math.max(0, n() - (ga ?? 1))
        : Math.max(0, gi);

      pushRange(start, ga ?? 1);
    });
  } else {
    const amt = typeof amount === 'number' && amount >= 1 ? amount : 1;
    const start = (index === undefined || index === null)
      ? Math.max(0, n() - amt)
      : Math.max(0, index);

    pushRange(start, amt);
  }

  return ids;
}

/**
 * Builds `changes` map and merged `rowData` for one visual row from Handsontable change tuples.
 *
 * @param {Core} hot Handsontable instance.
 * @param {Array} rowChanges Tuples `[visualRow, prop, oldVal, newVal]` for one row.
 * @returns {{ changesObj: object, rowData: object|Array }}
 */
export function buildChangesAndRowData(
  hot: HotInstance, rowChanges: ChangeTuple[]
): { changesObj: Record<string | number, unknown>; rowData: Record<string, unknown> | unknown[] } {
  const visualRow = rowChanges[0][0];
  const rowData = hot.getSourceDataAtRow(hot.toPhysicalRow(visualRow));
  const isObj = rowData && typeof rowData === 'object' && !Array.isArray(rowData);
  const changesObj: Record<string | number, unknown> = {};

  rowChanges.forEach(([, prop, , nv]) => {
    const col = typeof prop === 'number' ? prop : (hot.propToCol(prop as string) as number);
    const key = isObj ? (hot.colToProp(col) as string | number) : col;

    changesObj[key] = nv;
  });

  let rowDataWithChanges: Record<string, unknown> | unknown[];

  if (Array.isArray(rowData)) {
    rowDataWithChanges = [...(rowData as unknown[])];
    rowChanges.forEach(([, prop, , nv]) => {
      const col = typeof prop === 'number' ? prop : (hot.propToCol(prop as string) as number);

      (rowDataWithChanges as unknown[])[col] = nv;
    });
  } else if (isObj) {
    rowDataWithChanges = { ...(rowData as Record<string, unknown>), ...changesObj };
  } else {
    rowDataWithChanges = { ...changesObj };
  }

  return { changesObj, rowData: rowDataWithChanges };
}

/**
 * Reverts optimistic cell edits after a failed server update.
 *
 * @param {Core} hot Handsontable instance.
 * @param {Array} changeTuples `[visualRow, prop, oldVal, newVal][]`.
 * @returns {void}
 */
export function revertChangeTuples(hot: HotInstance, changeTuples: ChangeTuple[]): void {
  if (!changeTuples?.length) {
    return;
  }
  hot.batch(() => {
    changeTuples.forEach(([row, prop, oldVal]) => {
      hot.setDataAtRowProp(row, prop, oldVal, 'DataProvider.revert');
    });
  });
}

/**
 * Whether every changed cell passes validator when `allowInvalid` is false.
 *
 * @param {Core} hot Handsontable instance.
 * @param {number} visualRow Visual row index.
 * @param {object} changes Prop-keyed new values.
 * @returns {Promise<boolean>}
 */
export function validateRowChanges(
  hot: HotInstance, visualRow: number, changes: Record<string | number, unknown>
): Promise<boolean> {
  const entries = Object.entries(changes);

  if (entries.length === 0) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let pending = entries.length;
    let valid = true;

    const done = () => {
      pending -= 1;

      if (pending === 0) {
        resolve(valid);
      }
    };

    entries.forEach(([prop, value]) => {
      const col = hot.propToCol(prop);

      if (col === undefined || col < 0) {
        done();

        return;
      }

      const cellMeta = hot.getCellMeta(visualRow, col);

      if (!hot.getCellValidator(cellMeta)) {
        done();

        return;
      }

      hot.validateCell(value, cellMeta, (result: boolean) => {
        if (result === false && cellMeta.allowInvalid === false) {
          valid = false;
        }
        done();
      }, 'DataProvider.updateRows');
    });
  });
}

/**
 * True when `afterChange` should not enqueue a batched `onRowsUpdate`.
 *
 * @param {boolean} hasOnRowsUpdate Whether `onRowsUpdate` is configured.
 * @param {Array} changes Change list from `afterChange`.
 * @param {string} [source] Change source.
 * @returns {boolean}
 */
export function shouldIgnoreAfterChangeForServerUpdate(
  hasOnRowsUpdate: boolean, changes: ChangeTuple[] | unknown[] | null, source?: string
): boolean {
  if (!hasOnRowsUpdate || !changes?.length) {
    return true;
  }
  if (source === 'DataProvider.revert') {
    return true;
  }
  if (!DATA_PROVIDER_BATCH_UPDATE_SOURCES.has(source)) {
    return true;
  }

  return false;
}

/**
 * Filters change tuples to those with real edits and passing cell `valid` meta.
 *
 * @param {Core} hot Handsontable instance.
 * @param {Array} changes `[visualRow, prop, oldVal, newVal][]`.
 * @returns {Array} Subset safe to send to the server update path.
 */
export function filterChangesForBatchedServerUpdate(
  hot: HotInstance, changes: ChangeTuple[] | unknown[] | null
): ChangeTuple[] {
  if (!changes) {
    return [];
  }

  const tuples = changes as ChangeTuple[];
  const real = tuples.filter(c => c[2] !== c[3]);

  if (real.length === 0) {
    return [];
  }

  return real.filter((c) => {
    const col = hot.propToCol(c[1]);

    if (col === undefined || col < 0) {
      return false;
    }

    return hot.getCellMeta(c[0], col).valid !== false;
  });
}

/**
 * Builds `{ id, changes, rowData }` payloads for programmatic `updateRows`.
 *
 * @param {Core} hot Handsontable instance.
 * @param {string|Function|undefined|null} rowIdOption `rowId` from config.
 * @param {object[]} rows Caller payloads `{ id, changes, rowData? }`.
 * @returns {object[]}
 */
export function buildManualUpdateRowPayloads(
  hot: HotInstance, rowIdOption: RowIdOption,
  rows: InternalRowUpdatePayload[]
): InternalRowUpdatePayload[] {
  return rows.map((p) => {
    const visualRow = findVisualRowById(hot, rowIdOption, p.id);

    let rowData;

    if (visualRow >= 0) {
      rowData = hot.getSourceDataAtRow(hot.toPhysicalRow(visualRow));
    } else if (p.rowData !== undefined) {
      rowData = p.rowData;
    } else {
      rowData = {};
    }

    return {
      id: p.id,
      changes: p.changes,
      rowData: (rowData && typeof rowData === 'object' ? rowData : {}) as unknown[] | Record<string, unknown>,
    };
  });
}

/**
 * Calls `onRowsUpdate`, success/error hooks, then re-fetches or re-renders.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ getOnRowsUpdate: function(): *, fetchData: function(): Promise<*>, logError: function(...*): void, onRequestFailed?: function(string, Error): void }} callbacks Callbacks for IO and logging (`getOnRowsUpdate` returns `onRowsUpdate` or a falsy value). `onRequestFailed` receives `'update'` only; when `fetchData` rejects after a successful update, the caller's `fetchData` implementation is responsible for error UI (for example [[DataProvider#fetchData]] shows a notification and rethrows).
 * @param {object[]} rowPayloads Per-row `RowUpdatePayload` objects (`types/plugins/dataProvider/dataProvider.d.ts`).
 * @param {object} [options] Optional flags.
 * @param {function(): void} [options.revertOptimistic] Restores previous cell values when the request fails.
 * @returns {Promise<void>}
 */
type CommitRowsUpdateCallbacks = {
  getOnRowsUpdate: () => ((payload: object[]) => Promise<void>) | undefined;
  fetchData: () => Promise<unknown>;
  logError: (...args: unknown[]) => void;
  onRequestFailed?: (kind: string, err: unknown) => void;
};
/**
 *
 */
export async function commitRowsUpdate(
  hot: HotInstance, callbacks: CommitRowsUpdateCallbacks,
  rowPayloads: object[], options: { revertOptimistic?: () => void } = {}
): Promise<void> {
  const onRowsUpdate = callbacks.getOnRowsUpdate();

  if (!isFunction(onRowsUpdate)) {
    return;
  }

  const payload = { rows: rowPayloads };
  const { revertOptimistic } = options;
  const { onRequestFailed } = callbacks;

  try {
    await onRowsUpdate(rowPayloads);
  } catch (err) {
    runAfterRowsMutationError(hot, 'update', err, payload);
    callbacks.logError('Row update failed:', err);

    if (isFunction(revertOptimistic)) {
      revertOptimistic();
    }
    hot.render();
    onRequestFailed?.('update', err);

    return;
  }

  try {
    runAfterRowsMutation(hot, 'update', payload);
    await callbacks.fetchData();
  } catch (err) {
    runAfterRowsMutationError(hot, 'update', err, payload);
    callbacks.logError('Data reload failed:', err);

    if (isFunction(revertOptimistic)) {
      revertOptimistic();
    }
    hot.render();
    // Do not call `onRequestFailed('fetch', err)` here: `fetchData` already surfaces fetch errors (and rethrows).
  }
}

/**
 * Runs `beforeRowsMutation`, validates each payload row, then calls `commitRowsUpdate` for programmatic `updateRows`.
 *
 * @param {Core} hot Handsontable instance.
 * @param {object} ctx Row resolution and commit.
 * @param {function(): string|Function|undefined|null} ctx.getRowIdOption Current `rowId` config.
 * @param {function(object[]): Promise<void>} ctx.commitRowsUpdate Commits payloads after validation.
 * @param {object[]} rowPayloads Per-row `{ id, changes, rowData }` payloads from `buildManualUpdateRowPayloads`.
 * @returns {Promise<void>}
 */
type ManualUpdateCtx = {
  getRowIdOption: () => RowIdOption;
  commitRowsUpdate: (payloads: InternalRowUpdatePayload[]) => Promise<void>;
};
/**
 *
 */
export async function runManualUpdateRowsMutation(
  hot: HotInstance, ctx: ManualUpdateCtx, rowPayloads: InternalRowUpdatePayload[]
): Promise<void> {
  const { getRowIdOption, commitRowsUpdate: commitUpdate } = ctx;
  const payload = { rows: rowPayloads };

  if (runBeforeRowsMutation(hot, 'update', payload) === false) {
    return;
  }

  const rowIdOption = getRowIdOption();
  const validationResults = await Promise.all(rowPayloads.map(async(p) => {
    const visualRow = findVisualRowById(hot, rowIdOption, p.id);

    if (visualRow < 0) {
      return true;
    }

    return validateRowChanges(hot, visualRow, p.changes ?? {});
  }));

  if (validationResults.some(ok => !ok)) {
    runAfterRowsMutationError(hot, 'update', new Error('Row update validation failed'), payload);
    logError('Row update failed: validation failed for one or more cells');

    return;
  }

  await commitUpdate(rowPayloads);
}

/**
 * Groups cell changes by row, validates, then commits a single batched `onRowsUpdate`.
 *
 * @param {Core} hot Handsontable instance.
 * @param {object} ctx Row resolution and commit.
 * @param {function(): string|Function|undefined|null} ctx.getRowIdOption Current `rowId` config.
 * @param {function(object[], object): Promise<void>} ctx.commitRowsUpdate Commits payloads (e.g. server + refetch).
 * @param {Array} changes Filtered change tuples `[visualRow, prop, oldVal, newVal][]`.
 * @returns {Promise<void>}
 */
type UpdateFromChangesCtx = {
  getRowIdOption: () => RowIdOption;
  commitRowsUpdate: (payloads: InternalRowUpdatePayload[], opts?: { revertOptimistic?: () => void }) => Promise<void>;
};
/**
 *
 */
export async function runUpdateFromChanges(
  hot: HotInstance, ctx: UpdateFromChangesCtx, changes: ChangeTuple[]
): Promise<void> {
  const { getRowIdOption, commitRowsUpdate: commitFn } = ctx;
  const byRow = new Map<number, ChangeTuple[]>();

  changes.forEach((ch) => {
    const vr = ch[0];

    if (!byRow.has(vr)) {
      byRow.set(vr, []);
    }
    byRow.get(vr)!.push(ch);
  });

  const sortedRows = [...byRow.keys()].sort((a, b) => a - b);
  const rowIdOption = getRowIdOption();
  const rowPayloads = sortedRows.map((vr) => {
    const { changesObj, rowData } = buildChangesAndRowData(hot, byRow.get(vr)!);

    return {
      id: getRowIdByVisualRow(hot, rowIdOption, vr),
      changes: changesObj,
      rowData,
    };
  });

  const payload = { rows: rowPayloads };
  const revert = () => revertChangeTuples(hot, changes);

  if (rowPayloads.some(p => isMissingRowId(p.id))) {
    revert();
    runAfterRowsMutationError(
      hot,
      'update',
      new Error(DATA_PROVIDER_ERROR_UPDATE_MISSING_ROW_ID),
      payload
    );
    logError('Row update failed:', DATA_PROVIDER_ERROR_UPDATE_MISSING_ROW_ID);
    hot.render();

    return;
  }

  if (runBeforeRowsMutation(hot, 'update', payload) === false) {
    revert();

    return;
  }

  const ok = await Promise.all(
    sortedRows.map((vr, i) => validateRowChanges(hot, vr, rowPayloads[i].changes))
  );

  if (ok.some(v => !v)) {
    revert();
    runAfterRowsMutationError(hot, 'update', new Error('Row update validation failed'), payload);
    logError('Row update failed: validation failed for one or more cells');
    hot.render();

    return;
  }

  await commitFn(rowPayloads, { revertOptimistic: revert });
}

/**
 * Queues create/remove server calls with before/after mutation hooks.
 *
 * @param {object} ctx Queue and hooks.
 * @param {function(function(): Promise<void>|void): Promise<void>} ctx.enqueueMutation - Serializes mutations.
 * @param {function(string, object): boolean|undefined} ctx.runBeforeRowsMutation - Returns false when the hook cancels.
 * @param {function(string, object): void} ctx.runAfterRowsMutation - Runs the success hook.
 * @param {function(string, Error, object): void} ctx.runAfterRowsMutationError - Runs the error hook.
 * @param {function(...*): void} ctx.logError - Logs mutation failures.
 * @param {function(string, Error): void} [ctx.onRequestFailed] - `'create'|'remove'` when the server callback rejects. When `onSuccess` (refetch) fails, error UI is owned by that `fetchData` implementation (not `onRequestFailed`).
 * @param {string} operation `'create'` or `'remove'`.
 * @param {object} payload Hook payload.
 * @param {function(): Promise<*>} userPromiseFn Server callback invocation.
 * @param {function(): Promise<void>|void} onSuccess Runs after success (e.g. `fetchData`).
 * @returns {Promise<void>}
 */
type QueueCrudCtx = {
  enqueueMutation: (fn: () => Promise<void>) => Promise<void>;
  runBeforeRowsMutation: (op: string, p: object) => false | undefined;
  runAfterRowsMutation: (op: string, p: object) => void;
  runAfterRowsMutationError: (op: string, err: unknown, p: object) => void;
  logError: (...args: unknown[]) => void;
  onRequestFailed?: (op: string, err: unknown) => void;
};
/**
 *
 */
export function queueCrud(
  ctx: QueueCrudCtx, operation: string, payload: object,
  userPromiseFn: () => Promise<unknown>, onSuccess: () => Promise<void> | void
): Promise<void> {
  const {
    enqueueMutation: enqueue,
    runBeforeRowsMutation: beforeMut,
    runAfterRowsMutation: afterMut,
    runAfterRowsMutationError: afterMutErr,
    logError: logErr,
    onRequestFailed,
  } = ctx;

  return enqueue(async() => {
    if (beforeMut(operation, payload) === false) {
      return;
    }

    const mutationLabel = operation === 'create' ? 'Row create' : 'Row remove';

    try {
      await userPromiseFn();
    } catch (err) {
      afterMutErr(operation, err, payload);
      logErr(`${mutationLabel} failed:`, err);
      onRequestFailed?.(operation, err);

      return;
    }

    try {
      afterMut(operation, payload);
      await onSuccess();
    } catch (err) {
      afterMutErr(operation, err, payload);
      logErr('Data reload failed:', err);
      // Do not call `onRequestFailed('fetch', err)` here: `onSuccess` is typically `fetchData`, which already surfaces fetch errors (and rethrows).
    }
  });
}

type BeforeAlterForCrudCtx = {
  hot: HotInstance;
  getOnRowsCreate: () => ((payload: { position?: string; referenceRowId?: unknown; rowsAmount?: number }) =>
    Promise<unknown> | void) | undefined;
  getOnRowsRemove: () => ((rowIds: unknown[]) => Promise<unknown> | void) | undefined;
  getRowIdOption: () => RowIdOption;
  getRowId: (visualRow: number) => unknown;
  createRows: (payload: { position?: string; referenceRowId?: unknown; rowsAmount?: number }) =>
    Promise<void> | void;
  removeRows: (rowIds: unknown[]) => Promise<void> | void;
};

/**
 * @param {object} ctx Same shape as [[handleBeforeAlterForCrud]].
 * @param {'insert_row_above'|'insert_row_below'} action Insert direction.
 * @param {number|Array|undefined|null} index Row index or alter grouping.
 * @param {number} amount Row count when `index` is a number.
 * @returns {boolean|undefined} `false` when the alter is handled.
 */
function handleInsertRowAlterForCrud(
  ctx: BeforeAlterForCrudCtx, action: string,
  index: number | [number, number][] | undefined | null, amount: number
): false | undefined {
  const { hot, getOnRowsCreate, getRowId, createRows } = ctx;

  if (!isFunction(getOnRowsCreate())) {
    return;
  }

  const n = hot.countSourceRows();

  if (hot.getSettings().maxRows === n) {
    return;
  }

  const position = action === 'insert_row_below' ? 'below' : 'above';
  const visualIndex = index ?? (position === 'below' ? n : 0);

  void createRows({
    position,
    referenceRowId: typeof visualIndex === 'number' && visualIndex >= 0 ? getRowId(visualIndex) : undefined,
    rowsAmount: typeof amount === 'number' && amount >= 1 ? amount : 1,
  });

  return false;
}

/**
 * @param {object} ctx Same shape as [[handleBeforeAlterForCrud]].
 * @param {number|Array|undefined|null} index Row index or alter grouping.
 * @param {number} amount Row count when `index` is a number.
 * @returns {boolean|undefined} `false` when the alter is handled.
 */
function handleRemoveRowAlterForCrud(
  ctx: BeforeAlterForCrudCtx, index: number | [number, number][] | undefined | null, amount: number
): false | undefined {
  const { hot, getOnRowsRemove, getRowIdOption, removeRows } = ctx;

  if (!isFunction(getOnRowsRemove())) {
    return;
  }

  const rowIds = rowIdsFromAlterRemove(hot, getRowIdOption(), index, amount);

  if (rowIds.length === 0) {
    return;
  }

  void removeRows(rowIds);

  return false;
}

/**
 * Handles `beforeAlter` for server-backed row insert/remove when DataProvider CRUD is configured.
 *
 * @param {object} ctx Context.
 * @param {Core} ctx.hot - Handsontable instance.
 * @param {function(): *} ctx.getOnRowsCreate - Returns configured `onRowsCreate` when present.
 * @param {function(): *} ctx.getOnRowsRemove - Returns configured `onRowsRemove` when present.
 * @param {function(): string|Function|undefined|null} ctx.getRowIdOption - Returns current `rowId` setting.
 * @param {function(number): *} ctx.getRowId - Row id for a visual index (public API).
 * @param {function(object): Promise<void>|void} ctx.createRows - Invokes server create path.
 * @param {function(*|*[]): Promise<void>|void} ctx.removeRows - Invokes server remove path.
 * @param {string} action Alter action name.
 * @param {number|Array|undefined|null} index Row index, grouped `[[index, amount], ...]`, or undefined (alter default).
 * @param {number} amount Row count when `index` is a number.
 * @returns {boolean|undefined} False when alter is handled here.
 */
export function handleBeforeAlterForCrud(
  ctx: BeforeAlterForCrudCtx, action: string,
  index: number | [number, number][] | undefined | null, amount: number
): false | undefined {
  if (action === 'insert_row_above' || action === 'insert_row_below') {
    return handleInsertRowAlterForCrud(ctx, action, index, amount);
  }

  if (action === 'remove_row') {
    return handleRemoveRowAlterForCrud(ctx, index, amount);
  }
}
