import { mount, config } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import { TEST_LICENSE_KEY } from './licenseKey';

config.renderStubDefaultSlot = true;

registerAllModules();

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

/**
 * The wrapper compares the `colWidths` value with the grid's live `getSettings().colWidths`. Core keeps that value
 * the array the props passed when columns are inserted or removed, so a later props change finds nothing to
 * forward for it, and the widths stay on their columns.
 */
describe('An array `colWidths` after columns are inserted or removed', () => {
  it('should not send the array again when another setting changes', async() => {
    const data = [['a', 'b', 'c']];
    const colWidths = [100, 150, 200];
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: TEST_LICENSE_KEY,
        settings: { data, colWidths, autoColumnSize: false },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const widths = () => Array.from(
      { length: hotInstance.countCols() }, (_, column) => hotInstance.getColWidth(column),
    );

    hotInstance.alter('insert_col_start', 1);

    expect(widths()).toEqual([100, 50, 150, 200]);

    // The wrapper hands the grid its own copy of the array; the grid keeps that one across the re-render.
    const declared = hotInstance.getSettings().colWidths;
    const updateSettings = jest.spyOn(hotInstance, 'updateSettings');

    await testWrapper.setProps({
      settings: { data, colWidths, autoColumnSize: false, readOnly: true },
    });

    expect(updateSettings).toHaveBeenCalled();
    expect(updateSettings.mock.calls.some(([settings]) => 'colWidths' in (settings as object))).toBe(false);
    expect(hotInstance.getSettings().colWidths).toBe(declared);
    expect(widths()).toEqual([100, 50, 150, 200]);

    testWrapper.unmount();
  });

  it('should apply a new array passed after columns were inserted', async() => {
    const data = [['a', 'b', 'c']];
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: TEST_LICENSE_KEY,
        settings: { data, colWidths: [100, 150, 200], autoColumnSize: false },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.alter('insert_col_start', 1);

    await testWrapper.setProps({
      settings: { data, colWidths: [30, 31, 32, 33], autoColumnSize: false },
    });

    expect(Array.from({ length: 4 }, (_, column) => hotInstance.getColWidth(column))).toEqual([30, 31, 32, 33]);

    testWrapper.unmount();
  });
});
