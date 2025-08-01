import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { DialogUI } from './dialogUI';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 340;
const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

// Register dialog hooks
Hooks.getSingleton().register('beforeDialogShow');
Hooks.getSingleton().register('afterDialogShow');
Hooks.getSingleton().register('beforeDialogHide');
Hooks.getSingleton().register('afterDialogHide');

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin Dialog
 * @class Dialog
 *
 * @description
 * The dialog plugin provides a modal dialog system for Handsontable. It allows you to display custom content in modal dialogs
 * that overlay the table, providing a way to show notifications, error messages, loading indicators, or any other interactive content.
 *
 * In order to enable the dialog mechanism, {@link Options#dialog} option must be set to `true`.
 *
 * The plugin provides several configuration options to customize the dialog behavior and appearance:
 * - `content`: The string or HTMLElement content to display in the dialog
 * - `customClassName`: Custom class name to apply to the dialog
 * - `background`: Dialog background variant ('solid' by default)
 * - `contentBackground`: Whether to show content background
 * - `contentDirections`: Content layout direction 'row' | 'row-reverse' | 'column' | 'column-reverse'
 * - `animation`: Whether to enable animations
 * - `closable`: Whether the dialog can be closed
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * // Enable dialog plugin with default options
 * dialog: true,
 *
 * // Enable dialog plugin with custom configuration
 * dialog: {
 *   content: 'Dialog content',
 *   customClassName: 'custom-dialog',
 *   background: 'semi-transparent',
 *   contentBackground: false,
 *   contentDirections: 'column',
 *   animation: false,
 *   closable: true,
 * }
 *
 * // Access to dialog plugin instance:
 * const dialogPlugin = hot.getPlugin('dialog');
 *
 * // Show a dialog programmatically:
 * dialogPlugin.show({
 *    content: '<h2>Custom Dialog</h2><p>This is a custom dialog content.</p>',
 *    closable: true,
 *    contentDirections: 'column',
 * });
 *
 * // Hide the dialog programmatically:
 * dialogPlugin.hide();
 *
 * // Check if dialog is visible:
 * const isVisible = dialogPlugin.isVisible();
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
 *     const dialogPlugin = hot.getPlugin('dialog');
 *
 *     dialogPlugin.show({
 *       content: <div>
 *         <h2>React Dialog</h2>
 *         <p>Dialog content rendered with React</p>
 *       </div>,
 *       closable: true
 *     });
 *   }, []);
 *
 *   return (
 *     <HotTable
 *       ref={hotRef}
 *       settings={{
 *         data: data,
 *         dialog: {
 *           customClassName: 'react-dialog',
 *           contentDirections: 'column',
 *           closable: true
 *         }
 *       }}
 *     />
 *   );
 * }
 * ```
 * :::
 *
 * ::: only-for angular
 * ```html
 * <hot-table
 *   [settings]="hotSettings">
 * </hot-table>
 * ```
 *
 * ```ts
 * @Component({
 *   // ... component decorator
 * })
 * export class MyComponent implements OnInit {
 *   @ViewChild('hot') hot: HotTableComponent;
 *
 *   hotSettings: Handsontable.GridSettings = {
 *     data: data,
 *     dialog: {
 *       customClassName: 'angular-dialog',
 *       contentDirections: 'column',
 *       closable: true
 *     }
 *   };
 *
 *   ngOnInit() {
 *     const dialogPlugin = this.hot.hotInstance.getPlugin('dialog');
 *
 *     dialogPlugin.show({
 *       content: `
 *         <div>
 *           <h2>Angular Dialog</h2>
 *           <p>Dialog content in Angular component</p>
 *         </div>
 *       `,
 *       closable: true
 *     });
 *   }
 * }
 * ```
 * :::
 */

export class Dialog extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      content: '',
      customClassName: '',
      background: 'solid',
      contentBackground: false,
      contentDirections: 'row',
      animation: true,
      closable: false,
    };
  }

  static get SETTINGS_VALIDATORS() {
    return {
      content: value => typeof value === 'string' ||
        (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement),
      customClassName: value => typeof value === 'string',
      background: value => ['solid', 'semi-transparent'].includes(value),
      contentBackground: value => typeof value === 'boolean',
      contentDirections: value => ['row', 'row-reverse', 'column', 'column-reverse'].includes(value),
      animation: value => typeof value === 'boolean',
      closable: value => typeof value === 'boolean',
    };
  }

  /**
   * UI instance of the dialog plugin.
   *
   * @private
   * @type {DialogUI}
   */
  #ui = null;

  /**
   * Flag indicating if dialog is currently visible.
   *
   * @private
   * @type {boolean}
   */
  #isVisible = false;

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

    this.#ui = new DialogUI({
      rootElement: this.hot.rootWrapperElement,
    });
    this.registerShortcuts();

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
    this.#destroyDialog();
    this.unregisterShortcuts();

    super.disablePlugin();
  }

  /**
   * Check if the dialog is currently visible.
   *
   * @returns {boolean} True if the dialog is visible, false otherwise.
   */
  isVisible() {
    return this.#isVisible;
  }

  /**
   * Register shortcuts responsible for toggling a merge.
   *
   * @private
   */
  registerShortcuts() {
    const manager = this.hot.getShortcutManager();
    const pluginContext = manager.addContext(SHORTCUTS_CONTEXT_NAME, 'global');

    pluginContext.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.hide();
      },
      runOnlyIf: () => this.#isVisible && this.getSetting('closable'),
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts responsible for toggling a merge.
   *
   * @private
   */
  unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const pluginContext = shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME);

    pluginContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Show dialog with given configuration.
   * Displays the dialog with the specified content and settings.
   *
   * @param {object} settings Dialog configuration object containing content and display options.
   */
  show(settings = {}) {
    if (!this.enabled || this.isVisible()) {
      return;
    }

    this.hot.runHooks('beforeDialogShow');

    this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
    this.update(settings);
    this.#ui.showDialog(this.getSetting('animation'));
    this.#isVisible = true;

    this.hot.runHooks('afterDialogShow');
  }

  /**
   * Hide the currently open dialog.
   * Closes the dialog and cleans up event listeners.
   */
  hide() {
    if (!this.isVisible() || !this.getSetting('closable')) {
      return;
    }

    this.hot.runHooks('beforeDialogHide');

    this.#ui.hideDialog(this.getSetting('animation'));
    this.hot.getShortcutManager().setActiveContextName('grid');
    this.#isVisible = false;

    this.hot.runHooks('afterDialogHide');
  }

  /**
   * Update the dialog configuration.
   *
   * @param {object} settings - The configuration to update the dialog with.
   */
  update(settings) {
    if (!this.enabled) {
      return;
    }

    this.updatePluginSettings(settings);

    this.#ui.updateDialog({
      isVisible: this.isVisible(),
      content: this.getSetting('content'),
      customClassName: this.getSetting('customClassName'),
      background: this.getSetting('background'),
      contentBackground: this.getSetting('contentBackground'),
      contentDirections: this.getSetting('contentDirections'),
      animation: this.getSetting('animation'),
    });
  }

  /**
   * Destroy dialog and reset plugin state.
   *
   * @private
   */
  #destroyDialog() {
    this.hide();
    this.#ui?.destroyDialog();
    this.#ui = null;
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#destroyDialog();

    super.destroy();
  }
}
