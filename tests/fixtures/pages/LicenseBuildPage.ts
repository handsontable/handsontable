import { type Page, type Locator } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

type PluginsName = 'filters' | 'column-menu';

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
 * optionally under another host name (`page.route` serves the local files there, so no DNS is
 * needed). It reads what the built bundle decided: the license surfaces, the console messages and
 * which plugins are on.
 */
export class LicenseBuildPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly baseURL: string;
  readonly lock: Locator;
  readonly bar: Locator;
  readonly poweredBy: Locator;
  readonly messages: { type: string; text: string }[] = [];
  readonly #routedHosts = new Set<string>();

  constructor(page: Page, baseURL: string, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, baseURL, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.baseURL = baseURL;
    this.lock = page.locator('.ht-license-lock');
    this.bar = page.locator('.hot-display-license-info');
    this.poweredBy = page.locator('.ht-license-powered-by');

    // Registered once, before the first navigation: the license messages print while the grid is built.
    page.on('console', (message) => {
      this.messages.push({ type: message.type(), text: message.text() });
    });
  }

  /**
   * Opens the fixture with a key and the options the grid asks for, and waits for the grid. With `host`,
   * the page is served under `https://<host>`, so the core reads that host from `location.host`.
   *
   * @param {object} options The fixture options.
   * @param {string} [options.licenseKey] The key, or nothing for a grid built without one.
   * @param {string} [options.plugins] The options the grid asks for.
   * @param {string} [options.host] The host name to serve the page under.
   */
  async goto({ licenseKey, plugins = 'column-menu', host }: {
    licenseKey?: string, plugins?: PluginsName, host?: string,
  } = {}): Promise<void> {
    const query = new URLSearchParams({ theme: this.theme, bundle: this.bundle, plugins });

    if (licenseKey !== undefined) {
      query.set('licenseKey', licenseKey);
    }

    const path = `/tests/fixtures/demo/license-capabilities.html?${query}`;

    // Each load reads its own messages: a spec that loads the page several times compares one load's.
    this.messages.length = 0;

    if (host) {
      if (!this.#routedHosts.has(host)) {
        this.#routedHosts.add(host);
        await this.page.route(`https://${host}/**`, async(route) => {
          const requested = new URL(route.request().url());
          const local = new URL(`${requested.pathname}${requested.search}`, this.baseURL).href;

          await route.fulfill({ response: await route.fetch({ url: local }) });
        });
      }
      await this.page.goto(`https://${host}${path}`);
    } else {
      await this.page.goto(path);
    }

    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await this.page.locator('.ht_master .htCore').first().waitFor({ state: 'attached' });
  }

  /**
   * The console messages that name a license key or the features a key leaves out.
   *
   * @returns {string[]}
   */
  licenseMessages(): string[] {
    return this.messages
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
   * Whether a plugin of the grid runs.
   *
   * @param {string} pluginName The plugin key.
   * @returns {Promise<boolean>}
   */
  async isPluginEnabled(pluginName: string): Promise<boolean> {
    return this.page.evaluate(name => (window as unknown as {
      hot: { getPlugin(n: string): { enabled: boolean } };
    }).hot.getPlugin(name).enabled, pluginName);
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
