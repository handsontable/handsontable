import { config, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { registerAllCellTypes } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import {
  createSampleData,
  mockClientDimensions,
} from './_helpers';

config.renderStubDefaultSlot = true;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

registerAllCellTypes();

describe('createColumnSettings', () => {
  it('should create the column settings based on the data provided to the `hot-column` component and its child components', () => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(1, 1),
          init() {
            mockClientDimensions(this.rootElement, 400, 400);
          },
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation" :autoRowSize="false" :autoColumnSize="false"
                  :init="init">
          <HotColumn :title="'test-title'"></HotColumn>
          <HotColumn :readOnly="true" :type="'numeric'" :renderer="() => 'test-value2'"></HotColumn>
          <HotColumn :readOnly="true" :settings="{ title: 'title-3', renderer: () => 'test-value3' }"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable).vm;
    const { columnSettings, hotInstance } = hotTableComponent;

    expect(columnSettings[0].title).toBe('test-title');
    expect(columnSettings[1].title).toBe(void 0);
    expect(columnSettings[1].readOnly).toBe(true);
    expect(columnSettings[1].type).toBe('numeric');
    expect(columnSettings[1].renderer()).toBe('test-value2');
    expect(columnSettings[2].title).toBe('title-3');
    expect(columnSettings[2].readOnly).toBe(true);
    expect(columnSettings[2].renderer()).toBe('test-value3');

    expect(hotInstance.getSettings().columns[0].title).toBe('test-title');
    expect(hotInstance.getSettings().columns[1].title).toBe(void 0);
    expect(hotInstance.getSettings().columns[1].readOnly).toBe(true);
    expect(hotInstance.getSettings().columns[1].type).toBe('numeric');
    expect(hotInstance.getSettings().columns[1].renderer()).toBe('test-value2');
    expect(hotInstance.getSettings().columns[2].title).toBe('title-3');
    expect(hotInstance.getSettings().columns[2].readOnly).toBe(true);
    expect(hotInstance.getSettings().columns[2].renderer()).toBe('test-value3');

    testWrapper.unmount();
  });
});

describe('Dynamic HotColumn add/remove', () => {
  const columnTitles = hotInstance =>
    (hotInstance.getSettings().columns || []).map(column => column.title);

  it('should drop column settings when a HotColumn is removed from the end', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(2, 3),
          columns: ['Sales', 'Marketing', 'Engineering'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="title in columns" :key="title" :title="title"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(3);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Marketing', 'Engineering']);

    testWrapper.vm.columns.pop();

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(2);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Marketing']);

    testWrapper.unmount();
  });

  it('should drop column settings when a HotColumn is removed from the middle (stable keys)', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(2, 3),
          columns: ['Sales', 'Marketing', 'Engineering'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="title in columns" :key="title" :title="title"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(3);

    testWrapper.vm.columns = ['Sales', 'Engineering'];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(2);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Engineering']);

    testWrapper.unmount();
  });

  it('should reduce columns to one when all-but-one HotColumns are removed', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(2, 3),
          columns: ['Sales', 'Marketing', 'Engineering'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="title in columns" :key="title" :title="title"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(3);

    testWrapper.vm.columns = ['Marketing'];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(1);
    expect(columnTitles(hotInstance)).toEqual(['Marketing']);

    testWrapper.unmount();
  });

  it('should reflect the new order when HotColumns are reordered via keys', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(2, 3),
          columns: ['Sales', 'Marketing', 'Engineering'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="title in columns" :key="title" :title="title"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Marketing', 'Engineering']);

    testWrapper.vm.columns = ['Engineering', 'Sales', 'Marketing'];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(columnTitles(hotInstance)).toEqual(['Engineering', 'Sales', 'Marketing']);

    testWrapper.unmount();
  });

  it('should handle an add then remove then add cycle', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(2, 3),
          columns: ['Sales', 'Marketing'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="title in columns" :key="title" :title="title"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(2);

    testWrapper.vm.columns.push('Engineering');

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Marketing', 'Engineering']);

    testWrapper.vm.columns.splice(1, 1);

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(2);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Engineering']);

    testWrapper.vm.columns.push('Support');

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Engineering', 'Support']);

    testWrapper.unmount();
  });

  it('should keep the renderer on a surviving column after another column is removed', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(2, 2),
          columns: [
            { title: 'Sales', renderer: () => 'sales-cell' },
            { title: 'Marketing', renderer: () => 'marketing-cell' },
          ],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="column in columns" :key="column.title"
                     :title="column.title" :renderer="column.renderer"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(2);

    testWrapper.vm.columns = [{ title: 'Sales', renderer: () => 'sales-cell' }];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(1);

    const survivingColumns = hotInstance.getSettings().columns;

    expect(survivingColumns[0].title).toBe('Sales');
    expect(survivingColumns[0].renderer()).toBe('sales-cell');

    testWrapper.unmount();
  });

  it('should keep the column index mapper in sync when the column count changes', async() => {
    const App = {
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(3, 4),
          columns: ['Sales', 'Marketing', 'Engineering', 'Support'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="400" :height="300" :rowHeights="23" :colWidths="50">
          <HotColumn v-for="title in columns" :key="title" :title="title"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(4);
    expect(hotInstance.columnIndexMapper.getNumberOfIndexes()).toBe(4);

    testWrapper.vm.columns = ['Sales', 'Engineering'];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(2);
    expect(hotInstance.columnIndexMapper.getNumberOfIndexes()).toBe(2);

    testWrapper.vm.columns = ['Sales', 'Engineering', 'Support', 'Finance', 'Legal'];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(5);
    expect(hotInstance.columnIndexMapper.getNumberOfIndexes()).toBe(5);

    testWrapper.unmount();
  });

  it('should react to dynamic columns nested inside a wrapper component', async() => {
    const MyHotColumn = {
      components: { HotColumn },
      props: ['title'],
      template: '<HotColumn :title="title"></HotColumn>'
    };

    const App = {
      components: { HotTable, MyHotColumn },
      data() {
        return {
          data: createSampleData(2, 3),
          columns: ['Sales', 'Marketing', 'Engineering'],
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                  :autoRowSize="false" :autoColumnSize="false"
                  :width="300" :height="300" :rowHeights="23" :colWidths="50">
          <MyHotColumn v-for="title in columns" :key="title" :title="title"></MyHotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, { attachTo: document.getElementById('app') });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countCols()).toBe(3);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Marketing', 'Engineering']);

    testWrapper.vm.columns = ['Sales', 'Engineering'];

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(2);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Engineering']);

    testWrapper.vm.columns.push('Finance');

    await nextTick();
    await nextTick();

    expect(hotInstance.countCols()).toBe(3);
    expect(columnTitles(hotInstance)).toEqual(['Sales', 'Engineering', 'Finance']);

    testWrapper.unmount();
  });
});
