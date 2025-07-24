import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { removeClass, addClass, hasClass, fastInnerHTML } from '../../helpers/dom/element';
import { warn } from '../../helpers/console';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 340;
const DIALOG_CLASS_NAME = 'ht-dialog';

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
  static get DEFAULT_CONFIG() {
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
      content: val => typeof val === 'string' || (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement),
      customClassName: val => typeof val === 'string',
      background: val => ['solid', 'semi-transparent'].includes(val),
      contentBackground: val => typeof val === 'boolean',
      contentDirections: val => ['row', 'row-reverse', 'column', 'column-reverse'].includes(val),
      animation: val => typeof val === 'boolean',
      closable: val => typeof val === 'boolean',
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
   * Event handler for escape key to close dialog.
   *
   * @private
   * @type {Function|null}
   */
  #escapeHandler = null;

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

    this.currentConfig = { ...Dialog.DEFAULT_CONFIG };
    this.#updateDialogConfig(this.hot.getSettings()[PLUGIN_KEY]);
    this.#createDialogElements();

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.#destroyDialog();

    super.disablePlugin();
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
   * Check if the dialog is currently visible.
   *
   * @returns {boolean} True if the dialog is visible, false otherwise.
   */
  isVisible() {
    return this.#isVisible;
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

    this.#updateDialogConfig(config);

    this.hot.runHooks('beforeDialogShow', this.currentConfig);

    this.#updateDialogContent({
      content: this.currentConfig.content,
      contentDirections: this.currentConfig.contentDirections,
      contentBackground: this.currentConfig.contentBackground,
    });

    this.#attachEventListeners();
    this.#showDialog();

    this.hot.runHooks('afterDialogShow', this.currentConfig);
  }

  /**
   * Hide the currently open dialog.
   * Closes the dialog and cleans up event listeners.
   */
  hide() {
    if (!this.isVisible()) {
      return;
    }

    this.hot.runHooks('beforeDialogHide');

    this.#hideDialog();
    this.#detachEventListeners();

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

    const oldConfig = {
      customClassName: this.currentConfig.customClassName,
      background: this.currentConfig.background,
    };

    this.#updateDialogConfig(config);

    // Update custom class name if changed
    if (config.customClassName !== undefined &&
      config.customClassName !== oldConfig.customClassName) {
      this.#updateDialogClassName(oldConfig.customClassName, config.customClassName);
    }

    // Update background class if changed
    if (config.background !== undefined &&
      config.background !== oldConfig.background) {
      this.#updateDialogClassName(
        `${DIALOG_CLASS_NAME}--${oldConfig.background}`,
        `${DIALOG_CLASS_NAME}--${config.background}`,
      );
    }

    // Update content if provided
    if (config.content !== undefined ||
      config.contentDirections !== undefined ||
      config.contentBackground !== undefined) {
      this.#updateDialogContent({
        content: this.currentConfig.content,
        contentDirections: this.currentConfig.contentDirections,
        contentBackground: this.currentConfig.contentBackground,
      });
    }
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
    this.dialogElement.className = this.#buildDialogClassName();

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
   * Build the complete class name for the dialog element.
   *
   * @private
   * @returns {string} The complete class name string.
   */
  #buildDialogClassName() {
    const baseClass = DIALOG_CLASS_NAME;
    const customClass = this.currentConfig.customClassName ? ` ${this.currentConfig.customClassName}` : '';
    const backgroundClass = ` ${DIALOG_CLASS_NAME}--${this.currentConfig.background}-background`;

    return `${baseClass}${customClass}${backgroundClass}`;
  }

  /**
   * Update dialog custom class name.
   *
   * @param {string} oldClassName - The old custom class name to remove.
   * @param {string} newClassName - The new custom class name to add.
   * @private
   */
  #updateDialogClassName(oldClassName, newClassName) {
    if (oldClassName !== newClassName) {
      removeClass(this.dialogElement, oldClassName);
      addClass(this.dialogElement, newClassName);
    }
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
      addClass(this.dialogElement, `${DIALOG_CLASS_NAME}--with-animation`);
      // Triggers style and layout recalculation, so the display: flex is fully committed before adding
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
          removeClass(this.dialogElement, `${DIALOG_CLASS_NAME}--with-animation`);
        }
      }, { once: true });
    } else {
      this.dialogElement.style.display = 'none';
    }

    this.#isVisible = false;
  }

  /**
   * Attach event listeners to dialog elements.
   *
   * @private
   */
  #attachEventListeners() {
    if (!this.currentConfig.closable) {
      return;
    }

    // Create escape key handler
    this.#escapeHandler = (event) => {
      if (event.key === 'Escape') {
        this.hide();
      }
    };

    this.hot.rootDocument.addEventListener('keydown', this.#escapeHandler);
  }

  /**
   * Detach event listeners from dialog elements.
   *
   * @private
   */
  #detachEventListeners() {
    if (this.#escapeHandler) {
      this.hot.rootDocument.removeEventListener('keydown', this.#escapeHandler);
      this.#escapeHandler = null;
    }
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
    this.#escapeHandler = null;
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#destroyDialog();

    super.destroy();
  }
}
