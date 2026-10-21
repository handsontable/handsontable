import { mount, config } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import { createSampleData } from './_helpers';

config.renderStubDefaultSlot = true;

registerAllModules();

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

describe('`rowSelection` option', () => {
  it('should enable the plugin from the `settings` prop and expose its API through `hotInstance`', () => {
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: 'non-commercial-and-evaluation',
        settings: {
          data: createSampleData(5, 3),
          rowHeaders: true,
          rowSelection: true,
        },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('rowSelection');

    expect(plugin.isEnabled()).toBe(true);

    plugin.selectRows([1]);

    expect(plugin.getSelectedRows()).toEqual([1]);
    expect(plugin.isRowSelected(1)).toBe(true);
    expect(plugin.getHeaderCheckboxState().state).toBe('mixed');

    testWrapper.unmount();
  });

  it('should keep the row selection when the `settings` prop is updated', async() => {
    let updateSettingsCalls = 0;
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: 'non-commercial-and-evaluation',
        afterUpdateSettings() {
          updateSettingsCalls += 1;
        },
        settings: {
          data: createSampleData(5, 3),
          rowHeaders: true,
          rowSelection: true,
        },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('rowSelection');

    plugin.selectRows([1, 3]);

    await testWrapper.setProps({
      settings: {
        data: createSampleData(5, 3),
        rowHeaders: true,
        rowSelection: { headerCheckbox: false },
      },
    });

    // the wrapper re-sent the settings, which runs the plugin's `updatePlugin()`
    expect(updateSettingsCalls).toBe(1);
    expect(hotInstance.getSettings().rowSelection).toEqual({ headerCheckbox: false });
    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSelectedRows()).toEqual([1, 3]);

    testWrapper.unmount();
  });

  it('should disable the plugin when the `settings` prop turns `rowSelection` off', async() => {
    const testWrapper = mount(HotTable, {
      props: {
        licenseKey: 'non-commercial-and-evaluation',
        settings: {
          data: createSampleData(5, 3),
          rowHeaders: true,
          rowSelection: true,
        },
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('rowSelection');

    await testWrapper.setProps({
      settings: {
        data: createSampleData(5, 3),
        rowHeaders: true,
        rowSelection: false,
      },
    });

    expect(plugin.isEnabled()).toBe(false);

    testWrapper.unmount();
  });
});

describe('`headerCheckbox` column option', () => {
  it('should turn on the header checkbox of a checkbox column configured through HotColumn', () => {
    const App = {
      components: { HotTable, HotColumn },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :data="data"
          :colHeaders="true"
        >
          <HotColumn data="name"></HotColumn>
          <HotColumn data="active" type="checkbox" :headerCheckbox="true"></HotColumn>
        </HotTable>`,
      data() {
        return {
          data: [{ name: 'A', active: true }, { name: 'B', active: false }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('checkboxHeader');

    expect(plugin.hasHeaderCheckbox(0)).toBe(false);
    expect(plugin.hasHeaderCheckbox(1)).toBe(true);
    expect(plugin.getHeaderCheckboxState(1).state).toBe('mixed');

    testWrapper.unmount();
  });
});
