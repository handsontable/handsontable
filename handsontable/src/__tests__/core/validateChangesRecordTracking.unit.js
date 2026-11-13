import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * A change that waits for its validator is written to the RECORD it was made on, whatever happens to the
 * visual row it was made at before the validator answers: a sort, a row move, a filter, a trim, an insert or a
 * removal. Its cell meta (the `valid` flag) follows the record too, so the value and the flag never split.
 */
describe('Core validation of a change while its record moves', () => {
  let container;
  let hot;
  let pending;
  let applied;
  let dropped;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
    pending = [];
    applied = [];
    dropped = [];
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Holds every answer until the test releases it.
   *
   * @param {*} value The validated value.
   * @param {Function} callback The validator callback.
   */
  function heldValidator(value, callback) {
    pending.push({ value, answer: callback });
  }

  /**
   * Creates a grid of six records `p0`..`p5`. Column 0 is validated, column 1 holds the sort key, which orders
   * the records `p0, p3, p2, p5, p1, p4`.
   *
   * @param {object} settings Extra grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [`p${row}`, (row * 5) % 7]),
      cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
      columnSorting: true,
      manualRowMove: true,
      filters: true,
      trimRows: true,
      hiddenRows: true,
      afterChange: (changes, source) => {
        if (source !== 'loadData' && changes) {
          applied.push(changes.map(change => [...change]));
        }
      },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    hot._addDroppedChangesListener((changes, source) => {
      dropped.push({ changes: changes.map(change => [...change]), source });
    });

    return hot;
  }

  /**
   * Flushes the microtasks that defer the validation.
   */
  async function settle() {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  /**
   * Answers every held validator, in the order they were asked.
   *
   * @param {boolean} [result=true] The validation result.
   */
  async function answerAll(result = true) {
    await settle();
    pending.splice(0).forEach(({ answer }) => answer(result));
    await settle();
  }

  /**
   * Reads the first column of every source record, in physical order.
   *
   * @returns {Array}
   */
  function sourceNames() {
    return hot.getSourceData().map(row => (Array.isArray(row) ? row[0] : row.name));
  }

  /**
   * Reads the `valid` flag of the first column of a record, by its physical row.
   *
   * @param {number} physicalRow The physical row.
   * @returns {boolean|undefined}
   */
  function validAt(physicalRow) {
    return hot._getMetaManager().getCellMetaIfExists(physicalRow, 0)?.valid;
  }

  /**
   * Sorts the records by the second column, ascending: `p0, p3, p2, p5, p1, p4`.
   */
  function sortByKey() {
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });
  }

  describe('a reorder of the visual rows', () => {
    it('should write the value to the edited record when the rows are sorted before the validator answers', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      sortByKey();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(hot.getDataAtCell(4, 0)).toBe('zzz');
    });

    it('should report the visual row the record has when the value lands in afterChange', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      sortByKey();
      await answerAll();

      expect(applied).toEqual([[[4, 0, 'p1', 'zzz']]]);
    });

    it('should keep the value and the invalid flag on the same record', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      sortByKey();
      await answerAll(false);

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(validAt(1)).toBe(false);
      expect([0, 2, 3, 4, 5].map(validAt).includes(false)).toBe(false);
      expect(hot.getCellMeta(4, 0).valid).toBe(false);
    });

    it('should write the value to the edited record when moveRow() moves another row over it', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.getPlugin('manualRowMove').moveRow(0, 3);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(hot.getDataAtCol(0)).toEqual(['zzz', 'p2', 'p3', 'p0', 'p4', 'p5']);
    });

    it('should write the value to the edited record when dragRows() moves another row over it', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.getPlugin('manualRowMove').dragRows([0], 4);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should write the value to the edited record when the sort runs inside batch()', async() => {
      createGrid();

      hot.batch(() => {
        hot.setDataAtCell(1, 0, 'zzz');
        sortByKey();
      });
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should write the value of a synchronous validator to the edited record when the sort runs in the same task', async() => {
      createGrid({
        cells: (row, col) => (col === 0 ? { validator: (value, callback) => callback(value !== 'zzz') } : {}),
      });

      hot.setDataAtCell(1, 0, 'zzz');
      sortByKey();
      await settle();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(validAt(1)).toBe(false);
    });

    it('should write every change of a multi-cell set to its own record', async() => {
      createGrid();

      hot.setDataAtCell([[1, 0, 'zzz'], [2, 0, 'yyy']]);
      sortByKey();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'yyy', 'p3', 'p4', 'p5']);
    });

    it('should write a populateFromArray() block to its records', async() => {
      createGrid();

      hot.populateFromArray(1, 0, [['zzz'], ['yyy']]);
      sortByKey();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'yyy', 'p3', 'p4', 'p5']);
    });

    it('should write an object-data change made with setDataAtRowProp() to its record', async() => {
      createGrid({
        data: Array.from({ length: 6 }, (_, row) => ({ name: `p${row}`, v: (row * 5) % 7 })),
        columns: [{ data: 'name' }, { data: 'v' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
      });

      hot.setDataAtRowProp(1, 'name', 'zzz');
      sortByKey();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should write the value an editor saved to the edited record when the rows are sorted', async() => {
      createGrid();

      hot.selectCell(1, 0);

      const editor = hot.getActiveEditor();

      editor.beginEditing();
      editor.setValue('zzz');
      editor.finishEditing();
      sortByKey();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
    });
  });

  describe('a trim of the visual rows', () => {
    it('should write the value to the edited record when a filter hides a row above it', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [0]);
      filters.filter();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([[[0, 0, 'p1', 'zzz']]]);
    });

    it('should write the value to the edited record when a filter hides that record, and report its row as null', async() => {
      createGrid();

      const physicalRows = [];

      hot.addHook('afterChange', (changes) => {
        changes?.forEach(change => physicalRows.push(hot.getPhysicalRowOfChange(change)));
      });
      hot.setDataAtCell(1, 0, 'zzz');

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [5]);
      filters.filter();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([[[null, 0, 'p1', 'zzz']]]);
      expect(physicalRows).toEqual([1]);
    });

    it('should write the value to the edited record when trimRow() trims a row above it', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.getPlugin('trimRows').trimRow(0);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(hot.getDataAtCell(0, 0)).toBe('zzz');
    });

    it('should keep writing to the edited record when hideRow() hides a row above it', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.getPlugin('hiddenRows').hideRow(0);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
    });
  });

  describe('an insert or a removal of rows', () => {
    it('should write the value to the edited record when a row is inserted above it', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.alter('insert_row_above', 0);
      await answerAll();

      expect(sourceNames()).toEqual([null, 'p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([[[2, 0, 'p1', 'zzz']]]);
    });

    it('should write the value to the edited record when a row is inserted below a row above it', async() => {
      createGrid();

      hot.setDataAtCell(2, 0, 'zzz');
      hot.alter('insert_row_below', 0);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', null, 'p1', 'zzz', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([[[3, 0, 'p2', 'zzz']]]);
    });

    it('should write every change to its record when rows are removed in two groups around them', async() => {
      createGrid();

      hot.setDataAtCell([[2, 0, 'two'], [5, 0, 'five']]);
      hot.alter('remove_row', [[0, 1], [3, 1]]);
      await answerAll();

      expect(sourceNames()).toEqual(['p1', 'two', 'p4', 'five']);
      expect(applied).toEqual([[[1, 0, 'p2', 'two'], [3, 0, 'p5', 'five']]]);
    });

    it('should write the value to the edited record when a row above it is removed', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.alter('remove_row', 0);
      await answerAll();

      expect(sourceNames()).toEqual(['zzz', 'p2', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([[[0, 0, 'p1', 'zzz']]]);
    });

    it('should drop the change, and tell the dropped-change listeners, when the edited record is removed', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.alter('remove_row', 1);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'p2', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([]);
      expect(dropped).toEqual([{ changes: [[1, 0, 'p1', 'zzz']], source: undefined }]);
    });

    it('should apply the changes of the records that are left when one record of the set is removed', async() => {
      createGrid();

      hot.setDataAtCell([[1, 0, 'zzz'], [2, 0, 'yyy']]);
      hot.alter('remove_row', 1);
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'yyy', 'p3', 'p4', 'p5']);
      expect(applied).toEqual([[[1, 0, 'p2', 'yyy']]]);
      expect(dropped).toEqual([{ changes: [[1, 0, 'p1', 'zzz']], source: undefined }]);
    });

    it('should keep the change of a row past the last one on its visual coordinates', async() => {
      createGrid();

      hot.setDataAtCell(6, 0, 'new');
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'new']);
      expect(applied).toEqual([[[6, 0, null, 'new']]]);
    });

    it('should create the row of a change past the last one after a row was inserted above it', async() => {
      createGrid();

      hot.setDataAtCell(6, 0, 'new');
      hot.alter('insert_row_above', 0);
      await answerAll();

      expect(sourceNames()).toEqual([null, 'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'new']);
      expect(applied).toEqual([[[7, 0, null, 'new']]]);
      expect(validAt(7)).toBe(true);
    });

    it('should create the row of a change past the last one after a row above it was removed', async() => {
      createGrid();

      hot.setDataAtCell(6, 0, 'new');
      hot.alter('remove_row', 0);
      await answerAll();

      expect(sourceNames()).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'new']);
      expect(applied).toEqual([[[5, 0, null, 'new']]]);
      expect(validAt(5)).toBe(true);
    });
  });

  describe('a record its tracked row no longer holds', () => {
    it('should find the record by its row id when the data is replaced by copies through updateSettings()', async() => {
      createGrid({
        data: Array.from({ length: 6 }, (_, row) => ({ id: `id${row}`, name: `p${row}`, v: (row * 5) % 7 })),
        columns: [{ data: 'name' }, { data: 'v' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
        rowId: 'id',
      });

      hot.setDataAtCell(1, 0, 'zzz');
      await settle();

      const copies = hot.getSourceData().map(row => ({ ...row })).reverse();

      hot.updateSettings({ data: copies, cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}) });
      await answerAll();

      expect(sourceNames()).toEqual(['p5', 'p4', 'p3', 'p2', 'zzz', 'p0']);
    });

    it('should follow the row id when updateData() brings the records back in another order', async() => {
      createGrid({
        data: Array.from({ length: 6 }, (_, row) => ({ id: `id${row}`, name: `p${row}`, v: (row * 5) % 7 })),
        columns: [{ data: 'name' }, { data: 'v' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
        rowId: 'id',
      });

      hot.setDataAtCell(1, 0, 'zzz');
      await settle();
      hot.updateData(hot.getSourceData().map(row => ({ ...row })).reverse());
      await answerAll();

      expect(hot.getSourceData().map(row => [row.id, row.name])).toEqual([
        ['id5', 'p5'], ['id4', 'p4'], ['id3', 'p3'], ['id2', 'p2'], ['id1', 'zzz'], ['id0', 'p0'],
      ]);
    });

    it('should drop the change when neither the row id nor the row object finds the record', async() => {
      createGrid({
        data: Array.from({ length: 6 }, (_, row) => ({ name: `p${row}`, v: (row * 5) % 7 })),
        columns: [{ data: 'name' }, { data: 'v' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
      });

      hot.setDataAtCell(1, 0, 'zzz');
      await settle();

      const copies = hot.getSourceData().map(row => ({ ...row })).reverse();

      hot.updateSettings({ data: copies, cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}) });
      await answerAll();

      expect(sourceNames()).toEqual(['p5', 'p4', 'p3', 'p2', 'p1', 'p0']);
      expect(dropped).toEqual([{ changes: [[1, 'name', 'p1', 'zzz']], source: undefined }]);
    });

    it('should drop the change when the record object is held by more than one row', async() => {
      const shared = { name: 'p1', v: 5 };

      createGrid({
        data: [{ name: 'p0', v: 0 }, shared, { name: 'p2', v: 3 }],
        columns: [{ data: 'name' }, { data: 'v' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
      });

      hot.setDataAtCell(0, 0, 'zzz');
      await settle();
      hot.updateSettings({
        data: [shared, { name: 'p0', v: 0 }, shared],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
      });
      await answerAll();

      expect(hot.getSourceData().map(row => row.name)).toEqual(['p1', 'p0', 'p1']);
      expect(dropped).toEqual([{ changes: [[0, 'name', 'p0', 'zzz']], source: undefined }]);
    });

    it('should keep writing into the record updateData() put at the row when the cell meta stays', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      await settle();
      hot.updateData(hot.getSourceData().map(row => [...row]).reverse());
      await answerAll();

      expect(sourceNames()).toEqual(['p5', 'zzz', 'p3', 'p2', 'p1', 'p0']);
    });

    it('should write into the record its row object names when updateData() brings the same objects back in another order', async() => {
      const data = Array.from({ length: 6 }, (_, row) => [`p${row}`, (row * 5) % 7]);

      createGrid({ data });

      hot.setDataAtCell(1, 0, 'zzz');
      await settle();
      hot.updateData([...data].reverse());
      await answerAll();

      expect(sourceNames()).toEqual(['p5', 'p4', 'p3', 'p2', 'zzz', 'p0']);
      expect(dropped).toEqual([]);
    });

    it('should keep the change of a record whose key column is edited while the change waits', async() => {
      createGrid({
        data: Array.from({ length: 6 }, (_, row) => ({ id: `id${row}`, name: `p${row}`, v: (row * 5) % 7 })),
        columns: [{ data: 'name' }, { data: 'id' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
        rowId: 'id',
      });

      hot.setDataAtCell(1, 0, 'zzz');
      await settle();
      hot.setDataAtCell(1, 1, 'idX');
      await answerAll();

      expect(hot.getSourceData().map(row => [row.id, row.name])).toEqual([
        ['id0', 'p0'], ['idX', 'zzz'], ['id2', 'p2'], ['id3', 'p3'], ['id4', 'p4'], ['id5', 'p5'],
      ]);
      expect(dropped).toEqual([]);
    });
  });

  describe('the write order of one cell', () => {
    it('should let the newer write to a record win when the rows are sorted between the two writes', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'old');
      sortByKey();
      hot.setDataAtCell(4, 0, 'new');
      await settle();

      const [first, second] = pending.splice(0);

      second.answer(true);
      await settle();
      first.answer(true);
      await settle();

      expect(sourceNames()).toEqual(['p0', 'new', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should not let a write to another record at the same visual row drop the older write', async() => {
      createGrid();

      hot.setDataAtCell(1, 0, 'old');
      sortByKey();
      hot.setDataAtCell(1, 0, 'other');
      await settle();

      const [first, second] = pending.splice(0);

      second.answer(true);
      await settle();
      first.answer(true);
      await settle();

      expect(sourceNames()).toEqual(['p0', 'old', 'p2', 'other', 'p4', 'p5']);
    });
  });

  describe('a correction a validator writes late', () => {
    it('should fold the correction into the change of the edited record after a sort', async() => {
      createGrid({
        cells: (row, col) => (col === 0 ? {
          validator(value, callback) {
            pending.push({
              value,
              answer: (result) => {
                if (value === 'zzz') {
                  this.instance.setDataAtCell(this.instance.toVisualRow(this.row), 0, 'ZZZ', 'upperValidator');
                }

                callback(result);
              },
            });
          },
        } : {}),
      });

      hot.setDataAtCell(1, 0, 'zzz');
      sortByKey();
      await answerAll();
      await answerAll();

      expect(sourceNames()).toEqual(['p0', 'ZZZ', 'p2', 'p3', 'p4', 'p5']);
      expect(applied[applied.length - 1]).toEqual([[4, 0, 'p1', 'ZZZ']]);
    });

    /**
     * Creates a grid whose validator corrects `zzz` to `ZZZ` through its own `this.visualRow`, the way a
     * validator written against the cell meta does.
     *
     * @param {object} settings Extra grid settings.
     * @returns {Handsontable}
     */
    function createCorrectingGrid(settings = {}) {
      return createGrid({
        cells: (row, col) => (col === 0 ? {
          validator(value, callback) {
            pending.push({
              value,
              answer: (result) => {
                if (value === 'zzz') {
                  this.instance.setDataAtCell(this.visualRow, this.visualCol, 'ZZZ', 'upperValidator');
                }

                callback(result);
              },
            });
          },
        } : {}),
        ...settings,
      });
    }

    it('should write the correction made through this.visualRow to the edited record after a sort without a render', async() => {
      createCorrectingGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.suspendRender();
      sortByKey();
      await answerAll();
      await answerAll();
      hot.resumeRender();

      expect(sourceNames()).toEqual(['p0', 'ZZZ', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should write the correction made through this.visualRow to the edited record after a filter trims a row above it', async() => {
      createCorrectingGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.suspendRender();

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [0]);
      filters.filter();
      await answerAll();
      await answerAll();
      hot.resumeRender();

      expect(sourceNames()).toEqual(['p0', 'ZZZ', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should write the correction made through this.visualRow to the edited record after a row is inserted above it', async() => {
      createCorrectingGrid();

      hot.setDataAtCell(1, 0, 'zzz');
      hot.suspendRender();
      hot.alter('insert_row_above', 0);
      await answerAll();
      await answerAll();
      hot.resumeRender();

      expect(sourceNames()).toEqual([null, 'p0', 'ZZZ', 'p2', 'p3', 'p4', 'p5']);
    });
  });

  describe('the row the validation hooks report', () => {
    it('should pass afterValidate the visual row the record has after a sort', async() => {
      createGrid();

      const rows = [];

      hot.addHook('afterValidate', (isValid, value, row) => {
        rows.push(row);
      });
      hot.setDataAtCell(1, 0, 'zzz');
      hot.suspendRender();
      sortByKey();
      await answerAll();
      hot.resumeRender();

      expect(rows).toEqual([4]);
    });

    it('should pass afterValidate a null row when a filter took the record out of the visual rows', async() => {
      createGrid();

      const rows = [];

      hot.addHook('afterValidate', (isValid, value, row) => {
        rows.push(row);
      });
      hot.setDataAtCell(1, 0, 'zzz');

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [5]);
      filters.filter();
      await answerAll();

      expect(rows).toEqual([null]);
      expect(sourceNames()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
    });
  });

  describe('an editor whose value the validator rejects', () => {
    /**
     * Confirms a value in the editor of a cell.
     *
     * @param {number} row The visual row.
     * @param {string} value The typed value.
     * @returns {object} The editor.
     */
    function typeInto(row, value) {
      hot.selectCell(row, 0);

      const editor = hot.getActiveEditor();

      editor.beginEditing();
      editor.setValue(value);
      editor.finishEditing();

      return editor;
    }

    it('should reopen on the row its record has after a sort', async() => {
      createGrid({ allowInvalid: false });

      const editor = typeInto(1, 'zzz');

      sortByKey();
      await answerAll(false);

      expect(editor.isOpened()).toBe(true);
      expect(hot.getSelectedLast()).toEqual([4, 0, 4, 0]);
      expect(sourceNames()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should write a corrected value to its record after reopening on the moved row', async() => {
      createGrid({ allowInvalid: false });

      const editor = typeInto(1, 'zzz');

      sortByKey();
      await answerAll(false);
      editor.setValue('fixed');
      editor.finishEditing();
      await answerAll(true);

      expect(sourceNames()).toEqual(['p0', 'fixed', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should close instead of reopening when the record was removed', async() => {
      createGrid({ allowInvalid: false });

      const editor = typeInto(1, 'zzz');

      hot.alter('remove_row', 1);
      await answerAll(false);

      expect(editor.isOpened()).toBe(false);
      expect(sourceNames()).toEqual(['p0', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should tell the close callback that nothing was saved when it closes instead of reopening', async() => {
      createGrid({ allowInvalid: false });
      hot.selectCell(1, 0);

      const editor = hot.getActiveEditor();
      const closed = [];

      editor.beginEditing();
      editor.setValue('zzz');
      editor.finishEditing(false, false, saved => closed.push(saved));

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [5]);
      filters.filter();
      await answerAll(false);

      expect(closed).toEqual([false]);
    });

    it('should show the page of the record and reopen on the record with the typed text when a sort moved it to another page', async() => {
      createGrid({
        allowInvalid: false,
        filters: false,
        trimRows: false,
        hiddenRows: false,
        pagination: { pageSize: 3 },
      });
      hot.selectCell(1, 0);

      const editor = hot.getActiveEditor();

      editor.beginEditing();
      editor.setValue('zzz');
      editor.finishEditing();
      sortByKey();

      expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(1);

      await answerAll(false);

      expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
      expect(editor.isOpened()).toBe(true);
      expect(editor.row).toBe(4);
      expect(editor.getValue()).toBe('zzz');
      expect(hot.getSelectedLast()).toEqual([4, 0, 4, 0]);
      expect(sourceNames()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should record the page change of the reveal as an undo step of its own', async() => {
      createGrid({
        allowInvalid: false,
        filters: false,
        trimRows: false,
        hiddenRows: false,
        pagination: { pageSize: 3 },
        undoRedo: true,
      });

      const undoRedo = hot.getPlugin('undoRedo');

      sortByKey();
      undoRedo.clear();
      typeInto(1, 'zzz');
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      expect(undoRedo.doneActions.map(({ actionType }) => actionType)).toEqual(['col_sort']);

      await answerAll(false);

      expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
      expect(undoRedo.doneActions.map(({ actionType }) => actionType)).toEqual(['col_sort', 'set_page']);
    });

    it('should record the page change of the reveal as an undo step of its own when the validator answers at once', async() => {
      createGrid({
        allowInvalid: false,
        filters: false,
        trimRows: false,
        hiddenRows: false,
        pagination: { pageSize: 3 },
        undoRedo: true,
        cells: (row, col) => (col === 0 ? { validator: (value, callback) => callback(value !== 'zzz') } : {}),
      });

      const undoRedo = hot.getPlugin('undoRedo');

      sortByKey();
      undoRedo.clear();

      const editor = typeInto(1, 'zzz');

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      await settle();

      expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
      expect(editor.isOpened()).toBe(true);
      expect(undoRedo.doneActions.map(({ actionType }) => actionType)).toEqual(['col_sort', 'set_page']);
    });

    it('should close without saving and keep the page the user moved to while the editor waited', async() => {
      createGrid({
        allowInvalid: false,
        filters: false,
        trimRows: false,
        hiddenRows: false,
        pagination: { pageSize: 3 },
      });
      hot.selectCell(1, 0);

      const editor = hot.getActiveEditor();
      const closed = [];

      editor.beginEditing();
      editor.setValue('zzz');
      editor.finishEditing(false, false, saved => closed.push(saved));
      hot.getPlugin('pagination').setPage(2);
      await answerAll(false);

      expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
      expect(editor.isOpened()).toBe(false);
      expect(closed).toEqual([false]);
      expect(sourceNames()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should close without saving when hiddenRows hid the record', async() => {
      createGrid({ allowInvalid: false });
      hot.selectCell(1, 0);

      const editor = hot.getActiveEditor();
      const closed = [];

      editor.beginEditing();
      editor.setValue('zzz');
      editor.finishEditing(false, false, saved => closed.push(saved));
      hot.getPlugin('hiddenRows').hideRow(1);
      hot.render();
      await answerAll(false);

      expect(editor.isOpened()).toBe(false);
      expect(closed).toEqual([false]);
      expect(sourceNames()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should close instead of reopening when a filter hid the record', async() => {
      createGrid({ allowInvalid: false });

      const editor = typeInto(1, 'zzz');
      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [5]);
      filters.filter();
      await answerAll(false);

      expect(editor.isOpened()).toBe(false);
      expect(sourceNames()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
    });
  });

  describe('an idle grid', () => {
    it('should stop listening to the index mapper once no change waits', async() => {
      createGrid();

      const mapper = hot.rowIndexMapper;
      const countListeners = () => (mapper._localHooks.indexesInserted ?? []).length;
      const idle = countListeners();

      hot.setDataAtCell(1, 0, 'zzz');

      expect(countListeners()).toBe(idle + 1);

      await answerAll();

      expect(countListeners()).toBe(idle);
    });

    it('should stop listening to the cache updates once no validator call waits', async() => {
      createGrid();

      const mapper = hot.rowIndexMapper;
      const countListeners = () => (mapper._localHooks.cacheUpdated ?? []).length;
      const idle = countListeners();

      hot.setDataAtCell(1, 0, 'zzz');

      expect(countListeners()).toBe(idle + 1);

      await answerAll();

      expect(countListeners()).toBe(idle);
    });

    it('should follow no record for a write to a row that does not exist yet', async() => {
      createGrid();

      const mapper = hot.rowIndexMapper;
      const countListeners = () => (mapper._localHooks.indexesInserted ?? []).length;
      const idle = countListeners();

      hot.setDataAtCell(6, 0, 'new');

      expect(countListeners()).toBe(idle);

      await answerAll();
    });

    it('should forget the record of an applied change once its afterChange was dispatched', async() => {
      createGrid();

      const seen = [];

      hot.addHook('afterChange', (changes, source) => {
        if (source === 'edit') {
          changes.forEach(change => seen.push({ change, during: hot.getPhysicalRowOfChange(change) }));
        }
      });
      hot.setDataAtCell(1, 0, 'zzz');

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [5]);
      filters.filter();
      await answerAll();

      expect(seen.map(({ during }) => during)).toEqual([1]);
      expect(seen.map(({ change }) => hot.getPhysicalRowOfChange(change))).toEqual([null]);
    });
  });

  describe('getPhysicalRowOfChange()', () => {
    it('should return the physical row of the record a waiting change follows, while it waits and in its hooks', async() => {
      createGrid();

      const inHooks = [];

      hot.addHook('beforeChangeRender', (changes) => {
        changes.forEach(change => inHooks.push(['beforeChangeRender', change[0], hot.getPhysicalRowOfChange(change)]));
      });
      hot.addHook('afterChange', (changes, source) => {
        if (source === 'edit') {
          changes.forEach(change => inHooks.push(['afterChange', change[0], hot.getPhysicalRowOfChange(change)]));
        }
      });

      let waiting = null;

      hot.addHook('afterSetDataAtCell', (changes) => {
        waiting = changes[0];
      });
      hot.setDataAtCell(1, 0, 'zzz', 'edit');
      sortByKey();

      expect(waiting[0]).toBe(1);
      expect(hot.getPhysicalRowOfChange(waiting)).toBe(1);

      await answerAll();

      expect(inHooks).toEqual([
        ['beforeChangeRender', 4, 1],
        ['afterChange', 4, 1],
      ]);
    });

    it('should return the physical row of a change written to a record a filter took out of the visual rows', async() => {
      createGrid();

      const inHooks = [];

      hot.addHook('afterChange', (changes, source) => {
        if (source === 'edit') {
          changes.forEach(change => inHooks.push([change[0], hot.getPhysicalRowOfChange(change)]));
        }
      });
      hot.setDataAtCell(3, 0, 'zzz', 'edit');

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'neq', [1]);
      filters.filter();
      await answerAll();

      expect(inHooks).toEqual([[null, 3]]);
    });

    it('should return null for a waiting change once its record was removed', async() => {
      createGrid();

      let waiting = null;

      hot.addHook('afterSetDataAtCell', (changes) => {
        waiting = changes[0];
      });
      hot.setDataAtCell(1, 0, 'zzz', 'edit');
      hot.alter('remove_row', 1);

      expect(hot.getPhysicalRowOfChange(waiting)).toBeNull();

      await answerAll();
    });

    it('should return the physical row of the visual row of a change no validator waited on', () => {
      createGrid({ cells: () => ({}) });
      sortByKey();

      const inHooks = [];

      hot.addHook('afterChange', (changes, source) => {
        if (source === 'edit') {
          changes.forEach(change => inHooks.push([change[0], hot.getPhysicalRowOfChange(change)]));
        }
      });
      hot.setDataAtCell(4, 0, 'zzz', 'edit');

      expect(inHooks).toEqual([[4, 1]]);
      expect(hot.getPhysicalRowOfChange([4, 0, 'p1', 'zzz'])).toBe(1);
    });

    it('should return null for a change whose row is null and that no record follows', () => {
      createGrid();

      expect(hot.getPhysicalRowOfChange([null, 0, 'p1', 'zzz'])).toBeNull();
    });
  });

  describe('NestedRows', () => {
    it('should find the edited record by its row object after a tree move rewrote the physical rows', async() => {
      createGrid({
        data: [
          { name: 'P', __children: [{ name: 'C1' }, { name: 'C2' }] },
          { name: 'Q' },
        ],
        columns: [{ data: 'name' }],
        cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
        columnSorting: false,
        filters: false,
        trimRows: false,
        hiddenRows: false,
        nestedRows: true,
      });

      hot.setDataAtCell(2, 0, 'zzz');
      hot.getPlugin('manualRowMove').dragRows([1], 3);
      await answerAll();

      expect(hot.getSourceData().map(row => row.name)).toEqual(['P', 'zzz', 'C1', 'Q']);
      expect(hot.getDataAtCol(0)).toEqual(['P', 'zzz', 'C1', 'Q']);
    });
  });
});
