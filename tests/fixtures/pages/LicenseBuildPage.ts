import { type Page, type Locator } from '@playwright/test';
import { type Bundle } from '../bundle';
import { LicenseFixturePage, type LicensePluginsName } from './LicenseFixturePage';

/**
 * A plugin's license token as the built bundle carries it (`static LICENSE`).
 */
export interface BundledPluginLicense {
  capability: string;
  name: string;
  gate: string;
  tiers: string[];
}

/**
 * Page Object for the license capabilities fixture opened with a key the spec builds itself, and
 * optionally under another host name. It reads what the built bundle decided: the license surfaces,
 * the console messages, which plugins run, and the license token each plugin class carries.
 */
export class LicenseBuildPage extends LicenseFixturePage {
  readonly baseURL: string;
  readonly poweredBy: Locator;

  constructor(page: Page, baseURL: string, theme = 'main', bundle: Bundle = 'umd') {
    super(page, theme, bundle);
    this.baseURL = baseURL;
    this.poweredBy = page.locator('.ht-license-powered-by');
  }

  /**
   * Opens the fixture with a key and the options the grid asks for, and waits for the grid. Each load
   * reads its own messages: a spec that loads the page several times compares one load's.
   *
   * @param {object} options The fixture options.
   * @param {string} [options.licenseKey] The key, or nothing for a grid built without one.
   * @param {string} [options.plugins] The options the grid asks for.
   * @param {string} [options.host] The host name to serve the page under.
   */
  async goto({ licenseKey, plugins = 'column-menu', host }: {
    licenseKey?: string, plugins?: LicensePluginsName, host?: string,
  } = {}): Promise<void> {
    const query = new URLSearchParams({ plugins });

    if (licenseKey !== undefined) {
      query.set('licenseKey', licenseKey);
    }

    this.consoleMessages.length = 0;
    await this.open(query, host ? { host, baseURL: this.baseURL } : undefined);
  }

  /**
   * The console messages that name a license key or the features a key leaves out.
   *
   * @returns {string[]}
   */
  licenseMessages(): string[] {
    return this.consoleMessages
      .filter(({ text }) => /licen[cs]e|does not include these features/i.test(text))
      .map(({ type, text }) => `[${type}] ${text}`);
  }

  /**
   * The host name the page reads, as the core's license check reads it.
   *
   * @returns {Promise<string>}
   */
  async host(): Promise<string> {
    return this.page.evaluate(() => location.host);
  }

  /**
   * The license token of every plugin the bundle registers, as its class carries it.
   *
   * @returns {Promise<BundledPluginLicense[]>}
   */
  async pluginLicenses(): Promise<BundledPluginLicense[]> {
    return this.page.evaluate(() => {
      const registries = (window as unknown as { Handsontable: { _registries: {
        getPluginsNames(): string[],
        getPlugin(name: string): { LICENSE?: { capability: string, name: string, gate: string, tiers: string[] } },
      } } }).Handsontable._registries;

      return registries.getPluginsNames()
        .map(name => registries.getPlugin(name).LICENSE)
        .filter(license => license && typeof license.capability === 'string')
        .map(license => ({
          capability: license!.capability,
          name: license!.name,
          gate: license!.gate,
          tiers: [...license!.tiers],
        }));
    });
  }
}
