import React from 'react';
import { act } from '@testing-library/react';
import { HyperFormula } from 'hyperformula';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers';
import { mountComponent, renderHotTableWithProps } from './_helpers';
import { HotTable } from '../src/hotTable';
import { HotTableProps, HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

/**
 * A renderer only one sheet declares, so a test can tell it from the grid-level one.
 * @param {...any} args
 */
function ownRenderer(this: unknown, ...args: Parameters<typeof textRenderer>) {
  textRenderer.apply(this, args);
}

describe('HotTable with a sheets bar', () => {
  it('keeps the visible sheet\'s own headers and renderer when the parent re-renders', () => {
    const sheets = [
      { name: 'Plain', data: [[1, 2]] },
      { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'], renderer: ownRenderer } },
    ];
    const props = (): HotTableProps => ({
      licenseKey: TEST_LICENSE_KEY,
      colHeaders: ['a', 'b'],
      sheetsBar: { sheets },
    });
    const ref = renderHotTableWithProps(props(), false);
    const hot = ref.current!.hotInstance!;

    act(() => {
      hot.getPlugin('sheetsBar').setActiveSheet('Own');
    });
    renderHotTableWithProps(props(), false, ref);

    expect(hot.getColHeader(0)).toBe('X');
    expect(hot.getCellRenderer(0, 0)).toBe(ownRenderer);

    act(() => {
      hot.getPlugin('sheetsBar').setActiveSheet('Plain');
    });

    expect(hot.getColHeader(0)).toBe('a');
  });

  it('keeps the visible sheet\'s rows when the parent re-renders with a top-level `data` prop', () => {
    const appData = [['app', 'app']];
    const dataB = [[5, 6]];
    const sheets = [{ name: 'A', data: [[1, 2]] }, { name: 'B', data: dataB }];
    const props = (): HotTableProps => ({
      licenseKey: TEST_LICENSE_KEY,
      data: appData,
      sheetsBar: { sheets },
    });
    const ref = renderHotTableWithProps(props(), false);
    const hot = ref.current!.hotInstance!;
    const plugin = hot.getPlugin('sheetsBar');

    act(() => {
      plugin.setActiveSheet('B');
    });
    act(() => {
      hot.setDataAtCell(0, 0, 'typed');
    });
    renderHotTableWithProps(props(), false, ref);

    expect(hot.getDataAtCell(0, 0)).toBe('typed');

    act(() => {
      plugin.setActiveSheet('A');
    });
    act(() => {
      plugin.setActiveSheet('B');
    });

    expect(hot.getDataAtCell(0, 0)).toBe('typed');
    expect(dataB[0][0]).toBe('typed');
    expect(appData).toEqual([['app', 'app']]);
  });

  it('keeps an added sheet\'s rows when the parent re-renders a `sheetsBar: true` grid with its `data` prop', () => {
    const appData = [['A1', 'B1'], ['A2', 'B2']];
    const props = (): HotTableProps => ({
      licenseKey: TEST_LICENSE_KEY,
      data: appData,
      sheetsBar: true,
    });
    const ref = renderHotTableWithProps(props(), true);
    const hot = ref.current!.hotInstance!;
    const plugin = hot.getPlugin('sheetsBar');

    act(() => {
      plugin.addSheet('Second');
    });
    act(() => {
      plugin.setActiveSheet('Second');
    });
    act(() => {
      hot.setDataAtCell(0, 0, 'typed');
    });
    renderHotTableWithProps(props(), true, ref);

    expect(hot.getDataAtCell(0, 0)).toBe('typed');

    act(() => {
      hot.setDataAtCell(0, 0, 'typed again');
    });

    expect(appData[0][0]).toBe('A1');

    act(() => {
      plugin.setActiveSheet('Sheet1');
    });

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
  });

  it('puts new `data` rows into the first sheet of a `sheetsBar: true` grid while another sheet is visible', () => {
    const ref = React.createRef<HotTableRef>();
    let setRows: (rows: string[][]) => void = () => {};

    const App = () => {
      const [rows, setState] = React.useState([['A1', 'B1']]);

      setRows = setState;

      return <HotTable ref={ref} licenseKey={TEST_LICENSE_KEY} data={rows} sheetsBar />;
    };

    mountComponent(<App />);

    const hot = ref.current!.hotInstance!;
    const plugin = hot.getPlugin('sheetsBar');
    const newRows = [['new', 'rows']];

    act(() => {
      plugin.addSheet('Second', [['second']]);
    });
    act(() => {
      plugin.setActiveSheet('Second');
    });
    act(() => {
      setRows(newRows);
    });

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(plugin.getSheetData('Sheet1')).toBe(newRows);

    act(() => {
      plugin.setActiveSheet('Sheet1');
    });

    expect(hot.getDataAtCell(0, 0)).toBe('new');
  });

  it('keeps the visible sheet\'s rows on a `sheetsBar: true` re-render after the first sheet is removed', () => {
    const appData = [['A1', 'B1']];
    const props = (): HotTableProps => ({
      licenseKey: TEST_LICENSE_KEY,
      data: appData,
      sheetsBar: true,
    });
    const ref = renderHotTableWithProps(props(), false);
    const hot = ref.current!.hotInstance!;
    const plugin = hot.getPlugin('sheetsBar');

    act(() => {
      plugin.addSheet('Second', [['second']]);
      plugin.addSheet('Third', [['third']]);
    });
    act(() => {
      plugin.setActiveSheet('Second');
    });
    act(() => {
      plugin.removeSheet(plugin.getSheets().find(sheet => sheet.name === 'Sheet1')!.id);
    });
    renderHotTableWithProps(props(), false, ref);

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(appData).toEqual([['A1', 'B1']]);
  });

  it('settles a controlled `activeSheet` that names a position in the app\'s `sheets` after a tab move', () => {
    const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
    const ref = React.createRef<HotTableRef>();
    let changes = 0;

    const App = () => {
      const [active, setActive] = React.useState(1);

      return (
        <HotTable
          ref={ref}
          licenseKey={TEST_LICENSE_KEY}
          sheetsBar={{ sheets, activeSheet: active }}
          afterSheetTabChange={(oldId: number, newId: number) => {
            changes += 1;

            if (changes > 10) {
              return;
            }

            const name = ref.current!.hotInstance!.getPlugin('sheetsBar').getSheets()
              .find(sheet => sheet.id === newId)!.name;

            setActive(sheets.findIndex(entry => entry.name === name));
          }}
        />
      );
    };

    mountComponent(<App />);

    const plugin = ref.current!.hotInstance!.getPlugin('sheetsBar');

    act(() => {
      plugin.moveSheetToIndex(plugin.getSheets().find(sheet => sheet.name === 'A')!.id, 2);
    });
    act(() => {
      plugin.setActiveSheet('A');
    });

    expect(changes).toBe(1);
    expect(plugin.getSheets().find(sheet => sheet.isActive)!.name).toBe('A');
  });

  it('keeps the active sheet when the parent re-renders with the same `activeSheet` after a removal', () => {
    const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
    const props = (): HotTableProps => ({
      licenseKey: TEST_LICENSE_KEY,
      sheetsBar: { sheets, activeSheet: 1 },
    });
    const ref = renderHotTableWithProps(props(), false);
    const plugin = ref.current!.hotInstance!.getPlugin('sheetsBar');

    act(() => {
      plugin.removeSheet(plugin.getSheets().find(sheet => sheet.name === 'A')!.id);
    });
    renderHotTableWithProps(props(), false, ref);

    expect(plugin.getSheets().find(sheet => sheet.isActive)!.name).toBe('B');
  });

  it('keeps a renamed and an added sheet in the app\'s own `sheets` across re-renders', () => {
    const ref = React.createRef<HotTableRef>();
    let rerender: () => void = () => {};
    let appSheets: Array<{ name: string, data: unknown[][] }> = [];

    const App = () => {
      const [sheets] = React.useState(() => [
        { name: 'A', data: [[1, 2], [3, 4]] },
        { name: 'B', data: [[5, 6]] },
      ]);
      const [, setTick] = React.useState(0);

      appSheets = sheets;
      rerender = () => setTick(tick => tick + 1);

      return (
        <HotTable
          ref={ref}
          licenseKey={TEST_LICENSE_KEY}
          sheetsBar={{ sheets }}
        />
      );
    };

    mountComponent(<App />);

    const hot = ref.current!.hotInstance!;
    const plugin = hot.getPlugin('sheetsBar');

    act(() => {
      plugin.addSheet('Extra');
    });
    act(() => {
      plugin.renameSheet(plugin.getSheets()[0].id, 'A2');
    });
    act(() => {
      hot.selectCell(1, 1);
    });
    act(() => {
      rerender();
    });

    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A2', 'B', 'Extra']);
    expect(appSheets.map(entry => entry.name)).toEqual(['A2', 'B', 'Extra']);
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
  });

  it('shows a tab per formula engine sheet and keeps a renamed tab when the parent re-renders', () => {
    const hf = HyperFormula.buildFromSheets({
      Data: [[1, 2]],
      Report: [['=SUM(Data!A1:B1)']],
    }, { licenseKey: 'internal-use-in-handsontable' });
    const props = (): HotTableProps => ({
      licenseKey: TEST_LICENSE_KEY,
      formulas: { engine: hf },
      sheetsBar: true,
    });
    const ref = renderHotTableWithProps(props(), false);
    const plugin = ref.current!.hotInstance!.getPlugin('sheetsBar');

    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['Data', 'Report']);

    const ids = plugin.getSheets().map(sheet => sheet.id);

    act(() => {
      plugin.renameSheet(ids[1], 'Totals');
    });
    renderHotTableWithProps(props(), false, ref);

    expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['Data', 'Totals']);
    expect(plugin.getSheets().map(sheet => sheet.id)).toEqual(ids);
  });
});
