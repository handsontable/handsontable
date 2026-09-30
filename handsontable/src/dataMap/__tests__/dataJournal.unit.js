import Handsontable from 'handsontable/base';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();

describe('data journal', () => {
  let container;
  let hot;
  let settled;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    settled = [];
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  /**
   * Creates a grid whose operation scope journals, and collects every settled transaction.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createJournalingGrid(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    const scope = hot._getOperationScope();

    scope.setJournaling(true);
    scope.addSettleListener(transaction => settled.push(transaction));

    return hot;
  }

  it('should journal nothing while journaling is off', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A1']],
    });
    hot._getOperationScope().addSettleListener(transaction => settled.push(transaction));

    hot.setDataAtCell(0, 0, 'x');

    expect(settled.length).toBe(1);
    expect(settled[0].journal).toEqual([]);
  });

  it('should journal a cell change by physical row with the stored old and new values', () => {
    createJournalingGrid({ data: [['A1'], ['A2'], ['A3']] });

    hot.rowIndexMapper.setIndexesSequence([2, 0, 1]);
    hot.setDataAtCell(0, 0, 'x');

    expect(settled.length).toBe(1);
    expect(settled[0].name).toBe('change');
    expect(settled[0].journal).toEqual([{
      type: 'cells',
      changes: [{ physicalRow: 2, prop: 0, oldValue: 'A3', newValue: 'x' }],
      reversed: true,
    }]);
  });

  it('should journal what the source stores, not the value a `modifyData` hook was handed', () => {
    createJournalingGrid({
      data: [['a']],
      modifyData(row, column, valueHolder, ioMode) {
        if (ioMode === 'set') {
          valueHolder.value = String(valueHolder.value).toUpperCase();
        }
      },
    });

    hot.setDataAtCell(0, 0, 'b');

    expect(hot.getSourceDataAtCell(0, 0)).toBe('B');
    expect(settled[0].journal[0].changes).toEqual([{ physicalRow: 0, prop: 0, oldValue: 'a', newValue: 'B' }]);
  });

  it('should read the old value raw, ignoring what a `modifySourceData` hook projects onto reads', () => {
    createJournalingGrid({
      data: [['stored']],
      modifySourceData(row, column, valueHolder, ioMode) {
        if (ioMode === 'get') {
          valueHolder.value = 'projected';
        }
      },
    });

    hot.setDataAtCell(0, 0, 'new');

    expect(settled[0].journal[0].changes).toEqual([{ physicalRow: 0, prop: 0, oldValue: 'stored', newValue: 'new' }]);
  });

  it('should journal an object value as a detached copy', () => {
    createJournalingGrid({ data: [[{ a: 1 }]] });

    const newValue = { a: 2 };

    hot.setDataAtCell(0, 0, newValue);
    newValue.a = 3;

    expect(settled[0].journal[0].changes[0].oldValue).toEqual({ a: 1 });
    expect(settled[0].journal[0].changes[0].newValue).toEqual({ a: 2 });
  });

  it('should journal the rows `minSpareRows` adds before the change that filled them, as one transaction', () => {
    createJournalingGrid({ data: [['A1'], ['A2']], minSpareRows: 1 });

    expect(hot.countSourceRows()).toBe(3);

    hot.setDataAtCell([[2, 0, 'x'], [3, 0, 'y']]);

    expect(settled.length).toBe(1);

    const journalTypes = settled[0].journal.map(op => op.type);

    // The change loop runs backwards, so the row for `y` is created first; `adjustRowsAndCols`
    // then tops the spare rows up after the writes.
    expect(journalTypes).toEqual(['insertRows', 'cells', 'insertRows']);
    expect(settled[0].journal[0]).toEqual({ type: 'insertRows', physicalIndex: 3, amount: 1 });
    expect(settled[0].journal[1].changes).toEqual([
      { physicalRow: 3, prop: 0, oldValue: null, newValue: 'y' },
      { physicalRow: 2, prop: 0, oldValue: null, newValue: 'x' },
    ]);
    expect(settled[0].journal[2]).toEqual({ type: 'insertRows', physicalIndex: 4, amount: 1 });
  });

  it('should journal a row removal with the rows\' content and the meta they carried', () => {
    createJournalingGrid({
      data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4']],
      cell: [{ row: 2, col: 1, className: 'from-option' }],
    });

    hot.setCellMeta(1, 0, 'className', 'user-class');
    hot.rowIndexMapper.setIndexesSequence([3, 2, 1, 0]);
    settled.length = 0;

    // Visual rows 1-2 are physical rows 2 and 1.
    hot.alter('remove_row', 1, 2);

    expect(settled.length).toBe(1);
    expect(settled[0].name).toBe('remove_row');

    const removal = settled[0].journal.find(op => op.type === 'removeRows');

    expect(removal.physicalIndexes).toEqual([1, 2]);
    expect(removal.rows).toEqual([['A2', 'B2'], ['A3', 'B3']]);
    expect(removal.metas.length).toBe(2);
    expect(removal.metas).toEqual(expect.arrayContaining([
      {
        physicalRow: 1,
        physicalColumn: 0,
        key: 'className',
        state: { hadOwn: true, value: 'user-class', origin: 'user' },
      },
      {
        physicalRow: 2,
        physicalColumn: 1,
        key: 'className',
        state: { hadOwn: true, value: 'from-option', origin: 'cellOption' },
      },
    ]));
    expect(hot.getSourceData()).toEqual([['A1', 'B1'], ['A4', 'B4']]);
  });

  it('should journal the values of an accessor column in a removed row', () => {
    const accessor = (row, value) => {
      if (value === undefined) {
        return row.name.first;
      }

      row.name.first = value;
    };

    createJournalingGrid({
      data: [{ name: { first: 'Ann' } }, { name: { first: 'Bob' } }],
      columns: [{ data: accessor }],
    });

    hot.alter('remove_row', 0);

    const removal = settled[0].journal.find(op => op.type === 'removeRows');

    expect(removal.accessorValues).toEqual([[[0, 'Ann']]]);
  });

  it('should journal a column removal with the values it held', () => {
    createJournalingGrid({ data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']] });

    hot.columnIndexMapper.setIndexesSequence([2, 1, 0]);
    settled.length = 0;
    hot.alter('remove_col', 0, 2);

    const removal = settled[0].journal.find(op => op.type === 'removeColumns');

    expect(settled[0].name).toBe('remove_col');
    expect(removal.physicalIndexes).toEqual([1, 2]);
    expect(removal.values).toEqual([['B1', 'B2'], ['C1', 'C2']]);
  });

  it('should journal row and column insertions by the physical index the new items took', () => {
    createJournalingGrid({ data: [['A1', 'B1'], ['A2', 'B2']] });

    hot.alter('insert_row_below', 0, 2);
    hot.alter('insert_col_start', 1, 1);

    expect(settled.map(transaction => transaction.name)).toEqual(['insert_row', 'insert_col']);
    expect(settled[0].journal).toEqual([{ type: 'insertRows', physicalIndex: 1, amount: 2 }]);
    expect(settled[1].journal).toEqual([{ type: 'insertColumns', physicalIndex: 1, amount: 1 }]);
  });

  it('should journal a meta write with the state the key had before and after', () => {
    createJournalingGrid({ data: [['A1']], cell: [{ row: 0, col: 0, className: 'from-option' }] });

    hot.setCellMeta(0, 0, 'className', 'user-class');
    hot.removeCellMeta(0, 0, 'className');

    expect(settled.map(transaction => transaction.name)).toEqual(['set_cell_meta', 'remove_cell_meta']);
    expect(settled[0].journal).toEqual([{
      type: 'meta',
      physicalRow: 0,
      physicalColumn: 0,
      key: 'className',
      before: { hadOwn: true, value: 'from-option', origin: 'cellOption' },
      after: { hadOwn: true, value: 'user-class', origin: 'user' },
    }]);
    expect(settled[1].journal[0].before).toEqual({ hadOwn: true, value: 'user-class', origin: 'user' });
    expect(settled[1].journal[0].after).toEqual({ hadOwn: false, value: undefined, origin: 'none' });
  });

  it('should not journal a meta write that changes nothing, a `valid` write, or a vetoed write', () => {
    createJournalingGrid({ data: [['A1']] });

    hot.setCellMeta(0, 0, 'className', 'a');
    settled.length = 0;

    hot.setCellMeta(0, 0, 'className', 'a');
    hot.setCellMeta(0, 0, 'valid', false);
    hot.addHook('beforeSetCellMeta', () => false);
    hot.setCellMeta(0, 0, 'className', 'b');

    expect(settled.length).toBe(3);
    settled.forEach(transaction => expect(transaction.journal).toEqual([]));
  });

  it('should group the calls inside `batch()` into one transaction named after the batch', () => {
    createJournalingGrid({ data: [['A1'], ['A2']] });

    hot.batch(() => {
      hot.setDataAtCell(0, 0, 'x');
      hot.alter('remove_row', 1);
      hot.setCellMeta(0, 0, 'className', 'c');
    });

    expect(settled.length).toBe(1);
    expect(settled[0].name).toBe('batch');
    expect(settled[0].operations).toEqual(['batch', 'change', 'remove_row', 'set_cell_meta']);
    expect(settled[0].journal.map(op => op.type)).toEqual(['cells', 'removeRows', 'meta']);
  });

  it('should group the calls inside `runOperation()` under its name and source', () => {
    createJournalingGrid({ data: [['A1'], ['A2']] });

    const result = hot.runOperation('import', () => {
      hot.setDataAtCell(0, 0, 'x');
      hot.setDataAtCell(1, 0, 'y');

      return 'done';
    }, 'myImport');

    expect(result).toBe('done');
    expect(settled.length).toBe(1);
    expect(settled[0].name).toBe('import');
    expect(settled[0].source).toBe('myImport');
    // One entry per edit: an entry written backwards is read backwards, so two calls must not share one.
    expect(settled[0].journal.map(op => op.changes.length)).toEqual([1, 1]);
  });

  it('should keep consecutive source writes in one forward entry', () => {
    createJournalingGrid({ data: [['A1', 'B1']] });

    hot.runOperation('import', () => {
      hot.setSourceDataAtCell(0, 0, 'x');
      hot.setSourceDataAtCell(0, 1, 'y');
    });

    expect(settled[0].journal.length).toBe(1);
    expect(settled[0].journal[0].reversed).toBeUndefined();
    expect(settled[0].journal[0].changes.map(change => change.prop)).toEqual([0, 1]);
  });

  // UndoRedo merges the journals of two transactions that ran interleaved by the order their entries
  // were recorded in, so a write must not join an entry another transaction recorded after.
  it('should start a new forward entry once another transaction journaled after the last one', () => {
    createJournalingGrid({ data: [['A1', 'B1']] });

    const scope = hot._getOperationScope();
    let hold;

    scope.run('import', undefined, () => {
      hold = scope.hold();
      hot.setSourceDataAtCell(0, 0, 'x');
    });
    hot.setSourceDataAtCell(0, 1, 'y');
    hold.resume(() => hot.setSourceDataAtCell(0, 1, 'z'));
    hold.release();

    const [other, held] = settled;
    const orderOf = op => scope.getEntryOrder(op);

    expect(held.journal.map(op => op.changes.map(change => change.newValue))).toEqual([['x'], ['z']]);
    expect(orderOf(held.journal[0])).toBeLessThan(orderOf(other.journal[0]));
    expect(orderOf(other.journal[0])).toBeLessThan(orderOf(held.journal[1]));
  });

  /**
   * Waits for the microtask in which `validateCell` calls the validator.
   *
   * @returns {Promise}
   */
  function waitForValidation() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  it('should hold the transaction of a change until its asynchronous validator answers', async() => {
    let resolveValidation;

    createJournalingGrid({
      data: [['A1']],
      validator(value, callback) {
        resolveValidation = () => callback(true);
      },
    });

    hot.setDataAtCell(0, 0, 'x');
    await waitForValidation();

    expect(settled.length).toBe(0);
    expect(hot.getDataAtCell(0, 0)).toBe('A1');

    resolveValidation();

    expect(settled.length).toBe(1);
    expect(settled[0].journal).toEqual([{
      type: 'cells',
      changes: [{ physicalRow: 0, prop: 0, oldValue: 'A1', newValue: 'x' }],
      reversed: true,
    }]);
  });

  it('should settle the transaction with nothing journaled when every change is rejected', async() => {
    let rejectValidation;

    createJournalingGrid({
      data: [['A1']],
      allowInvalid: false,
      validator(value, callback) {
        rejectValidation = () => callback(false);
      },
    });

    hot.setDataAtCell(0, 0, 'x');
    await waitForValidation();
    rejectValidation();

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
    expect(settled.length).toBe(1);
    expect(settled[0].journal).toEqual([]);

    // The next change is recorded normally.
    hot.setDataAtCell(0, 0, 'y');
    await waitForValidation();
    rejectValidation();

    expect(settled.length).toBe(2);
  });

  it('should journal a `setSourceDataAtCell` write', () => {
    createJournalingGrid({ data: [{ id: 1 }, { id: 2 }], columns: [{ data: 'id' }] });

    hot.setSourceDataAtCell(1, 'id', 20);

    expect(settled[0].journal).toEqual([{
      type: 'cells',
      changes: [{ physicalRow: 1, prop: 'id', oldValue: 2, newValue: 20 }],
    }]);
  });

  it('should open no transaction for `updateSettings()`, `loadData()` or `updateData()`', () => {
    createJournalingGrid({ data: [['A1']] });

    hot.updateSettings({ cell: [{ row: 0, col: 0, className: 'c' }], minSpareRows: 2 });
    hot.loadData([['B1']]);
    hot.updateData([['C1'], ['C2']]);

    expect(settled).toEqual([]);
  });
});
