import { warn } from '../../helpers/console';
import { BasePlugin } from '../base';
import { loadingContent } from './content';
import * as C from '../../i18n/constants';

export const PLUGIN_KEY = 'loading';
export const PLUGIN_PRIORITY = 350;
export const LOADING_CLASS_NAME = `ht-${PLUGIN_KEY}`;

/**
 * @plugin Loading
 * @class Loading
 *
 * @description
 * The loading plugin provides a loading overlay system for Handsontable using the Dialog plugin.
 * It displays a loading indicator with customizable title, icon, and description.
 *
 * In order to enable the loading mechanism, {@link Options#loading} option must be set to `true`.
 *
 * The plugin provides several configuration options to customize the loading behavior and appearance:
 * - `icon`: Loading icon to display HTML (as string) in svg format (default: `<svg ... />`).
 * - `title`: Loading title to display (default: 'Loading...').
 * - `description`: Loading description to display (default: '').
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * // Enable loading plugin with default options
 * dialog: true, // Dialog plugin must be enabled
 * loading: true,
 *
 * // Enable loading plugin with custom configuration
 * dialog: true, // Dialog plugin must be enabled
 * loading: {
 *   icon: 'A custom loading icon in SVG format',
 *   title: 'Custom loading title',
 *   description: 'Custom loading description',
 * }
 *
 * // Access to loading plugin instance:
 * const loadingPlugin = hot.getPlugin('loading');
 *
 * // Show a loading programmatically:
 * loadingPlugin.show();
 *
 * // Hide the loading programmatically:
 * loadingPlugin.hide();
 *
 * // Check if dialog is visible:
 * const isVisible = loadingPlugin.isVisible();
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const MyComponent = () => {
 *   const hotRef = useRef(null);
 *
 *   useEffect(() => {
 *     const hot = hotRef.current.hotInstance;
 *     const loadingPlugin = hot.getPlugin('loading');
 *
 *     loadingPlugin.show();
 *   }, []);
 *
 *   return (
 *     <HotTable
 *       ref={hotRef}
 *       settings={{
 *         data: data,
 *         dialog: true, // Dialog plugin must be enabled
 *         loading: {
 *           icon: 'A custom loading icon in SVG format',
 *           title: 'Custom loading title',
 *           description: 'Custom loading description',
 *         }
 *       }}
 *     />
 *   );
 * }
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * hotSettings: Handsontable.GridSettings = {
 *   data: data,
 *   dialog: true, // Dialog plugin must be enabled
 *   loading: {
 *     icon: 'A custom loading icon in SVG format',
 *     title: 'Custom loading title',
 *     description: 'Custom loading description',
 *   }
 * }
 * ```
 *
 * ```html
 * <hot-table
 *   [settings]="hotSettings">
 * </hot-table>
 * ```
 * :::
 */

export class Loading extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      // eslint-disable-next-line max-len
      icon: `<svg class="${LOADING_CLASS_NAME}__icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-width="2" d="M15 8a7 7 0 1 1-3.5-6.062"></path></svg>`,
      title: undefined,
      description: '',
    };
  }

  static get SETTINGS_VALIDATORS() {
    return {
      icon: value => typeof value === 'string',
      title: value => typeof value === 'string',
      description: value => typeof value === 'string',
    };
  }

  /**
   * Dialog instance reference.
   *
   * @type {Dialog|null}
   */
  #dialogPlugin = null;

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (this.#dialogPlugin === null) {
      this.#dialogPlugin = this.hot.getPlugin('dialog');

      if (!this.#dialogPlugin?.isEnabled()) {
        warn('Dialog plugin is not enabled. Please enable it to use the loading plugin.');

        return;
      }
    }

    super.enablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.hide();

    super.disablePlugin();
  }

  /**
   * Check if loading dialog is currently visible.
   *
   * @returns {boolean}
   */
  isVisible() {
    return this.#dialogPlugin?.isVisible() ?? false;
  }

  /**
   * Show loading dialog with optional custom options.
   *
   * @param {object} options Custom loading options.
   * @param {string} options.icon Custom loading icon.
   * @param {string} options.title Custom loading title.
   * @param {string} options.description Custom loading description.
   */
  show(options = {}) {
    if (!this.isEnabled() || !this.#dialogPlugin || !this.#dialogPlugin?.isEnabled()) {
      return;
    }

    if (this.isVisible()) {
      this.update(options);

      return;
    }

    const beforeLoadingShow = this.hot.runHooks('beforeLoadingShow');

    if (beforeLoadingShow === false) {
      return;
    }

    this.update(options);
    this.#dialogPlugin.show();

    this.hot.runHooks('afterLoadingShow');
  }

  /**
   * Hide loading dialog.
   */
  hide() {
    if (!this.#dialogPlugin || !this.#dialogPlugin?.isEnabled() || !this.isVisible()) {
      return;
    }

    this.hot.runHooks('beforeLoadingHide');

    this.#dialogPlugin.hide();

    this.hot.runHooks('afterLoadingHide');
  }

  /**
   * Update loading description without hiding/showing the dialog.
   *
   * @param {object} options Custom loading options.
   * @param {string} options.icon Custom loading icon.
   * @param {string} options.title Custom loading title.
   * @param {string} options.description Custom loading description.
   */
  update(options) {
    if (!this.isEnabled() || !this.#dialogPlugin || !this.#dialogPlugin?.isEnabled()) {
      return;
    }

    this.updatePluginSettings(options);

    const id = this.hot.guid;
    const icon = this.getSetting('icon');
    const title = this.getSetting('title') ?? this.hot.getTranslatedPhrase(C.LOADING_TITLE);
    const description = this.getSetting('description');

    const content = loadingContent({
      id,
      icon,
      title,
      description,
    });

    this.#dialogPlugin.update({
      content,
      customClassName: LOADING_CLASS_NAME,
      background: this.hot.countSourceRows() === 0 ? 'solid' : 'semi-transparent',
      a11y: {
        role: 'alertdialog',
        ariaLabelledby: `${id}-${PLUGIN_KEY}-title`,
        ariaDescribedby: description ? `${id}-${PLUGIN_KEY}-description` : undefined,
      },
    });
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#dialogPlugin = null;

    super.destroy();
  }
}
