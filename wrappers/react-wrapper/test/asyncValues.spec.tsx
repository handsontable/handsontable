import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { mountComponent } from './_helpers';
import { HotTableRef } from '../src/types';

// register Handsontable's modules
registerAllModules();

/**
 * Creates a promise that is settled from the outside.
 *
 * @returns {object}
 */
function deferred<T = string>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

/**
 * Builds the product rows. Every call returns new objects, as a parent component that rebuilds its data does.
 *
 * @returns {object[]}
 */
function createProducts() {
  return [
    { id: 'a', sku: 'A-100', name: 'Desk lamp' },
    { id: 'b', sku: 'B-200', name: 'Monitor stand' },
    { id: 'c', sku: 'C-300', name: 'USB-C cable' },
  ];
}

/**
 * Mounts a grid that holds its data in state and exposes a way to replace that data and to re-render
 * without touching it.
 *
 * @param {object} options The grid options.
 * @param {boolean} [options.rowId] Whether the grid identifies rows by the `id` field.
 * @returns {object}
 */
function mountGrid({ rowId = false } = {}) {
  const hotTableRef = React.createRef<HotTableRef>();
  const api = {
    replaceData: (data: object[]) => {
      void data;
    },
    rerender: () => {},
  };
  const Grid = () => {
    const [data, setData] = React.useState<object[]>(createProducts);
    const [height, setHeight] = React.useState(200);

    api.replaceData = setData;
    api.rerender = () => setHeight(value => value + 1);

    return (
      <HotTable
        ref={hotTableRef}
        licenseKey="non-commercial-and-evaluation"
        data={data}
        columns={[{ data: 'sku' }, { data: 'name' }]}
        rowId={rowId ? 'id' : undefined}
        asyncValues={true}
        height={height}
        autoRowSize={false}
        autoColumnSize={false}
      />
    );
  };

  mountComponent(<Grid />);

  const hot = hotTableRef.current!.hotInstance!;

  return { api, hot, plugin: hot.getPlugin('asyncValues') };
}

/**
 * Starts a request inside `act()`, as the plugin re-renders the grid and the wrapper reacts to it.
 *
 * @param {object} plugin The plugin.
 * @param {number} row Visual row.
 * @param {Function} source The value source.
 * @returns {Promise<object>}
 */
function start(plugin: any, row: number, source: () => Promise<string>): Promise<any> {
  let result: Promise<any>;

  act(() => {
    result = plugin.setAsyncValue(row, 1, source);
  });

  return result!;
}

describe('HotTable `asyncValues` option', () => {
  // The wrapper sends `data` with every commit, so the core runs `updateData()` on every re-render.
  it('should keep a pending request when the component re-renders with a new data array', async() => {
    const { api, hot, plugin } = mountGrid();
    const source = deferred('Reading lamp');
    const result = start(plugin, 0, () => source.promise);

    expect(plugin.isPending(0, 1)).toBe(true);

    act(() => {
      api.replaceData(createProducts());
    });

    expect(hot.getDataAtCell(0, 1)).toBe('Desk lamp');
    expect(plugin.isPending(0, 1)).toBe(true);

    await act(async() => {
      source.resolve('Reading lamp');
      await result;
    });

    await expect(result).resolves.toEqual({ status: 'resolved', value: 'Reading lamp' });

    expect(plugin.isPending(0, 1)).toBe(false);
    expect(hot.getDataAtCell(0, 1)).toBe('Reading lamp');
  });

  it('should move a pending request to its record when a re-render reorders the rows', async() => {
    const { api, hot, plugin } = mountGrid({ rowId: true });
    const source = deferred('Reading lamp');
    const result = start(plugin, 0, () => source.promise);

    act(() => {
      api.replaceData(createProducts().reverse());
    });

    expect(hot.getDataAtCell(2, 0)).toBe('A-100');
    expect(plugin.getAsyncStateAt({ rowId: 'a', prop: 'name' })).toEqual({ status: 'pending' });
    expect(plugin.isPending(0, 1)).toBe(false);
    expect(plugin.isPending(2, 1)).toBe(true);

    await act(async() => {
      source.resolve('Reading lamp');
      await result;
    });

    await expect(result).resolves.toEqual({ status: 'resolved', value: 'Reading lamp' });

    expect(hot.getSourceDataAtRow(hot.getPhysicalRowById('a')!)).toEqual(
      { id: 'a', sku: 'A-100', name: 'Reading lamp' }
    );
    expect(hot.getDataAtCell(0, 1)).toBe('USB-C cable');
  });

  it('should cancel the request of a dropped trailing row when the re-render has fewer rows', async() => {
    const { api, hot, plugin } = mountGrid();
    const source = deferred('Cable, 2 m');
    const result = start(plugin, 2, () => source.promise);

    act(() => {
      api.replaceData(createProducts().slice(0, 2));
    });

    await expect(result).resolves.toEqual({ status: 'cancelled', reason: 'rowRemoved' });

    expect(hot.countRows()).toBe(2);
    expect(plugin.getPendingCells()).toEqual([]);
  });
});
