import { BasePlugin } from '../base';
import { EmptyDataStateUI } from './ui';

export const PLUGIN_KEY = 'emptyDataState';
export const PLUGIN_PRIORITY = 370;
export const EMPTY_DATA_STATE_CLASS_NAME = `ht-${PLUGIN_KEY}`;

/**
 * @plugin EmptyDataState
 * @class EmptyDataState
 *
 * @description
 * The empty data state plugin provides a empty data state overlay system for Handsontable.
 * It displays a empty data state indicator with customizable message.
 *
 * In order to enable the empty data state mechanism, {@link Options#emptyDataState} option must be set to `true`.
 */

export class EmptyDataState extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {};
  }

  static get SETTINGS_VALIDATORS() {
    return {};
  }

  #ui = null;

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

    this.hot.addHook('afterInit', () => this.#afterInit());
    this.hot.addHook('afterUpdateData', () => this.#afterUpdateData());
    this.hot.addHook('afterFilter', () => this.#afterFilter());
    this.hot.addHook('afterRemoveRow', () => this.#afterRemoveRowOrCol());
    this.hot.addHook('afterRemoveCol', () => this.#afterRemoveRowOrCol());
    this.hot.addHook('afterCreateRow', () => this.#afterCreateRowOrCol());
    this.hot.addHook('afterCreateCol', () => this.#afterCreateRowOrCol());

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
    super.disablePlugin();
  }

  #afterInit() {
    this.#ui = new EmptyDataStateUI({
      rootElement: this.hot.rootElement,
      view: this.hot.view,
    });

    if (this.hot.getData().length === 0) {
      this.#ui.create();
      this.#ui.updateContent('No data available');
    }
  }

  #afterUpdateData() {
    if (this.hot.getData().length === 0) {
      this.#ui.create();
      this.#ui.updateContent('No data available');
    } else if (this.#ui.getElement()) {
      this.#ui.destroy();
    }
  }

  #afterFilter() {
    if (this.hot.getData().length === 0) {
      this.#ui.create();
      this.#ui.updateContent('No results match your filters');
    } else if (this.#ui.getElement()) {
      this.#ui.destroy();
    }
  }

  #afterRemoveRowOrCol() {
    if (this.hot.getData().length === 0) {
      this.#ui.create();
      this.#ui.updateContent('No data available');
    }
  }

  #afterCreateRowOrCol() {
    if (this.hot.getData().length > 0) {
      this.#ui.destroy();
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
