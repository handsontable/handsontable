import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { mountComponent, sleep } from './_helpers';
import { HotTableRef } from '../src/types';

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
          licenseKey="non-commercial-and-evaluation"
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
});
