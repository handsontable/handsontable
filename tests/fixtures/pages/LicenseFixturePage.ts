import { type Page, type Locator, expect } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The options the license capabilities fixture builds its grid with (`?plugins=`, an allowlist in the fixture).
 */
export type LicensePluginsName = 'filters' | 'column-menu' | 'header-checkbox';

/**
 * Where a page is served from when it is opened under another host name: the host the browser shows, and
 * the local server that answers for it.
 */
export interface ServedHost {
  host: string;
  baseURL: string;
}

/**
 * The plumbing both license page objects share for `demo/license-capabilities.html`: the fixture URL, the
 * waits for the bundle and the grid, the license surfaces, the console messages and which plugins run.
 * `LicenseCapabilitiesPage` opens it with a made-up tier's preset; `LicenseBuildPage` with a key the spec
 * builds and, optionally, under another host name. A change to the fixture's contract is made here once.
 */
export class LicenseFixturePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly bar: Locator;
  readonly lock: Locator;
  readonly consoleMessages: { type: string; text: string }[] = [];
  readonly #routedHosts = new Set<string>();

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.bar = page.locator('.hot-display-license-info');
    this.lock = page.locator('.ht-license-lock');

    // Registered once, from before the first navigation: the license messages print while the grid is
    // built. A listener added per load recorded every later message once more for each call.
    page.on('console', (message) => {
      this.consoleMessages.push({ type: message.type(), text: message.text() });
    });
  }

  /**
   * The messages printed with `console.error`.
   *
   * @returns {string[]}
   */
  get consoleErrors(): string[] {
    return this.consoleMessages.filter(({ type }) => type === 'error').map(({ text }) => text);
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
   * Opens the fixture with the theme, the bundle and the given query, and waits for the bundle and the grid.
   * With `served`, the page is served under `https://<host>` (`page.route()` answers from the local server,
   * so no DNS is needed), and the core reads that host from `location.host`.
   *
   * @param {URLSearchParams} query The fixture's own params, after the theme and the bundle.
   * @param {ServedHost} [served] The host name to serve the page under.
   */
  protected async open(query: URLSearchParams, served?: ServedHost): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    query.forEach((value, key) => params.append(key, value));

    const path = `/tests/fixtures/demo/license-capabilities.html?${params}`;

    if (served) {
      await this.#routeHost(served);
      await this.page.goto(`https://${served.host}${path}`);
    } else {
      await this.page.goto(path);
    }

    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.grid.locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Answers every request to a host from the local server, once per host.
   *
   * @param {ServedHost} served The host and the server that answers for it.
   */
  async #routeHost({ host, baseURL }: ServedHost): Promise<void> {
    if (this.#routedHosts.has(host)) {
      return;
    }

    this.#routedHosts.add(host);
    await this.page.route(`https://${host}/**`, async(route) => {
      const requested = new URL(route.request().url());
      const local = new URL(`${requested.pathname}${requested.search}`, baseURL).href;

      await route.fulfill({ response: await route.fetch({ url: local }) });
    });
  }
}
