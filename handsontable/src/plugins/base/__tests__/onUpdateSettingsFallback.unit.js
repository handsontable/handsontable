import Handsontable from 'handsontable/base';
import { registerPlugin, BasePlugin } from 'handsontable/plugins';
import { registerAllModules } from 'handsontable/registry';

const ALWAYS_SETTING = 'settingsFallbackAlwaysTest';
const FOREIGN_SETTING = 'settingsFallbackForeignTest';
const FOREIGN_SWITCH = 'settingsFallbackForeignSwitch';

class SettingsFallbackAlwaysTestPlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return ALWAYS_SETTING;
  }

  static get PLUGIN_PRIORITY() {
    return 965;
  }

  static get SETTING_KEYS() {
    return true;
  }

  isEnabled() {
    return true;
  }
}

class SettingsFallbackForeignTestPlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return FOREIGN_SETTING;
  }

  static get PLUGIN_PRIORITY() {
    return 966;
  }

  static get SETTING_KEYS() {
    return [FOREIGN_SWITCH];
  }

  isEnabled() {
    return !!this.hot.getSettings()[FOREIGN_SWITCH];
  }
}

registerPlugin(SettingsFallbackAlwaysTestPlugin);
registerPlugin(SettingsFallbackForeignTestPlugin);
registerAllModules();

describe('BasePlugin#onUpdateSettings on an update without the plugin key', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  it('should keep the stored setting of a `SETTING_KEYS: true` plugin after an unrelated update', () => {
    hot = new Handsontable(document.createElement('div'), {
      [ALWAYS_SETTING]: { mode: 'kept' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(ALWAYS_SETTING);

    hot.updateSettings({ readOnly: true });

    expect(plugin.getSetting('mode')).toBe('kept');
  });

  it('should take the setting from the payload when the payload carries the plugin key', () => {
    hot = new Handsontable(document.createElement('div'), {
      [ALWAYS_SETTING]: { mode: 'first' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(ALWAYS_SETTING);

    hot.updateSettings({ [ALWAYS_SETTING]: { mode: 'second' } });

    expect(plugin.getSetting('mode')).toBe('second');
  });

  it('should pass an explicit `undefined` as given even when the table meta holds an own value for the key', () => {
    hot = new Handsontable(document.createElement('div'), {
      [ALWAYS_SETTING]: { mode: 'kept' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(ALWAYS_SETTING);
    const updatePluginSettings = jest.spyOn(plugin, 'updatePluginSettings');

    hot.getSettings()[ALWAYS_SETTING] = { mode: 'written on the table meta' };
    hot.updateSettings({ [ALWAYS_SETTING]: undefined });

    expect(updatePluginSettings).toHaveBeenCalledTimes(1);
    expect(updatePluginSettings).toHaveBeenCalledWith(undefined);
    expect(plugin.getSetting('mode')).toBeUndefined();
  });

  it('should clear the stored setting on an explicit `undefined` for the plugin key', () => {
    hot = new Handsontable(document.createElement('div'), {
      [ALWAYS_SETTING]: { mode: 'kept' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(ALWAYS_SETTING);

    hot.updateSettings({ [ALWAYS_SETTING]: undefined });

    expect(hot.getSettings()[ALWAYS_SETTING]).toBeUndefined();
    expect(plugin.getSetting('mode')).toBeUndefined();
  });

  it('should not refresh the settings a second time before `updatePlugin()` in the call that turns the plugin on', () => {
    hot = new Handsontable(document.createElement('div'), {
      [FOREIGN_SETTING]: { mode: 'kept' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(FOREIGN_SETTING);
    const updatePluginSettings = jest.spyOn(plugin, 'updatePluginSettings');

    hot.updateSettings({ [FOREIGN_SWITCH]: true });

    expect(plugin.enabled).toBe(true);
    expect(updatePluginSettings).toHaveBeenCalledTimes(1);
    expect(plugin.getSetting('mode')).toBe('kept');
  });

  it('should keep the stored setting of a plugin enabled through a foreign key after a foreign-key update', () => {
    hot = new Handsontable(document.createElement('div'), {
      [FOREIGN_SETTING]: { mode: 'kept' },
      [FOREIGN_SWITCH]: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(FOREIGN_SETTING);

    hot.updateSettings({ [FOREIGN_SWITCH]: 'still on' });

    expect(plugin.enabled).toBe(true);
    expect(plugin.getSetting('mode')).toBe('kept');
  });
});

describe('BasePlugin#onUpdateSettings refreshes the settings of a built-in plugin once per update', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  /**
   * Builds a grid, spies on the plugin's `updatePluginSettings()` and runs one update.
   *
   * @param {string} pluginName The plugin to spy on.
   * @param {object} settings The initial settings.
   * @param {object} update The `updateSettings()` payload.
   * @returns {jest.SpyInstance} The spy.
   */
  function countRefreshes(pluginName, settings, update) {
    hot = new Handsontable(document.createElement('div'), {
      data: [[1, 2], [3, 4]],
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
    const plugin = hot.getPlugin(pluginName);
    const updatePluginSettings = jest.spyOn(plugin, 'updatePluginSettings');

    hot.updateSettings(update);

    expect(plugin.enabled).toBe(true);

    return updatePluginSettings;
  }

  it('should refresh AutoColumnSize once on `updateSettings({ readOnly: true })`', () => {
    const spy = countRefreshes('autoColumnSize', { autoColumnSize: { samplingRatio: 5 } }, { readOnly: true });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ samplingRatio: 5 });
  });

  it('should refresh AutoRowSize once on `updateSettings({ readOnly: true })`', () => {
    const spy = countRefreshes('autoRowSize', { autoRowSize: { samplingRatio: 5 } }, { readOnly: true });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ samplingRatio: 5 });
  });

  it('should refresh AutoRowHeaderSize once on `updateSettings({ readOnly: true })`', () => {
    const spy = countRefreshes(
      'autoRowHeaderSize',
      { autoRowHeaderSize: { allowSampleDuplicates: true } },
      { readOnly: true }
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ allowSampleDuplicates: true });
  });

  it('should refresh ManualColumnResize once on `updateSettings({ colWidths: 80 })`', () => {
    const spy = countRefreshes('manualColumnResize', { manualColumnResize: [50, 60] }, { colWidths: 80 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([50, 60]);
  });

  it('should refresh ManualRowResize once on `updateSettings({ rowHeights: 40 })`', () => {
    const spy = countRefreshes('manualRowResize', { manualRowResize: [30, 35] }, { rowHeights: 40 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([30, 35]);
  });
});
