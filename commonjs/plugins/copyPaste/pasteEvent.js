'use strict';

exports.__esModule = true;

var _clipboardData = require('./clipboardData');

var _clipboardData2 = _interopRequireDefault(_clipboardData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PasteEvent = function PasteEvent() {
  _classCallCheck(this, PasteEvent);

  this.clipboardData = new _clipboardData2.default();
};

exports.default = PasteEvent;