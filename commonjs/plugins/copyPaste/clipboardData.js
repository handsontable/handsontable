"use strict";

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ClipboardData = function () {
  function ClipboardData() {
    _classCallCheck(this, ClipboardData);

    this.data = {};
  }

  _createClass(ClipboardData, [{
    key: "setData",
    value: function setData(type, value) {
      this.data[type] = value;
    }
  }, {
    key: "getData",
    value: function getData(type) {
      return this.data[type] || void 0;
    }
  }]);

  return ClipboardData;
}();

exports.default = ClipboardData;