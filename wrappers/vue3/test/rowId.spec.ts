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

describe('`rowId` option', () => {
  // The wrapper leaves out a `data` array it already sent, so a new `columns` value reaches `updateSettings()`
  // alone, which re-initializes every row index map.
  it('should keep the generated ids when the `settings` prop changes the columns', async() => {
    const data = [
      { product: 'Wireless Mouse', price: 25, stock: 142 },
      { product: 'Stainless Steel Water Bottle', price: 18, stock: 0 },
      { product: 'USB-C Cable', price: 9, stock: 67 },
    ];
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: 'non-commercial-and-evaluation',
        settings: {
          data,
          columns: [{ data: 'product' }, { data: 'price' }],
          rowId: true,
          columnSorting: true,
        },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const ids = hotInstance.getRowIds();
    const mouseId = hotInstance.getRowId(2);

    await testWrapper.setProps({
      settings: {
        data,
        columns: [{ data: 'product' }, { data: 'price' }, { data: 'stock' }],
        rowId: true,
        columnSorting: true,
      },
    });

    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getPhysicalRowsByIds(ids)).toEqual([2, 1, 0]);
    expect(hotInstance.getDataAtCell(hotInstance.getVisualRowById(mouseId), 0)).toBe('Wireless Mouse');

    testWrapper.unmount();
  });
});
