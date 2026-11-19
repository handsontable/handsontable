import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { registerPlugin } from 'handsontable/plugins/registry';
import { SheetsBar } from 'handsontable/plugins/sheetsBar';
import HotTable from '../src/HotTable.vue';
import './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerPlugin(SheetsBar);

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

const sheets = [
  { name: 'Budget', data: [[1]] },
  { name: 'Forecast', data: [[2]] },
  { name: 'Notes', data: [[3]] },
];

/**
 * Mounts a `HotTable` with three sheets and a reactive `height`.
 *
 * @returns {object} The test wrapper.
 */
function mountGrid() {
  const App = {
    components: { HotTable },
    template: `
      <HotTable
        :licenseKey="testLicenseKey"
        :height="height"
        :sheetsBar="{ sheets }"
        ></HotTable>`,
    data() {
      return { height: 200 };
    },
    created() {
      this.sheets = sheets;
      this.testLicenseKey = TEST_LICENSE_KEY;
    },
  };

  return mount(App, { attachTo: document.getElementById('app') });
}

describe('HotTable sheets bar UI', () => {
  it('renders the tab strip as a labeled group with the active tab marked', () => {
    const testWrapper = mountGrid();
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const strip = hotInstance.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');
    const tabs = strip.querySelectorAll('.ht-sheets-bar__tab');

    expect(strip.getAttribute('role')).toBe('group');
    expect(strip.getAttribute('aria-label')).toBe('Sheets');
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute('role')).toBe('button');
    expect(tabs[0].getAttribute('aria-current')).toBe('true');
    expect(tabs[1].getAttribute('aria-current')).toBe(null);

    testWrapper.unmount();
  });

  it('keeps the keyboard focus and the roving Tab stop on the same tab through a reactive prop change', async() => {
    const testWrapper = mountGrid();
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const tabs = () => hotInstance.rootWrapperElement.querySelectorAll('.ht-sheets-bar__tab');

    hotInstance.listen();
    hotInstance.getFocusScopeManager().activateScope('sheetsBar');
    tabs()[0].focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    const focused = tabs()[1];

    expect(document.activeElement).toBe(focused);
    expect(focused.tabIndex).toBe(0);
    expect(tabs()[0].tabIndex).toBe(-1);

    testWrapper.vm.height = 300;
    await nextTick();

    expect(hotInstance.getSettings().height).toBe(300);
    expect(tabs()[1]).toBe(focused);
    expect(document.activeElement).toBe(focused);
    expect(focused.tabIndex).toBe(0);
    expect(hotInstance.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);

    testWrapper.unmount();
  });
});
