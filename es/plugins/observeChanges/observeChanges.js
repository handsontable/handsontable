var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var ObserveChanges = function (_BasePlugin) {
  _inherits(ObserveChanges, _BasePlugin);

  function ObserveChanges(hotInstance) {
    _classCallCheck(this, ObserveChanges);

    /**
     * Instance of {@link DataObserver}.
     *
     * @private
     * @type {DataObserver}
     */
    var _this = _possibleConstructorReturn(this, (ObserveChanges.__proto__ || Object.getPrototypeOf(ObserveChanges)).call(this, hotInstance));

    _this.observer = null;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ObserveChanges#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(ObserveChanges, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return this.hot.getSettings().observeChanges;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }
      if (!this.observer) {
        this.observer = new DataObserver(this.hot.getSourceData());
        this._exposePublicApi();
      }

      this.observer.addLocalHook('change', function (patches) {
        return _this2.onDataChange(patches);
      });
      this.addHook('afterCreateRow', function () {
        return _this2.onAfterTableAlter();
      });
      this.addHook('afterRemoveRow', function () {
        return _this2.onAfterTableAlter();
      });
      this.addHook('afterCreateCol', function () {
        return _this2.onAfterTableAlter();
      });
      this.addHook('afterRemoveCol', function () {
        return _this2.onAfterTableAlter();
      });
      this.addHook('afterChange', function (changes, source) {
        return _this2.onAfterTableAlter(source);
      });
      this.addHook('afterLoadData', function (firstRun) {
        return _this2.onAfterLoadData(firstRun);
      });

      _get(ObserveChanges.prototype.__proto__ || Object.getPrototypeOf(ObserveChanges.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      if (this.observer) {
        this.observer.destroy();
        this.observer = null;
        this._deletePublicApi();
      }

      _get(ObserveChanges.prototype.__proto__ || Object.getPrototypeOf(ObserveChanges.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Data change observer.
     *
     * @private
     * @param {Array} patches An array of objects which every item defines coordinates where data was changed.
     */

  }, {
    key: 'onDataChange',
    value: function onDataChange(patches) {
      var _this3 = this;

      if (!this.observer.isPaused()) {
        var sourceName = this.pluginName + '.change';
        var actions = {
          add: function add(patch) {
            if (isNaN(patch.col)) {
              _this3.hot.runHooks('afterCreateRow', patch.row, 1, sourceName);
            } else {
              _this3.hot.runHooks('afterCreateCol', patch.col, 1, sourceName);
            }
          },
          remove: function remove(patch) {
            if (isNaN(patch.col)) {
              _this3.hot.runHooks('afterRemoveRow', patch.row, 1, sourceName);
            } else {
              _this3.hot.runHooks('afterRemoveCol', patch.col, 1, sourceName);
            }
          },
          replace: function replace(patch) {
            _this3.hot.runHooks('afterChange', [[patch.row, patch.col, null, patch.value]], sourceName);
          }
        };

        arrayEach(patches, function (patch) {
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

  }, {
    key: 'onAfterTableAlter',
    value: function onAfterTableAlter(source) {
      var _this4 = this;

      if (source !== 'loadData') {
        this.observer.pause();
        this.hot.addHookOnce('afterChangesObserved', function () {
          return _this4.observer.resume();
        });
      }
    }

    /**
     * On after load data listener.
     *
     * @private
     * @param {Boolean} firstRun `true` if event was fired first time.
     */

  }, {
    key: 'onAfterLoadData',
    value: function onAfterLoadData(firstRun) {
      if (!firstRun) {
        this.observer.setObservedData(this.hot.getSourceData());
      }
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      if (this.observer) {
        this.observer.destroy();
        this._deletePublicApi();
      }
      _get(ObserveChanges.prototype.__proto__ || Object.getPrototypeOf(ObserveChanges.prototype), 'destroy', this).call(this);
    }

    /**
     * Expose plugins methods to the core.
     *
     * @private
     */

  }, {
    key: '_exposePublicApi',
    value: function _exposePublicApi() {
      var _this5 = this;

      var hot = this.hot;

      hot.pauseObservingChanges = function () {
        return _this5.observer.pause();
      };
      hot.resumeObservingChanges = function () {
        return _this5.observer.resume();
      };
      hot.isPausedObservingChanges = function () {
        return _this5.observer.isPaused();
      };
    }

    /**
     * Deletes all previously exposed methods.
     *
     * @private
     */

  }, {
    key: '_deletePublicApi',
    value: function _deletePublicApi() {
      var hot = this.hot;

      delete hot.pauseObservingChanges;
      delete hot.resumeObservingChanges;
      delete hot.isPausedObservingChanges;
    }
  }]);

  return ObserveChanges;
}(BasePlugin);

export default ObserveChanges;

registerPlugin('observeChanges', ObserveChanges);