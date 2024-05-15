import Handsontable from 'handsontable';
import { BasePlugin } from 'handsontable/plugins';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const pluginKey: string = BasePlugin.PLUGIN_KEY;
const settingKeys: string[] | boolean = BasePlugin.SETTING_KEYS;

const basePlugin = new BasePlugin(hot);
const hotPlugin: Handsontable = basePlugin.hot;

basePlugin.init();
basePlugin.enablePlugin();
basePlugin.disablePlugin();
basePlugin.addHook('beforeKeyDown', (event: any) => false);
basePlugin.addHook('beforeKeyDown', (event: any) => false, 1);
basePlugin.removeHooks('beforeKeyDown');
basePlugin.clearHooks();
basePlugin.callOnPluginsReady(() => {});
basePlugin.destroy();
