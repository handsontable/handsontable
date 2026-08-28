import Handsontable from 'handsontable/base';
import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);

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
});
