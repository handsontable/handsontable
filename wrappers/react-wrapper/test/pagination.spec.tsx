import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import {
  createSpreadsheetData,
  renderHotTableWithProps,
} from './_helpers';
import { HotTableProps } from '../src/types';

// register Handsontable's modules
registerAllModules();

describe('HotTable pagination `initialPage`', () => {
  it('should not snap the current page back to `initialPage` on re-render (DEV-1140)', async () => {
    const hotSettings: HotTableProps = {
      licenseKey: 'non-commercial-and-evaluation',
      id: 'hot',
      data: createSpreadsheetData(45, 5),
      pagination: {
        initialPage: 2,
        pageSize: 10,
      },
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('pagination');

    expect(plugin.getPaginationData().currentPage).toBe(2);

    act(() => {
      plugin.nextPage();
    });

    expect(plugin.getPaginationData().currentPage).toBe(3);

    act(() => {
      renderHotTableWithProps({
        ...hotSettings,
        pagination: {
          initialPage: 2,
          pageSize: 15,
        },
      }, false, hotTableRef);
    });

    expect(plugin.getPaginationData().pageSize).toBe(15);
    expect(plugin.getPaginationData().currentPage).toBe(3);
  });
});
