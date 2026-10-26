import { nextTick } from 'vue';
import { mount, config } from '@vue/test-utils';
import { registerPlugin } from 'handsontable/plugins/registry';
import { SheetsBar } from 'handsontable/plugins/sheetsBar';
import HotTable from '../src/HotTable.vue';
import './_helpers';

config.renderStubDefaultSlot = true;

registerPlugin(SheetsBar);

describe('cooperation with the SheetsBar plugin', () => {
  it('keeps the visible sheet\'s own headers when a reactive prop changes', async() => {
    const sheets = [
      { name: 'Plain', data: [[1, 2]] },
      { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'] } },
    ];
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :colHeaders="colHeaders"
          :height="height"
          :sheetsBar="{ sheets }"
          ></HotTable>`,
      data() {
        return {
          colHeaders: ['a', 'b'],
          height: 200,
        };
      },
      created() {
        this.sheets = sheets;
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    hotInstance.getPlugin('sheetsBar').setActiveSheet('Own');
    testWrapper.vm.height = 300;
    await nextTick();

    expect(hotInstance.getColHeader(0)).toBe('X');

    hotInstance.getPlugin('sheetsBar').setActiveSheet('Plain');

    expect(hotInstance.getColHeader(0)).toBe('a');

    testWrapper.unmount();
  });
});
