import { nextTick, ref } from 'vue';
import { mount, config } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import { createSampleData } from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

config.renderStubDefaultSlot = true;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

describe('Replacing the whole `data` array', () => {
  it('should load a new array assigned to a ref bound to the `data` prop', async() => {
    const data = ref<unknown[]>(createSampleData(2, 2));
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data"></HotTable>',
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = createSampleData(4, 3);
    await nextTick();

    expect(hotInstance.countRows()).toBe(4);
    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getDataAtCell(3, 2)).toBe('3-2');

    testWrapper.unmount();
  });

  it('should load a new array that has fewer rows and columns', async() => {
    const data = ref<unknown[]>(createSampleData(5, 5));
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data"></HotTable>',
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = createSampleData(1, 2);
    await nextTick();

    expect(hotInstance.countRows()).toBe(1);
    expect(hotInstance.countCols()).toBe(2);
    expect(hotInstance.getData()).toEqual([['0-0', '0-1']]);

    testWrapper.unmount();
  });

  it('should load data assigned after the grid was mounted without any', async() => {
    const data = ref<unknown[]>([]);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data"></HotTable>',
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = createSampleData(3, 2);
    await nextTick();

    expect(hotInstance.countRows()).toBe(3);
    expect(hotInstance.countCols()).toBe(2);

    testWrapper.unmount();
  });

  it('should load a new array of objects with a different set of properties', async() => {
    const data = ref<unknown[]>([{ a: 1, b: 2 }]);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data"></HotTable>',
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = [{ a: 1, b: 2, c: 3 }, { a: 4, b: 5, c: 6 }];
    await nextTick();

    expect(hotInstance.countRows()).toBe(2);
    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getDataAtCell(1, 2)).toBe(6);

    testWrapper.unmount();
  });

  it('should load a new array set as `settings.data` on the same settings object', async() => {
    const settings = ref({ data: createSampleData(2, 2), licenseKey: TEST_LICENSE_KEY });
    const App = {
      components: { HotTable },
      template: '<HotTable :settings="settings"></HotTable>',
      setup: () => ({ settings }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    settings.value.data = createSampleData(3, 4);
    await nextTick();

    expect(hotInstance.countRows()).toBe(3);
    expect(hotInstance.countCols()).toBe(4);

    testWrapper.unmount();
  });

  it('should load a new array that comes with a new `settings` object', async() => {
    const settings = ref({ data: createSampleData(2, 2), licenseKey: TEST_LICENSE_KEY });
    const App = {
      components: { HotTable },
      template: '<HotTable :settings="settings"></HotTable>',
      setup: () => ({ settings }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    settings.value = { data: createSampleData(6, 1), licenseKey: TEST_LICENSE_KEY };
    await nextTick();

    expect(hotInstance.countRows()).toBe(6);
    expect(hotInstance.countCols()).toBe(1);

    testWrapper.unmount();
  });

  it('should keep the sorted row order and the sort config when the array is replaced', async() => {
    const data = ref<unknown[]>([[3], [1], [2]]);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data" :columnSorting="true"></HotTable>',
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    expect(hotInstance.getData()).toEqual([[1], [2], [3]]);

    // `updateData()` puts the new values through the row order the sort left, and does not sort them again.
    // The rows below read 9, 7, 8 under an ascending sort. `loadData()` would show them as they come: 8, 9, 7.
    data.value = [[8], [9], [7]];
    await nextTick();

    expect(hotInstance.getData()).toEqual([[9], [7], [8]]);
    expect(hotInstance.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);

    testWrapper.unmount();
  });

  it('should reload the grid when the array is written inline and the parent re-renders', async() => {
    const counter = ref(0);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="[[counter, 1]]"></HotTable>',
      setup: () => ({ counter, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.getDataAtCell(0, 0)).toBe(0);

    counter.value = 5;
    await nextTick();

    expect(hotInstance.getDataAtCell(0, 0)).toBe(5);

    testWrapper.unmount();
  });
});

describe('Replacing `data` and editing it afterwards', () => {
  it('should treat edits of the new array as in-place edits', async() => {
    const data = ref<string[][]>(createSampleData(2, 2));
    const updateSettingsCalls: unknown[] = [];
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="licenseKey"
          :data="data"
          :afterUpdateSettings="(settings) => { updateSettingsCalls.push(settings) }"
        ></HotTable>`,
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY, updateSettingsCalls }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = createSampleData(3, 2);
    await nextTick();

    expect(updateSettingsCalls.length).toBe(1);

    data.value.push(['x', 'y']);
    await nextTick();
    data.value.splice(0, 1);
    await nextTick();
    data.value[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.countRows()).toBe(3);
    expect(hotInstance.getDataAtCell(0, 0)).toBe('changed');
    expect(updateSettingsCalls.length).toBe(1);

    testWrapper.unmount();
  });

  it('should treat later edits as in-place edits when a hook throws during the replacement', async() => {
    const data = ref<string[][]>(createSampleData(2, 2));
    const updateSettingsCalls: unknown[] = [];
    let throwOnce = true;
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="licenseKey"
          :data="data"
          :afterUpdateData="afterUpdateData"
          :afterUpdateSettings="(settings) => { updateSettingsCalls.push(settings) }"
        ></HotTable>`,
      setup: () => ({
        data,
        licenseKey: TEST_LICENSE_KEY,
        updateSettingsCalls,
        afterUpdateData() {
          if (throwOnce) {
            throwOnce = false;
            throw new Error('listener failed');
          }
        },
      }),
    };
    const testWrapper = mount(App, {
      attachTo: document.getElementById('app'),
      global: { config: { errorHandler: jest.fn() } },
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = createSampleData(3, 2);
    await nextTick();

    expect(throwOnce).toBe(false);

    const callsAfterReplacement = updateSettingsCalls.length;

    data.value[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getDataAtCell(0, 0)).toBe('changed');
    expect(updateSettingsCalls.length).toBe(callsAfterReplacement);

    testWrapper.unmount();
  });

  it('should load the same array again after `data` was cleared', async() => {
    const rows = createSampleData(3, 2);
    const data = ref<unknown[] | null>(rows);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data"></HotTable>',
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = null;
    await nextTick();

    expect(hotInstance.getDataAtCell(2, 1)).toBeNull();

    data.value = rows;
    await nextTick();

    expect(hotInstance.countRows()).toBe(3);
    expect(hotInstance.countCols()).toBe(2);
    expect(hotInstance.getDataAtCell(2, 1)).toBe('2-1');

    testWrapper.unmount();
  });

  it('should not send a cleared `data` again on a later unrelated prop change', async() => {
    const data = ref<unknown[] | null>(createSampleData(2, 2));
    const rowHeaders = ref(false);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data" :rowHeaders="rowHeaders"></HotTable>',
      setup: () => ({ data, rowHeaders, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value = null;
    await nextTick();

    hotInstance.loadData([['loaded', 'by', 'the', 'app']]);

    rowHeaders.value = true;
    await nextTick();

    expect(hotInstance.getData()).toEqual([['loaded', 'by', 'the', 'app']]);

    testWrapper.unmount();
  });

  it('should give the direct `data` prop priority over `settings.data` when the array is replaced', async() => {
    const data = ref<unknown[]>(createSampleData(2, 2));
    const settings = ref({ data: createSampleData(5, 5) });
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :settings="settings" :data="data"></HotTable>',
      setup: () => ({ data, settings, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    settings.value.data = createSampleData(6, 6);
    await nextTick();

    expect(hotInstance.countRows()).toBe(2);

    data.value = createSampleData(4, 3);
    await nextTick();

    expect(hotInstance.countRows()).toBe(4);
    expect(hotInstance.countCols()).toBe(3);

    testWrapper.unmount();
  });
});

describe('Editing the `data` array in place', () => {
  it('should not call `updateSettings()` for a push, a splice, and a cell write', async() => {
    const data = ref<string[][]>(createSampleData(2, 2));
    const updateSettingsCalls: unknown[] = [];
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="licenseKey"
          :data="data"
          :afterUpdateSettings="(settings) => { updateSettingsCalls.push(settings) }"
        ></HotTable>`,
      setup: () => ({ data, licenseKey: TEST_LICENSE_KEY, updateSettingsCalls }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value.push(['x', 'y']);
    await nextTick();

    expect(hotInstance.countRows()).toBe(3);

    data.value.splice(0, 1);
    await nextTick();

    expect(hotInstance.countRows()).toBe(2);

    data.value[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getDataAtCell(0, 0)).toBe('changed');
    expect(updateSettingsCalls).toEqual([]);

    testWrapper.unmount();
  });

  it('should keep the data the app loaded with `loadData()` on an unrelated prop change', async() => {
    const data = ref<unknown[]>(createSampleData(2, 2));
    const rowHeaders = ref(false);
    const App = {
      components: { HotTable },
      template: '<HotTable :licenseKey="licenseKey" :data="data" :rowHeaders="rowHeaders"></HotTable>',
      setup: () => ({ data, rowHeaders, licenseKey: TEST_LICENSE_KEY }),
    };
    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.loadData([['loaded', 'by', 'the', 'app']]);

    rowHeaders.value = true;
    await nextTick();

    expect(hotInstance.getData()).toEqual([['loaded', 'by', 'the', 'app']]);

    testWrapper.unmount();
  });
});
