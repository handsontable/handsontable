var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import AutocompleteEditor from './autocompleteEditor';
import Hooks from './../pluginHooks';

/**
 * @private
 * @editor DropdownEditor
 * @class DropdownEditor
 * @dependencies AutocompleteEditor
 */

var DropdownEditor = function (_AutocompleteEditor) {
  _inherits(DropdownEditor, _AutocompleteEditor);

  function DropdownEditor() {
    _classCallCheck(this, DropdownEditor);

    return _possibleConstructorReturn(this, (DropdownEditor.__proto__ || Object.getPrototypeOf(DropdownEditor)).apply(this, arguments));
  }

  _createClass(DropdownEditor, [{
    key: 'prepare',
    value: function prepare(row, col, prop, td, originalValue, cellProperties) {
      _get(DropdownEditor.prototype.__proto__ || Object.getPrototypeOf(DropdownEditor.prototype), 'prepare', this).call(this, row, col, prop, td, originalValue, cellProperties);
      this.cellProperties.filter = false;
      this.cellProperties.strict = true;
    }
  }]);

  return DropdownEditor;
}(AutocompleteEditor);

Hooks.getSingleton().add('beforeValidate', function (value, row, col) {
  var cellMeta = this.getCellMeta(row, this.propToCol(col));

  if (cellMeta.editor === DropdownEditor) {
    if (cellMeta.strict === void 0) {
      cellMeta.filter = false;
      cellMeta.strict = true;
    }
  }
});

export default DropdownEditor;