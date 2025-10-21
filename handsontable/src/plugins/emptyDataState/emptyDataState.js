import { BasePlugin } from '../base';
import { EmptyDataStateUI } from './ui';
import { isObject } from '../../helpers/object';
import * as C from '../../i18n/constants';

export const PLUGIN_KEY = 'emptyDataState';
export const PLUGIN_PRIORITY = 370;
export const EMPTY_DATA_STATE_CLASS_NAME = `ht-${PLUGIN_KEY}`;
const SOURCE = Object.freeze({
  EMPTY: 'empty',
  FILTERS: 'filters',
});

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
 *   - `actions`: Actions to display in the empty data state overlay.
 *     - `text`: Text to display in the action button.
 *     - `type`: Type of the action button.
 *     - `callback`: Callback function to call when the action button is clicked.
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
 * // Enable empty data state plugin with custom message and actions for any source
 * emptyDataState: {
 *   message: {
 *     title: 'No data available',
 *     description: 'There’s nothing to display yet.',
 *     actions: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *   },
 * },
 *
 * // Enable empty data state plugin with custom message and actions for specific source
 * emptyDataState: {
 *   message: (source) => {
 *     switch (source) {
 *       case "filters":
 *         return {
 *           title: 'No data available',
 *           description: 'There’s nothing to display yet.',
 *           actions: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
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
 * // Enable empty data state plugin with custom message and actions for any source
 * <HotTable emptyDataState={{
 *   message: {
 *     title: 'No data available',
 *     description: 'There’s nothing to display yet.',
 *     actions: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *   }
 * }} />;
 *
 * // Enable empty data state plugin with custom message and actions for specific source
 * <HotTable emptyDataState={{
 *   message: (source) => {
 *     switch (source) {
 *       case "filters":
 *         return {
 *           title: 'No data available',
 *           description: 'There’s nothing to display yet.',
 *           actions: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
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
 * // Enable empty data state plugin with custom message and actions for any source
 * hotSettings: Handsontable.GridSettings = {
 *   emptyDataState: {
 *     message: {
 *       title: 'No data available',
 *       description: 'There’s nothing to display yet.',
 *       actions: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
 *     },
 *   },
 * },
 *
 * // Enable empty data state plugin with custom message and actions for specific source
 * hotSettings: Handsontable.GridSettings = {
 *   emptyDataState: {
 *     message: (source) => {
 *       switch (source) {
 *         case "filters":
 *           return {
 *             title: 'No data available for filters',
 *             description: 'There’s nothing to display yet.',
 *             actions: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
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
        (typeof value?.actions === 'undefined' || Array.isArray(value?.actions) && value?.actions.every(item =>
          typeof item === 'object' &&
          typeof item.text === 'string' &&
          (typeof item.type === 'string' && ['primary', 'secondary'].includes(item.type)) &&
          typeof item.callback === 'function'
        )) ||
        value === undefined,
    };
  }

  /**
   * Flag indicating if empty data state is currently visible.
   *
   * @type {boolean}
   */
  #isVisible = false;

  /**
   * @type {EmptyDataStateUI}
   * @private
   * @default null
   * @description The UI instance.
   */
  #ui = null;

  /**
   * @type {object}
   * @private
   * @default {}
   * @description The messages.
   */
  #messages = {};

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

    Object.values(SOURCE).forEach((source) => {
      this.#messages[source] = this.#getMessage(source);
    });

    this.hot.addHook('afterInit', () => this.#onAfterInit());
    this.hot.addHook('afterUpdateData', () => this.#toggleEmptyDataState());
    this.hot.addHook('afterFilter', (...args) => this.#toggleEmptyDataState(...args));
    this.hot.addHook('afterRemoveRow', () => this.#toggleEmptyDataState());
    this.hot.addHook('afterRemoveCol', () => this.#toggleEmptyDataState());
    this.hot.addHook('afterCreateRow', () => this.#toggleEmptyDataState());
    this.hot.addHook('afterCreateCol', () => this.#toggleEmptyDataState());
    this.addHook('afterRender', () => this.#onAfterRender());

    super.enablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    if (this.#ui) {
      this.#toggleEmptyDataState();
    }

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Check if the empty data state is currently visible.
   *
   * @returns {boolean}
   */
  isVisible() {
    return this.#isVisible;
  }

  /**
   * Called after the initialization of the table is completed.
   * It creates the empty data state UI instance, and toggles the empty data state.
   */
  #onAfterInit() {
    this.#ui = new EmptyDataStateUI({
      view: this.hot.view,
    });

    this.#toggleEmptyDataState();
  }

  /**
   * Called after the rendering of the table is completed.
   * It updates the height and class names of the empty data state element.
   */
  #onAfterRender() {
    if (this.#ui?.getElement()) {
      this.#ui.updateSize();
      this.#ui.updateClassNames();
    }
  }

  /**
   * Get the message by the source for the empty data state.
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

    // If the message is a string, set the description
    if (typeof message === 'string') {
      message = {
        description: message,
      };
    }

    // If the message is not set, set the default message
    if (!message?.title && !message?.description && !message?.actions) {
      message = {};

      if (source === SOURCE.FILTERS) {
        message.title = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_TITLE_FILTERS);
        message.description = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_DESCRIPTION_FILTERS);
        message.actions = [{
          text: this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_ACTION_FILTERS_BUTTONS_RESET),
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
   * Toggle visibility and content of the empty data state overlay.
   *
   * Shows empty state when table has no data or when all data is hidden by filters.
   * Automatically creates/destroys UI elements and updates content based on context.
   *
   * @param {Array} [conditionsStack] - Filter conditions stack.
   */
  #toggleEmptyDataState(conditionsStack) {
    if (this.hot.getData().length === 0) {

      this.hot.runHooks('beforeEmptyDataStateShow');

      if (!this.#ui.getElement()) {
        this.#ui.create();
      }

      if (conditionsStack?.length > 0) {
        this.#ui.updateContent(this.#messages[SOURCE.FILTERS]);
      } else {
        this.#ui.updateContent(this.#messages.empty);
      }

      this.hot.render();

      this.#isVisible = true;

      this.hot.runHooks('afterEmptyDataStateShow');

      return;
    }

    if (this.#ui.getElement()) {
      this.hot.runHooks('beforeEmptyDataStateHide');

      this.#ui.destroy();
      this.#isVisible = false;

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
    this.#messages = {};

    super.destroy();
  }
}
