import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { UndoRedo } from '../../undoRedo/undoRedo';
import { CustomBorders } from '../../customBorders/customBorders';
import { Filters } from '../../filters/filters';
import { DropdownMenu } from '../../dropdownMenu/dropdownMenu';
import { HiddenRows } from '../../hiddenRows/hiddenRows';
import { AutoColumnSize } from '../../autoColumnSize/autoColumnSize';
import { RowSelection } from '../../rowSelection/rowSelection';
import { registerCellType } from '../../../cellTypes/registry';
import { CheckboxCellType } from '../../../cellTypes/checkboxType/checkboxType';

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
    registerPlugin(CustomBorders);
    registerPlugin(AutoColumnSize);
    registerPlugin(DropdownMenu);
    registerPlugin(HiddenRows);
    registerPlugin(Filters);
    registerPlugin(RowSelection);
    registerCellType(CheckboxCellType);
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

  const borderCells = () => hot.getPlugin('customBorders').getBorders()
    .map(({ row, col }) => [row, col])
    .sort(([rowA, colA], [rowB, colB]) => (rowA - rowB) || (colA - colB));

  const redTop = { top: { width: 2, color: 'red' } };

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
    const hookNames = ['afterGetCellMeta', 'afterSetCellMeta', 'afterRemoveCellMeta', 'afterCreateRow',
      'afterRemoveRow', 'afterCreateCol', 'afterRemoveCol'];

    hot = new Handsontable(container, {
      data: [['a', 'b']],
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const withoutBar = hookNames.filter(hookName => hot.hasHook(hookName));

    hot.destroy();

    const bar = build();

    hot.setCellMeta(0, 0, 'readOnly', true);
    roundTrip(bar);

    expect(hookNames.filter(hookName => hot.hasHook(hookName))).toEqual(withoutBar);
  });

  it('gives a duplicate of a never-visited duplicate the meta of the first original', () => {
    const bar = build();

    hot.setCellMeta(0, 1, 'className', 'marked');

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);
    const copyOfCopy = bar.duplicateSheet(copy.id);

    bar.setActiveSheet(copyOfCopy.id);

    expect(hot.getCellMeta(0, 1).className).toBe('marked');
  });

  it('lets a grid-level `cell` set while the sheet was hidden win over a value set on the same key', () => {
    const bar = build({ cell: [{ row: 0, col: 0, className: 'declared-1' }] });

    hot.setCellMeta(0, 0, 'className', 'user');
    bar.setActiveSheet('Two');
    hot.updateSettings({ cell: [{ row: 0, col: 0, className: 'declared-2' }] });
    bar.setActiveSheet('One');

    expect(hot.getCellMeta(0, 0).className).toBe('declared-2');
  });

  it('drops the kept meta of rows the host removed from the sheet\'s data while it was hidden', () => {
    const data = [['a', 'b'], ['c', 'd'], ['e', 'f']];

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'One', data }, { name: 'Two', data: [['x', 'y']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.getPlugin('sheetsBar');

    hot.setCellMeta(2, 0, 'readOnly', true);
    bar.setActiveSheet('Two');
    data.length = 1;
    bar.setActiveSheet('One');

    expect(hot._getMetaManager().getUserDefinedCellMetas()).toEqual([]);

    hot.alter('insert_row_below', 0, 2, 'auto');

    expect(hot.countRows()).toBe(3);
    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
  });

  it('does not put kept meta on the rows the load adds to reach `minRows`', () => {
    const data = [['a', 'b'], ['c', 'd'], ['e', 'f']];

    hot = new Handsontable(container, {
      minRows: 5,
      sheetsBar: { sheets: [{ name: 'One', data }, { name: 'Two', data: [['x', 'y']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.getPlugin('sheetsBar');

    hot.setCellMeta(2, 0, 'readOnly', true);
    hot.setCellMeta(4, 1, 'className', 'marked');
    bar.setActiveSheet('Two');
    data.length = 1;
    bar.setActiveSheet('One');

    expect(hot.countRows()).toBe(5);
    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
    expect(hot.getCellMeta(4, 1).className).toBeUndefined();
  });

  it('keeps the meta of a column the `columns` setting adds past the data\'s width', () => {
    const bar = build({ columns: [{}, {}, {}] });

    hot.setCellMeta(0, 2, 'className', 'marked');
    roundTrip(bar);

    expect(hot.getCellMeta(0, 2).className).toBe('marked');
  });

  it('keeps the meta of a row that was padding when it was set, once it is part of the sheet\'s data', () => {
    hot = new Handsontable(container, {
      minRows: 5,
      sheetsBar: { sheets: [{ name: 'One', data: [['a', 'b']] }, { name: 'Two', data: [['x', 'y']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.getPlugin('sheetsBar');

    hot.setCellMeta(3, 0, 'readOnly', true);
    roundTrip(bar);

    expect(hot.getCellMeta(3, 0).readOnly).toBe(true);
  });

  it('draws the borders a duplicate takes from its original', () => {
    const bar = build({ customBorders: true });

    hot.getPlugin('customBorders').setBorders([[0, 0, 0, 0]], redTop);

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);

    expect(borderCells()).toEqual([[0, 0]]);
    expect(hot.getCellMeta(0, 0).borders).toBeDefined();
  });

  it('gives a duplicate the borders its original has now, not the declared ones', () => {
    const bar = build({ customBorders: [{ row: 1, col: 1, ...redTop }] });
    const borders = hot.getPlugin('customBorders');

    borders.clearBorders();
    borders.setBorders([[0, 0, 0, 0]], redTop);

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);

    expect(borderCells()).toEqual([[0, 0]]);
  });

  it('brings back the borders a sheet left with over the borders it declares', () => {
    const bar = build({ customBorders: [{ row: 1, col: 1, ...redTop }] });
    const borders = hot.getPlugin('customBorders');

    borders.clearBorders();
    borders.setBorders([[0, 0, 0, 0]], redTop);
    roundTrip(bar);

    expect(borderCells()).toEqual([[0, 0]]);
    expect(hot.getCellMeta(1, 1).borders).toBeUndefined();
  });

  it('keeps a border on a row the filters hid when the user left', () => {
    const bar = build({ customBorders: true, filters: true });
    const filters = hot.getPlugin('filters');

    hot.getPlugin('customBorders').setBorders([[1, 1, 1, 1]], redTop);
    filters.addCondition(0, 'neq', ['c']);
    filters.filter();
    roundTrip(bar);
    filters.clearConditions();
    filters.filter();

    expect(hot.getDataAtCell(1, 0)).toBe('c');
    expect(borderCells()).toEqual([[1, 1]]);
  });

  it('lets RowSelection select every writable row and skip the read-only ones after a round trip under a filter', () => {
    hot = new Handsontable(container, {
      columns: [{ type: 'checkbox' }, {}],
      filters: true,
      rowSelection: { checkboxLocation: { column: 0 } },
      sheetsBar: {
        sheets: [
          { name: 'One', data: [[false, 'a'], [false, 'b'], [false, 'a'], [false, 'b'], [false, 'a']] },
          { name: 'Two', data: [[false, 'x']] },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.getPlugin('sheetsBar');
    const filters = hot.getPlugin('filters');

    hot.setCellMeta(2, 0, 'readOnly', true);
    hot.setCellMeta(3, 0, 'readOnly', true);
    filters.addCondition(1, 'eq', ['a']);
    filters.filter();
    roundTrip(bar);
    hot.getPlugin('rowSelection').selectAll('all');

    expect(hot.getSourceDataAtCol(0)).toEqual([true, true, false, false, true]);
  });
});
