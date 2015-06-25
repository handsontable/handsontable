
import * as helper from './../helpers.js';
import * as dom from './../dom.js';
import {getEditor, registerEditor} from './../editors.js';
import {TextEditor} from './textEditor.js';
import {eventManager as eventManagerObject} from './../eventManager.js';
import moment from 'moment';
import Pikaday from 'pikaday';


/**
 * @private
 * @editor DateEditor
 * @class DateEditor
 * @dependencies TextEditor moment pikaday
 */
class DateEditor extends TextEditor {
  /**
   * @param {Core} hotInstance Handsontable instance
   */
  constructor(hotInstance) {
    this.$datePicker = null;
    this.datePicker = null;
    this.datePickerStyle = null;
    this.defaultDateFormat = 'DD/MM/YYYY';
    this.isCellEdited = false;
    this.parentDestroyed = false;

    super.constructor(hotInstance);
  }

  init() {
    if (typeof moment !== 'function') {
      throw new Error("You need to include moment.js to your project.");
    }

    if (typeof Pikaday !== 'function') {
      throw new Error("You need to include Pikaday to your project.");
    }
    super.init();
    this.instance.addHook('afterDestroy', () => {
      this.parentDestroyed = true;
      this.destroyElements();
    });
  }

  /**
   * Create data picker instance
   */
  createElements() {
    super.createElements();

    this.datePicker = document.createElement('DIV');
    this.datePickerStyle = this.datePicker.style;
    this.datePickerStyle.position = 'absolute';
    this.datePickerStyle.top = 0;
    this.datePickerStyle.left = 0;
    this.datePickerStyle.zIndex = 9999;

    dom.addClass(this.datePicker, 'htDatepickerHolder');
    document.body.appendChild(this.datePicker);

    let htInput = this.TEXTAREA;
    let defaultOptions = {
      format: this.defaultDateFormat,
      field: htInput,
      trigger: htInput,
      container: this.datePicker,
      reposition: false,
      bound: false,
      onSelect: (dateStr) => {
        if (!isNaN(dateStr.getTime())) {
          dateStr = moment(dateStr).format(this.cellProperties.dateFormat || this.defaultDateFormat);
        }
        this.setValue(dateStr);
        this.hideDatepicker();
      },
      onClose: () => {
        if (!this.parentDestroyed) {
          this.finishEditing(false);
        }
      }
    };

    this.$datePicker = new Pikaday(defaultOptions);
    const eventManager = eventManagerObject(this);

    /**
     * Prevent recognizing clicking on datepicker as clicking outside of table
     */
    eventManager.addEventListener(this.datePicker, 'mousedown', (event) => {
      helper.stopPropagation(event);
    });
    this.hideDatepicker();
  }

  /**
   * Destroy data picker instance
   */
  destroyElements() {
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
  prepare(row, col, prop, td, originalValue, cellProperties) {
    this._opened = false;
    super.prepare(row, col, prop, td, originalValue, cellProperties);
  }

  /**
   * Open editor
   *
   * @param {Event} [event=null]
   */
  open(event = null) {
    super.open();
    this.showDatepicker(event);
  }

  /**
   * Close editor
   */
  close() {
    this._opened = false;
    this.instance._registerTimeout(setTimeout(() => {
      this.instance.selection.refreshBorders();
    }, 0));

    super.close();
  }

  /**
   * @param {Boolean} [isCancelled=false]
   * @param {Boolean} [ctrlDown=false]
   */
  finishEditing(isCancelled = false, ctrlDown = false) {
    if (isCancelled) { // pressed ESC, restore original value
      // var value = this.instance.getDataAtCell(this.row, this.col);
      let value = this.originalValue;

      if (value !== void 0) {
        this.setValue(value);
      }
    }
    this.hideDatepicker();
    super.finishEditing(isCancelled, ctrlDown);
  }

  /**
   * Show data picker
   *
   * @param {Event} event
   */
  showDatepicker(event) {
    let offset = this.TD.getBoundingClientRect();
    let dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat;
    let datePickerConfig = this.$datePicker.config();
    let dateStr;
    let isMouseDown = this.instance.view.isMouseDown();
    let isMeta = event ? helper.isMetaKey(event.keyCode) : false;

    this.datePickerStyle.top = (window.pageYOffset + offset.top + dom.outerHeight(this.TD)) + 'px';
    this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';

    this.$datePicker._onInputFocus = function() {};
    datePickerConfig.format = dateFormat;

    if (this.originalValue) {
      dateStr = this.originalValue;

      if (moment(dateStr, dateFormat, true).isValid()) {
        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
      }
      if (!isMeta && !isMouseDown) {
        this.setValue('');
      }

    } else {
      if (this.cellProperties.defaultDate) {
        dateStr = this.cellProperties.defaultDate;

        datePickerConfig.defaultDate = dateStr;

        if (moment(dateStr, dateFormat, true).isValid()) {
          this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
        }

        if (!isMeta && !isMouseDown) {
          this.setValue('');
        }
      } else {
        // if a default date is not defined, set a soft-default-date: display the current day and month in the
        // datepicker, but don't fill the editor input
        this.$datePicker.gotoToday();
      }
    }

    this.datePickerStyle.display = 'block';
    this.$datePicker.show();
  }

  /**
   * Hide data picker
   */
  hideDatepicker() {
    this.datePickerStyle.display = 'none';
    this.$datePicker.hide();
  }
}

export {DateEditor};

registerEditor('date', DateEditor);
