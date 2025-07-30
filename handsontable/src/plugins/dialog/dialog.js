import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { removeClass, addClass, hasClass, fastInnerHTML, setAttribute } from '../../helpers/dom/element';
import { warn } from '../../helpers/console';
import { A11Y_DIALOG, A11Y_MODAL } from '../../helpers/a11y';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 340;
const DIALOG_CLASS_NAME = 'ht-dialog';
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

  /**
   * Dialog default configuration.
   *
   * @returns {object}
   */
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

  /**
   * Validators for dialog configuration options.
   *
   * @private
   * @type {object}
   */
  static get DIALOG_CONFIG_VALIDATORS() {
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
   * Instance of the dialog element.
   *
   * @private
   * @type {HTMLElement}
   */
  dialogElement = null;

  /**
   * Instance of the content element.
   *
   * @private
   * @type {HTMLElement}
   */
  contentElement = null;

  /**
   * Current dialog configuration.
   *
   * @private
   * @type {object}
   */
  currentConfig = null;

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

    this.currentConfig = { ...Dialog.DEFAULT_SETTINGS };
    this.#updateDialogConfig(this.hot.getSettings()[PLUGIN_KEY]);
    this.#createDialogElements();
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
      runOnlyIf: () => this.#isVisible && this.currentConfig.closable,
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
   * @param {object} config Dialog configuration object containing content and display options.
   */
  show(config = {}) {
    if (!this.enabled || this.isVisible()) {
      return;
    }

    this.hot.runHooks('beforeDialogShow', this.currentConfig);

    this.update(config);
    this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
    this.#showDialog();

    this.hot.runHooks('afterDialogShow', this.currentConfig);
  }

  /**
   * Hide the currently open dialog.
   * Closes the dialog and cleans up event listeners.
   */
  hide() {
    if (!this.isVisible() || !this.currentConfig.closable) {
      return;
    }

    this.hot.runHooks('beforeDialogHide');

    this.#hideDialog();
    this.hot.getShortcutManager().setActiveContextName('grid');

    this.hot.runHooks('afterDialogHide');
  }

  /**
   * Update the dialog configuration.
   *
   * @param {object} config - The configuration to update the dialog with.
   */
  update(config) {
    if (!this.enabled) {
      return;
    }

    this.#updateDialogConfig(config);
    this.#updateDialogClassName();

    // Update content
    this.#updateDialogContent({
      content: this.currentConfig.content,
      contentDirections: this.currentConfig.contentDirections,
      contentBackground: this.currentConfig.contentBackground,
    });
  }

  /**
   * Create dialog DOM elements.
   * Builds the dialog structure and appends it to the Handsontable root wrapper.
   *
   * @private
   */
  #createDialogElements() {
    // Create main dialog container
    this.dialogElement = this.hot.rootDocument.createElement('div');
    this.#updateDialogClassName();

    // Set ARIA attributes
    setAttribute(this.dialogElement, [
      A11Y_DIALOG(),
      A11Y_MODAL(),
    ]);

    // Create content wrapper
    const contentWrapperElement = this.hot.rootDocument.createElement('div');

    contentWrapperElement.className = `${DIALOG_CLASS_NAME}__content-wrapper`;

    // Create content container
    this.contentElement = this.hot.rootDocument.createElement('div');

    this.contentElement.className = `${DIALOG_CLASS_NAME}__content`;

    // Assemble dialog structure
    contentWrapperElement.appendChild(this.contentElement);
    this.dialogElement.appendChild(contentWrapperElement);

    // Append to Handsontable root wrapper
    this.hot.rootWrapperElement.appendChild(this.dialogElement);
  }

  /**
   * Update dialog configuration with validation.
   *
   * @param {object} config - The configuration to update the dialog with.
   * @private
   */
  #updateDialogConfig(config) {
    if (!config || typeof config !== 'object') {
      return;
    }

    Object.keys(config).forEach((key) => {
      if (!(key in this.currentConfig)) {
        return;
      }

      const validator = Dialog.DIALOG_CONFIG_VALIDATORS[key];
      const isValid = validator ? validator(config[key]) : true;

      if (isValid === false) {
        warn(`Dialog: "${key}" option is not valid and it will be ignored.`);

        return;
      }

      this.currentConfig[key] = config[key];
    });
  }

  /**
   * Update dialog class name.
   *
   * @private
   */
  #updateDialogClassName() {
    const customClass = this.currentConfig.customClassName ? ` ${this.currentConfig.customClassName}` : '';
    const backgroundClass = ` ${DIALOG_CLASS_NAME}--background-${this.currentConfig.background}`;
    const animationClass = this.currentConfig.animation ? ` ${DIALOG_CLASS_NAME}--animation` : '';
    const showClass = this.isVisible() ? ` ${DIALOG_CLASS_NAME}--show` : '';

    this.dialogElement.className = `${DIALOG_CLASS_NAME}${customClass}${backgroundClass}${animationClass}${showClass}`;
  }

  /**
   * Update dialog content and styling.
   *
   * @param {object} options - Content update options.
   * @param {string|HTMLElement} options.content - The content to render in the dialog.
   * @param {string} options.contentDirections - The flex direction for content layout.
   * @param {boolean} options.contentBackground - Whether to show content background.
   * @private
   */
  #updateDialogContent({ content, contentDirections, contentBackground }) {
    // Clear existing content
    this.contentElement.innerHTML = '';

    // Render new content
    if (typeof content === 'string') {
      fastInnerHTML(this.contentElement, content);
    } else if (content instanceof HTMLElement) {
      this.contentElement.appendChild(content);
    }

    // Update content background styling
    if (contentBackground) {
      addClass(this.contentElement, `${DIALOG_CLASS_NAME}__content--background`);
    } else {
      removeClass(this.contentElement, `${DIALOG_CLASS_NAME}__content--background`);
    }

    // Update content direction styling
    removeClass(this.contentElement, new RegExp(`${DIALOG_CLASS_NAME}__content--flex-.*`, 'g'));
    addClass(this.contentElement, `${DIALOG_CLASS_NAME}__content--flex-${contentDirections}`);
  }

  /**
   * Show dialog elements with optional animation.
   *
   * @private
   */
  #showDialog() {
    this.dialogElement.style.display = 'block';

    if (this.currentConfig.animation) {
      // Triggers style and layout recalculation, so the display: block is fully committed before adding
      // the class ht-dialog--show.
      // eslint-disable-next-line no-unused-expressions
      this.dialogElement.offsetHeight;
    }

    addClass(this.dialogElement, `${DIALOG_CLASS_NAME}--show`);

    this.#isVisible = true;
  }

  /**
   * Hide dialog elements with optional animation.
   *
   * @private
   */
  #hideDialog() {
    removeClass(this.dialogElement, `${DIALOG_CLASS_NAME}--show`);

    if (this.currentConfig.animation) {
      this.dialogElement.addEventListener('transitionend', () => {
        if (!hasClass(this.dialogElement, `${DIALOG_CLASS_NAME}--show`)) {
          this.dialogElement.style.display = 'none';
        }
      }, { once: true });
    } else {
      this.dialogElement.style.display = 'none';
    }

    this.#isVisible = false;
  }

  /**
   * Destroy dialog DOM elements and reset plugin state.
   *
   * @private
   */
  #destroyDialog() {
    if (this.isVisible()) {
      this.hide();
    }

    if (this.dialogElement && this.dialogElement.parentNode) {
      this.dialogElement.parentNode.removeChild(this.dialogElement);
    }

    this.dialogElement = null;
    this.contentElement = null;
    this.currentConfig = null;
    this.#isVisible = false;
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#destroyDialog();

    super.destroy();
  }
}
