import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import { mountComponent, renderHotTableWithProps } from './_helpers';
import { HotTableProps, HotTableRef } from '../src/types';

// register Handsontable's modules
registerAllModules();

/**
 * Builds row objects without an id field, so only generated ids can identify them.
 *
 * @returns {object[]}
 */
function createProducts() {
  return [
    { product: 'Wireless Mouse', price: 25 },
    { product: 'Stainless Steel Water Bottle', price: 18 },
    { product: 'USB-C Cable', price: 9 },
  ];
}

describe('HotTable `rowId` option', () => {
  // The wrapper sends `data` with every commit, so the core keeps its index maps here; the Vue suite covers the
  // `columns`-only update that re-initializes them.
  it('should keep the generated ids when a re-render changes the columns', async() => {
    const settings: HotTableProps = {
      licenseKey: 'non-commercial-and-evaluation',
      data: createProducts(),
      columns: [{ data: 'product' }, { data: 'price' }],
      rowId: true,
      columnSorting: true,
      autoRowSize: false,
      autoColumnSize: false,
    };
    const hotTableRef = renderHotTableWithProps(settings, false);
    const hot = hotTableRef.current!.hotInstance!;

    act(() => {
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });
    });

    const ids = hot.getRowIds();
    const afterUpdateSettings = jest.fn();

    hot.addHook('afterUpdateSettings', afterUpdateSettings);

    renderHotTableWithProps({
      ...settings,
      columns: [{ data: 'product' }, { data: 'price' }, { data: 'stock' }],
    }, false, hotTableRef);

    expect(afterUpdateSettings).toHaveBeenCalled();
    expect(hot.getRowIds()).toEqual(ids);
    expect(hot.getVisualRowById(ids[0])).toBe(0);
    expect(hot.getDataAtCell(hot.getVisualRowById(ids[2])!, 0)).toBe('Wireless Mouse');
  });

  it('should keep the generated ids when a component with HotColumn children re-renders', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const data = createProducts();
    let setHeight: (height: number) => void = () => {};
    const Grid = () => {
      const [height, setGridHeight] = React.useState(200);

      setHeight = setGridHeight;

      return (
        <HotTable
          ref={hotTableRef}
          licenseKey="non-commercial-and-evaluation"
          data={data}
          rowId={true}
          height={height}
          autoRowSize={false}
          autoColumnSize={false}
        >
          <HotColumn data="product" />
          <HotColumn data="price" />
        </HotTable>
      );
    };

    mountComponent(<Grid />);

    const hot = hotTableRef.current!.hotInstance!;
    const ids = hot.getRowIds();
    const afterUpdateSettings = jest.fn();

    expect(new Set(ids).size).toBe(3);

    hot.addHook('afterUpdateSettings', afterUpdateSettings);

    act(() => {
      setHeight(300);
    });

    expect(afterUpdateSettings).toHaveBeenCalled();
    expect(hotTableRef.current!.hotInstance).toBe(hot);
    expect(hot.getRowIds()).toEqual(ids);
  });
});
