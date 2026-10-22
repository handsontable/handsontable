import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { UndoRedo } from '../../undoRedo/undoRedo';

/**
 * The cell meta a user sets on a sheet lives in core's cell meta only. A switch away keeps a snapshot
 * of it, and a return writes the snapshot back, so undo, row and column changes, and a host data load
 * act on it the way they do on a grid without the bar.
 */
describe('SheetsBar cell meta round trip', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(SheetsBar);
    registerPlugin(UndoRedo);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const build = (settings = {}) => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'One', data: [['a', 'b'], ['c', 'd'], ['e', 'f']] },
          { name: 'Two', data: [['x', 'y']] },
        ],
      },
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot.getPlugin('sheetsBar');
  };

  const roundTrip = (bar) => {
    bar.setActiveSheet('Two');
    bar.setActiveSheet('One');
  };

  it('undoes and redoes a cell meta change', () => {
    build();

    hot.setCellMeta(0, 1, 'readOnly', true);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getCellMeta(0, 1).readOnly).toBe(false);

    hot.getPlugin('undoRedo').redo();

    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
  });

  it('keeps the meta an undone cell meta change removed off the cell after a round trip', () => {
    const bar = build();

    hot.setCellMeta(0, 1, 'readOnly', true);
    hot.getPlugin('undoRedo').undo();
    roundTrip(bar);

    expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
  });

  it('keeps the meta of a row brought back by undoing its removal after a round trip', () => {
    const bar = build();

    hot.setCellMeta(1, 0, 'readOnly', true);
    hot.alter('remove_row', 1);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getCellMeta(1, 0).readOnly).toBe(true);

    roundTrip(bar);

    expect(hot.getCellMeta(1, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
  });

  it('keeps the meta on its record across a row insert and removal and a round trip', () => {
    const bar = build();

    hot.setCellMeta(2, 0, 'className', 'marked');
    hot.alter('insert_row_above', 0);
    hot.alter('remove_row', 1);
    roundTrip(bar);

    expect(hot.getDataAtCell(2, 0)).toBe('e');
    expect(hot.getCellMeta(2, 0).className).toBe('marked');
    expect(hot.getCellMeta(1, 0).className).toBeUndefined();
  });

  it('drops the returning sheet\'s meta when a host listener loads new data during the switch', () => {
    const bar = build();

    hot.setCellMeta(0, 0, 'readOnly', true);
    bar.setActiveSheet('Two');
    hot.addHookOnce('afterSheetTabStateRestore', () => {
      hot.loadData([['n1'], ['n2']]);
    });
    bar.setActiveSheet('One');

    expect(hot.getDataAtCell(0, 0)).toBe('n1');
    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
  });

  it('keeps the invalid mark of a cell after a round trip', async() => {
    const bar = build({ validator: (value, callback) => callback(value !== 'bad') });

    hot.setDataAtCell(0, 0, 'bad');
    await new Promise(resolve => hot.addHookOnce('afterValidate', () => resolve()));

    expect(hot.getCellMeta(0, 0).valid).toBe(false);

    roundTrip(bar);

    expect(hot.getCellMeta(0, 0).valid).toBe(false);
    expect(hot.getCellMeta(0, 1).valid).not.toBe(false);
  });

  it('gives a duplicate of the shown sheet the cell meta of its original', () => {
    const bar = build();

    hot.setCellMeta(0, 0, 'readOnly', true);
    hot.setCellMeta(0, 1, 'className', 'marked');

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 1).className).toBe('marked');
    expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
  });

  it('gives a duplicate of a hidden sheet the cell meta its original left with', () => {
    const bar = build();

    hot.setCellMeta(1, 1, 'className', 'marked');
    bar.setActiveSheet('Two');

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);

    expect(hot.getCellMeta(1, 1).className).toBe('marked');
  });

  it('does not share the cell meta of a duplicate with its original', () => {
    const bar = build();

    hot.setCellMeta(0, 0, 'className', 'marked');

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);
    hot.setCellMeta(0, 0, 'className', 'changed');
    bar.setActiveSheet('One');

    expect(hot.getCellMeta(0, 0).className).toBe('marked');
  });

  it('adds no listener to the cell meta read path or to row and column changes', () => {
    const bar = build();

    hot.setCellMeta(0, 0, 'readOnly', true);
    roundTrip(bar);

    const hookNames = ['afterGetCellMeta', 'afterSetCellMeta', 'afterRemoveCellMeta', 'afterCreateRow',
      'afterRemoveRow', 'afterCreateCol', 'afterRemoveCol'];

    expect(hookNames.filter(hookName => hot.hasHook(hookName))).toEqual([]);
  });
});
