import { FormulaBuilder } from '../formulaBuilder';
import { findHook, makePluginHotStub } from './helpers/pluginHotStub';

const HOSTED_CLASS = 'hfe-popup--hosted';

/**
 * Returns the popup portal the most recently enabled plugin appended to the document.
 *
 * @returns {HTMLElement}
 */
function latestPortal(): HTMLElement {
  const portals = document.querySelectorAll<HTMLElement>('.hfe-popup-portal');
  const portal = portals[portals.length - 1];

  if (!portal) {
    throw new Error('no popup portal in the document');
  }

  return portal;
}

/**
 * Returns the one popup root of the given class the portal owns.
 *
 * @param {HTMLElement} portal The popup portal.
 * @param {string} className The popup root class (`hfe-suggestions` or `hfe-fn-help`).
 * @returns {HTMLElement}
 */
function popupIn(portal: HTMLElement, className: string): HTMLElement {
  const roots = portal.querySelectorAll<HTMLElement>(`.${className}`);

  if (roots.length !== 1) {
    throw new Error(`expected one .${className} in the portal, found ${roots.length}`);
  }

  return roots[0];
}

/**
 * Creates a host container attached to the document body.
 *
 * @param {string} [id] Optional element id, for the selector form of the API.
 * @returns {HTMLElement}
 */
function makeHost(id?: string): HTMLElement {
  const host = document.createElement('div');

  if (id) {
    host.id = id;
  }

  document.body.appendChild(host);

  return host;
}

describe('FormulaBuilder popup hosts', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('attachSuggestionsHost moves the suggestions popup into the host and marks it hosted', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portal = latestPortal();
    const suggestions = popupIn(portal, 'hfe-suggestions');
    const host = makeHost();

    expect(suggestions.parentElement).toBe(portal);

    plugin.attachSuggestionsHost(host);

    expect(suggestions.parentElement).toBe(host);
    expect(suggestions.classList.contains(HOSTED_CLASS)).toBe(true);

    plugin.disablePlugin();
  });

  it('detachSuggestionsHost returns the popup to the portal and clears the hosted mark', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portal = latestPortal();
    const suggestions = popupIn(portal, 'hfe-suggestions');

    plugin.attachSuggestionsHost(makeHost());
    plugin.detachSuggestionsHost();

    expect(suggestions.parentElement).toBe(portal);
    expect(suggestions.classList.contains(HOSTED_CLASS)).toBe(false);

    plugin.disablePlugin();
  });

  it('attachFnHelpHost and detachFnHelpHost do the same for the function help popup', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portal = latestPortal();
    const fnHelp = popupIn(portal, 'hfe-fn-help');
    const host = makeHost();

    plugin.attachFnHelpHost(host);

    expect(fnHelp.parentElement).toBe(host);
    expect(fnHelp.classList.contains(HOSTED_CLASS)).toBe(true);

    plugin.detachFnHelpHost();

    expect(fnHelp.parentElement).toBe(portal);
    expect(fnHelp.classList.contains(HOSTED_CLASS)).toBe(false);

    plugin.disablePlugin();
  });

  it('resolves a CSS selector to the host element', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portal = latestPortal();
    const host = makeHost('suggestions-dock');

    plugin.attachSuggestionsHost('#suggestions-dock');

    expect(popupIn(host, 'hfe-suggestions')).toBeDefined();
    expect(portal.querySelector('.hfe-suggestions')).toBeNull();

    plugin.disablePlugin();
  });

  it('a hosted popup carries the grid theme class so it is styled like the grid', () => {
    const stub = makePluginHotStub();

    stub.hot.getCurrentThemeName = () => 'ht-theme-horizon';

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const fnHelp = popupIn(latestPortal(), 'hfe-fn-help');

    plugin.attachFnHelpHost(makeHost());

    expect(fnHelp.classList.contains('ht-theme-horizon')).toBe(true);

    plugin.detachFnHelpHost();

    expect(fnHelp.classList.contains('ht-theme-horizon')).toBe(false);

    plugin.disablePlugin();
  });

  it('the popups.suggestions.container and popups.fnHelp.container settings dock on enable', () => {
    const suggestionsHost = makeHost('settings-suggestions');
    const fnHelpHost = makeHost();
    const stub = makePluginHotStub({
      popups: {
        suggestions: { container: '#settings-suggestions' },
        fnHelp: { container: fnHelpHost },
      },
    });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(popupIn(suggestionsHost, 'hfe-suggestions').classList.contains(HOSTED_CLASS)).toBe(true);
    expect(popupIn(fnHelpHost, 'hfe-fn-help').classList.contains(HOSTED_CLASS)).toBe(true);

    plugin.disablePlugin();
  });

  it('is a no-op while the plugin is disabled: the host stays empty', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);
    const host = makeHost();

    plugin.attachSuggestionsHost(host);
    plugin.attachFnHelpHost(host);

    expect(host.childElementCount).toBe(0);

    plugin.enablePlugin();
    plugin.disablePlugin();
    plugin.attachSuggestionsHost(host);
    plugin.attachFnHelpHost(host);

    expect(host.childElementCount).toBe(0);
  });

  it('keeps the hosts set through attach*Host() when a theme change rebuilds the builder', () => {
    const stub = makePluginHotStub();
    let themeName = 'ht-theme-main';

    stub.hot.getCurrentThemeName = () => themeName;

    const plugin = new FormulaBuilder(stub.instance);
    const suggestionsHost = makeHost();
    const fnHelpHost = makeHost();

    plugin.enablePlugin();
    plugin.attachSuggestionsHost(suggestionsHost);
    plugin.attachFnHelpHost(fnHelpHost);

    const portalBefore = latestPortal();

    themeName = 'ht-theme-main-dark';
    findHook(stub.hot, 'afterSetTheme')();

    expect(latestPortal()).not.toBe(portalBefore);
    expect(popupIn(suggestionsHost, 'hfe-suggestions').classList.contains(HOSTED_CLASS)).toBe(true);
    expect(popupIn(fnHelpHost, 'hfe-fn-help').classList.contains(HOSTED_CLASS)).toBe(true);
    expect(latestPortal().querySelector('.hfe-suggestions')).toBeNull();

    plugin.detachSuggestionsHost();
    themeName = 'ht-theme-main';
    findHook(stub.hot, 'afterSetTheme')();

    expect(popupIn(latestPortal(), 'hfe-suggestions')).toBeDefined();
    expect(popupIn(fnHelpHost, 'hfe-fn-help')).toBeDefined();

    plugin.disablePlugin();
  });

  it('floats a popup whose `container` selector names no element, with a warning, instead of throwing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const stub = makePluginHotStub({
      popups: { suggestions: { container: '#no-such-dock' } },
    });
    const plugin = new FormulaBuilder(stub.instance);

    expect(() => plugin.enablePlugin()).not.toThrow();
    expect(plugin.enabled).toBe(true);
    expect(popupIn(latestPortal(), 'hfe-suggestions').classList.contains(HOSTED_CLASS)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`popups.suggestions.container`'));

    plugin.disablePlugin();
    warnSpy.mockRestore();
  });

  it('keeps the plugin enabled when a rebuild finds the docked container gone', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const host = makeHost('rebuild-dock');
    const stub = makePluginHotStub({
      popups: { suggestions: { container: '#rebuild-dock' } },
    });
    let themeName = 'ht-theme-main';

    stub.hot.getCurrentThemeName = () => themeName;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(popupIn(host, 'hfe-suggestions')).toBeDefined();

    host.remove();
    themeName = 'ht-theme-main-dark';

    expect(() => findHook(stub.hot, 'afterSetTheme')()).not.toThrow();
    expect(plugin.enabled).toBe(true);
    expect(popupIn(latestPortal(), 'hfe-suggestions')).toBeDefined();

    plugin.disablePlugin();
    warnSpy.mockRestore();
  });

  it('rebuilds when the application changes the `popups` object in place and updates the settings', () => {
    const popups: { suggestions: { showClose?: boolean } } = { suggestions: {} };
    const stub = makePluginHotStub({ popups });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portalBefore = latestPortal();

    plugin.updatePlugin();

    expect(latestPortal()).toBe(portalBefore);

    popups.suggestions.showClose = true;
    plugin.updatePlugin();

    expect(latestPortal()).not.toBe(portalBefore);

    plugin.disablePlugin();
  });
});

describe('FormulaBuilder popup hosts given no host', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it.each(['suggestions', 'fnHelp'])('treats `popups.%s: null` as not configured on enable and on update', (name) => {
    const stub = makePluginHotStub({ popups: { [name]: null } });
    const plugin = new FormulaBuilder(stub.instance);

    expect(() => plugin.enablePlugin()).not.toThrow();
    expect(plugin.enabled).toBe(true);
    expect(popupIn(latestPortal(), 'hfe-suggestions')).toBeDefined();
    expect(popupIn(latestPortal(), 'hfe-fn-help')).toBeDefined();
    expect(() => plugin.updatePlugin()).not.toThrow();
    expect(plugin.enabled).toBe(true);

    plugin.disablePlugin();
  });

  it.each([
    ['attachSuggestionsHost', 'hfe-suggestions'],
    ['attachFnHelpHost', 'hfe-fn-help'],
  ] as const)('%s() warns and leaves the popup floating for a host that names no element', (method, popupClass) => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portal = latestPortal();
    const detached = document.createElement('div');

    expect(() => plugin[method]('#no-such-host')).not.toThrow();
    expect(() => plugin[method](detached)).not.toThrow();
    expect(() => plugin[method](null as unknown as HTMLElement)).not.toThrow();
    expect(() => plugin[method](undefined as unknown as HTMLElement)).not.toThrow();
    expect(popupIn(portal, popupClass).classList.contains(HOSTED_CLASS)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`\`${method}()\``));

    plugin.disablePlugin();
    warnSpy.mockRestore();
  });

  it('keeps a host attached while the plugin was disabled and applies it on the next enable', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);
    const host = makeHost();

    plugin.attachFnHelpHost(host);
    plugin.enablePlugin();

    expect(popupIn(host, 'hfe-fn-help').classList.contains(HOSTED_CLASS)).toBe(true);

    plugin.disablePlugin();
    plugin.enablePlugin();

    expect(popupIn(host, 'hfe-fn-help').classList.contains(HOSTED_CLASS)).toBe(true);

    plugin.detachFnHelpHost();
    plugin.disablePlugin();
    plugin.enablePlugin();

    expect(host.childElementCount).toBe(0);

    plugin.disablePlugin();
  });
});

describe('FormulaBuilder popup hosts in a shadow root', () => {
  it('docks a popup into a host its selector finds in the grid\'s shadow root', () => {
    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const helpHost = document.createElement('div');

    helpHost.id = 'help-host';
    document.body.appendChild(shadowHost);

    const stub = makePluginHotStub({ popups: { fnHelp: { container: '#help-host' } } });

    shadowRoot.append(stub.hot.rootElement, helpHost);

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(helpHost.querySelector('.hfe-fn-help')).not.toBeNull();

    plugin.disablePlugin();
    shadowHost.remove();
  });
});
