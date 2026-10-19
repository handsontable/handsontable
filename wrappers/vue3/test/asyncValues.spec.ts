import { mount, config } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';

config.renderStubDefaultSlot = true;

registerAllModules();

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

/**
 * Creates a promise that is settled from the outside.
 *
 * @returns {object}
 */
function deferred<T = string>() {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve: (value: T) => resolve?.(value) };
}

/**
 * Builds the product rows.
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

describe('`asyncValues` option', () => {
  it('should keep a pending request when the `settings` prop changes with the same column count', async() => {
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: 'non-commercial-and-evaluation',
        settings: {
          data: createProducts(),
          columns: [{ data: 'sku' }, { data: 'name' }],
          colHeaders: ['SKU', 'Name'],
          asyncValues: true,
        },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('asyncValues');
    const source = deferred();
    const result = plugin.setAsyncValue(0, 1, () => source.promise);

    await testWrapper.setProps({
      settings: {
        data: createProducts(),
        columns: [{ data: 'sku' }, { data: 'name' }],
        colHeaders: ['Code', 'Product'],
        asyncValues: true,
      },
    });

    expect(hotInstance.getColHeader(0)).toBe('Code');
    expect(plugin.isPending(0, 1)).toBe(true);

    source.resolve('Reading lamp');

    await expect(result).resolves.toEqual({ status: 'resolved', value: 'Reading lamp' });

    expect(plugin.isPending(0, 1)).toBe(false);
    expect(hotInstance.getDataAtCell(0, 1)).toBe('Reading lamp');

    testWrapper.unmount();
  });
});
