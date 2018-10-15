'use strict';

exports.__esModule = true;

var _textEditor = require('./textEditor');

var _textEditor2 = _interopRequireDefault(_textEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 * @editor NumericEditor
 * @class NumericEditor
 */
var NumericEditor = function (_TextEditor) {
  _inherits(NumericEditor, _TextEditor);

  function NumericEditor() {
    _classCallCheck(this, NumericEditor);

    return _possibleConstructorReturn(this, (NumericEditor.__proto__ || Object.getPrototypeOf(NumericEditor)).apply(this, arguments));
  }

  return NumericEditor;
}(_textEditor2.default);

exports.default = NumericEditor;