import { IndexMapper } from 'handsontable/translations';
import { createRecordTracker } from '../recordTracker';
import { createWaitingChangeRecords } from '../waitingRecords';
import type { WaitingChangeRecords } from '../waitingRecords';
import type { CellChange } from '../../settings';

/**
 * The records of one waiting change set are resolved at once when the set is applied, so `settle()` reads each
 * source row once however many of its records it has to look for.
 */
describe('createWaitingChangeRecords', () => {
  it('should read every source row once when settle() looks for several removed records', () => {
    const mapper = new IndexMapper();
    let rows: object[] = Array.from({ length: 100 }, () => ({}));

    mapper.initToLength(rows.length);

    let rowReads = 0;
    const reader = {
      countPhysicalRows: () => rows.length,
      countVisualRows: () => mapper.getNotTrimmedIndexesLength(),
      readRowObject: (physicalRow: number) => {
        rowReads += 1;

        return rows[physicalRow];
      },
      getStoredMeta: () => undefined,
      readKeyedRowId: () => null,
      findPhysicalRowById: () => null,
    };
    const records = createWaitingChangeRecords(
      createRecordTracker(() => mapper),
      reader,
      visualRow => visualRow,
      new WeakMap<object, WaitingChangeRecords>(),
      () => () => {},
    );
    const changes: CellChange[] = Array.from({ length: 10 }, (_, row): CellChange => [row, 0, 'old', 'new']);

    records.capture(changes);
    mapper.removeIndexes(Array.from({ length: 10 }, (_, row) => row));
    rows = rows.slice(10);
    rowReads = 0;

    const removed = records.settle(changes, physicalRow => physicalRow);

    expect(removed.length).toBe(10);
    expect(changes).toEqual([]);
    expect(rowReads).toBe(rows.length);
  });
});
