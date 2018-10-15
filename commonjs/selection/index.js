'use strict';

exports.__esModule = true;
exports.normalizeSelectionFactory = exports.detectSelectionType = exports.Selection = exports.Highlight = exports.handleMouseEvent = undefined;

var _highlight = require('./highlight/highlight');

var _highlight2 = _interopRequireDefault(_highlight);

var _selection = require('./selection');

var _selection2 = _interopRequireDefault(_selection);

var _mouseEventHandler = require('./mouseEventHandler');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.handleMouseEvent = _mouseEventHandler.handleMouseEvent;
exports.Highlight = _highlight2.default;
exports.Selection = _selection2.default;
exports.detectSelectionType = _utils.detectSelectionType;
exports.normalizeSelectionFactory = _utils.normalizeSelectionFactory;