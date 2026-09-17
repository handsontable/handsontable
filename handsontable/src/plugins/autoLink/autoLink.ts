import { BasePlugin } from '../base';
import type { CellProperties } from '../../settings';
import { LINK_SCHEMES, normalizeSchemes, type LinkScheme, type LinkTarget } from '../../utils/cellLinks';
import { linkifyCell, unlinkifyCell, type LinkifyOptions } from './linkifyCell';
import { resolveAutoLinkSettingsCached, type ResolvedAutoLinkSettings } from './resolveSettings';

export const PLUGIN_KEY = 'autoLink';
export const PLUGIN_PRIORITY = 270;

/**
 * The object form of the `autoLink` option.
 */
export interface AutoLinkSettings {
  /**
   * Where the links open. Default `'_blank'`.
   */
  target?: LinkTarget;
  /**
   * The URL schemes to link, a subset of `http`, `https`, `mailto`, and `tel`. Default: all four.
   */
  schemes?: LinkScheme[];
  /**
   * `true` links URLs inside longer text; `false` links only a cell whose whole value is one URL. Default `true`.
   */
  inline?: boolean;
  /**
   * `true` links only URLs that carry a scheme (`http`, `https`, `mailto`, `tel`). `false` also links
   * bare domains (`example.com`, as `https`) and bare email addresses (`jane@example.com`, as
   * `mailto`), validated against the IANA top-level domain list bundled with Handsontable. Default `true`.
   */
  strict?: boolean;
  /**
   * Extra class name(s) added to every anchor. Default `''`.
   */
  className?: string;
}

/**
 * @plugin AutoLink
 * @class AutoLink
 *
 * @description
 * The `AutoLink` plugin renders the URLs found in cell values as clickable links. It detects `http`,
 * `https`, `mailto`, and `tel` URLs in the text a cell renders and wraps each one in an anchor. The
 * cell keeps its own renderer, its value is left unchanged, and the anchor is rebuilt on every render.
 *
 * Enable it at the grid level with the [`autoLink`](@/api/options.md#autolink) option. A column or
 * a cell can opt out with `autoLink: false`, or override the settings with an object.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   autoLink: true,
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   autoLink={true}
 * />
 * ```
 * :::
 */
export class AutoLink extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      target: '_blank',
      schemes: [...LINK_SCHEMES],
      inline: true,
      strict: true,
      className: '',
    };
  }

  /**
   * Returns an object of validator functions used to type-check each settings property at runtime.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      target: (value: unknown) => value === '_blank' || value === '_self',
      schemes: (value: unknown) => Array.isArray(value) &&
        value.every(scheme => (LINK_SCHEMES as readonly string[]).includes(scheme)),
      inline: (value: unknown) => typeof value === 'boolean',
      strict: (value: unknown) => typeof value === 'boolean',
      className: (value: unknown) => typeof value === 'string',
    };
  }

  /**
   * The grid-level settings, resolved once per enable so the render pass pays no lookup per cell.
   */
  #settings: ResolvedAutoLinkSettings | null = null;

  /**
   * The document's base URL, cached so `#onAfterRenderer` never reads `baseURI` itself. Refreshed on
   * every `beforeRender` - `#onBeforeRender` - rather than only once on enable, in case the document
   * gains or loses a `<base>` element mid-session.
   */
  #baseUrl = '';

  /**
   * Merged column- or cell-level `autoLink` overrides, keyed on the override object itself. A cell's
   * override object is read again on every render pass it is painted, so without this cache the
   * merge-and-validate work in `resolveAutoLinkSettings` would repeat on every render for a cell whose
   * override never changed.
   */
  #overrideCache = new WeakMap<object, ResolvedAutoLinkSettings>();

  /**
   * The full `LinkifyOptions` built for one resolved settings object (grid-level or a cached
   * override), keyed on that object. Avoids allocating a fresh options object - `{ ...resolved,
   * baseUrl }` - on every cell of every render pass; rebuilt only when `#baseUrl` actually changed
   * since the cached entry was built.
   */
  #optionsCache = new WeakMap<ResolvedAutoLinkSettings, LinkifyOptions>();

  /**
   * Checks if the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.#settings = this.#resolveSettings(undefined);
    this.#baseUrl = this.hot.rootDocument.baseURI;
    this.addHook('beforeRender', this.#onBeforeRender);
    this.addHook('afterRenderer', this.#onAfterRenderer);

    // The anchors are written by `afterRenderer`, so a bare enable paints nothing on its own. Under
    // `renderMode: 'onChange'` a render right after this call would skip every cell unless the epoch
    // advances here too - mirrors the same call in `disablePlugin()`.
    this.hot.markAllCellsChanged();

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when `updateSettings()` is invoked with any
   * of the plugin's settings.
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    if (this.hot.rootElement) {
      unlinkifyCell(this.hot.rootElement);
    }

    // The anchors are written by `afterRenderer` from the rendered text. Once the hook is gone only a
    // paint removes them, so under `renderMode: 'onChange'` every cell must paint.
    this.hot.markAllCellsChanged();
    this.#settings = null;

    // `WeakMap` has no `clear()`; a fresh instance is the only way to drop every entry. A later
    // `enablePlugin()` re-derives both caches from scratch, so nothing here needs to survive.
    this.#overrideCache = new WeakMap();
    this.#optionsCache = new WeakMap();

    super.disablePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.#settings = null;

    super.destroy();
  }

  /**
   * `beforeRender` hook callback. Refreshes the cached `baseUrl` so `#onAfterRenderer` never reads
   * `document.baseURI` itself - cheap to call on every render, unlike reading a live DOM property once
   * per cell.
   */
  #onBeforeRender = () => {
    this.#baseUrl = this.hot.rootDocument.baseURI;
  };

  /**
   * Resolves the settings for one cell: the grid-level settings, with a cell-level object merged over
   * them. Every key is validated again here, because a cell-level object never passes the plugin's
   * `SETTINGS_VALIDATORS`.
   *
   * @param {unknown} cellSetting The cell's own `autoLink` meta value.
   * @returns {ResolvedAutoLinkSettings} The resolved settings.
   */
  #resolveSettings(cellSetting: unknown): ResolvedAutoLinkSettings {
    const base: ResolvedAutoLinkSettings = this.#settings ?? {
      target: this.getSetting<LinkTarget>('target'),
      schemes: normalizeSchemes(this.getSetting('schemes')),
      inline: this.getSetting<boolean>('inline'),
      strict: this.getSetting<boolean>('strict'),
      classNames: this.getSetting<string>('className').split(/\s+/).filter(name => name !== ''),
    };

    if (typeof cellSetting !== 'object' || cellSetting === null || cellSetting === this.hot.getSettings()[PLUGIN_KEY]) {
      return base;
    }

    return resolveAutoLinkSettingsCached(this.#overrideCache, base, cellSetting as AutoLinkSettings);
  }

  /**
   * Builds the `LinkifyOptions` for one resolved settings object, memoized in `#optionsCache` so the
   * `{ ...resolved, baseUrl }` copy runs at most once per resolved settings object per `baseUrl` -
   * not once per cell of every render pass.
   *
   * @param {ResolvedAutoLinkSettings} resolved The resolved settings to add `baseUrl` to.
   * @returns {LinkifyOptions} The options ready for `linkifyCell`.
   */
  #toLinkifyOptions(resolved: ResolvedAutoLinkSettings): LinkifyOptions {
    const cached = this.#optionsCache.get(resolved);

    if (cached !== undefined && cached.baseUrl === this.#baseUrl) {
      return cached;
    }

    const options: LinkifyOptions = { ...resolved, baseUrl: this.#baseUrl };

    this.#optionsCache.set(resolved, options);

    return options;
  }

  /**
   * `afterRenderer` hook callback. Links the URLs in the rendered cell.
   *
   * @param {HTMLTableCellElement} TD The rendered cell element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string|number} prop The column property.
   * @param {*} value The cell value.
   * @param {object} cellProperties The cell meta object.
   */
  #onAfterRenderer = (
    TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: unknown,
    cellProperties: CellProperties
  ) => {
    const cellSetting = (cellProperties as { autoLink?: unknown }).autoLink;

    if (cellSetting === false) {
      unlinkifyCell(TD);

      return;
    }

    linkifyCell(TD, this.#toLinkifyOptions(this.#resolveSettings(cellSetting)));
  };
}
