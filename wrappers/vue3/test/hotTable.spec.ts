/* eslint-disable no-console */
import { nextTick, ref, isProxy } from 'vue';
import { mount, config } from '@vue/test-utils';
import HotTable from '../src/HotTable.vue';
import { HOT_DESTROYED_WARNING } from '../src/helpers';
import {
  createSampleData,
} from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

config.renderStubDefaultSlot = true;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

describe('hotInit', () => {
  it('should initialize Handsontable and assign it to the `hotInstace` property of the provided object', () => {
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(1, 1),
        licenseKey: TEST_LICENSE_KEY,
      },
    });

    const hotTableComponent = testWrapper.getComponent(HotTable).vm;

    expect(typeof hotTableComponent.hotInstance).toBe('object');
    expect(hotTableComponent.hotInstance.getDataAtCell(0, 0)).toBe('0-0');

    testWrapper.unmount();
  });

  it('should not proxy the components `hotInstance` property', async() => {
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(1, 1),
        licenseKey: TEST_LICENSE_KEY,
      },
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(isProxy(hotInstance)).toBe(false);

    testWrapper.unmount();
  });
});

describe('Updating the Handsontable settings', () => {
  it('should update the previously initialized Handsontable instance with a single changed property', async() => {
    let updateSettingsCalls = 0;
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(1, 1),
        licenseKey: TEST_LICENSE_KEY,
        rowHeaders: true,
        afterUpdateSettings() {
          updateSettingsCalls += 1;
        },
      },
    });

    const hotTableComponent = testWrapper.getComponent(HotTable);

    expect(hotTableComponent.vm.hotInstance.getSettings().rowHeaders).toBe(true);

    await testWrapper.setProps({
      rowHeaders: false,
    });

    expect(updateSettingsCalls).toBe(1);
    expect(hotTableComponent.vm.hotInstance.getSettings().rowHeaders).toBe(false);

    testWrapper.unmount();
  });

  it('should update the previously initialized Handsontable instance only once with multiple changed properties', async() => {
    const initialAfterChangeHook = () => { /* initial hook */ };
    const modifiedAfterChangeHook = () => { /* modified hook */ };
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :rowHeaders="rowHeaders"
          :colHeaders="colHeaders"
          :readOnly="readOnly"
          :afterChange="afterChange"
          :afterUpdateSettings="() => { this.updateSettingsCalls ++ }"
          ></HotTable>`,
      data() {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
          updateSettingsCalls: 0,
          afterChange: initialAfterChangeHook,
        };
      },
      methods: {
        updateData() {
          this.rowHeaders = false;
          this.colHeaders = false;
          this.readOnly = false;
          this.afterChange = modifiedAfterChangeHook;
        },
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const hotTableComponent = testWrapper.getComponent(HotTable).vm;

    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toBe(true);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toBe(true);

    const hooks = hotTableComponent.hotInstance.pluginHookBucket.getHooks('afterChange');

    expect(hooks.filter(hookEntry => hookEntry.callback === initialAfterChangeHook).length).toBe(1);
    expect(hooks.filter(hookEntry => hookEntry.callback === modifiedAfterChangeHook).length).toBe(0);

    await testWrapper.vm.updateData();

    expect(testWrapper.vm.updateSettingsCalls).toBe(1);
    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toBe(false);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toBe(false);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toBe(false);
    expect(hooks.filter(hookEntry => hookEntry.callback === initialAfterChangeHook).length).toBe(0);
    expect(hooks.filter(hookEntry => hookEntry.callback === modifiedAfterChangeHook).length).toBe(1);

    testWrapper.unmount();
  });

  it('should update the previously initialized Handsontable instance with only the options that are passed to the' +
    ' component as props and actually changed', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :rowHeaders="rowHeaders"
          :colHeaders="colHeaders"
          :readOnly="readOnly"
          :minSpareRows="4"
          :afterUpdateSettings="(newSettings) => { this.newSettings = newSettings }"
          ></HotTable>`,
      data() {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
          newSettings: null,
        };
      },
      methods: {
        updateData() {
          this.rowHeaders = false;
          this.colHeaders = false;
          this.readOnly = false;
        },
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });

    testWrapper.vm.updateData();

    await nextTick();

    expect(Object.keys(testWrapper.vm.newSettings).length).toBe(3);

    testWrapper.unmount();
  });

  it('should not call Handsontable\'s `updateSettings` method, when the table data was changed by reference, and the' +
      ' dataset is an array of arrays', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :data="data"
          :afterUpdateSettings="(newSettings) => { this.newSettings = newSettings }"
          ></HotTable>`,
      data() {
        return {
          data: [[1, 2, 3]],
          newSettings: null,
        };
      },
      methods: {
        modifyFirstRow() {
          this.data[0] = [22, 32, 42];
        },
        addRow() {
          this.data.push([2, 3, 4]);
        },
        removeRow() {
          this.data.pop();
        },
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    testWrapper.vm.addRow();

    await nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3], [2, 3, 4]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.removeRow();

    await nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.modifyFirstRow();

    await nextTick();

    expect(hotInstance.getData()).toEqual([[22, 32, 42]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.removeRow();

    await nextTick();

    expect(hotInstance.getData()).toEqual([]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.unmount();
  });

  it('should call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
      ' dataset is an array of object and property number changed', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :data="data"
          :afterUpdateSettings="(newSettings) => { this.newSettings = newSettings }"
          ></HotTable>`,
      data() {
        return {
          data: [{ a: 1, b: 2, c: 3 }],
          newSettings: null,
        };
      },
      methods: {
        updateData(changedRow) {
          this.data[0] = { ...changedRow };
        },
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    testWrapper.vm.updateData({ a: 1, b: 2, c: 3, d: 4 });

    await nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3, 4]]);
    expect(JSON.stringify(testWrapper.vm.newSettings)).toBe(JSON.stringify({
      data: [{ a: 1, b: 2, c: 3, d: 4 }],
    }));

    testWrapper.vm.updateData({ a: 1 });

    await nextTick();

    expect(hotInstance.getData()).toEqual([[1]]);
    expect(JSON.stringify(testWrapper.vm.newSettings)).toBe(JSON.stringify({
      data: [{ a: 1 }],
    }));

    testWrapper.unmount();
  });

  it('should NOT call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
      ' dataset is an array of object and property number DID NOT change', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :data="data"
          :afterUpdateSettings="(newSettings) => { this.newSettings = newSettings }"
          ></HotTable>`,
      data() {
        return {
          data: [{ a: 1, b: 2, c: 3 }],
          newSettings: null,
        };
      },
      methods: {
        addRow() {
          this.data.push({ a: 12, b: 22, c: 32 });
        },
        removeRow() {
          this.data.pop();
        },
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    testWrapper.vm.addRow();

    await nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3], [12, 22, 32]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.removeRow();

    await nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.unmount();
  });
});

it('should be possible to access the `hotInstance` property of the HotTable instance from a parent-component', () => {
  let hotInstanceFromRef = 'not-set';
  const App = {
    components: { HotTable },
    template: `
      <HotTable
        ref="grid"
        :licenseKey="testLicenseKey"
        :data="data"
        :autoRowSize="false"
        :autoColumnSize="false"
        :cells="cellsCallback"
        >
        </HotTable>`,
    data() {
      return {
        data: createSampleData(1, 1),
      };
    },
    methods: {
      cellsCallback() {
        if (hotInstanceFromRef === 'not-set') {
          hotInstanceFromRef = this.$refs.grid.hotInstance;
        }
      },
    },
  };

  const testWrapper = mount(App, {
    attachTo: document.getElementById('app')
  });

  expect(['not-set', null].includes(hotInstanceFromRef)).toBe(false);

  testWrapper.unmount();
});

it('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
  'has been destroyed', () => {
  const warnFunc = console.warn;
  const App = {
    components: { HotTable },
    template: `
      <HotTable
        :licenseKey="testLicenseKey"
        :data="data"
        ></HotTable>`,
    data() {
      return {
        data: [[1]],
      };
    },
  };
  const warnCalls = [];
  const testWrapper = mount(App, {
    attachTo: document.getElementById('app')
  });
  const { hotInstance } = testWrapper.getComponent(HotTable).vm;

  console.warn = (warningMessage) => {
    warnCalls.push(warningMessage);
  };

  expect(hotInstance.isDestroyed).toBe(false);

  hotInstance.destroy();

  expect(hotInstance.isDestroyed).toBe(true);
  expect(testWrapper.getComponent(HotTable).vm.hotInstance).toBe(null);

  expect(warnCalls.length).toBeGreaterThan(0);
  warnCalls.forEach((message) => {
    expect(message).toBe(HOT_DESTROYED_WARNING);
  });

  testWrapper.unmount();

  console.warn = warnFunc;
});

describe('HOT-based CRUD actions', () => {
  it('should should not add/remove any additional rows when calling `alter` on the HOT instance', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :rowHeaders="true"
          :colHeaders="true"
          :data="data"
          ></HotTable>`,
      data() {
        return {
          data: createSampleData(4, 4),
        };
      },
    };
    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.alter('insert_row_above', 2, 2);
    hotInstance.alter('insert_col_end', 2, 2);

    await nextTick();

    expect(hotInstance.countRows()).toBe(6);
    expect(hotInstance.countSourceRows()).toBe(6);
    expect(hotInstance.countCols()).toBe(6);
    expect(hotInstance.countSourceCols()).toBe(6);
    expect(hotInstance.getSourceData().length).toBe(6);
    expect(hotInstance.getSourceData()[0].length).toBe(6);

    hotInstance.alter('remove_row', 2, 1);
    hotInstance.alter('remove_col', 2, 1);

    expect(hotInstance.countRows()).toBe(5);
    expect(hotInstance.countSourceRows()).toBe(5);
    expect(hotInstance.countCols()).toBe(5);
    expect(hotInstance.countSourceCols()).toBe(5);
    expect(hotInstance.getSourceData().length).toBe(5);
    expect(hotInstance.getSourceData()[0].length).toBe(5);

    testWrapper.unmount();
  });
});

describe('Non-HOT based CRUD actions', () => {
  it('should not add/remove any additional rows when modifying a data array passed to the wrapper', async() => {
    const data = ref(createSampleData(4, 4));
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          :licenseKey="testLicenseKey"
          :rowHeaders="true"
          :colHeaders="true"
          :data="data"
          ></HotTable>`,
      data() {
        return {
          data,
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    data.value[0].push('col4', 'col5');
    data.value.push(['A', 'B', 'C', 'D']);
    data.value.push(['E', 'F', 'G', 'H']);

    await nextTick();

    expect(hotInstance.countRows()).toBe(6);
    expect(hotInstance.countSourceRows()).toBe(6);
    expect(hotInstance.countCols()).toBe(6);
    expect(hotInstance.countSourceCols()).toBe(6);
    expect(hotInstance.getSourceData().length).toBe(6);
    expect(hotInstance.getSourceData()[0].length).toBe(6);

    data.value.pop();
    data.value[0].pop();

    await nextTick();

    expect(hotInstance.countRows()).toBe(5);
    expect(hotInstance.countSourceRows()).toBe(5);
    expect(hotInstance.countCols()).toBe(5);
    expect(hotInstance.countSourceCols()).toBe(5);
    expect(hotInstance.getSourceData().length).toBe(5);
    expect(hotInstance.getSourceData()[0].length).toBe(5);

    testWrapper.unmount();
  });
});

describe('Root size options', () => {
  it('should write `height: "auto"` as inline `height: auto` with no overflow', async() => {
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(3, 3),
        height: 'auto',
        licenseKey: TEST_LICENSE_KEY,
      },
    });

    const { rootElement } = testWrapper.getComponent(HotTable).vm.hotInstance;

    expect(rootElement.style.height).toBe('auto');
    expect(rootElement.style.overflowX).toBe('');
    expect(rootElement.style.overflowY).toBe('');

    testWrapper.unmount();
  });

  it('should warn once for an unreadable size, even though later prop changes re-send it', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(3, 3),
        height: 300,
        licenseKey: TEST_LICENSE_KEY,
      },
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    await testWrapper.setProps({ height: 'abc' });
    // The ignored value is not stored, so the wrapper's diff against `getSettings()` sends it again
    // with every later change.
    await testWrapper.setProps({ colHeaders: true });
    await testWrapper.setProps({ rowHeaders: true });

    const resentHeights = updateSettingsSpy.mock.calls
      .filter(([settings]) => (settings as { height?: unknown }).height === 'abc');
    const sizeWarnings = warnSpy.mock.calls
      .map(([message]) => message)
      .filter(message => typeof message === 'string' && message.includes('cannot be read as a size'));

    expect(resentHeights).toHaveLength(3);
    expect(hotInstance.rootElement.style.height).toBe('300px');
    expect(sizeWarnings).toHaveLength(1);

    warnSpy.mockRestore();
    testWrapper.unmount();
  });
});

describe('Removing a hook prop', () => {
  const mountApp = (template: string, data: Record<string, unknown>) => {
    const testWrapper = mount({
      components: { HotTable },
      template,
      data(): Record<string, any> {
        return {
          gridData: createSampleData(2, 2),
          ...data,
        };
      },
    }, {
      attachTo: document.getElementById('app')
    });

    return {
      testWrapper,
      hotInstance: testWrapper.getComponent(HotTable).vm.hotInstance,
    };
  };

  it('should stop running the callback when the hook prop becomes `undefined`', async() => {
    const afterChange = jest.fn();
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :afterChange="tracking ? afterChange : undefined"
      ></HotTable>`, { tracking: true, afterChange });

    hotInstance.setDataAtCell(0, 0, 'a');

    expect(afterChange).toHaveBeenCalledWith([[0, 0, '0-0', 'a']], 'edit');

    testWrapper.vm.tracking = false;
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'b');

    expect(afterChange).not.toHaveBeenCalledWith([[0, 0, 'a', 'b']], 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);

    testWrapper.unmount();
  });

  it('should stop running the callback when the hook prop is removed', async() => {
    const afterChange = jest.fn();
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        v-bind="hookProps"
      ></HotTable>`, { hookProps: { afterChange } });

    testWrapper.vm.hookProps = {};
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);

    testWrapper.unmount();
  });

  it('should stop running the callback when the hook is removed from the `settings` prop', async() => {
    const afterChange = jest.fn();
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :data="gridData"
        :settings="settings"
      ></HotTable>`, { settings: { licenseKey: TEST_LICENSE_KEY, afterChange } });

    testWrapper.vm.settings = { licenseKey: TEST_LICENSE_KEY };
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);

    testWrapper.unmount();
  });

  it('should stop running the callback when the hook prop becomes `false`', async() => {
    const afterChange = jest.fn();
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :afterChange="tracking && afterChange"
      ></HotTable>`, { tracking: true, afterChange });

    testWrapper.vm.tracking = false;
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);

    testWrapper.unmount();
  });

  it('should keep the callbacks the props did not pass when a hook prop is removed', async() => {
    const afterChange = jest.fn();
    const addedAfterChange = jest.fn();
    const settingsAfterSetDataAtCell = jest.fn();
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :afterChange="tracking ? afterChange : undefined"
      ></HotTable>`, { tracking: true, afterChange });

    hotInstance.addHook('afterChange', addedAfterChange);
    hotInstance.updateSettings({ afterSetDataAtCell: settingsAfterSetDataAtCell });
    testWrapper.vm.tracking = false;
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(addedAfterChange).toHaveBeenCalledWith([[0, 0, '0-0', 'a']], 'edit');
    expect(settingsAfterSetDataAtCell).toHaveBeenCalledWith([[0, 0, '0-0', 'a']]);

    testWrapper.unmount();
  });

  it('should run the callback again when the hook prop is passed back', async() => {
    const afterChange = jest.fn();
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :afterChange="tracking ? afterChange : undefined"
      ></HotTable>`, { tracking: true, afterChange });

    testWrapper.vm.tracking = false;
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');

    testWrapper.vm.tracking = true;
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'b');

    expect(afterChange.mock.calls.filter(([, source]) => source === 'edit'))
      .toEqual([[[[0, 0, 'a', 'b']], 'edit']]);

    testWrapper.unmount();
  });
});

describe('Settings the app changes through the instance', () => {
  const mountApp = (template: string, data: Record<string, unknown>) => {
    const testWrapper = mount({
      components: { HotTable },
      template,
      data(): Record<string, any> {
        return {
          gridData: createSampleData(2, 2),
          ...data,
        };
      },
    }, {
      attachTo: document.getElementById('app')
    });

    return {
      testWrapper,
      hotInstance: testWrapper.getComponent(HotTable).vm.hotInstance,
    };
  };

  it('should keep the `colHeaders` the app set after `alter()` when the `settings` prop still holds the old ones', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :data="gridData"
        :settings="settings"
      ></HotTable>`, { settings: { licenseKey: TEST_LICENSE_KEY, colHeaders: ['Name', 'Percent'] } });

    hotInstance.suspendRender();
    hotInstance.alter('insert_col_end', 3);
    hotInstance.updateSettings({ colHeaders: ['Name', 'Percent', 'Test'] });
    hotInstance.resumeRender();

    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getColHeader()).toEqual(['Name', 'Percent', 'Test']);

    testWrapper.unmount();
  });

  it('should keep a value the app set with `updateSettings()` over a prop that did not change', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="headers"
      ></HotTable>`, { headers: ['A', 'B'] });

    hotInstance.updateSettings({ colHeaders: ['X', 'Y'] });
    testWrapper.vm.gridData[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.vm.gridData[0][1] = 'changed again';
    await nextTick();
    await nextTick();

    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.unmount();
  });

  it('should keep a boolean value the app set with `updateSettings()` over a prop that did not change', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="true"
      ></HotTable>`, {});

    hotInstance.updateSettings({ colHeaders: false });
    testWrapper.vm.gridData[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getSettings().colHeaders).toBe(false);

    testWrapper.vm.gridData[0][1] = 'changed again';
    await nextTick();

    expect(hotInstance.getSettings().colHeaders).toBe(false);

    testWrapper.unmount();
  });

  it('should send the prop again once its value changes after the app overrode it', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="headers"
      ></HotTable>`, { headers: ['A', 'B'] });

    hotInstance.updateSettings({ colHeaders: ['X', 'Y'] });
    testWrapper.vm.gridData[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.vm.headers = ['P', 'Q'];
    await nextTick();

    expect(hotInstance.getColHeader()).toEqual(['P', 'Q']);

    testWrapper.unmount();
  });

  it('should still apply an in-place change of a prop array the grid shares', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="headers"
        :columns="columns"
      ></HotTable>`, { headers: ['A', 'B'], columns: [{ data: 0 }, { data: 1 }] });

    testWrapper.vm.gridData.forEach((row: unknown[]) => row.push('x'));
    testWrapper.vm.columns.push({ data: 2 });
    testWrapper.vm.headers.push('C');
    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getColHeader()).toEqual(['A', 'B', 'C']);

    testWrapper.unmount();
  });

  it('should still apply a new `colHeaders` array passed in the same tick as an in-place data change', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="headers"
      ></HotTable>`, { headers: ['A', 'B'] });

    testWrapper.vm.gridData.forEach((row: unknown[]) => row.push('x'));
    testWrapper.vm.headers = ['A', 'B', 'C'];
    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getColHeader()).toEqual(['A', 'B', 'C']);

    testWrapper.unmount();
  });

  it('should not send an in-place edit of a prop array made after the app overrode it (known limit)', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="headers"
      ></HotTable>`, { headers: ['A', 'B'] });

    hotInstance.updateSettings({ colHeaders: ['X', 'Y'] });
    testWrapper.vm.gridData[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.vm.headers.push('C');
    await nextTick();

    expect(hotInstance.getSettings().colHeaders).toEqual(['X', 'Y']);

    // A new array is a new value, so the prop wins again.
    testWrapper.vm.headers = ['A', 'B', 'C'];
    await nextTick();

    expect(hotInstance.getSettings().colHeaders).toEqual(['A', 'B', 'C']);

    testWrapper.unmount();
  });

  it('should not send an in-place edit of a value inside the `settings` prop made after the app overrode it (known limit)', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :data="gridData"
        :settings="settings"
      ></HotTable>`, { settings: { licenseKey: TEST_LICENSE_KEY, columns: [{ data: 0 }, { data: 1 }] } });

    hotInstance.updateSettings({ columns: [{ data: 0, readOnly: false }, { data: 1, readOnly: false }] });
    testWrapper.vm.gridData[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getCellMeta(0, 0).readOnly).toBe(false);

    testWrapper.vm.settings.columns[0].readOnly = true;
    await nextTick();

    expect(hotInstance.getCellMeta(0, 0).readOnly).toBe(false);

    testWrapper.unmount();
  });

  it('should keep the override when the parent passes an equal inline array on every render', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="['A', 'B']"
        :rowHeaders="rowHeaders"
      ></HotTable>`, { rowHeaders: false });

    hotInstance.updateSettings({ colHeaders: ['X', 'Y'] });
    testWrapper.vm.rowHeaders = true;
    await nextTick();

    expect(hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.unmount();
  });

  it('should keep a value the app set in `afterInit` over a prop that did not change', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colHeaders="headers"
        :rowHeaders="rowHeaders"
        :afterInit="afterInit"
      ></HotTable>`, {
      headers: ['A', 'B'],
      rowHeaders: false,
      afterInit() {
        this.updateSettings({ colHeaders: ['X', 'Y'] });
      },
    });

    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.vm.rowHeaders = true;
    await nextTick();

    expect(hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotInstance.getColHeader()).toEqual(['X', 'Y']);

    testWrapper.unmount();
  });

  it('should still re-apply the `colWidths` prop after the app changed the widths through the instance', async() => {
    const { testWrapper, hotInstance } = mountApp(`
      <HotTable
        :licenseKey="testLicenseKey"
        :data="gridData"
        :colWidths="widths"
      ></HotTable>`, { widths: [50, 60] });

    hotInstance.updateSettings({ colWidths: [80, 90] });
    testWrapper.vm.gridData[0][0] = 'changed';
    await nextTick();

    expect(hotInstance.getSettings().colWidths).toEqual([50, 60]);

    testWrapper.unmount();
  });
});
