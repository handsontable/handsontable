import { BasePlugin } from '../base';
import { EmptyDataStateUI } from './ui';
import { isObject } from '../../helpers/object';
import * as C from '../../i18n/constants';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';

/**
 * Local type-guard narrowing `unknown` to `Record<string, unknown>`.
 * The public `isObject` is intentionally non-narrowing, so we wrap it here.
 *
 * @param {unknown} v The value to check.
 * @returns {boolean}
 */
function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return isObject(v);
}

/**
 * The possible shapes of the `message` setting value.
 */
type MessageSetting =
  | string
  | Record<string, unknown>
  | ((source: string) => string | Record<string, unknown>)
  | undefined;

interface SelectionState {
  ranges: CellRange[];
  activeRange: CellRange | undefined;
  activeSelectionLayer: number;
  selectedByRowHeader: number[];
  selectedByColumnHeader: number[];
  disableHeadersHighlight: boolean;
}

export const PLUGIN_KEY = 'emptyDataState';
export const PLUGIN_PRIORITY = 370;
const SOURCE = Object.freeze({
  UNKNOWN: 'unknown',
  FILTERS: 'filters',
  LOADING: 'loading',
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
 * When [[Options#dataProvider]] is enabled, the loading overlay is toggled from DataProvider fetch hooks
 * ([[Hooks#beforeDataProviderFetch]], [[Hooks#afterDataProviderFetch]], [[Hooks#afterDataProviderFetchError]]).
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
 *       case "loading":
 *         return {
 *           title: 'Loading data',
 *           description: 'Please wait.',
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
 *       case "loading":
 *         return {
 *           title: 'Loading data',
 *           description: 'Please wait.',
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
 *         case "loading":
 *           return {
 *             title: 'Loading data',
 *             description: 'Please wait.',
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
      message: undefined as string | Record<string, unknown> | undefined,
    };
  }

  /**
   * Returns validator functions for each plugin setting to verify their values are valid before applying them.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      message: (value: unknown) => {
        if (typeof value === 'string' || typeof value === 'function' || value === undefined) {
          return true;
        }
        if (!isPlainRecord(value)) {
          return false;
        }

        return (typeof value.title === 'undefined' || typeof value.title === 'string') &&
          (typeof value.description === 'undefined' || typeof value.description === 'string') &&
          (typeof value.buttons === 'undefined' || Array.isArray(value.buttons) &&
            (value.buttons as Record<string, unknown>[]).every((item: Record<string, unknown>) =>
              typeof item === 'object' &&
              typeof item.text === 'string' &&
              (typeof item.type === 'string' && ['primary', 'secondary'].includes(item.type)) &&
              typeof item.callback === 'function'
            ));
      },
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
  #ui: EmptyDataStateUI | null = null;

  /**
   * Flag indicating if there are filter conditions.
   *
   * @type {boolean}
   */
  #hasFilterConditions = false;

  /**
   * Keeps the selection state that will be restored after the overlay is closed.
   *
   * @type {SelectionState | null}
   */
  #selectionState: SelectionState | null = null;

  /**
   * Whether the DataProvider-driven loading branch of the overlay is active.
   *
   * @type {boolean}
   */
  #loadingActive = false;

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
      this.#ui = new EmptyDataStateUI({
        gridContainer: this.hot.rootGridElement,
        rootDocument: this.hot.rootDocument,
      });

      this.#registerFocusScope();
      this.#registerEvents();
    }

    this.addHook('afterInit', this.#onAfterInit);
    this.addHook('afterRender', this.#onAfterRender);
    this.addHook('afterRowSequenceCacheUpdate', () => {
      this.#toggleEmptyDataState();
    });
    this.addHook('afterColumnSequenceCacheUpdate', () => {
      this.#toggleEmptyDataState();
    });
    this.addHook('beforeFilter', this.#onBeforeFilter);
    this.addHook('beforeDataProviderFetch', (queryParameters: Record<string, unknown>) => {
      if (!queryParameters.skipLoading) {
        this.#setLoadingActive();
      }
    });
    this.addHook('afterDataProviderFetch', () => this.#clearLoadingActive());
    this.addHook('afterDataProviderFetchError', () => this.#clearLoadingActive());

    super.enablePlugin();

    this.#toggleEmptyDataState();
  }

  /**
   * Update plugin state after Handsontable settings update.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    this.#update();

    if (this.isVisible()) {
      this.#ui?.show();
    }

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.#loadingActive = false;

    this.#unregisterFocusScope();

    this.#ui?.destroy();
    this.#ui = null;

    super.disablePlugin();
  }

  /**
   * Check if the plugin is currently visible.
   *
   * @returns {boolean}
   */
  isVisible(): boolean {
    return this.#isVisible;
  }

  /**
   * Registers the DOM listeners.
   */
  #registerEvents() {
    this.eventManager.addEventListener(this.#ui!.getElement()!, 'wheel', (event) => {
      this.#onMouseWheel(event as WheelEvent);
    });
  }

  /**
   * Sets the loading active flag and toggles the emptyDataState.
   */
  #setLoadingActive() {
    if (this.#loadingActive) {
      return;
    }

    this.#loadingActive = true;
    this.#toggleEmptyDataState();
  }

  /**
   * Clears the loading active flag and hides the emptyDataState.
   */
  #clearLoadingActive() {
    if (!this.#loadingActive) {
      return;
    }

    this.#loadingActive = false;
    this.#hide();
    this.#toggleEmptyDataState();
    this.hot.render();
  }

  /**
   * Registers the focus scope for the emptyDataState plugin.
   */
  #registerFocusScope() {
    this.hot.getFocusScopeManager()
      .registerScope(PLUGIN_KEY, this.#ui!.getElement()!, {
        shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
        runOnlyIf: () => this.isVisible(),
        onActivate: (focusSource: string) => {
          const focusableElements = this.#ui?.getFocusableElements() ?? [];

          if (focusableElements.length > 0) {
            if (focusSource === 'tab_from_above') {
              focusableElements.at(0)?.focus();

            } else if (focusSource === 'tab_from_below') {
              focusableElements.at(-1)?.focus();
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
   * Get the message by the source for the emptyDataState.
   *
   * @param {string} source - The source.
   * @returns {object} The message.
   */
  #getMessage(source: string): Record<string, unknown> {
    const messageSetting = this.getSetting<MessageSetting>('message');

    let message: string | Record<string, unknown> | undefined;

    if (typeof messageSetting === 'function') {
      message = messageSetting(source);
    } else {
      message = messageSetting;
    }

    // If the message is a string, set the title
    if (typeof message === 'string') {
      message = { title: message };
    }

    // If the message is not set, set the default message object
    if (!message?.title && !message?.description && !message?.buttons) {
      const result: Record<string, unknown> = {};

      if (source === SOURCE.FILTERS) {
        result.title = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_TITLE_FILTERS);
        result.description = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_DESCRIPTION_FILTERS);
        result.buttons = [{
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
      } else if (source === SOURCE.LOADING) {
        result.title = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_TITLE_LOADING);
        result.description = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_DESCRIPTION_LOADING);
      } else {
        result.title = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_TITLE);
        result.description = this.hot.getTranslatedPhrase(C.EMPTY_DATA_STATE_DESCRIPTION);
      }

      return result;
    }

    // At this point message is a Record<string, unknown> (string was already converted above).
    // The union type is narrowed to Record<string, unknown> by the checks above.
    return message as Record<string, unknown>;
  }

  /**
   * Toggle visibility and content of the emptyDataState.
   *
   * Shows emptyDataState when table has no data or when all data is hidden by filters.
   * When DataProvider loading is active, the overlay can show over non-empty data.
   */
  #toggleEmptyDataState() {
    if (!this.hot.view) {
      return;
    }

    if (this.#loadingActive) {
      if (this.#isVisible) {
        this.#update();
      } else {
        this.#show();
      }

      return;
    }

    if (
      this.hot.view.countRenderableColumns() === 0 ||
      this.hot.view.countRenderableRows() === 0
    ) {
      this.#show();
    } else {
      this.#hide();
    }
  }

  /**
   * Shows the emptyDataState overlay.
   */
  #show() {
    if (this.#isVisible) {
      return;
    }

    this.hot.runHooks('beforeEmptyDataStateShow');

    this.#update();

    this.#ui?.show();
    this.#isVisible = true;

    this.#selectionState = this.hot.selection.exportSelection();
    this.hot.getFocusScopeManager().activateScope(PLUGIN_KEY);

    this.hot.runHooks('afterEmptyDataStateShow');
  }

  /**
   * Updates the content of the emptyDataState overlay.
   */
  #update() {
    if (this.#loadingActive) {
      this.#ui?.updateContent(this.#getMessage(SOURCE.LOADING), true);
    } else if (this.#hasFilterConditions) {
      this.#ui?.updateContent(this.#getMessage(SOURCE.FILTERS), false);
    } else {
      this.#ui?.updateContent(this.#getMessage(SOURCE.UNKNOWN), false);
    }
  }

  /**
   * Hides the emptyDataState overlay.
   */
  #hide() {
    if (!this.#isVisible) {
      return;
    }

    this.hot.runHooks('beforeEmptyDataStateHide');

    this.#ui?.hide();
    this.#isVisible = false;

    this.hot.getFocusScopeManager().deactivateScope(PLUGIN_KEY);

    if (this.#selectionState && this.#selectionState.ranges.length > 0) {
      this.hot.selection.importSelection({
        ...this.#selectionState,
        activeRange: this.#selectionState.activeRange!,
      });
      this.hot.view.render();
      this.#selectionState = null;
    } else {
      this.hot.selectCell(0, 0, undefined, undefined, false);
    }

    this.hot.runHooks('afterEmptyDataStateHide');
  }

  /**
   * Handles the mouse wheel event.
   *
   * @param {WheelEvent} event - The wheel event.
   */
  #onMouseWheel(event: WheelEvent) {
    // wheelDeltaX is a non-standard property present in some browsers (e.g. Safari)
    const extendedEvent: WheelEvent & { wheelDeltaX?: number } = event;
    const wheelDeltaX = extendedEvent.wheelDeltaX ?? 0;
    const deltaX = Number.isNaN(event.deltaX) ? (-1) * wheelDeltaX : event.deltaX;

    if (deltaX !== 0 && this.hot.view.hasHorizontalScroll() && !this.hot.view.isHorizontallyScrollableByWindow()) {
      this.hot.view.setTableScrollPosition({ left: this.hot.view.getTableScrollPosition().left + deltaX });

      event.preventDefault();
    }
  }

  /**
   * Called after the initialization of the table is completed.
   * It toggles the emptyDataState.
   */
  #onAfterInit = () => {
    this.#toggleEmptyDataState();

    this.hot.render();
  };

  /**
   * Called after the rendering of the table is completed.
   * It updates the height and class names of the emptyDataState element.
   */
  #onAfterRender = () => {
    if (this.#ui?.getElement() && this.isVisible() && this.hot.view) {
      this.#ui.updateSize(this.hot.view, this.#loadingActive);
      this.#ui.updateClassNames(this.hot.view);
    }
  };

  /**
   * Called before the filtering of the table is completed.
   * It updates the flag indicating if there are filter conditions.
   *
   * @param {Array} conditions - The filter conditions.
   */
  #onBeforeFilter = (conditions: unknown[]) => {
    this.#hasFilterConditions = conditions?.length > 0;

    if (this.isVisible()) {
      this.#update();
    }
  };

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.#loadingActive = false;
    this.#isVisible = false;
    this.#ui?.destroy();
    this.#ui = null;
    this.#hasFilterConditions = false;
    this.#selectionState = null;

    super.destroy();
  }
}
