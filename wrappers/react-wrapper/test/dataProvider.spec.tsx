import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import { mountComponent, sleep } from './_helpers';
import { HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

/**
 * Lets the pending fetches settle.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  await act(async() => {
    await sleep(50);
  });
}

/**
 * Builds a complete DataProvider configuration over two products.
 *
 * @returns {object}
 */
function createDataProvider() {
  return {
    rowId: 'id',
    fetchRows: jest.fn().mockResolvedValue({
      rows: [{ id: 1, product: 'Wireless Mouse' }, { id: 2, product: 'USB-C Cable' }],
      totalRows: 2,
    }),
    onRowsCreate: async() => {},
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  };
}

describe('HotTable `dataProvider` option', () => {
  it('should keep the loaded rows and not refetch when a re-render passes the same `dataProvider`', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const dataProvider = createDataProvider();
    let setHeight: (height: number) => void = () => {};
    const Grid = () => {
      const [height, setGridHeight] = React.useState(200);

      setHeight = setGridHeight;

      return (
        <HotTable
          ref={hotTableRef}
          licenseKey={TEST_LICENSE_KEY}
          data={[]}
          dataProvider={dataProvider}
          columns={[{ data: 'id' }, { data: 'product' }]}
          height={height}
          autoRowSize={false}
          autoColumnSize={false}
        />
      );
    };

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mountComponent(<Grid />);
    await settle();

    const hot = hotTableRef.current?.hotInstance;
    const fetchesAfterMount = dataProvider.fetchRows.mock.calls.length;

    expect(hot?.getData()).toEqual([[1, 'Wireless Mouse'], [2, 'USB-C Cable']]);

    act(() => {
      setHeight(300);
    });
    await settle();

    expect(hotTableRef.current?.hotInstance).toBe(hot);
    expect(hot?.getSettings().height).toBe(300);
    expect(hot?.getData()).toEqual([[1, 'Wireless Mouse'], [2, 'USB-C Cable']]);
    expect(dataProvider.fetchRows).toHaveBeenCalledTimes(fetchesAfterMount);
  });

  it('should keep the server sort with no request when a re-render passes the same `HotColumn` children', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const dataProvider = createDataProvider();
    let setHeight: (height: number) => void = () => {};
    const Grid = () => {
      const [height, setGridHeight] = React.useState(200);

      setHeight = setGridHeight;

      return (
        <HotTable
          ref={hotTableRef}
          licenseKey={TEST_LICENSE_KEY}
          data={[]}
          dataProvider={dataProvider}
          columnSorting
          height={height}
          autoRowSize={false}
          autoColumnSize={false}
        >
          <HotColumn data="id" />
          <HotColumn data="product" />
        </HotTable>
      );
    };

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mountComponent(<Grid />);
    await settle();

    const hot = hotTableRef.current?.hotInstance;

    act(() => {
      hot?.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    });
    await settle();

    const fetchesAfterSort = dataProvider.fetchRows.mock.calls.length;

    act(() => {
      setHeight(300);
    });
    await settle();

    expect(hotTableRef.current?.hotInstance).toBe(hot);
    expect(hot?.getPlugin('dataProvider').getQueryParameters().sort).toEqual({ prop: 'product', order: 'desc' });
    expect(hot?.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
    expect(dataProvider.fetchRows).toHaveBeenCalledTimes(fetchesAfterSort);
  });

  it('should keep the page and the sort with no request when a re-render passes the same inline settings', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const rows = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, product: `Product ${index + 1}` }));
    const dataProvider = {
      ...createDataProvider(),
      fetchRows: jest.fn(async({ page, pageSize }: { page: number; pageSize: number }) => ({
        rows: rows.slice((page - 1) * pageSize, page * pageSize),
        totalRows: rows.length,
      })),
    };
    let setHeight: (height: number) => void = () => {};
    const Grid = () => {
      const [height, setGridHeight] = React.useState(200);

      setHeight = setGridHeight;

      return (
        <HotTable
          ref={hotTableRef}
          licenseKey={TEST_LICENSE_KEY}
          data={[]}
          dataProvider={dataProvider}
          pagination={{ pageSize: 5 }}
          columnSorting={{ indicator: true }}
          filters
          height={height}
          autoRowSize={false}
          autoColumnSize={false}
        >
          <HotColumn data="id" />
          <HotColumn data="product" />
        </HotTable>
      );
    };

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mountComponent(<Grid />);
    await settle();

    const hot = hotTableRef.current?.hotInstance;

    act(() => {
      hot?.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    });
    await settle();
    act(() => {
      hot?.getPlugin('pagination').setPage(2);
    });
    await settle();

    const fetchesBefore = dataProvider.fetchRows.mock.calls.length;

    act(() => {
      setHeight(300);
    });
    await settle();

    expect(hot?.getPlugin('pagination').getPaginationData()).toEqual(expect.objectContaining({
      currentPage: 2,
      totalPages: 3,
    }));
    expect(hot?.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
    expect(dataProvider.fetchRows).toHaveBeenCalledTimes(fetchesBefore);
  });
});
