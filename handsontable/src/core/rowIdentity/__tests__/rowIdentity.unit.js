import Handsontable from 'handsontable/base';
import {
  AutoColumnSize, ColumnSorting, DropdownMenu, Filters, HiddenRows, ManualRowMove, registerPlugin, TrimRows, UndoRedo,
} from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

registerPlugin(UndoRedo);
registerPlugin(ColumnSorting);
registerPlugin(ManualRowMove);
registerPlugin(TrimRows);
// Filters requires these.
registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

/**
 * Builds row objects whose `name` is unique, so a test can tell which record sits in a visual row.
 *
 * @param {number} rows The number of rows.
 * @returns {object[]}
 */
function createRecords(rows) {
  return Array.from({ length: rows }, (_, row) => ({ id: `id-${row}`, name: `R${row}`, value: row * 10 }));
}

const MODES = [
  { title: 'a property path', rowId: 'id' },
  { title: 'a function', rowId: row => row.id },
  { title: 'generated ids', rowId: true },
];

describe('Row identity', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  /**
   * Builds a grid that shows the `name` and `value` of each record.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: createRecords(6),
      columns: [{ data: 'name' }, { data: 'value' }],
      undo: true,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the id of each record, keyed by the record's `name`.
   *
   * @returns {Map<string, *>}
   */
  function readIdsByName() {
    const ids = new Map();

    for (let row = 0; row < hot.countRows(); row += 1) {
      ids.set(hot.getDataAtCell(row, 0), hot.getRowId(row));
    }

    return ids;
  }

  /**
   * Asserts that every visual row still has the id its record had, and that both lookups find it.
   *
   * @param {Map<string, *>} idsByName The ids read before the action.
   */
  function expectIdsToFollowRecords(idsByName) {
    for (let row = 0; row < hot.countRows(); row += 1) {
      const id = idsByName.get(hot.getDataAtCell(row, 0));

      expect(id).not.toBeNull();
      expect(hot.getRowId(row)).toBe(id);
      expect(hot.getVisualRowById(id)).toBe(row);
      expect(hot.getPhysicalRowById(id)).toBe(hot.toPhysicalRow(row));
    }
  }

  describe('with no `rowId` option', () => {
    it('should answer `null` for every row and every id', () => {
      createGrid({});

      expect(hot.getSettings().rowId).toBeUndefined();
      expect(hot.getRowId(0)).toBeNull();
      expect(hot.getVisualRowById('id-0')).toBeNull();
      expect(hot.getPhysicalRowById('id-0')).toBeNull();
    });

    // `setSourceDataAtCell()` skips building its hook payload while nothing listens to the hook.
    it('should listen to source data writes only while a row key is used', () => {
      // AutoColumnSize listens to the hook too.
      createGrid({ autoColumnSize: false });

      expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(false);

      hot.updateSettings({ rowId: true });

      expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(false);

      hot.updateSettings({ rowId: 'id' });

      expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(true);

      hot.updateSettings({ rowId: false });

      expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(false);
    });

    it('should not register an index map', () => {
      createGrid({});

      expect(hot.rowIndexMapper.variousMapsCollection.get('rowId')).toBeUndefined();
    });
  });

  MODES.forEach(({ title, rowId }) => {
    describe(`with ${title}`, () => {
      it('should give every row a distinct id and find each row by it', () => {
        createGrid({ rowId });

        const ids = readIdsByName();

        expect(new Set(ids.values()).size).toBe(6);
        expectIdsToFollowRecords(ids);
      });

      it('should keep the ids with their records after sorting, and after undo and redo', () => {
        createGrid({ rowId, columnSorting: true });

        const ids = readIdsByName();

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

        expect(hot.getDataAtCell(0, 0)).toBe('R5');
        expectIdsToFollowRecords(ids);

        hot.getPlugin('undoRedo').undo();

        expect(hot.getDataAtCell(0, 0)).toBe('R0');
        expectIdsToFollowRecords(ids);

        hot.getPlugin('undoRedo').redo();

        expect(hot.getDataAtCell(0, 0)).toBe('R5');
        expectIdsToFollowRecords(ids);
      });

      it('should keep the ids with their records after filtering, and find a filtered-out row physically only', () => {
        createGrid({ rowId, filters: true });

        const ids = readIdsByName();
        const filters = hot.getPlugin('filters');

        filters.addCondition(1, 'gt', [25]);
        filters.filter();

        expect(hot.countRows()).toBe(3);
        expectIdsToFollowRecords(ids);
        expect(hot.getVisualRowById(ids.get('R0'))).toBeNull();
        expect(hot.getPhysicalRowById(ids.get('R0'))).toBe(0);

        hot.getPlugin('undoRedo').undo();

        expect(hot.countRows()).toBe(6);
        expectIdsToFollowRecords(ids);

        hot.getPlugin('undoRedo').redo();

        expect(hot.countRows()).toBe(3);
        expectIdsToFollowRecords(ids);
      });

      it('should keep the ids with their records after a row move, and after undo and redo', () => {
        createGrid({ rowId, manualRowMove: true });

        const ids = readIdsByName();

        hot.getPlugin('manualRowMove').moveRow(0, 4);
        hot.render();

        expect(hot.getDataAtCell(4, 0)).toBe('R0');
        expectIdsToFollowRecords(ids);

        hot.getPlugin('undoRedo').undo();

        expect(hot.getDataAtCell(0, 0)).toBe('R0');
        expectIdsToFollowRecords(ids);

        hot.getPlugin('undoRedo').redo();

        expect(hot.getDataAtCell(4, 0)).toBe('R0');
        expectIdsToFollowRecords(ids);
      });

      it('should keep the ids with their records after trimming, and find a trimmed row physically only', () => {
        createGrid({ rowId, trimRows: true });

        const ids = readIdsByName();

        hot.getPlugin('trimRows').trimRow(1);
        hot.render();

        expect(hot.countRows()).toBe(5);
        expectIdsToFollowRecords(ids);
        expect(hot.getVisualRowById(ids.get('R1'))).toBeNull();
        expect(hot.getPhysicalRowById(ids.get('R1'))).toBe(1);

        hot.getPlugin('undoRedo').undo();

        expect(hot.countRows()).toBe(6);
        expectIdsToFollowRecords(ids);

        hot.getPlugin('undoRedo').redo();

        expect(hot.countRows()).toBe(5);
        expectIdsToFollowRecords(ids);
      });

      it('should keep the ids with their records after a removal, and after undo and redo', () => {
        createGrid({ rowId });

        const ids = readIdsByName();
        const removedId = ids.get('R1');

        hot.alter('remove_row', 1, 2);

        expect(hot.countRows()).toBe(4);
        expectIdsToFollowRecords(ids);
        expect(hot.getVisualRowById(removedId)).toBeNull();
        expect(hot.getPhysicalRowById(removedId)).toBeNull();
        expect(hot.getVisualRowById(ids.get('R2'))).toBeNull();

        hot.getPlugin('undoRedo').undo();

        expect(hot.countRows()).toBe(6);
        expectIdsToFollowRecords(ids);
        expect(hot.getVisualRowById(removedId)).toBe(1);

        hot.getPlugin('undoRedo').redo();

        expect(hot.countRows()).toBe(4);
        expectIdsToFollowRecords(ids);
        expect(hot.getPhysicalRowById(removedId)).toBeNull();
      });

      it('should keep the ids with their records after an insertion, and after undo and redo', () => {
        createGrid({ rowId });

        const ids = readIdsByName();

        hot.alter('insert_row_above', 2, 1);
        hot.setDataAtCell(2, 0, 'NEW');

        const insertedId = hot.getRowId(2);

        // A key that the new row does not hold yet gives no id.
        if (rowId === true) {
          expect(insertedId).not.toBeNull();
          expect([...ids.values()]).not.toContain(insertedId);
          expect(hot.getVisualRowById(insertedId)).toBe(2);
        } else {
          expect(insertedId).toBeNull();
        }

        ids.set('NEW', insertedId);

        expect(hot.countRows()).toBe(7);
        expect(hot.getVisualRowById(ids.get('R2'))).toBe(3);

        hot.getPlugin('undoRedo').undo(); // the edit
        hot.getPlugin('undoRedo').undo(); // the insertion

        expect(hot.countRows()).toBe(6);
        expect(hot.getVisualRowById(ids.get('R2'))).toBe(2);

        if (rowId === true) {
          expect(hot.getVisualRowById(insertedId)).toBeNull();
        }

        hot.getPlugin('undoRedo').redo();
        hot.getPlugin('undoRedo').redo();

        expect(hot.countRows()).toBe(7);
        expect(hot.getDataAtCell(2, 0)).toBe('NEW');
        expect(hot.getRowId(2)).toBe(insertedId);
        expect(hot.getVisualRowById(ids.get('R2'))).toBe(3);
      });

      it('should answer `null` for an unknown id and for a row index out of range', () => {
        createGrid({ rowId });

        expect(hot.getVisualRowById('unknown')).toBeNull();
        expect(hot.getPhysicalRowById('unknown')).toBeNull();
        expect(hot.getVisualRowById(null)).toBeNull();
        expect(hot.getVisualRowById(undefined)).toBeNull();
        expect(hot.getRowId(6)).toBeNull();
        expect(hot.getRowId(-1)).toBeNull();
        expect(hot.getRowId(1.5)).toBeNull();
      });
    });
  });

  describe('with a row key', () => {
    it('should find a row by an id written through the API, and forget the id it replaced', () => {
      createGrid({ rowId: 'id', columns: [{ data: 'name' }, { data: 'id' }] });

      expect(hot.getVisualRowById('id-3')).toBe(3);

      hot.setDataAtCell(3, 1, 'changed');

      expect(hot.getRowId(3)).toBe('changed');
      expect(hot.getVisualRowById('changed')).toBe(3);
      expect(hot.getVisualRowById('id-3')).toBeNull();
    });

    it('should not read every row again for a lookup made between two writes and a settings update', () => {
      const readId = jest.fn(row => row.id);

      createGrid({ rowId: readId, data: createRecords(60) });

      expect(hot.getVisualRowById('id-10')).toBe(10);

      readId.mockClear();
      hot.setDataAtRowProp(3, 'value', 1);
      hot.updateSettings({ colHeaders: true });

      expect(hot.getVisualRowById('id-40')).toBe(40);
      expect(hot.getVisualRowById('id-50')).toBe(50);
      expect(readId.mock.calls.length).toBeLessThan(5);
    });

    it('should not return a row whose id changed directly in the source data', () => {
      const data = createRecords(6);

      createGrid({ rowId: 'id', data });

      expect(hot.getVisualRowById('id-2')).toBe(2);

      data[2].id = 'mutated';

      expect(hot.getVisualRowById('id-2')).toBeNull();
      expect(hot.getVisualRowById('mutated')).toBe(2);
    });

    it('should read a nested property path', () => {
      createGrid({
        rowId: 'meta.key',
        data: [{ name: 'A', meta: { key: 10 } }, { name: 'B', meta: { key: 20 } }],
      });

      expect(hot.getRowId(1)).toBe(20);
      expect(hot.getVisualRowById(10)).toBe(0);
    });

    it('should read an array row by index', () => {
      createGrid({ rowId: '0', data: [['a', 1], ['b', 2]], columns: undefined });

      expect(hot.getRowId(1)).toBe('b');
      expect(hot.getVisualRowById('a')).toBe(0);
    });

    it('should return the row with the lower physical index when two rows share an id', () => {
      createGrid({ rowId: 'id', data: [{ id: 1, name: 'A' }, { id: 1, name: 'B' }, { id: 2, name: 'C' }] });

      expect(hot.getPhysicalRowById(1)).toBe(0);
    });

    it('should find the ids of new data after a lookup was made on the old data', () => {
      createGrid({ rowId: 'id' });

      expect(hot.getVisualRowById('id-1')).toBe(1);

      hot.loadData([{ id: 'loaded', name: 'L', value: 1 }]);

      expect(hot.getVisualRowById('loaded')).toBe(0);
      expect(hot.getVisualRowById('id-1')).toBeNull();

      hot.updateData([{ id: 'updated', name: 'U', value: 2 }]);

      expect(hot.getVisualRowById('updated')).toBe(0);
      expect(hot.getVisualRowById('loaded')).toBeNull();
    });

    it('should find the id of a row created with an id from the data schema', () => {
      createGrid({ rowId: 'id', dataSchema: () => ({ id: 'from-schema', name: null, value: null }) });

      expect(hot.getVisualRowById('id-1')).toBe(1);

      hot.alter('insert_row_above', 0, 1);

      expect(hot.getVisualRowById('from-schema')).toBe(0);
      expect(hot.getVisualRowById('id-1')).toBe(2);
    });

    it('should read the ids with a new key after a settings update', () => {
      createGrid({ rowId: 'id' });

      expect(hot.getVisualRowById('id-3')).toBe(3);

      hot.updateSettings({ rowId: 'name' });

      expect(hot.getVisualRowById('R3')).toBe(3);
      expect(hot.getVisualRowById('id-3')).toBeNull();
    });

    it('should not give a visual index or an id to a row past `maxRows`', () => {
      createGrid({ rowId: 'id', maxRows: 3 });

      expect(hot.countRows()).toBe(3);
      expect(hot.getRowId(4)).toBeNull();
      expect(hot.getVisualRowById('id-4')).toBeNull();
      expect(hot.getPhysicalRowById('id-4')).toBe(4);
      expect(hot.getVisualRowById('id-2')).toBe(2);
    });

    it('should let an `afterChange` listener find an id it was just told about', () => {
      createGrid({ columns: [{ data: 'name' }, { data: 'id' }] });

      const found = [];

      hot.addHook('afterChange', (changes, source) => {
        if (source === 'edit') {
          found.push(hot.getVisualRowById(changes[0][3]));
        }
      });
      hot.updateSettings({ rowId: 'id' });

      expect(hot.getVisualRowById('id-1')).toBe(1);

      hot.setDataAtCell(1, 1, 'renamed');

      expect(found).toEqual([1]);
    });

    it('should keep the visual index of a hidden row', () => {
      createGrid({ rowId: 'id', hiddenRows: { rows: [2] } });

      expect(hot.getVisualRowById('id-2')).toBe(2);
      expect(hot.getRowId(2)).toBe('id-2');
    });

    it('should keep the ids of the records `loadData()` brings back', () => {
      createGrid({ rowId: 'id' });

      hot.loadData(createRecords(3).reverse());

      expect(hot.getVisualRowById('id-0')).toBe(2);
      expect(hot.getVisualRowById('id-5')).toBeNull();
    });
  });

  describe('with generated ids', () => {
    it('should give new ids to the rows of new data', () => {
      createGrid({ rowId: true });

      const ids = [...readIdsByName().values()];

      hot.loadData(createRecords(3));

      const newIds = [...readIdsByName().values()];

      expect(newIds.length).toBe(3);
      newIds.forEach(id => expect(ids).not.toContain(id));
      ids.forEach(id => expect(hot.getPhysicalRowById(id)).toBeNull());
    });

    it('should find the new ids after `loadData()` replaced data of the same length', () => {
      createGrid({ rowId: true });

      const oldId = hot.getRowId(0);

      expect(hot.getVisualRowById(oldId)).toBe(0);

      hot.loadData(createRecords(6));

      const newId = hot.getRowId(0);

      expect(newId).not.toBe(oldId);
      expect(hot.getVisualRowById(newId)).toBe(0);
      expect(hot.getVisualRowById(oldId)).toBeNull();
    });

    // `updateSettings()` re-initializes every row index map when `columns` change, and the wrappers re-send them.
    it('should keep the ids when a `columns` update re-initializes the index maps', () => {
      createGrid({ rowId: true, columnSorting: true });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      const ids = readIdsByName();

      hot.updateSettings({ columns: [{ data: 'name' }, { data: 'value' }, { data: 'id' }] });

      expectIdsToFollowRecords(ids);
    });

    it('should keep the ids by position when `updateSettings()` replaces the data and the columns', () => {
      createGrid({ rowId: true });

      const oldIds = [...readIdsByName().values()];

      hot.updateSettings({ data: createRecords(4), columns: [{ data: 'name' }, { data: 'value' }] });

      expect(hot.countRows()).toBe(4);
      expectIdsToFollowRecords(readIdsByName());
      oldIds.slice(0, 4).forEach((id, row) => expect(hot.getRowId(row)).toBe(id));
    });

    it('should keep the ids of the rows `updateData()` keeps, by position', () => {
      createGrid({ rowId: true });

      const ids = [0, 1, 2].map(row => hot.getRowId(row));

      hot.updateData(createRecords(3));

      expect([0, 1, 2].map(row => hot.getRowId(row))).toEqual(ids);
      expect(hot.getPhysicalRowById(ids[2])).toBe(2);
    });

    it('should register the map when the option turns on, and unregister it when it turns off', () => {
      createGrid({});

      expect(hot.getRowId(0)).toBeNull();

      hot.updateSettings({ rowId: true });

      const id = hot.getRowId(0);

      expect(id).not.toBeNull();
      expect(hot.getVisualRowById(id)).toBe(0);

      hot.updateSettings({ rowId: false });

      expect(hot.getRowId(0)).toBeNull();
      expect(hot.getVisualRowById(id)).toBeNull();
    });

    it('should keep the ids when a settings update leaves the option as it was', () => {
      createGrid({ rowId: true });

      const ids = readIdsByName();

      hot.updateSettings({ rowId: true, colHeaders: true });

      expectIdsToFollowRecords(ids);
    });
  });

  describe('with a `dataProvider` that sets `rowId`', () => {
    // The DataProvider plugin is not registered here, so the setting is read without fetching anything.
    const dataProvider = { rowId: 'id' };

    it('should read the ids with `dataProvider.rowId`, and not warn', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createGrid({ dataProvider });

      expect(hot.getRowId(2)).toBe('id-2');
      expect(hot.getVisualRowById('id-4')).toBe(4);

      hot.updateSettings({ rowId: false });
      hot.getRowId(0);

      expect(warnSpy.mock.calls.filter(([message]) => String(message).includes('dataProvider.rowId')).length)
        .toBe(0);

      warnSpy.mockRestore();
    });

    it('should not warn when the `rowId` option is the same key', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createGrid({ dataProvider, rowId: 'id' });

      expect(hot.getRowId(1)).toBe('id-1');
      expect(warnSpy.mock.calls.filter(([message]) => String(message).includes('dataProvider.rowId')).length)
        .toBe(0);

      warnSpy.mockRestore();
    });

    it('should ignore a different `rowId` option, and warn once', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createGrid({ dataProvider, rowId: 'name' });

      expect(hot.getRowId(2)).toBe('id-2');
      expect(hot.getRowId(3)).toBe('id-3');

      const warnings = warnSpy.mock.calls.filter(([message]) => String(message).includes('dataProvider.rowId'));

      expect(warnings.length).toBe(1);

      warnSpy.mockRestore();
    });
  });
});
