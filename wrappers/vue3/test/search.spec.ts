import { nextTick } from 'vue';
import { mount, config } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import './_helpers';

config.renderStubDefaultSlot = true;

registerAllModules();

describe('HotTable `search` options across re-renders', () => {
  /**
   * Mounts an app whose `search` and `height` are reactive.
   *
   * @param {*} search The initial `search` value.
   * @returns {object} The mounted wrapper.
   */
  function mountApp(search: unknown) {
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :data="data"
          :search="search"
          :height="height"
          ></HotTable>`,
      data() {
        return {
          data: [['apple'], ['plum']],
          search,
          height: 200,
        };
      },
    };

    return mount(App, {
      attachTo: document.getElementById('app')
    });
  }

  it('keeps a query method set through the plugin API when an unrelated prop changes', async() => {
    const queryMethod = jest.fn(() => false);
    const testWrapper = mountApp(true);
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('search');

    plugin.setQueryMethod(queryMethod);
    testWrapper.vm.height = 300;
    await nextTick();

    expect(hotInstance.getSettings().height).toBe(300);
    expect(plugin.getQueryMethod()).toBe(queryMethod);

    testWrapper.unmount();
  });

  it('drops the object options once the `search` prop changes to `true`', async() => {
    const queryMethod = jest.fn(() => true);
    const testWrapper = mountApp({ queryMethod, searchResultClass: 'my-hit' });
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;
    const plugin = hotInstance.getPlugin('search');

    testWrapper.vm.search = true;
    await nextTick();

    expect(plugin.getQueryMethod()).not.toBe(queryMethod);
    expect(plugin.getSearchResultClass()).toBe('htSearchResult');

    testWrapper.unmount();
  });
});
