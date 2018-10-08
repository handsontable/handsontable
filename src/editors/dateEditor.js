import moment from 'moment';
import Pikaday from 'pikaday';
import 'pikaday/css/pikaday.css';
import { addClass, outerHeight } from './../helpers/dom/element';
import { deepExtend } from './../helpers/object';
import EventManager from './../eventManager';
import { isMetaKey } from './../helpers/unicode';
import { stopPropagation } from './../helpers/dom/event';
import TextEditor from './textEditor';

/**
 * @private
 * @editor DateEditor
 * @class DateEditor
 * @dependencies TextEditor moment pikaday
 */
class DateEditor extends TextEditor {
  /**
   * @param {Core} hotInstance Handsontable instance
   * @private
   */
  constructor(hotInstance) {
    super(hotInstance);

    // TODO: Move this option to general settings
    this.defaultDateFormat = 'DD/MM/YYYY';
    this.isCellEdited = false;
    this.parentDestroyed = false;
  }

  init() {
    if (typeof moment !== 'function') {
      throw new Error('You need to include moment.js to your project.');
    }

    if (typeof Pikaday !== 'function') {
      throw new Error('You need to include Pikaday to your project.');
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

    addClass(this.datePicker, 'htDatepickerHolder');
    document.body.appendChild(this.datePicker);

    this.$datePicker = new Pikaday(this.getDatePickerConfig());
    const eventManager = new EventManager(this);

    /**
     * Prevent recognizing clicking on datepicker as clicking outside of table
     */
    eventManager.addEventListener(this.datePicker, 'mousedown', event => stopPropagation(event));
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
    this.instance._registerTimeout(() => {
      this.instance._refreshBorders();
    });

    super.close();
  }

  /**
   * @param {Boolean} [isCancelled=false]
   * @param {Boolean} [ctrlDown=false]
   */
  finishEditing(isCancelled = false, ctrlDown = false) {
    if (isCancelled) { // pressed ESC, restore original value
      // var value = this.instance.getDataAtCell(this.row, this.col);
      const value = this.originalValue;

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
    this.$datePicker.config(this.getDatePickerConfig());

    const offset = this.TD.getBoundingClientRect();
    const dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat;
    const datePickerConfig = this.$datePicker.config();
    let dateStr;
    const isMouseDown = this.instance.view.isMouseDown();
    const isMeta = event ? isMetaKey(event.keyCode) : false;

    this.datePickerStyle.top = `${window.pageYOffset + offset.top + outerHeight(this.TD)}px`;
    this.datePickerStyle.left = `${window.pageXOffset + offset.left}px`;

    this.$datePicker._onInputFocus = function() {};
    datePickerConfig.format = dateFormat;

    if (this.originalValue) {
      dateStr = this.originalValue;

      if (moment(dateStr, dateFormat, true).isValid()) {
        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
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

  /**
   * Get date picker options.
   *
   * @returns {Object}
   */
  getDatePickerConfig() {
    const htInput = this.TEXTAREA;
    const options = {};

    if (this.cellProperties && this.cellProperties.datePickerConfig) {
      deepExtend(options, this.cellProperties.datePickerConfig);
    }
    const origOnSelect = options.onSelect;
    const origOnClose = options.onClose;

    options.field = htInput;
    options.trigger = htInput;
    options.container = this.datePicker;
    options.bound = false;
    options.format = options.format || this.defaultDateFormat;
    options.reposition = options.reposition || false;
    options.onSelect = (value) => {
      let dateStr = value;

      if (!isNaN(dateStr.getTime())) {
        dateStr = moment(dateStr).format(this.cellProperties.dateFormat || this.defaultDateFormat);
      }
      this.setValue(dateStr);
      this.hideDatepicker();

      if (origOnSelect) {
        origOnSelect();
      }
    };
    options.onClose = () => {
      if (!this.parentDestroyed) {
        this.finishEditing(false);
      }
      if (origOnClose) {
        origOnClose();
      }
    };

    return options;
  }
}

export default DateEditor;
