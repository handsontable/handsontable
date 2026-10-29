import { BasePlugin } from '../base';
import { loadingContent } from './content';
import { getSanitizer } from '../../utils/sanitizer';
import * as C from '../../i18n/constants';
import { isRootInstance } from '../../utils/rootInstance';
import { LOADING_CLASS_NAME } from '../../helpers/constants';

/**
 * Interface for the Dialog plugin used by Loading.
 */
interface DialogPlugin {
  isEnabled(): boolean;
  isVisible(): boolean;
  hide(): void;
  focus(): void;
  _showDialog(options: LoadingDialogOptions): void;
  _updateDialog(options: LoadingDialogOptions): void;
  _addReplacedListener(listener: () => void): void;
  _removeReplacedListener(listener: () => void): void;
}

/**
 * The options that describe the loading screen to the Dialog plugin. `content` is an element rather than a
 * fragment because the dialog re-reads it on every render, and a fragment is empty after one append.
 */
type LoadingDialogOptions = {
  content: HTMLElement;
  customClassName: string;
  background: string;
  a11y: {
    role: string;
    ariaLabelledby: string;
    ariaDescribedby?: string;
  };
};

/**
 * The built-in spinner, as markup.
 *
 * Hoisted out of `DEFAULT_SETTINGS` so `content.ts` can tell the default from a caller-supplied
 * icon and build the default as DOM nodes instead of parsing it. The string itself is unchanged and
 * still the option's documented default value, because `icon` is public API.
 */
// eslint-disable-next-line max-len
export const DEFAULT_ICON = `<svg class="${LOADING_CLASS_NAME}__icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-width="2" d="M15 8a7 7 0 1 1-3.5-6.062"></path></svg>`;

export const PLUGIN_KEY = 'loading';
export const PLUGIN_PRIORITY = 350;
export { LOADING_CLASS_NAME };

/**
 * @plugin Loading
 * @class Loading
 *
 * @description
 * The loading plugin provides a loading overlay system for Handsontable DataGrid using the Dialog plugin.
 * It displays a loading indicator with customizable title, icon, and description.
 *
 * In order to enable the loading mechanism, {@link Options#loading} option must be set to `true`.
 *
 * The loading overlay is a dialog, so enabling this plugin also enables the Dialog plugin
 * ({@link Options#dialog}). The Dialog plugin stays enabled after you turn `loading` off, and while
 * `loading` is on, setting `dialog: false` does not turn the Dialog plugin off.
 *
 * Calling `updateSettings()` with new `loading` options updates a visible loading overlay in place,
 * without hiding it.
 *
 * `isVisible()`, `hide()`, and `update()` act on the loading overlay only. A dialog your application shows
 * through the Dialog plugin is left alone, and `show()` replaces it with the loading overlay. When the
 * loading overlay is hidden through the Dialog plugin, the `afterLoadingHide` hook still fires.
 *
 * The plugin provides several configuration options to customize the loading behavior and appearance:
 * - `icon`: Loading icon to display HTML (as string) in svg format (default: `<svg ... />`).
 * - `title`: Loading title to display, rendered as text (default: 'Loading...').
 * - `description`: Loading description to display, rendered as text (default: '').
 *
 * `icon` is the only option written to the DOM as markup. `title` and `description` are escaped, so
 * markup passed in them shows up literally instead of being interpreted.
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
      icon: DEFAULT_ICON,
      title: undefined as string | undefined,
      description: '',
    };
  }

  /**
   * Returns an object of validator functions used to type-check each settings property at runtime.
   */
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
   * Whether the dialog on screen is the loading screen this plugin showed. The dialog is a surface an
   * application uses too, so its visibility alone says nothing about the loading screen.
   *
   * @type {boolean}
   */
  #ownsDialog = false;

  /**
   * The content element the last description used, with the values it was built from. The Dialog plugin
   * compares content elements by identity, so a new element for the same values would re-render the shown
   * screen (and restart the spinner) on every settings re-send.
   *
   * @type {{ element: HTMLElement, inputs: unknown[] } | null}
   */
  #content: { element: HTMLElement; inputs: unknown[] } | null = null;

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * The loading indicator renders through the Dialog plugin, which is available on the main
   * Handsontable instance only. In a nested grid (the one the `handsontable`, `autocomplete`, and
   * `dropdown` cell types create) there is nothing to render into, so the plugin stays disabled
   * there.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return isRootInstance(this.hot) && !!this.hot.getSettings()[PLUGIN_KEY];
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
    }

    // Registered on every enable, not only on the first: disabling the plugin removes its hooks
    // while the dialog reference above survives, so a hook inside that branch would be gone
    // after the first updateSettings.
    this.addHook('afterDialogFocus', this.#onAfterDialogFocus);
    this.addHook('afterDialogHide', this.#onAfterDialogHide);
    this.#dialogPlugin?._addReplacedListener(this.#onDialogReplaced);

    super.enablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update. The plugin stays enabled, so a loading
   * screen on screen stays there and shows the new options, and no `beforeLoadingHide` or
   * `afterLoadingHide` fires for it. Turning the option off goes through `disablePlugin()` instead,
   * which hides the screen.
   */
  updatePlugin() {
    if (this.isVisible()) {
      this.update({});
    }

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.hide();
    this.#dialogPlugin?._removeReplacedListener(this.#onDialogReplaced);

    super.disablePlugin();
  }

  /**
   * Check if loading dialog is currently visible. A dialog the application shows with its own content does
   * not count.
   *
   * @returns {boolean}
   */
  isVisible(): boolean {
    return this.#ownsDialog && (this.#dialogPlugin?.isVisible() ?? false);
  }

  /**
   * Show loading dialog with optional custom options. A dialog the application shows at that moment is
   * hidden first, and the loading screen takes its place.
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

    this.updatePluginSettings(options);
    this.#dialogPlugin.hide();

    this.#ownsDialog = true;

    try {
      this.#dialogPlugin._showDialog(this.#describeDialog());
    } catch (error) {
      this.#ownsDialog = false;

      throw error;
    }

    this.hot.runHooks('afterLoadingShow');
  }

  /**
   * Hide loading dialog. A dialog the application shows with its own content stays on screen.
   */
  hide(): void {
    if (!this.#dialogPlugin || !this.#dialogPlugin?.isEnabled() || !this.isVisible()) {
      return;
    }

    const shouldProceed = this.hot.runHooks('beforeLoadingHide');

    if (shouldProceed === false) {
      return;
    }

    this.#ownsDialog = false;
    this.#dialogPlugin.hide();

    this.hot.runHooks('afterLoadingHide');
  }

  /**
   * Update loading description without hiding/showing the dialog. The new options are kept for the next
   * `show()` when the loading screen is not on screen, and a dialog the application shows is left alone.
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

    if (this.isVisible()) {
      this.#dialogPlugin._updateDialog(this.#describeDialog());
    }
  }

  /**
   * Builds the complete description of the loading screen the Dialog plugin shows: its content, class
   * name, background and accessibility options.
   *
   * @returns {LoadingDialogOptions}
   */
  #describeDialog(): LoadingDialogOptions {
    const id = this.hot.guid;
    const icon = this.getSetting<string>('icon');
    const title = this.getSetting<string | undefined>('title') ?? this.hot.getTranslatedPhrase(C.LOADING_TITLE);
    const description = this.getSetting<string>('description');
    const sanitizer = getSanitizer(this.hot);
    const inputs = [id, icon, title, description, sanitizer];

    if (this.#content === null || inputs.some((value, index) => value !== this.#content!.inputs[index])) {
      this.#content = {
        element: loadingContent({
          id,
          icon,
          title,
          description,
          sanitizer,
          warnScope: this.hot.rootElement,
        }, this.hot.rootDocument),
        inputs,
      };
    }

    const content = this.#content.element;

    return {
      content,
      customClassName: LOADING_CLASS_NAME,
      background: this.hot.countSourceRows() === 0 ? 'solid' : 'semi-transparent',
      a11y: {
        role: 'alertdialog',
        ariaLabelledby: `${id}-${PLUGIN_KEY}-title`,
        ariaDescribedby: description ? `${id}-${PLUGIN_KEY}-description` : undefined,
      },
    };
  }

  /**
   * Handle dialog focus event.
   *
   * The hook fires for every dialog on the grid, so it acts only while the dialog is the loading screen
   * this plugin showed. A loading screen always renders through the `content` option, so it reports no
   * focusable elements and nothing inside it can take the focus - putting it on the container is what
   * lets a screen reader announce the dialog. Any other dialog keeps the focus the Dialog plugin gave it:
   * a `template` dialog has just focused its first button, and pulling the focus back onto the container
   * would leave the buttons unannounced. The ownership flag is set before the dialog shows, because the
   * hook fires from inside `show()`.
   */
  #onAfterDialogFocus = () => {
    if (!this.#ownsDialog) {
      return;
    }

    this.#dialogPlugin!.focus();
  };

  /**
   * Handle a dialog that replaced the loading screen while it was on screen: the application showed its own
   * dialog (`dialog.show()` with `content` or `template`, `showAlert()`, `showConfirm()`, the ExportFile
   * progress dialog). The loading screen is gone, so the plugin gives the dialog up and fires
   * `afterLoadingHide`, and its `hide()` and `update()` then leave the new dialog alone.
   */
  #onDialogReplaced = () => {
    if (!this.#ownsDialog) {
      return;
    }

    this.#ownsDialog = false;
    this.hot.runHooks('afterLoadingHide');
  };

  /**
   * Handle dialog hide event. A loading screen that something other than this plugin hid (`dialog.hide()`,
   * Escape on a closable dialog, the Dialog plugin turned off) is over, so the plugin gives the dialog up
   * and fires `afterLoadingHide` for it. `beforeLoadingHide` does not fire there, because such a hide cannot
   * be vetoed. `hide()` gives the dialog up before it hides it, so its own hide fires the hook once.
   */
  #onAfterDialogHide = () => {
    if (!this.#ownsDialog) {
      return;
    }

    this.#ownsDialog = false;
    this.hot.runHooks('afterLoadingHide');
  };

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#dialogPlugin = null;
    this.#ownsDialog = false;

    super.destroy();
  }
}
