(function (Handsontable) {
  var DateEditor = Handsontable.editors.TextEditor.prototype.extend();

  DateEditor.prototype.init = function () {
    if (typeof moment !== 'function') {
      throw new Error("You need to include moment.js to your project.");
    }

    if (typeof Pikaday !== 'function') {
      throw new Error("You need to include Pikaday to your project.");
    }

    Handsontable.editors.TextEditor.prototype.init.apply(this, arguments);

    this.isCellEdited = false;
    var that = this;

    this.instance.addHook('afterDestroy', function () {
      that.parentDestroyed = true;
      that.destroyElements();
    });
  };

  DateEditor.prototype.createElements = function () {
    var that = this;

    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    this.defaultDatepickerTrigger = document.querySelector('.handsontableInput');

    this.defaultDateFormat = 'DD/MM/YYYY';

    this.datePicker = document.createElement('DIV');
    Handsontable.Dom.addClass(this.datePicker, 'htDatepickerHolder');
    this.datePickerStyle = this.datePicker.style;
    this.datePickerStyle.position = 'absolute';
    this.datePickerStyle.top = 0;
    this.datePickerStyle.left = 0;
    this.datePickerStyle.zIndex = 9999;
    document.body.appendChild(this.datePicker);

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

    var eventManager = Handsontable.eventManager(this);

    /**
     * Prevent recognizing clicking on datepicker as clicking outside of table
     */
    eventManager.addEventListener(this.datePicker, 'mousedown', function (event) {
      Handsontable.helper.stopPropagation(event);
    });

    //this.hideDatepicker();
  };

  DateEditor.prototype.destroyElements = function () {
    this.$datePicker.destroy();
  };

  DateEditor.prototype.prepare = function () {
    this._opened = false;
    Handsontable.editors.TextEditor.prototype.prepare.apply(this, arguments);
  };

  DateEditor.prototype.open = function () {
    Handsontable.editors.TextEditor.prototype.open.call(this);
    this.showDatepicker();
  };

  DateEditor.prototype.close = function () {
    var that = this;
    this._opened = false;
    this.instance._registerTimeout(setTimeout(function () {
      that.instance.selection.refreshBorders();
    }, 0));

    Handsontable.editors.TextEditor.prototype.close.apply(this, arguments);
  };

  DateEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
    if (isCancelled) { // pressed ESC, restore original value
      var value = this.instance.getDataAtCell(this.row, this.col);
      if (value !== void 0) {
        this.setValue(value);
      }
    }

    this.hideDatepicker();
    Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  DateEditor.prototype.showDatepicker = function () {
    var offset = this.TD.getBoundingClientRect(),
      that = this,
      dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat,
      datePickerConfig = this.$datePicker.config(),
      dateStr;

    this.datePickerStyle.top = (window.pageYOffset + offset.top + Handsontable.Dom.outerHeight(this.TD)) + 3 + 'px';
    this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';

    this.$datePicker._onInputFocus = function () {};
    datePickerConfig.format = dateFormat;

    if (this.originalValue) {
      dateStr = this.originalValue;

      this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
      this.setValue(dateStr);
    } else {
      if (this.cellProperties.defaultDate) {
        dateStr = this.cellProperties.defaultDate;

        datePickerConfig.defaultDate = dateStr;

        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
        this.setValue(dateStr);
      }
    }

    // temporary assign a different 'trigger' value, to prevent Pikaday from closing right after opening
    datePickerConfig.trigger = document.querySelector('.htAutocomplete.current');

    this.datePickerStyle.display = 'block';
    this.$datePicker.show();

    this.instance._registerTimeout(setTimeout(function () {
      datePickerConfig.trigger = that.defaultDatepickerTrigger;
    }, 50));
  };

  DateEditor.prototype.hideDatepicker = function () {
    this.datePickerStyle.display = 'none';
    this.$datePicker.hide();
  };

  Handsontable.editors.DateEditor = DateEditor;
  Handsontable.editors.registerEditor('date', DateEditor);
})(Handsontable);
