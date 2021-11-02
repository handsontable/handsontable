import { NestedRows } from 'handsontable/plugins/nestedRows';
import { registerPlugin } from 'handsontable/plugins/registry';
import HotTable from '../src/HotTable.vue';
import { mount } from '@vue/test-utils';
import Vue from 'vue';

registerPlugin(NestedRows);

describe('cooperation with NestedRows plugin', () => {
  it('should display dataset properly #7548', async() => {
    const testWrapper = mount(HotTable, {
      propsData: {
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
        rowHeaders: true,
        colHeaders: true,
        nestedRows: true,
      }
    });

    expect(testWrapper.vm.hotInstance.countRows()).toEqual(7);

    await Vue.nextTick();

    expect(testWrapper.vm.hotInstance.countRows()).toEqual(7);

    testWrapper.destroy();
  });
});
