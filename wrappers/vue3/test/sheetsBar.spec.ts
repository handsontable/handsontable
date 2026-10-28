import { nextTick, ref } from 'vue';
import { mount, config } from '@vue/test-utils';
import { registerPlugin } from 'handsontable/plugins/registry';
import { SheetsBar } from 'handsontable/plugins/sheetsBar';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import './_helpers';

config.renderStubDefaultSlot = true;

registerPlugin(SheetsBar);
registerPlugin(ColumnSorting);

describe('cooperation with the SheetsBar plugin', () => {
  it('keeps the visible sheet\'s own headers when a reactive prop changes', async() => {
    const sheets = [
      { name: 'Plain', data: [[1, 2]] },
      { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'] } },
    ];
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :colHeaders="colHeaders"
          :height="height"
          :sheetsBar="{ sheets }"
          ></HotTable>`,
      data() {
        return {
          colHeaders: ['a', 'b'],
          height: 200,
        };
      },
      created() {
        this.sheets = sheets;
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('sheetsBar').setActiveSheet('Own');
    testWrapper.vm.height = 300;
    await nextTick();

    expect(hotInstance.getColHeader(0)).toBe('X');

    hotInstance.getPlugin('sheetsBar').setActiveSheet('Plain');

    expect(hotInstance.getColHeader(0)).toBe('a');

    testWrapper.unmount();
  });

  it('shows the rename of a sheet the bar added in the app\'s reactive `sheets`', async() => {
    const App = {
      components: { HotTable },
      template: `
        <div>
          <span id="sheet-names">{{ sheets.map(sheet => sheet.name).join(',') }}</span>
          <HotTable
            licenseKey="non-commercial-and-evaluation"
            :sheetsBar="{ sheets }"
            ></HotTable>
        </div>`,
      data() {
        return {
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('sheetsBar');

    plugin.addSheet('Extra');
    await nextTick();
    plugin.renameSheet(plugin.getSheets().find(sheet => sheet.name === 'Extra').id, 'Extra2');
    await nextTick();

    expect(testWrapper.find('#sheet-names').text()).toBe('A,B,Extra2');

    testWrapper.unmount();
  });

  it('keeps the visible sheet\'s own headers after a cell edit in a workbook kept in `ref()`', async() => {
    const App = {
      components: { HotTable },
      template: '<HotTable :settings="hotSettings"></HotTable>',
      setup() {
        const hotSettings = ref({
          sheetsBar: {
            sheets: [
              { name: 'Plain', data: [[1, 2]] },
              { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'] } },
            ],
          },
          colHeaders: true,
          licenseKey: 'non-commercial-and-evaluation',
        });

        return { hotSettings };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('sheetsBar').setActiveSheet('Own');
    hotInstance.setDataAtCell(0, 0, 'edited');
    await nextTick();

    expect(hotInstance.getDataAtCell(0, 0)).toBe('edited');
    expect(hotInstance.getColHeader(0)).toBe('X');

    testWrapper.unmount();
  });

  it('keeps the visible sheet\'s own `columns` when a `hot-column` changes, and gives the change to the other sheets', async() => {
    const App = {
      components: { HotTable, HotColumn },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :sheetsBar="{ sheets }"
          >
          <HotColumn :title="title"></HotColumn>
          <HotColumn title="second"></HotColumn>
        </HotTable>`,
      data() {
        return {
          title: 'first',
        };
      },
      created() {
        this.sheets = [
          { name: 'Plain', data: [[1, 2]] },
          { name: 'Own', data: [[3]], settings: { columns: [{ title: 'own' }] } },
        ];
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });

    await nextTick();

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('sheetsBar');

    plugin.setActiveSheet('Own');
    testWrapper.vm.title = 'changed';
    await nextTick();
    await nextTick();

    expect(hotInstance.getColHeader(0)).toBe('own');

    plugin.setActiveSheet('Plain');

    expect(hotInstance.getColHeader()).toEqual(['changed', 'second']);

    testWrapper.unmount();
  });

  it('sends a new `sheets` array that differs from the previous one only by a function', async() => {
    const rows = [[1]];
    const firstAfterChange = jest.fn();
    const secondAfterChange = jest.fn();
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :sheetsBar="{ sheets }"
          ></HotTable>`,
      data() {
        return {
          sheets: [{ name: 'A', data: rows, settings: { afterChange: firstAfterChange } }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    testWrapper.vm.sheets = [{ name: 'A', data: rows, settings: { afterChange: secondAfterChange } }];
    await nextTick();
    firstAfterChange.mockClear();
    hotInstance.setDataAtCell(0, 0, 'edited');

    expect(secondAfterChange.mock.calls.map(([, source]) => source)).toEqual(['loadData', 'edit']);
    expect(firstAfterChange).not.toHaveBeenCalled();

    testWrapper.unmount();
  });

  it('does not serialize the sheets when another prop changes', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :height="height"
          :sheetsBar="{ sheets }"
          ></HotTable>`,
      data() {
        return {
          height: 200,
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const stringifySpy = jest.spyOn(JSON, 'stringify');

    testWrapper.vm.height = 300;
    await nextTick();

    const serializedSheetsBar = stringifySpy.mock.calls
      .filter(([value]) => isObject(value) && 'sheets' in value);

    stringifySpy.mockRestore();

    expect(serializedSheetsBar).toEqual([]);

    testWrapper.unmount();
  });

  it('does not send an inline `sheetsBar` object again when its values are the same', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :height="height"
          :sheetsBar="{ sheets, position: 'top' }"
          ></HotTable>`,
      data() {
        return {
          height: 200,
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    testWrapper.vm.height = 300;
    await nextTick();

    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsSpy.mock.calls[0][0]).not.toHaveProperty('sheetsBar');

    testWrapper.unmount();
  });

  it('sends a changed `activeSheet` from an inline `sheetsBar` object', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :sheetsBar="{ sheets, activeSheet }"
          ></HotTable>`,
      data() {
        return {
          activeSheet: 0,
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    testWrapper.vm.activeSheet = 1;
    await nextTick();

    expect(hotInstance.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive).name).toBe('B');

    testWrapper.unmount();
  });

  it('does not send an inline `sheetsBar` object again when an option written as an object has the same values', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :height="height"
          :sheetsBar="{ sheets, animation: { switch: false } }"
          ></HotTable>`,
      data() {
        return {
          height: 200,
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    testWrapper.vm.height = 300;
    await nextTick();

    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsSpy.mock.calls[0][0]).not.toHaveProperty('sheetsBar');

    testWrapper.unmount();
  });

  it('keeps the workbook on a re-render when an inline `sheets` literal reuses each sheet\'s `data`', async() => {
    const alphaRows = [[2], [1]];
    const betaRows = [[3]];
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :height="height"
          :columnSorting="true"
          :sheetsBar="{ sheets: [{ name: 'A', data: alphaRows }, { name: 'B', data: betaRows }] }"
          ></HotTable>`,
      data() {
        return {
          height: 200,
        };
      },
      created() {
        Object.assign(this, { alphaRows, betaRows });
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    testWrapper.vm.height = 300;
    await nextTick();

    expect(hotInstance.getDataAtCol(0)).toEqual([1, 2]);

    testWrapper.unmount();
  });

  it('rebuilds the workbook on a re-render when a sheet\'s `data` is written inline in the template', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :height="height"
          :columnSorting="true"
          :sheetsBar="{ sheets: [{ name: 'A', data: [[2], [1]] }, { name: 'B', data: [[3]] }] }"
          ></HotTable>`,
      data() {
        return {
          height: 200,
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(hotInstance.getDataAtCol(0)).toEqual([1, 2]);

    testWrapper.vm.height = 300;
    await nextTick();

    expect(hotInstance.getDataAtCol(0)).toEqual([2, 1]);

    testWrapper.unmount();
  });

  it('sends an option written as an object when a value inside it changes', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :sheetsBar="{ sheets, animation: { switch: animate } }"
          ></HotTable>`,
      data() {
        return {
          animate: true,
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    testWrapper.vm.animate = false;
    await nextTick();

    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsSpy.mock.calls[0][0]).toHaveProperty('sheetsBar.animation.switch', false);
    expect(hotInstance.getPlugin('sheetsBar').getSetting('animation')).toEqual({ switch: false });

    testWrapper.unmount();
  });

  it('turns the sheets bar off and on again when the prop switches between `false` and an object', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :sheetsBar="enabled ? { sheets } : false"
          ></HotTable>`,
      data() {
        return {
          enabled: true,
          sheets: [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const plugin = testWrapper.getComponent(HotTable).vm.hotInstance.getPlugin('sheetsBar');

    expect(plugin.isEnabled()).toBe(true);

    testWrapper.vm.enabled = false;
    await nextTick();

    expect(plugin.isEnabled()).toBe(false);

    testWrapper.vm.enabled = true;
    await nextTick();

    expect(plugin.isEnabled()).toBe(true);

    testWrapper.unmount();
  });
});

/**
 * Tells whether a value is a non-null object.
 *
 * @param {unknown} value The value to check.
 * @returns {boolean}
 */
function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
