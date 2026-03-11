import { nextTick } from 'vue';
import { mount, config } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import {
  mockClientDimensions,
} from './_helpers';

config.renderStubDefaultSlot = true;

registerAllModules();

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

describe('MultiSelect cell type', () => {
  it('should render with type "multiselect" (lowercase)', () => {
    const App = {
      components: { HotTable },
      data() {
        return {
          hotSettings: {
            data: [
              [['Ford', 'Nissan'], 2021, 'blue'],
              [['Chevrolet'], 2022, 'silver'],
            ],
            columns: [
              { type: 'multiselect', source: ['Ford', 'Chevrolet', 'Nissan', 'Honda'] },
              { type: 'numeric' },
              { type: 'text' },
            ],
            autoRowSize: false,
            autoColumnSize: false,
            licenseKey: 'non-commercial-and-evaluation',
            init() {
              mockClientDimensions(this.rootElement, 500, 300);
            },
          },
        };
      },
      template: '<HotTable :settings="hotSettings" />',
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app'),
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance).not.toBeNull();
    expect(hotInstance.countRows()).toBe(2);
    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getSourceDataAtCell(0, 0)).toEqual(['Ford', 'Nissan']);

    testWrapper.unmount();
  });

  it('should render with type "multiSelect" (camelCase)', () => {
    const App = {
      components: { HotTable },
      data() {
        return {
          hotSettings: {
            data: [
              [['Ford', 'Nissan'], 2021, 'blue'],
              [['Chevrolet'], 2022, 'silver'],
            ],
            columns: [
              { type: 'multiSelect', source: ['Ford', 'Chevrolet', 'Nissan', 'Honda'] },
              { type: 'numeric' },
              { type: 'text' },
            ],
            autoRowSize: false,
            autoColumnSize: false,
            licenseKey: 'non-commercial-and-evaluation',
            init() {
              mockClientDimensions(this.rootElement, 500, 300);
            },
          },
        };
      },
      template: '<HotTable :settings="hotSettings" />',
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app'),
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance).not.toBeNull();
    expect(hotInstance.countRows()).toBe(2);
    expect(hotInstance.countCols()).toBe(3);
    expect(hotInstance.getSourceDataAtCell(0, 0)).toEqual(['Ford', 'Nissan']);

    testWrapper.unmount();
  });

  it('should not trigger spurious updateSettings calls with multiSelect data', async() => {
    let updateSettingsCalls = 0;

    const App = {
      components: { HotTable },
      data() {
        return {
          hotSettings: {
            data: [
              [['Ford', 'Nissan'], 2021, 'blue'],
            ],
            columns: [
              { type: 'multiSelect', source: ['Ford', 'Chevrolet', 'Nissan', 'Honda'] },
              { type: 'numeric' },
              { type: 'text' },
            ],
            autoRowSize: false,
            autoColumnSize: false,
            licenseKey: 'non-commercial-and-evaluation',
            init() {
              mockClientDimensions(this.rootElement, 500, 300);
            },
            afterUpdateSettings() {
              updateSettingsCalls += 1;
            },
          },
        };
      },
      template: '<HotTable :settings="hotSettings" />',
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app'),
    });

    await nextTick();
    await nextTick();

    expect(updateSettingsCalls).toBe(0);

    testWrapper.unmount();
  });
});
