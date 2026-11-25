import { mount, config } from '@vue/test-utils';
import HotTable from '../src/HotTable.vue';
import './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

config.renderStubDefaultSlot = true;

// The core reads the key once, while the grid is built, so a wrapper that passed it any later (in an
// `updateSettings()` after the constructor) would leave every grid behind the license lock. These tests
// build the grid through the component, with the key as a prop and inside `settings`, and read what the
// core decided.
describe('The license key through HotTable', () => {
  let testWrapper: ReturnType<typeof mount> | null = null;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    // The core prints its license message once per page, so only the first grid of a file would show it:
    // these tests read the lock, which every grid draws on its own, and the spy keeps the output quiet.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    testWrapper?.unmount();
    testWrapper = null;
    warn.mockRestore();
  });

  /**
   * Mounts a grid from a template and returns its instance.
   *
   * @param {string} template The template.
   * @param {object} [data] What the template binds.
   * @returns {object}
   */
  function mountGrid(template: string, data: Record<string, unknown> = {}) {
    const App = {
      components: { HotTable },
      template,
      data: () => ({ rows: [['A1', 'B1']], ...data }),
    };

    testWrapper = mount(App, { attachTo: document.getElementById('app') as HTMLElement });

    return testWrapper.getComponent(HotTable).vm.hotInstance;
  }

  /**
   * The license lock of a grid, or `null`. The root wrapper is asserted first: a grid with no wrapper
   * would otherwise read as unlocked without any lock being checked.
   *
   * @param {object} hot The instance.
   * @param {HTMLElement} hot.rootElement The instance's root element.
   * @returns {Element | null}
   */
  function lockOf(hot: { rootElement: HTMLElement }): Element | null {
    const wrapper = hot.rootElement.closest('.ht-root-wrapper');

    expect(wrapper).not.toBeNull();

    return wrapper?.querySelector('.ht-license-lock') ?? null;
  }

  it('should build a grid without a key behind the license lock', () => {
    const hot = mountGrid('<HotTable :data="rows"></HotTable>');

    expect(lockOf(hot)).not.toBeNull();
  });

  it('should build a grid with the key as a prop unlocked', () => {
    const hot = mountGrid('<HotTable :data="rows" :licenseKey="testLicenseKey"></HotTable>');

    expect(hot.getSettings().licenseKey).toBe(TEST_LICENSE_KEY);
    expect(lockOf(hot)).toBeNull();
  });

  it('should build a grid with the key in `settings` unlocked', () => {
    const hot = mountGrid('<HotTable :settings="settings"></HotTable>', {
      settings: { data: [['A1', 'B1']], licenseKey: TEST_LICENSE_KEY },
    });

    expect(hot.getSettings().licenseKey).toBe(TEST_LICENSE_KEY);
    expect(lockOf(hot)).toBeNull();
  });
});
