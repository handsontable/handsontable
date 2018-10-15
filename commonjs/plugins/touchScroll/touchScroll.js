'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _element = require('./../../helpers/dom/element');

var _array = require('./../../helpers/array');

var _base = require('./../_base');

var _base2 = _interopRequireDefault(_base);

var _plugins = require('./../../plugins');

var _feature = require('./../../helpers/feature');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 * @plugin TouchScroll
 * @class TouchScroll
 */
var TouchScroll = function (_BasePlugin) {
  _inherits(TouchScroll, _BasePlugin);

  function TouchScroll(hotInstance) {
    _classCallCheck(this, TouchScroll);

    /**
     * Collection of scrollbars to update.
     *
     * @type {Array}
     */
    var _this = _possibleConstructorReturn(this, (TouchScroll.__proto__ || Object.getPrototypeOf(TouchScroll)).call(this, hotInstance));

    _this.scrollbars = [];
    /**
     * Collection of overlays to update.
     *
     * @type {Array}
     */
    _this.clones = [];
    /**
     * Flag which determines if collection of overlays should be refilled on every table render.
     *
     * @type {Boolean}
     * @default false
     */
    _this.lockedCollection = false;
    /**
     * Flag which determines if walkontable should freeze overlays while scrolling.
     *
     * @type {Boolean}
     * @default false
     */
    _this.freezeOverlays = false;
    return _this;
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */


  _createClass(TouchScroll, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return (0, _feature.isTouchSupported)();
    }

    /**
     * Enable the plugin.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      this.addHook('afterRender', function () {
        return _this2.onAfterRender();
      });
      this.registerEvents();

      _get(TouchScroll.prototype.__proto__ || Object.getPrototypeOf(TouchScroll.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Updates the plugin to use the latest options you have specified.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.lockedCollection = false;

      _get(TouchScroll.prototype.__proto__ || Object.getPrototypeOf(TouchScroll.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Disable plugin for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      _get(TouchScroll.prototype.__proto__ || Object.getPrototypeOf(TouchScroll.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Register all necessary events.
     *
     * @private
     */

  }, {
    key: 'registerEvents',
    value: function registerEvents() {
      var _this3 = this;

      this.addHook('beforeTouchScroll', function () {
        return _this3.onBeforeTouchScroll();
      });
      this.addHook('afterMomentumScroll', function () {
        return _this3.onAfterMomentumScroll();
      });
    }

    /**
     * After render listener.
     *
     * @private
     */

  }, {
    key: 'onAfterRender',
    value: function onAfterRender() {
      if (this.lockedCollection) {
        return;
      }

      var _hot$view$wt$wtOverla = this.hot.view.wt.wtOverlays,
          topOverlay = _hot$view$wt$wtOverla.topOverlay,
          bottomOverlay = _hot$view$wt$wtOverla.bottomOverlay,
          leftOverlay = _hot$view$wt$wtOverla.leftOverlay,
          topLeftCornerOverlay = _hot$view$wt$wtOverla.topLeftCornerOverlay,
          bottomLeftCornerOverlay = _hot$view$wt$wtOverla.bottomLeftCornerOverlay;


      this.lockedCollection = true;
      this.scrollbars.length = 0;
      this.scrollbars.push(topOverlay);

      if (bottomOverlay.clone) {
        this.scrollbars.push(bottomOverlay);
      }
      this.scrollbars.push(leftOverlay);

      if (topLeftCornerOverlay) {
        this.scrollbars.push(topLeftCornerOverlay);
      }
      if (bottomLeftCornerOverlay && bottomLeftCornerOverlay.clone) {
        this.scrollbars.push(bottomLeftCornerOverlay);
      }

      this.clones.length = 0;

      if (topOverlay.needFullRender) {
        this.clones.push(topOverlay.clone.wtTable.holder.parentNode);
      }
      if (bottomOverlay.needFullRender) {
        this.clones.push(bottomOverlay.clone.wtTable.holder.parentNode);
      }
      if (leftOverlay.needFullRender) {
        this.clones.push(leftOverlay.clone.wtTable.holder.parentNode);
      }
      if (topLeftCornerOverlay) {
        this.clones.push(topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      }
      if (bottomLeftCornerOverlay && bottomLeftCornerOverlay.clone) {
        this.clones.push(bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
      }
    }

    /**
     * Touch scroll listener.
     *
     * @private
     */

  }, {
    key: 'onBeforeTouchScroll',
    value: function onBeforeTouchScroll() {
      this.freezeOverlays = true;

      (0, _array.arrayEach)(this.clones, function (clone) {
        (0, _element.addClass)(clone, 'hide-tween');
      });
    }

    /**
     * After momentum scroll listener.
     *
     * @private
     */

  }, {
    key: 'onAfterMomentumScroll',
    value: function onAfterMomentumScroll() {
      var _this4 = this;

      this.freezeOverlays = false;

      (0, _array.arrayEach)(this.clones, function (clone) {
        (0, _element.removeClass)(clone, 'hide-tween');
        (0, _element.addClass)(clone, 'show-tween');
      });

      setTimeout(function () {
        (0, _array.arrayEach)(_this4.clones, function (clone) {
          (0, _element.removeClass)(clone, 'show-tween');
        });
      }, 400);

      (0, _array.arrayEach)(this.scrollbars, function (scrollbar) {
        scrollbar.refresh();
        scrollbar.resetFixedPosition();
      });

      this.hot.view.wt.wtOverlays.syncScrollWithMaster();
    }
  }]);

  return TouchScroll;
}(_base2.default);

(0, _plugins.registerPlugin)('touchScroll', TouchScroll);

exports.default = TouchScroll;