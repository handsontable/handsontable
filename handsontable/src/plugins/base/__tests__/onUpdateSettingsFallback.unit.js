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

  it('should refresh the settings once when an update turns the plugin on through a foreign key', () => {
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
