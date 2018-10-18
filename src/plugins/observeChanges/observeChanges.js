import BasePlugin from './../_base';
import DataObserver from './dataObserver';
import { arrayEach } from './../../helpers/array';
import { registerPlugin } from './../../plugins';

// Handsontable.hooks.register('afterChangesObserved');

/**
 * @plugin ObserveChanges
 *
 * @description
 * This plugin allows to observe data source changes. By default, the plugin is declared as `undefined`, which makes it
 * disabled. Enabling this plugin switches the table into one-way data binding where changes are applied into the data
 * source (outside from the table) will be automatically reflected in the table.
 *
 * ```js
 * // as a boolean
 * observeChanges: true,
 * ```
 *
 * To configure this plugin see {@link Options#observeChanges}.
 */
class ObserveChanges extends BasePlugin {
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
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().observeChanges;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    if (!this.observer) {
      this.observer = new DataObserver(this.hot.getSourceData());
      this._exposePublicApi();
    }

    this.observer.addLocalHook('change', patches => this.onDataChange(patches));
    this.addHook('afterCreateRow', () => this.onAfterTableAlter());
    this.addHook('afterRemoveRow', () => this.onAfterTableAlter());
    this.addHook('afterCreateCol', () => this.onAfterTableAlter());
    this.addHook('afterRemoveCol', () => this.onAfterTableAlter());
    this.addHook('afterChange', (changes, source) => this.onAfterTableAlter(source));
    this.addHook('afterLoadData', firstRun => this.onAfterLoadData(firstRun));

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
    if (!this.observer.isPaused()) {
      const sourceName = `${this.pluginName}.change`;
      const actions = {
        add: (patch) => {
          if (isNaN(patch.col)) {
            this.hot.runHooks('afterCreateRow', patch.row, 1, sourceName);
          } else {
            this.hot.runHooks('afterCreateCol', patch.col, 1, sourceName);
          }
        },
        remove: (patch) => {
          if (isNaN(patch.col)) {
            this.hot.runHooks('afterRemoveRow', patch.row, 1, sourceName);
          } else {
            this.hot.runHooks('afterRemoveCol', patch.col, 1, sourceName);
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
      this.hot.render();
    }

    this.hot.runHooks('afterChangesObserved');
  }

  /**
   * On after table alter listener. Prevents infinity loop between internal and external data changing.
   *
   * @private
   * @param source
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
   * @param {Boolean} firstRun `true` if event was fired first time.
   */
  onAfterLoadData(firstRun) {
    if (!firstRun) {
      this.observer.setObservedData(this.hot.getSourceData());
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

export default ObserveChanges;

registerPlugin('observeChanges', ObserveChanges);
