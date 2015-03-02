
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

DateEditor.prototype.init = function () {
  if (typeof moment !== 'function') {
    throw new Error("You need to include moment.js to your project.");
  }

  if (typeof Pikaday !== 'function') {
    throw new Error("You need to include Pikaday to your project.");
  }
  TextEditor.prototype.init.apply(this, arguments);

  this.isCellEdited = false;
  var that = this;

  this.instance.addHook('afterDestroy', function () {
    that.parentDestroyed = true;
    that.destroyElements();
  });
};

DateEditor.prototype.createElements = function () {
  TextEditor.prototype.createElements.apply(this, arguments);

  this.defaultDatepickerTrigger = document.querySelector('.handsontableInput');

  this.defaultDateFormat = 'MM/DD/YYYY';

  this.datePicker = document.createElement('DIV');
  dom.addClass(this.datePicker, 'htDatepickerHolder');
  this.datePickerStyle = this.datePicker.style;
  this.datePickerStyle.position = 'absolute';
  this.datePickerStyle.top = 0;
  this.datePickerStyle.left = 0;
  this.datePickerStyle.zIndex = 99;
  document.body.appendChild(this.datePicker);

  var that = this;


  var defaultOptions = {
    format: that.defaultDateFormat,
    field: document.querySelector('.handsontableInput'),
    trigger: document.querySelector('.handsontableInput'),
    container: that.datePicker,
    reposition: false,
    onSelect: function (dateStr) {
      if (!isNaN(dateStr.getTime())) {
        dateStr = moment(dateStr).format(that.cellProperties.dateFormat || that.defaultDateFormat);
      }
      that.setValue(dateStr);
    },
    onClose: function () {
      if(!that.parentDestroyed) {
        that.finishEditing(false);
      }
    }
  };

  this.$datePicker = new Pikaday(defaultOptions);

  var eventManager = eventManagerObject(this);

  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table
   */
  eventManager.addEventListener(this.datePicker, 'mousedown', function (event) {
    Handsontable.helper.stopPropagation(event);
  });

  this.hideDatepicker();
};

  DateEditor.prototype.destroyElements = function () {
    this.$datePicker.destroy();
  };

DateEditor.prototype.prepare = function () {
  this._opened = false;
  TextEditor.prototype.prepare.apply(this, arguments);
};

DateEditor.prototype.open = function () {
  TextEditor.prototype.open.call(this);
  this.showDatepicker();
};

DateEditor.prototype.close = function () {
  this._opened = false;
  TextEditor.prototype.close.apply(this, arguments);
};

DateEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
  this.hideDatepicker();
  TextEditor.prototype.finishEditing.apply(this, arguments);
};

DateEditor.prototype.showDatepicker = function () {
  var offset = this.TD.getBoundingClientRect(),
    that = this;

  this.datePickerStyle.top = (window.pageYOffset + offset.top + dom.outerHeight(this.TD)) + 'px';
  this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';

  if (this.originalValue) {
    this.$datePicker.setDate(this.originalValue, true);
    this.setValue(this.originalValue);
  }

  // temporary assign a different 'trigger' value, to prevent Pikaday from closing right after opening
  this.$datePicker.config().trigger = document.querySelector('.htAutocomplete.current');

  this.datePickerStyle.display = 'block';
  this.$datePicker.show();

  this.instance._registerTimeout(setTimeout(function () {
    that.$datePicker.config().trigger = that.defaultDatepickerTrigger;
  }, 50));
};

DateEditor.prototype.hideDatepicker = function () {
  this.datePickerStyle.display = 'none';
  this.$datePicker.hide();
};


registerEditor('date', DateEditor);
