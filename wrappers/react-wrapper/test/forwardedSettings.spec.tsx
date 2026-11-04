import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import { mountComponent, sleep } from './_helpers';
import { HotRendererProps, HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

/**
 * Lets the pending renders and fetches settle.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  await act(async() => {
    await sleep(50);
  });
}

/**
 * Renders the product name of a cell.
 *
 * @param {HotRendererProps} props The renderer props.
 * @returns {React.ReactElement}
 */
function ProductCell({ value }: HotRendererProps) {
  return <span>{String(value)}</span>;
}

/**
 * Builds a complete DataProvider configuration over six products, sorted by the query.
 *
 * @returns {object}
 */
function createSortingDataProvider() {
  const rows = ['Cable', 'Mouse', 'Keyboard', 'Monitor', 'Dock', 'Webcam']
    .map((product, index) => ({ id: index + 1, product }));

  return {
    rowId: 'id',
    fetchRows: jest.fn(async({ sort }: { sort: { prop: string, order: string } | null }) => {
      const sorted = rows.slice();

      if (sort) {
        const direction = sort.order === 'desc' ? -1 : 1;

        sorted.sort((a, b) => (String(a[sort.prop as 'product']) > String(b[sort.prop as 'product']) ? 1 : -1) *
          direction);
      }

      return { rows: sorted, totalRows: sorted.length };
    }),
    onRowsCreate: async() => {},
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  };
}

describe('HotTable settings passed again on a re-render', () => {
  it('should apply a setting the app changed in place before the re-render', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 2 }];
    let rerender: () => void = () => {};
    const Grid = () => {
      const [, setTick] = React.useState(0);

      rerender = () => setTick(tick => tick + 1);

      return (
        <HotTable
          ref={hotTableRef}
          licenseKey={TEST_LICENSE_KEY}
          data={Array.from({ length: 6 }, () => Array(6).fill('x'))}
          mergeCells={mergeCells}
          autoRowSize={false}
          autoColumnSize={false}
        />
      );
    };

    mountComponent(<Grid />);
    await settle();

    const hot = hotTableRef.current?.hotInstance;

    mergeCells.push({ row: 2, col: 2, rowspan: 2, colspan: 2 });

    act(() => {
      rerender();
    });
    await settle();

    expect(hot?.getPlugin('mergeCells').mergedCellsCollection.get(2, 2)).toEqual(
      expect.objectContaining({ row: 2, col: 2, rowspan: 2, colspan: 2 })
    );
  });

  it('should keep the server sort with no request when a re-render passes a `HotColumn` with a component renderer',
    async() => {
      const hotTableRef = React.createRef<HotTableRef>();
      const dataProvider = createSortingDataProvider();
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
            <HotColumn data="product" renderer={ProductCell} />
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

      expect(hot?.getDataAtCell(0, 1)).toBe('Webcam');

      act(() => {
        setHeight(300);
      });
      await settle();

      expect(hot?.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
      expect(hot?.getDataAtCell(0, 1)).toBe('Webcam');
      expect(dataProvider.fetchRows).toHaveBeenCalledTimes(fetchesAfterSort);
    });

  it('should keep the `HotColumn` settings when a re-render passes a new `columns` prop beside unchanged children',
    async() => {
      const hotTableRef = React.createRef<HotTableRef>();
      let setColumns: (columns: object[]) => void = () => {};
      const Grid = () => {
        const [columns, setGridColumns] = React.useState<object[]>([{ data: 0 }, { data: 1 }]);

        setColumns = setGridColumns;

        return (
          <HotTable
            ref={hotTableRef}
            licenseKey={TEST_LICENSE_KEY}
            data={[['A1', 'B1'], ['A2', 'B2']]}
            columns={columns}
            autoRowSize={false}
            autoColumnSize={false}
          >
            <HotColumn data={1} readOnly />
            <HotColumn data={0} />
          </HotTable>
        );
      };

      mountComponent(<Grid />);
      await settle();

      act(() => {
        setColumns([{ data: 0 }, { data: 1 }, { data: 0 }]);
      });
      await settle();

      const hot = hotTableRef.current?.hotInstance;

      expect(hot?.countCols()).toBe(2);
      expect(hot?.getDataAtCell(0, 0)).toBe('B1');
      expect(hot?.getCellMeta(0, 0).readOnly).toBe(true);
    });
});
