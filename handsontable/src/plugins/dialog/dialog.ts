import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { DialogUI } from './ui';
import { isObject, isPlainObject } from '../../helpers/object';
import { isHTMLElement } from '../../helpers/dom/element';
import * as C from '../../i18n/constants';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 360;
const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

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
 * - `template`: The template to use for the dialog (default: `null`). The error will be thrown when
 * the template is provided together with the `content` option.
 *   - `type`: The type of the template ('confirm')
 *   - `title`: The title of the dialog
 *   - `description`: The description of the dialog (default: '')
 *   - `buttons`: The buttons to display in the dialog (default: [])
 *     - `text`: The text of the button
 *     - `type`: The type of the button ('primary' | 'secondary')
 *     - `callback`: The callback to trigger when the button is clicked
 * - `content`: The string or HTMLElement content to display in the dialog (default: '')
 * - `customClassName`: Custom class name to apply to the dialog (default: '')
 * - `background`: Dialog background variant 'solid' | 'semi-transparent' (default: 'solid')
 * - `contentBackground`: Whether to show content background (default: false)
 * - `animation`: Whether to enable animations (default: true)
 * - `closable`: Whether the dialog can be closed (default: false)
 * - `a11y`: Object with accessibility options (default object below)
 *   - `role`: The role of the dialog ('dialog' | 'alertdialog') (default: 'dialog')
 *   - `ariaLabel`: The label of the dialog (default: 'Dialog')
 *   - `ariaLabelledby`: The ID of the element that labels the dialog (default: '')
 *   - `ariaDescribedby`: The ID of the element that describes the dialog (default: ''),
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
 *   animation: false,
 *   closable: true,
 *   a11y: {
 *     role: 'dialog',
 *     ariaLabel: 'Dialog',
 *     ariaLabelledby: 'titleID',
 *     ariaDescribedby: 'descriptionID',
 *   }
 * }
 *
 * // Enable dialog plugin using prebuild templates
 * dialog: {
 *   template: {
 *     type: 'confirm',
 *     title: 'Confirm',
 *     description: 'This is a confirm',
 *     buttons: [
 *       {
 *         text: 'Ok',
 *         type: 'primary',
 *         callback: () => {
 *           console.log('Ok');
 *         }
 *       },
 *       {
 *         text: 'Cancel',
 *         type: 'secondary',
 *         callback: () => {
 *           console.log('Cancel');
 *         }
 *       },
 *     ],
 *   },
 * }
 *
 * // Access to dialog plugin instance:
 * const dialogPlugin = hot.getPlugin('dialog');
 *
 * // Show a dialog programmatically:
 * dialogPlugin.show({
 *    content: '<h2>Custom Dialog</h2><p>This is a custom dialog content.</p>',
 *    closable: true,
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
 * ```ts
 * hotSettings: Handsontable.GridSettings = {
 *   data: data,
 *   dialog: {
 *     customClassName: 'angular-dialog',
 *     closable: true
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
export class Dialog extends BasePlugin {
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
      template: null as object | null,
      content: '',
      customClassName: '',
      background: 'solid',
      contentBackground: false,
      animation: true,
      closable: false,
      a11y: {
        role: 'dialog',
        ariaLabel: 'Dialog',
        ariaLabelledby: '',
        ariaDescribedby: '',
      },
    };
  }

  /**
   * Returns validator functions for each plugin setting to verify their values are valid before applying them.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      template: (value: unknown) => isPlainObject(value) &&
        (typeof ['alert', 'confirm'].includes(String(value.type))) &&
        (typeof value.title === 'string') &&
        (typeof value?.description === 'undefined' || typeof value?.description === 'string') &&
        (typeof value?.buttons === 'undefined' ||
          Array.isArray(value?.buttons) && value.buttons.every((item: unknown) =>
            isPlainObject(item) &&
          typeof item.text === 'string' &&
          ['primary', 'secondary'].includes(String(item.type)) &&
          (typeof item.callback === 'undefined' || typeof item.callback === 'function')
          )),
      content: (value: unknown) => typeof value === 'string' ||
        isHTMLElement(value) ||
        (typeof DocumentFragment !== 'undefined' && value instanceof DocumentFragment),
      customClassName: (value: unknown) => typeof value === 'string',
      background: (value: unknown) => typeof value === 'string' && ['solid', 'semi-transparent'].includes(value),
      contentBackground: (value: unknown) => typeof value === 'boolean',
      animation: (value: unknown) => typeof value === 'boolean',
      closable: (value: unknown) => typeof value === 'boolean',
      a11y: (value: unknown) => isPlainObject(value) &&
        (typeof value?.role === 'undefined' ||
          typeof value?.role === 'string' && ['dialog', 'alertdialog'].includes(value.role)) &&
        (typeof value?.ariaLabel === 'undefined' || typeof value?.ariaLabel === 'string') &&
        (typeof value?.ariaLabelledby === 'undefined' || typeof value?.ariaLabelledby === 'string') &&
        (typeof value?.ariaDescribedby === 'undefined' || typeof value?.ariaDescribedby === 'string'),
    };
  }

  /**
   * UI instance of the dialog plugin.
   *
   * @type {DialogUI}
   */
  #ui: DialogUI | null = null;

  /**
   * Flag indicating if dialog is currently visible.
   *
   * @type {boolean}
   */
  #isVisible = false;

  /**
   * Keeps the selection state that will be restored after the dialog is closed.
   *
   * @type {SelectionState | null}
   */
  #selectionState: {
    ranges: CellRange[]; activeRange: CellRange | undefined; activeSelectionLayer: number;
    selectedByRowHeader: number[]; selectedByColumnHeader: number[]; disableHeadersHighlight: boolean;
  } | null = null;

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

    if (!this.#ui) {
      this.#ui = new DialogUI({
        overlayContainer: this.hot.rootOverlaysElement,
        sanitizer: this.hot.getSettings().sanitizer as ((html: string) => string | undefined) | undefined,
        isRtl: this.hot.isRtl(),
      });
    }

    this.#registerShortcuts();
    this.#registerFocusScope();

    // The dialog renders in the overlays layer (`ht-overlay`), a fixed internal element like the
    // grid — not a layout slot. The UI's `install` already appended its container into that element,
    // so there is nothing to register with the layout manager.

    this.addHook('afterViewRender', () => this.#onAfterViewRender());

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
    this.#unregisterShortcuts();
    this.#unregisterFocusScope();

    // The dialog owns its element in the overlays layer (no layout slot to remove from), so detach
    // it here and drop the UI; `enablePlugin` rebuilds it when the plugin is re-enabled.
    this.#ui?.destroyDialog();
    this.#ui = null;

    super.disablePlugin();
  }

  /**
   * Check if the dialog is currently visible.
   *
   * @returns {boolean} True if the dialog is visible, false otherwise.
   */
  isVisible(): boolean {
    return this.#isVisible;
  }

  /**
   * Show dialog with given configuration.
   * Displays the dialog with the specified content and options.
   *
   * @param {object} options Dialog configuration object containing content and display options.
   * @param {object} options.template The template to use for the dialog (default: `null`). The error will be thrown when
   * the template is provided together with the `content` option.
   * @param {'confirm'} options.template.type The type of the template ('confirm').
   * @param {string} options.template.title The title of the dialog.
   * @param {string} options.template.description The description of the dialog. Default: ''.
   * @param {object[]} options.template.buttons The buttons to display in the dialog. Default: [].
   * @param {string} options.template.buttons.text The text of the button.
   * @param {'primary' | 'secondary'} options.template.buttons.type The type of the button.
   * @param {function(MouseEvent)} options.template.buttons.callback The callback to trigger when the button is clicked.
   * @param {string|HTMLElement|DocumentFragment} options.content The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: ''
   * @param {string} options.customClassName Custom CSS class name to apply to the dialog container. Default: ''
   * @param {'solid'|'semi-transparent'} options.background Dialog background variant. Default: 'solid'.
   * @param {boolean} options.contentBackground Whether to show content background. Default: false.
   * @param {boolean} options.animation Whether to enable animations when showing/hiding the dialog. Default: true.
   * @param {boolean} options.closable Whether the dialog can be closed by user interaction. Default: false.
   * @param {object} options.a11y Object with accessibility options.
   * @param {string} options.a11y.role The role of the dialog. Default: 'dialog'.
   * @param {string} options.a11y.ariaLabel The label of the dialog. Default: 'Dialog'.
   * @param {string} options.a11y.ariaLabelledby The ID of the element that labels the dialog. Default: ''.
   * @param {string} options.a11y.ariaDescribedby The ID of the element that describes the dialog. Default: ''.
   */
  show(options: Record<string, unknown> = {}): void {
    if (!this.enabled) {
      return;
    }

    if (this.isVisible()) {
      this.update(options);

      return;
    }

    this.hot.runHooks('beforeDialogShow');
    this.update(options);

    this.#ui!.showDialog(this.getSetting<boolean>('animation'));

    this.#isVisible = true;

    this.hot.getFocusScopeManager().activateScope(PLUGIN_KEY);

    this.#selectionState = this.hot.selection.exportSelection();

    this.hot.deselectCell();
    this.hot.runHooks('afterDialogShow');
  }

  /**
   * Hide the currently open dialog.
   * Closes the dialog and restores the focus to the table.
   */
  hide(): void {
    if (!this.isVisible()) {
      return;
    }

    this.hot.runHooks('beforeDialogHide');

    this.#ui!.hideDialog(this.getSetting<boolean>('animation'));
    this.#isVisible = false;

    this.hot.getFocusScopeManager().deactivateScope(PLUGIN_KEY);

    if (this.#selectionState && this.#selectionState.ranges.length > 0 && this.#selectionState.activeRange) {
      const state = this.#selectionState;

      this.hot.selection.importSelection({
        ranges: state.ranges,
        activeRange: state.activeRange!,
        activeSelectionLayer: state.activeSelectionLayer,
        selectedByRowHeader: state.selectedByRowHeader,
        selectedByColumnHeader: state.selectedByColumnHeader,
        disableHeadersHighlight: state.disableHeadersHighlight,
      });
      this.hot.view.render();
      this.#selectionState = null;
    } else {
      this.hot.view.render();
      this.#selectionState = null;
    }

    this.hot.runHooks('afterDialogHide');
  }

  /**
   * Update the dialog configuration.
   *
   * @param {object} options Dialog configuration object containing content and display options.
   * @param {object} options.template The template to use for the dialog (default: `null`). The error will be thrown when
   * the template is provided together with the `content` option.
   * @param {'confirm'} options.template.type The type of the template ('confirm').
   * @param {string} options.template.title The title of the dialog.
   * @param {string} options.template.description The description of the dialog. Default: ''.
   * @param {object[]} options.template.buttons The buttons to display in the dialog. Default: [].
   * @param {string} options.template.buttons.text The text of the button.
   * @param {'primary' | 'secondary'} options.template.buttons.type The type of the button.
   * @param {function(MouseEvent)} options.template.buttons.callback The callback to trigger when the button is clicked.
   * @param {string|HTMLElement|DocumentFragment} options.content The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: ''
   * @param {string} options.customClassName Custom CSS class name to apply to the dialog container. Default: ''
   * @param {'solid'|'semi-transparent'} options.background Dialog background variant. Default: 'solid'.
   * @param {boolean} options.contentBackground Whether to show content background. Default: false.
   * @param {boolean} options.animation Whether to enable animations when showing/hiding the dialog. Default: true.
   * @param {boolean} options.closable Whether the dialog can be closed by user interaction. Default: false.
   * @param {object} options.a11y Object with accessibility options.
   * @param {string} options.a11y.role The role of the dialog. Default: 'dialog'.
   * @param {string} options.a11y.ariaLabel The label of the dialog. Default: 'Dialog'.
   * @param {string} options.a11y.ariaLabelledby The ID of the element that labels the dialog. Default: ''.
   * @param {string} options.a11y.ariaDescribedby The ID of the element that describes the dialog. Default: ''.
   */
  update(options: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }

    this.updatePluginSettings(options);

    const templateValue = this.getSetting('template');

    if (
      templateValue !== Dialog.DEFAULT_SETTINGS.template &&
      this.getSetting('content') !== Dialog.DEFAULT_SETTINGS.content
    ) {
      throwWithCause('The `template` option cannot be used together with the `content` option.');
    }

    if (templateValue) {
      const template = templateValue as { type: string; [key: string]: unknown };

      this.#ui!.useTemplate(template.type, {
        id: this.hot.guid,
        ...template,
      });
    } else {
      this.#ui!.useDefaultTemplate();
    }

    this.#ui!.updateDialog({
      isVisible: this.isVisible(),
      content: this.getSetting('content'),
      customClassName: this.getSetting('customClassName'),
      background: this.getSetting('background'),
      contentBackground: this.getSetting('contentBackground'),
      animation: this.getSetting('animation'),
      a11y: this.getSetting('a11y'),
    });
  }

  /**
   * Displays the alert dialog with the specified content.
   *
   * @param {string | { title: string, description: string }} message The message to display in the dialog.
   * Can be a string or an object with `title` and `description` properties.
   * @param {function(MouseEvent): void} [callback] The callback to trigger when the button is clicked.
   */
  showAlert(message?: string | Record<string, unknown>, callback?: (...args: unknown[]) => void): void {
    const {
      title = 'Alert',
      description,
    } = (isObject(message) ? message : { title: message }) as Record<string, unknown>;

    this.show({
      template: {
        type: 'confirm',
        title,
        description,
        buttons: [
          {
            text: this.hot.getTranslatedPhrase(C.OK),
            type: 'primary',
            callback: (...args: unknown[]) => callback?.(...args),
          }
        ],
      },
      contentBackground: false,
      background: 'solid',
      animation: true,
      closable: false,
    });
  }

  /**
   * Displays the confirm dialog with the specified content and options.
   *
   * @param {string | { title: string, description: string }} message The message to display in the dialog.
   * Can be a string or an object with `title` and `description` properties.
   * @param {function(MouseEvent): void} [onOk] The callback to trigger when the OK button is clicked.
   * @param {function(MouseEvent): void} [onCancel] The callback to trigger when the Cancel button is clicked.
   */
  showConfirm(
    message?: string | Record<string, unknown>,
    onOk?: (...args: unknown[]) => void, onCancel?: (...args: unknown[]) => void
  ): void {
    const {
      title = 'Confirm',
      description,
    } = (isObject(message) ? message : { title: message }) as Record<string, unknown>;

    this.show({
      template: {
        type: 'confirm',
        title,
        description,
        buttons: [
          {
            text: this.hot.getTranslatedPhrase(C.CANCEL),
            type: 'secondary',
            callback: (...args: unknown[]) => onCancel?.(...args),
          },
          {
            text: this.hot.getTranslatedPhrase(C.OK),
            type: 'primary',
            callback: (...args: unknown[]) => onOk?.(...args),
          },
        ],
      },
      contentBackground: true,
      background: 'semi-transparent',
      animation: true,
      closable: false,
    });
  }

  /**
   * Focus the dialog.
   */
  focus(): void {
    this.#ui!.focusDialog();
  }

  /**
   * Register shortcuts responsible for closing the dialog and navigating through the dialog.
   */
  #registerShortcuts() {
    const manager = this.hot.getShortcutManager();
    const pluginContext = manager.getContext(SHORTCUTS_CONTEXT_NAME) ??
      manager.addContext(SHORTCUTS_CONTEXT_NAME);

    pluginContext.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.hide();
      },
      runOnlyIf: () => this.#isVisible && Boolean(this.getSetting('closable')),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Shift', 'Tab'], ['Tab']],
      preventDefault: false,
      callback: (event: KeyboardEvent) => {
        this.hot._registerTimeout(() => {
          if (event.shiftKey) {
            this.hot.runHooks('dialogFocusPreviousElement');
          } else {
            this.hot.runHooks('dialogFocusNextElement');
          }
        });
      },
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts responsible for closing the dialog and navigating through the dialog.
   */
  #unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const pluginContext = shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME);

    pluginContext?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Registers the focus scope for the dialog plugin.
   */
  #registerFocusScope() {
    this.hot.getFocusScopeManager()
      .registerScope(PLUGIN_KEY, this.#ui!.getContainer(), {
        shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
        type: 'modal',
        runOnlyIf: () => this.isVisible(),
        onActivate: (focusSource: string) => {
          const isListening = this.hot.isListening();
          const focusableElements = this.#ui!.getFocusableElements();

          if (focusableElements.length > 0) {
            if (focusSource === 'tab_from_above') {
              focusableElements.at(0)?.focus();

            } else if (focusSource === 'tab_from_below') {
              focusableElements.at(-1)?.focus();
            }

          } else if (
            focusSource !== 'tab_from_above' &&
            focusSource !== 'tab_from_below' &&
            isListening &&
            !this.#ui!.getContainer().contains(this.hot.rootDocument.activeElement)
          ) {
            this.#ui!.getContainer().focus();
          }

          if (isListening) {
            this.hot.runHooks('afterDialogFocus', focusSource === 'unknown' ? 'show' : focusSource);
          }
        },
      });
  }

  /**
   * Unregisters the focus scope for the dialog plugin.
   */
  #unregisterFocusScope() {
    this.hot.getFocusScopeManager().unregisterScope(PLUGIN_KEY);
  }

  /**
   * Called after the rendering of the table is completed. It updates the width and
   * height of the dialog container to the same size as the table.
   */
  #onAfterViewRender() {
    const { view } = this.hot;
    const width = view.isHorizontallyScrollableByWindow()
      ? view.getTotalTableWidth() : view.getWorkspaceWidth();

    this.#ui!.updateWidth(width);
  }

  /**
   * Destroy dialog and reset plugin state.
   */
  destroy() {
    this.#ui?.destroyDialog();
    this.#ui = null;
    this.#isVisible = false;
    this.#selectionState = null;

    super.destroy();
  }
}
