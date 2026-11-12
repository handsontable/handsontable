import type Handsontable from 'handsontable/base';
import type { CellChange, ChangeSource } from 'handsontable/settings';
import { ID_HEADER, POLL_MS } from './config';
import { createGrid } from './grid';
import { appendRows, deleteRows, readSheet, retrying, SessionExpiredError, writeCells, type Cell } from './sheets';

// Changes the sync makes itself. Only a user's change goes back to the sheet.
const OWN_SOURCES = new Set<string>(['sync', 'loadData', 'updateData']);
const EDIT_DEBOUNCE_MS = 300;
const COLUMNS_CHANGED = 'The sheet\'s columns changed. Reload the page to pick them up.';

// A value the grid sent, or is about to send, to the sheet. writtenAt is set once the sheet
// has it.
interface Pending {
  value: Cell;
  writtenAt?: number;
}

interface Edit {
  id: string;
  column: number;
  base: Cell;
  value: Cell;
  pending: Pending;
}

// Sheets leaves out empty cells at the end of a row, and an empty grid cell is null.
// Both become '' so an untouched empty cell compares equal on both sides.
const normalize = (value: unknown): Cell => (value === null || value === undefined ? '' : (value as Cell));
const key = (id: string, column: number) => `${id}\u0000${column}`;

export function startSync(container: HTMLElement, onStatus: (text: string, isError?: boolean) => void) {
  let hot: Handsontable | null = null;
  let header: string[] = [];
  let idColumn = -1;
  // The grid's data. Handsontable keeps a reference to it, so a physical row index is a
  // position in this array.
  let rows: Cell[][] = [];
  const indexById = new Map<string, number>();

  // Cells the grid is writing. A read that started before the write landed must not overwrite
  // them; a read that started after it is the sheet's word, even if someone changed the cell.
  const pendingCells = new Map<string, Pending>();
  // Rows added or removed in the grid whose change hasn't reached the sheet yet.
  const pendingAppends = new Set<string>();
  const pendingDeletes = new Set<string>();

  // Set once the sheet's first row no longer matches the grid's columns. From then on, nothing
  // syncs: a write by column index could land in the wrong column.
  let columnsChanged = false;
  // IDs that more than one sheet row has. Each is reported once.
  const warnedDuplicates = new Set<string>();
  // Set while polls fail, so an outage shows one toast, not one every POLL_MS.
  let pollFailing = false;

  let editBatch = new Map<string, Edit>();
  let editTimer = 0;
  let pollTimer = 0;
  // All writes run one after another, so an append lands before an edit to that row.
  let writeQueue = Promise.resolve();

  // The message can quote a sheet value, so it goes in as text, never as HTML.
  function notify(title: string, message: string) {
    const text = document.createElement('span');

    text.textContent = message;
    hot?.getPlugin('notification').showMessage({ variant: 'warning', title, message: text });
  }

  // Clears an edit's pending entry, unless a newer edit of the same cell replaced it.
  function settle(edit: Edit) {
    if (pendingCells.get(key(edit.id, edit.column)) === edit.pending) {
      pendingCells.delete(key(edit.id, edit.column));
    }
  }

  function reindex() {
    indexById.clear();
    rows.forEach((row, index) => indexById.set(idOf(row), index));
  }

  // Splits a sheet read into the header and the data rows. Each row is padded to the header's
  // width and keeps its 1-based sheet row number, taken before blank rows are skipped, so a
  // blank row in the middle of the sheet can't shift a write to the wrong row.
  function parse(values: Cell[][]) {
    const [first = [], ...rest] = values;
    const names = first.map(String);
    const body: { sheetRow: number; row: Cell[] }[] = [];

    rest.forEach((raw, index) => {
      const row = Array.from({ length: names.length }, (_, column) => normalize(raw[column]));

      if (row.some((value) => value !== '')) {
        body.push({ sheetRow: index + 2, row });
      }
    });

    return { names, body };
  }

  // A row the grid just created holds null, which normalize turns into ''.
  const idOf = (row: Cell[]) => String(normalize(row[idColumn]));

  // The first sheet row with each ID. A row copied in Google Sheets with its ID is left out, with a
  // warning, so an edit or a delete in the grid reaches one sheet row only.
  function byId(body: { sheetRow: number; row: Cell[] }[]) {
    const entries = new Map<string, { sheetRow: number; row: Cell[] }>();

    for (const entry of body) {
      const id = idOf(entry.row);

      if (id === '') {
        continue;
      }

      if (!entries.has(id)) {
        entries.set(id, entry);
      } else if (hot && !warnedDuplicates.has(id)) {
        warnedDuplicates.add(id);
        notify('Duplicate ID', `More than one row in the sheet has the ID "${id}". Only the first one syncs.`);
      }
    }

    return entries;
  }

  function checkColumns(names: string[]) {
    if (columnsChanged || names.join('\u0000') !== header.join('\u0000')) {
      columnsChanged = true;
      throw new Error(COLUMNS_CHANGED);
    }
  }

  // Sorting and filtering don't re-run when data changes, so re-apply them after rows are
  // added or removed. New rows then land in sorted position and filtered-out rows stay hidden.
  function reapplyView() {
    if (!hot) {
      return;
    }

    const filters = hot.getPlugin('filters');
    const sorting = hot.getPlugin('columnSorting');
    const sortConfig = sorting.getSortConfig();

    if (filters.exportConditions().length > 0) {
      filters.filter();
    }

    if (Array.isArray(sortConfig) && sortConfig.length > 0) {
      sorting.sort(sortConfig);
    }
  }

  // Applies a fresh read of the sheet to the grid. readStartedAt is when the read was sent.
  function applyRemote(values: Cell[][], readStartedAt: number) {
    const { names, body } = parse(values);

    if (!hot) {
      header = names;
      idColumn = header.indexOf(ID_HEADER);

      if (idColumn === -1) {
        throw new Error(`The first row of the sheet needs a column named "${ID_HEADER}".`);
      }

      // A row typed into the sheet without an ID isn't synced. Give it one there.
      rows = [...byId(body).values()].map(({ row }) => row);
      reindex();
      hot = createGrid(container, header, rows, idColumn);
      attachHooks(hot);

      return;
    }

    checkColumns(names);

    // Setting a cell's source data refreshes an open editor and would wipe what the user is
    // typing. Skip this round; the next poll catches up.
    if (hot.getActiveEditor()?.isOpened()) {
      return;
    }

    const remoteIds = new Set<string>();
    const cellChanges: [number, number, Cell][] = [];
    let structural = false;

    for (const [id, { row: remoteRow }] of byId(body)) {
      remoteIds.add(id);
      pendingAppends.delete(id);

      if (pendingDeletes.has(id)) {
        continue;
      }

      const index = indexById.get(id);

      if (index === undefined) {
        rows.push(remoteRow);
        structural = true;
        continue;
      }

      remoteRow.forEach((value, column) => {
        const pending = pendingCells.get(key(id, column));

        if (pending) {
          const landed = pending.writtenAt !== undefined && readStartedAt > pending.writtenAt;

          if (!landed && pending.value !== value) {
            return; // This read predates the grid's write. Keep the grid's value.
          }

          pendingCells.delete(key(id, column));
        }

        if (rows[index][column] !== value) {
          cellChanges.push([index, column, value]);
        }
      });
    }

    for (const id of pendingDeletes) {
      if (!remoteIds.has(id)) {
        pendingDeletes.delete(id); // The sheet has our deletion.
      }
    }

    // Physical row indexes: a sort or filter in the grid can't misdirect a value.
    if (cellChanges.length > 0) {
      hot.setSourceDataAtCell(cellChanges, undefined, undefined, 'sync');
    }

    const removed = rows.filter((row) => {
      const id = idOf(row);

      return !remoteIds.has(id) && !pendingAppends.has(id);
    });

    if (removed.length > 0) {
      rows = rows.filter((row) => !removed.includes(row));
      structural = true;
    }

    if (structural) {
      reindex();
      hot.updateData(rows, 'sync');
      reapplyView();
    }
  }

  function enqueueWrite(task: () => Promise<void>) {
    writeQueue = writeQueue.then(task).catch(handleError);
  }

  // Writes a batch of grid edits. Reads the sheet first to find each row's current position
  // and to catch edits someone else made to the same cell since the grid last synced.
  async function flushEdits(batch: Map<string, Edit>) {
    try {
      await retrying(() => writeEdits(batch));
    } catch (error) {
      // Nothing from this batch reached the sheet: put the grid back to what the sheet holds.
      for (const edit of batch.values()) {
        settle(edit);

        const index = indexById.get(edit.id);

        if (index !== undefined) {
          hot!.setSourceDataAtCell(index, edit.column, edit.base, 'sync');
        }
      }

      throw error;
    }
  }

  async function writeEdits(batch: Map<string, Edit>) {
    const { names, body } = parse(await readSheet());

    checkColumns(names);

    const remoteById = byId(body);
    const toWrite: { sheetRow: number; column: number; value: Cell }[] = [];
    const written: Edit[] = [];

    // An edit that is settled here leaves the batch, so a retry doesn't handle it twice.
    for (const [editKey, edit] of batch) {
      const remote = remoteById.get(edit.id);

      if (!remote) {
        settle(edit);
        batch.delete(editKey);
        continue; // The row was deleted in the sheet; the next poll removes it here too.
      }

      const { sheetRow } = remote;
      const current = remote.row[edit.column];

      if (current !== edit.base && current !== edit.value) {
        // Someone changed this cell in the sheet after the grid last read it. Keep their value.
        settle(edit);
        batch.delete(editKey);

        const index = indexById.get(edit.id);

        if (index !== undefined) {
          hot!.setSourceDataAtCell(index, edit.column, current, 'sync');
        }

        notify('Edit not saved', `Someone changed "${header[edit.column]}" in the sheet first. Showing their value: ${current}`);
        continue;
      }

      written.push(edit);

      if (current !== edit.value) {
        toWrite.push({ sheetRow, column: edit.column, value: edit.value });
      }
    }

    await writeCells(toWrite);

    const now = Date.now();

    written.forEach((edit) => {
      edit.pending.writtenAt = now;
    });
  }

  // Appends rows created in the grid. A row that undo brought back keeps its ID, so it is the same
  // row again; an empty new row gets a stable ID first.
  function sendNewRows(created: Cell[][]) {
    const newRows: Cell[][] = [];
    const newIds: string[] = [];

    for (const row of created) {
      const index = rows.indexOf(row);

      if (index === -1) {
        continue; // Removed again before it could be sent.
      }

      let id = idOf(row);

      if (id === '') {
        id = crypto.randomUUID();
        hot!.setSourceDataAtCell(index, idColumn, id, 'sync');
      }

      pendingAppends.add(id);
      pendingDeletes.delete(id);
      newIds.push(id);
      newRows.push(row.map(normalize));
    }

    reindex();

    if (newRows.length === 0) {
      return;
    }

    enqueueWrite(async () => {
      try {
        // Each try reads the sheet first. A 5xx can come back after Google added the rows, so a
        // retry skips the ones the sheet already has.
        await retrying(async () => {
          const { names, body } = parse(await readSheet());

          checkColumns(names);

          const present = byId(body);

          await appendRows(newRows.filter((row) => !present.has(idOf(row))));
        });
      } catch (error) {
        // Every try failed: the rows never reached the sheet, so the next poll removes them here.
        newIds.forEach((id) => pendingAppends.delete(id));
        throw error;
      }
    });
  }

  function attachHooks(grid: Handsontable) {
    // A user's edit: remember the value the grid had before (the base), batch for 300 ms.
    grid.addHook('afterChange', (changes: CellChange[] | null, source: ChangeSource) => {
      if (!changes || OWN_SOURCES.has(source)) {
        return;
      }

      for (const [visualRow, column, oldValue, newValue] of changes) {
        const row = rows[grid.toPhysicalRow(visualRow)];
        const id = idOf(row);
        const value = normalize(newValue);
        const existing = editBatch.get(key(id, column as number));

        if (normalize(oldValue) === value) {
          continue;
        }

        const pending: Pending = { value };

        editBatch.set(key(id, column as number), {
          id,
          column: column as number,
          base: existing?.base ?? normalize(oldValue),
          value,
          pending,
        });
        pendingCells.set(key(id, column as number), pending);
      }

      clearTimeout(editTimer);
      editTimer = window.setTimeout(() => {
        const batch = editBatch;

        editBatch = new Map();
        enqueueWrite(() => flushEdits(batch));
      }, EDIT_DEBOUNCE_MS);
    });

    // A new row goes to the sheet. Undo and redo create a row first and refill it after this hook,
    // so for them the row is read once the restore has finished.
    grid.addHook('afterCreateRow', (visualIndex: number, amount: number, source?: string) => {
      if (source && OWN_SOURCES.has(source)) {
        return;
      }

      const created = Array.from({ length: amount }, (_, offset) => rows[grid.toPhysicalRow(visualIndex + offset)]);

      if (source?.startsWith('UndoRedo')) {
        queueMicrotask(() => sendNewRows(created));
      } else {
        sendNewRows(created);
      }
    });

    // Read the IDs before Handsontable removes the rows from the data.
    grid.addHook('beforeRemoveRow', (_index: number, _amount: number, physicalRows: number[], source?: string) => {
      if (source && OWN_SOURCES.has(source)) {
        return;
      }

      const ids = physicalRows.map((physical) => idOf(rows[physical])).filter((id) => id !== '');

      ids.forEach((id) => pendingDeletes.add(id));
      enqueueWrite(async () => {
        try {
          // Each try reads the sheet first, so it deletes the rows where they are now.
          await retrying(async () => {
            const { names, body } = parse(await readSheet());

            checkColumns(names);

            const remote = byId(body);
            const sheetRows = ids.flatMap((id) => remote.get(id)?.sheetRow ?? []);

            await deleteRows(sheetRows);
          });
        } catch (error) {
          // Every try failed. The rows are still in the sheet, so the next poll brings them back
          // to the grid.
          ids.forEach((id) => pendingDeletes.delete(id));
          throw error;
        }
      });
    });

    grid.addHook('afterRemoveRow', () => reindex());

    // The sync's own writes stay off the undo stack, so Ctrl+Z can't revert a colleague's change.
    grid.addHook('beforeUndoStackChange', (_doneActions: unknown[], source?: string) => source !== 'sync');
  }

  function handleError(error: unknown) {
    if (error instanceof SessionExpiredError) {
      clearTimeout(pollTimer);
      onStatus(error.message, true);

      return;
    }

    notify('Sync error', (error as Error).message);
  }

  // Reads the sheet every POLL_MS while the tab is visible.
  async function poll() {
    try {
      if (!document.hidden) {
        const readStartedAt = Date.now();

        applyRemote(await readSheet(), readStartedAt);
        pollFailing = false;
        onStatus(`Synced at ${new Date().toLocaleTimeString()}`);
      }
    } catch (error) {
      // A first read that failed, an expired session, or changed columns: stop and say why.
      if (error instanceof SessionExpiredError || !hot || columnsChanged) {
        onStatus((error as Error).message, true);

        return;
      }

      // Offline, for example. Say so once, and keep polling until a read works again.
      onStatus(`Can't reach the sheet. Retrying every ${POLL_MS / 1000} seconds.`);

      if (!pollFailing) {
        pollFailing = true;
        handleError(error);
      }
    }

    pollTimer = window.setTimeout(poll, POLL_MS);
  }

  poll();

  return {
    // Restarts polling after the user signs in again.
    resume: () => {
      clearTimeout(pollTimer);
      poll();
    },
  };
}
