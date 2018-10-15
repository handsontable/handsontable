var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BaseEditor from './_baseEditor';
import { hasClass } from './../helpers/dom/element';

/**
 * @private
 * @editor CheckboxEditor
 * @class CheckboxEditor
 */

var CheckboxEditor = function (_BaseEditor) {
  _inherits(CheckboxEditor, _BaseEditor);

  function CheckboxEditor() {
    _classCallCheck(this, CheckboxEditor);

    return _possibleConstructorReturn(this, (CheckboxEditor.__proto__ || Object.getPrototypeOf(CheckboxEditor)).apply(this, arguments));
  }

  _createClass(CheckboxEditor, [{
    key: 'beginEditing',
    value: function beginEditing(initialValue, event) {
      // Just some events connected with checkbox editor are delegated here. Some `keydown` events like `enter` and `space` key press
      // are handled inside `checkboxRenderer`. Some events come here from `editorManager`. Below `if` statement was created by author
      // for purpose of handling only `doubleclick` event which may be done on a cell with checkbox.

      if (event && event.type === 'mouseup') {
        var checkbox = this.TD.querySelector('input[type="checkbox"]');

        if (!hasClass(checkbox, 'htBadValue')) {
          checkbox.click();
        }
      }
    }
  }, {
    key: 'finishEditing',
    value: function finishEditing() {}
  }, {
    key: 'init',
    value: function init() {}
  }, {
    key: 'open',
    value: function open() {}
  }, {
    key: 'close',
    value: function close() {}
  }, {
    key: 'getValue',
    value: function getValue() {}
  }, {
    key: 'setValue',
    value: function setValue() {}
  }, {
    key: 'focus',
    value: function focus() {}
  }]);

  return CheckboxEditor;
}(BaseEditor);

export default CheckboxEditor;