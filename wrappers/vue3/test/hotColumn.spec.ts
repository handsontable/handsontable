// @ts-ignore
import { defineComponent, h } from 'vue';
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

registerAllCellTypes();

describe('createColumnSettings', () => {
  it('should create the column settings based on the data provided to the `hot-column` component and its child components', () => {
    const DummyRendererComponent = {
      name: 'DummyRendererComponent',
      template: '<div>test-value</div>',
    };
    const DummyEditorComponent = {
      name: 'DummyEditorComponent',
      render() {
        return null;
      },
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
          licenseKey: 'non-commercial-and-evaluation',
          autoRowSize: false,
          autoColumnSize: false,
          init() {
            mockClientDimensions(this.rootElement, 400, 400);
          },
        };
      },
      template: `
        <div>
          <HotTable>
            <HotColumn :title="'test-title'">
              <DummyRendererComponent hot-renderer />
              <DummyEditorComponent hot-editor />
            </HotColumn>
            <HotColumn :readOnly="true" :type="'numeric'" :renderer="() => 'test-value2'"></HotColumn>
            <HotColumn :readOnly="true" :settings="{ title: 'title-3', renderer: () => 'test-value3' }"></HotColumn>
          </HotTable>
        </div>
      `
    };

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    const { columnSettings, hotInstance } = hotTableComponent;

    expect(columnSettings[0].title).toBe('test-title');
    // TODO: vue components in cells are not working yet
    // expect(columnSettings[0].renderer(hotInstance, document.createElement('TD')).innerHTML).toBe('<div>test-value</div>');
    // expect(columnSettings[0].renderer().innerHTML).toBe('<div>test-value</div>');
    // expect((new columnSettings[0].editor()).getValue()).toBe('test-value-editor');
    expect(columnSettings[1].title).toBe(void 0);
    expect(columnSettings[1].readOnly).toBe(true);
    expect(columnSettings[1].type).toBe('numeric');
    expect(columnSettings[1].renderer()).toBe('test-value2');
    expect(columnSettings[2].title).toBe('title-3');
    expect(columnSettings[2].readOnly).toBe(true);
    expect(columnSettings[2].renderer()).toBe('test-value3');

    expect(hotInstance.getSettings().columns[0].title).toBe('test-title');
    // TODO: vue components in cells are not working yet
    // expect(hotInstance.getSettings().columns[0].renderer(hotInstance, document.createElement('TD')).innerHTML).toBe('<div>test-value</div>');
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
  xit('should cache the same amount of cells, as they are in the table (below LRU limit)', () => {

  });

  xit('should cache the maximum amount of cells possible in the LRU map, if the number of cells exceeds this limit', () => {

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
