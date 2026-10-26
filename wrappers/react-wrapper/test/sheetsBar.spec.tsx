import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers';
import { mountComponent, renderHotTableWithProps } from './_helpers';
import { HotTable } from '../src/hotTable';
import { HotTableProps, HotTableRef } from '../src/types';

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
      licenseKey: 'non-commercial-and-evaluation',
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
      licenseKey: 'non-commercial-and-evaluation',
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

  it('settles a controlled `activeSheet` that names a position in the app\'s `sheets` after a tab move', () => {
    const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
    const ref = React.createRef<HotTableRef>();
    let changes = 0;

    const App = () => {
      const [active, setActive] = React.useState(1);

      return (
        <HotTable
          ref={ref}
          licenseKey="non-commercial-and-evaluation"
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
          licenseKey="non-commercial-and-evaluation"
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
});
