'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _element = require('./../helpers/dom/element');

var _textEditor = require('./textEditor');

var _textEditor2 = _interopRequireDefault(_textEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 * @editor PasswordEditor
 * @class PasswordEditor
 * @dependencies TextEditor
 */
var PasswordEditor = function (_TextEditor) {
  _inherits(PasswordEditor, _TextEditor);

  function PasswordEditor() {
    _classCallCheck(this, PasswordEditor);

    return _possibleConstructorReturn(this, (PasswordEditor.__proto__ || Object.getPrototypeOf(PasswordEditor)).apply(this, arguments));
  }

  _createClass(PasswordEditor, [{
    key: 'createElements',
    value: function createElements() {
      _get(PasswordEditor.prototype.__proto__ || Object.getPrototypeOf(PasswordEditor.prototype), 'createElements', this).call(this);

      this.TEXTAREA = document.createElement('input');
      this.TEXTAREA.setAttribute('type', 'password');
      this.TEXTAREA.className = 'handsontableInput';
      this.textareaStyle = this.TEXTAREA.style;
      this.textareaStyle.width = 0;
      this.textareaStyle.height = 0;

      (0, _element.empty)(this.TEXTAREA_PARENT);
      this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
    }
  }]);

  return PasswordEditor;
}(_textEditor2.default);

exports.default = PasswordEditor;