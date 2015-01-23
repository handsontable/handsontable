(function (Handsontable) {
  var DateEditor = Handsontable.editors.TextEditor.prototype.extend();

  var $;

  DateEditor.prototype.init = function () {
    if (typeof jQuery != 'undefined') {
      $ = jQuery;
    } else {
      throw new Error("You need to include jQuery to your project in order to use the jQuery UI Datepicker.");
    }

    if (!$.datepicker) {
      throw new Error("jQuery UI Datepicker dependency not found. Did you forget to include jquery-ui.custom.js or its substitute?");
    }

    Handsontable.editors.TextEditor.prototype.init.apply(this, arguments);

    this.isCellEdited = false;
    var that = this;

    this.instance.addHook('afterDestroy', function () {
      that.destroyElements();
    });

  };

  DateEditor.prototype.createElements = function () {
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    this.datePicker = document.createElement('DIV');
    Handsontable.Dom.addClass(this.datePicker, 'htDatepickerHolder');
    this.datePickerStyle = this.datePicker.style;
    this.datePickerStyle.position = 'absolute';
    this.datePickerStyle.top = 0;
    this.datePickerStyle.left = 0;
    this.datePickerStyle.zIndex = 99;
    document.body.appendChild(this.datePicker);
    this.$datePicker = $(this.datePicker);

    var that = this;
    var defaultOptions = {
      dateFormat: "yy-mm-dd",
      showButtonPanel: true,
      changeMonth: true,
      changeYear: true,
      onSelect: function (dateStr) {
        that.setValue(dateStr);
        that.finishEditing(false);
      }
    };
    this.$datePicker.datepicker(defaultOptions);

    var eventManager = Handsontable.eventManager(this);

    /**
     * Prevent recognizing clicking on jQuery Datepicker as clicking outside of table
     */
    eventManager.addEventListener(this.datePicker, 'mousedown', function (event) {
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    });

    this.hideDatepicker();
  };

  DateEditor.prototype.destroyElements = function () {
    this.$datePicker.datepicker('destroy');
    this.$datePicker.remove();
    //var eventManager = Handsontable.eventManager(this);
    //eventManager.removeEventListener(this.datePicker, 'mousedown');
  };

  DateEditor.prototype.open = function () {
    Handsontable.editors.TextEditor.prototype.open.call(this);
    this.showDatepicker();
  };

  DateEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
    this.hideDatepicker();
    Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  DateEditor.prototype.showDatepicker = function () {
    var offset = this.TD.getBoundingClientRect(),
      DatepickerSettings,
      datepickerSettings;

    this.datePickerStyle.top = (window.pageYOffset + offset.top + Handsontable.Dom.outerHeight(this.TD)) + 'px';
    this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';

    DatepickerSettings = function () {};
    DatepickerSettings.prototype = this.cellProperties;
    datepickerSettings = new DatepickerSettings();
    datepickerSettings.defaultDate = this.originalValue || void 0;
    this.$datePicker.datepicker('option', datepickerSettings);

    if (this.originalValue) {
      this.$datePicker.datepicker('setDate', this.originalValue);
    }
    this.datePickerStyle.display = 'block';
  };

  DateEditor.prototype.hideDatepicker = function () {
    this.datePickerStyle.display = 'none';
  };


  Handsontable.editors.DateEditor = DateEditor;
  Handsontable.editors.registerEditor('date', DateEditor);
})(Handsontable);
