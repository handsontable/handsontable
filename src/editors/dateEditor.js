
import * as helper from './../helpers.js';
import * as dom from './../dom.js';
import {getEditor, registerEditor} from './../editors.js';
import {TextEditor} from './textEditor.js';
import {eventManager as eventManagerObject} from './../eventManager.js';
import moment from 'moment';
import Pikaday from 'pikaday';

var DateEditor = TextEditor.prototype.extend();

export {DateEditor};

Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.DateEditor = DateEditor;

/**
 * @private
 * @editor
 * @class DateEditor
 * @dependencies TextEditor moment pikaday
 */
DateEditor.prototype.init = function() {
  if (typeof moment !== 'function') {
    throw new Error("You need to include moment.js to your project.");
  }

  if (typeof Pikaday !== 'function') {
    throw new Error("You need to include Pikaday to your project.");
  }
  TextEditor.prototype.init.apply(this, arguments);

  this.isCellEdited = false;
  var that = this;

  this.instance.addHook('afterDestroy', function() {
    that.parentDestroyed = true;
    that.destroyElements();
  });
};

DateEditor.prototype.createElements = function() {
  var that = this;
  TextEditor.prototype.createElements.apply(this, arguments);

  this.defaultDateFormat = 'DD/MM/YYYY';
  this.datePicker = document.createElement('DIV');
  this.datePickerStyle = this.datePicker.style;
  this.datePickerStyle.position = 'absolute';
  this.datePickerStyle.top = 0;
  this.datePickerStyle.left = 0;
  this.datePickerStyle.zIndex = 9999;

  dom.addClass(this.datePicker, 'htDatepickerHolder');
  document.body.appendChild(this.datePicker);

  var htInput = this.TEXTAREA;

  var defaultOptions = {
    format: that.defaultDateFormat,
    field: htInput,
    trigger: htInput,
    container: that.datePicker,
    reposition: false,
    bound: false,
    onSelect: function(dateStr) {
      if (!isNaN(dateStr.getTime())) {
        dateStr = moment(dateStr).format(that.cellProperties.dateFormat || that.defaultDateFormat);
      }
      that.setValue(dateStr);
      that.hideDatepicker();
    },
    onClose: function() {
      if (!that.parentDestroyed) {
        that.finishEditing(false);
      }
    }
  };

  this.$datePicker = new Pikaday(defaultOptions);

  var eventManager = eventManagerObject(this);

  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table
   */
  eventManager.addEventListener(this.datePicker, 'mousedown', function(event) {
    helper.stopPropagation(event);
  });

  this.hideDatepicker();
};

DateEditor.prototype.destroyElements = function() {
  this.$datePicker.destroy();
};

DateEditor.prototype.prepare = function() {
  this._opened = false;
  TextEditor.prototype.prepare.apply(this, arguments);
};

DateEditor.prototype.open = function(event) {
  TextEditor.prototype.open.call(this);
  this.showDatepicker(event);
};

DateEditor.prototype.close = function() {
  var that = this;
  this._opened = false;
  this.instance._registerTimeout(setTimeout(function() {
    that.instance.selection.refreshBorders();
  }, 0));

  TextEditor.prototype.close.apply(this, arguments);
};

DateEditor.prototype.finishEditing = function(isCancelled, ctrlDown) {
  if (isCancelled) { // pressed ESC, restore original value
    //var value = this.instance.getDataAtCell(this.row, this.col);
    var value = this.originalValue;
    if (value !== void 0) {
      this.setValue(value);
    }
  }

  this.hideDatepicker();
  TextEditor.prototype.finishEditing.apply(this, arguments);
};

DateEditor.prototype.showDatepicker = function(event) {
  var offset = this.TD.getBoundingClientRect(),
    dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat,
    datePickerConfig = this.$datePicker.config(),
    dateStr,
    isMouseDown = this.instance.view.isMouseDown(),
    isMeta = event ? helper.isMetaKey(event.keyCode) : false;

  this.datePickerStyle.top = (window.pageYOffset + offset.top + dom.outerHeight(this.TD)) + 'px';
  this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';

  this.$datePicker._onInputFocus = function() {};
  datePickerConfig.format = dateFormat;

  if (this.originalValue) {
    dateStr = this.originalValue;

    if (moment(dateStr, dateFormat, true).isValid()) {
      this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
    }

    if (!isMeta) {
      if (!isMouseDown) {
        this.setValue('');
      }
    }

  } else {
    if (this.cellProperties.defaultDate) {
      dateStr = this.cellProperties.defaultDate;

      datePickerConfig.defaultDate = dateStr;

      if (moment(dateStr, dateFormat, true).isValid()) {
        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
      }

      if (!isMeta) {
        if (!isMouseDown) {
          this.setValue('');
        }
      }
    } else {
      // if a default date is not defined, set a soft-default-date: display the current day and month in the datepicker, but don't fill the editor input
      this.$datePicker.gotoToday();
    }
  }

  this.datePickerStyle.display = 'block';
  this.$datePicker.show();
};

DateEditor.prototype.hideDatepicker = function() {
  this.datePickerStyle.display = 'none';
  this.$datePicker.hide();
};


registerEditor('date', DateEditor);
