import { BasePlugin } from '../base';
import type { CellProperties } from '../../settings';
import { LINK_SCHEMES, normalizeSchemes, type LinkScheme, type LinkTarget } from '../../utils/cellLinks';
import { linkifyCell, unlinkifyCell } from './linkifyCell';
import { resolveAutoLinkSettings, type ResolvedAutoLinkSettings } from './resolveSettings';

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
      className: (value: unknown) => typeof value === 'string',
    };
  }

  /**
   * The grid-level settings, resolved once per enable so the render pass pays no lookup per cell.
   */
  #settings: ResolvedAutoLinkSettings | null = null;

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
      classNames: this.getSetting<string>('className').split(/\s+/).filter(name => name !== ''),
    };

    if (typeof cellSetting !== 'object' || cellSetting === null || cellSetting === this.hot.getSettings()[PLUGIN_KEY]) {
      return base;
    }

    return resolveAutoLinkSettings(base, cellSetting as AutoLinkSettings);
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

    linkifyCell(TD, {
      ...this.#resolveSettings(cellSetting),
      baseUrl: this.hot.rootDocument.baseURI,
    });
  };
}
