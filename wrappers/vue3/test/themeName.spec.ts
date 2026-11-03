import { nextTick, ref } from 'vue';
import { mount, config } from '@vue/test-utils';
import HotTable from '../src/HotTable.vue';
import './_helpers';

config.renderStubDefaultSlot = true;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

describe('themeName prop', () => {
  let testWrapper: ReturnType<typeof mount> | null = null;

  afterEach(() => {
    testWrapper?.unmount();
    testWrapper = null;
  });

  const mountGrid = (themeName: string) => {
    const hotSettings = ref({
      data: [['a', 'b'], ['c', 'd']],
      themeName,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const App = {
      components: { HotTable },
      template: '<HotTable :settings="hotSettings"></HotTable>',
      setup() {
        return { hotSettings };
      },
    };

    testWrapper = mount(App, {
      attachTo: document.getElementById('app')
    });

    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    return { hotInstance, hotSettings };
  };

  it('should not send `themeName` to `updateSettings()` on a cell edit', async() => {
    const { hotInstance } = mountGrid('ht-theme-main');
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    hotInstance.setDataAtCell(0, 0, 'x');
    await nextTick();
    hotInstance.setDataAtCell(0, 0, 'y');
    await nextTick();

    expect(updateSettingsSpy).not.toHaveBeenCalled();
    expect(hotInstance.getCurrentThemeName()).toBe('ht-theme-main');
  });

  it('should still apply a changed `themeName`', async() => {
    const { hotInstance, hotSettings } = mountGrid('ht-theme-main');
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    hotSettings.value.themeName = 'ht-theme-horizon';
    await nextTick();

    expect(updateSettingsSpy).toHaveBeenCalledWith({ themeName: 'ht-theme-horizon' });
    expect(hotInstance.getCurrentThemeName()).toBe('ht-theme-horizon');

    updateSettingsSpy.mockClear();
    hotInstance.setDataAtCell(0, 0, 'x');
    await nextTick();

    expect(updateSettingsSpy).not.toHaveBeenCalled();

    hotSettings.value.themeName = 'ht-theme-main';
    await nextTick();

    expect(updateSettingsSpy).toHaveBeenCalledWith({ themeName: 'ht-theme-main' });
    expect(hotInstance.getCurrentThemeName()).toBe('ht-theme-main');
  });

  it('should keep a theme set with `useTheme()` when a reactive prop changes', async() => {
    const { hotInstance } = mountGrid('ht-theme-main');
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    hotInstance.useTheme('ht-theme-horizon');
    hotInstance.setDataAtCell(0, 0, 'x');
    await nextTick();

    expect(updateSettingsSpy).not.toHaveBeenCalled();
    expect(hotInstance.getCurrentThemeName()).toBe('ht-theme-horizon');
  });
});
