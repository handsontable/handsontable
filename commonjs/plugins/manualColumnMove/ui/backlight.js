'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _base = require('./_base');

var _base2 = _interopRequireDefault(_base);

var _element = require('./../../../helpers/dom/element');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CSS_CLASSNAME = 'ht__manualColumnMove--backlight';

/**
 * @class BacklightUI
 * @util
 */

var BacklightUI = function (_BaseUI) {
  _inherits(BacklightUI, _BaseUI);

  function BacklightUI() {
    _classCallCheck(this, BacklightUI);

    return _possibleConstructorReturn(this, (BacklightUI.__proto__ || Object.getPrototypeOf(BacklightUI)).apply(this, arguments));
  }

  _createClass(BacklightUI, [{
    key: 'build',

    /**
     * Custom className on build process.
     */
    value: function build() {
      _get(BacklightUI.prototype.__proto__ || Object.getPrototypeOf(BacklightUI.prototype), 'build', this).call(this);

      (0, _element.addClass)(this._element, CSS_CLASSNAME);
    }
  }]);

  return BacklightUI;
}(_base2.default);

exports.default = BacklightUI;