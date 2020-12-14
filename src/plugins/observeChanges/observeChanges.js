import { BasePlugin } from '../base';
import DataObserver from './dataObserver';
import { arrayEach } from '../../helpers/array';
import { warn } from '../../helpers/console';

// Handsontable.hooks.register('afterChangesObserved');

export const PLUGIN_KEY = 'observeChanges';
export const PLUGIN_PRIORITY = 180;

/**
 * @plugin ObserveChanges
 *
 * @deprecated This plugin is deprecated and will be removed in the next major release.
 * @description
 * This plugin allows to observe data source changes. By default, the plugin is declared as `undefined`, which makes it
 * disabled. Enabling this plugin switches the table into one-way data binding where changes are applied into the data
 * source (outside from the table) will be automatically reflected in the table.
 *
 * @example
 * ```js
 * // as a boolean
 * observeChanges: true,
 * ```
 *
 * To configure this plugin see {@link Options#observeChanges}.
 */
export class ObserveChanges extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link DataObserver}.
     *
     * @private
     * @type {DataObserver}
     */
    this.observer = null;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ObserveChanges#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    if (!this.observer) {
      warn('The Observe Changes plugin is deprecated and will be removed in the next major release');
      this.observer = new DataObserver(this.hot.getSettings().data);
      this._exposePublicApi();
    }

    this.observer.addLocalHook('change', patches => this.onDataChange(patches));
    this.addHook('afterCreateRow', () => this.onAfterTableAlter());
    this.addHook('afterRemoveRow', () => this.onAfterTableAlter());
    this.addHook('afterCreateCol', () => this.onAfterTableAlter());
    this.addHook('afterRemoveCol', () => this.onAfterTableAlter());
    this.addHook('afterChange', (changes, source) => this.onAfterTableAlter(source));
    this.addHook('afterLoadData', (sourceData, firstRun) => this.onAfterLoadData(sourceData, firstRun));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    if (this.observer) {
      this.observer.destroy();
      this.observer = null;
      this._deletePublicApi();
    }

    super.disablePlugin();
  }

  /**
   * Data change observer.
   *
   * @private
   * @param {Array} patches An array of objects which every item defines coordinates where data was changed.
   */
  onDataChange(patches) {
    let render = false;

    if (!this.observer.isPaused()) {
      const sourceName = `${this.pluginName}.change`;
      const actions = {
        add: (patch) => {
          const [visualRow, visualColumn] = [patch.row, patch.col];

          if (isNaN(visualColumn)) {
            this.hot.rowIndexMapper.insertIndexes(visualRow, 1);
            this.hot.runHooks('afterCreateRow', visualRow, 1, sourceName);

          } else {
            this.hot.columnIndexMapper.insertIndexes(visualColumn, 1);
            this.hot.runHooks('afterCreateCol', visualColumn, 1, sourceName);
          }
        },
        remove: (patch) => {
          const [visualRow, visualColumn] = [patch.row, patch.col];

          if (isNaN(visualColumn)) {
            this.hot.rowIndexMapper.removeIndexes([visualRow]);
            this.hot.runHooks('afterRemoveRow', visualRow, 1, sourceName);

          } else {
            this.hot.columnIndexMapper.removeIndexes([visualColumn]);
            this.hot.runHooks('afterRemoveCol', visualColumn, 1, sourceName);
          }
        },
        replace: (patch) => {
          this.hot.runHooks('afterChange', [[patch.row, patch.col, null, patch.value]], sourceName);
        },
      };

      arrayEach(patches, (patch) => {
        if (actions[patch.op]) {
          actions[patch.op](patch);
        }
      });

      render = true;
    }

    this.hot.runHooks('afterChangesObserved');

    if (render) {
      this.hot.render();
    }
  }

  /**
   * On after table alter listener. Prevents infinity loop between internal and external data changing.
   *
   * @private
   * @param {string} source The identifier of the code that performed the action.
   */
  onAfterTableAlter(source) {
    if (source !== 'loadData') {
      this.observer.pause();
      this.hot.addHookOnce('afterChangesObserved', () => this.observer.resume());
    }
  }

  /**
   * On after load data listener.
   *
   * @private
   * @param {Array} sourceData Source data array.
   * @param {boolean} firstRun `true` if event was fired first time.
   */
  onAfterLoadData(sourceData, firstRun) {
    if (!firstRun) {
      this.observer.setObservedData(sourceData);
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    if (this.observer) {
      this.observer.destroy();
      this._deletePublicApi();
    }
    super.destroy();
  }

  /**
   * Expose plugins methods to the core.
   *
   * @private
   */
  _exposePublicApi() {
    const hot = this.hot;

    hot.pauseObservingChanges = () => this.observer.pause();
    hot.resumeObservingChanges = () => this.observer.resume();
    hot.isPausedObservingChanges = () => this.observer.isPaused();
  }

  /**
   * Deletes all previously exposed methods.
   *
   * @private
   */
  _deletePublicApi() {
    const hot = this.hot;

    delete hot.pauseObservingChanges;
    delete hot.resumeObservingChanges;
    delete hot.isPausedObservingChanges;
  }
}
