import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { warn } from '../../helpers/console';
import { DialogUI } from './ui';
import { isObject, isPlainObject } from '../../helpers/object';
import { isHTMLElement, isDocumentFragment } from '../../helpers/dom/element';
import { isButtonType } from '../../helpers/uiButton';
import { getSanitizer } from '../../utils/sanitizer';
import { isRootInstance } from '../../utils/rootInstance';
import * as C from '../../i18n/constants';
import type { SelectionState } from '../../selection/types';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 360;
const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

/**
 * @plugin Dialog
 * @class Dialog
 *
 * @description
 * The dialog plugin provides a modal dialog system for Handsontable DataGrid. It allows you to display custom content in modal dialogs
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
 * The options above, set through the `dialog` option, apply to every dialog. The options you pass to `show()`
 * and `update()` apply on top of them to one dialog only, until it hides. Calling `updateSettings()` with new
 * `dialog` options updates a visible dialog in place, without hiding it.
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
          isButtonType(item.type) &&
          (typeof item.callback === 'undefined' || typeof item.callback === 'function')
          )),
      content: (value: unknown) => typeof value === 'string' ||
        isHTMLElement(value) ||
        // Realm-safe: a grid inside an iframe builds its nodes from the iframe's document.
        isDocumentFragment(value),
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
  #selectionState: SelectionState | null = null;

  /**
   * The valid options the `dialog` setting configured, merged across settings updates. Every dialog
   * starts from them.
   *
   * @type {object}
   */
  #configuredOptions: Record<string, unknown> = {};

  /**
   * The valid options of the dialog being described now: the options of `show()` merged with every
   * `update()` made before the dialog hides. Hiding the dialog clears them, so no option of one dialog
   * reaches the next one.
   *
   * @type {object}
   */
  #dialogOptions: Record<string, unknown> = {};

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * The dialog renders into the `ht-overlay` element and registers a modal focus scope, and both
   * belong to the main Handsontable instance. In a nested grid (the one the `handsontable`,
   * `autocomplete`, and `dropdown` cell types create) neither exists, so the plugin stays disabled
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

    if (!this.#ui) {
      this.#ui = new DialogUI({
        overlayContainer: this.hot.rootOverlaysElement,
        sanitizer: getSanitizer(this.hot),
        warnScope: this.hot.rootElement,
        isRtl: this.hot.isRtl(),
      });
    }

    this.#registerShortcuts();
    this.#registerFocusScope();

    // The dialog renders in the overlays layer (`ht-overlay`), a fixed internal element like the
    // grid — not a layout slot. The UI's `install` already appended its container into that element,
    // so there is nothing to register with the layout manager.

    this.addHook('afterViewRender', () => this.#onAfterViewRender());
    this.addHook('beforeLoadData', this.#onBeforeLoadData);

    super.enablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update. The plugin stays enabled, so a dialog on
   * screen stays there and shows the new `dialog` options under the options it was shown with, and no
   * `beforeDialogHide` or `afterDialogHide` fires for it. Turning the option off goes through
   * `disablePlugin()` instead, which hides the dialog.
   */
  updatePlugin() {
    if (this.isVisible()) {
      this.update({});
    }

    super.updatePlugin();
  }

  /**
   * Updates the options the `dialog` setting configured. A plain object merges into the options
   * configured before, any other value resets them to the defaults. The options of a dialog on screen
   * stay applied on top of them.
   *
   * @private
   * @param {*} newSettings The value of the `dialog` setting.
   * @returns {*} The plugin settings now in force.
   */
  updatePluginSettings(newSettings: unknown) {
    this.#configuredOptions = isPlainObject(newSettings)
      ? { ...this.#configuredOptions, ...this.#pickValidOptions(newSettings) }
      : {};

    return this.#composeSettings();
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
   * Takes the selection the grid shows now as the one to restore when the dialog hides, and clears it
   * from the grid while the dialog stays open. The sheets bar calls it after a switch made under an
   * open dialog: the selection stashed when the dialog opened belongs to the sheet that was left, and
   * restoring it put that sheet's cells onto the arriving one.
   *
   * @private
   */
  _adoptViewSelection(): void {
    if (!this.isVisible()) {
      return;
    }

    this.#selectionState = this.hot.selection.exportSelection();
    this.hot.deselectCell();
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

    this.#dialogOptions = {};
    this.#composeSettings();

    if (this.#selectionState && this.#selectionState.ranges.length > 0 && this.#selectionState.activeRange) {
      const state = this.#selectionState;

      // Spread rather than enumerated: the exported state carries the grid-span flags that tell the
      // next trim to clamp a full-column or select-all extent instead of dropping it, and a
      // hand-written field list silently leaves them behind.
      this.hot.selection.importSelection({
        ...state,
        activeRange: state.activeRange!,
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

    const dialogOptions = { ...this.#dialogOptions, ...this.#pickValidOptions(options) };
    const described = { ...Dialog.DEFAULT_SETTINGS, ...this.#describeDialog(dialogOptions) };

    if (
      described.template !== Dialog.DEFAULT_SETTINGS.template &&
      described.content !== Dialog.DEFAULT_SETTINGS.content
    ) {
      throwWithCause('The `template` option cannot be used together with the `content` option.');
    }

    if (described.template) {
      const template = described.template as { type: string; [key: string]: unknown };

      // `id` is assigned AFTER the spread on purpose. The template interpolates it into the `id`
      // attribute of its title and description elements, so a caller-supplied `template.id`
      // carrying a quote used to break out of that attribute. A benign custom value was no good
      // either: two grids configured with the same one emitted duplicate element ids into a single
      // document. The grid's own GUID always wins, and it cannot collide.
      this.#ui!.useTemplate(template.type, {
        ...template,
        id: this.hot.guid,
      });
    } else {
      this.#ui!.useDefaultTemplate();
    }

    this.#dialogOptions = dialogOptions;
    this.#composeSettings();

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
   * @param {function(MouseEvent): void} [callback] The callback to trigger when the button is clicked. The dialog stays
   * open until you call {@link Dialog#hide}, usually from this callback.
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
   * The dialog stays open until you call {@link Dialog#hide}, usually from these callbacks.
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
              focusableElements[0]?.focus();

            } else if (focusSource === 'tab_from_below') {
              focusableElements[focusableElements.length - 1]?.focus();

            } else if (focusSource === 'unknown' && isListening) {
              // `show()` activates the scope without a source, so it arrives as `unknown`. Without
              // this branch a template that reports focusable elements (`confirm`) left the focus
              // on the grid behind the open modal - the fallback below is unreachable here.
              //
              // Matched on `unknown` rather than written as a bare `else`, which would also catch
              // `click`. A click on a NON-focusable part of the dialog (its title, say) sends no
              // focus event of its own, so with the scope deactivated - the user clicked outside
              // the open modal first - it reaches here as `click` and would move the focus the user
              // did not ask to move. A click on a focusable element never gets this far: its own
              // focus event activates the scope first, and `activateScope` then returns early.
              focusableElements[0]?.focus();
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
   *
   * Nothing was registered on a non-root instance, where the plugin never enables and the
   * `FocusScopeManager` does not exist, so a direct `disablePlugin()` call there must not reach it.
   */
  #unregisterFocusScope() {
    if (!isRootInstance(this.hot)) {
      return;
    }

    this.hot.getFocusScopeManager().unregisterScope(PLUGIN_KEY);
  }

  /**
   * Returns the keys of `options` that pass `SETTINGS_VALIDATORS`, and warns about each key that does not.
   *
   * @param {*} options The options to read.
   * @returns {object}
   */
  #pickValidOptions(options: unknown): Record<string, unknown> {
    const validOptions: Record<string, unknown> = {};

    if (!isPlainObject(options)) {
      return validOptions;
    }

    const validators: Record<string, (value: unknown) => boolean> = Dialog.SETTINGS_VALIDATORS;

    Object.keys(validators).forEach((key) => {
      if (!(key in options)) {
        return;
      }

      if (validators[key](options[key]) === false) {
        warn(`${this.pluginName} Plugin: "${key}" option is not valid and it will be ignored.`);

        return;
      }

      validOptions[key] = options[key];
    });

    return validOptions;
  }

  /**
   * Stores the options of the dialog being described now over the configured ones as the plugin settings,
   * starting from the defaults, so an option neither of them names reads its default value.
   *
   * @returns {*} The plugin settings now in force.
   */
  #composeSettings() {
    super.updatePluginSettings(null);

    return super.updatePluginSettings(this.#describeDialog(this.#dialogOptions));
  }

  /**
   * Returns the options of one dialog: its own options over the configured ones. A dialog that names
   * `content` and no `template` is a content dialog, so a configured `template` does not reach it, and a
   * dialog that names `template` and no `content` does not get a configured `content`. A dialog that names
   * both, or a setting that configures both, keeps both, and `update()` throws for it.
   *
   * @param {object} dialogOptions The dialog's own options.
   * @returns {object}
   */
  #describeDialog(dialogOptions: Record<string, unknown>): Record<string, unknown> {
    const configuredOptions = { ...this.#configuredOptions };
    const namesContent = 'content' in dialogOptions;
    const namesTemplate = 'template' in dialogOptions;

    if (namesContent && !namesTemplate) {
      delete configuredOptions.template;
    }

    if (namesTemplate && !namesContent) {
      delete configuredOptions.content;
    }

    return { ...configuredOptions, ...dialogOptions };
  }

  /**
   * Forgets the selection stashed for the hide when `loadData()` replaces the data. The stashed coordinates
   * address the replaced rows, so restoring them put a selection on unrelated cells of the new data, or past
   * its end. The hide then leaves the selection alone. A grid with an external data source keeps the stash:
   * its loads bring another page or order of the same records. `updateData()` keeps the dataset's state by
   * design, so it keeps the stash too.
   */
  #onBeforeLoadData = () => {
    if (this.hot.runHooks('hasExternalDataSource') === true) {
      return;
    }

    this.#selectionState = null;
  };

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
    this.#configuredOptions = {};
    this.#dialogOptions = {};

    super.destroy();
  }
}
