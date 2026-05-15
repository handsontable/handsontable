import { BasePlugin } from '../base';
import { loadingContent } from './content';
import * as C from '../../i18n/constants';
import { LOADING_CLASS_NAME } from '../../helpers/constants';

/**
 * Interface for the Dialog plugin used by Loading.
 */
interface DialogPlugin {
  isEnabled(): boolean;
  isVisible(): boolean;
  show(): void;
  hide(): void;
  update(options: {
    content: string;
    customClassName: string;
    background: string;
    a11y: {
      role: string;
      ariaLabelledby: string;
      ariaDescribedby?: string;
    };
  }): void;
  focus(): void;
}

export const PLUGIN_KEY = 'loading';
export const PLUGIN_PRIORITY = 350;
export { LOADING_CLASS_NAME };

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
 * loading: true,
 *
 * // Enable loading plugin with custom configuration
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
      title: undefined as string | undefined,
      description: '',
    };
  }

  static get SETTINGS_VALIDATORS() {
    return {
      icon: (value: unknown) => typeof value === 'string',
      title: (value: unknown) => typeof value === 'string',
      description: (value: unknown) => typeof value === 'string',
    };
  }

  /**
   * Dialog instance reference.
   *
   * @type {Dialog|null}
   */
  #dialogPlugin: DialogPlugin | null = null;

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
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
      this.#dialogPlugin = this.hot.getPlugin('dialog') as DialogPlugin;

      if (!this.#dialogPlugin?.isEnabled()) {
        this.hot.getSettings().dialog = true;
      }

      this.hot.addHook('afterDialogFocus', () => this.#onAfterDialogFocus());
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
  isVisible(): boolean {
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
  show(options = {}): void {
    if (!this.isEnabled() || !this.#dialogPlugin || !this.#dialogPlugin?.isEnabled()) {
      return;
    }

    if (this.isVisible()) {
      this.update(options);

      return;
    }

    const shouldProceed = this.hot.runHooks('beforeLoadingShow');

    if (shouldProceed === false) {
      return;
    }

    this.update(options);
    this.#dialogPlugin.show();

    this.hot.runHooks('afterLoadingShow');
  }

  /**
   * Hide loading dialog.
   */
  hide(): void {
    if (!this.#dialogPlugin || !this.#dialogPlugin?.isEnabled() || !this.isVisible()) {
      return;
    }

    const shouldProceed = this.hot.runHooks('beforeLoadingHide');

    if (shouldProceed === false) {
      return;
    }

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
  update(options?: unknown): void {
    if (!this.isEnabled() || !this.#dialogPlugin || !this.#dialogPlugin?.isEnabled()) {
      return;
    }

    this.updatePluginSettings(options);

    const id = this.hot.guid;
    const icon = this.getSetting<string>('icon');
    const title = this.getSetting<string | undefined>('title') ?? this.hot.getTranslatedPhrase(C.LOADING_TITLE);
    const description = this.getSetting<string>('description');

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
   * Handle dialog focus event.
   */
  #onAfterDialogFocus() {
    this.#dialogPlugin!.focus();
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#dialogPlugin = null;

    super.destroy();
  }
}
