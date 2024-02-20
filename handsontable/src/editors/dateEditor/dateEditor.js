import moment from 'moment';
import Pikaday from '@handsontable/pikaday';
import { TextEditor } from '../textEditor';
import { addClass, hasClass, outerHeight, outerWidth } from '../../helpers/dom/element';
import { deepExtend } from '../../helpers/object';
import { isFunctionKey } from '../../helpers/unicode';

import '@handsontable/pikaday/css/pikaday.css';

export const EDITOR_TYPE = 'date';
const SHORTCUTS_GROUP_EDITOR = 'dateEditor';

/**
 * @private
 * @class DateEditor
 */
export class DateEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  // TODO: Move this option to general settings
  /**
   * @type {string}
   */
  defaultDateFormat = 'DD/MM/YYYY';
  /**
   * @type {boolean}
   */
  parentDestroyed = false;
  /**
   * @type {Pikaday}
   */
  $datePicker = null;

  init() {
    if (typeof moment !== 'function') {
      throw new Error('You need to include moment.js to your project.');
    }

    if (typeof Pikaday !== 'function') {
      throw new Error('You need to include Pikaday to your project.');
    }
    super.init();
    this.hot.addHook('afterDestroy', () => {
      this.parentDestroyed = true;
      this.destroyElements();
    });
  }

  /**
   * Create data picker instance.
   */
  createElements() {
    super.createElements();

    this.datePicker = this.hot.rootDocument.createElement('DIV');
    this.datePickerStyle = this.datePicker.style;
    this.datePickerStyle.position = 'absolute';
    this.datePickerStyle.top = 0;
    this.datePickerStyle.left = 0;
    this.datePickerStyle.zIndex = 9999;

    this.datePicker.setAttribute('dir', this.hot.isRtl() ? 'rtl' : 'ltr');

    addClass(this.datePicker, 'htDatepickerHolder');
    this.hot.rootDocument.body.appendChild(this.datePicker);

    /**
     * Prevent recognizing clicking on datepicker as clicking outside of table.
     */
    this.eventManager.addEventListener(this.datePicker, 'mousedown', (event) => {
      if (hasClass(event.target, 'pika-day')) {
        this.hideDatepicker();
      }

      event.stopPropagation();
    });
  }

  /**
   * Destroy data picker instance.
   */
  destroyElements() {
    const datePickerParentElement = this.datePicker.parentNode;

    if (this.$datePicker) {
      this.$datePicker.destroy();
    }

    if (datePickerParentElement) {
      datePickerParentElement.removeChild(this.datePicker);
    }
  }

  /**
   * Prepare editor to appear.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
   */
  prepare(row, col, prop, td, value, cellProperties) {
    super.prepare(row, col, prop, td, value, cellProperties);
  }

  /**
   * Open editor.
   *
   * @param {Event} [event=null] The event object.
   */
  open(event = null) {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    super.open();
    this.showDatepicker(event);

    editorContext.addShortcuts([{
      keys: [['ArrowLeft']],
      callback: () => {
        this.$datePicker.adjustDate('subtract', 1);
      },
    }, {
      keys: [['ArrowRight']],
      callback: () => {
        this.$datePicker.adjustDate('add', 1);
      },
    }, {
      keys: [['ArrowUp']],
      callback: () => {
        this.$datePicker.adjustDate('subtract', 7);
      },
    }, {
      keys: [['ArrowDown']],
      callback: () => {
        this.$datePicker.adjustDate('add', 7);
      },
    }], {
      group: SHORTCUTS_GROUP_EDITOR,
    });
  }

  /**
   * Close editor.
   */
  close() {
    this._opened = false;

    // If the date picker was never initialized (e.g. during autofill), there's nothing to destroy.
    if (this.$datePicker?.destroy) {
      this.$datePicker.destroy();
    }

    this.hot._registerTimeout(() => {
      this.hot._refreshBorders();
    });

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP_EDITOR);

    super.close();
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   */
  finishEditing(restoreOriginalValue = false, ctrlDown = false) {
    super.finishEditing(restoreOriginalValue, ctrlDown);
  }

  /**
   * Show data picker.
   *
   * @param {Event} event The event object.
   */
  showDatepicker(event) {
    const offset = this.TD.getBoundingClientRect();
    const dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat;
    const isMouseDown = this.hot.view.isMouseDown();
    const isMeta = event ? isFunctionKey(event.keyCode) : false;
    let dateStr;

    this.datePicker.style.display = 'block';

    this.$datePicker = new Pikaday(this.getDatePickerConfig());

    if (typeof this.$datePicker.useMoment === 'function') {
      this.$datePicker.useMoment(moment);
    }

    this.$datePicker._onInputFocus = function() {};

    this.datePickerStyle.top = `${this.hot.rootWindow.pageYOffset + offset.top + outerHeight(this.TD)}px`;

    let pickerLeftPosition = this.hot.rootWindow.pageXOffset;

    if (this.hot.isRtl()) {
      pickerLeftPosition = offset.right - outerWidth(this.datePicker);
    } else {
      pickerLeftPosition = offset.left;
    }

    this.datePickerStyle.left = `${pickerLeftPosition}px`;

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

  /**
   * Hide data picker.
   */
  hideDatepicker() {
    this.datePickerStyle.display = 'none';
    this.$datePicker.hide();
  }

  /**
   * Get date picker options.
   *
   * @returns {object}
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
    options.keyboardInput = false;
    options.format = options.format || this.defaultDateFormat;
    options.reposition = options.reposition || false;
    // Set the RTL to `false`. Due to the https://github.com/Pikaday/Pikaday/issues/647 bug, the layout direction
    // of the date picker is controlled by juggling the "dir" attribute of the root date picker element.
    // See line @64 of this file.
    options.isRTL = false;
    options.onSelect = (value) => {
      let dateStr = value;

      if (!isNaN(dateStr.getTime())) {
        dateStr = moment(dateStr).format(this.cellProperties.dateFormat || this.defaultDateFormat);
      }

      this.setValue(dateStr);

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
