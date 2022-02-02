import Handsontable from 'handsontable';
import { BasePlugin } from 'handsontable/plugins';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const pluginKey: string = BasePlugin.PLUGIN_KEY;
const settingKeys: string[] | boolean = BasePlugin.SETTING_KEYS;

const basePlugin = new BasePlugin(hot);

basePlugin.init();
basePlugin.enablePlugin();
basePlugin.disablePlugin();
basePlugin.addHook('name', () => {});
basePlugin.removeHooks('name');
basePlugin.clearHooks();
basePlugin.callOnPluginsReady(() => {});
basePlugin.destroy();
