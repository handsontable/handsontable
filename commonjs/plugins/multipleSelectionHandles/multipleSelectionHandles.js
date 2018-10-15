'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _element = require('./../../helpers/dom/element');

var _browser = require('./../../helpers/browser');

var _base = require('./../_base');

var _base2 = _interopRequireDefault(_base);

var _eventManager = require('./../../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _plugins = require('./../../plugins');

var _src = require('./../../3rdparty/walkontable/src');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 * @plugin MultipleSelectionHandles
 */
var MultipleSelectionHandles = function (_BasePlugin) {
  _inherits(MultipleSelectionHandles, _BasePlugin);

  /**
   * @param {Object} hotInstance
   */
  function MultipleSelectionHandles(hotInstance) {
    _classCallCheck(this, MultipleSelectionHandles);

    /**
     * @type {Array}
     */
    var _this2 = _possibleConstructorReturn(this, (MultipleSelectionHandles.__proto__ || Object.getPrototypeOf(MultipleSelectionHandles)).call(this, hotInstance));

    _this2.dragged = [];
    /**
     * Instance of EventManager.
     *
     * @type {EventManager}
     */
    _this2.eventManager = null;
    /**
     * @type {null}
     */
    _this2.lastSetCell = null;
    return _this2;
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */


  _createClass(MultipleSelectionHandles, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return (0, _browser.isMobileBrowser)();
    }

    /**
     * Enable plugin for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      if (this.enabled) {
        return;
      }
      if (!this.eventManager) {
        this.eventManager = new _eventManager2.default(this);
      }
      this.registerListeners();
      _get(MultipleSelectionHandles.prototype.__proto__ || Object.getPrototypeOf(MultipleSelectionHandles.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Bind the touch events
     * @private
     */

  }, {
    key: 'registerListeners',
    value: function registerListeners() {
      var _this = this;

      function removeFromDragged(query) {

        if (_this.dragged.length === 1) {
          // clear array
          _this.dragged.splice(0, _this.dragged.length);

          return true;
        }

        var entryPosition = _this.dragged.indexOf(query);

        if (entryPosition === -1) {
          return false;
        } else if (entryPosition === 0) {
          _this.dragged = _this.dragged.slice(0, 1);
        } else if (entryPosition === 1) {
          _this.dragged = _this.dragged.slice(-1);
        }
      }

      this.eventManager.addEventListener(this.hot.rootElement, 'touchstart', function (event) {
        var selectedRange = void 0;

        if ((0, _element.hasClass)(event.target, 'topLeftSelectionHandle-HitArea')) {
          selectedRange = _this.hot.getSelectedRangeLast();

          _this.dragged.push('topLeft');

          _this.touchStartRange = {
            width: selectedRange.getWidth(),
            height: selectedRange.getHeight(),
            direction: selectedRange.getDirection()
          };

          event.preventDefault();
          return false;
        } else if ((0, _element.hasClass)(event.target, 'bottomRightSelectionHandle-HitArea')) {
          selectedRange = _this.hot.getSelectedRangeLast();

          _this.dragged.push('bottomRight');

          _this.touchStartRange = {
            width: selectedRange.getWidth(),
            height: selectedRange.getHeight(),
            direction: selectedRange.getDirection()
          };

          event.preventDefault();
          return false;
        }
      });

      this.eventManager.addEventListener(this.hot.rootElement, 'touchend', function (event) {
        if ((0, _element.hasClass)(event.target, 'topLeftSelectionHandle-HitArea')) {
          removeFromDragged.call(_this, 'topLeft');

          _this.touchStartRange = void 0;

          event.preventDefault();
          return false;
        } else if ((0, _element.hasClass)(event.target, 'bottomRightSelectionHandle-HitArea')) {
          removeFromDragged.call(_this, 'bottomRight');

          _this.touchStartRange = void 0;

          event.preventDefault();
          return false;
        }
      });

      this.eventManager.addEventListener(this.hot.rootElement, 'touchmove', function (event) {
        var scrollTop = (0, _element.getWindowScrollTop)();
        var scrollLeft = (0, _element.getWindowScrollLeft)();
        var targetCoords = void 0;
        var selectedRange = void 0;
        var rangeWidth = void 0;
        var rangeHeight = void 0;
        var rangeDirection = void 0;
        var newRangeCoords = void 0;

        if (_this.dragged.length === 0) {
          return;
        }

        var endTarget = document.elementFromPoint(event.touches[0].screenX - scrollLeft, event.touches[0].screenY - scrollTop);

        if (!endTarget || endTarget === _this.lastSetCell) {
          return;
        }

        if (endTarget.nodeName === 'TD' || endTarget.nodeName === 'TH') {
          targetCoords = _this.hot.getCoords(endTarget);

          if (targetCoords.col === -1) {
            targetCoords.col = 0;
          }

          selectedRange = _this.hot.getSelectedRangeLast();
          rangeWidth = selectedRange.getWidth();
          rangeHeight = selectedRange.getHeight();
          rangeDirection = selectedRange.getDirection();

          if (rangeWidth === 1 && rangeHeight === 1) {
            _this.hot.selection.setRangeEnd(targetCoords);
          }

          newRangeCoords = _this.getCurrentRangeCoords(selectedRange, targetCoords, _this.touchStartRange.direction, rangeDirection, _this.dragged[0]);

          if (newRangeCoords.start !== null) {
            _this.hot.selection.setRangeStart(newRangeCoords.start);
          }

          _this.hot.selection.setRangeEnd(newRangeCoords.end);

          _this.lastSetCell = endTarget;
        }

        event.preventDefault();
      });
    }
  }, {
    key: 'getCurrentRangeCoords',
    value: function getCurrentRangeCoords(selectedRange, currentTouch, touchStartDirection, currentDirection, draggedHandle) {
      var topLeftCorner = selectedRange.getTopLeftCorner();
      var bottomRightCorner = selectedRange.getBottomRightCorner();
      var bottomLeftCorner = selectedRange.getBottomLeftCorner();
      var topRightCorner = selectedRange.getTopRightCorner();

      var newCoords = {
        start: null,
        end: null
      };

      switch (touchStartDirection) {
        case 'NE-SW':
          switch (currentDirection) {
            case 'NE-SW':
            case 'NW-SE':
              if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: new _src.CellCoords(currentTouch.row, selectedRange.highlight.col),
                  end: new _src.CellCoords(bottomLeftCorner.row, currentTouch.col)
                };
              } else {
                newCoords = {
                  start: new _src.CellCoords(selectedRange.highlight.row, currentTouch.col),
                  end: new _src.CellCoords(currentTouch.row, topLeftCorner.col)
                };
              }
              break;
            case 'SE-NW':
              if (draggedHandle === 'bottomRight') {
                newCoords = {
                  start: new _src.CellCoords(bottomRightCorner.row, currentTouch.col),
                  end: new _src.CellCoords(currentTouch.row, topLeftCorner.col)
                };
              }
              break;
            default:
              break;
          }
          break;
        case 'NW-SE':
          switch (currentDirection) {
            case 'NE-SW':
              if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: currentTouch,
                  end: bottomLeftCorner
                };
              } else {
                newCoords.end = currentTouch;
              }
              break;
            case 'NW-SE':
              if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: currentTouch,
                  end: bottomRightCorner
                };
              } else {
                newCoords.end = currentTouch;
              }
              break;
            case 'SE-NW':
              if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: currentTouch,
                  end: topLeftCorner
                };
              } else {
                newCoords.end = currentTouch;
              }
              break;
            case 'SW-NE':
              if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: currentTouch,
                  end: topRightCorner
                };
              } else {
                newCoords.end = currentTouch;
              }
              break;
            default:
              break;
          }
          break;
        case 'SW-NE':
          switch (currentDirection) {
            case 'NW-SE':
              if (draggedHandle === 'bottomRight') {
                newCoords = {
                  start: new _src.CellCoords(currentTouch.row, topLeftCorner.col),
                  end: new _src.CellCoords(bottomLeftCorner.row, currentTouch.col)
                };
              } else {
                newCoords = {
                  start: new _src.CellCoords(topLeftCorner.row, currentTouch.col),
                  end: new _src.CellCoords(currentTouch.row, bottomRightCorner.col)
                };
              }
              break;
            // case 'NE-SW':
            //
            //  break;
            case 'SW-NE':
              if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: new _src.CellCoords(selectedRange.highlight.row, currentTouch.col),
                  end: new _src.CellCoords(currentTouch.row, bottomRightCorner.col)
                };
              } else {
                newCoords = {
                  start: new _src.CellCoords(currentTouch.row, topLeftCorner.col),
                  end: new _src.CellCoords(topLeftCorner.row, currentTouch.col)
                };
              }
              break;
            case 'SE-NW':
              if (draggedHandle === 'bottomRight') {
                newCoords = {
                  start: new _src.CellCoords(currentTouch.row, topRightCorner.col),
                  end: new _src.CellCoords(topLeftCorner.row, currentTouch.col)
                };
              } else if (draggedHandle === 'topLeft') {
                newCoords = {
                  start: bottomLeftCorner,
                  end: currentTouch
                };
              }
              break;
            default:
              break;
          }
          break;
        case 'SE-NW':
          switch (currentDirection) {
            case 'NW-SE':
            case 'NE-SW':
            case 'SW-NE':
              if (draggedHandle === 'topLeft') {
                newCoords.end = currentTouch;
              }
              break;
            case 'SE-NW':
              if (draggedHandle === 'topLeft') {
                newCoords.end = currentTouch;
              } else {
                newCoords = {
                  start: currentTouch,
                  end: topLeftCorner
                };
              }
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }

      return newCoords;
    }

    /**
     * Check if user is currently dragging the handle.
     *
     * @returns {boolean} Dragging state
     */

  }, {
    key: 'isDragged',
    value: function isDragged() {
      return this.dragged.length > 0;
    }
  }]);

  return MultipleSelectionHandles;
}(_base2.default);

(0, _plugins.registerPlugin)('multipleSelectionHandles', MultipleSelectionHandles);

exports.default = MultipleSelectionHandles;