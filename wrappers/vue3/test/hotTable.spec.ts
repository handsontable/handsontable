import HotTable from '../src/HotTable.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import { HOT_DESTROYED_WARNING } from '../src/helpers';
import { mount, config } from '@vue/test-utils';
import {
  createDomContainer,
  createSampleData,
  mockClientDimensions,
  wait,
} from './_helpers';
import { LRUMap } from '../src/lib/lru/lru';

config.renderStubDefaultSlot = true;

describe('hotInit', () => {
  it('should initialize Handsontable and assign it to the `hotInstace` property of the provided object', () => {
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation',
      },
    });

    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(typeof hotTableComponent.hotInstance).toEqual('object');
    expect(hotTableComponent.hotInstance.getDataAtCell(0, 0)).toEqual('0-0');

    testWrapper.unmount();
  });
});

describe('Updating the Handsontable settings', () => {
  it('should update the previously initialized Handsontable instance with a single changed property', async () => {
    let updateSettingsCalls = 0;
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation',
        rowHeaders: true,
        afterUpdateSettings () {
          updateSettingsCalls++;
        },
      },
    });

    const hotTableComponent = testWrapper.getComponent(HotTable as any);
    expect(hotTableComponent.vm.hotInstance.getSettings().rowHeaders).toEqual(true);

    await testWrapper.setProps({
      rowHeaders: false,
    });

    expect(updateSettingsCalls).toEqual(1);
    expect(hotTableComponent.vm.hotInstance.getSettings().rowHeaders).toEqual(false);

    testWrapper.unmount();
  });

  it('should update the previously initialized Handsontable instance only once with multiple changed properties', async () => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
          :rowHeaders="rowHeaders"
          :colHeaders="colHeaders"
          :readOnly="readOnly"
          :afterUpdateSettings="() => { this.updateSettingsCalls ++ }"
          ></HotTable>`,
      data() {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
          updateSettingsCalls: 0,
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

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.vm.$refs.grid;

    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toBe(true);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toBe(true);

    await testWrapper.vm.updateData();

    expect(testWrapper.vm.updateSettingsCalls).toBe(1);
    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toBe(false);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toBe(false);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toBe(false);

    testWrapper.unmount();
  });

  it('should update the previously initialized Handsontable instance with only the options that are passed to the' +
    ' component as props and actually changed', async () => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
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

    const testWrapper = mount(App);

    testWrapper.vm.updateData();

    await testWrapper.vm.$nextTick();

    expect(Object.keys(testWrapper.vm.newSettings).length).toBe(3);

    testWrapper.unmount();
  });

  it('should not call Handsontable\'s `updateSettings` method, when the table data was changed by reference, and the' +
      ' dataset is an array of arrays', async () => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
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

    const testWrapper = mount(App);
    const { hotInstance } = testWrapper.vm.$refs.grid;

    testWrapper.vm.addRow();

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3], [2, 3, 4]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.removeRow();

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.modifyFirstRow();

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[22, 32, 42]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.removeRow();

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.unmount();
  });

  it('should call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
      ' dataset is an array of object and property number changed', async () => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
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

    const testWrapper = mount(App);
    const { hotInstance } = testWrapper.vm.$refs.grid;

    testWrapper.vm.updateData({ a: 1, b: 2, c: 3, d: 4 });

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3, 4]]);
    expect(JSON.stringify(testWrapper.vm.newSettings)).toBe(JSON.stringify({
      data: [{ a: 1, b: 2, c: 3, d: 4 }],
    }));

    testWrapper.vm.updateData({ a: 1 });

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[1]]);
    expect(JSON.stringify(testWrapper.vm.newSettings)).toBe(JSON.stringify({
      data: [{ a: 1 }],
    }));

    testWrapper.unmount();
  });

  it('should NOT call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
      ' dataset is an array of object and property number DID NOT change', async () => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
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

    const testWrapper = mount(App);
    const { hotInstance } = testWrapper.vm.$refs.grid;

    testWrapper.vm.addRow();

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3], [12, 22, 32]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.vm.removeRow();

    await testWrapper.vm.$nextTick();

    expect(hotInstance.getData()).toEqual([[1, 2, 3]]);
    expect(testWrapper.vm.newSettings).toBe(null);

    testWrapper.unmount();
  });
});

describe('getRendererWrapper', () => {
  xit('should create the wrapper function for the provided renderer child component', () => {

  });
});

describe('getEditorClass', () => {
  xit('should create a fresh class to be used as an editor, based on the editor component provided.', () => {

  });
});

describe('Global editors and renderers', () => {
  xit('should allow defining renderer and editor components to work globally on the entire table', () => {

  });
});

xit('should inject an `isRenderer` and `isEditor` properties to renderer/editor components', () => {

});

xit('should be possible to access the `hotInstance` property of the HotTable instance from a parent-component', () => {

});

xit('should be possible to pass props to the editor and renderer components', () => {

});

xit('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
  'has been destroyed', () => {
  const warnFunc = console.warn;
  const App = {
    components: { HotTable },
    template: `
      <HotTable
        ref="grid"
        licenseKey="non-commercial-and-evaluation"
        :data="data"
        ></HotTable>`,
    data() {
      return {
        data: [[1]],
      };
    },
  };
  const warnCalls = [];
  const testWrapper = mount(App);
  const { hotInstance } = testWrapper.vm.$refs.grid;

  console.warn = (warningMessage) => {
    warnCalls.push(warningMessage);
  };

  expect(hotInstance.isDestroyed).toBe(false);

  hotInstance.destroy();

  expect(hotInstance.isDestroyed).toBe(true);
  expect(testWrapper.vm.$refs.grid.hotInstance).toBe(null);

  expect(warnCalls.length).toBeGreaterThan(0);
  warnCalls.forEach((message) => {
    expect(message).toBe(HOT_DESTROYED_WARNING);
  });

  testWrapper.unmount();

  console.warn = warnFunc;
});

describe('HOT-based CRUD actions', () => {
  it('should should not add/remove any additional rows when calling `alter` on the HOT instance', async () => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
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
    const testWrapper = mount(App);
    const { hotInstance } = testWrapper.vm.$refs.grid;

    hotInstance.alter('insert_row', 2, 2);
    hotInstance.alter('insert_col', 2, 2);

    await testWrapper.vm.$nextTick();

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
  it('should not add/remove any additional rows when modifying a data array passed to the wrapper', async () => {
    const externalData = createSampleData(4, 4);
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
          :rowHeaders="true"
          :colHeaders="true"
          :data="data"
          ></HotTable>`,
      data() {
        return {
          data: externalData,
        };
      },
    };
    const testWrapper = mount(App);
    const { hotInstance } = testWrapper.vm.$refs.grid;

    externalData.push('A', 'B');
    externalData[0].push('test', 'test');

    await testWrapper.vm.$nextTick();

    // expect(hotInstance.countRows()).toBe(6);
    expect(hotInstance.countSourceRows()).toBe(6);
    // expect(hotInstance.countCols()).toBe(6);
    expect(hotInstance.countSourceCols()).toBe(6);
    expect(hotInstance.getSourceData().length).toBe(6);
    expect(hotInstance.getSourceData()[0].length).toBe(6);

    externalData.pop();
    externalData[0].pop();

    await testWrapper.vm.$nextTick();

    // expect(hotInstance.countRows()).toBe(4);
    expect(hotInstance.countSourceRows()).toBe(5);
    // expect(hotInstance.countCols()).toBe(4);
    expect(hotInstance.countSourceCols()).toBe(5);
    expect(hotInstance.getSourceData().length).toBe(5);
    expect(hotInstance.getSourceData()[0].length).toBe(5);

    testWrapper.unmount();
  });
});
