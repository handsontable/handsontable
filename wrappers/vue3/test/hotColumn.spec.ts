import { config, mount } from '@vue/test-utils';
import { registerAllCellTypes } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
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
    const DummyRendererComponent = {
      name: 'DummyRendererComponent',
      template: '<div>Row: {{ row }}, Col: {{ col }}, Prop: {{ prop }}, Value: {{ value }}</div>',
    };
    const DummyEditorComponent = {
      extends: BaseEditorComponent,
      name: 'DummyEditorComponent',
      template: '<div></div>',
      methods: {
        getValue() {
          return 'test-value-editor';
        }
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
    expect(columnSettings[0]
      .renderer(hotInstance, document.createElement('TD'), 0, 0, 0, 'A1', {}).innerHTML)
      .toBe('<div>Row: 0, Col: 0, Prop: 0, Value: A1</div>');

    const EditorClass1 = columnSettings[0].editor;

    expect(new EditorClass1().getValue()).toBe('test-value-editor');
    expect(columnSettings[1].title).toBe(void 0);
    expect(columnSettings[1].readOnly).toBe(true);
    expect(columnSettings[1].type).toBe('numeric');
    expect(columnSettings[1].renderer()).toBe('test-value2');
    expect(columnSettings[2].title).toBe('title-3');
    expect(columnSettings[2].readOnly).toBe(true);
    expect(columnSettings[2].renderer()).toBe('test-value3');

    expect(hotInstance.getSettings().columns[0].title).toBe('test-title');
    expect(hotInstance.getSettings().columns[0]
      .renderer(hotInstance, document.createElement('TD'), 0, 0, 0, 'A1', {}).innerHTML)
      .toBe('<div>Row: 0, Col: 0, Prop: 0, Value: A1</div>');

    const EditorClass2 = hotInstance.getSettings().columns[0].editor;

    expect(new EditorClass2().getValue()).toBe('test-value-editor');
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
          init() {
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
          init() {
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
  it('should add as many hot-column children as there are cached renderers and editors for that column', () => {
    const DummyRendererComponent = {
      name: 'DummyRendererComponent',
      template: '<div class="renderer"></div>',
    };
    const App = {
      components: { HotTable, HotColumn, DummyRendererComponent },
      data() {
        return {
          data: createSampleData(50, 2),
          init() {
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

    expect(hotTableComponent.rendererCache.size).toBe(100);
    expect(hotTableComponent.$el.querySelectorAll('.renderer').length).toBe(100);

    testWrapper.unmount();
  });

  it('should be possible to set a key on custom editor to use the same component twice', () => {
    const DummyEditorComponent = {
      extends: BaseEditorComponent,
      name: 'DummyEditorComponent',
      template: '<div class="editor"></div>',
      props: ['test-prop'],
    };
    const App = {
      components: { HotTable, HotColumn, DummyEditorComponent },
      data() {
        return {
          data: createSampleData(2, 2),
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation">
          <HotColumn>
            <DummyEditorComponent hot-editor key="editor-one" test-prop="test-prop-value-1" />
          </HotColumn>
          <HotColumn>
            <DummyEditorComponent hot-editor key="editor-two" test-prop="test-prop-value-2" />
          </HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    const { editorCache } = hotTableComponent;

    expect(editorCache.get('DummyEditorComponent:editor-one').testProp).toBe('test-prop-value-1');
    expect(editorCache.get('DummyEditorComponent:editor-two').testProp).toBe('test-prop-value-2');

    testWrapper.unmount();
  });

  it('should be possible to set a key on custom editor to use the same component twice, alongside an editor without' +
    ' the key property defined', () => {
    const DummyEditorComponent = {
      extends: BaseEditorComponent,
      name: 'DummyEditorComponent',
      template: '<div></div>',
      props: ['test-prop'],
      methods: {
        getValue() {
          // For the sake of this test, the returned value is the passed test prop
          return this.testProp;
        },
      },
    };
    const App = {
      components: { HotTable, HotColumn, DummyEditorComponent },
      data() {
        return {
          data: createSampleData(1, 4),
        };
      },
      template: `
        <HotTable :data="data" licenseKey="non-commercial-and-evaluation">
          <HotColumn>
            <DummyEditorComponent hot-editor key="editor-one" test-prop="test-prop-value-1" />
          </HotColumn>
          <HotColumn>
            <DummyEditorComponent hot-editor key="editor-two" test-prop="test-prop-value-2" />
          </HotColumn>
          <HotColumn>
            <DummyEditorComponent hot-editor test-prop="test-prop-value-common" />
          </HotColumn>
          <HotColumn>
            <DummyEditorComponent hot-editor />
          </HotColumn>
        </HotTable>
      `
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    const { editorCache, hotInstance } = hotTableComponent;

    expect(editorCache.get('DummyEditorComponent:editor-one').testProp).toBe('test-prop-value-1');
    expect(editorCache.get('DummyEditorComponent:editor-two').testProp).toBe('test-prop-value-2');
    expect(editorCache.get('DummyEditorComponent').testProp).toBe('test-prop-value-common');

    expect(hotInstance.getCellEditor(0, 0).prototype.getValue()).toBe('test-prop-value-1');
    expect(hotInstance.getCellEditor(0, 1).prototype.getValue()).toBe('test-prop-value-2');
    expect(hotInstance.getCellEditor(0, 2).prototype.getValue()).toBe('test-prop-value-common');
    expect(hotInstance.getCellEditor(0, 3).prototype.getValue()).toBe('test-prop-value-common');

    testWrapper.unmount();
  });
});
