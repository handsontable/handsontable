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
        changes?.forEach(change => physicalRows.push(hot._getChangePhysicalRow(change)));
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
