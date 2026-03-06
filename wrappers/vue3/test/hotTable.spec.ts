/* eslint-disable no-console */
import { nextTick, ref, isProxy } from 'vue';
import { mount, config } from '@vue/test-utils';
import HotTable from '../src/HotTable.vue';
import { HOT_DESTROYED_WARNING } from '../src/helpers';
import {
  createSampleData,
} from './_helpers';

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
        licenseKey: 'non-commercial-and-evaluation',
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
        licenseKey: 'non-commercial-and-evaluation',
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
        licenseKey: 'non-commercial-and-evaluation',
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
          licenseKey="non-commercial-and-evaluation"
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
        licenseKey="non-commercial-and-evaluation"
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
          licenseKey="non-commercial-and-evaluation"
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
