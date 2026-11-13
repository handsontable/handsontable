import { type Page } from '@playwright/test';

/**
 * A settings value that `validate()` turns into a function inside the page, because a function cannot cross
 * from the spec to the page.
 */
export const FUNCTION = '__function__';

/**
 * One problem `validateSettings()` reports, reduced to what the spec asserts on.
 */
export interface ReportedProblem {
  path: string;
  code: string;
  severity: string;
}

/**
 * How the fixture loads the files: two script tags that set globals, or a RequireJS-style AMD loader that
 * resolves `handsontable` for the schema file and sets no global.
 */
export type SettingsSchemaLoader = 'script' | 'amd';

/**
 * Page Object for the CDN-file fixtures (`settings-schema-umd.html`, `settings-schema-amd.html`): a page that
 * loads a Handsontable bundle and then `handsontable.settings-schema.js`, which reads the registries of that
 * page's own `Handsontable`. Both fixtures put the two objects the spec drives on `window.htApi`.
 */
export class SettingsSchemaUmdPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly loader: SettingsSchemaLoader;

  constructor(page: Page, theme = 'main', bundle = 'umd', loader: SettingsSchemaLoader = 'script') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.loader = loader;
  }

  /**
   * Navigate to the fixture. Both scripts and the grid init are synchronous, so a load-time failure has
   * already surfaced as a page error once `load` fires.
   */
  async goto(): Promise<void> {
    const fixture = this.loader === 'amd' ? 'settings-schema-amd' : 'settings-schema-umd';

    await this.page.goto(`/tests/fixtures/demo/${fixture}.html?theme=${this.theme}&bundle=${this.bundle}`);
  }

  /**
   * What the file exposes: the names on the object it exports.
   */
  async exposedNames(): Promise<string[]> {
    return this.page.evaluate(() => Object.keys((window as any).htApi.schema ?? {}).sort());
  }

  /**
   * The names of the hooks and of a few options the schema lists as properties, to tell a schema that
   * read the page's hook registry from an empty one.
   */
  async listedProperties(names: string[]): Promise<string[]> {
    return this.page.evaluate(
      (wanted) => wanted.filter(name => name in (window as any).htApi.schema.settingsSchema.properties),
      names
    );
  }

  /**
   * Runs `validateSettings()` of the CDN file in the page and returns the problems.
   *
   * @param settings The settings object to check. A top-level value of `FUNCTION` becomes a function.
   * @param withHot `true` to pass the page's grid as the `hot` option.
   */
  async validate(settings: Record<string, unknown>, withHot = false): Promise<ReportedProblem[]> {
    return this.page.evaluate(({ input, useHot, marker }) => {
      const win = window as any;
      const revived = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [key, value === marker ? () => 0 : value])
      );
      const result = win.htApi.schema.validateSettings(revived, useHot ? { hot: win.hot } : undefined);

      return result.problems.map(({ path, code, severity }: ReportedProblem) => ({ path, code, severity }));
    }, { input: settings, useHot: withHot, marker: FUNCTION });
  }

  /**
   * Registers a cell type on the page's `Handsontable`, after both scripts have loaded.
   */
  async registerCellType(name: string): Promise<void> {
    await this.page.evaluate((cellTypeName) => {
      const { Handsontable } = (window as any).htApi;

      Handsontable.cellTypes.registerCellType(cellTypeName, { renderer: Handsontable.renderers.TextRenderer });
    }, name);
  }

  /**
   * Registers a third-party plugin on the page's `Handsontable`, after both scripts have loaded.
   */
  async registerPlugin(pluginKey: string, settingKeys: string[]): Promise<void> {
    await this.page.evaluate(({ key, keys }) => {
      const { Handsontable } = (window as any).htApi;

      class ThirdPartyPlugin extends Handsontable.plugins.BasePlugin {
        static get PLUGIN_KEY() {
          return key;
        }

        static get SETTING_KEYS() {
          return keys;
        }
      }

      Handsontable.plugins.registerPlugin(ThirdPartyPlugin);
    }, { key: pluginKey, keys: settingKeys });
  }

  /**
   * Registers a hook on the page's `Handsontable`, after both scripts have loaded.
   */
  async registerHook(hookName: string): Promise<void> {
    await this.page.evaluate((name) => (window as any).htApi.Handsontable.hooks.register(name), hookName);
  }

  /**
   * Turns on a plugin of the page's grid through `updateSettings()`.
   */
  async updateGridSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((input) => (window as any).hot.updateSettings(input), settings);
  }
}
