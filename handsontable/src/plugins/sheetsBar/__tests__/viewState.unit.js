import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ManualColumnResize } from '../../manualColumnResize';
import { ColumnSorting } from '../../columnSorting';
import { Filters } from '../../filters';
import { DropdownMenu } from '../../dropdownMenu';
import { AutoColumnSize } from '../../autoColumnSize';
import { HiddenRows } from '../../hiddenRows';
import { HiddenColumns } from '../../hiddenColumns';
import { registerCellType, CheckboxCellType } from '../../../cellTypes';
import { SheetsBar } from '../sheetsBar';
import { captureViewState, restoreViewState } from '../viewState';

describe('SheetsBar view state', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ManualColumnResize);
    registerPlugin(ColumnSorting);
    registerCellType(CheckboxCellType);
    registerPlugin(AutoColumnSize);
    registerPlugin(DropdownMenu);
    registerPlugin(HiddenRows);
    registerPlugin(Filters);
    registerPlugin(HiddenColumns);
    registerPlugin(SheetsBar);
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

  it('captures and restores manual column widths', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualColumnResize').setManualSize(0, 260);
    hot.render();

    const state = captureViewState(hot, []);

    expect(state.colWidths).toEqual([[0, 260]]);

    hot.getPlugin('manualColumnResize').setManualSize(0, 100);
    restoreViewState(hot, state);

    expect(hot.getColWidth(0)).toBe(260);
  });

  it('captures and restores the sort config', () => {
    hot = new Handsontable(container, {
      data: [[3], [1], [2]],
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    const state = captureViewState(hot, []);

    hot.getPlugin('columnSorting').clearSort();
    restoreViewState(hot, state);

    expect(hot.getDataAtCell(0, 0)).toBe(1);
  });

  it('captures row/column sequences defensively, unaffected by later mapper mutation', () => {
    hot = new Handsontable(container, {
      data: [['a'], ['b'], ['c']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    const state = captureViewState(hot, []);
    const capturedRowSequence = state.rowSequence.slice();
    const capturedColumnSequence = state.columnSequence.slice();

    hot.rowIndexMapper.getIndexesSequence().reverse();
    hot.columnIndexMapper.getIndexesSequence().reverse();

    expect(state.rowSequence).toEqual(capturedRowSequence);
    expect(state.columnSequence).toEqual(capturedColumnSequence);
  });

  it('round-trips width through a sheet switch (240 → 260 survives)', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualColumnResize').setManualSize(0, 260);
    hot.render();

    hot.getPlugin('sheetsBar').setActiveSheet('B');
    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(hot.getColWidth(0)).toBe(260);
  });

  it('captures only manual overrides, as sparse index-size pairs', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b', 'c']],
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualColumnResize').setManualSize(1, 260);
    hot.render();

    const state = captureViewState(hot, []);

    expect(state.colWidths).toEqual([[1, 260]]);
  });

  it('captures no row heights for rows with no manual override', () => {
    hot = new Handsontable(container, {
      data: [['a'], ['b']],
      manualRowResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const state = captureViewState(hot, []);

    expect(state.rowHeights).toEqual([]);
  });

  it('drops the previous sheet manual widths when restoring a sheet that has none', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');

    plugin.setActiveSheet('B');
    plugin.setActiveSheet('A');
    hot.getPlugin('manualColumnResize').setManualSize(0, 260);
    hot.render();
    plugin.setActiveSheet('B');

    expect(hot.getColWidth(0)).not.toBe(260);
  });

  it('does not inherit the previous sheet filters when switching to a never-visited sheet', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['keep'], ['drop']] },
          { name: 'B', data: [['x'], ['y']] },
        ],
      },
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'eq', ['keep']);
    filters.filter();

    expect(hot.countRows()).toBe(1);

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.countRows()).toBe(2);
    expect(hot.getDataAtCell(0, 0)).toBe('x');
  });

  it('does not inherit the previous sheet hidden columns when switching to a never-visited sheet', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a1', 'a2']] },
          { name: 'B', data: [['b1', 'b2']] },
        ],
      },
      hiddenColumns: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('hiddenColumns').hideColumn(0);
    hot.render();

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
  });

  it('replays tracked cell meta after a switch round-trip', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.setCellMeta(0, 0, 'readOnly', true);

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.getCellMeta(0, 0).readOnly).not.toBe(true);

    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
  });
});
