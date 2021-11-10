import { defineComponent } from 'vue';
import { config, mount } from '@vue/test-utils'
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import { registerAllCellTypes } from 'handsontable/registry';
import {
  createDomContainer,
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
    const DummyRendererComponent = {
      name: 'DummyRendererComponent',
      template: '<div>Row: {{ row }}, Col: {{ col }}, Prop: {{ prop }}, Value: {{ value }}</div>',
    };
    const DummyEditorComponent = {
      name: 'DummyEditorComponent',
      template: '<div></div>',
      data() {
        return {
          hotCustomEditorClass: class A {
            getValue() {
              return 'test-value-editor';
            }
          },
        };
      },
    };

    const App = {
      components: { HotTable, HotColumn, DummyRendererComponent, DummyEditorComponent },
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
          <HotColumn :title="'test-title'">
            <DummyRendererComponent hot-renderer />
            <DummyEditorComponent hot-editor />
          </HotColumn>
          <HotColumn :readOnly="true" :type="'numeric'" :renderer="() => 'test-value2'"></HotColumn>
          <HotColumn :readOnly="true" :settings="{ title: 'title-3', renderer: () => 'test-value3' }"></HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    const { columnSettings, hotInstance } = hotTableComponent;

    expect(columnSettings[0].title).toBe('test-title');
    expect(columnSettings[0].renderer(hotInstance, document.createElement('TD'), 0, 0, 0, 'A1', {}).innerHTML)
      .toBe('<div>Row: 0, Col: 0, Prop: 0, Value: A1</div>');
    // TODO: vue components in cells are not working yet
    // expect((new columnSettings[0].editor()).getValue()).toBe('test-value-editor');
    expect(columnSettings[1].title).toBe(void 0);
    expect(columnSettings[1].readOnly).toBe(true);
    expect(columnSettings[1].type).toBe('numeric');
    expect(columnSettings[1].renderer()).toBe('test-value2');
    expect(columnSettings[2].title).toBe('title-3');
    expect(columnSettings[2].readOnly).toBe(true);
    expect(columnSettings[2].renderer()).toBe('test-value3');

    expect(hotInstance.getSettings().columns[0].title).toBe('test-title');
    expect(hotInstance.getSettings().columns[0].renderer(hotInstance, document.createElement('TD'), 0, 0, 0, 'A1', {}).innerHTML)
      .toBe('<div>Row: 0, Col: 0, Prop: 0, Value: A1</div>');
    // TODO: vue components in cells are not working yet
    // expect((new (hotInstance.getSettings().columns[0].editor)()).getValue()).toBe('test-value-editor');
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

describe('renderer cache', () => {
  it('should cache the same amount of cells, as they are in the table (below LRU limit)', async() => {
    const DummyRendererComponent = {
      name: 'DummyRendererComponent',
      template: '<div></div>',
    };
    const App = {
      components: { HotTable, HotColumn, DummyRendererComponent },
      data() {
        return {
          data: createSampleData(20, 2),
          init: function () {
            mockClientDimensions(this.rootElement, 400, 400);
          },
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation" :height="400" :width="400"
                  :autoRowSize="false" :autoColumnSize="false" :init="init">
          <HotColumn>
            <DummyRendererComponent hot-renderer />
          </HotColumn>
          <HotColumn>
            <DummyRendererComponent hot-renderer />
          </HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.rendererCache.size).toBe(40);

    testWrapper.unmount();
  });

  it('should cache the maximum amount of cells possible in the LRU map, if the number of cells exceeds this limit', () => {
    const DummyRendererComponent = {
      name: 'DummyRendererComponent',
      template: '<div></div>',
    };
    const App = {
      components: { HotTable, HotColumn, DummyRendererComponent },
      data() {
        return {
          data: createSampleData(200, 2),
          init: function () {
            mockClientDimensions(this.rootElement, 400, 400);
          },
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation" :height="400" :width="400"
                  :autoRowSize="false" :autoColumnSize="false" :init="init" :wrapperRendererCacheSize="100">
          <HotColumn>
            <DummyRendererComponent hot-renderer />
          </HotColumn>
          <HotColumn>
            <DummyRendererComponent hot-renderer />
          </HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.rendererCache.size).toBe(100);

    testWrapper.unmount();
  });
});

describe('hot-column children', () => {
  xit('should add as many hot-column children as there are cached renderers and editors for that column', () => {

  });

  xit('should be possible to set a key on custom editor to use the same component twice', () => {

  });

  xit('should be possible to set a key on custom editor to use the same component twice, alongside an editor without' +
    ' the key property defined', () => {

  });
});
