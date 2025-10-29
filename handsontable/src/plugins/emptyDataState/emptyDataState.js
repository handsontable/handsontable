import { BasePlugin } from '../base';
import { EmptyDataStateUI } from './ui';
import { isObject } from '../../helpers/object';
import * as C from '../../i18n/constants';

export const PLUGIN_KEY = 'emptyDataState';
export const PLUGIN_PRIORITY = 370;
export const EMPTY_DATA_STATE_CLASS_NAME = `ht-${PLUGIN_KEY}`;
const SOURCE = Object.freeze({
  UNKNOWN: 'unknown',
  FILTERS: 'filters',
});
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

/**
 * @plugin EmptyDataState
 * @class EmptyDataState
 *
 * @description
 * The empty data state plugin provides a empty data state overlay system for Handsontable.
 * It displays a empty data state overlay with customizable message.
 *
 * In order to enable the empty data state mechanism, {@link Options#emptyDataState} option must be set to `true`.
 *
 * The plugin provides several configuration options to customize the empty data state behavior and appearance:
 * - `message`: Message to display in the empty data state overlay.
 *   - `title`: Title to display in the empty data state overlay.
 *   - `description`: Description to display in the empty data state overlay.
 *   - `buttons`: Buttons to display in the empty data state overlay.
 *     - `text`: Text to display in the button.
 *     - `type`: Type of the button.
 *     - `callback`: Callback function to call when the button is clicked.
 *
 * @example
 * ::: only-for javascript
 * ```javascript
 * // Enable empty data state plugin with default messages
 * emptyDataState: true,
 *
 * // Enable empty data state plugin with custom message
 * emptyDataState: {
 *   message: 'No data available',
 * },
 *
 * // Enable empty data state plugin with custom message and buttons for any source
 * emptyDataState: {
 *   message: {
 *     title: 'No data available',
 *     description: 'There’s nothing to display yet.',
 *     buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *   },
 * },
 *
 * // Enable empty data state plugin with custom message and buttons for specific source
 * emptyDataState: {
 *   message: (source) => {
 *     switch (source) {
 *       case "filters":
 *         return {
 *           title: 'No data available',
 *           description: 'There’s nothing to display yet.',
 *           buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *         };
 *       default:
 *         return {
 *           title: 'No data available',
 *           description: 'There’s nothing to display yet.',
 *         };
 *     }
 *   },
 * },
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * // Enable empty data state plugin with default messages
 * <HotTable emptyDataState={true} />;
 *
 * // Enable empty data state plugin with custom message
 * <HotTable emptyDataState={{ message: 'No data available' }} />;
 *
 * // Enable empty data state plugin with custom message and buttons for any source
 * <HotTable emptyDataState={{
 *   message: {
 *     title: 'No data available',
 *     description: 'There’s nothing to display yet.',
 *     buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *   }
 * }} />;
 *
 * // Enable empty data state plugin with custom message and buttons for specific source
 * <HotTable emptyDataState={{
 *   message: (source) => {
 *     switch (source) {
 *       case "filters":
 *         return {
 *           title: 'No data available',
 *           description: 'There’s nothing to display yet.',
 *           buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *         };
 *       default:
 *         return {
 *           title: 'No data available',
 *           description: 'There’s nothing to display yet.',
 *         };
 *     }
 *   }
 * }} />;
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * // Enable empty data state plugin with default messages
 * hotSettings: Handsontable.GridSettings = {
 *   emptyDataState: true
 * }
 *
 * // Enable empty data state plugin with custom message
 * hotSettings: Handsontable.GridSettings = {
 *   emptyDataState: {
 *     message: 'No data available'
 *   }
 * }
 *
 * // Enable empty data state plugin with custom message and buttons for any source
 * hotSettings: Handsontable.GridSettings = {
 *   emptyDataState: {
 *     message: {
 *       title: 'No data available',
 *       description: 'There’s nothing to display yet.',
 *       buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *     },
 *   },
 * },
 *
 * // Enable empty data state plugin with custom message and buttons for specific source
 * hotSettings: Handsontable.GridSettings = {
 *   emptyDataState: {
 *     message: (source) => {
 *       switch (source) {
 *         case "filters":
 *           return {
 *             title: 'No data available for filters',
 *             description: 'There’s nothing to display yet.',
 *             buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *           };
 *         default:
 *           return {
 *             title: 'No data available',
 *             description: 'There’s nothing to display yet.',
 *           };
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ```html
 * <hot-table [settings]="hotSettings"></hot-table>
 * ```
 * :::
 */

export class EmptyDataState extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      message: undefined,
    };
  }

  static get SETTINGS_VALIDATORS() {
    return {
      message: value => typeof value === 'string' ||
        typeof value === 'function' ||
        isObject(value) &&
        (typeof value?.title === 'undefined' || typeof value?.title === 'string') &&
        (typeof value?.description === 'undefined' || typeof value?.description === 'string') &&
        (typeof value?.buttons === 'undefined' || Array.isArray(value?.buttons) && value?.buttons.every(item =>
          typeof item === 'object' &&
          typeof item.text === 'string' &&
          (typeof item.type === 'string' && ['primary', 'secondary'].includes(item.type)) &&
          typeof item.callback === 'function'
        )) ||
        value === undefined,
    };
  }

  /**
   * Flag indicating if emptyDataState is currently visible.
   *
   * @type {boolean}
   */
  #isVisible = false;

  /**
   * UI instance of the emptyDataState plugin.
   *
   * @type {EmptyDataStateUI}
   */
  #ui = null;

  /**
   * MutationObserver instance for monitoring DOM changes.
   *
   * @type {MutationObserver}
   */
  #observer = null;

  /**
   * Flag indicating if there are filter conditions.
   *
   * @type {number}
   */
  #hasFilterConditions = false;

  /**
   * Flag indicating if the content should be updated.
   *
   * @type {boolean}
   */
  #shouldUpdate = false;

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
      this.#ui = new EmptyDataStateUI({
        rootElement: this.hot.rootGridElement,
        rootDocument: this.hot.rootDocument,
      });

      this.#shouldUpdate = true;

      this.#registerFocusScope();
      this.#registerEvents();
      this.#registerObservers();
    }

    this.addHook('afterInit', () => this.#onAfterInit());
    this.addHook('afterRender', () => this.#onAfterRender());
    this.addHook('afterRowSequenceCacheUpdate', () => this.#toggleEmptyDataState());
    this.addHook('afterColumnSequenceCacheUpdate', () => this.#toggleEmptyDataState());
    this.addHook('beforeFilter', conditions => this.#onBeforeFilter(conditions));

    super.enablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.#toggleEmptyDataState();

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.#unregisterFocusScope();
    this.#disconnectObservers();

    this.#ui.destroy();
    this.#ui = null;

    super.disablePlugin();
  }

  /**
   * Check if the plugin is currently visible.
   *
   * @returns {boolean}
   */
  isVisible() {
    return this.#isVisible;
  }

  /**
   * Registers the DOM listeners.
   */
  #registerEvents() {
    if (!this.#ui.getElement()) {
      return;
    }

    this.eventManager.addEventListener(this.#ui.getElement(), 'wheel', event => this.#onMouseWheel(event));
  }

  /**
   * Registers the mutation observers for the emptyDataState plugin.
   */
  #registerObservers() {
    if (!this.#ui.getElement() || this.#observer) {
      return;
    }

    // Observe the root element for changes and move the emptyDataState element to the correct position
    this.#observer = new MutationObserver(() => {
      if (!this.hot) {
        return;
      }

      const element = this.#ui.getElement();

      if (this.hot.rootGridElement.nextElementSibling !== element) {
        this.hot.rootGridElement.after(element);
      }
    });

    this.#observer.observe(this.hot.rootWrapperElement, {
      childList: true,
    });
  }

  /**
   * Disconnects the mutation observers for the emptyDataState plugin.
   */
  #disconnectObservers() {
    this.#observer.disconnect();
  }

  /**
   * Handles the mouse wheel event.
   *
   * @param {WheelEvent} event - The wheel event.
   */
  #onMouseWheel(event) {
    const deltaX = Number.isNaN(event.deltaX) ? (-1) * event.wheelDeltaX : event.deltaX;

    if (deltaX !== 0 && this.hot.view.hasHorizontalScroll() && !this.hot.view.isHorizontallyScrollableByWindow()) {
      this.hot.view.setTableScrollPosition({ left: this.hot.view.getTableScrollPosition().left + deltaX });

      event.preventDefault();
    }
  }

  /**
   * Registers the focus scope for the empty data state plugin.
   */
  #registerFocusScope() {
    this.hot.getFocusScopeManager()
      .registerScope(PLUGIN_KEY, this.#ui.getElement(), {
        shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
        runOnlyIf: () => this.isVisible(),
        onActivate: (focusSource) => {
          const focusableElements = this.#ui?.getFocusableElements();

          if (focusableElements.length > 0) {
            if (focusSource === 'tab_from_above') {
              focusableElements.at(0).focus();
            } else if (focusSource === 'tab_from_below') {
              focusableElements.at(-1).focus();
            }
          }
        },
      });
  }

  /**
   * Unregisters the focus scope for the emptyDataState plugin.
   */
  #unregisterFocusScope() {
    this.hot.getFocusScopeManager().unregisterScope(PLUGIN_KEY);
  }

  /**
   * Called after the initialization of the table is completed.
   * It toggles the emptyDataState.
   */
  #onAfterInit() {
    this.#toggleEmptyDataState();

    this.#ui.updateSize(this.hot.view);
    this.#ui.updateClassNames(this.hot.view);
  }

  /**
   * Called after the rendering of the table is completed.
   * It updates the height and class names of the emptyDataState element.
   */
  #onAfterRender() {
    if (this.#ui?.getElement() && this.isVisible()) {
      this.#ui.updateSize(this.hot.view);
      this.#ui.updateClassNames(this.hot.view);
    }
  }

  /**
   * Called before the filtering of the table is completed.
   * It updates the flag indicating if there are filter conditions.
   *
   * @param {Array} conditions - The filter conditions.
   */
  #onBeforeFilter(conditions) {
    this.#hasFilterConditions = conditions?.length > 0;
    this.#shouldUpdate = true;
  }

  /**
   * Get the message by the source for the emptyDataState.
   *
   * @param {string} source - The source.
   * @returns {object} The message.
   */
  #getMessage(source) {
    let message;

    if (typeof this.getSetting('message') === 'function') {
      message = this.getSetting('message')(source);
    } else {
      message = this.getSetting('message');
    }

    // If the message is a string, set the title
    if (typeof message === 'string') {
      message = {
        title: message,
      };
    }

    // If the message is not set, set the default message object
    if (!message?.title && !message?.description && !message?.buttons) {
      message = {};

      if (source === SOURCE.FILTERS) {
        message.title = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_TITLE_FILTERS);
        message.description = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_DESCRIPTION_FILTERS);
        message.buttons = [{
          text: this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_BUTTONS_FILTERS_RESET),
          type: 'secondary',
          callback: () => {
            const filtersPlugin = this.hot.getPlugin('filters');

            if (filtersPlugin) {
              filtersPlugin.clearConditions();
              filtersPlugin.filter();
            }
          }
        }];
      } else {
        message.title = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_TITLE);
        message.description = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_DESCRIPTION);
      }
    }

    return message;
  }

  /**
   * Toggle visibility and content of the emptyDataState.
   *
   * Shows emptyDataState when table has no data or when all data is hidden by filters.
   *
   */
  #toggleEmptyDataState() {
    if (!this.hot.view) {
      return;
    }

    if (this.hot.view.countRenderableColumns() === 0 || this.hot.view.countRenderableRows() === 0) {
      if (!this.#isVisible) {
        this.hot.runHooks('beforeEmptyDataStateShow');
      }

      if (this.#shouldUpdate) {
        if (this.#hasFilterConditions) {
          this.#ui.updateContent(this.#getMessage(SOURCE.FILTERS));
        } else {
          this.#ui.updateContent(this.#getMessage(SOURCE.UNKNOWN));
        }

        this.#shouldUpdate = false;
      }

      this.#ui.show();

      if (!this.#isVisible) {
        this.#isVisible = true;
        this.hot.runHooks('afterEmptyDataStateShow');
      }

      return;
    }

    if (this.#ui?.getElement() && this.#isVisible) {
      this.hot.runHooks('beforeEmptyDataStateHide');

      this.#ui.hide();
      this.#isVisible = false;

      // TODO: Focus the first focusable element in the grid

      this.hot.runHooks('afterEmptyDataStateHide');
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#isVisible = false;
    this.#ui?.destroy();
    this.#ui = null;
    this.#observer = null;
    this.#hasFilterConditions = false;
    this.#shouldUpdate = false;

    super.destroy();
  }
}
