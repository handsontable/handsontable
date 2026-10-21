import { FormulaBuilder } from '../formulaBuilder';
import { makePluginHotStub } from './helpers/pluginHotStub';

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
});
