import Handsontable from 'handsontable/base';
import { registerPlugin, BasePlugin } from 'handsontable/plugins';
import { registerAllModules } from 'handsontable/registry';

const PLUGIN_SETTING = 'enableReadsSettingsTest';

class EnableReadsSettingsTestPlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_SETTING;
  }

  static get PLUGIN_PRIORITY() {
    return 964;
  }

  static get DEFAULT_SETTINGS() {
    return { mode: 'default' };
  }

  seenOnEnable = [];

  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_SETTING];
  }

  enablePlugin() {
    this.seenOnEnable.push(this.getSetting('mode'));
    super.enablePlugin();
  }
}

registerPlugin(EnableReadsSettingsTestPlugin);
registerAllModules();

describe('BasePlugin#onUpdateSettings enabling a plugin', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  it('should hand the new settings to `enablePlugin()` when an update turns the plugin on', () => {
    hot = new Handsontable(document.createElement('div'), {
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(PLUGIN_SETTING);

    hot.updateSettings({ [PLUGIN_SETTING]: { mode: 'first' } });

    expect(plugin.seenOnEnable).toEqual(['first']);
  });

  it('should hand the new settings to `enablePlugin()` when an update turns the plugin on again', () => {
    hot = new Handsontable(document.createElement('div'), {
      [PLUGIN_SETTING]: { mode: 'first' },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin(PLUGIN_SETTING);

    hot.updateSettings({ [PLUGIN_SETTING]: false });
    hot.updateSettings({ [PLUGIN_SETTING]: { mode: 'second' } });

    expect(plugin.seenOnEnable).toEqual(['first', 'second']);
  });

  it('should bind the row headers strictly when `bindRowsWithHeaders: \'strict\'` is turned on by an update', () => {
    hot = new Handsontable(document.createElement('div'), {
      data: [['a'], ['b']],
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({ bindRowsWithHeaders: 'strict' });
    hot.alter('insert_row_above', 0);

    expect(hot.getRowHeader(0)).toBe(3);
    expect(hot.getRowHeader(1)).toBe(1);
  });
});
