import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { removeClass, addClass, hasClass } from '../../helpers/dom/element';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 55;

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
 * that overlay the table, providing a way to show forms, confirmations, or any other interactive content.
 *
 * In order to enable the dialog mechanism, {@link Options#dialog} option must be set to `true`.
 *
 * The plugin provides several configuration options to customize the dialog behavior and appearance:
 * - `content`: The HTML content to display in the dialog
 * - `variant`: Dialog variant ('modal' by default)
 * - `contentBackground`: Whether to show content background
 * - `contentDirections`: Content layout direction 'row' | 'row-reverse' | 'column' | 'column-reverse'
 * - `animation`: Whether to enable animations
 * - `closable`: Whether the dialog can be closed
 *
 * @example
 * ```js
 * // Enable dialog plugin with default options
 * dialog: true
 *
 * // Enable dialog plugin with custom configuration
 * dialog: {
 *   variant: 'modal',
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
 *   content: '<h2>Custom Dialog</h2><p>This is a custom dialog content.</p>',
 *   closable: true
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
      variant: 'modal',
      contentBackground: false,
      contentDirections: 'row',
      animation: true,
      closable: false,
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
  isVisible = false;

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

    this.currentConfig = { ...Dialog.DEFAULT_CONFIG, ...this.hot.getSettings()[PLUGIN_KEY] };

    this.addHook('afterInit', () => this.#onAfterInit());
    this.addHook('beforeDestroy', () => this.#onBeforeDestroy());

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.hide();
    this.destroyDialog();

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
   * Check if the dialog is visible.
   *
   * @returns {boolean}
   */
  isVisible() {
    return this.isVisible;
  }

  /**
   * Show dialog with given configuration.
   *
   * @param {object} config Dialog configuration
   */
  show(config = {}) {
    if (!this.isEnabled() || this.isVisible) {
      return;
    }

    this.hot.runHooks('beforeDialogShow', config);

    this.#updateDialogConfig(config);
    this.#updateDialogContent(this.currentConfig);
    this.#attachEventListeners();
    this.#showDialog();

    this.hot.runHooks('afterDialogShow', this.currentConfig);
  }

  /**
   * Hide the currently open dialog.
   */
  hide() {
    if (!this.isVisible) {
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
    if (!this.isEnabled()) {
      return;
    }

    this.#updateDialogConfig(config);
    this.#updateDialogContent(this.currentConfig);
  }

  /**
   * Create dialog DOM elements.
   *
   * @private
   */
  #createDialogElements() {
    // Create dialog
    this.dialogElement = this.hot.rootDocument.createElement('div');
    this.dialogElement.className = 'ht-dialog';

    // Create content wrapper
    const contentWrapperElement = this.hot.rootDocument.createElement('div');

    contentWrapperElement.className = 'ht-dialog__content-wrapper';

    // Create content
    this.contentElement = this.hot.rootDocument.createElement('div');
    this.contentElement.className = 'ht-dialog__content';

    // Append content wrapper to dialog
    contentWrapperElement.appendChild(this.contentElement);

    // Append elements to dialog
    this.dialogElement.appendChild(contentWrapperElement);

    // Append dialog to rootWrapperElement
    const rootWrapperElement = this.hot.rootWrapperElement;

    rootWrapperElement.appendChild(this.dialogElement);
  }

  /**
   * Update dialog configuration.
   *
   * @param {object} config - The configuration to update the dialog with.
   * @private
   */
  #updateDialogConfig(config) {
    Object.keys(config).forEach((key) => {
      if (key in this.currentConfig) {
        this.currentConfig[key] = config[key];
      }
    });
  }

  /**
   * Update dialog content.
   *
   * @param {string} content - The content to render in the dialog.
   * @private
   */
  #updateDialogContent({ content, contentDirections = 'row' }) {
    this.contentElement.innerHTML = content;

    removeClass(this.contentElement, /ht-dialog__content--flex-.*/g);
    addClass(this.contentElement, `ht-dialog__content--flex-${contentDirections}`);
  }

  /**
   * Show dialog elements.
   *
   * @private
   */
  #showDialog() {
    this.dialogElement.style.display = 'block';

    if (this.currentConfig.animation) {
      addClass(this.dialogElement, 'ht-dialog--with-animation');
      // Triggers style and layout recalculation, so the display: flex is fully committed before adding
      // the class ht-dialog--show.
      // eslint-disable-next-line no-unused-expressions
      this.dialogElement.offsetHeight;
    }

    addClass(this.dialogElement, 'ht-dialog--show');
    this.isVisible = true;
  }

  /**
   * Hide dialog elements.
   *
   * @private
   */
  #hideDialog() {
    removeClass(this.dialogElement, 'ht-dialog--show');

    if (this.currentConfig.animation) {
      this.dialogElement.addEventListener('transitionend', () => {
        if (!hasClass(this.dialogElement, 'ht-dialog--show')) {
          this.dialogElement.style.display = 'none';
          removeClass(this.dialogElement, 'ht-dialog--with-animation');
        }
      }, { once: true });
    } else {
      this.dialogElement.style.display = 'none';
    }

    this.isVisible = false;
  }

  /**
   * Attach event listeners to dialog elements.
   *
   * @private
   */
  #attachEventListeners() {
    // Escape key handler
    if (!this.currentConfig.closable) {
      return;
    }

    // Escape key handler
    const escapeHandler = (event) => {
      if (event.key === 'Escape') {
        this.hide();
      }
    };

    this.hot.rootDocument.addEventListener('keydown', escapeHandler);
    this.escapeHandler = escapeHandler;
  }

  /**
   * Detach event listeners from dialog elements.
   *
   * @private
   */
  #detachEventListeners() {
    if (this.escapeHandler) {
      this.hot.rootDocument.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
  }

  /**
   * Destroy dialog DOM elements and reset plugin state.
   *
   * @private
   */
  #destroyDialog() {
    if (this.dialogElement && this.dialogElement.parentNode) {
      this.dialogElement.parentNode.removeChild(this.dialogElement);
    }

    this.dialogElement = null;
    this.contentElement = null;
    this.currentConfig = null;
    this.isVisible = false;
  }

  /**
   * Hook fired after Handsontable initialization.
   *
   * @private
   */
  #onAfterInit() {
    this.#createDialogElements();
  }

  /**
   * Hook fired before Handsontable destruction.
   *
   * @private
   */
  #onBeforeDestroy() {
    this.hide();
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#destroyDialog();

    super.destroy();
  }
}
