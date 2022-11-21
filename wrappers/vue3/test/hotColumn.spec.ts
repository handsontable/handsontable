import { config, mount } from '@vue/test-utils';
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
