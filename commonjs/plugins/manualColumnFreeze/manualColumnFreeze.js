'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _base = require('./../_base');

var _base2 = _interopRequireDefault(_base);

var _plugins = require('./../../plugins');

var _array = require('./../../helpers/array');

var _freezeColumn = require('./contextMenuItem/freezeColumn');

var _freezeColumn2 = _interopRequireDefault(_freezeColumn);

var _unfreezeColumn = require('./contextMenuItem/unfreezeColumn');

var _unfreezeColumn2 = _interopRequireDefault(_unfreezeColumn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var privatePool = new WeakMap();
/**
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu or using API.
 * You can turn it on by setting a {@link Options#manualColumnFreeze} property to `true`.
 *
 * @example
 * ```js
 * // Enables the plugin
 * manualColumnFreeze: true,
 * ```
 *
 * @plugin ManualColumnFreeze
 * @dependencies ManualColumnMove
 */

var ManualColumnFreeze = function (_BasePlugin) {
  _inherits(ManualColumnFreeze, _BasePlugin);

  function ManualColumnFreeze(hotInstance) {
    _classCallCheck(this, ManualColumnFreeze);

    var _this = _possibleConstructorReturn(this, (ManualColumnFreeze.__proto__ || Object.getPrototypeOf(ManualColumnFreeze)).call(this, hotInstance));

    privatePool.set(_this, {
      moveByFreeze: false,
      afterFirstUse: false
    });
    /**
     * Original column positions
     *
     * @private
     * @type {Array}
     */
    _this.frozenColumnsBasePositions = [];
    /**
     * Reference to the `ManualColumnMove` plugin.
     *
     * @private
     * @type {ManualColumnMove}
     */
    _this.manualColumnMovePlugin = void 0;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ManualColumnFreeze#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(ManualColumnFreeze, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return !!this.hot.getSettings().manualColumnFreeze;
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

      this.addHook('afterContextMenuDefaultOptions', function (options) {
        return _this2.addContextMenuEntry(options);
      });
      this.addHook('afterInit', function () {
        return _this2.onAfterInit();
      });
      this.addHook('beforeColumnMove', function (rows, target) {
        return _this2.onBeforeColumnMove(rows, target);
      });

      _get(ManualColumnFreeze.prototype.__proto__ || Object.getPrototypeOf(ManualColumnFreeze.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      var priv = privatePool.get(this);

      priv.afterFirstUse = false;
      priv.moveByFreeze = false;

      _get(ManualColumnFreeze.prototype.__proto__ || Object.getPrototypeOf(ManualColumnFreeze.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();

      _get(ManualColumnFreeze.prototype.__proto__ || Object.getPrototypeOf(ManualColumnFreeze.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Freezes the given column (add it to fixed columns).
     *
     * @param {Number} column Visual column index.
     */

  }, {
    key: 'freezeColumn',
    value: function freezeColumn(column) {
      var priv = privatePool.get(this);
      var settings = this.hot.getSettings();

      if (!priv.afterFirstUse) {
        priv.afterFirstUse = true;
      }

      if (settings.fixedColumnsLeft === this.hot.countCols() || column <= settings.fixedColumnsLeft - 1) {
        return; // already fixed
      }

      priv.moveByFreeze = true;

      if (column !== this.getMovePlugin().columnsMapper.getValueByIndex(column)) {
        this.frozenColumnsBasePositions[settings.fixedColumnsLeft] = column;
      }

      this.getMovePlugin().moveColumn(column, settings.fixedColumnsLeft);

      settings.fixedColumnsLeft += 1;
    }

    /**
     * Unfreezes the given column (remove it from fixed columns and bring to it's previous position).
     *
     * @param {Number} column Visual column index.
     */

  }, {
    key: 'unfreezeColumn',
    value: function unfreezeColumn(column) {
      var priv = privatePool.get(this);
      var settings = this.hot.getSettings();

      if (!priv.afterFirstUse) {
        priv.afterFirstUse = true;
      }

      if (settings.fixedColumnsLeft <= 0 || column > settings.fixedColumnsLeft - 1) {
        return; // not fixed
      }

      var returnCol = this.getBestColumnReturnPosition(column);

      priv.moveByFreeze = true;
      settings.fixedColumnsLeft -= 1;

      this.getMovePlugin().moveColumn(column, returnCol + 1);
    }

    /**
     * Gets the reference to the ManualColumnMove plugin.
     *
     * @private
     * @returns {Object}
     */

  }, {
    key: 'getMovePlugin',
    value: function getMovePlugin() {
      if (!this.manualColumnMovePlugin) {
        this.manualColumnMovePlugin = this.hot.getPlugin('manualColumnMove');
      }

      return this.manualColumnMovePlugin;
    }

    /**
     * Estimates the most fitting return position for unfrozen column.
     *
     * @private
     * @param {Number} column Visual column index.
     */

  }, {
    key: 'getBestColumnReturnPosition',
    value: function getBestColumnReturnPosition(column) {
      var movePlugin = this.getMovePlugin();
      var settings = this.hot.getSettings();
      var i = settings.fixedColumnsLeft;
      var j = movePlugin.columnsMapper.getValueByIndex(i);
      var initialCol = void 0;

      if (this.frozenColumnsBasePositions[column] === null || this.frozenColumnsBasePositions[column] === void 0) {
        initialCol = movePlugin.columnsMapper.getValueByIndex(column);

        while (j !== null && j <= initialCol) {
          i += 1;
          j = movePlugin.columnsMapper.getValueByIndex(i);
        }
      } else {
        initialCol = this.frozenColumnsBasePositions[column];
        this.frozenColumnsBasePositions[column] = void 0;

        while (j !== null && j <= initialCol) {
          i += 1;
          j = movePlugin.columnsMapper.getValueByIndex(i);
        }
        i = j;
      }

      return i - 1;
    }

    /**
     * Adds the manualColumnFreeze context menu entries.
     *
     * @private
     * @param {Object} options Context menu options.
     */

  }, {
    key: 'addContextMenuEntry',
    value: function addContextMenuEntry(options) {
      options.items.push({ name: '---------' }, (0, _freezeColumn2.default)(this), (0, _unfreezeColumn2.default)(this));
    }

    /**
     * Enables `manualColumnMove` plugin on `afterInit` hook.
     *
     * @private
     */

  }, {
    key: 'onAfterInit',
    value: function onAfterInit() {
      if (!this.getMovePlugin().isEnabled()) {
        this.getMovePlugin().enablePlugin();
      }
    }

    /**
     * Prevents moving the rows from/to fixed area.
     *
     * @private
     * @param {Array} rows
     * @param {Number} target
     */

  }, {
    key: 'onBeforeColumnMove',
    value: function onBeforeColumnMove(rows, target) {
      var priv = privatePool.get(this);

      if (priv.afterFirstUse && !priv.moveByFreeze) {
        var frozenLen = this.hot.getSettings().fixedColumnsLeft;
        var disallowMoving = target < frozenLen;

        if (!disallowMoving) {
          (0, _array.arrayEach)(rows, function (value) {
            if (value < frozenLen) {
              disallowMoving = true;
              return false;
            }
          });
        }

        if (disallowMoving) {
          return false;
        }
      }

      if (priv.moveByFreeze) {
        priv.moveByFreeze = false;
      }
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      _get(ManualColumnFreeze.prototype.__proto__ || Object.getPrototypeOf(ManualColumnFreeze.prototype), 'destroy', this).call(this);
    }
  }]);

  return ManualColumnFreeze;
}(_base2.default);

(0, _plugins.registerPlugin)('manualColumnFreeze', ManualColumnFreeze);

exports.default = ManualColumnFreeze;