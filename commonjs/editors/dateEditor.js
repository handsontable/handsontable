'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _pikaday = require('pikaday');

var _pikaday2 = _interopRequireDefault(_pikaday);

var _element = require('./../helpers/dom/element');

var _object = require('./../helpers/object');

var _eventManager = require('./../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _unicode = require('./../helpers/unicode');

var _event = require('./../helpers/dom/event');

var _textEditor = require('./textEditor');

var _textEditor2 = _interopRequireDefault(_textEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 * @editor DateEditor
 * @class DateEditor
 * @dependencies TextEditor moment pikaday
 */
var DateEditor = function (_TextEditor) {
  _inherits(DateEditor, _TextEditor);

  /**
   * @param {Core} hotInstance Handsontable instance
   * @private
   */
  function DateEditor(hotInstance) {
    _classCallCheck(this, DateEditor);

    // TODO: Move this option to general settings
    var _this = _possibleConstructorReturn(this, (DateEditor.__proto__ || Object.getPrototypeOf(DateEditor)).call(this, hotInstance));

    _this.defaultDateFormat = 'DD/MM/YYYY';
    _this.isCellEdited = false;
    _this.parentDestroyed = false;
    return _this;
  }

  _createClass(DateEditor, [{
    key: 'init',
    value: function init() {
      var _this2 = this;

      if (typeof _moment2.default !== 'function') {
        throw new Error('You need to include moment.js to your project.');
      }

      if (typeof _pikaday2.default !== 'function') {
        throw new Error('You need to include Pikaday to your project.');
      }
      _get(DateEditor.prototype.__proto__ || Object.getPrototypeOf(DateEditor.prototype), 'init', this).call(this);
      this.instance.addHook('afterDestroy', function () {
        _this2.parentDestroyed = true;
        _this2.destroyElements();
      });
    }

    /**
     * Create data picker instance
     */

  }, {
    key: 'createElements',
    value: function createElements() {
      _get(DateEditor.prototype.__proto__ || Object.getPrototypeOf(DateEditor.prototype), 'createElements', this).call(this);

      this.datePicker = document.createElement('DIV');
      this.datePickerStyle = this.datePicker.style;
      this.datePickerStyle.position = 'absolute';
      this.datePickerStyle.top = 0;
      this.datePickerStyle.left = 0;
      this.datePickerStyle.zIndex = 9999;

      (0, _element.addClass)(this.datePicker, 'htDatepickerHolder');
      document.body.appendChild(this.datePicker);

      this.$datePicker = new _pikaday2.default(this.getDatePickerConfig());
      var eventManager = new _eventManager2.default(this);

      /**
       * Prevent recognizing clicking on datepicker as clicking outside of table
       */
      eventManager.addEventListener(this.datePicker, 'mousedown', function (event) {
        return (0, _event.stopPropagation)(event);
      });
      this.hideDatepicker();
    }

    /**
     * Destroy data picker instance
     */

  }, {
    key: 'destroyElements',
    value: function destroyElements() {
      this.$datePicker.destroy();
    }

    /**
     * Prepare editor to appear
     *
     * @param {Number} row Row index
     * @param {Number} col Column index
     * @param {String} prop Property name (passed when datasource is an array of objects)
     * @param {HTMLTableCellElement} td Table cell element
     * @param {*} originalValue Original value
     * @param {Object} cellProperties Object with cell properties ({@see Core#getCellMeta})
     */

  }, {
    key: 'prepare',
    value: function prepare(row, col, prop, td, originalValue, cellProperties) {
      this._opened = false;
      _get(DateEditor.prototype.__proto__ || Object.getPrototypeOf(DateEditor.prototype), 'prepare', this).call(this, row, col, prop, td, originalValue, cellProperties);
    }

    /**
     * Open editor
     *
     * @param {Event} [event=null]
     */

  }, {
    key: 'open',
    value: function open() {
      var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      _get(DateEditor.prototype.__proto__ || Object.getPrototypeOf(DateEditor.prototype), 'open', this).call(this);
      this.showDatepicker(event);
    }

    /**
     * Close editor
     */

  }, {
    key: 'close',
    value: function close() {
      var _this3 = this;

      this._opened = false;
      this.instance._registerTimeout(function () {
        _this3.instance._refreshBorders();
      });

      _get(DateEditor.prototype.__proto__ || Object.getPrototypeOf(DateEditor.prototype), 'close', this).call(this);
    }

    /**
     * @param {Boolean} [isCancelled=false]
     * @param {Boolean} [ctrlDown=false]
     */

  }, {
    key: 'finishEditing',
    value: function finishEditing() {
      var isCancelled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var ctrlDown = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (isCancelled) {
        // pressed ESC, restore original value
        // var value = this.instance.getDataAtCell(this.row, this.col);
        var value = this.originalValue;

        if (value !== void 0) {
          this.setValue(value);
        }
      }
      this.hideDatepicker();
      _get(DateEditor.prototype.__proto__ || Object.getPrototypeOf(DateEditor.prototype), 'finishEditing', this).call(this, isCancelled, ctrlDown);
    }

    /**
     * Show data picker
     *
     * @param {Event} event
     */

  }, {
    key: 'showDatepicker',
    value: function showDatepicker(event) {
      this.$datePicker.config(this.getDatePickerConfig());

      var offset = this.TD.getBoundingClientRect();
      var dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat;
      var datePickerConfig = this.$datePicker.config();
      var dateStr = void 0;
      var isMouseDown = this.instance.view.isMouseDown();
      var isMeta = event ? (0, _unicode.isMetaKey)(event.keyCode) : false;

      this.datePickerStyle.top = window.pageYOffset + offset.top + (0, _element.outerHeight)(this.TD) + 'px';
      this.datePickerStyle.left = window.pageXOffset + offset.left + 'px';

      this.$datePicker._onInputFocus = function () {};
      datePickerConfig.format = dateFormat;

      if (this.originalValue) {
        dateStr = this.originalValue;

        if ((0, _moment2.default)(dateStr, dateFormat, true).isValid()) {
          this.$datePicker.setMoment((0, _moment2.default)(dateStr, dateFormat), true);
        }

        // workaround for date/time cells - pikaday resets the cell value to 12:00 AM by default, this will overwrite the value.
        if (this.getValue() !== this.originalValue) {
          this.setValue(this.originalValue);
        }

        if (!isMeta && !isMouseDown) {
          this.setValue('');
        }
      } else if (this.cellProperties.defaultDate) {
        dateStr = this.cellProperties.defaultDate;

        datePickerConfig.defaultDate = dateStr;

        if ((0, _moment2.default)(dateStr, dateFormat, true).isValid()) {
          this.$datePicker.setMoment((0, _moment2.default)(dateStr, dateFormat), true);
        }

        if (!isMeta && !isMouseDown) {
          this.setValue('');
        }
      } else {
        // if a default date is not defined, set a soft-default-date: display the current day and month in the
        // datepicker, but don't fill the editor input
        this.$datePicker.gotoToday();
      }

      this.datePickerStyle.display = 'block';
      this.$datePicker.show();
    }

    /**
     * Hide data picker
     */

  }, {
    key: 'hideDatepicker',
    value: function hideDatepicker() {
      this.datePickerStyle.display = 'none';
      this.$datePicker.hide();
    }

    /**
     * Get date picker options.
     *
     * @returns {Object}
     */

  }, {
    key: 'getDatePickerConfig',
    value: function getDatePickerConfig() {
      var _this4 = this;

      var htInput = this.TEXTAREA;
      var options = {};

      if (this.cellProperties && this.cellProperties.datePickerConfig) {
        (0, _object.deepExtend)(options, this.cellProperties.datePickerConfig);
      }
      var origOnSelect = options.onSelect;
      var origOnClose = options.onClose;

      options.field = htInput;
      options.trigger = htInput;
      options.container = this.datePicker;
      options.bound = false;
      options.format = options.format || this.defaultDateFormat;
      options.reposition = options.reposition || false;
      options.onSelect = function (value) {
        var dateStr = value;

        if (!isNaN(dateStr.getTime())) {
          dateStr = (0, _moment2.default)(dateStr).format(_this4.cellProperties.dateFormat || _this4.defaultDateFormat);
        }
        _this4.setValue(dateStr);
        _this4.hideDatepicker();

        if (origOnSelect) {
          origOnSelect();
        }
      };
      options.onClose = function () {
        if (!_this4.parentDestroyed) {
          _this4.finishEditing(false);
        }
        if (origOnClose) {
          origOnClose();
        }
      };

      return options;
    }
  }]);

  return DateEditor;
}(_textEditor2.default);

exports.default = DateEditor;