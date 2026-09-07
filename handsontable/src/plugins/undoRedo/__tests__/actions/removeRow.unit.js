import Handsontable from 'handsontable/base';
import { registerPlugin, UndoRedo, HiddenColumns } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);
registerPlugin(HiddenColumns);

/**
 * Constructor-created row with a derived, non-configurable getter (reporter's fiddle for #5833).
 *
 * @param {number|null} a First operand.
 * @param {number|null} b Second operand.
 * @param {number|null} c Third operand.
 */
function DataObj(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
  Object.defineProperty(this, 'sum', {
    get() { return this.a + this.b + this.c; },
    enumerable: true,
  });
}

/**
 * Accessor-style row from the "Function data source and schema" guide (binding-to-data example7).
 *
 * @param {object} [person] Initial values. Defaults to an empty object so `dataSchema` (called
 *   with no arguments to build the internal schema) does not throw.
 * @returns {object} Row object exposing `attr(name, value?)`.
 */
function model(person = {}) {
  const pub = { id: undefined, name: undefined, address: undefined, attr: () => pub };
  const priv = {};

  Object.keys(person).forEach((key) => { priv[key] = person[key]; });

  pub.attr = (attr, val) => {
    if (typeof val === 'undefined') {
      return priv[attr];
    }
    priv[attr] = val;

    return pub;
  };

  return pub;
}

const property = attr => (row, value) => row.attr(attr, value);

describe('UndoRedo -> RemoveRow action with a function dataSchema', () => {
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

  describe('constructor rows with a non-configurable getter', () => {
    beforeEach(() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [new DataObj(1, 2, 4), new DataObj(7, 4, 1), new DataObj(4, 1, 1)],
        dataSchema: () => new DataObj(null, null, null),
        columns: [{ data: 'a' }, { data: 'b' }, { data: 'c' }, { data: 'sum' }],
        undo: true,
      });
    });

    it('should restore the removed row data on undo without throwing', () => {
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);

      expect(() => plugin.undo()).not.toThrow();
      expect(hot.getDataAtRow(1)).toEqual([7, 4, 1, 12]);
      expect(hot.countRows()).toBe(hot.getSourceData().length);
    });

    it('should keep the restored row a schema instance so the getter still derives', () => {
      hot.alter('remove_row', 1);
      hot.getPlugin('undoRedo').undo();
      hot.setDataAtCell(1, 0, 100);

      expect(hot.getDataAtCell(1, 3)).toBe(105);
    });

    it('should keep undo usable after the first undo', () => {
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);
      plugin.undo();

      expect(plugin.ignoreNewActions).toBe(false);

      hot.alter('remove_row', 0);

      expect(plugin.isUndoAvailable()).toBe(true);

      plugin.undo();

      expect(hot.getDataAtRow(0)).toEqual([1, 2, 4, 7]);
    });
  });

  describe('accessor rows with function column data', () => {
    beforeEach(() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [
          model({ id: 1, name: 'Ted Right', address: 'A' }),
          model({ id: 2, name: 'Frank Honest', address: 'B' }),
          model({ id: 3, name: 'Joan Well', address: 'C' }),
        ],
        dataSchema: model,
        columns: [{ data: property('id') }, { data: property('name') }, { data: property('address') }],
        undo: true,
      });
    });

    it('should capture accessor values instead of the accessor function', () => {
      hot.alter('remove_row', 1);

      const action = hot.getPlugin('undoRedo').doneActions[0];

      expect(action.accessorValues).toEqual([[[0, 2], [1, 'Frank Honest'], [2, 'B']]]);
      expect(Object.values(action.data[0]).some(value => typeof value === 'function')).toBe(false);
    });

    it('should restore the removed row through the accessors on undo', () => {
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);

      expect(() => plugin.undo()).not.toThrow();
      expect(hot.getData()).toEqual([
        [1, 'Ted Right', 'A'],
        [2, 'Frank Honest', 'B'],
        [3, 'Joan Well', 'C'],
      ]);
      expect(hot.countRows()).toBe(hot.getSourceData().length);
      expect(plugin.ignoreNewActions).toBe(false);
    });

    it('should redo the removal after the undo', () => {
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);
      plugin.undo();
      plugin.redo();

      expect(hot.getData()).toEqual([[1, 'Ted Right', 'A'], [3, 'Joan Well', 'C']]);
    });
  });

  it('should keep accessorValues empty for plain object rows', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ v: 'A1' }, { v: 'A2' }],
      undo: true,
    });

    hot.alter('remove_row', 0);

    expect(hot.getPlugin('undoRedo').doneActions[0].accessorValues).toEqual([[]]);
  });

  it('should restore an accessor column that is hidden at removal and undo time', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [
        model({ id: 1, name: 'Ted Right', address: 'A' }),
        model({ id: 2, name: 'Frank Honest', address: 'B' }),
      ],
      dataSchema: model,
      columns: [{ data: property('id') }, { data: property('name') }, { data: property('address') }],
      hiddenColumns: { columns: [1] },
      undo: true,
    });
    const plugin = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 1);

    // A hidden column keeps its visual index, so its value is captured like any other.
    expect(plugin.doneActions[0].accessorValues).toEqual([[[0, 2], [1, 'Frank Honest'], [2, 'B']]]);

    plugin.undo();

    expect(hot.getSourceDataAtCell(1, hot.colToProp(1))).toBe('Frank Honest');
    expect(hot.getData()).toEqual([[1, 'Ted Right', 'A'], [2, 'Frank Honest', 'B']]);
  });

  it('should run the column-level `valueSetter` when restoring an accessor column on undo', () => {
    const valueSetter = jest.fn(value => value);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [
        model({ id: 1, name: 'Ted Right' }),
        model({ id: 2, name: 'Frank Honest' }),
      ],
      dataSchema: model,
      columns: [{ data: property('id') }, { data: property('name'), valueSetter }],
      undo: true,
    });
    const plugin = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 1);
    valueSetter.mockClear();
    plugin.undo();

    expect(valueSetter).toHaveBeenCalledWith('Frank Honest', expect.anything(), expect.anything(), expect.anything());
    expect(hot.getDataAtCell(1, 1)).toBe('Frank Honest');
  });

  it('should drop nested function-valued keys from the row snapshot', () => {
    /**
     * Row with a per-row closure nested one level down.
     *
     * @param {number} id Row id.
     * @returns {object} Row object.
     */
    const makeRow = id => ({ id, meta: { onSelect: () => id, label: `row ${id}` } });

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [makeRow(1), makeRow(2)],
      columns: [{ data: 'id' }, { data: 'meta.label' }],
      undo: true,
    });
    const plugin = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 1);

    const snapshot = plugin.doneActions[0].data[0];

    expect(typeof snapshot.meta.onSelect).toBe('undefined');
    expect(snapshot.meta.label).toBe('row 2');

    plugin.undo();

    expect(hot.getSourceDataAtRow(1).meta.label).toBe('row 2');
    expect(hot.getSourceDataAtRow(1).meta.onSelect).toBeUndefined();
  });

  it('should not settle onto the redo stack when the restoring write throws during undo', () => {
    let throwOnWrite = false;

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [
        model({ id: 1, name: 'Ted Right' }),
        model({ id: 2, name: 'Frank Honest' }),
      ],
      dataSchema: model,
      columns: [{
        data: (row, value) => {
          if (value === undefined) {
            return row.attr('id');
          }
          if (throwOnWrite) {
            throw new Error('write boom');
          }
          row.attr('id', value);
        },
      }, { data: property('name') }],
      undo: true,
    });
    const plugin = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 1);
    throwOnWrite = true;

    expect(() => plugin.undo()).toThrow('write boom');
    expect(plugin.ignoreNewActions).toBe(false);
    expect(plugin.undoneActions.length).toBe(0);

    // The `afterViewRender` settle callback must be disarmed – a later render must not push the
    // half-undone action onto the redo stack.
    hot.render();

    expect(plugin.undoneActions.length).toBe(0);
    expect(plugin.isRedoAvailable()).toBe(false);
  });

  describe('columnar source with an `index`-stamped live row view (guide example)', () => {
    /**
     * Builds the "Function data source and schema" guide's columnar setup.
     *
     * @returns {object} `{ settings, source, rows }`.
     */
    function buildColumnarFixture() {
      const source = [
        ['A1', 'A2', 'A3'],
        ['B1', 'B2', 'B3'],
      ];
      const restamp = (rows) => {
        rows.forEach((row, index) => {
          row.index = index;
        });

        return rows;
      };
      const rows = restamp(Array.from({ length: 3 }, () => ({ index: 0 })));
      // eslint-disable-next-line func-style
      const accessor = columnIndex => function(row, value) {
        if (arguments.length === 1) {
          return row ? source[columnIndex][row.index] ?? null : null;
        }
        if (row) {
          source[columnIndex][row.index] = value;
        }
      };
      const settings = {
        licenseKey: 'non-commercial-and-evaluation',
        data: rows,
        columns: source.map((column, columnIndex) => ({ data: accessor(columnIndex) })),
        dataSchema: () => ({ index: -1 }),
        undo: true,
        afterCreateRow(index, amount) {
          const at = rows.findIndex(row => row.index === -1);

          source.forEach((column) => {
            column.splice(at === -1 ? index : at, 0, ...new Array(amount).fill(null));
          });
          restamp(rows);
          this.render();
        },
        afterRemoveRow(index, amount, physicalRows) {
          [...physicalRows].sort((a, b) => b - a).forEach((row) => {
            source.forEach(column => column.splice(row, 1));
          });
          restamp(rows);
          this.render();
        },
      };

      return { settings, source };
    }

    it('should restore the row into its original physical slot on undo', () => {
      const { settings, source } = buildColumnarFixture();

      hot = new Handsontable(container, settings);
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);

      expect(source).toEqual([['A1', 'A3'], ['B1', 'B3']]);

      plugin.undo();

      expect(source).toEqual([['A1', 'A2', 'A3'], ['B1', 'B2', 'B3']]);
      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']]);
    });

    it('should restore correctly when the remaining rows were reordered between removal and undo', () => {
      const { settings, source } = buildColumnarFixture();

      hot = new Handsontable(container, settings);
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);
      // A row move (or a sort) only remaps visual indexes – the physical `rows` array and the
      // `index` stamps are untouched, so the captured stamp still names the right physical slot.
      hot.rowIndexMapper.setIndexesSequence([1, 0]);

      plugin.undo();

      expect(source).toEqual([['A1', 'A2', 'A3'], ['B1', 'B2', 'B3']]);
      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']]);
    });
  });
});
