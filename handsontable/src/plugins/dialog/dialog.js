import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { DialogUI } from './dialogUI';
import { installFocusDetector } from '../../utils/focusDetector';

export const PLUGIN_KEY = 'dialog';
export const PLUGIN_PRIORITY = 340;
const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

// Register dialog hooks
Hooks.getSingleton().register('beforeDialogShow');
Hooks.getSingleton().register('afterDialogShow');
Hooks.getSingleton().register('beforeDialogHide');
Hooks.getSingleton().register('afterDialogHide');
Hooks.getSingleton().register('dialogFocusPreviousElement');
Hooks.getSingleton().register('dialogFocusNextElement');
Hooks.getSingleton().register('afterDialogFocus');

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
 * - `content`: The string or HTMLElement content to display in the dialog (default: '')
 * - `customClassName`: Custom class name to apply to the dialog (default: '')
 * - `background`: Dialog background variant 'solid' | 'semi-transparent' (default: 'solid')
 * - `contentBackground`: Whether to show content background (default: false)
 * - `contentDirections`: Content layout direction 'row' | 'row-reverse' | 'column' | 'column-reverse' (default: 'row')
 * - `animation`: Whether to enable animations (default: true)
 * - `closable`: Whether the dialog can be closed (default: false)
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
        (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) ||
        (typeof DocumentFragment !== 'undefined' && value instanceof DocumentFragment),
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
   * @type {DialogUI}
   */
  #ui = null;

  /**
   * Flag indicating if dialog is currently visible.
   *
   * @type {boolean}
   */
  #isVisible = false;

  /**
   * Focus detector instance.
   *
   * @type {object}
   */
  #focusDetector = null;

  /**
   * Selected cell.
   *
   * @type {object}
   */
  #selectedCells = null;

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

    if (!this.#ui) {
      this.#ui = new DialogUI({
        rootElement: this.hot.rootGridElement,
      });

      this.#ui.addLocalHook('clickDialogElement', () => this.#onDialogClick());

      this.#focusDetector = installFocusDetector(this.hot, this.#ui.getDialogElement(), {
        onFocus: (from) => {
          this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
          this.hot.runHooks('afterDialogFocus', `tab_${from}`);
          this.#focusDetector.deactivate();
          this.hot.listen();
        }
      });
    }

    this.registerShortcuts();

    this.addHook('modifyFocusOnTabNavigation', from => this.#onFocusTabNavigation(from), 1);
    this.addHook('afterViewRender', () => this.#onAfterRender());

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
    this.unregisterShortcuts();

    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for closing the dialog and navigating through the dialog.
   *
   * @private
   */
  registerShortcuts() {
    const manager = this.hot.getShortcutManager();
    const pluginContext = manager.getContext(SHORTCUTS_CONTEXT_NAME) ??
      manager.addContext(SHORTCUTS_CONTEXT_NAME);

    pluginContext.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.hide();
      },
      runOnlyIf: () => this.#isVisible && this.getSetting('closable'),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Shift', 'Tab'], ['Tab']],
      preventDefault: false,
      callback: (event) => {
        this.hot._registerTimeout(() => {
          const { activeElement } = this.hot.rootDocument;

          if (!this.#ui.isInsideDialog(activeElement)) {
            this.#focusDetector.activate();
            this.hot.unlisten();

            return;
          }

          if (event.shiftKey) {
            this.hot.runHooks('dialogFocusPreviousElement');
          } else {
            this.hot.runHooks('dialogFocusNextElement');
          }
        }, 0);
      },
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts responsible for closing the dialog and navigating through the dialog.
   *
   * @private
   */
  unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const pluginContext = shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME);

    pluginContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
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
   * Displays the dialog with the specified content and options.
   *
   * @param {object} options Dialog configuration object containing content and display options.
   * @param {string|HTMLElement|DocumentFragment} options.content The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: ''
   * @param {string} options.customClassName Custom CSS class name to apply to the dialog container. Default: ''
   * @param {'solid'|'semi-transparent'} options.background Dialog background variant. Default: 'solid'.
   * @param {boolean} options.contentBackground Whether to show content background. Default: false.
   * @param {'row'|'row-reverse'|'column'|'column-reverse'} options.contentDirections Content layout direction. Default: 'row'.
   * @param {boolean} options.animation Whether to enable animations when showing/hiding the dialog. Default: true.
   * @param {boolean} options.closable Whether the dialog can be closed by user interaction. Default: false.
   */
  show(options = {}) {
    if (!this.enabled || this.isVisible()) {
      return;
    }

    this.hot.runHooks('beforeDialogShow');

    this.update(options);
    this.#ui.showDialog(this.getSetting('animation'));
    this.#isVisible = true;

    this.#selectedCells = this.hot.getSelected();

    this.hot.runHooks('afterDialogShow');

    const { activeElement } = this.hot.rootDocument;

    if (this.hot.rootWrapperElement.contains(activeElement) || this.hot.rootPortalElement.contains(activeElement)) {
      this.hot.unlisten();
      this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
      this.hot.listen();
      this.#focusDetector.deactivate();
      this.hot.runHooks('afterDialogFocus', 'show');
    }
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

    this.#ui.hideDialog(this.getSetting('animation'));
    this.hot.getShortcutManager().setActiveContextName('grid');
    this.#isVisible = false;

    if (this.#selectedCells) {
      this.hot.selectCells(this.#selectedCells);
      this.#selectedCells = null;
    } else {
      this.hot.selectCell(0, 0);
    }

    this.hot.runHooks('afterDialogHide');
  }

  /**
   * Update the dialog configuration.
   *
   * @param {object} options Dialog configuration object containing content and display options.
   * @param {string|HTMLElement|DocumentFragment} options.content The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: ''
   * @param {string} options.customClassName Custom CSS class name to apply to the dialog container. Default: ''
   * @param {'solid'|'semi-transparent'} options.background Dialog background variant. Default: 'solid'.
   * @param {boolean} options.contentBackground Whether to show content background. Default: false.
   * @param {'row'|'row-reverse'|'column'|'column-reverse'} options.contentDirections Content layout direction. Default: 'row'.
   * @param {boolean} options.animation Whether to enable animations when showing/hiding the dialog. Default: true.
   * @param {boolean} options.closable Whether the dialog can be closed by user interaction. Default: false.
   */
  update(options) {
    if (!this.enabled) {
      return;
    }

    this.updatePluginSettings(options);

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
   * Handle focus tab navigation event.
   *
   * @param {'from_above' | 'from_below'} from The direction from which the focus was modified.
   * @returns {boolean} Returns `false` to prevent the default focus behavior.
   */
  #onFocusTabNavigation(from) {
    if (this.isVisible() && from === 'from_above') {
      this.#focusDetector.focus(from);

      return false;
    }
  }

  /**
   * Handle dialog click event.
   *
   */
  #onDialogClick() {
    if (this.isVisible() && !this.hot.isListening()) {
      this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
      this.hot.runHooks('afterDialogFocus', 'click');
      this.hot.listen();
    }

    this.#focusDetector.deactivate();
  }

  /**
   * Called after the rendering of the table is completed. It updates the width of
   * the dialog container to the same size as the table.
   */
  #onAfterRender() {
    const { view, rootWrapperElement, rootWindow } = this.hot;
    const width = view.isHorizontallyScrollableByWindow()
      ? view.getTotalTableWidth() : view.getWorkspaceWidth();

    this.#ui.updateWidth(width);

    const dialogInfo = rootWrapperElement.querySelector('.hot-display-license-info');

    if (dialogInfo) {
      const height = dialogInfo.offsetHeight;
      const marginTop = parseFloat(rootWindow.getComputedStyle(dialogInfo).marginTop);

      this.#ui.updateHeight(height + marginTop);
    }
  }

  /**
   * Destroy dialog and reset plugin state.
   */
  #destroyDialog() {
    this.#ui?.destroyDialog();
    this.#ui = null;
    this.#isVisible = false;
    this.#focusDetector = null;
    this.#selectedCells = null;
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#destroyDialog();

    super.destroy();
  }
}
