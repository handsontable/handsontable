import { nextTick } from 'vue';
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

  it('should land a value on its record when reactive data gains or loses rows while it is pending', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :data="products"
          :columns="[{ data: 'sku' }, { data: 'name' }]"
          rowId="id"
          :asyncValues="true"
        ></HotTable>`,
      data() {
        return { products: createProducts() };
      },
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('asyncValues');
    const lamp = deferred();
    const cable = deferred();
    const lampResult = plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, () => lamp.promise);
    const cableResult = plugin.setAsyncValueAt({ rowId: 'c', prop: 'name' }, () => cable.promise);

    // The wrapper keeps the array by reference and only resizes the index mapper.
    testWrapper.vm.products.unshift({ id: 'z', sku: 'Z-900', name: 'Mouse pad' });
    await nextTick();
    await Promise.resolve();
    lamp.resolve('Reading lamp');

    await expect(lampResult).resolves.toEqual({ status: 'resolved', value: 'Reading lamp' });
    expect(hotInstance.getSourceDataAtRow(1)).toEqual({ id: 'a', sku: 'A-100', name: 'Reading lamp' });

    testWrapper.vm.products.splice(3, 1);
    await nextTick();

    await expect(cableResult).resolves.toEqual({ status: 'canceled', reason: 'rowRemoved' });
    expect(plugin.countPending()).toBe(0);

    testWrapper.unmount();
  });
});
