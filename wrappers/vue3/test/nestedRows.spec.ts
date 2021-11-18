import { mount, config } from '@vue/test-utils';
import { registerPlugin } from 'handsontable/plugins/registry';
import { NestedRows } from 'handsontable/plugins/nestedRows';
import HotTable from '../src/HotTable.vue';

config.renderStubDefaultSlot = true;

registerPlugin(NestedRows);

describe('cooperation with NestedRows plugin', () => {
  it('should display dataset properly #7548', async() => {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          ref="grid"
          licenseKey="non-commercial-and-evaluation"
          :data="data"
          :nestedRows="true"
          ></HotTable>`,
      data() {
        return {
          data: [{
            col1: 'parent1',
            __children: [
              {
                col1: 'p1.c1',
              }, {
                col1: 'p1.c2',
              }
            ]
          }, {
            col1: 'parent2',
            __children: [
              {
                col1: 'p2.c1',
              }, {
                col1: 'p2.c2',
              }, {
                col1: 'p2.c3',
              }
            ]
          }],
        };
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.countRows()).toBe(7);

    await testWrapper.vm.$nextTick();

    expect(hotInstance.countRows()).toBe(7);

    testWrapper.unmount();
  });
});
