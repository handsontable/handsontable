'use strict';

var _window = require('window');

var _window2 = _interopRequireDefault(_window);

var _common = require('./common');

var common = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Export all helpers to the window.
/* eslint-disable import/no-unresolved */
Object.keys(common).forEach(function (key) {
  _window2.default[key] = common[key];
});